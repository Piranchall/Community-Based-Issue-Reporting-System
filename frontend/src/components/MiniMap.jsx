// src/components/MiniMap.jsx
import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icons";

let googleMapsScriptPromise = null;

const loadGoogleMapsScript = (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error("Missing Google Maps API key"));
  }
  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (googleMapsScriptPromise) return googleMapsScriptPromise;

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google?.maps));
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps API not available after script load"));
    };
    script.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  }).catch((err) => {
    googleMapsScriptPromise = null;
    throw err;
  });

  return googleMapsScriptPromise;
};

const MiniMap = ({ pins = [], pickable = false, onPick, selected, tall = false, centerLat, centerLon }) => {
  const fallbackCenterLat = 47.6062;
  const fallbackCenterLon = -122.3321;
  const hasExplicitCenter = Number.isFinite(Number(centerLat)) && Number.isFinite(Number(centerLon));
  const baseCenterLat = hasExplicitCenter ? Number(centerLat) : fallbackCenterLat;
  const baseCenterLon = hasExplicitCenter ? Number(centerLon) : fallbackCenterLon;
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const hasCoordinate = (p) => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude));
  const toLatLon = (p) => {
    if (!p) return null;
    if (hasCoordinate(p)) {
      return { latitude: Number(p.latitude), longitude: Number(p.longitude) };
    }
    if (Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))) {
      return {
        latitude: baseCenterLat + (Number(p.y) / 100 - 0.5) * -0.03,
        longitude: baseCenterLon + (Number(p.x) / 100 - 0.5) * 0.04,
      };
    }
    return null;
  };

  const markerPoints = pins.map(toLatLon).filter(Boolean);
  const selectedPoint = toLatLon(selected);
  const markerCenter = markerPoints.length
    ? {
        latitude: markerPoints.reduce((sum, p) => sum + p.latitude, 0) / markerPoints.length,
        longitude: markerPoints.reduce((sum, p) => sum + p.longitude, 0) / markerPoints.length,
      }
    : { latitude: fallbackCenterLat, longitude: fallbackCenterLon };
  const mapCenter = selectedPoint || (hasExplicitCenter ? { latitude: baseCenterLat, longitude: baseCenterLon } : markerCenter);

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const clickListenerRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (pickable && !googleMapsApiKey) {
      setMapReady(false);
      setMapError("Google Maps key missing. Using fallback picker.");
      return;
    }
    if (pickable) {
      setMapError("");
    }
  }, [pickable, googleMapsApiKey]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m?.setMap?.(null));
    markersRef.current = [];
  };

  useEffect(() => {
    if (!mapRef.current || !googleMapsApiKey) return undefined;

    let disposed = false;
    setMapReady(false);

    loadGoogleMapsScript(googleMapsApiKey)
      .then(() => {
        if (disposed || !mapRef.current) return;
        const gm = window.google?.maps;
        if (!gm) throw new Error("Google Maps API unavailable");

        const map = new gm.Map(mapRef.current, {
          center: { lat: mapCenter.latitude, lng: mapCenter.longitude },
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: pickable ? "greedy" : "cooperative",
        });

        googleMapRef.current = map;
        setMapError("");
        setMapReady(true);

        if (pickable) {
          clickListenerRef.current = map.addListener("click", (ev) => {
            const latitude = ev?.latLng?.lat?.();
            const longitude = ev?.latLng?.lng?.();
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
            onPick?.({ latitude, longitude });
          });
        }
      })
      .catch(() => {
        if (disposed) return;
        setMapError("Map could not be loaded from Google API. Using fallback picker.");
        setMapReady(false);
      });

    return () => {
      disposed = true;
      if (clickListenerRef.current && window.google?.maps?.event) {
        window.google.maps.event.removeListener(clickListenerRef.current);
      }
      clickListenerRef.current = null;
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setMap(null);
        selectedMarkerRef.current = null;
      }
      clearMarkers();
      googleMapRef.current = null;
    };
  }, [googleMapsApiKey, pickable, onPick]);

  useEffect(() => {
    const map = googleMapRef.current;
    const gm = window.google?.maps;
    if (!map || !gm) return;
    map.setCenter({ lat: mapCenter.latitude, lng: mapCenter.longitude });
  }, [mapCenter.latitude, mapCenter.longitude]);

  useEffect(() => {
    const map = googleMapRef.current;
    const gm = window.google?.maps;
    if (!map || !gm || pickable) return;

    clearMarkers();
    markersRef.current = markerPoints.map((p) => new gm.Marker({
      position: { lat: p.latitude, lng: p.longitude },
      map,
    }));
  }, [pickable, markerPoints.map((p) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`).join("|")]);

  useEffect(() => {
    const map = googleMapRef.current;
    const gm = window.google?.maps;
    if (!map || !gm || !pickable) return;

    if (!selectedPoint) {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setMap(null);
        selectedMarkerRef.current = null;
      }
      return;
    }

    const position = { lat: selectedPoint.latitude, lng: selectedPoint.longitude };

    if (!selectedMarkerRef.current) {
      selectedMarkerRef.current = new gm.Marker({ position, map });
    } else {
      selectedMarkerRef.current.setPosition(position);
      selectedMarkerRef.current.setMap(map);
    }

    map.panTo(position);
  }, [pickable, selectedPoint?.latitude, selectedPoint?.longitude]);

  const useCurrent = (e) => {
    e.stopPropagation();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => onPick?.({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => onPick?.({ latitude: baseCenterLat, longitude: baseCenterLon })
      );
    } else {
      onPick?.({ latitude: baseCenterLat, longitude: baseCenterLon });
    }
  };

  const handleFallbackPick = (e) => {
    if (!pickable) return;
    if (googleMapRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const latitude = baseCenterLat + (y / 100 - 0.5) * -0.03;
    const longitude = baseCenterLon + (x / 100 - 0.5) * 0.04;
    onPick?.({ latitude, longitude });
  };

  if (!pickable) {
    const query = `${mapCenter.latitude},${mapCenter.longitude}`;
    const embedSrc = googleMapsApiKey
      ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(googleMapsApiKey)}&center=${encodeURIComponent(query)}&zoom=14&maptype=roadmap`
      : `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;

    return (
      <div className={`map-wrap ${tall ? "tall" : ""}`}>
        <iframe
          className="map-embed"
          title="Issue location map"
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="map-overlay">
          <div className="map-coord">
            <span className="c-label">LAT</span>
            <span>{mapCenter.latitude.toFixed(4)}</span>
            <span className="c-label" style={{ marginLeft: 4 }}>LON</span>
            <span>{mapCenter.longitude.toFixed(4)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-wrap ${tall ? "tall" : ""}`} style={{ cursor: "crosshair" }} onClick={handleFallbackPick}>
      <div ref={mapRef} className="map-interactive" aria-label="Interactive location map" />

      <div className="map-overlay">
        <div className="map-coord">
          <span className="c-label">LAT</span>
          <span>{selectedPoint?.latitude ? selectedPoint.latitude.toFixed(4) : baseCenterLat.toFixed(4)}</span>
          <span className="c-label" style={{ marginLeft: 4 }}>LON</span>
          <span>{selectedPoint?.longitude ? selectedPoint.longitude.toFixed(4) : baseCenterLon.toFixed(4)}</span>
        </div>
        <button className="map-use-current" onClick={useCurrent}>
          <Icon name="pin" size={12} /> Use my location
        </button>
      </div>

      {!mapReady && !mapError && (
        <div className="map-loading">Loading map...</div>
      )}

      {mapError && (
        <div className="map-warning">{mapError}</div>
      )}
    </div>
  );
};

export default MiniMap;
