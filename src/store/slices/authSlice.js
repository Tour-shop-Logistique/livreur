import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { apiErrorMessage } from '../../services/api';

// Toute l'app livreur est protegee (pas de mode invite). Parcours :
// register-livreur -> verify-email -> attente validation backoffice -> login
// -> GET /livreur/profil. `user.livreur` porte vehicule + statut KYC ;
// `user.disponible` pilote la reception de missions (§3).

const storedToken = authService.getStoredToken();

const initialState = {
  user: authService.getStoredUser(),
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  isDevBypass: authService.isDevBypassToken(storedToken),
  status: 'idle',
  error: null,
  // 'inactive' (compte en attente de validation KYC) | 'unverified' (email) | null
  errorKind: null,
  fieldErrors: null,
  pendingEmail: null,
  emailVerified: false,
  resetCodeVerified: false,
  availabilityLoading: false,
};

const failure = (err, fallback) => ({
  message: apiErrorMessage(err, fallback),
  fieldErrors: err.response?.data?.errors && typeof err.response.data.errors === 'object'
    ? err.response.data.errors
    : null,
});

export const registerLivreur = createAsyncThunk(
  'auth/registerLivreur',
  async (form, { rejectWithValue }) => {
    try {
      const data = await authService.registerLivreur(form);
      return { email: form.email, message: data?.message };
    } catch (err) {
      return rejectWithValue(failure(err, "Impossible d'envoyer votre inscription."));
    }
  }
);

export const verifyEmailCode = createAsyncThunk(
  'auth/verifyEmailCode',
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const data = await authService.verifyEmail({ email, code });
      return { email, message: data?.message };
    } catch (err) {
      return rejectWithValue(failure(err, 'Code invalide ou expiré.'));
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email, { rejectWithValue }) => {
    try {
      const data = await authService.resendEmailVerification(email);
      return { message: data?.message };
    } catch (err) {
      return rejectWithValue(failure(err, 'Impossible de renvoyer le code.'));
    }
  }
);

// Login puis chargement immediat de la fiche Livreur (le login ne la renvoie pas).
export const loginLivreur = createAsyncThunk(
  'auth/loginLivreur',
  async ({ email, telephone, password }, { rejectWithValue }) => {
    try {
      const data = await authService.login({ email, telephone, password });
      let user = data.user;
      try {
        const profile = await authService.fetchLivreurProfile();
        if (profile?.user) user = profile.user;
      } catch {
        // Le profil detaille est un complement : la session reste valide sans lui.
      }
      return { user, token: data.token };
    } catch (err) {
      const errors = err.response?.data?.errors || {};
      let kind = null;
      if (errors.account) kind = 'inactive';
      else if (errors.email && /v[ée]rifier/i.test(String(errors.email[0]))) kind = 'unverified';
      return rejectWithValue({ ...failure(err, 'Les identifiants fournis sont incorrects.'), kind, email });
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.fetchLivreurProfile();
      return data.user;
    } catch (err) {
      return rejectWithValue({ status: err.response?.status ?? null });
    }
  }
);

export const updateVehicle = createAsyncThunk(
  'auth/updateVehicle',
  async (form, { rejectWithValue }) => {
    try {
      const data = await authService.updateVehicle(form);
      return data.livreur;
    } catch (err) {
      return rejectWithValue(failure(err, 'Impossible de mettre à jour le véhicule.'));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (form, { rejectWithValue }) => {
    try {
      const data = await authService.updateProfile(form);
      return { user: data.user, message: data.message };
    } catch (err) {
      return rejectWithValue(failure(err, 'Impossible de mettre à jour le profil.'));
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (form, { rejectWithValue }) => {
    try {
      const data = await authService.changePassword(form);
      authService.clearSession();
      return { message: data?.message };
    } catch (err) {
      return rejectWithValue(failure(err, 'Impossible de modifier le mot de passe.'));
    }
  }
);

export const setAvailability = createAsyncThunk(
  'auth/setAvailability',
  async (disponible, { rejectWithValue }) => {
    try {
      const data = await authService.setAvailability(disponible);
      return { disponible: data?.disponible ?? disponible, message: data?.message };
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Impossible de mettre à jour votre disponibilité.'));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const data = await authService.forgotPassword(email);
      if (!data?.success) {
        return rejectWithValue({ message: data?.message || 'Aucun compte trouvé avec cette adresse e-mail.', fieldErrors: null });
      }
      return { email, message: data.message };
    } catch (err) {
      return rejectWithValue(failure(err, "Impossible d'envoyer le code de réinitialisation."));
    }
  }
);

export const verifyResetCode = createAsyncThunk(
  'auth/verifyResetCode',
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const data = await authService.verifyResetCode({ email, code });
      if (!data?.success) {
        return rejectWithValue({ message: data?.message || 'Code invalide ou expiré.', fieldErrors: null });
      }
      return { message: data.message };
    } catch (err) {
      return rejectWithValue(failure(err, 'Code invalide ou expiré.'));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, code, password, passwordConfirmation }, { rejectWithValue }) => {
    try {
      const data = await authService.resetPassword({ email, code, password, passwordConfirmation });
      return { message: data?.message };
    } catch (err) {
      return rejectWithValue(failure(err, 'Impossible de réinitialiser le mot de passe.'));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const clearAuth = (state) => {
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;
  state.isDevBypass = false;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      authService.clearSession();
      clearAuth(state);
    },
    resetAuthFlow(state) {
      state.status = 'idle';
      state.error = null;
      state.errorKind = null;
      state.fieldErrors = null;
      state.emailVerified = false;
      state.resetCodeVerified = false;
    },
    clearAuthError(state) {
      state.error = null;
      state.errorKind = null;
      state.fieldErrors = null;
    },
    // Mise a jour locale du solde apres un evenement (mission cloturee, etc.).
    patchUser(state, action) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      authService.persistUser(state.user);
    },
    // Porte derobee de dev (cf. authService.startDevBypass).
    devBypassLogin(state) {
      const user = authService.startDevBypass();
      state.user = user;
      state.token = authService.getStoredToken();
      state.isAuthenticated = true;
      state.isDevBypass = true;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = 'loading';
      state.error = null;
      state.errorKind = null;
      state.fieldErrors = null;
    };
    const rejected = (state, action) => {
      state.status = 'error';
      state.error = action.payload?.message || 'Une erreur est survenue.';
      state.fieldErrors = action.payload?.fieldErrors || null;
    };
    const idle = (state) => { state.status = 'idle'; };

    builder
      .addCase(registerLivreur.pending, pending)
      .addCase(registerLivreur.fulfilled, (state, action) => {
        state.status = 'idle';
        state.pendingEmail = action.payload.email;
        state.emailVerified = false;
      })
      .addCase(registerLivreur.rejected, rejected)

      .addCase(verifyEmailCode.pending, pending)
      .addCase(verifyEmailCode.fulfilled, (state) => {
        state.status = 'idle';
        state.emailVerified = true;
      })
      .addCase(verifyEmailCode.rejected, rejected)

      .addCase(resendVerification.pending, pending)
      .addCase(resendVerification.fulfilled, idle)
      .addCase(resendVerification.rejected, rejected)

      .addCase(loginLivreur.pending, pending)
      .addCase(loginLivreur.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.pendingEmail = null;
        state.emailVerified = false;
        state.resetCodeVerified = false;
        state.isDevBypass = false;
      })
      .addCase(loginLivreur.rejected, (state, action) => {
        rejected(state, action);
        state.errorKind = action.payload?.kind || null;
        if (action.payload?.email) state.pendingEmail = action.payload.email;
      })

      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        // Seul un 401 (gere par l'intercepteur) invalide la session : une erreur
        // reseau au demarrage ne doit pas deconnecter le livreur sur le terrain.
        if (action.payload?.status === 401) {
          authService.clearSession();
          clearAuth(state);
        }
      })

      .addCase(updateVehicle.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          state.user = { ...state.user, livreur: { ...state.user.livreur, ...action.payload } };
          authService.persistUser(state.user);
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user && action.payload.user) {
          state.user = { ...state.user, ...action.payload.user, livreur: state.user.livreur };
          authService.persistUser(state.user);
        }
      })
      .addCase(changePassword.fulfilled, clearAuth)

      .addCase(setAvailability.pending, (state) => { state.availabilityLoading = true; })
      .addCase(setAvailability.fulfilled, (state, action) => {
        state.availabilityLoading = false;
        if (state.user) {
          state.user = { ...state.user, disponible: action.payload.disponible };
          authService.persistUser(state.user);
        }
      })
      .addCase(setAvailability.rejected, (state) => { state.availabilityLoading = false; })

      .addCase(forgotPassword.pending, pending)
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.status = 'idle';
        state.pendingEmail = action.payload.email;
        state.resetCodeVerified = false;
      })
      .addCase(forgotPassword.rejected, rejected)

      .addCase(verifyResetCode.pending, pending)
      .addCase(verifyResetCode.fulfilled, (state) => {
        state.status = 'idle';
        state.resetCodeVerified = true;
      })
      .addCase(verifyResetCode.rejected, rejected)

      .addCase(resetPassword.pending, pending)
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'idle';
        state.pendingEmail = null;
        state.resetCodeVerified = false;
      })
      .addCase(resetPassword.rejected, rejected)

      .addCase(logout.fulfilled, clearAuth)
      .addCase(logout.rejected, clearAuth);
  },
});

export const {
  sessionExpired, resetAuthFlow, clearAuthError, patchUser, devBypassLogin,
} = authSlice.actions;
export default authSlice.reducer;
