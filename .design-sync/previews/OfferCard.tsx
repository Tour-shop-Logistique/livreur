import { OfferCard, Package, MapPin } from 'livreur-app';

const route = {
  from: { label: 'Enlèvement', title: 'Riviera 2, Cocody' },
  to: { label: 'Livraison', title: 'Zone 4, Marcory' },
};

const meta = (
  <>
    <span className="flex items-center gap-1"><Package size={13} /> 2 colis · 6 kg</span>
    <span className="flex items-center gap-1"><MapPin size={13} /> 9,4 km</span>
  </>
);

export const Express = () => (
  <div className="max-w-md">
    <OfferCard kind="express" title="Course express" subtitle="Publiée il y a 5 min" route={route} meta={meta} onOffer={() => {}} />
  </div>
);

export const OffreEnvoyee = () => (
  <div className="max-w-md">
    <OfferCard kind="marketplace" title="Livraison marketplace" subtitle="Robe en wax · Yopougon" route={route} myOffer={2500} onOffer={() => {}} />
  </div>
);

export const Indisponible = () => (
  <div className="max-w-md">
    <OfferCard kind="express" title="Course express" subtitle="Publiée il y a 1 h" route={route} onOffer={() => {}} disabled disabledReason="Activez votre disponibilité pour proposer un tarif." />
  </div>
);
