// Service Worker for Push Notifications
//
// This worker deliberately does NOT cache anything — it only shows notifications.
// Earlier versions of the app shipped a precaching worker, and any device that
// visited back then still has it installed, serving a stale app shell forever.
// Without skipWaiting a replacement worker only sits in "waiting" until every tab
// of the site is closed, which on a device someone leaves open is never.
//
// So: take over immediately and delete every cache a previous worker left behind.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {
    title: 'Maestro Fuel',
    body: 'You have a new notification',
    url: '/'
  };

  const options = {
    body: data.body,
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
