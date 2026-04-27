const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function encode(value) {
  return encodeURIComponent(String(value || '').trim());
}

export function buildGoogleEmbedUrl({ lat, lng, query, zoom = 14 }) {
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  if (GOOGLE_MAPS_KEY) {
    if (hasCoords) {
      return `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_KEY}&center=${lat},${lng}&zoom=${zoom}&maptype=roadmap`;
    }

    const q = encode(query || 'Karachi, Pakistan');
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${q}&zoom=${zoom}`;
  }

  if (hasCoords) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  }

  const q = encode(query || 'Karachi, Pakistan');
  return `https://maps.google.com/maps?q=${q}&z=${zoom}&output=embed`;
}

export function hasGoogleMapsKey() {
  return Boolean(GOOGLE_MAPS_KEY);
}
