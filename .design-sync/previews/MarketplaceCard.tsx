import { MarketplaceCard } from 'livreur-app';

export const EnCours = () => (
  <div className="max-w-md">
    <MarketplaceCard livraison={{ id: 11, mode: 'reseau', statut: 'en_cours', montant_final: 1500, assignee_le: '2026-10-02T10:05:00', commande: { id: 'c7d8e9f0a1', montant_articles: 45500 } }} />
  </div>
);

export const Livree = () => (
  <div className="max-w-md">
    <MarketplaceCard livraison={{ id: 12, mode: 'direct', statut: 'livree', montant_final: 2000, commande: { id: 'b2c3d4e5f6', montant_articles: 18000 } }} />
  </div>
);
