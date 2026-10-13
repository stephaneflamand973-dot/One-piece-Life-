import { SEAS, seaById } from '../core/places.mjs';
import {ISLANDS, SEA_LABELS} from '../core/pirate-navigation.mjs';
import { sceneForAge, QUALITY_KEYS } from '../core/events.mjs';
import { initiativeScene } from '../core/initiatives.mjs';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
function option(value, text, selected) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(text)}</option>`;
}
export function placeOptions(seaId = '') {
  const sea = seaById(seaId);
  return option('', 'Aléatoire', '') + (sea?.places ?? []).map(place => option(place, place, '')).join('');
}
export function renderCreation() {
  return `<section class="life-creation" aria-label="Nouvelle vie">
    <div class="creation-heading"><span class="creation-symbol" aria-hidden="true">OP</span>
      <h1>Nouvelle vie</h1><p>Créez votre personnage.</p></div>
    <form class="creation-form" data-create-life>
      <label for="firstName">Prénom <span>Facultatif</span></label>
      <input id="firstName" name="firstName" type="text" maxlength="32" placeholder="Aléatoire" autocomplete="off">
      <label for="lastName">Nom <span>Facultatif</span></label>
      <input id="lastName" name="lastName" type="text" maxlength="32" placeholder="Aléatoire" autocomplete="off">
      <label for="gender">Genre</label>
      <select id="gender" name="gender">${option('', 'Aléatoire', '')}${option('M', 'Masculin', '')}${option('F', 'Féminin', '')}</select>
      <label for="sea-select">Mer de naissance</label>
      <select id="sea-select" name="sea">${option('', 'Aléatoire', '')}${SEAS.map(sea => option(sea.id, sea.label, '')).join('')}</select>
      <label for="place-select">Lieu de naissance</label>
      <select id="place-select" name="place">${placeOptions()}</select>
      <button class="start-button" type="submit">Commencer ma vie <span aria-hidden="true">→</span></button>
    </form>
  </section>`;
}
/** Les barres reflètent exclusivement des données déjà calculées par le moteur. */
function heroMeter(label,value,variant){
 const score=Math.max(0,Math.min(100,Math.round(value)));
 return `<div class="hero-meter hero-meter-${variant}">
   <div class="hero-meter-top"><span>${escapeHtml(label)}</span><strong>${score}%</strong></div>
   <span class="hero-meter-track" role="meter" aria-label="${escapeHtml(label)}"
     aria-valuemin="0" aria-valuemax="100" aria-valuenow="${score}">
     <span style="width:${score}%"></span>
   </span>
 </div>`;
}
const QUALITY_LABELS = Object.freeze({ audace: 'Audace', curiosite: 'Curiosité', solidarite: 'Solidarité' });
function qualitySummary(story) {
  const attained = QUALITY_KEYS.filter(key => story.qualities[key] > 0);
  if (!attained.length) return '';
  return `<div class="life-qualities" aria-label="Qualités développées">${attained.map(key =>
    `<span class="quality-pill">${QUALITY_LABELS[key]} <strong>${story.qualities[key]}</strong></span>`
  ).join('')}</div>`;
}
function decisionPanel(story) {
  if (!story.pending) return '';
  const scene = sceneForAge(story.pending.age);
  if (!scene || scene.id !== story.pending.eventId) return '';
  return `<section class="decision-panel" aria-labelledby="decision-title">
    <p class="decision-eyebrow">UN CHOIX À FAIRE</p>
    <h2 id="decision-title">${escapeHtml(scene.title)}</h2>
    <p class="decision-description">${escapeHtml(scene.text)}</p>
    <div class="decision-buttons">${scene.options.map(choice =>
      `<button type="button" class="decision-choice" data-choice="${choice.id}">${escapeHtml(choice.label)} <span aria-hidden="true">›</span></button>`
    ).join('')}</div>
  </section>`;
}
function npcPanel(rel) {
  if(!rel.pending) return '';
  const scene=initiativeScene(rel,rel.pending);
  if(!scene) return '';
  return `<section class="decision-panel npc-panel" aria-labelledby="npc-decision-title">
    <p class="decision-eyebrow">UN PROCHE PREND L'INITIATIVE</p>
    <h2 id="npc-decision-title">${escapeHtml(scene.title)}</h2>
    <p class="decision-description">${escapeHtml(scene.text)}</p>
    <div class="decision-buttons">${scene.options.map(choice =>
      `<button type="button" class="decision-choice" data-npc-choice="${choice.id}">
        ${escapeHtml(choice.label)} <span aria-hidden="true">›</span>
      </button>`).join('')}</div>
  </section>`;
}
export function renderLife(state, { historyLimit = 8 } = {}) {
  const person = state.activeLife;
  if (!person) return renderCreation();
  const story = state.domainData.story;
  const seaLabel = seaById(person.origin.sea)?.label ?? '';
  const {abilities,career,relationships}=state.domainData;
  const ownShip=career.command;
  const destination=ownShip?.navigation?.location;
  const currentPlace=destination?ISLANDS[destination]?.name:person.origin.place;
  const currentSea=destination?SEA_LABELS[ISLANDS[destination]?.sea]:seaLabel;
  const vocation=ownShip?'CAPITAINE PIRATE':career.pirate?'PIRATE':'AVENTURIER';
  const bounty=career.wanted?.bounty??0;
  const mood=ownShip?ownShip.morale:abilities.skills.volonte;
  // Les sauvegardes restent strictement chronologiques. Seule la vue est inversée.
  // Le nombre de cartes DOM est borné ; le journal complet reste consultable.
  const events = state.history.filter(event => event.type !== 'event' && event.type !== 'npc-event').slice().reverse();
  const limit = Math.max(1, Number.isFinite(historyLimit) ? Math.floor(historyLimit) : 8);
  const timeline = events.slice(0, limit).map((event, index) => `<article data-history-age="${event.age}" class="story-event ${index === 0 ? 'story-latest' : ''} ${event.type === 'end' ? 'story-end' : ''} ${event.type === 'decision' ? 'story-choice' : ''}">
    <div class="story-age">${event.age === 0 ? 'Naissance' : event.age + ' an' + (event.age > 1 ? 's' : '')}</div>
    <p>${escapeHtml(event.text)}</p>
  </article>`).join('');
  const remaining = events.length - Math.min(events.length, limit);
  const more = remaining > 0
    ? `<button type="button" class="story-more" data-show-older>
        Voir les années précédentes <span>(${remaining})</span>
      </button>`
    : '';
  return `<section class="life-main" aria-label="Vie de votre personnage">
    <header class="character-header">
      <div class="hero-main">
        <span class="hero-portrait" aria-hidden="true">
          <span class="character-initial">${escapeHtml(person.firstName.slice(0, 1).toUpperCase())}</span>
        </span>
        <div class="hero-identity">
          <span class="hero-eyebrow">${vocation} <span aria-hidden="true">✦</span> ${person.age} ANS</span>
          <h1>${escapeHtml(person.firstName)} ${escapeHtml(person.lastName)}</h1>
          <p>${escapeHtml(currentPlace??person.origin.place)} · ${escapeHtml(currentSea??seaLabel)}</p>
        </div>
      </div>
      ${bounty>0?`<div class="hero-bounty"><span>AVIS DE RECHERCHE</span>
        <strong>${bounty.toLocaleString('fr-FR')} Berrys</strong></div>`:''}
      <div class="hero-stats" aria-label="État actuel du personnage">
        ${heroMeter('Énergie',100-abilities.fatigue,'energy')}
        ${heroMeter('Réputation',relationships.world.reputation,'reputation')}
        ${heroMeter('Navigation',abilities.skills.navigation,'navigation')}
        ${heroMeter(ownShip?'Moral':'Volonté',mood,'morale')}
      </div>
    </header>
    ${qualitySummary(story)}
    ${decisionPanel(story)}
    ${npcPanel(state.domainData.relationships)}
    <div class="story-title"><div><span class="story-kicker">JOURNAL DE BORD</span>
      <h2>Mon histoire</h2></div><span>${person.age} an${person.age > 1 ? 's' : ''}</span></div>
    <div class="story-list" aria-label="Événements du plus récent au plus ancien">${timeline}${more}</div>
  </section>`;
}
