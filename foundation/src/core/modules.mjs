/**
 * Registre de domaines métier, séparé de la navigation permanente.
 * Les cinq destinations existent; aucun module n'est installé par défaut.
 * Chaque module futur peut exposer des sous-pages, validées par le routeur.
 */
export const MODULE_ORDER = Object.freeze([
  'life', 'activities', 'relationships', 'career', 'assets'
]);
const PAGE_ID = /^[a-z][a-z0-9-]{0,39}$/;

export function createModuleRegistry() {
  const installed = new Map();
  function checkPage(page) {
    return Boolean(page && typeof page.id === 'string' && PAGE_ID.test(page.id) &&
      typeof page.label === 'string' && page.label.trim() &&
      typeof page.render === 'function');
  }
  return Object.freeze({
    register(module) {
      if (!module || !MODULE_ORDER.includes(module.id) ||
          typeof module.label !== 'string' || !module.label.trim() ||
          typeof module.render !== 'function') {
        throw new TypeError('Module incomplet ou non reconnu');
      }
      if (installed.has(module.id)) throw new Error('Module déjà installé : ' + module.id);
      const pages = module.pages ?? [];
      if (!Array.isArray(pages) || !pages.every(checkPage) ||
          new Set(pages.map(p => p.id)).size !== pages.length) {
        throw new TypeError('Sous-pages incorrectes ou dupliquées');
      }
      installed.set(module.id, Object.freeze({ ...module, pages: Object.freeze([...pages]) }));
    },
    get(id) { return installed.get(id) ?? null; },
    getPage(section, id) {
      return installed.get(section)?.pages.find(page => page.id === id) ?? null;
    },
    visible() {
      return MODULE_ORDER.flatMap(id => installed.has(id) ? [installed.get(id)] : []);
    }
  });
}
