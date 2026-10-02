import { MarketplaceStatusBadge } from 'livreur-app';

export const Statuts = () => (
  <div className="flex flex-wrap gap-2">
    {['en_attente', 'assignee', 'en_cours', 'livree', 'annulee'].map((s) => (
      <MarketplaceStatusBadge key={s} statut={s} />
    ))}
  </div>
);
