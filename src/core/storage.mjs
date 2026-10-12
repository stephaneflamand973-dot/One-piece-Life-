import { isValidGame } from './game.mjs';
// Clé distincte : les sauvegardes des anciennes versions restent intactes.
export const SAVE_KEY = 'one-piece-life:rebirth:v1';
export function loadGame(store = globalThis.localStorage) {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (!raw) return null;
    const game = JSON.parse(raw);
    return isValidGame(game) ? game : null;
  } catch { return null; }
}
export function saveGame(game, store = globalThis.localStorage) {
  if (!isValidGame(game)) return false;
  try { store.setItem(SAVE_KEY, JSON.stringify(game)); return true; }
  catch { return false; }
}
export function deleteGame(store = globalThis.localStorage) {
  try { store.removeItem(SAVE_KEY); return true; }
  catch { return false; }
}
