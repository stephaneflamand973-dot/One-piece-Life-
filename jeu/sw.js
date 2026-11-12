// Fonctionnement hors ligne : fichiers du jeu en cache, mis à jour à chaque nouvelle version.
const CACHE = "opl-jeu-v23";
const FICHIERS = ["./", "./index.html", "./app.js", "./engine.js", "./ia.js", "./monde.js", "./evenements.js", "./evenements2.js", "./chronologie.js", "./factions.js", "./vie.js", "./origines.js", "./presentation.js", "./talents.js", "./pirate.js", "./manifest.webmanifest", "./icone.svg", "./icone-180.png", "./icone-512.png"];
self.addEventListener("install", e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(FICHIERS.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE && k.startsWith("opl-jeu-")) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // l'IA en ligne n'est jamais mise en cache
  // Réseau d'abord, sans passer par le cache HTTP du navigateur (mises à jour immédiates) ; cache en secours hors ligne.
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => {
    const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
