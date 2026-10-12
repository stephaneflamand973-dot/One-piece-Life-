// Neutralisation de l'ancien service worker de la racine.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('one-piece-life-') || k.startsWith('opl-v')).map(k => caches.delete(k)));
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
// Ne pas intercepter les navigations ou les scripts de la nouvelle base.
