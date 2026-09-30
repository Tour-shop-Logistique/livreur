import api, { toFormData, multipart } from './api';

// Abonnement marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §9). Ne concerne que
// l'usage du module Marketplace — jamais les missions d'expedition classiques.
// Ces routes restent accessibles meme quand le livreur est bloque.

// GET /abonnement/statut -> { abonnement, echeance_courante, bloque }
const fetchStatus = async () => {
  const { data } = await api.get('/abonnement/statut');
  return data;
};

// GET /abonnement/historique?per_page= — pagination Laravel.
const fetchHistory = async (perPage = 20) => {
  const { data } = await api.get('/abonnement/historique', { params: { per_page: perPage } });
  return data;
};

// POST /abonnement/{echeanceId}/declarer-paiement — ne debloque PAS : attente
// de validation manuelle par le backoffice.
const declarePayment = async (echeanceId, { methode, referenceTransaction, preuve }) => {
  const form = toFormData({ methode, reference_transaction: referenceTransaction, preuve });
  const { data } = await api.post(`/abonnement/${echeanceId}/declarer-paiement`, form, multipart);
  return data;
};

const abonnementService = {
  fetchStatus,
  fetchHistory,
  declarePayment,
};

export default abonnementService;
