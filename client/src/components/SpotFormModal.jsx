import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  X, MapPin, Sparkles, Building, Upload, Trash2, Compass, 
  MapPinCheck, Info, Loader2, AlertCircle, Hash 
} from 'lucide-react';

const SpotFormModal = ({ spot, onClose, onSave }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [totalSlots, setTotalSlots] = useState(1);
  const [spotType, setSpotType] = useState('open'); // 'open', 'covered', 'basement'
  const [vehicleType, setVehicleType] = useState('both'); // 'bike', 'car', 'both'
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  
  // Geolocation states
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [detecting, setDetecting] = useState(false);

  // Days list selection
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  // Photo uploads states
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // Transaction states
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load spot details if editing mode is active
  useEffect(() => {
    if (spot) {
      setTitle(spot.title || '');
      setDescription(spot.description || '');
      setAddress(spot.address || '');
      setCity(spot.city || '');
      setPincode(spot.pincode || '');
      setPricePerHour(spot.pricePerHour || '');
      setTotalSlots(spot.totalSlots || 1);
      setSpotType(spot.spotType || 'open');
      setVehicleType(spot.vehicleType || 'both');
      setStartTime(spot.availability?.startTime || '08:00');
      setEndTime(spot.availability?.endTime || '20:00');
      setSelectedDays(spot.availability?.days || []);
      setExistingPhotos(spot.photos || []);

      const coords = spot.location?.coordinates;
      if (coords && coords.length >= 2) {
        setLongitude(coords[0]);
        setLatitude(coords[1]);
      }
    }
  }, [spot]);

  // Initialize the Leaflet Map click-to-pin coordinate selector
  useEffect(() => {
    if (!window.L || mapInstanceRef.current) return;

    // Center on spot coordinates if editing, else default to India center
    const hasCoords = spot?.location?.coordinates && spot.location.coordinates.length >= 2;
    const initialCenter = hasCoords 
      ? [spot.location.coordinates[1], spot.location.coordinates[0]]
      : [19.0760, 72.8777];
    const initialZoom = hasCoords ? 15 : 12;

    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(initialCenter, initialZoom);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    window.L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // If pre-filled coords, place initial marker
    if (hasCoords) {
      const pinMarker = window.L.marker(initialCenter, {
        draggable: true
      }).addTo(map);

      // Listen to drag coordinates
      pinMarker.on('dragend', () => {
        const { lat, lng } = pinMarker.getLatLng();
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
      });

      markerRef.current = pinMarker;
    }

    // Map Click listener to drop new pin and extract long/lat
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updateMarker = (lat, lng) => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const newMarker = L.marker([lat, lng], {
        draggable: true
      }).addTo(map);

      newMarker.on('dragend', () => {
        const coords = newMarker.getLatLng();
        setLatitude(coords.lat.toFixed(6));
        setLongitude(coords.lng.toFixed(6));
      });

      markerRef.current = newMarker;
    }
    map.panTo([lat, lng]);
  };

  // Browser Geolocation lookups
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser');
      return;
    }

    setDetecting(true);
    setFormError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        updateMarker(lat, lng);
        setDetecting(false);
      },
      (err) => {
        setFormError('Failed to capture coordinates. Click the map to drop a pin.');
        setDetecting(false);
      }
    );
  };

  // Toggle day checkbox selection
  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Handle Photo selection
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Limits total photos size limit to 5
    if (existingPhotos.length + selectedPhotos.length + files.length > 5) {
      alert('You can upload a maximum of 5 images per parking spot');
      return;
    }

    setSelectedPhotos([...selectedPhotos, ...files]);
    
    // Create local object URL preview links
    const previews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...previews]);
  };

  const handleRemoveNewPhoto = (idx) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== idx));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== idx));
  };

  const handleRemoveExistingPhoto = (idx) => {
    setExistingPhotos(existingPhotos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !description || !address || !city || !pincode || !pricePerHour || !totalSlots) {
      setFormError('Please fill in all listing details');
      return;
    }

    if (parseInt(totalSlots, 10) < 1 || !Number.isInteger(Number(totalSlots))) {
      setFormError('Total Available Slots must be an integer of at least 1');
      return;
    }

    if (!latitude || !longitude) {
      setFormError('Please select coordinates by clicking on the interactive map');
      return;
    }

    if (selectedDays.length === 0) {
      setFormError('Please choose at least one active availability day');
      return;
    }

    if (existingPhotos.length + selectedPhotos.length === 0) {
      setFormError('Please upload at least one photo of the parking space');
      return;
    }

    try {
      setLoading(true);

      // Construct multipart form payload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('address', address);
      formData.append('city', city);
      formData.append('pincode', pincode);
      formData.append('pricePerHour', pricePerHour);
      formData.append('totalSlots', totalSlots);
      formData.append('spotType', spotType);
      formData.append('vehicleType', vehicleType);
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      
      // Append availability days as JSON array or comma list
      formData.append('days', JSON.stringify(selectedDays));

      // Append existing photos array to maintain them on update
      formData.append('photosList', JSON.stringify(existingPhotos));

      // Append new photo files
      selectedPhotos.forEach((file) => {
        formData.append('photos', file);
      });

      let res;
      if (spot) {
        // Edit update spot listing
        res = await api.put(`/spots/${spot._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create new spot listing
        res = await api.post('/spots', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data && res.data.success) {
        if (onSave) {
          onSave(res.data.data);
        }
        onClose();
      } else {
        setFormError(res.data?.message || 'Submit operation failed');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Listing submit encountered backend errors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl relative animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="border-b border-slate-800 p-5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#EAB308]/15 text-[#ca8a04] flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                {spot ? 'Edit Parking Listing' : 'List New Parking Spot'}
              </h2>
              <p className="text-[11px] text-slate-400">Provide spot location coordinates, rate schemas, and photos.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Error notifications */}
          {formError && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Form details section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spot Title / Name</label>
              <input
                type="text"
                required
                placeholder="Secure Covered Space near Phoenix Mall"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description & Access Instructions</label>
              <textarea
                required
                rows="3"
                placeholder="Detail parking dimensions, gate entries, lockboxes, or keys instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-xl border border-slate-855 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Street Address</label>
              <input
                type="text"
                required
                placeholder="24, MG Road, Landmark Mall"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* City & Pincode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</label>
                <input
                  type="text"
                  required
                  placeholder="Pune"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pincode</label>
                <input
                  type="text"
                  required
                  placeholder="411001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Rate & Slots capacity configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹ per hour)</label>
                <input
                  type="number"
                  min="10"
                  required
                  placeholder="50"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Total Available Slots
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="1"
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value ? parseInt(e.target.value, 10) : '')}
                  className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spot Type</label>
                <select
                  value={spotType}
                  onChange={(e) => setSpotType(e.target.value)}
                  className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                >
                  <option value="open">Open Area</option>
                  <option value="covered">Covered/Shade</option>
                  <option value="basement">Basement</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Guard</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2.5 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                >
                  <option value="car">Car Only</option>
                  <option value="bike">Bike Only</option>
                  <option value="both">Both Car/Bike</option>
                </select>
              </div>
            </div>

            {/* Operating Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opening Time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Closing Time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="block w-full rounded-xl border border-slate-850 bg-slate-950 py-2 px-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Available Days */}
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Days</label>
              <div className="flex gap-2 flex-wrap">
                {weekdays.map((day) => {
                  const isActive = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-[#EAB308]/15 border-[#EAB308] text-[#ca8a04] font-extrabold'
                          : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-[#262626]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Interactive coordinates pin selector map */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geospatial Coordinates</label>
                <p className="text-[10px] text-slate-500">Click anywhere on the map to pin listing coordinates.</p>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detecting}
                className="text-[10px] font-bold text-[#ca8a04] hover:text-[#a16207] transition-colors flex items-center gap-1.5 bg-[#EAB308]/15 border border-[#EAB308]/20 rounded-lg px-2.5 py-1 disabled:opacity-55 cursor-pointer"
              >
                <Compass className={`h-3 w-3 ${detecting ? 'animate-spin' : ''}`} />
                {detecting ? 'Locating...' : 'Detect Coordinates'}
              </button>
            </div>

            {/* Leaflet container */}
            <div className="relative h-48 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <style>{`
                .leaflet-container .leaflet-tile-container {
                  filter: invert(90%) hue-rotate(185deg) brightness(85%) contrast(110%);
                }
                .leaflet-container {
                  background: #020617 !important;
                }
              `}</style>
              <div ref={mapContainerRef} className="h-full w-full z-10" />
              {!mapLoaded && (
                <div className="absolute inset-0 bg-slate-950/90 z-20 flex items-center justify-center text-xs text-slate-500 animate-pulse">
                  Rendering Leaflet Layer...
                </div>
              )}
            </div>

            {/* Coordinates Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Latitude</span>
                <p className="text-xs font-mono font-bold text-slate-300">
                  {latitude || 'Not Pinmarked'}
                </p>
              </div>
              <div className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Longitude</span>
                <p className="text-xs font-mono font-bold text-slate-300">
                  {longitude || 'Not Pinmarked'}
                </p>
              </div>
            </div>
          </div>

          {/* Photo upload grids */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Photos (Maximum 5 images)</h4>
            
            {/* Existing images display */}
            {existingPhotos.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-semibold">Active Listed Photos:</p>
                <div className="flex gap-3 flex-wrap">
                  {existingPhotos.map((url, idx) => (
                    <div key={idx} className="relative h-16 w-16 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden group">
                      <img 
                        src={url.startsWith('/') ? `http://127.0.0.1:5000${url}` : url} 
                        alt="Spot Preview" 
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(idx)}
                        className="absolute inset-0 bg-red-600/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected files previews */}
            {photoPreviews.length > 0 && (
              <div className="space-y-2 animate-scaleUp">
                <p className="text-[10px] text-slate-500 font-semibold">New Pending Uploads:</p>
                <div className="flex gap-3 flex-wrap">
                  {photoPreviews.map((preview, idx) => (
                    <div key={idx} className="relative h-16 w-16 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden group">
                      <img src={preview} alt="New Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPhoto(idx)}
                        className="absolute inset-0 bg-red-600/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input file Area */}
            {existingPhotos.length + selectedPhotos.length < 5 && (
              <div className="relative border-2 border-dashed border-slate-800 rounded-xl hover:border-violet-500/35 transition-colors p-6 text-center cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <Upload className="h-6 w-6 text-slate-500 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
                <p className="text-xs font-bold text-slate-300 pointer-events-none">Click or Drag images here to upload</p>
                <p className="text-[10px] text-slate-500 mt-1 pointer-events-none">Supports JPEG, PNG formats</p>
              </div>
            )}
          </div>

        </form>

        {/* Footer actions */}
        <div className="border-t border-slate-800 p-5 bg-slate-900/50 backdrop-blur-md flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 py-2.5 px-5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-[#EAB308] py-2.5 px-6 text-xs font-bold text-[#262626] shadow-md hover:bg-[#ca8a04] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading Spot Data...
              </>
            ) : (
              <>
                {spot ? 'Save Modifications' : 'Create Listing'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SpotFormModal;
