import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import marketplaceService from '../../services/marketplaceService';
import { apiErrorMessage } from '../../services/api';
import { geoParams } from './missionsSlice';

// Livraisons Marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §7) :
//  - available : livraisons en attente sur le reseau : `express` (prix impose,
//                premier arrive premier servi) et `standard` (assignee par le
//                backoffice, non acceptable ici) — MARKETPLACE_LIVRAISON_3_MODES.md
//  - mine      : livraisons qui me sont proposees (livreur du magasin, 15 min)
//                ou assignees (tous statuts), avec adresses/contacts complets
// Plus d'offres de prix. Un 403 ABONNEMENT_BLOQUE est remonte via `blocked`.

// Anciennes offres gardees en local (modele par offres, supprime).
try { localStorage.removeItem('livreur_offres_marketplace'); } catch { /* non bloquant */ }

// 422 quand un autre livreur a ete plus rapide : cas normal, pas une erreur.
const ALREADY_TAKEN = /d[ée]j[aà] [ée]t[ée] prise/i;

const isExpired = (expireLe) => {
  const t = Date.parse(expireLe ?? '');
  return Number.isFinite(t) && t <= Date.now();
};

const listState = () => ({ items: [], status: 'idle', error: null, blocked: false, loaded: false });

const initialState = {
  available: listState(),
  mine: listState(),
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

// Livraison express : POST .../accepter-express, prix impose. Rejet :
// { message, taken } — `taken` = un autre livreur l'a prise avant.
export const acceptMarketplaceExpress = createAsyncThunk(
  'marketplace/acceptExpress',
  async (id, { rejectWithValue }) => {
    try {
      const data = await marketplaceService.acceptExpress(id);
      return { id, livraison: data?.livraison };
    } catch (err) {
      const message = apiErrorMessage(err, "Impossible d'accepter cette livraison.");
      return rejectWithValue({ message, taken: ALREADY_TAKEN.test(message) });
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

// Livreur du magasin designe par le vendeur : accepter (§7.3).
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
    // Livraison express plus ouverte (prise par un livreur).
    removeMarketplaceAvailable(state, action) {
      state.available.items = state.available.items.filter((l) => String(l.id) !== String(action.payload));
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

      .addCase(acceptMarketplaceExpress.pending, (state, action) => { state.pendingAction = action.meta.arg; })
      .addCase(acceptMarketplaceExpress.rejected, (state, action) => {
        state.pendingAction = null;
        if (action.payload?.taken) {
          state.available.items = state.available.items.filter((l) => String(l.id) !== String(action.meta.arg));
        }
      })
      .addCase(acceptMarketplaceExpress.fulfilled, (state, action) => {
        state.pendingAction = null;
        const { id, livraison } = action.payload;
        const open = state.available.items.find((l) => String(l.id) === String(id));
        state.available.items = state.available.items.filter((l) => String(l.id) !== String(id));
        upsertMine(state, { ...(open || {}), ...(livraison || {}), id: open?.id ?? id, statut: 'assignee' });
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

export const { removeMarketplaceAvailable, upsertMarketplaceLivraison, removeMarketplaceLivraison } = marketplaceSlice.actions;

export const selectMarketplaceById = (state, id) => {
  const { available, mine } = state.marketplace;
  return [...mine.items, ...available.items].find((l) => String(l.id) === String(id)) || null;
};

export default marketplaceSlice.reducer;
