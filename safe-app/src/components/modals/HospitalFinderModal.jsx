import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Phone, Clock, ExternalLink, RefreshCcw, Locate, Search, AlertTriangle, ChevronDown, ChevronUp, Star } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HospitalFinderModal.css';

// Fix default marker icons for Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const hospitalIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-marker-pulse"></div><div class="user-marker-dot"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const HospitalFinderModal = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, requesting, granted, denied
  const [searchRadius, setSearchRadius] = useState(5000); // meters
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch hospitals using Nominatim API (primary, most reliable)
  const fetchWithNominatim = async (lat, lon, radius) => {
    const radiusKm = radius / 1000;
    const delta = radiusKm / 111; // rough degree conversion
    const viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;

    const searches = ['hospital', 'clinic', 'rumah sakit', 'klinik'];
    const allResults = [];
    const seenIds = new Set();

    for (const query of searches) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&limit=50&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'SAFE-SinusCare-App/1.0' }
      });

      if (!response.ok) continue;
      const data = await response.json();

      for (const place of data) {
        if (seenIds.has(place.place_id)) continue;
        seenIds.add(place.place_id);

        const pLat = parseFloat(place.lat);
        const pLon = parseFloat(place.lon);
        const distance = calculateDistance(lat, lon, pLat, pLon);

        if (distance <= radiusKm) {
          allResults.push({
            id: place.place_id,
            name: place.display_name.split(',')[0] || 'Hospital/Clinic',
            lat: pLat,
            lon: pLon,
            distance: distance,
            type: place.type || 'hospital',
            phone: null,
            website: null,
            address: place.display_name.split(',').slice(1, 4).join(',').trim() || null,
            openingHours: null,
            emergency: false,
            operator: null
          });
        }
      }

      // Rate limit: Nominatim requires max 1 request/second
      await new Promise(r => setTimeout(r, 1100));
    }

    return allResults;
  };

  // Fetch hospitals using Overpass API (fallback, with multiple mirrors)
  const fetchWithOverpass = async (lat, lon, radius) => {
    const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:${radius},${lat},${lon});way["amenity"="hospital"](around:${radius},${lat},${lon});node["amenity"="clinic"](around:${radius},${lat},${lon});way["amenity"="clinic"](around:${radius},${lat},${lon}););out center body;`;

    const mirrors = [
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass-api.de/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
    ];

    for (const baseUrl of mirrors) {
      try {
        const response = await fetch(`${baseUrl}?data=${encodeURIComponent(query)}`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) continue;
        const data = await response.json();

        return data.elements
          .map((el) => {
            const elLat = el.lat || el.center?.lat;
            const elLon = el.lon || el.center?.lon;
            if (!elLat || !elLon) return null;

            const tags = el.tags || {};
            const distance = calculateDistance(lat, lon, elLat, elLon);

            return {
              id: el.id,
              name: tags.name || tags['name:en'] || tags['name:id'] || 'Unnamed Hospital/Clinic',
              lat: elLat,
              lon: elLon,
              distance: distance,
              type: tags.amenity || tags.healthcare || 'hospital',
              phone: tags.phone || tags['contact:phone'] || null,
              website: tags.website || tags['contact:website'] || null,
              address: [tags['addr:street'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ') || null,
              openingHours: tags.opening_hours || null,
              emergency: tags.emergency === 'yes',
              operator: tags.operator || null
            };
          })
          .filter(Boolean);
      } catch {
        continue;
      }
    }

    return [];
  };

  // Main fetch function: try Nominatim first, then Overpass
  const fetchHospitals = useCallback(async (lat, lon, radius) => {
    setLoading(true);
    setError(null);
    try {
      let results = [];

      // Strategy 1: Nominatim (most reliable)
      try {
        results = await fetchWithNominatim(lat, lon, radius);
      } catch (e) {
        console.warn('Nominatim failed, trying Overpass...', e);
      }

      // Strategy 2: Overpass mirrors (fallback)
      if (results.length === 0) {
        try {
          results = await fetchWithOverpass(lat, lon, radius);
        } catch (e) {
          console.warn('Overpass also failed', e);
        }
      }

      // De-duplicate by proximity (within 50m = same hospital)
      const unique = [];
      for (const r of results) {
        const isDuplicate = unique.some(u => calculateDistance(u.lat, u.lon, r.lat, r.lon) < 0.05);
        if (!isDuplicate) unique.push(r);
      }

      unique.sort((a, b) => a.distance - b.distance);
      setHospitals(unique);

      if (unique.length === 0) {
        setError(`No hospitals found within ${radius / 1000} km. Try increasing the search radius.`);
      }
    } catch (err) {
      setError('Failed to fetch nearby hospitals. Please check your internet connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-2.5, 118],
      zoom: 5,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Handle map resize when modal opens
    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers when hospitals change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Add user marker
    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>📍 Your Location</strong>');
      markersRef.current.push(userMarker);

      // Add circle for search radius
      const circle = L.circle([userLocation.lat, userLocation.lon], {
        radius: searchRadius,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: '6, 6'
      }).addTo(map);
      markersRef.current.push(circle);
    }

    // Add hospital markers
    hospitals.forEach((h) => {
      const marker = L.marker([h.lat, h.lon], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px">
            <strong>${h.name}</strong><br/>
            <span style="color:#666;font-size:0.85em">${h.distance.toFixed(1)} km away</span>
            ${h.emergency ? '<br/><span style="color:#DC2626;font-weight:600;font-size:0.85em">🚨 Emergency Available</span>' : ''}
            ${h.phone ? `<br/><a href="tel:${h.phone}" style="color:#3B82F6;font-size:0.85em">📞 ${h.phone}</a>` : ''}
          </div>
        `);

      marker.on('click', () => setSelectedHospital(h.id));
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (userLocation && hospitals.length > 0) {
      const allPoints = [[userLocation.lat, userLocation.lon], ...hospitals.map(h => [h.lat, h.lon])];
      map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 15 });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], 14);
    }

  }, [hospitals, userLocation, searchRadius]);

  // Request user location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('requesting');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setUserLocation(loc);
        setLocationStatus('granted');
        fetchHospitals(loc.lat, loc.lon, searchRadius);
      },
      (err) => {
        setLocationStatus('denied');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const changeRadius = (newRadius) => {
    setSearchRadius(newRadius);
    if (userLocation) {
      fetchHospitals(userLocation.lat, userLocation.lon, newRadius);
    }
  };

  const focusHospital = (hospital) => {
    setSelectedHospital(hospital.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([hospital.lat, hospital.lon], 16, { animate: true });
      // Open popup
      markersRef.current.forEach(m => {
        if (m.getLatLng && m.getLatLng().lat === hospital.lat && m.getLatLng().lng === hospital.lon) {
          m.openPopup();
        }
      });
    }
  };

  const openDirections = (hospital) => {
    const url = userLocation
      ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lon}/${hospital.lat},${hospital.lon}`
      : `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lon}`;
    window.open(url, '_blank');
  };

  const formatDistance = (km) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="hospital-modal">
      <div className="hospital-modal-header">
        <MapPin size={28} className="hospital-modal-icon" />
        <div>
          <h2>Find Nearby Hospitals</h2>
          <p>Locate hospitals and clinics around you for sinus care and emergencies.</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="hospital-map-container">
        <div ref={mapRef} className="hospital-map" id="hospital-map"></div>

        {/* Map overlay when no location */}
        {!userLocation && locationStatus !== 'requesting' && (
          <div className="map-overlay">
            <div className="map-overlay-content">
              <MapPin size={48} />
              <h3>Enable Location Access</h3>
              <p>Allow location access to find hospitals near you</p>
              <button className="btn btn-primary" onClick={requestLocation}>
                <Locate size={18} /> Enable Location
              </button>
            </div>
          </div>
        )}

        {locationStatus === 'requesting' && (
          <div className="map-overlay">
            <div className="map-overlay-content">
              <div className="location-spinner"></div>
              <p>Getting your location...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {userLocation && (
        <div className="hospital-controls">
          <div className="radius-selector">
            <Search size={16} />
            <span>Search Radius:</span>
            <div className="radius-buttons">
              {[3000, 5000, 10000, 20000].map(r => (
                <button
                  key={r}
                  className={`radius-btn ${searchRadius === r ? 'active' : ''}`}
                  onClick={() => changeRadius(r)}
                >
                  {r / 1000} km
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={requestLocation} title="Refresh location">
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="hospital-error">
          <AlertTriangle size={16} />
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="hospital-loading">
          <div className="location-spinner"></div>
          <p>Searching for nearby hospitals...</p>
        </div>
      )}

      {/* Hospital List */}
      {!loading && hospitals.length > 0 && (
        <div className="hospital-list">
          <h3 className="hospital-list-title">
            <MapPin size={18} />
            {hospitals.length} Hospital{hospitals.length > 1 ? 's' : ''} Found Nearby
          </h3>

          {hospitals.map((hospital, index) => (
            <div
              key={hospital.id}
              className={`hospital-card card ${selectedHospital === hospital.id ? 'selected' : ''}`}
              onClick={() => focusHospital(hospital)}
            >
              <div className="hospital-card-main">
                <div className="hospital-rank">{index + 1}</div>
                <div className="hospital-card-info">
                  <div className="hospital-name-row">
                    <h4>{hospital.name}</h4>
                    {hospital.emergency && (
                      <span className="emergency-badge">🚨 Emergency</span>
                    )}
                  </div>

                  <div className="hospital-meta">
                    <span className="hospital-distance">
                      <Navigation size={14} />
                      {formatDistance(hospital.distance)}
                    </span>
                    <span className="hospital-type">
                      {hospital.type === 'clinic' ? '🏥 Clinic' : '🏨 Hospital'}
                    </span>
                  </div>

                  {hospital.address && (
                    <p className="hospital-address">
                      <MapPin size={13} /> {hospital.address}
                    </p>
                  )}

                  {/* Expandable details */}
                  {expandedCard === hospital.id && (
                    <div className="hospital-details">
                      {hospital.operator && (
                        <p className="hospital-detail-item">
                          <Star size={13} /> <strong>Operator:</strong> {hospital.operator}
                        </p>
                      )}
                      {hospital.phone && (
                        <p className="hospital-detail-item">
                          <Phone size={13} />
                          <a href={`tel:${hospital.phone}`}>{hospital.phone}</a>
                        </p>
                      )}
                      {hospital.openingHours && (
                        <p className="hospital-detail-item">
                          <Clock size={13} /> {hospital.openingHours}
                        </p>
                      )}
                      {hospital.website && (
                        <p className="hospital-detail-item">
                          <ExternalLink size={13} />
                          <a href={hospital.website} target="_blank" rel="noopener noreferrer">Visit Website</a>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="hospital-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => { e.stopPropagation(); openDirections(hospital); }}
                >
                  <Navigation size={14} /> Directions
                </button>
                {hospital.phone && (
                  <a
                    className="btn btn-outline btn-sm"
                    href={`tel:${hospital.phone}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone size={14} /> Call
                  </a>
                )}
                <button
                  className="btn-icon-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCard(expandedCard === hospital.id ? null : hospital.id);
                  }}
                  title="Toggle details"
                >
                  {expandedCard === hospital.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="hospital-footer">
        <p>"Hospital data provided by OpenStreetMap contributors."</p>
        <p>Tip: For emergencies, always call your local emergency number (e.g. 112 or 119 in Indonesia).</p>
      </div>
    </div>
  );
};

export default HospitalFinderModal;
