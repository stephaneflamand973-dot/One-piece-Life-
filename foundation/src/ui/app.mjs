import { createEngine } from '../core/engine.mjs';

const root = document.getElementById('app');
const engine = createEngine();
const registeredModules = engine.modules.visible();

// La base est volontairement vide. Les futures rubriques ne sont pas affichées
// tant qu'elles n'ont pas été ajoutées au registre avec un vrai écran fonctionnel.
if (!root || !engine.getState() || registeredModules.length !== 0) {
  throw new Error('Initialisation de la fondation impossible');
}

root.innerHTML = `
  <div class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-icon" aria-hidden="true">OP</span><span>ONE PIECE LIFE</span></div>
    </header>
    <main class="main">
      <section class="empty-state" aria-label="Base de jeu vierge">
        <div class="empty-logo" aria-hidden="true">OP</div>
        <h1>One Piece Life</h1>
        <p>Base vierge.</p>
        <span class="empty-detail">Aucun personnage. Aucune partie. Aucune mécanique active.</span>
      </section>
    </main>
    <footer class="footer">FONDATION · 0.0.0</footer>
  </div>
`;

async function retireAnciennesVersionsEnCache() {
  // Ce nettoyage concerne uniquement les fichiers en cache.
  // Il ne touche pas localStorage, IndexedDB ou les anciennes sauvegardes.
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const rootScope = new URL('../', location.href).href;
      const foundationScope = new URL('./', location.href).href;
      const legacy = regs.filter(reg => reg.scope === rootScope || reg.scope === foundationScope);
      if (legacy.length) await Promise.all(legacy.map(reg => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      const oldKeys = keys.filter(key => key.startsWith('one-piece-life-') || key.startsWith('opl-v'));
      await Promise.all(oldKeys.map(key => caches.delete(key)));
    }
  } catch {
    // Une interdiction de l'API cache ne bloque jamais le chargement du socle.
  }
}
void retireAnciennesVersionsEnCache();
