import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store } from './store';
import { sessionExpired } from './store/slices/authSlice';
import { markBlocked } from './store/slices/abonnementSlice';
import { setAbonnementHint, isEcheanceOverdue, isBlockedPush } from './utils/abonnementHint';
import App from './App.jsx';
import './index.css';

// L'intercepteur API emet ces evenements (cf. services/api.js).
window.addEventListener('auth:unauthorized', () => {
  // Tokens revoques au blocage d'abonnement : expliquer la deconnexion.
  if (store.getState().auth.isAuthenticated && isEcheanceOverdue(store.getState().abonnement)) setAbonnementHint();
  store.dispatch(sessionExpired());
});
window.addEventListener('abonnement:bloque', () => store.dispatch(markBlocked()));

// Push "abonnement bloque" recu app ouverte (relaye par public/push-sw.js).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'push' && isBlockedPush(event.data.payload)) {
      setAbonnementHint();
      store.dispatch(markBlocked());
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          theme="light"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: 'Inter, system-ui, sans-serif', borderRadius: '14px' } }}
        />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
