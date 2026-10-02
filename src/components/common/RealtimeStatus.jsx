import { useSelector } from 'react-redux';
import { Radio, WifiOff, Loader2 } from 'lucide-react';
import { useRealtimeStatus } from '../../hooks/useRealtimeUpdates';

// Indicateur de connexion temps reel (equivalent du WebSocketStatus
// d'agence-partenaire). Variantes : `pill` (en-tete) et `banner` (ecrans de liste).
const META = {
  connected: { label: 'En direct', dot: 'bg-success-500', pill: 'bg-success-50 text-success-700' },
  connecting: { label: 'Connexion…', dot: 'bg-warning-500 animate-pulse-dot', pill: 'bg-warning-50 text-warning-800' },
  unavailable: { label: 'Hors ligne', dot: 'bg-surface-400', pill: 'bg-surface-100 text-surface-600' },
  disconnected: { label: 'Hors ligne', dot: 'bg-surface-400', pill: 'bg-surface-100 text-surface-600' },
  failed: { label: 'Indisponible', dot: 'bg-danger-500', pill: 'bg-danger-50 text-danger-700' },
  idle: { label: 'Hors ligne', dot: 'bg-surface-400', pill: 'bg-surface-100 text-surface-600' },
};

export default function RealtimeStatus({ variant = 'pill' }) {
  const { state, configured, connected } = useRealtimeStatus();
  const isDevBypass = useSelector((s) => s.auth.isDevBypass);
  if (!configured || isDevBypass) return null;

  const meta = META[state] || META.idle;

  if (variant === 'banner') {
    if (connected) return null;
    const connecting = state === 'connecting';
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-xs text-surface-600" role="status">
        {connecting
          ? <Loader2 size={15} className="shrink-0 animate-spin text-warning-600" aria-hidden="true" />
          : <WifiOff size={15} className="shrink-0 text-surface-400" aria-hidden="true" />}
        {connecting
          ? 'Connexion au temps réel…'
          : 'Temps réel interrompu. Les listes se mettent à jour à la reconnexion.'}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption font-semibold ${meta.pill}`} role="status" aria-label={`Temps réel : ${meta.label}`}>
      {connected ? <Radio size={12} aria-hidden="true" /> : <span className={`status-dot ${meta.dot}`} aria-hidden="true" />}
      {meta.label}
    </span>
  );
}
