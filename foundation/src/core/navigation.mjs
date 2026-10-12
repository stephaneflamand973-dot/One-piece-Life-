/**
 * ONE PIECE LIFE — ROUTAGE DE L'INTERFACE.
 * La navigation est volontairement indépendante du gameplay et de la sauvegarde.
 * Les cinq destinations sont des emplacements, pas des mécaniques installées.
 */
export const NAV_ITEMS = Object.freeze([
  Object.freeze({ id: 'career', label: 'Carrière', icon: 'briefcase' }),
  Object.freeze({ id: 'assets', label: 'Biens', icon: 'wallet' }),
  Object.freeze({ id: 'life', label: 'Vie', icon: 'plus' }),
  Object.freeze({ id: 'relationships', label: 'Relations', icon: 'users' }),
  Object.freeze({ id: 'activities', label: 'Activités', icon: 'dots' })
]);
export const HOME = 'life';
export const SECTIONS = Object.freeze(Object.fromEntries(NAV_ITEMS.map(({ id, label }) => [id, label])));
const SAFE_SEGMENT = /^[a-z][a-z0-9-]{0,39}$/;

export function isSection(id) {
  return Object.prototype.hasOwnProperty.call(SECTIONS, id);
}
export function makeHash(section = HOME, page = null) {
  if (!isSection(section)) throw new TypeError('Destination inconnue');
  if (page != null && !SAFE_SEGMENT.test(page)) throw new TypeError('Sous-page invalide');
  return '#/' + section + (page ? '/' + page : '');
}
/**
 * Des liens profonds vers une sous-page non enregistrée retombent sur
 * sa catégorie, sans inventer une fonctionnalité.
 */
export function resolveHash(hash, moduleRegistry = null) {
  const match = /^#\/(life|career|assets|relationships|activities)(?:\/([a-z][a-z0-9-]{0,39}))?$/.exec(hash || '');
  if (!match) return Object.freeze({ section: HOME, page: null, hash: makeHash(HOME) });
  const section = match[1];
  const candidate = match[2] ?? null;
  const page = candidate && moduleRegistry?.getPage(section, candidate) ? candidate : null;
  return Object.freeze({ section, page, hash: makeHash(section, page) });
}
export function parentHash(route) {
  return route.page ? makeHash(route.section) : makeHash(HOME);
}
export function isHome(route) {
  return route.section === HOME && route.page == null;
}
