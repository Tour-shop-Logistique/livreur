import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';
import { apiErrorMessage } from '../../services/api';
import { fetchAbonnementStatus } from './abonnementSlice';
import { fetchBalance, fetchEarningsHistory } from './earningsSlice';
import { ROUTES, missionDetailPath, marketplaceDetailPath } from '../../routes';

// Deux sources reunies dans l'ecran Activite :
//  - server : historique persiste des notifications push (GET /livreur/notifications,
//             PARCOURS_LIVREUR_API.md §7.3), partage entre appareils, marquable lu
//             cote API. Seule garantie pour les notifications KYC / abonnement /
//             retrait (NOTIFICATIONS_A_INTEGRER.md).
//  - items  : fil d'activite local alimente par le WebSocket pendant que l'app est
//             ouverte (evenements sans push : nouvelle livraison marketplace…),
//             conserve sur l'appareil (50 derniers).

const STORAGE_KEY = 'livreur_activite';
const MAX_ITEMS = 50;

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};
const save = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // non bloquant
  }
};

// --- Notifications serveur -> forme commune { kind, titre, message, link } ----

const KIND_RULES = [
  [/inscription.*rejet|rejetee?_?inscription/, 'account_rejected'],
  [/inscription/, 'account'],
  [/abonnement.*bloqu/, 'subscription_blocked'],
  [/paiement.*abonnement.*rejet|abonnement.*rejet/, 'subscription_rejected'],
  [/paiement.*abonnement.*valide|abonnement.*valide/, 'subscription_ok'],
  [/abonnement|echeance/, 'subscription'],
  [/retrait.*rejet/, 'money_rejected'],
  [/retrait/, 'money'],
  [/propos/, 'proposed'],
  [/offre.*refus|non.?retenue/, 'refused'],
  [/refus|expir/, 'refused'],
  [/offre.*accept|accept/, 'accepted'],
  [/assign/, 'assigned'],
  [/disponible/, 'available'],
];

const kindOf = (signature) => KIND_RULES.find(([re]) => re.test(signature))?.[1] || 'info';

const linkOf = (cible, kind) => {
  const type = String(cible?.type || '').toLowerCase();
  if (cible?.id && type.includes('livraison')) return marketplaceDetailPath(cible.id);
  if (cible?.id && type.includes('mission')) return missionDetailPath(cible.id);
  if (kind.startsWith('subscription') || type.includes('abonnement') || type.includes('echeance')) return ROUTES.ABONNEMENT;
  if (kind.startsWith('money') || type.includes('retrait')) return ROUTES.EARNINGS;
  return null;
};

export const mapServerNotification = (n) => {
  const data = n?.data || {};
  const signature = `${data.type || ''} ${n?.type || ''}`.toLowerCase().replace(/[\\]/g, ' ');
  const kind = kindOf(signature);
  return {
    id: `srv-${n.id}`,
    serverId: n.id,
    server: true,
    kind,
    titre: data.titre || data.title || 'Notification',
    message: data.message || data.body || data.motif || '',
    link: data.url || linkOf(data.cible, kind),
    targetId: data.cible?.id ?? null,
    date: n.created_at,
    lue: Boolean(n.read_at),
  };
};

// Effets d'une notification serveur jamais vue : resynchroniser les donnees
// concernees (abonnement debloque, retrait confirme…).
const SIDE_EFFECTS = {
  subscription: [fetchAbonnementStatus],
  subscription_ok: [fetchAbonnementStatus],
  subscription_rejected: [fetchAbonnementStatus],
  subscription_blocked: [fetchAbonnementStatus],
  money: [fetchBalance, fetchEarningsHistory],
  money_rejected: [fetchBalance, fetchEarningsHistory],
};

export const fetchServerNotifications = createAsyncThunk(
  'notifications/fetchServer',
  async ({ page = 1 } = {}, { getState, dispatch, rejectWithValue }) => {
    try {
      const p = await notificationService.fetchPage(page);
      const items = (p?.data ?? []).map(mapServerNotification);
      if (page === 1) {
        const { server } = getState().notifications;
        if (server.loaded) {
          const known = new Set(server.items.map((n) => n.id));
          const fresh = items.filter((n) => !n.lue && !known.has(n.id));
          new Set(fresh.flatMap((n) => SIDE_EFFECTS[n.kind] || [])).forEach((thunk) => dispatch(thunk()));
        }
      }
      return {
        items, page: p?.current_page ?? page, lastPage: p?.last_page ?? 1, total: p?.total ?? items.length,
      };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de charger vos notifications.'));
    }
  }
);

export const markServerNotificationRead = createAsyncThunk(
  'notifications/markServerRead',
  async (serverId, { rejectWithValue }) => {
    try {
      await notificationService.markRead(serverId);
      return serverId;
    } catch (err) {
      if (err.response?.status === 404) return serverId;
      return rejectWithValue(apiErrorMessage(err, 'Action impossible.'));
    }
  }
);

export const markAllServerNotificationsRead = createAsyncThunk(
  'notifications/markAllServerRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllRead();
      return true;
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Action impossible.'));
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: load(),
    server: {
      items: [], page: 1, lastPage: 1, status: 'idle', error: null, loaded: false,
    },
  },
  reducers: {
    // payload : { kind, titre, message, link?, targetId? }
    pushActivity: {
      reducer(state, action) {
        state.items = [action.payload, ...state.items].slice(0, MAX_ITEMS);
        save(state.items);
      },
      prepare(item) {
        return {
          payload: {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date: new Date().toISOString(),
            lue: false,
            ...item,
          },
        };
      },
    },
    // Lecture locale seulement (fil WebSocket) ; le serveur via markAllServer*.
    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, lue: true }));
      save(state.items);
    },
    markRead(state, action) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.lue = true;
      save(state.items);
    },
    clearActivity(state) {
      state.items = [];
      save(state.items);
    },
    resetServerNotifications(state) {
      state.server = {
        items: [], page: 1, lastPage: 1, status: 'idle', error: null, loaded: false,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerNotifications.pending, (state) => { state.server.status = 'loading'; state.server.error = null; })
      .addCase(fetchServerNotifications.fulfilled, (state, action) => {
        const { items, page, lastPage } = action.payload;
        state.server = {
          items: page > 1 ? [...state.server.items, ...items.filter((n) => !state.server.items.some((o) => o.id === n.id))] : items,
          page, lastPage, status: 'idle', error: null, loaded: true,
        };
      })
      .addCase(fetchServerNotifications.rejected, (state, action) => {
        state.server.status = 'error';
        state.server.error = action.payload;
        state.server.loaded = true;
      })
      .addCase(markServerNotificationRead.pending, (state, action) => {
        const item = state.server.items.find((n) => n.serverId === action.meta.arg);
        if (item) item.lue = true;
      })
      .addCase(markAllServerNotificationsRead.pending, (state) => {
        state.server.items = state.server.items.map((n) => ({ ...n, lue: true }));
      });
  },
});

export const {
  pushActivity, markAllRead, markRead, clearActivity, resetServerNotifications,
} = notificationsSlice.actions;

// Fil unifie, sans doublon : un evenement WebSocket qui a aussi produit une
// notification serveur (meme cible, a 3 min pres) n'est affiche qu'une fois.
const DEDUPE_MS = 3 * 60 * 1000;
export const selectActivityFeed = createSelector(
  [(state) => state.notifications.items, (state) => state.notifications.server.items],
  (items, serverItems) => {
    const local = items.filter((a) => !a.targetId || !serverItems.some((s) => (
      String(s.targetId) === String(a.targetId)
      && Math.abs(Date.parse(s.date) - Date.parse(a.date)) < DEDUPE_MS
    )));
    return [...serverItems, ...local].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }
);

export const selectUnreadCount = (state) => selectActivityFeed(state).filter((n) => !n.lue).length;
export default notificationsSlice.reducer;
