import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../utils/leafletIcons';

// Apercu du trajet quand l'API fournit des coordonnees (latitude/longitude sur
// les contacts / l'agence). Sinon le composant ne s'affiche pas : la navigation
// passe par le lien "Itineraire" (Google Maps) des cartes de contact.
export default function MapRoutePreview({ origin, destination }) {
  const valid = (p) => p && p.lat != null && p.lng != null && !Number.isNaN(Number(p.lat));
  const points = [origin, destination].filter(valid);
  if (points.length === 0) return null;

  const coords = points.map((p) => [Number(p.lat), Number(p.lng)]);

  return (
    <div className="card overflow-hidden">
      <div className="h-44 w-full">
        <MapContainer
          bounds={coords.length > 1 ? coords : undefined}
          center={coords.length === 1 ? coords[0] : undefined}
          zoom={coords.length === 1 ? 14 : undefined}
          boundsOptions={{ padding: [28, 28] }}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {valid(origin) && (
            <Marker position={[Number(origin.lat), Number(origin.lng)]}><Popup>Départ</Popup></Marker>
          )}
          {valid(destination) && (
            <Marker position={[Number(destination.lat), Number(destination.lng)]}><Popup>Arrivée</Popup></Marker>
          )}
          {coords.length > 1 && <Polyline positions={coords} pathOptions={{ color: '#ea580c', weight: 4, dashArray: '6 8' }} />}
        </MapContainer>
      </div>
    </div>
  );
}
