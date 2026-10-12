// Au blocage pour retard d'abonnement, le backend revoque tous les tokens juste
// apres la notification AbonnementBloquePushNotification (NOTIFICATIONS_A_INTEGRER.md,
// famille 2) : le 401 qui suit renvoie a la connexion. On memorise la cause pour
// l'expliquer a l'ecran de connexion et rediriger ensuite vers la regularisation.

const KEY = 'livreur_abonnement_bloque';

export const setAbonnementHint = () => {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // non bloquant
  }
};

export const hasAbonnementHint = () => {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export const clearAbonnementHint = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // non bloquant
  }
};

// Echeance depassee sans paiement valide : blocage probable cote serveur.
export const isEcheanceOverdue = (abonnementState) => {
  const { bloque, echeance } = abonnementState || {};
  if (bloque || echeance?.statut === 'en_retard') return true;
  const fin = Date.parse(echeance?.periode_fin ?? '');
  return Number.isFinite(fin) && fin < Date.now() && echeance?.statut !== 'payee';
};

// Contenu d'un push (titre/corps/type) annoncant le blocage.
export const isBlockedPush = (payload) => {
  const text = `${payload?.title || ''} ${payload?.body || ''} ${payload?.data?.type || ''}`.toLowerCase();
  return /abonnement/.test(text) && /(bloqu|suspendu)/.test(text);
};
