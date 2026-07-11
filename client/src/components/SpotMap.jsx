import React, { useEffect, useRef, useState } from 'react';
import { SquareParking } from 'lucide-react';

const SpotMap = ({ spots, selectedSpot, onSpotClick }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize the map once when Leaflet global object (window.L) is available
  useEffect(() => {
    if (!window.L || mapInstanceRef.current) return;

    // Default center: India (approx Mumbai)
    const defaultCenter = [19.0760, 72.8777];
    const defaultZoom = 12;

    // Create Leaflet map instance
    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false, // Custom position Zoom controls
      attributionControl: false
    }).setView(defaultCenter, defaultZoom);

    // Add Dark-theme styled Tile Layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add attribution at bottom right
    window.L.control.attribution({ prefix: false }).addTo(map);

    // Zoom controls at bottom left
    window.L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Create Group for markers
    const markersGroup = window.L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersGroupRef.current = markersGroup;
    setMapLoaded(true);

    // Clean up map instance on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when spots array changes
  useEffect(() => {
    if (!mapLoaded || !window.L || !markersGroupRef.current || !mapInstanceRef.current) return;

    const L = window.L;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    // Clear previous markers
    markersGroup.clearLayers();

    if (!spots || spots.length === 0) return;

    const bounds = [];

    spots.forEach((spot) => {
      const coords = spot.location?.coordinates;
      if (!coords || coords.length < 2) return;

      // coordinates in DB are [longitude, latitude]
      const lng = coords[0];
      const lat = coords[1];

      // Custom HTML DivIcon for parking marker with animated glow
      const isSelected = selectedSpot && selectedSpot._id === spot._id;
      const markerHtml = `
        <div class="relative flex h-10 w-10 items-center justify-center group cursor-pointer">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${
            isSelected ? 'bg-violet-400/60' : 'bg-indigo-400/40'
          } opacity-75"></span>
          <div class="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr ${
            isSelected ? 'from-violet-500 to-fuchsia-500 scale-110 shadow-lg ring-2 ring-violet-400' : 'from-indigo-600 to-violet-600 shadow-md'
          } text-[10px] font-extrabold text-white transition-all duration-300">
            ₹${spot.pricePerHour}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-parking-marker',
        html: markerHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Click callback
      marker.on('click', () => {
        if (onSpotClick) {
          onSpotClick(spot);
        }
      });

      const total = spot.totalSlots || 1;
      const filled = spot.activeBookingsCount || 0;
      const remaining = Math.max(0, total - filled);
      const capacityHtml = remaining <= 3 && remaining > 0
        ? `<span style="color: #f59e0b; font-weight: bold;">🔥 Only ${remaining} left</span>`
        : remaining === 0
        ? `<span style="color: #ef4444; font-weight: bold;">Sold Out</span>`
        : `<span style="color: #10b981; font-weight: bold;">${remaining}/${total} Slots Available</span>`;

      // Bind tooltip preview
      marker.bindTooltip(
        `<div class="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-2 font-sans text-xs">
          <p class="font-extrabold text-white">${spot.title}</p>
          <p class="text-slate-450 mt-0.5" style="color: #94a3b8;">₹${spot.pricePerHour}/hr • ${spot.vehicleType === 'both' ? 'Car/Bike' : spot.vehicleType}</p>
          <p class="mt-1" style="font-size: 10px;">${capacityHtml}</p>
         </div>`,
        {
          direction: 'top',
          offset: [0, -10],
          className: 'leaflet-custom-tooltip'
        }
      );

      markersGroup.addLayer(marker);
      bounds.push([lat, lng]);
    });

    // Auto-fit map viewport boundaries if multiple spots are present
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [spots, mapLoaded, selectedSpot]);

  // Pan to selected spot
  useEffect(() => {
    if (!mapLoaded || !selectedSpot || !mapInstanceRef.current) return;
    const coords = selectedSpot.location?.coordinates;
    if (coords && coords.length >= 2) {
      const lng = coords[0];
      const lat = coords[1];
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
    }
  }, [selectedSpot, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[300px] md:min-h-0 bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Sleek Dark Mode Style Filter */}
      <style>{`
        /* Custom styled Leaflet dark mode filter */
        .leaflet-container .leaflet-tile-container {
          filter: invert(90%) hue-rotate(185deg) brightness(85%) contrast(110%);
        }
        .leaflet-container {
          background: #020617 !important;
        }
        .leaflet-custom-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-tooltip-top::before {
          border-top-color: rgb(30, 41, 59) !important;
        }
        .custom-parking-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <div className="relative h-10 w-10 bg-violet-600 rounded-full flex items-center justify-center">
              <SquareParking className="h-5 w-5 text-white" />
            </div>
          </div>
          <span className="text-xs text-slate-400 font-semibold tracking-wider animate-pulse">
            Configuring Map Layers...
          </span>
        </div>
      )}
    </div>
  );
};

export default SpotMap;
