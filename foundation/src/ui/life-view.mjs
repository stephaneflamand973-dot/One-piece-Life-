import { SEAS, seaById } from '../core/places.mjs';
import { sceneForAge, QUALITY_KEYS } from '../core/events.mjs';

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
export function renderLife(state) {
  const person = state.activeLife;
  if (!person) return renderCreation();
  const story = state.domainData.story;
  const seaLabel = seaById(person.origin.sea)?.label ?? '';
  const timeline = state.history.map(event => `<article class="story-event ${event.type === 'end' ? 'story-end' : ''} ${event.type === 'decision' ? 'story-choice' : ''}">
    <div class="story-age">${event.age === 0 ? 'Naissance' : event.age + ' an' + (event.age > 1 ? 's' : '')}</div>
    <p>${escapeHtml(event.text)}</p>
  </article>`).join('');
  return `<section class="life-main" aria-label="Vie de votre personnage">
    <div class="character-header">
      <span class="character-initial" aria-hidden="true">${escapeHtml(person.firstName.slice(0, 1).toUpperCase())}</span>
      <div><h1>${escapeHtml(person.firstName)} ${escapeHtml(person.lastName)}</h1>
      <p>${person.age} an${person.age > 1 ? 's' : ''} · ${escapeHtml(person.origin.place)} · ${escapeHtml(seaLabel)}</p></div>
    </div>
    ${qualitySummary(story)}
    ${decisionPanel(story)}
    <div class="story-title"><h2>Ma vie</h2><span>${person.age} an${person.age > 1 ? 's' : ''}</span></div>
    <div class="story-list">${timeline}</div>
  </section>`;
}
