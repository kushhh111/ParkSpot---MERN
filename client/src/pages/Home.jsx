import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import SpotMap from '../components/SpotMap';
import SpotDetailsModal from '../components/SpotDetailsModal';
import { 
  Search, MapPin, SlidersHorizontal, Star, Car, Bike, Info, 
  Map as MapIcon, List as ListIcon, Loader2, Compass, AlertCircle, RefreshCw 
} from 'lucide-react';
import { io } from 'socket.io-client';

const Home = () => {
  const { user } = useAuth();
  
  // Search & Filter states
  const [cityQuery, setCityQuery] = useState('');
  const [vehicleType, setVehicleType] = useState('both'); // 'both', 'car', 'bike'
  const [maxPrice, setMaxPrice] = useState(250);
  const [minRating, setMinRating] = useState(0);

  // Results & UI states
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedSpotDetails, setSelectedSpotDetails] = useState(null);
  
  // Mobile responsive layout view state: 'list' or 'map'
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [geolocationActive, setGeolocationActive] = useState(false);

  // Initial fetch: Load active listings in India
  useEffect(() => {
    fetchSpots();
  }, []);

  // WebSockets Live Slot Count Sync
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000');

    const handleSpotUpdate = async (data) => {
      if (!data || !data.spotId) return;
      try {
        const res = await api.get(`/spots/${data.spotId}`);
        if (res.data && res.data.success) {
          const updatedSpot = res.data.data;
          setSpots((prevSpots) =>
            prevSpots.map((s) => (s._id === data.spotId ? { ...s, activeBookingsCount: updatedSpot.activeBookingsCount } : s))
          );
        }
      } catch (err) {
        console.error('Failed to update spot socket event:', err);
      }
    };

    socket.on('spot:booked', handleSpotUpdate);
    socket.on('spot:available', handleSpotUpdate);

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchSpots = async (searchParam = '') => {
    try {
      setLoading(true);
      setError('');
      setGeolocationActive(false);

      const params = {};
      if (searchParam) params.city = searchParam;
      if (vehicleType !== 'both') params.vehicleType = vehicleType;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minRating > 0) params.minRating = minRating;

      const res = await api.get('/spots', { params });
      if (res.data && res.data.success) {
        setSpots(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search for parking spots');
    } finally {
      setLoading(false);
    }
  };

  // Nearby spot lookup via browser Geolocation APIs
  const fetchNearbySpots = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');
    setCityQuery('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setGeolocationActive(true);
          const { longitude, latitude } = position.coords;
          
          const params = {
            longitude,
            latitude,
            maxDistance: 10000 // 10km radius
          };

          const res = await api.get('/spots/nearby', { params });
          if (res.data && res.data.success) {
            setSpots(res.data.data || []);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Geospatial search failed');
          setGeolocationActive(false);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Location access permission was denied or failed. Try searching by city name.');
        setLoading(false);
        setGeolocationActive(false);
      }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSpots(cityQuery);
  };

  const handleResetFilters = () => {
    setCityQuery('');
    setVehicleType('both');
    setMaxPrice(250);
    setMinRating(0);
    setGeolocationActive(false);
    fetchSpots();
  };

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] text-slate-100 flex flex-col relative">
      
      {/* Search Header panel */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-16 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Main search inputs */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex-1 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MapPin className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search by city (e.g. Mumbai, Pune)..."
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                Search
              </button>

              <button
                type="button"
                onClick={fetchNearbySpots}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  geolocationActive
                    ? 'border-violet-500 bg-violet-600/10 text-violet-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Compass className={`h-4 w-4 ${geolocationActive ? 'animate-spin' : ''}`} />
                Nearby Me
              </button>
            </div>
          </form>

          {/* Controls buttons */}
          <div className="flex gap-3 w-full md:w-auto justify-end border-t border-slate-800/80 md:border-none pt-3 md:pt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showFilters
                  ? 'border-violet-500 bg-violet-600/15 text-violet-400'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            <button
              onClick={handleResetFilters}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title="Reset Search & Filters"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* Collapsible Filter Toolbar */}
        {showFilters && (
          <div className="max-w-7xl mx-auto border-t border-slate-800 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-scaleUp">
            
            {/* Vehicle Type selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Type</label>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950 p-1 border border-slate-850">
                {['both', 'car', 'bike'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setVehicleType(type);
                      // Trigger update
                      setTimeout(() => fetchSpots(cityQuery), 50);
                    }}
                    className={`rounded-lg py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      vehicleType === type
                        ? 'bg-[#EAB308]/15 border border-[#EAB308]/40 text-[#ca8a04] shadow-sm'
                        : 'text-slate-500 hover:text-[#262626]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Hourly rate price slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Hourly Rate</label>
                <span className="text-xs font-bold text-[#ca8a04]">₹{maxPrice}/hr</span>
              </div>
              <input
                type="range"
                min="30"
                max="500"
                step="10"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(parseInt(e.target.value, 10));
                }}
                onMouseUp={() => fetchSpots(cityQuery)}
                onTouchEnd={() => fetchSpots(cityQuery)}
                className="w-full accent-violet-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer border border-slate-800"
              />
            </div>

            {/* Minimum Star Ratings */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Minimum Rating</label>
              <div className="flex items-center gap-1">
                {[0, 3, 4, 4.5].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => {
                      setMinRating(stars);
                      setTimeout(() => fetchSpots(cityQuery), 50);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      minRating === stars
                        ? 'border-violet-500 bg-violet-600/10 text-violet-400'
                        : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {stars === 0 ? 'Any' : `${stars} ★+`}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Main Results Dashboard pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 h-[calc(100vh-9.5rem)] overflow-hidden">
        
        {/* Left pane: Spots list */}
        <div className={`lg:col-span-2 flex flex-col justify-between overflow-y-auto border-r border-slate-800/80 bg-slate-950/40 p-4 ${
          viewMode === 'map' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="space-y-4">
            
            {/* Header info */}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-400">
                {loading ? 'Searching spots...' : `${spots.length} spaces matching criteria`}
              </span>
              {geolocationActive && (
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Geolocation radius active
                </span>
              )}
            </div>

            {/* Error alerts */}
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Skeleton Loader */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-slate-900/60 border border-slate-850 rounded-2xl p-4 h-36 flex flex-col justify-between">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 rounded-xl bg-slate-950 shrink-0" />
                      <div className="space-y-2 flex-1 pt-1">
                        <div className="h-3 w-1/3 bg-slate-950 rounded" />
                        <div className="h-4 w-2/3 bg-slate-950 rounded" />
                        <div className="h-3 w-1/2 bg-slate-950 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : spots.length > 0 ? (
              
              /* Spots Listing Grid */
              <div className="space-y-3">
                {spots.map((spot) => {
                  const isSelected = selectedSpot && selectedSpot._id === spot._id;
                  return (
                    <div
                      key={spot._id}
                      onClick={() => setSelectedSpot(spot)}
                      onDoubleClick={() => setSelectedSpotDetails(spot)}
                      className={`rounded-2xl border bg-slate-900/40 p-4 flex gap-4 transition-all duration-200 cursor-pointer group hover:bg-slate-900/70 hover:scale-[1.01] ${
                        isSelected 
                          ? 'border-violet-500 bg-slate-900/80 shadow-md shadow-violet-500/5' 
                          : 'border-slate-800/80'
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div className="h-20 w-20 rounded-xl bg-slate-950 overflow-hidden border border-slate-800/80 shrink-0 flex items-center justify-center">
                        {spot.photos && spot.photos.length > 0 ? (
                          <img
                            src={spot.photos[0].startsWith('/') ? `http://127.0.0.1:5000${spot.photos[0]}` : spot.photos[0]}
                            alt={spot.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Car className="h-6 w-6 text-slate-700" />
                        )}
                      </div>

                      {/* Details Column */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-bold text-[#ca8a04] uppercase tracking-wider bg-[#EAB308]/15 rounded px-1.5 py-0.5 border border-[#EAB308]/30 truncate max-w-[80px]">
                              {spot.spotType}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-200 shrink-0">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              <span>{spot.rating > 0 ? spot.rating.toFixed(1) : 'New'}</span>
                            </div>
                          </div>
                          
                          <h3 className="text-sm font-extrabold text-slate-100 truncate group-hover:text-[#ca8a04] mt-1">
                            {spot.title}
                          </h3>
                          
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                            {spot.address}, {spot.city}
                          </p>
                        </div>

                        <div className="flex items-end justify-between border-t border-slate-800/50 pt-2 mt-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-300">
                              ₹{spot.pricePerHour}<span className="text-slate-500 text-[10px] font-medium">/hr</span>
                            </span>
                            {/* Live capacity indicator */}
                            {(() => {
                              const total = spot.totalSlots || 1;
                              const filled = spot.activeBookingsCount || 0;
                              const remaining = Math.max(0, total - filled);
                              
                              if (remaining <= 3 && remaining > 0) {
                                  return (
                                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1 animate-pulse shrink-0 inline-block w-fit">
                                      🔥 Only {remaining} left
                                    </span>
                                  );
                              } else if (remaining === 0) {
                                  return (
                                    <span className="text-[9px] font-black text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 mt-1 shrink-0 inline-block w-fit">
                                      Sold Out
                                    </span>
                                  );
                              } else {
                                  return (
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1 shrink-0 inline-block w-fit">
                                      {remaining}/{total} slots left
                                    </span>
                                  );
                              }
                            })()}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSpotDetails(spot);
                            }}
                            className="rounded-lg bg-[#EAB308]/15 border border-[#EAB308]/30 px-2.5 py-1 text-[10px] font-bold text-[#ca8a04] hover:bg-[#EAB308] hover:text-[#262626] transition-colors cursor-pointer"
                          >
                            Book Spot
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              
              /* Empty state placeholder */
              <div className="text-center py-16 px-6 border border-dashed border-slate-850 rounded-2xl">
                <Compass className="h-10 w-10 text-slate-700 mx-auto mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">No Parking Spaces Found</h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
                  Try adjusting filters, clearing text, or clicking "Nearby Me" to look up spots in your current location radius.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 rounded-xl border border-slate-800 px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
                >
                  Clear all criteria
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-900/80 pt-4 mt-6 text-center text-[10px] text-slate-600 font-medium">
            Double-click space card or click "Book Spot" to schedule parking.
          </div>
        </div>

        {/* Right pane: Leaflet Map */}
        <div className={`lg:col-span-3 h-full p-4 ${
          viewMode === 'list' ? 'hidden lg:block' : 'block'
        }`}>
          <SpotMap
            spots={spots}
            selectedSpot={selectedSpot}
            onSpotClick={(spot) => {
              setSelectedSpot(spot);
              setSelectedSpotDetails(spot);
            }}
          />
        </div>

      </div>

      {/* Floating Toggle View Modes CTA (Mobile ONLY) */}
      <button
        onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 lg:hidden rounded-full bg-slate-900 border border-slate-800 text-slate-200 shadow-2xl px-6 py-3 text-xs font-bold flex items-center gap-2 hover:scale-105 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
      >
        {viewMode === 'list' ? (
          <>
            <MapIcon className="h-4 w-4 text-violet-500" />
            Show Map View
          </>
        ) : (
          <>
            <ListIcon className="h-4 w-4 text-violet-500" />
            Show List View
          </>
        )}
      </button>

      {/* Slide-over Spot Detail Panel */}
      {selectedSpotDetails && (
        <SpotDetailsModal
          spot={selectedSpotDetails}
          onClose={() => setSelectedSpotDetails(null)}
          onBookingSuccess={(booking) => {
            setSelectedSpotDetails(null);
            // Redirection notification
            alert('Your payment was successful and spot booking is confirmed! Redirecting to dashboard.');
            window.location.href = '/dashboard/driver';
          }}
        />
      )}
    </div>
  );
};

export default Home;
