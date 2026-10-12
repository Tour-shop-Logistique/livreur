import api from './api';

// Solde et retrait des gains (PARCOURS_LIVREUR_API.md §4.6). Le solde est credite
// automatiquement a chaque mission cloturee ; le retrait n'est decremente qu'a la
// confirmation du backoffice (qui remet l'argent hors application).

// GET /livreur/solde -> { solde_livreur }
const fetchBalance = async () => {
  const { data } = await api.get('/livreur/solde');
  return data;
};

// GET /livreur/solde/historique?page= -> credits (+) et retraits (-) tries par
// date desc, desormais pagine (20/page, §4.7).
const fetchHistory = async (page = 1) => {
  const { data } = await api.get('/livreur/solde/historique', { params: { page } });
  return data;
};

// POST /livreur/solde/demander-retrait -> 422 si montant > solde.
const requestWithdrawal = async ({ montant, notes }) => {
  const { data } = await api.post('/livreur/solde/demander-retrait', { montant, notes: notes || undefined });
  return data;
};

// GET /livreur/statistiques?periode=7j|30j|tout (§4.8) — missions, marketplace,
// offres (taux d'acceptation), gains et serie `par_jour` (absente pour `tout`).
const fetchStatistics = async (periode = '30j') => {
  const { data } = await api.get('/livreur/statistiques', { params: { periode } });
  return data;
};

const earningsService = {
  fetchBalance,
  fetchHistory,
  fetchStatistics,
  requestWithdrawal,
};

export default earningsService;
