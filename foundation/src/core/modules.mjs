/**
 * Les cinq grands domaines de navigation sont prévus dans l'architecture,
 * mais aucun n'est installé dans une base vierge.
 *
 * Un module futur doit exposer { id, label, render }.
 * Les vues n'apparaissent QUE pour les modules effectivement enregistrés.
 */
export const MODULE_ORDER = Object.freeze([
  'life', 'activities', 'relationships', 'career', 'assets'
]);

export function createModuleRegistry() {
  const installed = new Map();

  return {
    register(module) {
      if (!module || !MODULE_ORDER.includes(module.id) ||
          typeof module.label !== 'string' || !module.label.trim() ||
          typeof module.render !== 'function') {
        throw new TypeError('Module incomplet ou non reconnu');
      }
      if (installed.has(module.id)) throw new Error('Module déjà installé : ' + module.id);
      installed.set(module.id, module);
    },
    get(id) { return installed.get(id) ?? null; },
    visible() { return MODULE_ORDER.flatMap(id => installed.has(id) ? [installed.get(id)] : []); }
  };
}
