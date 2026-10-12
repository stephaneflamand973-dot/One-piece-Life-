import { createEngine } from '../core/engine.mjs';
import { NAV_ITEMS, SECTIONS, HOME, isHome, resolveHash, makeHash, parentHash } from '../core/navigation.mjs';

const root = document.getElementById('app');
if (!root) throw new Error('Point de montage absent.');
const engine = createEngine();

const ICONS = Object.freeze({
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M15 13h6v5h-6a2.5 2.5 0 0 1 0-5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.2a4 4 0 0 1 0 7.6M22 20v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/>',
  dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  back: '<path d="m15 18-6-6 6-6"/>'
});
const icon = name => `<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

let route = resolveHash(window.location.hash, engine.modules);
let lastScreen = null;
let renderCount = 0;

function navButtons() {
  return NAV_ITEMS.map(({ id, label, icon: iconName }) => {
    const active = route.section === id;
    const selected = active ? 'is-current' : '';
    const aria = active ? 'aria-current="page"' : '';
    if (id === HOME) {
      return `<button type="button" data-nav="${id}" class="nav-button nav-home ${selected}" aria-label="Retour à Vie" ${aria}>
        <span class="nav-home-icon">${icon(iconName)}</span>
        <span class="nav-label">Vie</span>
      </button>`;
    }
    return `<button type="button" data-nav="${id}" class="nav-button ${selected}" ${aria}>
      <span class="nav-icon">${icon(iconName)}</span><span class="nav-label">${label}</span>
    </button>`;
  }).join('');
}
function emptyContent() {
  // Ces libellés sont les seuls textes de rubriques sans module installé.
  // Aucune liste fictive, aucun faux bouton, aucune donnée simulée.
  if (route.section === HOME) {
    return `<section class="empty-home" aria-label="Vie">
      <span class="empty-mark" aria-hidden="true">OP</span>
      <h1>Votre histoire</h1>
      <p>Aucune vie commencée.</p>
    </section>`;
  }
  return `<section class="empty-section" aria-label="${SECTIONS[route.section]}">
    <h1>${SECTIONS[route.section]}</h1>
    <p>Cette rubrique est vide.</p>
  </section>`;
}
function currentContent() {
  const module = engine.modules.get(route.section);
  if (!module) return emptyContent();
  const page = route.page ? engine.modules.getPage(route.section, route.page) : null;
  const render = page?.render ?? module.render;
  const output = render(engine.getState(), Object.freeze({
    section: route.section,
    page: route.page,
    navigate: go,
    back
  }));
  return typeof output === 'string' ? output : '';
}
function render() {
  const page = route.page ? engine.modules.getPage(route.section, route.page) : null;
  const title = page?.label ?? SECTIONS[route.section];
  const backButton = isHome(route) ? '' :
    `<button type="button" class="back-button" data-back aria-label="Retour">${icon('back')}</button>`;

  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-leading">${backButton}
          <button class="brand" data-nav="life" type="button" aria-label="Aller à la vie">
            <span class="brand-mark" aria-hidden="true">OP</span><span>ONE PIECE LIFE</span>
          </button>
        </div>
      </header>
      <main id="main-content" class="page-content" tabindex="-1" aria-label="${escapeHtml(title)}">
        ${currentContent()}
      </main>
      <nav class="bottom-nav" aria-label="Navigation principale">
        ${navButtons()}
      </nav>
    </div>`;

  renderCount++;
  if (lastScreen !== route.hash) {
    root.querySelector('.page-content')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  lastScreen = route.hash;
}

function syncFromLocation() {
  const next = resolveHash(window.location.hash, engine.modules);
  if (window.location.hash !== next.hash) {
    // Replace, not push: malformed / future links do not add dead history entries.
    window.history.replaceState(null, '', next.hash);
  }
  route = next;
  render();
}
function go(section, page = null) {
  const hash = makeHash(section, page);
  const normalized = resolveHash(hash, engine.modules);
  if (normalized.hash !== hash) return false;
  if (window.location.hash === hash) {
    route = normalized; render(); return true;
  }
  window.location.hash = hash; // Native history, Android Back and iOS navigation work.
  return true;
}
function back() {
  const destination = parentHash(route);
  window.location.hash = destination;
}

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || !root.contains(button)) return;
  if (button.hasAttribute('data-back')) { back(); return; }
  const section = button.dataset.nav;
  if (section) go(section);
});
window.addEventListener('hashchange', syncFromLocation);
syncFromLocation();

// La migration retire les anciennes ressources réseau, jamais les sauvegardes.
async function clearLegacyCaches() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const scopes = [new URL('../', window.location.href).href, new URL('./', window.location.href).href];
      await Promise.all(regs.filter(reg => scopes.includes(reg.scope)).map(reg => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('one-piece-life-') || key.startsWith('opl-v')).map(key => caches.delete(key)));
    }
  } catch {
    // Des politiques de stockage restrictives ne doivent jamais bloquer la navigation.
  }
}
void clearLegacyCaches();
