'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  Layers,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

interface MapLocationPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onChange: (coords: { latitude: number; longitude: number; address?: string }) => void;
  onRadiusChange?: (radiusMeters: number) => void;
  interactive?: boolean;
  height?: string;
  showRadius?: boolean;
}

declare global {
  interface Window {
    google?: any;
    __googleMapsLoadingPromise?: Promise<void>;
  }
}

export function MapLocationPicker({
  latitude,
  longitude,
  radiusMeters,
  onChange,
  onRadiusChange,
  interactive = true,
  height = '360px',
  showRadius = true,
}: MapLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // References to Google Map instances
  const googleMapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const circleInstance = useRef<any>(null);
  const autocompleteInstance = useRef<any>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyBzIu9g59dQo-ICpmusnRorJ8tJ3OYFlRA';

  // Load Google Maps Script
  const loadGoogleMaps = useCallback((): Promise<void> => {
    if (typeof window === 'undefined') return Promise.resolve();

    if (window.google && window.google.maps) {
      return Promise.resolve();
    }

    if (window.__googleMapsLoadingPromise) {
      return window.__googleMapsLoadingPromise;
    }

    window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () =>
          reject(new Error('Failed to load Google Maps SDK'))
        );
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps SDK'));
      document.head.appendChild(script);
    });

    return window.__googleMapsLoadingPromise;
  }, [apiKey]);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then(() => {
        if (!isMounted || !mapRef.current || !window.google?.maps) return;

        const centerLat = latitude && !isNaN(latitude) && latitude !== 0 ? latitude : 19.076;
        const centerLng = longitude && !isNaN(longitude) && longitude !== 0 ? longitude : 72.8777;
        const center = new window.google.maps.LatLng(centerLat, centerLng);

        // 1. Create Map
        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 16,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: interactive ? 'auto' : 'none',
        });
        googleMapInstance.current = map;

        // 2. Create Marker
        const marker = new window.google.maps.Marker({
          position: center,
          map,
          draggable: interactive,
          animation: window.google.maps.Animation.DROP,
          title: 'Office Location',
        });
        markerInstance.current = marker;

        // 3. Create Geofence Circle
        if (showRadius) {
          const circle = new window.google.maps.Circle({
            map,
            radius: radiusMeters > 0 ? radiusMeters : 200,
            fillColor: '#23C45E',
            fillOpacity: 0.22,
            strokeColor: '#16A34A',
            strokeOpacity: 0.85,
            strokeWeight: 2,
            center,
          });
          circleInstance.current = circle;
        }

        // 4. Marker drag event
        if (interactive) {
          marker.addListener('dragend', (e: any) => {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            if (circleInstance.current) {
              circleInstance.current.setCenter(e.latLng);
            }
            onChange({ latitude: Number(newLat.toFixed(6)), longitude: Number(newLng.toFixed(6)) });
          });

          // Map click event to move marker
          map.addListener('click', (e: any) => {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            marker.setPosition(e.latLng);
            if (circleInstance.current) {
              circleInstance.current.setCenter(e.latLng);
            }
            onChange({ latitude: Number(newLat.toFixed(6)), longitude: Number(newLng.toFixed(6)) });
          });

          // 5. Places Autocomplete on search input
          if (searchInputRef.current && window.google.maps.places) {
            const autocomplete = new window.google.maps.places.Autocomplete(
              searchInputRef.current,
              { types: ['geocode', 'establishment'] }
            );
            autocomplete.bindTo('bounds', map);
            autocompleteInstance.current = autocomplete;

            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (!place.geometry || !place.geometry.location) return;

              const loc = place.geometry.location;
              map.setCenter(loc);
              map.setZoom(17);
              marker.setPosition(loc);
              if (circleInstance.current) {
                circleInstance.current.setCenter(loc);
              }

              onChange({
                latitude: Number(loc.lat().toFixed(6)),
                longitude: Number(loc.lng().toFixed(6)),
                address: place.formatted_address || place.name,
              });
            });
          }
        }

        setIsMapLoaded(true);
        setLoadError(null);
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[MAP_LOCATION_PICKER] Error loading Google Maps:', err);
          setLoadError('Unable to load Google Maps SDK. You can still enter coordinates manually.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loadGoogleMaps, interactive, showRadius]);

  // Synchronize map when latitude or longitude prop changes
  useEffect(() => {
    if (!isMapLoaded || !googleMapInstance.current || !markerInstance.current) return;
    if (isNaN(latitude) || isNaN(longitude) || (latitude === 0 && longitude === 0)) return;

    const currentPos = markerInstance.current.getPosition();
    if (
      currentPos &&
      Math.abs(currentPos.lat() - latitude) < 0.00001 &&
      Math.abs(currentPos.lng() - longitude) < 0.00001
    ) {
      return; // Already synchronized
    }

    const newCenter = new window.google.maps.LatLng(latitude, longitude);
    markerInstance.current.setPosition(newCenter);
    googleMapInstance.current.panTo(newCenter);

    if (circleInstance.current) {
      circleInstance.current.setCenter(newCenter);
    }
  }, [latitude, longitude, isMapLoaded]);

  // Synchronize geofence circle radius
  useEffect(() => {
    if (!isMapLoaded || !circleInstance.current || radiusMeters <= 0) return;
    circleInstance.current.setRadius(radiusMeters);
  }, [radiusMeters, isMapLoaded]);

  // Center to Current Device Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsSearching(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        if (googleMapInstance.current && markerInstance.current) {
          const loc = new window.google.maps.LatLng(lat, lng);
          googleMapInstance.current.setCenter(loc);
          googleMapInstance.current.setZoom(17);
          markerInstance.current.setPosition(loc);
          if (circleInstance.current) {
            circleInstance.current.setCenter(loc);
          }
        }
        onChange({ latitude: lat, longitude: lng });
      },
      (err) => {
        setIsSearching(false);
        alert(`Failed to retrieve current location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Top Search & Controls Bar */}
      {interactive && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search office address or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isSearching}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
            <span>Use My GPS</span>
          </button>
        </div>
      )}

      {/* Map Display Container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100"
        style={{ height }}
      >
        <div ref={mapRef} className="w-full h-full" />

        {/* Loading / Error Overlay */}
        {!isMapLoaded && !loadError && (
          <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-8 h-8 border-3 border-[#23C45E] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading Google Maps & Geofence...</p>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">{loadError}</p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Please check your Google Maps API key or enter the numeric latitude and longitude coordinates in the inputs below.
            </p>
          </div>
        )}

        {/* Live Coordinate Overlay Chip */}
        {isMapLoaded && (
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-3 text-[11px] font-mono text-slate-800 z-10">
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-400">Lat:</span>
              <span className="font-bold text-slate-900">{latitude?.toFixed(4) ?? '--'}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-400">Lng:</span>
              <span className="font-bold text-slate-900">{longitude?.toFixed(4) ?? '--'}</span>
            </div>
            {showRadius && (
              <>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1 font-sans">
                  <span className="font-bold text-emerald-600">Radius:</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                    {radiusMeters}m
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Helper Legend / Info */}
      {interactive && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#23C45E]" />
            Drag marker or click anywhere on the map to position the office.
          </span>
          <span className="text-slate-400">Green circle = Attendance Geofence</span>
        </div>
      )}
    </div>
  );
}
