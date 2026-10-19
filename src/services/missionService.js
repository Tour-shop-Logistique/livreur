import api, { toFormData, multipart } from './api';

// Missions d'expedition classiques — dernier kilometre (PARCOURS_LIVREUR_API.md §4).
// Distinct du module Marketplace (cf. marketplaceService). Les routes d'action
// prennent l'`expedition_id` de la mission, pas l'id de la mission.

const BASE = '/expedition/livreur';

// GET /expedition/livreur/missions?statut=&page= — pagine (20/page).
const fetchMissions = async ({ statut, page = 1 } = {}) => {
  const { data } = await api.get(`${BASE}/missions`, { params: { statut: statut || undefined, page } });
  return data;
};

// GET /expedition/livreur/missions-disponibles — missions EXPRESS ouvertes au reseau,
// avec leur prix impose `montant_fixe` (= `montant_final`), filtrees par defaut sur la `ville` du profil (§4.5). `ville` la remplace (livreur
// en deplacement) ; `lat`/`lng` ajoutent `distance_km`, filtrent sur
// `zone_de_livraison_km` et trient par distance.
const fetchAvailableMissions = async ({ ville, lat, lng } = {}) => {
  const params = {};
  if (ville) params.ville = ville;
  if (lat != null && lng != null) {
    params.latitude = lat;
    params.longitude = lng;
  }
  const { data } = await api.get(`${BASE}/missions-disponibles`, { params });
  return data;
};

// --- Notes libres du livreur sur une mission assignee (§4.6) ---

// GET /expedition/livreur/missions/{missionId}/notes
const fetchNotes = async (missionId) => {
  const { data } = await api.get(`${BASE}/missions/${missionId}/notes`);
  return data;
};

// POST /expedition/livreur/missions/{missionId}/notes { contenu (max 1000), photo? }
// 422 "Mission non modifiable." si la mission n'est plus `assignee`.
const addNote = async (missionId, { contenu, photo }) => {
  const { data } = await api.post(`${BASE}/missions/${missionId}/notes`, toFormData({ contenu, photo }), multipart);
  return data;
};

// POST /expedition/livreur/missions/{missionId}/accepter -> assignee.
// Sert aux deux modes :
//  - EXPRESS : prix impose (`montant_fixe`), premier arrive premier servi
//    (CHANGEMENTS_APPS_CLIENT_LIVREUR §2). Les anciennes routes `proposer` /
//    `offre` sont depreciees et ne sont plus appelees.
//  - GROUPAGE propose par le backoffice (§4.1bis), 15 min pour repondre.
// 422 : "Cette mission a déjà été prise par un autre livreur.", "Cette
// proposition a expiré.", livreur indisponible, ou deja une mission en cours.
const acceptMission = async (missionId) => {
  const { data } = await api.post(`${BASE}/missions/${missionId}/accepter`);
  return data;
};
const acceptProposal = acceptMission;

// POST /expedition/livreur/missions/{missionId}/refuser { motif? } — la mission
// retourne dans la file du backoffice.
const refuseProposal = async (missionId, motif) => {
  const { data } = await api.post(`${BASE}/missions/${missionId}/refuser`, { motif: motif || undefined });
  return data;
};

const proofForm = ({ photo, signature, lat, lng, code } = {}) => toFormData({
  code_validation: code,
  photo,
  signature,
  latitude: lat,
  longitude: lng,
});

// --- Enlevement (chez l'expediteur -> agence) ---

// POST .../enlevement/{expeditionId}/start -> statut_expedition = en_cours_enlevement
const startPickup = async (expeditionId) => {
  const { data } = await api.post(`${BASE}/enlevement/${expeditionId}/start`);
  return data;
};

// POST .../enlevement/{expeditionId}/confirm — preuve optionnelle (photo, signature, geo).
const confirmPickup = async (expeditionId, proof) => {
  const { data } = await api.post(`${BASE}/enlevement/${expeditionId}/confirm`, proofForm(proof), multipart);
  return data;
};

// POST .../reception-agence/{expeditionId}/confirm -> mission terminee, solde credite.
const confirmAgencyDrop = async (expeditionId) => {
  const { data } = await api.post(`${BASE}/reception-agence/${expeditionId}/confirm`);
  return data;
};

// --- Livraison a domicile (agence -> destinataire) ---

// POST .../livraison/{expeditionId}/start -> statut_expedition = en_cours_livraison
const startDelivery = async (expeditionId) => {
  const { data } = await api.post(`${BASE}/livraison/${expeditionId}/start`);
  return data;
};

// POST .../livraison/{expeditionId}/validate — code a 4 chiffres du destinataire
// (obligatoire) + preuve optionnelle. 422 "Code de réception incorrect" si faux.
const validateDelivery = async (expeditionId, proof) => {
  const { data } = await api.post(`${BASE}/livraison/${expeditionId}/validate`, proofForm(proof), multipart);
  return data;
};

const missionService = {
  fetchMissions,
  fetchAvailableMissions,
  acceptMission,
  acceptProposal,
  refuseProposal,
  fetchNotes,
  addNote,
  startPickup,
  confirmPickup,
  confirmAgencyDrop,
  startDelivery,
  validateDelivery,
};

export default missionService;
