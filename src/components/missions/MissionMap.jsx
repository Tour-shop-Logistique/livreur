import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap,
} from 'react-leaflet';
import {
  Crosshair, LocateFixed, LocateOff, Maximize2, Minimize2, Navigation,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import useRoute from '../../hooks/useRoute';
import useLivePosition from '../../hooks/useLivePosition';
import { isValidPoint, formatDistance, formatEta } from '../../services/routingService';
import { mapsLink } from '../../utils/missionFlow';
import { pinIcon, meIcon } from './mapPins';

// Carte d'une course : point de recuperation (A) et de remise (B), itineraire
// routier entre les deux, position du livreur en direct et distance / temps
// jusqu'au prochain arret.
//
// stops : [{ key: 'from' | 'to', kind: 'pickup' | 'dropoff' | 'agency',
//            lat, lng, title, detail? }]
// nextStop : 'from' | 'to' | null (null = course terminee ou non demarree)

const FOLLOW_KEY = 'livreur_carte_suivi';
const readFollow = () => {
  try {
    return localStorage.getItem(FOLLOW_KEY) !== 'off';
  } catch {
    return true;
  }
};

// Recadre la carte quand les points changent ou sur demande (`tick`), et
// recalcule sa taille quand le conteneur est agrandi.
function MapController({ points, tick, expanded }) {
  const map = useMap();
  const key = JSON.stringify(points);

  useEffect(() => {
    const pts = JSON.parse(key);
    if (pts.length === 1) map.setView(pts[0], 15);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [32, 32], maxZoom: 16 });
  }, [map, key, tick]);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 220);
    return () => clearTimeout(t);
  }, [map, expanded]);

  return null;
}

// variant : 'card' (bloc dans la page) | 'hero' (bord a bord en tete d'ecran,
// infos de trajet en surimpression ; le contenu suivant chevauche son bas).
export default function MissionMap({ stops = [], nextStop = null, variant = 'card' }) {
  const valid = useMemo(() => stops.filter((s) => s && isValidPoint(s)), [stops]);
  const [expanded, setExpanded] = useState(false);
  const [follow, setFollow] = useState(readFollow);
  const [tick, setTick] = useState(0);

  const next = valid.find((s) => s.key === nextStop) || null;
  const trackMe = follow && Boolean(nextStop);
  const { position: me, error: geoError } = useLivePosition(trackMe);

  // Trajet prevu A -> B, et trajet du livreur jusqu'au prochain arret, calcules
  // par la route avec le vehicule du profil (moto / voiture).
  const vehicle = useSelector((state) => state.auth.user?.livreur?.type_vehicule);
  const { route: plan } = useRoute(valid, { vehicle });
  const { route: toNext, status: toNextStatus } = useRoute([me, next], {
    enabled: Boolean(me && next), precision: 3, debounceMs: 800, vehicle,
  });

  // Recadrage : sur les arrets, plus la position du livreur a sa premiere detection.
  const [meFramed, setMeFramed] = useState(false);
  useEffect(() => {
    if (me && !meFramed) {
      setMeFramed(true);
      setTick((t) => t + 1);
    }
  }, [me, meFramed]);
  const framePoints = useMemo(() => {
    const pts = valid.map((s) => [Number(s.lat), Number(s.lng)]);
    if (me && meFramed) pts.push([me.lat, me.lng]);
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, meFramed, tick]);

  if (valid.length === 0) return null;

  const toggleFollow = () => {
    const value = !follow;
    setFollow(value);
    setMeFramed(false);
    try {
      localStorage.setItem(FOLLOW_KEY, value ? 'on' : 'off');
    } catch {
      // non bloquant
    }
  };

  const center = [Number(valid[0].lat), Number(valid[0].lng)];
  const navUrl = next ? mapsLink(next) : null;
  const hero = variant === 'hero';

  // Hero : une seule ligne resumee (trajet jusqu'au prochain arret, sinon A -> B).
  const heroInfo = toNext && trackMe
    ? { eta: formatEta(toNext.durationMin), km: formatDistance(toNext.distanceKm), approx: toNext.approx }
    : plan ? { eta: formatEta(plan.durationMin), km: formatDistance(plan.distanceKm), approx: plan.approx } : null;

  return (
    <div className={hero ? 'relative isolate' : 'card overflow-hidden'}>
      <div className={`relative w-full transition-[height] duration-200 ${expanded ? 'h-[60dvh]' : hero ? 'h-72' : 'h-52'}`}>
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={expanded}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <MapController points={framePoints} tick={tick} expanded={expanded} />

          {plan && (
            <Polyline
              positions={plan.coords}
              pathOptions={{ color: '#ea580c', weight: 5, opacity: toNext ? 0.45 : 0.9, dashArray: plan.approx ? '6 8' : undefined }}
            />
          )}
          {toNext && (
            <Polyline positions={toNext.coords} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85, dashArray: toNext.approx ? '6 8' : undefined }} />
          )}

          {valid.map((s) => (
            <Marker
              key={s.key}
              position={[Number(s.lat), Number(s.lng)]}
              icon={pinIcon(s.kind, s.key === 'from' ? 'A' : 'B', { active: s.key === nextStop })}
            >
              <Popup>
                <strong>{s.title}</strong>
                {s.detail && <><br />{s.detail}</>}
              </Popup>
            </Marker>
          ))}

          {me && (
            <>
              {me.accuracy > 30 && (
                <Circle center={[me.lat, me.lng]} radius={me.accuracy} pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.08 }} />
              )}
              <Marker position={[me.lat, me.lng]} icon={meIcon} zIndexOffset={1000}>
                <Popup>Vous êtes ici</Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        <div className="absolute right-2 top-2 z-[400] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-surface-700 shadow-md"
            aria-label={expanded ? 'Réduire la carte' : 'Agrandir la carte'}
          >
            {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-surface-700 shadow-md"
            aria-label="Recentrer la carte"
          >
            <Crosshair size={17} />
          </button>
          {nextStop && (
            <button
              type="button"
              onClick={toggleFollow}
              aria-pressed={follow}
              className={`flex h-9 w-9 items-center justify-center rounded-full shadow-md ${follow ? 'bg-blue-600 text-white' : 'bg-white text-surface-700'}`}
              aria-label={follow ? 'Ne plus afficher ma position' : 'Afficher ma position'}
            >
              {follow ? <LocateFixed size={17} /> : <LocateOff size={17} />}
            </button>
          )}
        </div>

        {hero && (heroInfo || navUrl) && (
          <div className="absolute inset-x-3 bottom-9 z-[400] flex items-end justify-between gap-2">
            {heroInfo ? (
              <p className="rounded-xl bg-white px-3 py-2 text-sm text-surface-600 shadow-md">
                {heroInfo.eta && <strong className="tabular text-surface-900">{heroInfo.eta}</strong>}
                {heroInfo.eta && ' · '}
                <span className="tabular">{heroInfo.km}</span>
                {heroInfo.approx && <span className="text-surface-400"> (estimé)</span>}
              </p>
            ) : (
              <p className="rounded-xl bg-white px-3 py-2 text-sm text-surface-500 shadow-md">
                {geoError || (trackMe ? 'Recherche de votre position…' : 'Calcul du trajet…')}
              </p>
            )}
            {navUrl && (
              <a
                href={navUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-brand"
                aria-label={`Itinéraire GPS vers ${next.title}`}
              >
                <Navigation size={20} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>

      {!hero && (
      <div className="space-y-2 p-3 text-sm">
        {plan && (
          <p className="flex items-center gap-2 text-surface-600">
            <span className="h-1 w-5 shrink-0 rounded-full bg-orange-600" aria-hidden="true" />
            <span>
              Trajet A → B : <strong className="tabular text-surface-900">{formatDistance(plan.distanceKm)}</strong>
              {formatEta(plan.durationMin) && <> · ~{formatEta(plan.durationMin)}</>}
              {plan.approx && <span className="text-surface-400"> (à vol d'oiseau)</span>}
            </span>
          </p>
        )}
        {next && trackMe && (
          <p className="flex items-center gap-2 text-surface-600">
            <span className="h-1 w-5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
            {toNext ? (
              <span>
                Vous êtes à <strong className="tabular text-surface-900">{formatDistance(toNext.distanceKm)}</strong>
                {formatEta(toNext.durationMin) && <> (~{formatEta(toNext.durationMin)})</>} de {next.title}
                {toNext.approx && <span className="text-surface-400"> (à vol d'oiseau)</span>}
              </span>
            ) : geoError ? (
              <span className="text-warning-700">{geoError}</span>
            ) : (
              <span className="text-surface-400">{me && toNextStatus === 'loading' ? 'Calcul de l’itinéraire…' : 'Recherche de votre position…'}</span>
            )}
          </p>
        )}
        {navUrl && (
          <a href={navUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm w-full">
            <Navigation size={15} aria-hidden="true" /> Itinéraire GPS vers {next.key === 'from' ? 'A' : 'B'} · {next.title}
          </a>
        )}
      </div>
      )}
    </div>
  );
}
