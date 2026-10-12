import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useWebSocket } from './useWebSocket';
import {
  getConnectionState, subscribeConnectionState, isRealtimeConfigured,
} from '../services/echo';
import {
  fetchActiveMissions, fetchAvailableMissions, fetchMissionProposals, removeAvailable, clearOffer, setIncoming,
} from '../store/slices/missionsSlice';
import {
  fetchMarketplaceAvailable, fetchMarketplaceMine, clearMarketplaceOffer,
  upsertMarketplaceLivraison, removeMarketplaceLivraison,
} from '../store/slices/marketplaceSlice';
import { fetchAbonnementStatus } from '../store/slices/abonnementSlice';
import { pushActivity, fetchServerNotifications } from '../store/slices/notificationsSlice';
import { isActiveMarketplace } from '../utils/missionFlow';
import { missionCity, sameCity, loadPreferredCity } from '../utils/cityFilter';
import { ROUTES, missionDetailPath, marketplaceDetailPath } from '../routes';

// Couche pratique au-dessus de useWebSocket (meme idee que client-app) :
// branche l'ID du livreur connecte depuis Redux et expose des hooks prets a
// l'emploi. Types d'evenements emis :
//   mission.available | mission.proposed | mission.assigned | mission.closed
//   marketplace.available | marketplace.proposed | marketplace.assigned
//   marketplace.refused | marketplace.closed

const EVENT_TYPES = {
  onMissionAvailable: { type: 'mission.available', group: 'missions' },
  onMissionProposed: { type: 'mission.proposed', group: 'missions' },
  onMissionAssigned: { type: 'mission.assigned', group: 'missions' },
  onMissionClosed: { type: 'mission.closed', group: 'missions' },
  onMarketplaceAvailable: { type: 'marketplace.available', group: 'marketplace' },
  onMarketplaceProposed: { type: 'marketplace.proposed', group: 'marketplace' },
  onMarketplaceAssigned: { type: 'marketplace.assigned', group: 'marketplace' },
  onMarketplaceRefused: { type: 'marketplace.refused', group: 'marketplace' },
  onMarketplaceClosed: { type: 'marketplace.closed', group: 'marketplace' },
};

// Evenements doubles d'une notification push persistee : on recharge
// l'historique serveur (GET /livreur/notifications) peu apres.
const WITH_PUSH = new Set(['mission.available', 'mission.proposed', 'mission.assigned', 'mission.closed', 'marketplace.refused']);

/**
 * Ecoute les evenements temps reel du livreur et appelle `onUpdate(data, meta, eventType)`.
 *
 * @param {Function} onUpdate
 * @param {Object} options
 * @param {Array<string>} options.only - Restreindre a 'missions' et/ou 'marketplace'.
 * @param {boolean} options.enabled
 */
export function useRealtimeUpdates(onUpdate, options = {}) {
  const { only = null, enabled = true } = options;
  const userId = useSelector((state) => state.auth.user?.id);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isDevBypass = useSelector((state) => state.auth.isDevBypass);
  const onlyKey = only ? only.join(',') : '';

  const handlers = useMemo(() => {
    const groups = onlyKey ? onlyKey.split(',') : null;
    return Object.fromEntries(
      Object.entries(EVENT_TYPES)
        .filter(([, { group }]) => !groups || groups.includes(group))
        .map(([name, { type }]) => [name, (data, meta) => onUpdate?.(data, meta, type)])
    );
  }, [onUpdate, onlyKey]);

  useWebSocket(userId, handlers, enabled && isAuthenticated && !isDevBypass && Boolean(userId));
}

/**
 * Suivi temps reel d'une seule mission / livraison (ecran de detail).
 * Ne declenche `onUpdate` que si l'evenement concerne `id`.
 */
export function useRealtimeMission(id, onUpdate, enabled = true) {
  const handle = useCallback((data, meta, eventType) => {
    if (!id) return;
    const target = String(id);
    if (meta.ids.map(String).includes(target) || data.some((d) => String(d?.id) === target)) {
      onUpdate?.(data, meta, eventType);
    }
  }, [id, onUpdate]);

  useRealtimeUpdates(handle, { enabled });
}

/**
 * Ecoute globale (montee une fois dans App) : met a jour le store, alimente le
 * fil d'activite local (aucun historique cote API, §7.4) et affiche un toast.
 */
export function useRealtimeWithNotifications(options = {}) {
  const dispatch = useDispatch();
  const store = useStore();
  const navigate = useNavigate();
  const busy = useRef(new Set()); // anti-doublon si un evenement arrive deux fois

  const handle = useCallback((data, meta, eventType) => {
    const id = meta.id;
    const once = async (key, fn) => {
      if (busy.current.has(key)) return;
      busy.current.add(key);
      try {
        await fn();
      } finally {
        setTimeout(() => busy.current.delete(key), 3000);
      }
    };

    if (WITH_PUSH.has(eventType)) {
      once('notifications.server', async () => {
        await new Promise((r) => { setTimeout(r, 1500); });
        dispatch(fetchServerNotifications());
      });
    }

    switch (eventType) {
      // Mission groupage proposee par le backoffice : a accepter sous 15 min.
      case 'mission.proposed':
        dispatch(fetchMissionProposals());
        dispatch(pushActivity({
          kind: 'proposed',
          titre: 'Nouvelle mission proposée',
          message: 'Le backoffice vous propose une mission. Répondez sous 15 minutes.',
          link: id ? missionDetailPath(id) : ROUTES.MISSIONS,
          targetId: id,
        }));
        toast.info('Nouvelle mission proposée', {
          description: 'Acceptez ou refusez sous 15 minutes.',
          duration: 10000,
          action: id ? { label: 'Voir', onClick: () => navigate(missionDetailPath(id)) } : undefined,
        });
        break;

      // Affectation directe d'un vendeur : a accepter sous 15 min.
      case 'marketplace.proposed':
        data.forEach((l) => l?.id && dispatch(upsertMarketplaceLivraison({ ...l, statut: l.statut || 'proposee' })));
        dispatch(fetchMarketplaceMine());
        dispatch(pushActivity({
          kind: 'proposed',
          titre: 'Livraison marketplace proposée',
          message: 'Un vendeur vous confie une livraison. Répondez sous 15 minutes.',
          link: id ? marketplaceDetailPath(id) : `${ROUTES.MISSIONS}?onglet=encours`,
          targetId: id,
        }));
        toast.info('Livraison marketplace proposée', {
          description: 'Acceptez ou refusez sous 15 minutes.',
          duration: 10000,
          action: id ? { label: 'Voir', onClick: () => navigate(marketplaceDetailPath(id)) } : undefined,
        });
        break;

      // Refus (accuse de reception) ou expiration automatique de la proposition.
      case 'marketplace.refused':
        if (id != null) dispatch(removeMarketplaceLivraison(id));
        dispatch(fetchMarketplaceMine());
        if (meta.action === 'expiree') {
          dispatch(pushActivity({
            kind: 'refused',
            titre: 'Proposition marketplace expirée',
            message: 'Sans réponse sous 15 minutes, la livraison a été rendue au vendeur.',
            targetId: id,
          }));
        }
        break;

      case 'mission.available': {
        dispatch(pushActivity({
          kind: 'available',
          titre: meta.count > 1 ? `${meta.count} nouvelles missions express` : 'Nouvelle mission express disponible',
          message: 'Proposez votre tarif avant les autres livreurs.',
          link: `${ROUTES.MISSIONS}?onglet=disponibles`,
        }));
        once(`mission.available.${id}`, async () => {
          const res = await dispatch(fetchAvailableMissions());
          const state = store.getState();
          if (!state.auth.user?.disponible) return;
          // Livreur libre (aucune mission en cours) : feuille "Nouvelle mission" ;
          // en pleine course on ne l'interrompt pas, un toast suffit.
          const free = state.missions.active.items.length === 0
            && !state.marketplace.mine.items.some(isActiveMarketplace);
          const mission = id != null && meta.count <= 1 && Array.isArray(res.payload)
            ? res.payload.find((m) => String(m.id) === String(id))
            : null;
          const city = loadPreferredCity();
          const inMyCity = !city || sameCity(missionCity(mission), city);
          if (free && mission && inMyCity) dispatch(setIncoming(id));
          else toast.info('Nouvelle mission express disponible', { description: 'Proposez votre tarif.' });
        });
        break;
      }

      // Proposition groupage acceptee (par moi) ou offre express retenue.
      case 'mission.assigned': {
        const wasProposal = id != null && store.getState().missions.proposals.items.some((m) => String(m.id) === String(id));
        dispatch(fetchActiveMissions());
        dispatch(fetchMissionProposals());
        if (!wasProposal) {
          dispatch(pushActivity({
            kind: 'assigned',
            titre: 'Nouvelle mission assignée',
            message: 'Une mission vous a été attribuée.',
            link: id ? missionDetailPath(id) : ROUTES.MISSIONS,
            targetId: id,
          }));
          toast.success('Nouvelle mission assignée');
        }
        break;
      }

      // Envoye a TOUS les offrants (gagnant + refuses) : on recharge ses missions
      // actives pour savoir si son offre a ete retenue.
      case 'mission.closed':
        once(`mission.closed.${id}`, async () => {
          const hadOffer = id != null && store.getState().missions.offers[id] != null;
          if (id != null) {
            dispatch(removeAvailable(id));
            dispatch(clearOffer(id));
          }
          const res = await dispatch(fetchActiveMissions());
          dispatch(fetchAvailableMissions());
          const won = id != null && Array.isArray(res.payload) && res.payload.some((m) => String(m.id) === String(id));
          if (won) {
            dispatch(pushActivity({
              kind: 'accepted',
              titre: 'Offre acceptée',
              message: 'Le client a retenu votre offre. La mission est à vous.',
              link: missionDetailPath(id),
            }));
            toast.success('Votre offre a été acceptée !');
          } else if (hadOffer) {
            dispatch(pushActivity({
              kind: 'refused',
              titre: 'Offre non retenue',
              message: 'Le client a choisi une autre offre pour cette mission.',
            }));
            toast.message('Offre non retenue');
          }
        });
        break;

      case 'marketplace.available':
        dispatch(fetchMarketplaceAvailable());
        dispatch(pushActivity({
          kind: 'available',
          titre: 'Nouvelle livraison marketplace',
          message: 'Une vente attend un livreur sur le réseau.',
          link: `${ROUTES.MISSIONS}?onglet=marketplace`,
          targetId: id,
        }));
        break;

      // Emis apres MON acceptation d'une affectation directe : l'ecran de detail
      // a deja confirme, on se contente de resynchroniser.
      case 'marketplace.assigned':
        dispatch(fetchMarketplaceMine());
        // Une premiere acceptation peut demarrer l'abonnement marketplace.
        dispatch(fetchAbonnementStatus());
        dispatch(pushActivity({
          kind: 'assigned',
          titre: 'Livraison marketplace assignée',
          message: 'La livraison vous est confiée : récupérez l’article chez le vendeur.',
          link: id ? marketplaceDetailPath(id) : `${ROUTES.MISSIONS}?onglet=marketplace`,
          targetId: id,
        }));
        break;

      case 'marketplace.closed':
        once(`marketplace.closed.${id}`, async () => {
          const hadOffer = id != null && store.getState().marketplace.offers[id] != null;
          if (id != null) dispatch(clearMarketplaceOffer(id));
          const res = await dispatch(fetchMarketplaceMine());
          dispatch(fetchMarketplaceAvailable());
          const won = id != null && Array.isArray(res.payload) && res.payload.some((l) => String(l.id) === String(id));
          if (won) {
            dispatch(fetchAbonnementStatus());
            dispatch(pushActivity({
              kind: 'accepted',
              titre: 'Offre marketplace acceptée',
              message: 'Le vendeur a retenu votre offre.',
              link: marketplaceDetailPath(id),
            }));
            toast.success('Votre offre marketplace a été acceptée !');
          } else if (hadOffer) {
            dispatch(pushActivity({
              kind: 'refused',
              titre: 'Offre marketplace non retenue',
              message: 'Le vendeur a choisi une autre offre.',
            }));
          }
        });
        break;

      default:
        break;
    }
  }, [dispatch, store, navigate]);

  useRealtimeUpdates(handle, options);
}

/** Etat de la connexion WebSocket, pour l'indicateur UI. */
export function useRealtimeStatus() {
  const state = useSyncExternalStore(subscribeConnectionState, getConnectionState, getConnectionState);
  return { state, configured: isRealtimeConfigured(), connected: state === 'connected' };
}

export default useRealtimeUpdates;
