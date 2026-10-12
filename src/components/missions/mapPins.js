import L from 'leaflet';

// Marqueurs de carte : pastilles colorees avec une lettre ou un numero, lisibles
// sans legende (vert = recuperation, rouge = remise, bleu nuit = agence).
export const PIN_COLORS = {
  pickup: '#16a34a',
  dropoff: '#dc2626',
  agency: '#1e3a8a',
};

export const pinIcon = (kind, label = '', { active = false } = {}) => {
  const size = active ? 34 : 28;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${PIN_COLORS[kind] || '#475569'};color:#fff;display:flex;align-items:center;justify-content:center;font:700 ${active ? 14 : 12}px/1 system-ui,sans-serif;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)${active ? ',0 0 0 4px rgba(234,88,12,.35)' : ''}">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Position du livreur.
export const meIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25),0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
