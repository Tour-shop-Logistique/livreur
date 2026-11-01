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
  // Web Push ne permet pas d'imposer un son : celui-ci est choisi par le systeme.
  // Pour une meilleure audibilite on force donc la vibration, on re-alerte meme si
  // une notification du meme `tag` existe deja (renotify) et, pour une mission a
  // prendre ou a accepter, on la laisse affichee jusqu'a ce que le livreur agisse.
  const text = `${payload.title || ''} ${payload.body || ''} ${payload.data?.type || ''}`.toLowerCase();
  const urgent = /(mission|livraison|propos)/.test(text) && !/(abonnement|retrait|inscription)/.test(text);
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.data?.url || payload.url || '/', ...(payload.data || {}) },
    actions: payload.actions || [],
    silent: false,
    vibrate: urgent ? [300, 120, 300, 120, 500] : [150, 80, 150],
    requireInteraction: urgent,
    timestamp: Date.now(),
    // `renotify` n'est valide qu'avec un `tag` (sinon le navigateur leve une erreur).
    ...(payload.tag ? { tag: payload.tag, renotify: true } : {}),
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
