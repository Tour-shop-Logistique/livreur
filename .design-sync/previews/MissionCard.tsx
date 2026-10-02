import { MissionCard } from 'livreur-app';

const expedition = {
  reference: 'EXP-2410-0381',
  expediteur: { nom_prenom: 'Aïcha Bamba', telephone: '07 08 09 10 11', adresse: 'Rue des Jardins', quartier: 'Riviera 2', ville: 'Cocody' },
  destinataire: { nom_prenom: 'Serge Kouamé', telephone: '05 44 33 22 11', adresse: 'Avenue 7', quartier: 'Zone 4', ville: 'Marcory' },
  agence: { nom: 'Agence TourShop Plateau', adresse: 'Bd de la République', ville: 'Plateau' },
};

export const EnlevementEnCours = () => (
  <div className="max-w-md">
    <MissionCard
      mission={{ id: 'a1b2c3d4e5', type: 'enlevement', mode: 'express', statut: 'assignee', montant_final: 3500, assignee_le: '2026-10-02T09:15:00', expedition: { ...expedition, statut_expedition: 'en_cours_enlevement' } }}
    />
  </div>
);

export const LivraisonADemarrer = () => (
  <div className="max-w-md">
    <MissionCard mission={{ id: 'f6g7h8i9j0', type: 'livraison', mode: 'groupage', statut: 'assignee', montant_final: 2000, expedition }} />
  </div>
);

export const Terminee = () => (
  <div className="max-w-md">
    <MissionCard mission={{ id: 'k1l2m3n4o5', type: 'livraison', mode: 'express', statut: 'terminee', montant_final: 4000, assignee_le: '2026-09-28T16:40:00', expedition }} />
  </div>
);
