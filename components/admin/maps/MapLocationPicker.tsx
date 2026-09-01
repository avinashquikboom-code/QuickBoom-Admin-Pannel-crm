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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Load Google Maps Script with modern async loading
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places,geometry,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps SDK'));
      document.head.appendChild(script);
    });

    return window.__googleMapsLoadingPromise;
  }, [apiKey]);

  // Initialize Map with AdvancedMarkerElement & Places Library
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then(async () => {
        if (!isMounted || !mapRef.current || !window.google?.maps) return;

        const centerLat = latitude && !isNaN(latitude) && latitude !== 0 ? latitude : 19.076;
        const centerLng = longitude && !isNaN(longitude) && longitude !== 0 ? longitude : 72.8777;
        const center = { lat: centerLat, lng: centerLng };

        // 1. Create Map with MapId (required for AdvancedMarkerElement)
        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 16,
          mapId: 'DEMO_MAP_ID',
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: interactive ? 'auto' : 'none',
        });
        googleMapInstance.current = map;

        // 2. Create Marker (Migrated to AdvancedMarkerElement with legacy fallback)
        let marker: any = null;
        try {
          if (window.google.maps.importLibrary) {
            const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker');
            marker = new AdvancedMarkerElement({
              position: center,
              map,
              title: 'Office Location',
              gmpDraggable: interactive,
            });
          } else if (window.google.maps.marker?.AdvancedMarkerElement) {
            marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: center,
              map,
              title: 'Office Location',
              gmpDraggable: interactive,
            });
          } else {
            marker = new window.google.maps.Marker({
              position: center,
              map,
              draggable: interactive,
              title: 'Office Location',
            });
          }
        } catch {
          marker = new window.google.maps.Marker({
            position: center,
            map,
            draggable: interactive,
            title: 'Office Location',
          });
        }
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

        // 4. Marker drag event & map click
        if (interactive && marker) {
          const handleNewPosition = (lat: number, lng: number) => {
            const pos = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
            if (marker.position !== undefined) {
              marker.position = pos;
            } else if (typeof marker.setPosition === 'function') {
              marker.setPosition(pos);
            }
            if (circleInstance.current) {
              circleInstance.current.setCenter(pos);
            }
            onChange({ latitude: pos.lat, longitude: pos.lng });
          };

          if (marker.addListener) {
            marker.addListener('dragend', (e: any) => {
              let lat: number;
              let lng: number;
              if (marker.position) {
                lat = typeof marker.position.lat === 'function' ? marker.position.lat() : marker.position.lat;
                lng = typeof marker.position.lng === 'function' ? marker.position.lng() : marker.position.lng;
              } else if (e?.latLng) {
                lat = e.latLng.lat();
                lng = e.latLng.lng();
              } else {
                return;
              }
              handleNewPosition(lat, lng);
            });
          }

          map.addListener('click', (e: any) => {
            if (e?.latLng) {
              handleNewPosition(e.latLng.lat(), e.latLng.lng());
            }
          });

          // 5. Places Autocomplete with modern library import
          try {
            if (window.google.maps.importLibrary) {
              await window.google.maps.importLibrary('places');
            }
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
                const newLat = Number(loc.lat().toFixed(6));
                const newLng = Number(loc.lng().toFixed(6));
                const newPos = { lat: newLat, lng: newLng };

                map.setCenter(newPos);
                map.setZoom(17);

                if (marker.position !== undefined) {
                  marker.position = newPos;
                } else if (typeof marker.setPosition === 'function') {
                  marker.setPosition(newPos);
                }

                if (circleInstance.current) {
                  circleInstance.current.setCenter(newPos);
                }

                onChange({
                  latitude: newLat,
                  longitude: newLng,
                  address: place.formatted_address || place.name,
                });
              });
            }
          } catch (placesErr) {
            console.warn('[MAP_LOCATION_PICKER] Places autocomplete init:', placesErr);
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

    const marker = markerInstance.current;
    let curLat = 0;
    let curLng = 0;

    if (marker.position) {
      curLat = typeof marker.position.lat === 'function' ? marker.position.lat() : marker.position.lat;
      curLng = typeof marker.position.lng === 'function' ? marker.position.lng() : marker.position.lng;
    } else if (typeof marker.getPosition === 'function') {
      const pos = marker.getPosition();
      if (pos) {
        curLat = pos.lat();
        curLng = pos.lng();
      }
    }

    if (Math.abs(curLat - latitude) < 0.00001 && Math.abs(curLng - longitude) < 0.00001) {
      return; // Already synchronized
    }

    const newCenter = { lat: latitude, lng: longitude };
    if (marker.position !== undefined) {
      marker.position = newCenter;
    } else if (typeof marker.setPosition === 'function') {
      marker.setPosition(newCenter);
    }

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
        const loc = { lat, lng };

        if (googleMapInstance.current && markerInstance.current) {
          googleMapInstance.current.setCenter(loc);
          googleMapInstance.current.setZoom(17);

          const marker = markerInstance.current;
          if (marker.position !== undefined) {
            marker.position = loc;
          } else if (typeof marker.setPosition === 'function') {
            marker.setPosition(loc);
          }

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
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search office address or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-medium"
            />
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isSearching}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
            <span>{isSearching ? 'Locating...' : 'My Location'}</span>
          </button>
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100"
        style={{ height }}
      >
        <div ref={mapRef} className="w-full h-full" />

        {loadError && (
          <div className="absolute inset-0 bg-slate-50/95 flex flex-col items-center justify-center p-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-600" />
            <p className="text-xs font-bold text-slate-800">{loadError}</p>
            <p className="text-[11px] text-slate-500">
              You can manually specify latitude & longitude below.
            </p>
          </div>
        )}
      </div>

      {/* Coordinate & Radius Status Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-mono text-slate-700 font-bold">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>

        {showRadius && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Geofence Radius:</span>
            {onRadiusChange ? (
              <input
                type="number"
                min="50"
                max="5000"
                step="50"
                value={radiusMeters || 200}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            ) : (
              <span className="font-extrabold text-emerald-700">{radiusMeters || 200}m</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
