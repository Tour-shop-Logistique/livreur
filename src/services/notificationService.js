import api from './api';

// Historique persiste des notifications push (PARCOURS_LIVREUR_API.md §7.3 et
// NOTIFICATIONS_A_INTEGRER.md). Partage entre tous les appareils du livreur ;
// seule garantie de visibilite pour les notifications KYC (le push peut n'avoir
// atteint personne avant la premiere connexion).

// GET /livreur/notifications?page= — pagine 20/page.
const fetchPage = async (page = 1) => {
  const { data } = await api.get('/livreur/notifications', { params: { page } });
  return data?.notifications ?? data;
};

// POST /livreur/notifications/{id}/lue — 404 si pas au livreur.
const markRead = async (id) => {
  const { data } = await api.post(`/livreur/notifications/${id}/lue`);
  return data;
};

// POST /livreur/notifications/tout-lire
const markAllRead = async () => {
  const { data } = await api.post('/livreur/notifications/tout-lire');
  return data;
};

const notificationService = {
  fetchPage,
  markRead,
  markAllRead,
};

export default notificationService;
