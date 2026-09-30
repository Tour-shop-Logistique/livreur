import axios from 'axios';

// VITE_API_URL est injecté au build (variable `VITE_`). On enlève un éventuel
// slash final pour composer proprement `${API_URL}/api`.
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// - Dev  : baseURL relatif `/api` -> réécrit par le proxy Vite (vite.config.js)
//          vers VITE_API_URL. Même origine côté navigateur, aucun CORS.
// - Prod : pas de proxy -> on appelle directement le domaine de l'API. Requiert
//          que le backend autorise le CORS pour l'origine de l'app (config/cors.php).
const baseURL = import.meta.env.PROD && API_URL ? `${API_URL}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // A 401 means the Sanctum token is gone or was revoked (y compris lors d'un
    // blocage d'abonnement marketplace). Drop the local session and let the
    // store react (redirect to /connexion).
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    // 403 ABONNEMENT_BLOQUE (MARKETPLACE_ET_ABONNEMENT_API.md §9.6) : a distinguer
    // d'un 403 d'autorisation classique -> ecran de regularisation.
    if (status === 403 && error.response?.data?.code === 'ABONNEMENT_BLOQUE') {
      window.dispatchEvent(new Event('abonnement:bloque'));
    }
    return Promise.reject(error);
  }
);

// Construit un FormData en ignorant les valeurs vides (null/undefined/'').
export const toFormData = (fields) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    form.append(key, value);
  });
  return form;
};

export const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

// Message d'erreur lisible a partir d'une reponse `{ success:false, message, errors }`.
export const apiErrorMessage = (err, fallback = 'Une erreur est survenue.') => {
  const data = err?.response?.data;
  if (data?.message && data.message !== 'Erreur de validation des données.') return data.message;
  const first = data?.errors && typeof data.errors === 'object'
    ? Object.values(data.errors).flat().find(Boolean)
    : null;
  if (first) return first;
  if (data?.message) return data.message;
  if (!err?.response) return 'Connexion impossible. Verifiez votre reseau.';
  return fallback;
};

export default api;
