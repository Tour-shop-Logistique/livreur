import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import missionService from '../../services/missionService';
import { apiErrorMessage } from '../../services/api';
import { expeditionPatchAfter } from '../../utils/missionFlow';
import { loadPreferredCity, savePreferredCity } from '../../utils/cityFilter';

// Missions d'expedition classiques (PARCOURS_LIVREUR_API.md §4) :
//  - proposals : missions groupage `proposee` par le backoffice, a accepter ou
//                refuser sous 15 min (§4.1bis)
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
  proposals: { items: [], status: 'idle', error: null, loaded: false },
  active: { items: [], status: 'idle', error: null, loaded: false },
  history: { items: [], status: 'idle', error: null, page: 1, lastPage: 1, statut: '', loaded: false },
  available: { items: [], status: 'idle', error: null, loaded: false },
  offers: loadOffers(),
  pendingAction: null, // id de la mission en cours d'action
  incoming: null, // id d'une mission express tout juste publiee (feuille "Nouvelle mission")
  // Filtre geographique des listes "disponibles" (missions express ET livraisons
  // marketplace, §4.5 / MARKETPLACE §7.1) : par defaut la ville du profil
  // (cote serveur) ; `ville` = autre ville (memorisee), `lat`/`lng` = pres de moi.
  geoFilter: { ville: loadPreferredCity(), lat: null, lng: null },
};

// Parametres de requete issus du filtre (la position prime sur la ville).
export const geoParams = (state) => {
  const { ville, lat, lng } = state.missions.geoFilter;
  if (lat != null && lng != null) return { lat, lng, ville: ville || undefined };
  return { ville: ville || undefined };
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

export const fetchMissionProposals = createAsyncThunk(
  'missions/fetchProposals',
  async (_, { rejectWithValue }) => {
    try {
      return paginated(await missionService.fetchMissions({ statut: 'proposee' })).items;
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de charger les missions proposées.'));
    }
  }
);

export const acceptMissionProposal = createAsyncThunk(
  'missions/acceptProposal',
  async (missionId, { rejectWithValue }) => {
    try {
      const data = await missionService.acceptProposal(missionId);
      return { missionId, mission: data?.mission };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, "Impossible d'accepter cette mission."));
    }
  }
);

export const refuseMissionProposal = createAsyncThunk(
  'missions/refuseProposal',
  async ({ missionId, motif }, { rejectWithValue }) => {
    try {
      await missionService.refuseProposal(missionId, motif);
      return missionId;
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de refuser cette mission.'));
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
  async (_, { getState, rejectWithValue }) => {
    try {
      const data = await missionService.fetchAvailableMissions(geoParams(getState()));
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
    // payload : { ville?, lat?, lng? } — remplace le filtre courant.
    setGeoFilter(state, action) {
      const { ville = '', lat = null, lng = null } = action.payload || {};
      state.geoFilter = { ville, lat, lng };
      savePreferredCity(ville);
    },
    removeProposal(state, action) {
      state.proposals.items = state.proposals.items.filter((m) => String(m.id) !== String(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMissionProposals.pending, (state) => { state.proposals.status = 'loading'; state.proposals.error = null; })
      .addCase(fetchMissionProposals.fulfilled, (state, action) => {
        state.proposals = { items: action.payload, status: 'idle', error: null, loaded: true };
      })
      .addCase(fetchMissionProposals.rejected, (state, action) => {
        state.proposals.status = 'error';
        state.proposals.error = action.payload;
        state.proposals.loaded = true;
      })

      .addCase(acceptMissionProposal.pending, (state, action) => { state.pendingAction = action.meta.arg; })
      .addCase(acceptMissionProposal.rejected, (state) => { state.pendingAction = null; })
      .addCase(acceptMissionProposal.fulfilled, (state, action) => {
        state.pendingAction = null;
        const { missionId, mission } = action.payload;
        const proposal = state.proposals.items.find((m) => String(m.id) === String(missionId));
        state.proposals.items = state.proposals.items.filter((m) => String(m.id) !== String(missionId));
        const accepted = { ...(proposal || {}), ...(mission || {}), statut: 'assignee' };
        if (!mission?.expedition && proposal?.expedition) accepted.expedition = proposal.expedition;
        if (accepted.id && !state.active.items.some((m) => String(m.id) === String(missionId))) {
          state.active.items = [accepted, ...state.active.items];
        }
      })

      .addCase(refuseMissionProposal.pending, (state, action) => { state.pendingAction = action.meta.arg.missionId; })
      .addCase(refuseMissionProposal.rejected, (state) => { state.pendingAction = null; })
      .addCase(refuseMissionProposal.fulfilled, (state, action) => {
        state.pendingAction = null;
        state.proposals.items = state.proposals.items.filter((m) => String(m.id) !== String(action.payload));
      })

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

export const {
  removeAvailable, clearOffer, setIncoming, clearIncoming, removeProposal, setGeoFilter,
} = missionsSlice.actions;

export const selectMissionById = (state, id) => {
  const {
    proposals, active, history, available,
  } = state.missions;
  return [...active.items, ...proposals.items, ...history.items, ...available.items]
    .find((m) => String(m.id) === String(id)) || null;
};

export default missionsSlice.reducer;
