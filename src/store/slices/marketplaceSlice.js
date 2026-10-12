import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import marketplaceService from '../../services/marketplaceService';
import { apiErrorMessage } from '../../services/api';
import { geoParams } from './missionsSlice';

// Livraisons Marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §7) :
//  - available : livraisons reseau en attente d'offres
//  - mine      : livraisons qui me sont proposees (affectation directe, 15 min)
//                ou assignees (tous statuts), avec adresses/contacts complets
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

const isExpired = (expireLe) => {
  const t = Date.parse(expireLe ?? '');
  return Number.isFinite(t) && t <= Date.now();
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
  async (_, { getState, rejectWithValue }) => {
    try {
      // Meme filtre geographique que les missions express (missionsSlice.geoFilter).
      const data = await marketplaceService.fetchAvailable(geoParams(getState()));
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

// Detail d'une livraison qui m'est assignee (§7.8). 404 -> null (plus a moi).
export const fetchMarketplaceDetail = createAsyncThunk(
  'marketplace/fetchDetail',
  async (id, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.fetchOne(id);
      return { id, livraison: data?.livraison ?? null };
    } catch (err) {
      if (err.response?.status === 404) return { id, livraison: null };
      return rejectWithValue(failure(err, 'Impossible de charger cette livraison.'));
    }
  }
);

// Affectation directe par le vendeur : accepter (§7.4).
export const acceptMarketplaceProposal = createAsyncThunk(
  'marketplace/accept',
  async (id, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.accept(id);
      return { id, livraison: data?.livraison };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, "Impossible d'accepter cette livraison."));
    }
  }
);

export const refuseMarketplaceProposal = createAsyncThunk(
  'marketplace/refuse',
  async ({ id, motif }, { rejectWithValue }) => {
    try {
      await marketplaceService.refuse(id, motif);
      return id;
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de refuser cette livraison.'));
    }
  }
);

// Demarrage avec preuve de retrait optionnelle (photo, signature, position).
export const startMarketplaceDelivery = createAsyncThunk(
  'marketplace/start',
  async ({ id, proof }, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.start(id, proof);
      return { id, livraison: data?.livraison };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Cette livraison ne peut pas être démarrée.'));
    }
  }
);

// Validation par code + preuve de remise optionnelle.
export const validateMarketplaceDelivery = createAsyncThunk(
  'marketplace/validate',
  async ({ id, code, photo, signature, lat, lng }, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.validate(id, { code, photo, signature, lat, lng });
      return { id, message: data?.message };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Code de validation incorrect.'));
    }
  }
);

const patchMine = (state, id, patch) => {
  state.mine.items = state.mine.items.map((l) => (String(l.id) === String(id) ? { ...l, ...patch } : l));
};

const upsertMine = (state, livraison) => {
  if (!livraison?.id) return;
  const exists = state.mine.items.some((l) => String(l.id) === String(livraison.id));
  if (exists) patchMine(state, livraison.id, livraison);
  else state.mine.items = [livraison, ...state.mine.items];
};

const removeMine = (state, id) => {
  state.mine.items = state.mine.items.filter((l) => String(l.id) !== String(id));
};

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    clearMarketplaceOffer(state, action) {
      delete state.offers[action.payload];
      saveOffers(state.offers);
    },
    // Livraison recue en temps reel (ex. `proposee`) avant le rechargement de la liste.
    upsertMarketplaceLivraison(state, action) {
      upsertMine(state, action.payload);
    },
    // Proposition refusee / expiree : elle ne m'appartient plus.
    removeMarketplaceLivraison(state, action) {
      removeMine(state, action.payload);
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
        // Une proposition recue par WebSocket peut ne pas figurer dans
        // `mes-livraisons` : on la garde tant qu'elle n'a pas expire.
        const ids = new Set(action.payload.map((l) => String(l.id)));
        const pendingProposals = state.mine.items.filter((l) => (
          l.statut === 'proposee' && !ids.has(String(l.id)) && !isExpired(l.expire_le)
        ));
        state.mine = { items: [...pendingProposals, ...action.payload], status: 'idle', error: null, blocked: false, loaded: true };
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

      .addCase(fetchMarketplaceDetail.fulfilled, (state, action) => {
        const { id, livraison } = action.payload;
        if (livraison) upsertMine(state, livraison);
        else {
          // 404 : plus assignee a moi (sauf proposition en attente, non exposee par ce detail).
          const current = state.mine.items.find((l) => String(l.id) === String(id));
          if (current && current.statut !== 'proposee') removeMine(state, id);
        }
      })

      .addCase(acceptMarketplaceProposal.pending, (state, action) => { state.pendingAction = action.meta.arg; })
      .addCase(acceptMarketplaceProposal.rejected, (state) => { state.pendingAction = null; })
      .addCase(acceptMarketplaceProposal.fulfilled, (state, action) => {
        state.pendingAction = null;
        patchMine(state, action.payload.id, { ...(action.payload.livraison || {}), statut: 'assignee' });
      })

      .addCase(refuseMarketplaceProposal.pending, (state, action) => { state.pendingAction = action.meta.arg.id; })
      .addCase(refuseMarketplaceProposal.rejected, (state) => { state.pendingAction = null; })
      .addCase(refuseMarketplaceProposal.fulfilled, (state, action) => {
        state.pendingAction = null;
        removeMine(state, action.payload);
      })

      .addCase(startMarketplaceDelivery.pending, (state, action) => { state.pendingAction = action.meta.arg.id; })
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

export const { clearMarketplaceOffer, upsertMarketplaceLivraison, removeMarketplaceLivraison } = marketplaceSlice.actions;

export const selectMarketplaceById = (state, id) => {
  const { available, mine } = state.marketplace;
  return [...mine.items, ...available.items].find((l) => String(l.id) === String(id)) || null;
};

export default marketplaceSlice.reducer;
