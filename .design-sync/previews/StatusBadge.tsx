import { StatusBadge } from 'livreur-app';

export const Tons = () => (
  <div className="flex flex-wrap gap-2">
    <StatusBadge tone="info" label="Ouverte aux offres" />
    <StatusBadge tone="active" label="En cours" />
    <StatusBadge tone="waiting" label="À démarrer" />
    <StatusBadge tone="success" label="Terminée" />
    <StatusBadge tone="danger" label="Annulée" />
    <StatusBadge label="Brouillon" />
  </div>
);
