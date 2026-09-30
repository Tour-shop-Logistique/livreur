import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from './api';

// Meme approche que client-app et agence-partenaire : une seule instance Echo
// partagee (singleton), connexion Laravel Reverb, autorisation des canaux prives
// deleguee a l'API existante via POST /broadcasting/auth (token Sanctum injecte
// par l'intercepteur axios).
//
// Canaux du livreur (PARCOURS_LIVREUR_API.md §7.1) :
//   - `livreur.{userId}` : prive, le livreur lui-meme
//   - `livreurs.reseau`  : tout livreur connecte (autorise cote serveur)
// Evenement unique `.model.updated`, payload
//   { model, action, data, ids, references, changes, count, at }.

window.Pusher = Pusher;

const debug = (...args) => {
  if (import.meta.env.DEV) console.log(...args);
};

let echoInstance = null;

// --- Etat de connexion observable (indicateur UI, rattrapage a la reconnexion) ---
// 'idle' (pas d'Echo) | 'connecting' | 'connected' | 'disconnected' | 'unavailable' | 'failed'
let connectionState = 'idle';
const stateListeners = new Set();

const setConnectionState = (next) => {
  if (next === connectionState) return;
  connectionState = next;
  stateListeners.forEach((listener) => listener(next));
};

export const getConnectionState = () => connectionState;

export const subscribeConnectionState = (listener) => {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
};

export const isRealtimeConfigured = () => Boolean(import.meta.env.VITE_REVERB_APP_KEY && import.meta.env.VITE_REVERB_HOST);

/**
 * Cree (une seule fois) et retourne l'instance Echo.
 * @returns {Echo|null} null si le temps reel n'est pas configure ou sans token.
 */
export function getEcho() {
  if (echoInstance) return echoInstance;

  if (!isRealtimeConfigured()) {
    debug('[Echo] Temps reel non configure (VITE_REVERB_*), mode rafraichissement uniquement');
    return null;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    debug('[Echo] Impossible de creer Echo : aucun token disponible');
    return null;
  }

  debug('[Echo] Initialisation de la connexion WebSocket…');

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],

    // Authentification custom : on reutilise l'instance axios `api` (baseURL
    // `/api`, header Authorization: Bearer <token>) pour chaque canal prive.
    authorizer: (channel) => ({
      authorize(socketId, callback) {
        api
          .post('/broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
          .then((res) => {
            debug('[Echo] Canal autorise :', channel.name);
            callback(false, res.data);
          })
          .catch((err) => {
            console.error("[Echo] Erreur d'autorisation :", channel.name, err?.response?.status);
            callback(true, err);
          });
      },
    }),
  });

  const connection = echoInstance.connector.pusher.connection;
  setConnectionState(connection.state === 'initialized' ? 'connecting' : connection.state);

  connection.bind('state_change', ({ previous, current }) => {
    debug(`[Echo] Etat : ${previous} → ${current}`);
    setConnectionState(current === 'initialized' ? 'connecting' : current);
  });
  connection.bind('connected', () => debug('[Echo] WebSocket connecte, socket :', echoInstance?.socketId()));
  connection.bind('error', (err) => console.error('[Echo] Erreur WebSocket :', err));

  return echoInstance;
}

/** Deconnecte et reinitialise l'instance Echo (a la deconnexion). */
export function disconnectEcho() {
  if (echoInstance) {
    debug('[Echo] Deconnexion…');
    echoInstance.disconnect();
    echoInstance = null;
  }
  setConnectionState('idle');
}

/** Reinitialise Echo (apres un changement de token). */
export function resetEcho() {
  disconnectEcho();
  return getEcho();
}
