import { RouteLine } from 'livreur-app';

const from = { label: 'Enlèvement', title: 'Aïcha Bamba', detail: 'Rue des Jardins, Riviera 2, Cocody' };
const to = { label: 'Agence', title: 'Agence TourShop Plateau', detail: 'Bd de la République, Plateau' };

export const Detaille = () => (
  <div className="card max-w-sm p-4">
    <RouteLine from={from} to={to} />
  </div>
);

export const Compact = () => (
  <div className="card max-w-sm p-4">
    <RouteLine from={from} to={to} compact />
  </div>
);
