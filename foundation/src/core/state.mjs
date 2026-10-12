/**
 * Contrat initial de la simulation. Il n'existe AUCUNE donnée jouable
 * tant qu'un module de contenu n'a pas été développé puis branché.
 * Une nouvelle instance est créée à chaque démarrage : zéro ancienne sauvegarde lue.
 */
export const SCHEMA_VERSION = 1;

export function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeLife: null,
    history: [],
    domainData: {}
  };
}

export function isEmptyState(state) {
  return Boolean(state && state.schemaVersion === SCHEMA_VERSION &&
    state.activeLife === null &&
    Array.isArray(state.history) && state.history.length === 0 &&
    state.domainData && typeof state.domainData === 'object' &&
    Object.keys(state.domainData).length === 0);
}
