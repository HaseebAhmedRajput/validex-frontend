/**
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  useMap, 
  useMapsLibrary 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Loader2, 
  X, 
  Compass, 
  Settings 
} from 'lucide-react';

// Expose Google Maps Platform key following AI Studio credentials flow
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface InteractiveMapProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

interface PlaceSearchResult {
  id: string;
  displayName: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

/**
 * Circle overlay component utilizing useMap hook for Google Maps Platform.
 */
function GeofenceCircle({ center, radius }: { center: google.maps.LatLngLiteral; radius: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      strokeColor: '#4f46e5',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#818cf8',
      fillOpacity: 0.18,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, center.lat, center.lng, radius]);

  return null;
}

/**
 * Controller to smoothly pan the map to coordinates when they update.
 */
function MapCenteringController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setCenter({ lat, lng });
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);

  return null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  lat,
  lng,
  radius,
  onChange,
}) => {
  // If the user has not set an API key, we display the required splash screen instructions
  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
          <Settings className="h-6 w-6 text-indigo-600 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">
          Google Maps API Key Required
        </h3>
        <p className="text-[12px] text-slate-500 max-w-md my-2.5 leading-relaxed font-semibold">
          To enable live street mapping, dynamic place lookup, and geofencing visuals, please add your Google Maps API key in standard workspace secrets.
        </p>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs max-w-md text-left text-[11px] leading-relaxed space-y-2 mt-2 text-slate-600 font-medium">
          <p>
            <strong>Step 1:</strong> Obtain a Google Maps key from the 
            <a 
              href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 font-bold ml-1 hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
          <div className="h-px bg-slate-50 my-1.5" />
          <p>
            <strong>Step 2:</strong> Open the <strong>Settings</strong> panel (cog icon, top-right panel).
          </p>
          <p>
            <strong>Step 3:</strong> Select <strong>Secrets</strong> and add:
            <code className="block bg-slate-50 mt-1 p-2 rounded text-[10px] text-indigo-700 font-mono font-bold select-all border border-slate-100">
              GOOGLE_MAPS_PLATFORM_KEY
            </code>
          </p>
          <p className="text-[10px] text-slate-400 italic">
            * The page compiles automatically. No manual reload is needed to sync credentials.
          </p>
        </div>
      </div>
    );
  }

  // Active Map and Geocoder variables
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Center on device gps coords
  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6))
        );
      },
      (error) => {
        console.warn("Geolocation permission error:", error);
      }
    );
  };

  // Helper fetcher for client fallback using OpenStreetMap Nominatim if Google APIs fail to resolve
  const fetchNominatimFallback = async (term: string) => {
    try {
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=6&addressdetails=1`;
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const formatted: PlaceSearchResult[] = data.map((item: any) => ({
            id: String(item.place_id),
            displayName: item.display_name.split(',')[0],
            formattedAddress: item.display_name,
            lat: Number(parseFloat(item.lat)),
            lng: Number(parseFloat(item.lon)),
          }));
          setSearchResults(formatted);
          setSearchError(null);
        } else {
          setSearchError('No verified locations or departments matched. Try broadening your query term.');
        }
      } else {
        setSearchError('Verification services are currently unresponsive. Please check your network connection.');
      }
    } catch (e) {
      console.error("Nominatim fallback failed:", e);
      setSearchError('Error establishing verification connection. Verify key authorization configuration.');
    } finally {
      setIsSearching(false);
    }
  };

  // Perform Place Search using modern SDK with auto fallback to Geocoder and OS Geocoder for ultimate reliability
  const handleSearch = async () => {
    const term = searchQuery.trim();
    if (!term) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      // 1. Tier 1: Try high-precision server-side Gemini Search Grounding API (Resolves departments and institutions with Search Grounding)
      try {
        const geminiRes = await fetch('/api/gemini/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: term }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          if (geminiData.success && geminiData.data) {
            const data = geminiData.data;
            const resultsList: PlaceSearchResult[] = [];

            // Add parent matched campus
            if (data.name && data.lat && data.lng) {
              resultsList.push({
                id: 'gemini-parent-' + Math.random().toString(36).substr(2, 9),
                displayName: `🏫 ${data.name}`,
                formattedAddress: `Identified Landmark Campus (${data.region || 'Pakistan'})`,
                lat: Number(data.lat),
                lng: Number(data.lng),
              });
            }

            // Add the rich academic departments inside this campus block
            if (Array.isArray(data.departments)) {
              data.departments.forEach((dept: any, index: number) => {
                if (dept.name && dept.lat && dept.lng) {
                  resultsList.push({
                    id: `gemini-dept-${index}-${Math.random().toString(36).substr(2, 9)}`,
                    displayName: dept.name,
                    formattedAddress: `Department block inside campus boundary`,
                    lat: Number(dept.lat),
                    lng: Number(dept.lng),
                  });
                }
              });
            }

            if (resultsList.length > 0) {
              setSearchResults(resultsList);
              setIsSearching(false);
              return;
            }
          }
        }
      } catch (gemError) {
        console.warn("Server-side Gemini Search Grounding unavailable or timed out. Handing off to browser APIs...", gemError);
      }

      // 2. Tier 2: Modern Google Places New API Text search if enabled and active
      if (placesLib && placesLib.Place) {
        try {
          const response = await placesLib.Place.searchByText({
            textQuery: term,
            fields: ['id', 'displayName', 'location', 'formattedAddress'],
            maxResultCount: 6,
          });

          if (response && response.places && response.places.length > 0) {
            const formatted: PlaceSearchResult[] = response.places.map((place) => {
              const loc = place.location;
              const placeLat = loc ? (typeof loc.lat === 'function' ? loc.lat() : (loc as any).lat) : lat;
              const placeLng = loc ? (typeof loc.lng === 'function' ? loc.lng() : (loc as any).lng) : lng;

              return {
                id: place.id || Math.random().toString(),
                displayName: place.displayName || 'Location Match',
                formattedAddress: place.formattedAddress || '',
                lat: Number(placeLat),
                lng: Number(placeLng),
              };
            });
            setSearchResults(formatted);
            setIsSearching(false);
            return;
          }
        } catch (placeErr) {
          console.warn("Places API New yielded exception, redirecting lookup to standard Geocoder...", placeErr);
        }
      }

      // 3. Tier 3: Classic Google maps core Geocoder (Always active on basic Maps keys)
      const activeGeoLib = geocodingLib || (window.google ? (window.google as any).maps : null);
      const GeocoderClass = activeGeoLib?.Geocoder || (window.google?.maps?.Geocoder);

      if (GeocoderClass) {
        const geocoder = new GeocoderClass();
        geocoder.geocode({ address: term }, (results:any, status:any) => {
          if (status === 'OK' && results && results.length > 0) {
            const formatted: PlaceSearchResult[] = results.slice(0, 6).map((result:any) => {
              const loc = result.geometry.location;
              return {
                id: result.place_id || Math.random().toString(),
                displayName: result.formatted_address.split(',')[0] || 'Result',
                formattedAddress: result.formatted_address,
                lat: loc.lat(),
                lng: loc.lng(),
              };
            });
            setSearchResults(formatted);
            setIsSearching(false);
          } else {
            console.warn(`Google Geocoding code ${status}. Proceeding to global cloud fallback...`);
            fetchNominatimFallback(term);
          }
        });
        return;
      }

      // 4. Tier 4: Resilient dynamic fallback via OpenStreetMap Nominatim (Guarantees infinite server availability)
      await fetchNominatimFallback(term);

    } catch (err: any) {
      console.error("All search pipelines failed:", err);
      await fetchNominatimFallback(term);
    }
  };

  // Handle selecting location search recommendation
  const selectSearchResult = (result: PlaceSearchResult) => {
    onChange(result.lat, result.lng);
    setSearchQuery(result.displayName);
    setSearchResults([]);
  };

  return (
    <div id="interactive-map-root" className="space-y-4">
      {/* Places API & Geolocation Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4f46e5] flex items-center gap-1.5 font-display">
            📍 Google Maps Geocoder & Landmark Search
          </label>
          <button
            type="button"
            onClick={locateMe}
            className="text-[9.5px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
          >
            <Navigation className="h-3 w-3 text-indigo-600" /> Use Current Geolocation
          </button>
        </div>

        {/* Custom Input controls */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search universities, physical addresses, or landmarks (e.g. 'Mehran University Jamshoro')..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (searchError) setSearchError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="w-full pl-9 pr-24 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-3xs placeholder:text-slate-400 font-semibold"
          />
          <div className="absolute inset-y-0 right-1 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setSearchError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Places Recommendation dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 sm:left-auto sm:right-auto w-auto max-w-full sm:w-[500px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-25 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-200" style={{ zIndex: 100 }}>
            <div className="bg-slate-50/70 p-2.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center justify-between border-b border-slate-100">
              <span>Google Places Matches</span>
              <button 
                type="button" 
                onClick={() => setSearchResults([])} 
                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
              >
                Close
              </button>
            </div>
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => selectSearchResult(result)}
                className="w-full text-left p-3 hover:bg-indigo-50/40 flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <div className="h-6 w-6 rounded border border-slate-100 bg-slate-50 text-indigo-600 flex items-center justify-center flex-none">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-xs truncate">
                    {result.displayName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {result.formattedAddress}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    ({result.lat.toFixed(6)}, {result.lng.toFixed(6)})
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-[10.5px] font-bold rounded-xl flex items-center gap-1.5 antialiased">
            <span>⚠ {searchError}</span>
          </div>
        )}
      </div>

      {/* Google Maps Container Component */}
      <div className="relative group rounded-2xl overflow-hidden border border-slate-300 shadow-md">
        <APIProvider apiKey={API_KEY} version="weekly">
          <div className="w-full h-[450px]">
            <Map
              defaultCenter={{ lat, lng }}
              defaultZoom={16}
              gestureHandling="cooperative"
              mapId="70fa077964434ca78bc3" // Set standard stable MapId
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              onClick={(e) => {
                const latLng = e.detail?.latLng || (e as any).latLng;
                if (latLng) {
                  const clickLat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
                  const clickLng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
                  if (clickLat !== undefined && clickLng !== undefined) {
                    onChange(
                      Number(Number(clickLat).toFixed(6)),
                      Number(Number(clickLng).toFixed(6))
                    );
                  }
                }
              }}
            >
              {/* Draggable Selector Pin */}
              <AdvancedMarker
                position={{ lat, lng }}
                draggable={true}
                onDragEnd={(e) => {
                  const latLng = e.latLng || e.detail?.latLng;
                  if (latLng) {
                    const dragLat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
                    const dragLng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
                    onChange(
                      Number(Number(dragLat).toFixed(6)),
                      Number(Number(dragLng).toFixed(6))
                    );
                  }
                }}
              >
                <Pin background="#4f46e5" glyphColor="#ffffff" borderColor="#4338ca" />
              </AdvancedMarker>

              {/* Live accurate Geofence boundaries visualizer */}
              <GeofenceCircle center={{ lat, lng }} radius={radius} />

              {/* Dynamic Coordinate Panning controller */}
              <MapCenteringController lat={lat} lng={lng} />
            </Map>
          </div>
        </APIProvider>

        {/* Live HUD Coordinate Widget (No status Credit line, high contrast styling) */}
        <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 text-white border border-slate-800 shadow-md pointer-events-none max-w-xs space-y-1 block" style={{ zIndex: 10 }}>
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400 font-display">Locked Coordinates</p>
          </div>
          <p className="font-mono text-[10.5px]">
            LAT: <strong className="text-white">{lat.toFixed(6)}</strong> &middot; LNG: <strong className="text-white">{lng.toFixed(6)}</strong>
          </p>
          <div className="h-px bg-slate-800 my-1" />
          <p className="text-[10.5px] text-slate-300">
            Geofence Limit: <strong className="text-indigo-300 font-mono">{radius} meters</strong>
          </p>
          <p className="text-[9px] text-slate-500 font-semibold italic">
            💡 Drag pin anywhere on Google Map to update center coords.
          </p>
        </div>
      </div>
    </div>
  );
};
