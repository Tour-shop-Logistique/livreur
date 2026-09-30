import api from './api';

// Abonnement WebPush (PARCOURS_LIVREUR_API.md §7.3). Le service worker genere par
// vite-plugin-pwa importe public/push-sw.js qui affiche les notifications.

const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export const isPushSupported = () =>
  typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window;

const getRegistration = async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error("Le service worker n'est pas actif (disponible uniquement sur l'app installee / build de production).");
  return reg;
};

const getCurrentSubscription = async () => {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
};

// GET /push/public-key -> POST /push/subscribe { endpoint, keys: { p256dh, auth } }
const subscribe = async () => {
  if (!isPushSupported()) throw new Error('Les notifications push ne sont pas prises en charge sur cet appareil.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Autorisation de notification refusee.');

  const reg = await getRegistration();
  const { data } = await api.get('/push/public-key');
  const subscription = (await reg.pushManager.getSubscription())
    || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.public_key),
    });

  const json = subscription.toJSON();
  await api.post('/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
  return true;
};

// POST /push/unsubscribe { endpoint }
const unsubscribe = async () => {
  const subscription = await getCurrentSubscription();
  if (!subscription) return false;
  await api.post('/push/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {});
  await subscription.unsubscribe();
  return true;
};

const pushService = {
  subscribe,
  unsubscribe,
  getCurrentSubscription,
};

export default pushService;
