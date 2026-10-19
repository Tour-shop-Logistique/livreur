import { contactOf, agencyOf, addressLine } from '../../utils/missionFlow';

// Course express ouverte au reseau : seules les villes (ou pays) sont utiles
// pour decider d'accepter (§4.5) — adresses completes une fois acceptee.
export function expressRoute(mission) {
  const exp = mission?.expedition || {};
  const expediteur = contactOf(exp, 'expediteur');
  const destinataire = contactOf(exp, 'destinataire');
  return {
    from: { label: 'Récupérer', title: [expediteur.quartier, expediteur.ville].filter(Boolean).join(', ') || exp.pays_depart || '—' },
    to: { label: 'Déposer', title: [destinataire.quartier, destinataire.ville].filter(Boolean).join(', ') || exp.pays_destination || '—' },
  };
}

// Points de depart / d'arrivee d'une mission d'expedition selon son type :
//  - enlevement : expediteur -> agence de depart
//  - livraison  : agence d'arrivee -> destinataire
export function expeditionRoute(mission) {
  const exp = mission?.expedition || {};
  const expediteur = contactOf(exp, 'expediteur');
  const destinataire = contactOf(exp, 'destinataire');
  const agence = agencyOf(exp, mission?.type);

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
