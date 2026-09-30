import api, { toFormData, multipart } from './api';

// Role du livreur dans le module Marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §7).
// Systeme totalement separe des missions d'expedition. Protege par le middleware
// d'abonnement : 403 `ABONNEMENT_BLOQUE` si l'abonnement est en retard.

const BASE = '/marketplace/livreur/livraisons';

// GET /marketplace/livreur/livraisons-disponibles — mode reseau, statut en_attente.
const fetchAvailable = async () => {
  const { data } = await api.get('/marketplace/livreur/livraisons-disponibles');
  return data;
};

// GET /marketplace/livreur/livraisons/mes-livraisons — tous statuts.
const fetchMine = async () => {
  const { data } = await api.get(`${BASE}/mes-livraisons`);
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

// POST .../{id}/demarrer — assignee -> en_cours (recuperation chez le vendeur).
const start = async (id) => {
  const { data } = await api.post(`${BASE}/${id}/demarrer`);
  return data;
};

// POST .../{id}/valider — code (obligatoire) + preuve photo optionnelle.
const validate = async (id, { code, photo }) => {
  const { data } = await api.post(`${BASE}/${id}/valider`, toFormData({ code, preuve: photo }), multipart);
  return data;
};

const marketplaceService = {
  fetchAvailable,
  fetchMine,
  proposeOffer,
  withdrawOffer,
  start,
  validate,
};

export default marketplaceService;
