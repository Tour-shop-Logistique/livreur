import { contactOf, agencyOf, addressLine } from '../../utils/missionFlow';

// Mission express ouverte aux offres : seules les villes (ou pays) sont utiles
// pour decider de proposer un tarif (§4.5).
export function expressRoute(mission) {
  const exp = mission?.expedition || {};
  const expediteur = contactOf(exp, 'expediteur');
  const destinataire = contactOf(exp, 'destinataire');
  return {
    from: { label: 'Départ', title: expediteur.ville || exp.pays_depart || '—' },
    to: { label: 'Arrivée', title: destinataire.ville || exp.pays_destination || '—' },
  };
}

// Points de depart / d'arrivee d'une mission d'expedition selon son type :
//  - enlevement : expediteur -> agence de depart
//  - livraison  : agence -> destinataire
export function expeditionRoute(mission) {
  const exp = mission?.expedition || {};
  const expediteur = contactOf(exp, 'expediteur');
  const destinataire = contactOf(exp, 'destinataire');
  const agence = agencyOf(exp);

  const agencePoint = {
    label: 'Agence',
    title: agence?.nom || 'Agence TourShop',
    detail: agence ? addressLine(agence) : null,
  };

  if (mission?.type === 'enlevement') {
    return {
      from: { label: 'Enlèvement', title: expediteur.nom || expediteur.ville, detail: addressLine(expediteur) },
      to: agencePoint,
      contact: { role: 'Expéditeur', ...expediteur },
      agence,
    };
  }
  return {
    from: agencePoint,
    to: { label: 'Livraison', title: destinataire.nom || destinataire.ville, detail: addressLine(destinataire) },
    contact: { role: 'Destinataire', ...destinataire },
    agence,
  };
}
