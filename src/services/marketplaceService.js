import api, { toFormData, multipart } from './api';

// Role du livreur dans le module Marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §7).
// Systeme totalement separe des missions d'expedition. Protege par le middleware
// d'abonnement : 403 `ABONNEMENT_BLOQUE` si l'abonnement est en retard (sauf solde).

const BASE = '/marketplace/livreur/livraisons';

// Preuve structuree (etape `retrait` au demarrage, `remise` a la validation).
const proofFields = ({ photo, signature, lat, lng } = {}) => ({
  photo,
  signature,
  latitude: lat,
  longitude: lng,
});

// GET /marketplace/livreur/livraisons-disponibles — mode reseau, statut en_attente,
// filtrees par ville du profil. `ville` remplace la ville du profil ; `lat`/`lng`
// ajoutent `distance_km` et filtrent sur `zone_de_livraison_km` (§7.1).
const fetchAvailable = async ({ ville, lat, lng } = {}) => {
  const params = {};
  if (ville) params.ville = ville;
  if (lat != null && lng != null) {
    params.latitude = lat;
    params.longitude = lng;
  }
  const { data } = await api.get('/marketplace/livreur/livraisons-disponibles', { params });
  return data;
};

// GET /marketplace/livreur/livraisons/mes-livraisons — tous statuts, contacts complets.
const fetchMine = async () => {
  const { data } = await api.get(`${BASE}/mes-livraisons`);
  return data;
};

// GET /marketplace/livreur/livraisons/{id} — 404 si pas assignee au livreur (§7.8).
const fetchOne = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

// POST .../{id}/proposer — idempotent.
const proposeOffer = async (id, montant) => {
  const { data } = await api.post(`${BASE}/${id}/proposer`, { montant_propose: montant });
  return data;
};

// DELETE .../{id}/offre
const withdrawOffer = async (id) => {
  const { data } = await api.delete(`${BASE}/${id}/offre`);
  return data;
};

// POST .../{id}/accepter — affectation directe `proposee` -> `assignee` (§7.4).
// 422 si expiree ou livreur indisponible, 404 si deja traitee.
const accept = async (id) => {
  const { data } = await api.post(`${BASE}/${id}/accepter`);
  return data;
};

// POST .../{id}/refuser { motif? } — la commande revient `payee` cote vendeur.
const refuse = async (id, motif) => {
  const { data } = await api.post(`${BASE}/${id}/refuser`, { motif: motif || undefined });
  return data;
};

// POST .../{id}/demarrer — assignee -> en_cours, preuve de retrait optionnelle.
const start = async (id, proof) => {
  const { data } = await api.post(`${BASE}/${id}/demarrer`, toFormData(proofFields(proof)), multipart);
  return data;
};

// POST .../{id}/valider — code (obligatoire) + preuve de remise optionnelle.
const validate = async (id, { code, ...proof }) => {
  const { data } = await api.post(`${BASE}/${id}/valider`, toFormData({ code, ...proofFields(proof) }), multipart);
  return data;
};

// Solde marketplace INFORMATIF (§7.9), accessible meme bloque pour abonnement.
const fetchSolde = async () => {
  const { data } = await api.get('/marketplace/livreur/solde');
  return data;
};

const fetchSoldeHistory = async () => {
  const { data } = await api.get('/marketplace/livreur/solde/historique');
  return data;
};

const marketplaceService = {
  fetchAvailable,
  fetchMine,
  fetchOne,
  proposeOffer,
  withdrawOffer,
  accept,
  refuse,
  start,
  validate,
  fetchSolde,
  fetchSoldeHistory,
};

export default marketplaceService;
