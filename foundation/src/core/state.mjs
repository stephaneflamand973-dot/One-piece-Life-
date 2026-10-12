import { validBirthplace } from './places.mjs';
import { MAX_AGE, createCharacter, birthEntry, advanceLife, ageEntry } from './life.mjs';
import {
  QUALITY_KEYS, emptyStory, sceneForAge, optionFor,
  annualNarrative, qualityAfterChoice
} from './events.mjs';
export { MAX_AGE } from './life.mjs';

export const SCHEMA_VERSION = 3;
const VALID_HISTORY_TYPES = new Set(['birth','year','event','decision','end']);

export function createEmptyState() {
  return { schemaVersion: SCHEMA_VERSION, activeLife: null,
    history: [], domainData: { story: emptyStory() } };
}
export function isEmptyState(state) {
  return isValidState(state) && state.activeLife === null;
}
function validStory(story, history, age) {
  if (!story || typeof story !== 'object' ||
      !story.qualities || typeof story.qualities !== 'object' ||
      !Array.isArray(story.decisions) || story.decisions.length > 8) return false;
  if (Object.keys(story.qualities).length !== QUALITY_KEYS.length ||
      !QUALITY_KEYS.every(key => Number.isInteger(story.qualities[key]) &&
        story.qualities[key] >= 0 && story.qualities[key] <= 5)) return false;
  const expected = { audace: 0, curiosite: 0, solidarite: 0 };
  let prevAge = -1;
  for (const decision of story.decisions) {
    if (!decision || !Number.isInteger(decision.age) || decision.age <= prevAge ||
        decision.age > age || typeof decision.option !== 'string' ||
        history[decision.age]?.type !== 'decision') return false;
    const scene = sceneForAge(decision.age);
    if (!scene || decision.eventId !== scene.id) return false;
    const option = optionFor(scene, decision.option);
    if (!option) return false;
    expected[option.quality] = Math.min(5, expected[option.quality] + 1);
    prevAge = decision.age;
  }
  if (!QUALITY_KEYS.every(key => story.qualities[key] === expected[key])) return false;
  const unresolved = story.pending;
  if (unresolved === null) return !history.some(entry => entry.type === 'event') &&
    history.filter(entry => entry.type === 'decision').length === story.decisions.length;
  if (!unresolved || !Number.isInteger(unresolved.age) || unresolved.age !== age ||
      !sceneForAge(age) || unresolved.eventId !== sceneForAge(age).id ||
      history[age]?.type !== 'event') return false;
  return history.filter(entry => entry.type === 'event').length === 1 &&
    history.filter(entry => entry.type === 'decision').length === story.decisions.length;
}
export function isValidState(state) {
  if (!state || typeof state !== 'object' || state.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(state.history) || !state.domainData ||
      typeof state.domainData !== 'object' || Array.isArray(state.domainData) ||
      Object.keys(state.domainData).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(state.domainData, 'story')) return false;

  if (state.activeLife === null)
    return state.history.length === 0 &&
      validStory(state.domainData.story, state.history, 0) &&
      state.domainData.story.pending === null &&
      state.domainData.story.decisions.length === 0;
  const c = state.activeLife;
  if (!c || typeof c !== 'object' || Array.isArray(c) ||
      typeof c.firstName !== 'string' || !c.firstName.trim() || c.firstName.length > 32 ||
      typeof c.lastName !== 'string' || !c.lastName.trim() || c.lastName.length > 32 ||
      !['M','F'].includes(c.gender) ||
      !c.origin || !validBirthplace(c.origin.sea, c.origin.place) ||
      !Number.isInteger(c.age) || c.age < 0 || c.age > MAX_AGE ||
      c.alive !== (c.age < MAX_AGE) ||
      state.history.length !== c.age + 1) return false;

  for (let i = 0; i < state.history.length; i++) {
    const item = state.history[i];
    if (!item || item.age !== i || !VALID_HISTORY_TYPES.has(item.type) ||
        typeof item.text !== 'string' || item.text.length === 0 || item.text.length > 300 ||
        (i === 0 && item.type !== 'birth') ||
        (i === MAX_AGE && item.type !== 'end') ||
        (i > 0 && i < MAX_AGE && (item.type === 'birth' || item.type === 'end')) ||
        (item.type === 'event' && i !== c.age) ||
        (item.type === 'decision' && !sceneForAge(i))) return false;
  }
  return validStory(state.domainData.story, state.history, c.age);
}
export function beginLife(state, options = {}, random = Math.random) {
  if (!isEmptyState(state)) throw new Error('Partie non vierge ou invalide');
  const life = createCharacter(options, random);
  return { ...state, activeLife: life, history: [birthEntry(life)] };
}
export function advanceOneYear(state) {
  if (!isValidState(state) || !state.activeLife ||
      state.domainData.story.pending !== null) return null;
  const life = advanceLife(state.activeLife);
  if (!life) return null;
  if (!life.alive) {
    return { ...state, activeLife: life, history: [...state.history, ageEntry(life)] };
  }
  const scene = sceneForAge(life.age);
  const story = state.domainData.story;
  const entry = scene
    ? { age: life.age, type: 'event', text: scene.text }
    : { age: life.age, type: 'year', text: annualNarrative(life, story) };
  const nextStory = scene ? { ...story, pending: { age: life.age, eventId: scene.id } } : story;
  return { ...state, activeLife: life, history: [...state.history, entry],
    domainData: { story: nextStory } };
}
export function resolveDecision(state, optionId) {
  if (!isValidState(state) || !state.activeLife) return null;
  const story = state.domainData.story;
  if (!story.pending) return null;
  const scene = sceneForAge(story.pending.age);
  const option = optionFor(scene, optionId);
  if (!option) return null;
  const newStory = {
    qualities: qualityAfterChoice(story.qualities, option),
    decisions: [...story.decisions, { age: scene.age, eventId: scene.id, option: option.id }],
    pending: null
  };
  const newHistory = [...state.history];
  newHistory[newHistory.length - 1] = { age: scene.age, type: 'decision', text: option.result };
  return { ...state, domainData: { story: newStory }, history: newHistory };
}
