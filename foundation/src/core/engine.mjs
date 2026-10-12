import { createEmptyState, beginLife, advanceOneYear } from './state.mjs';
import { loadState, saveState, eraseState } from './storage.mjs';
import { createModuleRegistry } from './modules.mjs';

// Le moteur gère les mutations et la persistance ; il ne touche pas à l'interface.
// Une transition n'est acceptée que lorsque la sauvegarde a effectivement réussi.
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
    restart() {
      if (!eraseState(storage)) return false;
      state = createEmptyState();
      return true;
    }
  });
}
