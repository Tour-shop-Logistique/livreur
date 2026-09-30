import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import earningsService from '../../services/earningsService';
import { apiErrorMessage } from '../../services/api';

// Solde reel des missions d'expedition (PARCOURS_LIVREUR_API.md §4.6).
// Credits (+) a chaque mission cloturee, retraits (-) demandes au backoffice.

const initialState = {
  balance: { value: null, status: 'idle', error: null },
  history: { items: [], status: 'idle', error: null, loaded: false },
  withdrawal: { status: 'idle', error: null },
};

export const fetchBalance = createAsyncThunk(
  'earnings/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const data = await earningsService.fetchBalance();
      return Number(data?.solde_livreur ?? 0);
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de charger votre solde.'));
    }
  }
);

export const fetchEarningsHistory = createAsyncThunk(
  'earnings/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const data = await earningsService.fetchHistory();
      return data?.historique ?? [];
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, "Impossible de charger l'historique."));
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  'earnings/requestWithdrawal',
  async ({ montant, notes }, { rejectWithValue }) => {
    try {
      const data = await earningsService.requestWithdrawal({ montant, notes });
      return data?.retrait;
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de traiter votre demande de retrait.'));
    }
  }
);

const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => { state.balance.status = 'loading'; state.balance.error = null; })
      .addCase(fetchBalance.fulfilled, (state, action) => { state.balance = { value: action.payload, status: 'idle', error: null }; })
      .addCase(fetchBalance.rejected, (state, action) => { state.balance.status = 'error'; state.balance.error = action.payload; })

      .addCase(fetchEarningsHistory.pending, (state) => { state.history.status = 'loading'; state.history.error = null; })
      .addCase(fetchEarningsHistory.fulfilled, (state, action) => {
        state.history = { items: action.payload, status: 'idle', error: null, loaded: true };
      })
      .addCase(fetchEarningsHistory.rejected, (state, action) => {
        state.history.status = 'error';
        state.history.error = action.payload;
        state.history.loaded = true;
      })

      .addCase(requestWithdrawal.pending, (state) => { state.withdrawal = { status: 'loading', error: null }; })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.withdrawal = { status: 'idle', error: null };
        // Le solde n'est decremente qu'a la confirmation backoffice : on ajoute
        // seulement la demande en tete de l'historique.
        if (action.payload) {
          state.history.items = [{
            type: 'retrait',
            montant: -Number(action.payload.montant),
            date: action.payload.created_at || new Date().toISOString(),
            detail: action.payload,
          }, ...state.history.items];
        }
      })
      .addCase(requestWithdrawal.rejected, (state, action) => { state.withdrawal = { status: 'error', error: action.payload }; });
  },
});

export default earningsSlice.reducer;
