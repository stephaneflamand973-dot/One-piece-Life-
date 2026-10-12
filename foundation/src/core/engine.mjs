import { createEmptyState } from './state.mjs';
import { createModuleRegistry } from './modules.mjs';

/**
 * Conteneur d'application neutre. Pas de progression, hasard, événements,
 * statistiques, personnages, métiers ou monnaie codés à cette étape.
 */
export function createEngine() {
  const state = createEmptyState();
  const registry = createModuleRegistry();
  return Object.freeze({
    getState: () => state,
    modules: registry
  });
}
