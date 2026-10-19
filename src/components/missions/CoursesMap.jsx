import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer, TileLayer, AttributionControl, Marker, Popup, Polyline, useMap,
} from 'react-leaflet';
import { ChevronDown, Map as MapIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import useRoute from '../../hooks/useRoute';
import useLivePosition from '../../hooks/useLivePosition';
import { isValidPoint, formatDistance } from '../../services/routingService';
import { expeditionRoute } from './missionRoute';
import { marketplacePickup, marketplaceDropoff, MISSION_TYPE_LABEL } from '../../utils/missionFlow';
import { missionDetailPath, marketplaceDetailPath } from '../../routes';
import { pinIcon, meIcon } from './mapPins';
import { TILE_URL, TILE_ATTRIBUTION } from '../../utils/mapTiles';

// Vue d'ensemble des courses en cours : pour chaque course, son point de
// recuperation et son point de remise (numerotes 1, 2, 3…), l'itineraire routier
// entre les deux et la position du livreur. Un tap sur un point ouvre la course.

const COURSE_COLORS = ['#ea580c', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ca8a04'];

const toCourse = (item, kind) => {
  if (kind === 'mission') {
    const r = expeditionRoute(item);
    const pickupIsContact = item.type === 'enlevement';
    const from = pickupIsContact ? r.contact : r.agence;
    const to = pickupIsContact ? r.agence : r.contact;
    return {
      id: item.id,
      path: missionDetailPath(item.id),
      title: `${MISSION_TYPE_LABEL[item.type] || 'Mission'} ${item.expedition?.reference || ''}`.trim(),
      from: from && { ...from, title: r.from.title, kind: pickupIsContact ? 'pickup' : 'agency' },
      to: to && { ...to, title: r.to.title, kind: pickupIsContact ? 'agency' : 'dropoff' },
    };
  }
  const p = marketplacePickup(item);
  const d = marketplaceDropoff(item);
  return {
    id: item.id,
    path: marketplaceDetailPath(item.id),
    title: `Marketplace #${String(item.commande?.id || item.commande_marketplace_id || '').slice(0, 8)}`,
    from: p && { ...p, title: p.nom || 'Vendeur', kind: 'pickup' },
    to: d && { ...d, title: d.nom || 'Acheteur', kind: 'dropoff' },
  };
};

function FitAll({ points }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    const pts = JSON.parse(key);
    if (pts.length === 1) map.setView(pts[0], 14);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
  }, [map, key]);
  return null;
}

// Un composant par course : chaque itineraire a son propre calcul.
function CourseRoute({ course, color, vehicle, onDistance }) {
  const { route } = useRoute([course.from, course.to], { vehicle });
  useEffect(() => {
    onDistance(course.id, route && !route.approx ? route.distanceKm : null);
  }, [route, course.id, onDistance]);
  if (!route) return null;
  return <Polyline positions={route.coords} pathOptions={{ color, weight: 4, opacity: 0.8, dashArray: route.approx ? '6 8' : undefined }} />;
}

export default function CoursesMap({ missions = [], livraisons = [] }) {
  const navigate = useNavigate();
  const vehicle = useSelector((state) => state.auth.user?.livreur?.type_vehicule);
  const [open, setOpen] = useState(false);
  const [distances, setDistances] = useState({});
  const { position: me } = useLivePosition(open);

  const courses = useMemo(
    () => [
      ...missions.map((m) => toCourse(m, 'mission')),
      ...livraisons.map((l) => toCourse(l, 'marketplace')),
    ].filter((c) => isValidPoint(c.from) || isValidPoint(c.to)),
    [missions, livraisons],
  );

  const onDistance = useMemo(() => (id, km) => setDistances((d) => (d[id] === km ? d : { ...d, [id]: km })), []);

  if (courses.length === 0) return null;

  const points = courses.flatMap((c) => [c.from, c.to].filter(isValidPoint).map((p) => [Number(p.lat), Number(p.lng)]));
  const known = courses.map((c) => distances[c.id]).filter((km) => km != null);
  const total = known.reduce((s, km) => s + km, 0);

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="icon-tile h-9 w-9 bg-primary-50 text-primary-600"><MapIcon size={17} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-surface-900">Carte de mes courses</span>
          <span className="block text-xs text-surface-500">
            {courses.length} course{courses.length > 1 ? 's' : ''}
            {known.length > 0 && ` · ${formatDistance(total)} de trajets${known.length < courses.length ? ' (partiel)' : ''}`}
          </span>
        </span>
        <ChevronDown size={18} className={`text-surface-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="h-[55dvh] w-full">
            <MapContainer center={points[0]} zoom={13} zoomControl={false} attributionControl={false} className="h-full w-full">
              <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
              <AttributionControl position="bottomleft" prefix={false} />
              <FitAll points={points} />
              {courses.map((c, i) => (
                <CourseRoute key={c.id} course={c} color={COURSE_COLORS[i % COURSE_COLORS.length]} vehicle={vehicle} onDistance={onDistance} />
              ))}
              {courses.flatMap((c, i) => [c.from, c.to].filter(isValidPoint).map((p, j) => (
                <Marker key={`${c.id}-${j}`} position={[Number(p.lat), Number(p.lng)]} icon={pinIcon(p.kind, String(i + 1))}>
                  <Popup>
                    <strong>{i + 1}. {c.title}</strong>
                    <br />
                    {j === 0 ? 'Récupération' : 'Remise'} : {p.title}
                    <br />
                    <button type="button" onClick={() => navigate(c.path)} style={{ color: '#ea580c', fontWeight: 600, marginTop: 4 }}>
                      Ouvrir la course →
                    </button>
                  </Popup>
                </Marker>
              )))}
              {me && <Marker position={[me.lat, me.lng]} icon={meIcon} zIndexOffset={1000}><Popup>Vous êtes ici</Popup></Marker>}
            </MapContainer>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 p-3 text-xs text-surface-600">
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-600" /> Récupération</li>
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Remise</li>
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-900" /> Agence</li>
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Vous</li>
          </ul>
        </>
      )}
    </section>
  );
}
