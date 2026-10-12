// Migration : remplace l'ancien service worker sans conserver ses caches.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('one-piece-life-') || k.startsWith('opl-v')).map(k => caches.delete(k)));
    await self.clients.claim();
    await self.registration.unregister();
    const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const page of pages) {
      try { await page.navigate(page.url); } catch { /* page closed */ }
    }
  })());
});
// Aucune interception réseau : cette version utilise toujours les fichiers les plus récents.
