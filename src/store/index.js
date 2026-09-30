import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import missionsReducer from './slices/missionsSlice';
import marketplaceReducer from './slices/marketplaceSlice';
import earningsReducer from './slices/earningsSlice';
import abonnementReducer from './slices/abonnementSlice';
import notificationsReducer from './slices/notificationsSlice';

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
