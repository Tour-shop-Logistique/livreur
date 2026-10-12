// Logique metier du parcours livreur, derivee de PARCOURS_LIVREUR_API.md §4 et
// MARKETPLACE_ET_ABONNEMENT_API.md §7. Centralise ici pour que les ecrans
// (liste, detail, accueil) affichent tous la meme etape et la meme action.

const val = (v) => (v === null || v === undefined || v === '' ? null : v);

// L'API renvoie soit un objet imbrique `expediteur: {...}`, soit des champs plats
// `expediteur_nom_prenom`… (meme gestion que client-app/ExpeditionDetailPage).
export const contactOf = (expedition, who) => {
  const nested = expedition?.[who];
  const flat = (k) => expedition?.[`${who}_${k}`];
  const get = (k) => val(nested?.[k]) ?? val(flat(k));
  return {
    nom: get('nom_prenom') ?? get('nom'),
    telephone: get('telephone'),
    adresse: get('adresse'),
    ville: get('ville'),
    quartier: get('quartier'),
    lat: get('latitude') ?? get('lat'),
    lng: get('longitude') ?? get('lng'),
  };
};

export const addressLine = (c) => [c?.adresse, c?.quartier, c?.ville].filter(Boolean).join(', ');

export const mapsLink = (c) => {
  if (!c) return null;
  if (c.lat != null && c.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
  }
  const q = addressLine(c);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
};

// Enlevement : agence de depart (`agence`). Livraison a domicile : le colis est
// retire a l'agence d'arrivee (`agenceArrivee`, PARCOURS_LIVREUR_API.md §4.2),
// repli sur l'agence de depart si elle n'est pas renseignee (Interville).
export const agencyOf = (expedition, missionType = 'enlevement') => {
  const arrivee = expedition?.agenceArrivee || expedition?.agence_arrivee;
  const depart = expedition?.agence || expedition?.agence_depart;
  const a = missionType === 'livraison' ? arrivee || depart : depart;
  if (!a) return null;
  return {
    nom: val(a.nom) ?? val(a.nom_agence) ?? 'Agence TourShop',
    telephone: val(a.telephone),
    adresse: val(a.adresse),
    ville: val(a.ville),
    lat: val(a.latitude),
    lng: val(a.longitude),
  };
};

export const MISSION_TYPE_LABEL = {
  enlevement: 'Enlèvement',
  livraison: 'Livraison',
};

export const MISSION_MODE_LABEL = {
  express: 'Express',
  groupage: 'Groupage',
};

// ---------------------------------------------------------------------------
// Missions d'expedition : etape courante
// ---------------------------------------------------------------------------
// Enlevement : assignee -> start (en_cours_enlevement) -> confirm (date_enlevement_client)
//              -> reception-agence/confirm (terminee, solde credite)
// Livraison  : assignee -> start (en_cours_livraison) -> validate(code 4 chiffres) (terminee)

export const EXPEDITION_STEPS = {
  enlevement: [
    { key: 'assigned', label: 'Mission assignée', short: 'Assignée' },
    { key: 'start', label: "En route vers l'expéditeur", short: 'En route' },
    { key: 'pickup', label: 'Colis récupéré', short: 'Récupéré' },
    { key: 'deposit', label: "Déposé à l'agence", short: 'Déposé' },
  ],
  livraison: [
    { key: 'assigned', label: 'Mission assignée', short: 'Assignée' },
    { key: 'start', label: 'En route vers le destinataire', short: 'En route' },
    { key: 'deliver', label: 'Remis au destinataire', short: 'Remis' },
  ],
};

// Retourne la phase : 'proposal' | 'offer' | 'start' | 'pickup' | 'deposit' | 'deliver'
//                     | 'done' | 'cancelled' | 'refused'
export const expeditionPhase = (mission) => {
  if (!mission) return null;
  if (mission.statut === 'terminee') return 'done';
  if (mission.statut === 'annulee') return 'cancelled';
  if (mission.statut === 'refusee' || mission.statut === 'expiree') return 'refused';
  if (mission.statut === 'proposee') return 'proposal';
  if (mission.statut === 'en_attente') return 'offer';

  const exp = mission.expedition || {};
  const se = exp.statut_expedition;
  if (mission.type === 'enlevement') {
    if (exp.date_enlevement_client) return 'deposit';
    if (se === 'en_cours_enlevement') return 'pickup';
    return 'start';
  }
  if (se === 'en_cours_livraison') return 'deliver';
  return 'start';
};

// Index de l'etape completee la plus avancee dans EXPEDITION_STEPS[type].
export const expeditionStepIndex = (mission) => {
  const phase = expeditionPhase(mission);
  const isPickup = mission?.type === 'enlevement';
  switch (phase) {
    case 'start': return 0;
    case 'pickup': return 1;
    case 'deposit': return 2;
    case 'deliver': return 1;
    case 'done': return isPickup ? 3 : 2;
    default: return -1;
  }
};

// Action principale proposee au livreur pour la phase courante.
export const EXPEDITION_ACTIONS = {
  enlevement: {
    start: { key: 'startPickup', label: "Démarrer l'enlèvement", hint: "Signalez que vous partez chercher le colis chez l'expéditeur." },
    pickup: { key: 'confirmPickup', label: 'Confirmer la récupération', hint: 'Photo, signature et position sont recommandées comme preuve.' },
    deposit: { key: 'confirmAgencyDrop', label: "Confirmer le dépôt à l'agence", hint: "Clôture la mission et crédite votre solde." },
  },
  livraison: {
    start: { key: 'startDelivery', label: 'Démarrer la livraison', hint: 'Signalez que vous partez livrer le destinataire.' },
    deliver: { key: 'validateDelivery', label: 'Valider la remise', hint: 'Saisissez le code à 4 chiffres communiqué par le destinataire.' },
  },
};

export const expeditionAction = (mission) => {
  const phase = expeditionPhase(mission);
  return EXPEDITION_ACTIONS[mission?.type]?.[phase] || null;
};

// Libelle court de l'etape, pour les cartes et l'accueil.
export const expeditionPhaseLabel = (mission) => {
  const phase = expeditionPhase(mission);
  const pickup = mission?.type === 'enlevement';
  return {
    proposal: 'À accepter',
    refused: 'Refusée',
    offer: 'Offre en cours',
    start: pickup ? 'À enlever' : 'À livrer',
    pickup: 'Enlèvement en cours',
    deposit: "À déposer à l'agence",
    deliver: 'Livraison en cours',
    done: 'Terminée',
    cancelled: 'Annulée',
  }[phase] || '—';
};

// Patch local applique apres une action reussie, en attendant le rafraichissement.
export const expeditionPatchAfter = (actionKey) => {
  const now = new Date().toISOString();
  switch (actionKey) {
    case 'startPickup': return { expedition: { statut_expedition: 'en_cours_enlevement' } };
    case 'confirmPickup': return { expedition: { date_enlevement_client: now } };
    case 'confirmAgencyDrop': return { statut: 'terminee', statut_paiement: 'paye', expedition: { statut_expedition: 'recu_agence_depart', date_livraison_agence: now } };
    case 'startDelivery': return { expedition: { statut_expedition: 'en_cours_livraison' } };
    case 'validateDelivery': return { statut: 'terminee', statut_paiement: 'paye', expedition: { statut_expedition: 'terminee', date_reception_client: now } };
    default: return {};
  }
};

export const isActiveExpedition = (m) => m?.statut === 'assignee';

// Instructions saisies a la creation de l'expedition (lecture seule, §4.2),
// a afficher avant l'etape correspondante.
export const missionInstructions = (mission) => {
  const exp = mission?.expedition || {};
  return val(mission?.type === 'enlevement' ? exp.instructions_enlevement : exp.instructions_livraison);
};

// ---------------------------------------------------------------------------
// Propositions a accepter (mission groupage §4.1bis, livraison directe §7.4)
// ---------------------------------------------------------------------------

// Secondes restantes avant `expire_le` (null si pas de delai connu).
export const secondsLeft = (expireLe, now = Date.now()) => {
  const t = Date.parse(expireLe ?? '');
  return Number.isFinite(t) ? Math.max(0, Math.floor((t - now) / 1000)) : null;
};

export const isProposalExpired = (item) => secondsLeft(item?.expire_le) === 0;

// ---------------------------------------------------------------------------
// Livraisons Marketplace
// ---------------------------------------------------------------------------
// reseau : en_attente (offres) -> assignee -> demarrer (en_cours) -> valider(code) (terminee)
// direct : proposee (15 min) -> accepter -> assignee -> ... | refuser/expiree

export const MARKETPLACE_STEPS = [
  { key: 'assigned', label: 'Livraison assignée', short: 'Assignée' },
  { key: 'started', label: 'Article récupéré chez le vendeur', short: 'Récupéré' },
  { key: 'delivered', label: "Remis à l'acheteur", short: 'Remis' },
];

export const marketplaceStepIndex = (livraison) => ({
  assignee: 0,
  en_cours: 1,
  terminee: 2,
  livree: 2,
}[livraison?.statut] ?? -1);

export const marketplaceAction = (livraison) => {
  if (livraison?.statut === 'assignee') {
    return { key: 'start', label: 'Démarrer la course', hint: "Signalez que vous avez récupéré l'article chez le vendeur." };
  }
  if (livraison?.statut === 'en_cours') {
    return { key: 'validate', label: 'Valider la livraison', hint: "Saisissez le code à 4 chiffres communiqué par l'acheteur." };
  }
  return null;
};

export const isActiveMarketplace = (l) => l?.statut === 'assignee' || l?.statut === 'en_cours';

export const isMarketplaceProposal = (l) => l?.statut === 'proposee' && !isProposalExpired(l);

// Adresses de retrait (vendeur) et de livraison (acheteur). Completes sur une
// livraison assignee, ville/quartier seulement tant qu'elle est disponible (§7.1/7.7).
const placeOf = (p) => (p ? {
  nom: val(p.nom),
  telephone: val(p.telephone),
  adresse: val(p.adresse),
  quartier: val(p.quartier),
  ville: val(p.ville),
  lat: val(p.latitude),
  lng: val(p.longitude),
  instructions: val(p.instructions),
} : null);

export const marketplacePickup = (l) => placeOf(l?.retrait);
export const marketplaceDropoff = (l) => placeOf(l?.livraison);

export const placeLabel = (p) => [p?.quartier, p?.ville].filter(Boolean).join(', ') || '—';
