import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEcho, disconnectEcho, subscribeConnectionState } from '../services/echo';
import { useRealtimeWithNotifications } from './useRealtimeUpdates';
import { fetchActiveMissions, fetchAvailableMissions, fetchMissionHistory } from '../store/slices/missionsSlice';
import { fetchMarketplaceAvailable, fetchMarketplaceMine } from '../store/slices/marketplaceSlice';
import { fetchBalance } from '../store/slices/earningsSlice';
import { fetchAbonnementStatus } from '../store/slices/abonnementSlice';
import { fetchProfile } from '../store/slices/authSlice';

// Orchestrateur temps reel, monte une fois dans App :
//  1. Connexion Echo (Reverb) des que le livreur est authentifie, fermeture a
//     la deconnexion — meme approche que client-app.
//  2. Ecoute globale des evenements (useRealtimeWithNotifications).
//  3. Aucune notification manquee n'est rattrapable (PARCOURS_LIVREUR_API.md §7.4) :
//     rechargement des donnees metier au demarrage, au retour au premier plan,
//     au retour du reseau et a chaque reconnexion du WebSocket.

export function refreshAll(dispatch) {
  dispatch(fetchProfile());
  dispatch(fetchActiveMissions());
  dispatch(fetchAvailableMissions());
  dispatch(fetchMarketplaceAvailable());
  dispatch(fetchMarketplaceMine());
  dispatch(fetchBalance());
  dispatch(fetchAbonnementStatus());
}

// Rafraichissement manuel des missions (bouton "Actualiser").
export function refreshMissions(dispatch, historyStatut = '') {
  dispatch(fetchActiveMissions());
  dispatch(fetchAvailableMissions());
  dispatch(fetchMissionHistory({ statut: historyStatut, page: 1 }));
  dispatch(fetchMarketplaceAvailable());
  dispatch(fetchMarketplaceMine());
}

const MIN_REFRESH_INTERVAL = 15000; // anti-rafale

export default function useRealtime() {
  const dispatch = useDispatch();
  const { isAuthenticated, isDevBypass } = useSelector((state) => state.auth);
  const token = useSelector((state) => state.auth.token);
  const lastRefresh = useRef(0);
  const live = isAuthenticated && !isDevBypass;

  // 1. Cycle de vie de la connexion Echo (recreee si le token change).
  useEffect(() => {
    if (!live) return undefined;
    getEcho();
    return () => disconnectEcho();
  }, [live, token]);

  // 2. Ecoute globale : store + fil d'activite + toasts.
  useRealtimeWithNotifications({ enabled: live });

  // 3. Chargement initial + rattrapage.
  useEffect(() => {
    if (!live) return undefined;

    const refresh = (force = false) => {
      if (!force && Date.now() - lastRefresh.current < MIN_REFRESH_INTERVAL) return;
      lastRefresh.current = Date.now();
      refreshAll(dispatch);
    };

    refresh(true);

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const onOnline = () => refresh();

    // Reconnexion du WebSocket apres une coupure : des evenements ont pu etre
    // perdus pendant l'interruption.
    let wasDisconnected = false;
    const unsubscribeState = subscribeConnectionState((state) => {
      if (state === 'unavailable' || state === 'disconnected' || state === 'failed') wasDisconnected = true;
      if (state === 'connected' && wasDisconnected) {
        wasDisconnected = false;
        refresh(true);
      }
    });

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      unsubscribeState();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [dispatch, live]);
}
