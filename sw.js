
const CACHE='one-piece-life-reboot-v13-1';
const ROOT=['./','./index.html','./src/reboot/ui.js','./src/reboot/engine.js','./src/reboot/data.js','./src/reboot/styles.css','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ROOT)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&(k.startsWith('one-piece-life-')||k.startsWith('opl-v'))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('./index.html')));return;}
 e.respondWith(caches.match(e.request).then(cache=>cache||fetch(e.request)));});
