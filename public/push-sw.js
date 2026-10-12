/* global self, clients */
// Importe par le service worker Workbox (vite.config.js > workbox.importScripts).
// Affiche les notifications WebPush envoyees par le backend (Laravel WebPush) :
// mission proposee / acceptee / refusee, offre acceptee / non retenue, nouvelle
// mission disponible, abonnement (rappel, blocage, paiement valide/rejete),
// inscription validee/rejetee, retrait confirme/rejete.

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'TourShop Livreur';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag,
    data: { url: payload.data?.url || payload.url || '/', ...(payload.data || {}) },
    actions: payload.actions || [],
  };

  // Relaye aussi le push aux onglets ouverts : l'app recharge alors son
  // historique de notifications (GET /livreur/notifications) et ses donnees.
  const notifyClients = clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((windows) => windows.forEach((w) => w.postMessage({ type: 'push', payload })));

  event.waitUntil(Promise.all([self.registration.showNotification(title, options), notifyClients]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => 'focus' in w);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return clients.openWindow(url);
    })
  );
});
