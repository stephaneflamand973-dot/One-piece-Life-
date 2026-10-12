import { SEAS, seaById } from './places.mjs';

// Première brique de simulation : naissance + exactement un an par action.
// Aucun événement aléatoire, caractéristique, métier ou système caché.
export const MAX_AGE = 120;
const FIRST = Object.freeze(['Mika', 'Sora', 'Lina', 'Kaito', 'Nora', 'Toma']);
const LAST = Object.freeze(['Marin', 'Aube', 'Vent', 'Dawn', 'Sol', 'Brume']);

const choose = (items, random) => {
  if (typeof random !== 'function') throw new TypeError('Générateur aléatoire absent');
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new TypeError('Tirage aléatoire invalide');
  return items[Math.floor(value * items.length)];
};
const cleanName = value => String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 32);

export function createCharacter(options = {}, random = Math.random) {
  const sea = options.sea && seaById(options.sea) ? seaById(options.sea) : choose(SEAS, random);
  const place = sea.places.includes(options.place) ? options.place : choose(sea.places, random);
  const firstName = cleanName(options.firstName) || choose(FIRST, random);
  const lastName = cleanName(options.lastName) || choose(LAST, random);
  const gender = ['M', 'F'].includes(options.gender) ? options.gender : choose(['M', 'F'], random);

  return {
    firstName, lastName, gender,
    origin: { sea: sea.id, place },
    age: 0,
    alive: true
  };
}
export function birthEntry(character) {
  return { age: 0, type: 'birth', text: `Vous êtes né(e) à ${character.origin.place} (${seaById(character.origin.sea).label}).` };
}
export function advanceLife(life) {
  if (!life || !life.alive || !Number.isInteger(life.age) || life.age < 0 || life.age >= MAX_AGE) {
    return null;
  }
  const age = life.age + 1;
  return { ...life, age, alive: age < MAX_AGE };
}
export function ageEntry(life) {
  return life.alive
    ? { age: life.age, type: 'year', text: `Vous avez maintenant ${life.age} an${life.age > 1 ? 's' : ''}.` }
    : { age: life.age, type: 'end', text: 'Votre vie s’achève à 120 ans.' };
}
