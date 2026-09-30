import api, { toFormData, multipart } from './api';

// Parcours livreur (PARCOURS_LIVREUR_API.md §1-§3) :
//   POST /register-livreur (multipart, KYC) -> POST /verify-email -> attente de
//   validation backoffice (login renvoie "Votre compte est désactivé.") -> POST /login
//   -> GET /livreur/profil pour la fiche Livreur complete (vehicule, KYC).
// Seul `login` renvoie un token Sanctum (`Authorization: Bearer <token>`).

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const ACCOUNT_TYPE = 'livreur';

const persistUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const persistSession = ({ user, token }) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  persistUser(user);
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// POST /register-livreur (hors auth) — multipart a cause des fichiers KYC.
// Le compte est cree inactif (statut_validation = en_attente), aucun token renvoye.
const registerLivreur = async (form) => {
  const payload = toFormData({
    nom: form.nom,
    prenoms: form.prenoms,
    telephone: form.telephone,
    indicatif_telephone: form.indicatifTelephone,
    email: form.email,
    password: form.password,
    password_confirmation: form.passwordConfirmation,
    code_pays: form.codePays,
    type_piece_identite: form.typePieceIdentite,
    numero_piece_identite: form.numeroPieceIdentite,
    piece_identite: form.pieceIdentite,
    photo_profil: form.photoProfil,
    type_vehicule: form.typeVehicule,
    numero_vehicule: form.numeroVehicule,
    permis_de_conduire: form.permisDeConduire,
    zone_de_livraison_km: form.zoneDeLivraisonKm,
  });
  const { data } = await api.post('/register-livreur', payload, multipart);
  return data;
};

// POST /verify-email — le compte reste inactif tant que le backoffice n'a pas valide.
const verifyEmail = async ({ email, code }) => {
  const { data } = await api.post('/verify-email', { email, code });
  return data;
};

const resendEmailVerification = async (email) => {
  const { data } = await api.post('/resend-email-verification', { email });
  return data;
};

// POST /login — `email` OU `telephone` + `password`, `type: "livreur"` obligatoire.
// Ne renvoie que le User brut : la fiche Livreur vient de GET /livreur/profil.
const login = async ({ email, telephone, password }) => {
  const payload = { password, type: ACCOUNT_TYPE };
  if (email) payload.email = email;
  if (telephone) payload.telephone = telephone;
  const { data } = await api.post('/login', payload);
  if (data?.token) persistSession({ user: data.user, token: data.token });
  return data;
};

// Porte derobee de developpement : simule une session sans toucher au backend.
// Le bloc entier est conditionne sur `import.meta.env.DEV`, que Vite remplace
// par la constante `false` au build de production : terser elimine alors ce
// bloc — aucune trace du token/des identifiants factices ne part en prod.
let isDevBypassToken = () => false;
let startDevBypass = () => null;

if (import.meta.env.DEV) {
  const DEV_BYPASS_TOKEN = 'dev-bypass-token';
  isDevBypassToken = (token) => token === DEV_BYPASS_TOKEN;
  startDevBypass = () => {
    const user = {
      id: 'dev-bypass', nom: 'Demo', prenoms: 'Livreur', email: 'demo@tourshop.local',
      telephone: '+2250700000000', type: 'livreur', actif: true, disponible: true, solde_livreur: '0',
      livreur: { type_vehicule: 'moto', statut_validation: 'valide', numero_vehicule: 'AB-1234-CI', zone_de_livraison_km: 15 },
    };
    persistSession({ user, token: DEV_BYPASS_TOKEN });
    return user;
  };
}

const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

const logout = async () => {
  try {
    if (!isDevBypassToken(getStoredToken())) {
      await api.post('/logout');
    }
  } finally {
    clearSession();
  }
};

// GET /livreur/profil — User + fiche Livreur (vehicule, KYC, backoffice).
const fetchLivreurProfile = async () => {
  const { data } = await api.get('/livreur/profil');
  persistUser(data?.user);
  return data;
};

// PUT /livreur/vehicule — champs optionnels, ne touche pas au statut KYC.
const updateVehicle = async ({ typeVehicule, numeroVehicule, permisDeConduire, zoneDeLivraisonKm }) => {
  const payload = {};
  if (typeVehicule !== undefined) payload.type_vehicule = typeVehicule;
  if (numeroVehicule !== undefined) payload.numero_vehicule = numeroVehicule;
  if (permisDeConduire !== undefined) payload.permis_de_conduire = permisDeConduire;
  if (zoneDeLivraisonKm !== undefined && zoneDeLivraisonKm !== '') payload.zone_de_livraison_km = Number(zoneDeLivraisonKm);
  const { data } = await api.put('/livreur/vehicule', payload);
  return data;
};

// PUT /profile/update — nom, prenoms, telephone, indicatif, email (code_pays interdit).
const updateProfile = async ({ nom, prenoms, telephone, indicatifTelephone, email }) => {
  const { data } = await api.put('/profile/update', {
    nom, prenoms, telephone, indicatif_telephone: indicatifTelephone, email,
  });
  return data;
};

// PUT /profile/change-password — revoque TOUS les tokens (deconnexion forcee).
const changePassword = async ({ currentPassword, password, passwordConfirmation }) => {
  const { data } = await api.put('/profile/change-password', {
    current_password: currentPassword,
    password,
    password_confirmation: passwordConfirmation,
  });
  return data;
};

// PUT /profile/availability — bloque les offres express / l'assignation groupage si false.
const setAvailability = async (disponible) => {
  const { data } = await api.put('/profile/availability', { disponible });
  return data;
};

const forgotPassword = async (email) => {
  const { data } = await api.post('/forgot-password', { email });
  return data;
};

const verifyResetCode = async ({ email, code }) => {
  const { data } = await api.post('/verify-reset-code', { email, code });
  return data;
};

const resetPassword = async ({ email, code, password, passwordConfirmation }) => {
  const { data } = await api.post('/reset-password', {
    email,
    code,
    password,
    password_confirmation: passwordConfirmation,
  });
  clearSession();
  return data;
};

const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const authService = {
  registerLivreur,
  verifyEmail,
  resendEmailVerification,
  login,
  logout,
  fetchLivreurProfile,
  updateVehicle,
  updateProfile,
  changePassword,
  setAvailability,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getStoredUser,
  getStoredToken,
  persistUser,
  clearSession,
  startDevBypass,
  isDevBypassToken,
};

export default authService;
