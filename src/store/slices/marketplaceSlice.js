import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import marketplaceService from '../../services/marketplaceService';
import { apiErrorMessage } from '../../services/api';

// Livraisons Marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §7) :
//  - available : livraisons reseau en attente d'offres
//  - mine      : livraisons qui me sont assignees (tous statuts)
//  - offers    : mes offres { [livraisonId]: montant }, gardees localement.
// Un 403 ABONNEMENT_BLOQUE est remonte via `blocked` (cf. api.js + abonnementSlice).

const OFFERS_KEY = 'livreur_offres_marketplace';

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
    // non bloquant
  }
};

const listState = () => ({ items: [], status: 'idle', error: null, blocked: false, loaded: false });

const initialState = {
  available: listState(),
  mine: listState(),
  offers: loadOffers(),
  pendingAction: null,
};

const failure = (err, fallback) => ({
  message: apiErrorMessage(err, fallback),
  blocked: err.response?.data?.code === 'ABONNEMENT_BLOQUE',
});

export const fetchMarketplaceAvailable = createAsyncThunk(
  'marketplace/fetchAvailable',
  async (_, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.fetchAvailable();
      return data?.livraisons ?? [];
    } catch (err) {
      return rejectWithValue(failure(err, 'Impossible de charger les livraisons marketplace.'));
    }
  }
);

export const fetchMarketplaceMine = createAsyncThunk(
  'marketplace/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.fetchMine();
      return data?.livraisons ?? [];
    } catch (err) {
      return rejectWithValue(failure(err, 'Impossible de charger vos livraisons marketplace.'));
    }
  }
);

export const proposeMarketplaceOffer = createAsyncThunk(
  'marketplace/proposeOffer',
  async ({ id, montant }, { rejectWithValue }) => {
    try {
      await marketplaceService.proposeOffer(id, montant);
      return { id, montant };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, "Impossible d'envoyer votre offre."));
    }
  }
);

export const withdrawMarketplaceOffer = createAsyncThunk(
  'marketplace/withdrawOffer',
  async (id, { rejectWithValue }) => {
    try {
      await marketplaceService.withdrawOffer(id);
      return id;
    } catch (err) {
      if (err.response?.status === 404) return id;
      return rejectWithValue(apiErrorMessage(err, 'Impossible de retirer votre offre.'));
    }
  }
);

export const startMarketplaceDelivery = createAsyncThunk(
  'marketplace/start',
  async (id, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.start(id);
      return { id, livraison: data?.livraison };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Cette livraison ne peut pas être démarrée.'));
    }
  }
);

export const validateMarketplaceDelivery = createAsyncThunk(
  'marketplace/validate',
  async ({ id, code, photo }, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.validate(id, { code, photo });
      return { id, message: data?.message };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Code de validation incorrect.'));
    }
  }
);

const patchMine = (state, id, patch) => {
  state.mine.items = state.mine.items.map((l) => (l.id === id ? { ...l, ...patch } : l));
};

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    clearMarketplaceOffer(state, action) {
      delete state.offers[action.payload];
      saveOffers(state.offers);
    },
  },
  extraReducers: (builder) => {
    const pending = (key) => (state) => { state[key].status = 'loading'; state[key].error = null; };
    const rejected = (key) => (state, action) => {
      state[key].status = 'error';
      state[key].error = action.payload?.message;
      state[key].blocked = Boolean(action.payload?.blocked);
      state[key].loaded = true;
    };

    builder
      .addCase(fetchMarketplaceAvailable.pending, pending('available'))
      .addCase(fetchMarketplaceAvailable.fulfilled, (state, action) => {
        state.available = { items: action.payload, status: 'idle', error: null, blocked: false, loaded: true };
        const openIds = new Set(action.payload.map((l) => String(l.id)));
        Object.keys(state.offers).forEach((id) => { if (!openIds.has(id)) delete state.offers[id]; });
        saveOffers(state.offers);
      })
      .addCase(fetchMarketplaceAvailable.rejected, rejected('available'))

      .addCase(fetchMarketplaceMine.pending, pending('mine'))
      .addCase(fetchMarketplaceMine.fulfilled, (state, action) => {
        state.mine = { items: action.payload, status: 'idle', error: null, blocked: false, loaded: true };
      })
      .addCase(fetchMarketplaceMine.rejected, rejected('mine'))

      .addCase(proposeMarketplaceOffer.fulfilled, (state, action) => {
        state.offers[action.payload.id] = action.payload.montant;
        saveOffers(state.offers);
      })
      .addCase(withdrawMarketplaceOffer.fulfilled, (state, action) => {
        delete state.offers[action.payload];
        saveOffers(state.offers);
      })

      .addCase(startMarketplaceDelivery.pending, (state, action) => { state.pendingAction = action.meta.arg; })
      .addCase(startMarketplaceDelivery.rejected, (state) => { state.pendingAction = null; })
      .addCase(startMarketplaceDelivery.fulfilled, (state, action) => {
        state.pendingAction = null;
        patchMine(state, action.payload.id, { ...(action.payload.livraison || {}), statut: 'en_cours' });
      })

      .addCase(validateMarketplaceDelivery.pending, (state, action) => { state.pendingAction = action.meta.arg.id; })
      .addCase(validateMarketplaceDelivery.rejected, (state) => { state.pendingAction = null; })
      .addCase(validateMarketplaceDelivery.fulfilled, (state, action) => {
        state.pendingAction = null;
        patchMine(state, action.payload.id, { statut: 'terminee' });
      });
  },
});

export const { clearMarketplaceOffer } = marketplaceSlice.actions;

export const selectMarketplaceById = (state, id) => {
  const { available, mine } = state.marketplace;
  return [...mine.items, ...available.items].find((l) => String(l.id) === String(id)) || null;
};

export default marketplaceSlice.reducer;
