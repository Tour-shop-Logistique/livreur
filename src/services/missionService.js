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

// GET /expedition/livreur/missions-disponibles — missions EXPRESS ouvertes au reseau.
const fetchAvailableMissions = async () => {
  const { data } = await api.get(`${BASE}/missions-disponibles`);
  return data;
};

// POST /expedition/livreur/missions/{missionId}/proposer — idempotent (remplace l'offre).
const proposeOffer = async (missionId, montant) => {
  const { data } = await api.post(`${BASE}/missions/${missionId}/proposer`, { montant_propose: montant });
  return data;
};

// DELETE /expedition/livreur/missions/{missionId}/offre
const withdrawOffer = async (missionId) => {
  const { data } = await api.delete(`${BASE}/missions/${missionId}/offre`);
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
  proposeOffer,
  withdrawOffer,
  startPickup,
  confirmPickup,
  confirmAgencyDrop,
  startDelivery,
  validateDelivery,
};

export default missionService;
