import { createSlice } from '@reduxjs/toolkit';

// Il n'existe AUCUN historique de notifications cote API pour le livreur
// (PARCOURS_LIVREUR_API.md §7.4). Ce fil d'activite est donc local : il est
// alimente par les evenements WebSocket recus pendant que l'app est ouverte
// (cf. hooks/useRealtime) et conserve sur l'appareil (50 derniers).

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

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: load() },
  reducers: {
    // payload : { kind, titre, message, link? }
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
  },
});

export const { pushActivity, markAllRead, markRead, clearActivity } = notificationsSlice.actions;
export const selectUnreadCount = (state) => state.notifications.items.filter((n) => !n.lue).length;
export default notificationsSlice.reducer;
