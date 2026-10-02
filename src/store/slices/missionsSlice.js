import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import missionService from '../../services/missionService';
import { apiErrorMessage } from '../../services/api';
import { expeditionPatchAfter } from '../../utils/missionFlow';

// Missions d'expedition classiques (PARCOURS_LIVREUR_API.md §4) :
//  - active    : missions `assignee` (un livreur n'a jamais 2 missions actives)
//  - history   : toutes mes missions, paginees, filtrables par statut
//  - available : missions EXPRESS ouvertes au reseau (offres de prix)
//  - offers    : mes offres envoyees { [missionId]: montant } — l'API ne les
//                renvoie pas dans la liste, on les garde localement.

const OFFERS_KEY = 'livreur_offres_express';

const loadOffers = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFERS_KEY)) || {};
  } catch {
    return {};
  }
};
const saveOffers = (offers) => {
  try {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
  } catch {
    // stockage indisponible (navigation privee) : non bloquant
  }
};

const initialState = {
  active: { items: [], status: 'idle', error: null, loaded: false },
  history: { items: [], status: 'idle', error: null, page: 1, lastPage: 1, statut: '', loaded: false },
  available: { items: [], status: 'idle', error: null, loaded: false },
  offers: loadOffers(),
  pendingAction: null, // id de la mission en cours d'action
  incoming: null, // id d'une mission express tout juste publiee (feuille "Nouvelle mission")
};

const paginated = (data) => {
  const p = data?.missions ?? data;
  if (Array.isArray(p)) return { items: p, page: 1, lastPage: 1 };
  return { items: p?.data ?? [], page: p?.current_page ?? 1, lastPage: p?.last_page ?? 1 };
};

export const fetchActiveMissions = createAsyncThunk(
  'missions/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      return paginated(await missionService.fetchMissions({ statut: 'assignee' })).items;
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de charger vos missions en cours.'));
    }
  }
);

export const fetchMissionHistory = createAsyncThunk(
  'missions/fetchHistory',
  async ({ statut = '', page = 1 } = {}, { rejectWithValue }) => {
    try {
      const res = paginated(await missionService.fetchMissions({ statut, page }));
      return { ...res, statut };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de charger vos missions.'));
    }
  }
);

export const fetchAvailableMissions = createAsyncThunk(
  'missions/fetchAvailable',
  async (_, { rejectWithValue }) => {
    try {
      const data = await missionService.fetchAvailableMissions();
      return data?.missions ?? [];
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de charger les missions disponibles.'));
    }
  }
);

export const proposeOffer = createAsyncThunk(
  'missions/proposeOffer',
  async ({ missionId, montant }, { rejectWithValue }) => {
    try {
      await missionService.proposeOffer(missionId, montant);
      return { missionId, montant };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, "Impossible d'envoyer votre offre."));
    }
  }
);

export const withdrawOffer = createAsyncThunk(
  'missions/withdrawOffer',
  async (missionId, { rejectWithValue }) => {
    try {
      await missionService.withdrawOffer(missionId);
      return missionId;
    } catch (err) {
      // 404 = plus d'offre active cote serveur : on nettoie quand meme localement.
      if (err.response?.status === 404) return missionId;
      return rejectWithValue(apiErrorMessage(err, "Impossible de retirer votre offre."));
    }
  }
);

const ACTIONS = {
  startPickup: (m) => missionService.startPickup(m.expedition_id),
  confirmPickup: (m, proof) => missionService.confirmPickup(m.expedition_id, proof),
  confirmAgencyDrop: (m) => missionService.confirmAgencyDrop(m.expedition_id),
  startDelivery: (m) => missionService.startDelivery(m.expedition_id),
  validateDelivery: (m, proof) => missionService.validateDelivery(m.expedition_id, proof),
};

// Execute l'etape courante du workflow (cf. utils/missionFlow.expeditionAction).
export const runMissionAction = createAsyncThunk(
  'missions/runAction',
  async ({ mission, actionKey, proof }, { rejectWithValue }) => {
    const run = ACTIONS[actionKey];
    if (!run) return rejectWithValue('Action inconnue.');
    try {
      const data = await run(mission, proof);
      return { missionId: mission.id, actionKey, message: data?.message };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, "L'action n'a pas pu être enregistrée."));
    }
  },
  { getPendingMeta: ({ arg }) => ({ missionId: arg.mission.id }) }
);

const mergeMission = (mission, patch) => ({
  ...mission,
  ...patch,
  expedition: { ...(mission.expedition || {}), ...(patch.expedition || {}) },
});

const missionsSlice = createSlice({
  name: 'missions',
  initialState,
  reducers: {
    removeAvailable(state, action) {
      state.available.items = state.available.items.filter((m) => m.id !== action.payload);
    },
    clearOffer(state, action) {
      delete state.offers[action.payload];
      saveOffers(state.offers);
    },
    setIncoming(state, action) {
      state.incoming = action.payload;
    },
    clearIncoming(state) {
      state.incoming = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveMissions.pending, (state) => { state.active.status = 'loading'; state.active.error = null; })
      .addCase(fetchActiveMissions.fulfilled, (state, action) => {
        state.active = { items: action.payload, status: 'idle', error: null, loaded: true };
      })
      .addCase(fetchActiveMissions.rejected, (state, action) => {
        state.active.status = 'error';
        state.active.error = action.payload;
        state.active.loaded = true;
      })

      .addCase(fetchMissionHistory.pending, (state, action) => {
        state.history.status = 'loading';
        state.history.error = null;
        if ((action.meta.arg?.page ?? 1) === 1) state.history.statut = action.meta.arg?.statut ?? '';
      })
      .addCase(fetchMissionHistory.fulfilled, (state, action) => {
        const { items, page, lastPage, statut } = action.payload;
        state.history = {
          items: page > 1 ? [...state.history.items, ...items] : items,
          status: 'idle', error: null, page, lastPage, statut, loaded: true,
        };
      })
      .addCase(fetchMissionHistory.rejected, (state, action) => {
        state.history.status = 'error';
        state.history.error = action.payload;
        state.history.loaded = true;
      })

      .addCase(fetchAvailableMissions.pending, (state) => { state.available.status = 'loading'; state.available.error = null; })
      .addCase(fetchAvailableMissions.fulfilled, (state, action) => {
        state.available = { items: action.payload, status: 'idle', error: null, loaded: true };
        // Les offres sur des missions qui ne sont plus ouvertes sont obsoletes.
        const openIds = new Set(action.payload.map((m) => String(m.id)));
        Object.keys(state.offers).forEach((id) => { if (!openIds.has(id)) delete state.offers[id]; });
        saveOffers(state.offers);
      })
      .addCase(fetchAvailableMissions.rejected, (state, action) => {
        state.available.status = 'error';
        state.available.error = action.payload;
        state.available.loaded = true;
      })

      .addCase(proposeOffer.fulfilled, (state, action) => {
        state.offers[action.payload.missionId] = action.payload.montant;
        saveOffers(state.offers);
      })
      .addCase(withdrawOffer.fulfilled, (state, action) => {
        delete state.offers[action.payload];
        saveOffers(state.offers);
      })

      .addCase(runMissionAction.pending, (state, action) => { state.pendingAction = action.meta.missionId ?? action.meta.arg.mission.id; })
      .addCase(runMissionAction.rejected, (state) => { state.pendingAction = null; })
      .addCase(runMissionAction.fulfilled, (state, action) => {
        state.pendingAction = null;
        const { missionId, actionKey } = action.payload;
        const patch = expeditionPatchAfter(actionKey);
        const apply = (list) => {
          list.items = list.items.map((m) => (m.id === missionId ? mergeMission(m, patch) : m));
        };
        apply(state.active);
        apply(state.history);
        if (patch.statut === 'terminee') {
          const done = state.active.items.find((m) => m.id === missionId);
          state.active.items = state.active.items.filter((m) => m.id !== missionId);
          if (done && !state.history.items.some((m) => m.id === missionId)) {
            state.history.items = [done, ...state.history.items];
          }
        }
      });
  },
});

export const { removeAvailable, clearOffer, setIncoming, clearIncoming } = missionsSlice.actions;

export const selectMissionById = (state, id) => {
  const { active, history, available } = state.missions;
  return [...active.items, ...history.items, ...available.items].find((m) => String(m.id) === String(id)) || null;
};

export default missionsSlice.reducer;
