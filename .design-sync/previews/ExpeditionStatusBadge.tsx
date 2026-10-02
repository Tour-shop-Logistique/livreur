import { ExpeditionStatusBadge } from 'livreur-app';

export const Phases = () => (
  <div className="flex flex-wrap gap-2">
    {['offer', 'start', 'pickup', 'deposit', 'deliver', 'done', 'cancelled'].map((p) => (
      <ExpeditionStatusBadge key={p} phase={p} />
    ))}
  </div>
);
