import { createGame, advanceYear, STAT_KEYS } from '../core/game.mjs';
import { SEAS } from '../core/world.mjs';
import { loadGame, saveGame, deleteGame } from '../core/storage.mjs';

const root = document.querySelector('#app');
const LABELS = { sante: 'Santé', bonheur: 'Bonheur', intelligence: 'Intelligence', apparence: 'Apparence' };
let game = loadGame();
let selectedSea = 'random';
let menuOpen = false;
let notice = '';

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function makeOption(value, label, current) {
  return `<option value="${escapeHtml(value)}" ${value === current ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}
function seaOptions() {
  return makeOption('random', 'Aléatoire', selectedSea) +
    SEAS.map(sea => makeOption(sea.id, sea.name, selectedSea)).join('');
}
function placeOptions() {
  const sea = SEAS.find(s => s.id === selectedSea);
  return makeOption('random', 'Aléatoire', 'random') +
    (sea ? sea.places.map(place => makeOption(place, place, 'random')).join('') : '');
}
function renderCreation() {
  root.innerHTML = `
    <div class="start-screen">
      <header class="start-header">
        <div class="logo logo-large" aria-hidden="true">OP</div>
        <p class="overline">ONE PIECE LIFE</p>
        <h1>Une vie à écrire.</h1>
        <p class="start-lead">Votre histoire commence ici.</p>
      </header>
      <form id="new-character" class="creation-form">
        <h2>Nouvelle vie</h2>
        <div class="field"><label for="first-name">Prénom</label><input id="first-name" name="firstName" type="text" placeholder="Aléatoire" maxlength="32" autocomplete="off"></div>
        <div class="field"><label for="last-name">Nom</label><input id="last-name" name="lastName" type="text" placeholder="Aléatoire" maxlength="32" autocomplete="off"></div>
        <div class="field"><label for="gender">Genre</label><select id="gender" name="gender">
          ${makeOption('random', 'Aléatoire', 'random')}
          ${makeOption('M', 'Masculin', 'random')}
          ${makeOption('F', 'Féminin', 'random')}
        </select></div>
        <div class="field"><label for="sea-select">Mer de naissance</label><select id="sea-select" name="sea">${seaOptions()}</select></div>
        <div class="field"><label for="place-select">Lieu de naissance</label><select id="place-select" name="place">${placeOptions()}</select></div>
        <button type="submit" class="create-button">Commencer ma vie <span aria-hidden="true">→</span></button>
      </form>
      ${notice ? `<p role="alert" class="notice">${escapeHtml(notice)}</p>` : ''}
    </div>`;
}
function renderStats() {
  return STAT_KEYS.map(key => {
    const number = game.character.stats[key];
    return `<div class="stat">
      <div class="stat-top"><span>${LABELS[key]}</span><strong>${number}%</strong></div>
      <div class="stat-track" role="progressbar" aria-label="${LABELS[key]}" aria-valuenow="${number}" aria-valuemin="0" aria-valuemax="100">
        <div class="stat-progress stat-${key}" style="width:${number}%"></div>
      </div>
    </div>`;
  }).join('');
}
function renderHistory() {
  return game.history.map(event => `
    <article class="story-item ${event.type === 'death' ? 'story-end' : ''}">
      <div class="story-age">${event.age === 0 ? 'Naissance' : event.age + ' ans'}</div>
      <p>${escapeHtml(event.text)}</p>
    </article>`).join('');
}
function renderLife() {
  const c = game.character;
  const sea = SEAS.find(s => s.id === c.sea);
  root.innerHTML = `
    <div class="shell">
      <header class="header">
        <div class="brand"><span class="logo" aria-hidden="true">OP</span><strong>ONE PIECE LIFE</strong></div>
        <div class="settings-holder">
          <button class="settings-button" type="button" data-action="menu" aria-label="Options" aria-expanded="${menuOpen}" aria-controls="settings-menu">⋯</button>
          ${menuOpen ? `<div id="settings-menu" class="settings-menu"><button type="button" data-action="restart">Nouvelle vie</button></div>` : ''}
        </div>
      </header>
      <section class="identity" aria-label="Votre personnage">
        <div class="identity-main">
          <div class="avatar" aria-hidden="true">${escapeHtml(c.firstName.slice(0,1).toUpperCase())}</div>
          <div class="identity-details">
            <h1>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</h1>
            <p><strong>${c.age} ans</strong><span class="separator">·</span>${escapeHtml(c.place)}<span class="separator">·</span>${escapeHtml(sea?.name)}</p>
          </div>
        </div>
        <div class="stats" aria-label="Caractéristiques du personnage">${renderStats()}</div>
      </section>
      <main class="main" id="main">
        <div class="story-title"><h2>Ma vie</h2><span>${c.age === 0 ? 'Naissance' : c.age + ' ans'}</span></div>
        <div class="story-list">${renderHistory()}</div>
      </main>
      <div class="action-area">
        <button type="button" class="age-button" data-action="age" ${!c.alive ? 'disabled' : ''}>
          <span class="age-symbol" aria-hidden="true">${c.alive ? '+' : '×'}</span>
          <span>${c.alive ? 'Âge' : 'Vie terminée'}</span>
        </button>
        <p>${c.alive ? 'Avancer d’un an' : 'Votre histoire est achevée'}</p>
      </div>
      ${notice ? `<div class="notice floating-notice" role="alert">${escapeHtml(notice)}</div>` : ''}
    </div>`;
}
function render() {
  document.title = game ? `${game.character.firstName} | One Piece Life` : 'One Piece Life';
  if (game) renderLife();
  else renderCreation();
}
root.addEventListener('change', e => {
  if (e.target.id !== 'sea-select') return;
  selectedSea = e.target.value;
  const place = document.querySelector('#place-select');
  if (place) place.innerHTML = placeOptions();
});
root.addEventListener('submit', e => {
  if (e.target.id !== 'new-character') return;
  e.preventDefault();
  const f = new FormData(e.target);
  const next = createGame({
    firstName: f.get('firstName'), lastName: f.get('lastName'), gender: f.get('gender'),
    sea: f.get('sea'), place: f.get('place'), seed: Date.now() >>> 0
  });
  if (!saveGame(next)) {
    notice = 'Le stockage local n’est pas disponible. Impossible de commencer une partie sauvegardée.';
  } else {
    game = next;
    menuOpen = false;
    notice = '';
  }
  render();
});
root.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn || btn.disabled) {
    if (menuOpen && !e.target.closest('.settings-holder')) { menuOpen = false; render(); }
    return;
  }
  const action = btn.dataset.action;
  if (action === 'menu') { menuOpen = !menuOpen; render(); return; }
  if (action === 'restart' && game) {
    if (!window.confirm('Commencer une nouvelle vie ? Votre partie actuelle sera effacée.')) return;
    if (!deleteGame()) { notice = 'Impossible de supprimer la sauvegarde.'; render(); return; }
    game = null; menuOpen = false; selectedSea = 'random'; notice = '';
    render(); window.scrollTo(0, 0); return;
  }
  if (action === 'age' && game?.character.alive) {
    const next = advanceYear(game);
    if (saveGame(next)) { game = next; notice = ''; } else notice = 'Enregistrement impossible : l’année n’a pas été appliquée.';
    render();
    if (!notice) {
      const last = root.querySelector('.story-item:last-child');
      last?.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
    return;
  }
  if (menuOpen && !e.target.closest('.settings-holder')) { menuOpen = false; render(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuOpen) { menuOpen = false; render(); }
});
// Désactivation des anciennes versions installées : aucune sauvegarde historique n’est effacée.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    const scope = new URL('./', document.baseURI).href;
    return Promise.all(registrations.filter(r => r.scope === scope).map(r => r.unregister()));
  }).catch(() => {});
}
render();
