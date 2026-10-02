// Tons visuels des statuts : presentation uniquement.
const TONES = {
  info: { dot: 'bg-primary-500', className: 'bg-primary-50 text-primary-700' },
  active: { dot: 'bg-accent-500 animate-pulse-dot', className: 'bg-accent-50 text-accent-700' },
  waiting: { dot: 'bg-warning-500', className: 'bg-warning-50 text-warning-800' },
  success: { dot: 'bg-success-500', className: 'bg-success-50 text-success-700' },
  danger: { dot: 'bg-danger-500', className: 'bg-danger-50 text-danger-700' },
  neutral: { dot: 'bg-surface-400', className: 'bg-surface-100 text-surface-600' },
};

// Statut d'une mission d'expedition, affine par la phase du workflow.
const EXPEDITION_PHASE = {
  offer: { label: 'Ouverte aux offres', tone: 'info' },
  start: { label: 'À démarrer', tone: 'waiting' },
  pickup: { label: 'Enlèvement en cours', tone: 'active' },
  deposit: { label: "Vers l'agence", tone: 'active' },
  deliver: { label: 'Livraison en cours', tone: 'active' },
  done: { label: 'Terminée', tone: 'success' },
  cancelled: { label: 'Annulée', tone: 'danger' },
};

const MARKETPLACE = {
  en_attente: { label: 'Ouverte aux offres', tone: 'info' },
  assignee: { label: 'À démarrer', tone: 'waiting' },
  en_cours: { label: 'En cours', tone: 'active' },
  terminee: { label: 'Livrée', tone: 'success' },
  livree: { label: 'Livrée', tone: 'success' },
  annulee: { label: 'Annulée', tone: 'danger' },
};

// `size="sm"` : badge compact pour les listes denses (historiques).
export default function StatusBadge({ label, tone = 'neutral', size = 'md', className = '' }) {
  const style = TONES[tone] || TONES.neutral;
  return (
    <span className={`badge ${size === 'sm' ? 'gap-1 px-2 py-0.5 text-caption' : ''} ${style.className} ${className}`}>
      <span className={`status-dot ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function ExpeditionStatusBadge({ phase, className }) {
  const meta = EXPEDITION_PHASE[phase] || { label: '—', tone: 'neutral' };
  return <StatusBadge {...meta} className={className} />;
}

export function MarketplaceStatusBadge({ statut, className }) {
  const meta = MARKETPLACE[statut] || { label: statut || '—', tone: 'neutral' };
  return <StatusBadge {...meta} className={className} />;
}
