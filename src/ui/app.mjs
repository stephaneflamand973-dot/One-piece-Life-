import { createGame, advanceYear, STAT_KEYS } from '../core/game.mjs';
import { SEAS } from '../core/world.mjs';
import { saveGame, loadGame, deleteGame } from '../core/storage.mjs';

const root = document.querySelector('#app');
const TABS = [
  ['life', 'Vie', '⌂'],
  ['activities', 'Activités', '✦'],
  ['relationships', 'Relations', '♡'],
  ['career', 'Carrière', '▣'],
  ['assets', 'Biens', '◇']
];
const STAT_LABELS = { sante: 'Santé', bonheur: 'Bonheur', intelligence: 'Intelligence', apparence: 'Apparence' };
let game = loadGame();
let tab = 'life';
let draftSea = 'random';
let error = '';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => new Intl.NumberFormat('fr-FR').format(n);
function option(value, label, selected) {
  return `<option value="${esc(value)}" ${selected === value ? 'selected' : ''}>${esc(label)}</option>`;
}
function seaOptions(selected) {
  return option('random', 'Aléatoire', selected) + SEAS.map(s => option(s.id, s.name, selected)).join('');
}
function placeOptions() {
  if (draftSea === 'random') return option('random', 'Aléatoire', 'random');
  const sea = SEAS.find(s => s.id === draftSea);
  return option('random', 'Aléatoire', 'random') + sea.places.map(p => option(p, p, 'random')).join('');
}
function createScreen() {
  root.innerHTML = `
  <div class="create-wrap">
    <div class="create-header">
      <span class="brand-mark">OP</span>
      <p class="eyebrow">ONE PIECE LIFE · REBIRTH 0.1</p>
      <h1>Une nouvelle vie<br>commence ici.</h1>
      <p>Un personnage. Une histoire. Une année à la fois.</p>
    </div>
    <form id="create-form" class="create-card">
      <h2>Créer votre personnage</h2>
      <label>Prénom <small>(facultatif)</small><input name="firstName" placeholder="Aléatoire" maxlength="32" autocomplete="off"></label>
      <label>Nom <small>(facultatif)</small><input name="lastName" placeholder="Aléatoire" maxlength="32" autocomplete="off"></label>
      <label>Genre<select name="gender">${option('random','Aléatoire','random')}${option('M','Masculin','random')}${option('F','Féminin','random')}</select></label>
      <label>Mer de naissance<select name="sea" id="sea-select">${seaOptions(draftSea)}</select></label>
      <label>Lieu de naissance<select name="place" id="place-select">${placeOptions()}</select></label>
      <button class="primary-button" type="submit">Commencer ma vie <span>→</span></button>
    </form>
    <p class="small-note">Cette version démarre avec une sauvegarde vierge, indépendante de l'ancien jeu.</p>
    ${error ? `<p role="alert" class="error">${esc(error)}</p>` : ''}
  </div>`;
}
function stats() {
  return STAT_KEYS.map(key => {
    const value = game.character.stats[key];
    return `<div class="stat"><div class="stat-label"><span>${STAT_LABELS[key]}</span><strong>${value}%</strong></div><div class="track"><div class="fill ${key}" style="width:${value}%"></div></div></div>`;
  }).join('');
}
function history() {
  const recent = game.history.slice(-25);
  return `<div class="timeline">${recent.map((e, i) =>
    `<article class="entry ${esc(e.type)}"><div class="entry-age">${e.age === 0 ? 'Naissance' : e.age + ' ans'}</div><p>${esc(e.text)}</p></article>`
  ).join('')}</div>`;
}
function emptyPanel(symbol, title, description, blocks = '') {
  return `<section class="module"><span class="module-symbol">${symbol}</span><h2>${title}</h2><p>${description}</p>${blocks}</section>`;
}
function panel() {
  switch(tab) {
    case 'life':
      return `<section class="timeline-head"><h2>Votre histoire</h2><span>${game.character.age} ans</span></section>${history()}`;
    case 'activities':
      return emptyPanel('✦', 'Activités', 'Les actions du quotidien seront intégrées ici progressivement. Chaque action aura un effet mesurable sur votre vie.');
    case 'relationships':
      return emptyPanel('♡', 'Relations', 'Famille, amis et rencontres disposeront d’un système de relations dédié, sans surcharger l’écran Vie.');
    case 'career':
      return emptyPanel('▣', 'Carrière', 'Deux voies réellement distinctes, avec leurs propres mécaniques.',
        '<div class="stub-item"><strong>Métiers ordinaires</strong><span>Emplois, salaires, promotions</span></div><div class="stub-item"><strong>Carrières spéciales</strong><span>Pirate, Marine, Gouvernement, chasseur de primes…</span></div>');
    case 'assets':
      return emptyPanel('◇', 'Biens', 'Argent, propriétés, bateaux et possessions auront ici leur place. Aucun système économique artificiel n’est activé.');
    default: return '';
  }
}
function appScreen() {
  const c = game.character;
  root.innerHTML = `
  <div class="game-shell">
    <header class="topbar"><div class="brand"><span class="brand-mark">OP</span><span>ONE PIECE LIFE</span></div><button class="text-button" data-action="new" aria-label="Commencer une nouvelle vie">Nouvelle vie</button></header>
    <section class="profile"><p class="eyebrow">VOTRE PERSONNAGE</p><h1>${esc(c.firstName)} ${esc(c.lastName)}</h1><div class="profile-sub"><span>${c.age} ans</span><span aria-hidden="true">·</span><span>${esc(SEAS.find(s => s.id === c.sea)?.name)}</span></div><div class="profile-place">${esc(c.place)}</div><div class="stat-grid">${stats()}</div><div class="wallet">Patrimoine actuel <strong>${fmt(c.money)} B</strong></div></section>
    <main class="content" id="main-content" tabindex="-1">${panel()}</main>
    <footer class="bottom-area">
      ${tab === 'life' ? `<button class="age-button" data-action="age" ${!c.alive ? 'disabled' : ''}>${c.alive ? '+ ÂGE <span>Une année de plus</span>' : 'FIN DE VIE <span>Commencez une nouvelle histoire</span>'}</button>` : ''}
      <nav class="tabbar" aria-label="Navigation principale">${TABS.map(([key,label,symbol]) =>
        `<button data-tab="${key}" class="tab ${tab===key?'selected':''}" aria-current="${tab===key?'page':'false'}"><span aria-hidden="true" class="tab-icon">${symbol}</span><span>${label}</span></button>`
      ).join('')}</nav>
    </footer>
    ${error ? `<p role="alert" class="toast">${esc(error)}</p>` : ''}
  </div>`;
}
function render() {
  document.title = game ? `${game.character.firstName} · One Piece Life` : 'One Piece Life | Rebirth';
  if (!game) createScreen(); else appScreen();
}
root.addEventListener('change', e => {
  if (e.target.id === 'sea-select') {
    draftSea = e.target.value;
    document.querySelector('#place-select').innerHTML = placeOptions();
  }
});
root.addEventListener('submit', e => {
  if (e.target.id !== 'create-form') return;
  e.preventDefault();
  const data = new FormData(e.target);
  const candidate = createGame({
    firstName: data.get('firstName'), lastName: data.get('lastName'),
    gender: data.get('gender'), sea: data.get('sea'), place: data.get('place'),
    seed: Date.now() >>> 0
  });
  if (!saveGame(candidate)) {
    error = 'Le navigateur bloque la sauvegarde locale. Activez le stockage pour jouer sans perdre votre progression.';
  } else { error = ''; game = candidate; tab = 'life'; }
  render();
});
root.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.tab) {
    tab = button.dataset.tab;
    error = ''; render();
    document.querySelector('#main-content')?.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.action === 'age' && game?.character.alive) {
    const next = advanceYear(game);
    if (!saveGame(next)) {
      error = 'Impossible d’enregistrer cette année : progression non appliquée.';
    } else { game = next; error = ''; }
    render();
    document.querySelector('.entry:last-child')?.scrollIntoView({ block: 'end', behavior: 'auto' });
  }
  if (button.dataset.action === 'new' && game) {
    if (!window.confirm('Commencer une nouvelle vie ? Cette action efface uniquement la sauvegarde Rebirth actuelle.')) return;
    if (deleteGame()) { game = null; tab = 'life'; draftSea = 'random'; error = ''; }
    else { error = 'Impossible de supprimer la sauvegarde.'; }
    render();
  }
});
// On sort de l'ancien service worker pour éviter de garder en cache l'ancienne interface.
if ('serviceWorker' in navigator) {
  const currentScope = new URL('./', document.baseURI).href;
  navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(
      registrations.filter(reg => reg.scope === currentScope).map(reg => reg.unregister())
    ))
    .catch(() => {});
}
render();
