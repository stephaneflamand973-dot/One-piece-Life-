// Les lieux de départ sont des données, séparées de toute logique de personnage.
export const SEAS = Object.freeze([
  Object.freeze({ id: 'east', label: 'East Blue', places: Object.freeze(['Village de Fuchsia', 'Orange Town', 'Village de Sirop', 'Loguetown']) }),
  Object.freeze({ id: 'north', label: 'North Blue', places: Object.freeze(['Flevance', 'Spider Miles']) }),
  Object.freeze({ id: 'south', label: 'South Blue', places: Object.freeze(['Baterilla', 'Royaume de Torino']) }),
  Object.freeze({ id: 'west', label: 'West Blue', places: Object.freeze(['Ohara', 'Pays des Fleurs']) }),
  Object.freeze({ id: 'grand', label: 'Grand Line', places: Object.freeze(['Alabasta', 'Water Seven', 'Royaume de Drum', 'Archipel Sabaody']) })
]);
export function seaById(id) { return SEAS.find(sea => sea.id === id) ?? null; }
export function validBirthplace(sea, place) {
  return typeof place === 'string' && Boolean(seaById(sea)?.places.includes(place));
}
