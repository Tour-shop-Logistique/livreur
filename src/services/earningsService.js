import api from './api';

// Solde et retrait des gains (PARCOURS_LIVREUR_API.md §4.6). Le solde est credite
// automatiquement a chaque mission cloturee ; le retrait n'est decremente qu'a la
// confirmation du backoffice (qui remet l'argent hors application).

// GET /livreur/solde -> { solde_livreur }
const fetchBalance = async () => {
  const { data } = await api.get('/livreur/solde');
  return data;
};

// GET /livreur/solde/historique -> credits (+) et retraits (-) tries par date desc.
const fetchHistory = async () => {
  const { data } = await api.get('/livreur/solde/historique');
  return data;
};

// POST /livreur/solde/demander-retrait -> 422 si montant > solde.
const requestWithdrawal = async ({ montant, notes }) => {
  const { data } = await api.post('/livreur/solde/demander-retrait', { montant, notes: notes || undefined });
  return data;
};

const earningsService = {
  fetchBalance,
  fetchHistory,
  requestWithdrawal,
};

export default earningsService;
