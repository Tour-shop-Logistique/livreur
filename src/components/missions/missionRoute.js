import { contactOf, agencyOf, addressLine } from '../../utils/missionFlow';

const placeOf = (c) => [c?.quartier, c?.ville].filter(Boolean).join(', ');

// Course express ouverte au reseau : seules les villes sont utiles pour decider
// d'accepter (§4.5) — adresses completes une fois acceptee.
//  - enlevement : chez l'expediteur -> AGENCE (jamais le pays de destination)
//  - livraison  : agence d'arrivee -> destinataire
export function expressRoute(mission) {
  const exp = mission?.expedition || {};
  const expediteur = contactOf(exp, 'expediteur');
  const destinataire = contactOf(exp, 'destinataire');
  const agence = agencyOf(exp, mission?.type);
  const agenceTitle = agence?.nom && agence.nom !== 'Agence TourShop'
    ? agence.nom
    : [agence?.nom, agence?.ville].filter(Boolean).join(' · ') || 'Agence TourShop';

  if (mission?.type === 'enlevement') {
    return {
      from: { label: 'Récupérer', title: placeOf(expediteur) || exp.pays_depart || '—' },
      to: { label: "Déposer à l'agence", title: agenceTitle },
    };
  }
  return {
    from: { label: 'Récupérer', title: agenceTitle },
    to: { label: 'Livrer', title: placeOf(destinataire) || '—' },
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
