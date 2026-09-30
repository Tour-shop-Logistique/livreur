import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import abonnementService from '../../services/abonnementService';
import { apiErrorMessage } from '../../services/api';

// Abonnement marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §9). Uniquement
// lie au module Marketplace — les missions d'expedition ne sont jamais bloquees.

const initialState = {
  abonnement: null,
  echeance: null,
  bloque: false,
  status: 'idle',
  error: null,
  loaded: false,
  history: { items: [], status: 'idle', error: null },
  declaration: { status: 'idle', error: null },
};

export const fetchAbonnementStatus = createAsyncThunk(
  'abonnement/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      return await abonnementService.fetchStatus();
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, "Impossible de charger votre abonnement."));
    }
  }
);

export const fetchAbonnementHistory = createAsyncThunk(
  'abonnement/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const data = await abonnementService.fetchHistory();
      return data?.historique?.data ?? [];
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, "Impossible de charger l'historique."));
    }
  }
);

export const declareAbonnementPayment = createAsyncThunk(
  'abonnement/declarePayment',
  async ({ echeanceId, methode, referenceTransaction, preuve }, { rejectWithValue }) => {
    try {
      const data = await abonnementService.declarePayment(echeanceId, { methode, referenceTransaction, preuve });
      return data?.paiement;
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de déclarer ce paiement.'));
    }
  }
);

const abonnementSlice = createSlice({
  name: 'abonnement',
  initialState,
  reducers: {
    markBlocked(state) {
      state.bloque = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAbonnementStatus.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchAbonnementStatus.fulfilled, (state, action) => {
        state.status = 'idle';
        state.loaded = true;
        state.abonnement = action.payload?.abonnement ?? null;
        state.echeance = action.payload?.echeance_courante ?? null;
        state.bloque = Boolean(action.payload?.bloque);
      })
      .addCase(fetchAbonnementStatus.rejected, (state, action) => {
        state.status = 'error';
        state.loaded = true;
        state.error = action.payload;
      })

      .addCase(fetchAbonnementHistory.pending, (state) => { state.history.status = 'loading'; state.history.error = null; })
      .addCase(fetchAbonnementHistory.fulfilled, (state, action) => { state.history = { items: action.payload, status: 'idle', error: null }; })
      .addCase(fetchAbonnementHistory.rejected, (state, action) => { state.history.status = 'error'; state.history.error = action.payload; })

      .addCase(declareAbonnementPayment.pending, (state) => { state.declaration = { status: 'loading', error: null }; })
      .addCase(declareAbonnementPayment.fulfilled, (state, action) => {
        state.declaration = { status: 'idle', error: null };
        const paiement = action.payload;
        if (paiement) {
          state.history.items = state.history.items.map((e) => (
            e.id === paiement.echeance_abonnement_id ? { ...e, paiement } : e
          ));
          if (state.echeance?.id === paiement.echeance_abonnement_id) {
            state.echeance = { ...state.echeance, paiement };
          }
        }
      })
      .addCase(declareAbonnementPayment.rejected, (state, action) => { state.declaration = { status: 'error', error: action.payload }; });
  },
});

export const { markBlocked } = abonnementSlice.actions;
export default abonnementSlice.reducer;
