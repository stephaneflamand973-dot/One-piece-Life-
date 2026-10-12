import { isValidState } from './state.mjs';

// N'ouvre jamais les sauvegardes des anciennes versions One Piece Life.
export const SAVE_KEY = 'opl:foundation:life-v02';

function resolveStorage(storage) {
  try { return storage === undefined ? globalThis.localStorage : storage; }
  catch { return null; }
}
export function loadState(storage) {
  try {
    const raw = resolveStorage(storage)?.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return isValidState(data) ? data : null;
  } catch { return null; }
}
export function saveState(state, storage) {
  if (!isValidState(state)) return false;
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    target.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; }
}
export function eraseState(storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    target.removeItem(SAVE_KEY);
    return true;
  } catch { return false; }
}
