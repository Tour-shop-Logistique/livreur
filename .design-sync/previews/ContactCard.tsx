import { ContactCard } from 'livreur-app';

export const ExpediteurActif = () => (
  <div className="max-w-md">
    <ContactCard
      role="Expéditeur"
      highlight
      contact={{ nom: 'Aïcha Bamba', telephone: '07 08 09 10 11', adresse: 'Rue des Jardins', quartier: 'Riviera 2', ville: 'Cocody' }}
    />
  </div>
);

export const Agence = () => (
  <div className="max-w-md">
    <ContactCard role="Agence de dépôt" isAgency contact={{ nom: 'Agence TourShop Plateau', telephone: '27 20 30 40 50', adresse: 'Bd de la République', ville: 'Plateau' }} />
  </div>
);
