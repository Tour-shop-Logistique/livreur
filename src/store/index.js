import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import missionsReducer from './slices/missionsSlice';
import marketplaceReducer from './slices/marketplaceSlice';
import earningsReducer from './slices/earningsSlice';
import abonnementReducer from './slices/abonnementSlice';
import notificationsReducer from './slices/notificationsSlice';
import { setDefaultCurrency } from '../utils/format';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    missions: missionsReducer,
    marketplace: marketplaceReducer,
    earnings: earningsReducer,
    abonnement: abonnementReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefault) => getDefault({
    // Les preuves (File) transitent dans les arguments des thunks.
    serializableCheck: { ignoredActionPaths: ['meta.arg'] },
  }),
});

// Devise de l'utilisateur (`user.devise`) -> devise par defaut de formatPrice.
let lastDevise;
const syncCurrency = () => {
  const devise = store.getState().auth.user?.devise;
  if (devise === lastDevise) return;
  lastDevise = devise;
  setDefaultCurrency(devise);
};
syncCurrency();
store.subscribe(syncCurrency);
