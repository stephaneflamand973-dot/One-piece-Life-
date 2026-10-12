import { validBirthplace } from './places.mjs';
import { MAX_AGE, createCharacter, birthEntry, advanceLife, ageEntry } from './life.mjs';
export { MAX_AGE } from './life.mjs';

export const SCHEMA_VERSION = 2;
export function createEmptyState() {
  return { schemaVersion: SCHEMA_VERSION, activeLife: null, history: [], domainData: {} };
}
export function isEmptyState(state) {
  return isValidState(state) && state.activeLife === null;
}
export function isValidState(state) {
  if (!state || typeof state !== 'object' || state.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(state.history) || !state.domainData || typeof state.domainData !== 'object' ||
      Array.isArray(state.domainData) || Object.keys(state.domainData).length !== 0) return false;
  if (state.activeLife === null) return state.history.length === 0;
  const c = state.activeLife;
  if (typeof c !== 'object' || Array.isArray(c) || !c ||
      typeof c.firstName !== 'string' || !c.firstName.trim() || c.firstName.length > 32 ||
      typeof c.lastName !== 'string' || !c.lastName.trim() || c.lastName.length > 32 ||
      !['M', 'F'].includes(c.gender) ||
      !c.origin || !validBirthplace(c.origin.sea, c.origin.place) ||
      !Number.isInteger(c.age) || c.age < 0 || c.age > MAX_AGE ||
      c.alive !== (c.age < MAX_AGE) ||
      state.history.length !== c.age + 1) return false;
  return state.history.every((event, index) =>
    event && Number.isInteger(event.age) && event.age === index &&
    event.type === (index === 0 ? 'birth' : index === MAX_AGE ? 'end' : 'year') &&
    typeof event.text === 'string' && event.text.length >= 1 && event.text.length <= 200);
}
export function beginLife(state, options = {}, random = Math.random) {
  if (!isValidState(state) || state.activeLife) throw new Error('Une vie est déjà en cours ou état invalide');
  const life = createCharacter(options, random);
  return { ...state, activeLife: life, history: [birthEntry(life)] };
}
export function advanceOneYear(state) {
  if (!isValidState(state) || !state.activeLife) return null;
  const life = advanceLife(state.activeLife);
  if (!life) return null;
  return { ...state, activeLife: life, history: [...state.history, ageEntry(life)] };
}
