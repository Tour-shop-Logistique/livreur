import { useEffect, useRef, useCallback } from 'react';
import { getEcho, disconnectEcho } from '../services/echo';

// Portage du hook WebSocket de client-app (lui-meme issu d'agence-partenaire),
// adapte au livreur :
//   - deux canaux : `livreur.{userId}` (prive) et `livreurs.reseau` (reseau)
//   - meme evenement generique `.model.updated`, payload
//     { model, action, data, ids, references, changes, count, at }
//   - meme registre partage : plusieurs composants peuvent ecouter un canal,
//     mais un seul channel.listen() reel est pose par canal, qui redispatche
//     ensuite vers tous les callbacks inscrits.
//
// Evenements livreur (PARCOURS_LIVREUR_API.md §7.2) :
//   Mission              nouvelle_disponible (reseau) | assignee | cloturee
//   LivraisonMarketplace nouvelle_disponible (reseau) | assignee | cloturee

const channelListeners = new Map(); // channelName -> Set<callback>
const channelRefs = new Map(); // channelName -> { echo, channel }

const debug = (...args) => {
  if (import.meta.env.DEV) console.log(...args);
};

// `model` peut arriver en nom court ("Mission") ou FQCN ("App\\Models\\Mission").
const shortModel = (model) => String(model || '').split('\\').pop();

// `data` est un tableau d'objets (cf. WEBSOCKET_EVENTS_REFERENCE.md) ; on
// tolere aussi un objet seul.
const normalize = (payload, channel) => {
  const data = Array.isArray(payload?.data) ? payload.data : payload?.data ? [payload.data] : [];
  const ids = Array.isArray(payload?.ids) && payload.ids.length ? payload.ids : data.map((d) => d?.id).filter(Boolean);
  return {
    model: shortModel(payload?.model),
    action: payload?.action,
    data,
    meta: {
      ids,
      id: ids[0] ?? null,
      references: payload?.references || [],
      changes: payload?.changes || {},
      count: payload?.count ?? data.length,
      at: payload?.at,
      channel,
    },
  };
};

const ROUTES = {
  Mission: {
    nouvelle_disponible: 'onMissionAvailable',
    assignee: 'onMissionAssigned',
    cloturee: 'onMissionClosed',
  },
  LivraisonMarketplace: {
    nouvelle_disponible: 'onMarketplaceAvailable',
    assignee: 'onMarketplaceAssigned',
    cloturee: 'onMarketplaceClosed',
  },
};

function subscribe(echo, channelName, callback) {
  if (!channelListeners.has(channelName)) channelListeners.set(channelName, new Set());
  channelListeners.get(channelName).add(callback);

  // Re-abonnement si l'instance Echo a change (deconnexion puis reconnexion).
  if (channelRefs.get(channelName)?.echo !== echo) {
    debug(`[WebSocket] Abonnement au canal : ${channelName}`);
    const channel = echo.private(channelName);
    channelRefs.set(channelName, { echo, channel });

    channel.subscribed(() => debug(`[WebSocket] Abonne au canal : ${channelName}`));
    channel.error((error) => console.error(`[WebSocket] Erreur sur le canal ${channelName} :`, error));
    channel.listen('.model.updated', (payload) => {
      channelListeners.get(channelName)?.forEach((cb) => cb(payload, channelName));
    });
  }
}

function unsubscribe(echo, channelName, callback) {
  const listeners = channelListeners.get(channelName);
  if (!listeners) return;
  listeners.delete(callback);
  if (listeners.size === 0) {
    debug(`[WebSocket] Desabonnement du canal : ${channelName}`);
    echo.leave(channelName);
    channelListeners.delete(channelName);
    channelRefs.delete(channelName);
  }
}

/**
 * Hook d'abonnement WebSocket du livreur.
 *
 * @param {string|null} userId - ID (uuid) du User livreur connecte.
 * @param {Object} handlers - (data[], meta) => void
 * @param {Function} handlers.onMissionAvailable     - Nouvelle mission express ouverte aux offres.
 * @param {Function} handlers.onMissionAssigned      - Mission assignee par le backoffice (groupage).
 * @param {Function} handlers.onMissionClosed        - Mission cloturee (offre acceptee, gagnant ou non).
 * @param {Function} handlers.onMarketplaceAvailable - Nouvelle livraison marketplace sur le reseau.
 * @param {Function} handlers.onMarketplaceAssigned  - Livraison marketplace assignee directement.
 * @param {Function} handlers.onMarketplaceClosed    - Livraison marketplace cloturee.
 * @param {Function} handlers.onAny                  - Tout evenement (model, action, data, meta).
 * @param {boolean} enabled - Active/desactive l'ecoute (defaut : true).
 */
export function useWebSocket(userId, handlers = {}, enabled = true) {
  const handlersRef = useRef(handlers);

  // Garde la reference des handlers a jour sans re-declencher l'abonnement.
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Routeur unifie pour tous les evenements `.model.updated`.
  const handleModelUpdate = useCallback((payload, channelName) => {
    const { model, action, data, meta } = normalize(payload, channelName);
    debug('[WebSocket] Message recu :', { channel: channelName, model, action, ids: meta.ids, at: meta.at });

    const h = handlersRef.current;
    h.onAny?.(model, action, data, meta);

    const handlerName = ROUTES[model]?.[action];
    if (handlerName && h[handlerName]) {
      h[handlerName](data, meta);
    } else if (!handlerName) {
      debug(`[WebSocket] Evenement ignore : ${model}.${action}`);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !userId) return undefined;

    const echo = getEcho();
    if (!echo) return undefined;

    const channels = [`livreur.${userId}`, 'livreurs.reseau'];
    channels.forEach((name) => subscribe(echo, name, handleModelUpdate));

    return () => {
      channels.forEach((name) => unsubscribe(echo, name, handleModelUpdate));
    };
  }, [userId, enabled, handleModelUpdate]);

  return { disconnect: disconnectEcho };
}

export default useWebSocket;
