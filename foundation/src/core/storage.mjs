import { isValidState, createEmptyState, SCHEMA_VERSION } from './state.mjs';

export const SAVE_KEY = 'opl:foundation:life-v03';
export const PREVIOUS_SAVE_KEY = 'opl:foundation:life-v02';

function resolveStorage(storage) {
  try { return storage === undefined ? globalThis.localStorage : storage; }
  catch { return null; }
}
/**
 * Import ciblé de la V0.2, seulement si aucun état V0.3 n'existe.
 * Les versions antérieures au socle V0.2 ne sont jamais importées.
 * L'original V0.2 est conservé intact.
 */
export function migrateV02(data) {
  if (!data || data.schemaVersion !== 2 || !Array.isArray(data.history) ||
      !data.domainData || Object.keys(data.domainData).length !== 0) return null;
  const c = data.activeLife;
  if (c === null) {
    if (data.history.length) return null;
    return createEmptyState();
  }
  if (!c || !Number.isInteger(c.age) || c.age < 0 || c.age > 120 ||
      c.alive !== (c.age < 120) || data.history.length !== c.age + 1 ||
      !data.history.every((e, index) => e && e.age === index &&
        e.type === (index === 0 ? 'birth' : index === 120 ? 'end' : 'year') &&
        typeof e.text === 'string')) return null;
  const migrated = {
    schemaVersion: SCHEMA_VERSION, activeLife: c, history: data.history,
    domainData: createEmptyState().domainData
  };
  return isValidState(migrated) ? migrated : null;
}
export function loadState(storage) {
  try {
    const store = resolveStorage(storage);
    if (!store) return null;
    const raw = store.getItem(SAVE_KEY);
    if (raw !== null && raw !== undefined)
      return isValidState(JSON.parse(raw)) ? JSON.parse(raw) : null;
    const previous = store.getItem(PREVIOUS_SAVE_KEY);
    if (!previous) return null;
    const migrated = migrateV02(JSON.parse(previous));
    // Sans persistance réussie, on refuse une migration fantôme en mémoire.
    return migrated && saveState(migrated, store) ? migrated : null;
  } catch { return null; }
}
export function saveState(state, storage) {
  if (!isValidState(state)) return false;
  try {
    const store = resolveStorage(storage);
    if (!store) return false;
    store.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; }
}
// Un état vierge stocké empêche l'ancienne vie V0.2 de réapparaître au prochain chargement.
export function eraseState(storage) {
  return saveState(createEmptyState(), storage);
}
