// Catalogue volontairement réduit. Le monde sera enrichi dans des modules dédiés.
export const SEAS = Object.freeze([
  { id: 'east', name: 'East Blue', places: ['Village de Fuchsia', 'Village de Sirop', 'Orange Town'] },
  { id: 'north', name: 'North Blue', places: ['Flevance', 'Spider Miles'] },
  { id: 'west', name: 'West Blue', places: ['Ohara', 'Pays des Fleurs'] },
  { id: 'south', name: 'South Blue', places: ['Baterilla', 'Royaume de Torino'] },
  { id: 'grand', name: 'Grand Line', places: ['Water Seven', 'Alabasta', 'Royaume de Drum'] }
]);
export const SEA_RANDOM = 'random';
export function seaById(id) { return SEAS.find(s => s.id === id); }
