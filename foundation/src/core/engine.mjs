import { createEmptyState, beginLife, advanceOneYear, resolveDecision } from './state.mjs';
import { loadState, saveState, eraseState } from './storage.mjs';
import { createModuleRegistry } from './modules.mjs';

// Chaque action enregistre un état VALIDE avant de changer l'état visible.
export function createEngine({ storage, random = Math.random } = {}) {
  let state = loadState(storage) ?? createEmptyState();
  const registry = createModuleRegistry();
  const commit = next => {
    if (!next || !saveState(next, storage)) return false;
    state = next;
    return true;
  };
  return Object.freeze({
    getState: () => state,
    modules: registry,
    startLife(options) {
      if (state.activeLife) return false;
      return commit(beginLife(state, options, random));
    },
    age() { return commit(advanceOneYear(state)); },
    choose(optionId) { return commit(resolveDecision(state, optionId)); },
    restart() {
      if (!eraseState(storage)) return false;
      state = createEmptyState();
      return true;
    }
  });
}
