import { SEAS, SEA_RANDOM, seaById } from './world.mjs';
import { eventsForAge } from './events.mjs';
export const SCHEMA_VERSION = 1;
export const MAX_AGE = 100;
export const STAT_KEYS = Object.freeze(['sante', 'bonheur', 'intelligence', 'apparence']);
const FIRST = ['Monkey', 'Nami', 'Nico', 'Roronoa', 'Portgas', 'Trafalgar'];
const LAST = ['Dawn', 'Marin', 'Vega', 'Sol', 'Aube', 'D.'];
const clamp = n => Math.max(0, Math.min(100, Math.round(n)));
function draw(seed) {
  const next = (Math.imul(1664525, seed >>> 0) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
}
function pick(items, seed) {
  const result = draw(seed);
  return { item: items[Math.floor(result.value * items.length)], seed: result.seed };
}
function clean(value, fallback) {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 32);
  return text || fallback;
}
export function createGame(options = {}) {
  let seed = (Number(options.seed) >>> 0) || 42;
  let sea = seaById(options.sea);
  if (!sea) { const r = pick(SEAS, seed); sea = r.item; seed = r.seed; }
  let place = sea.places.includes(options.place) ? options.place : null;
  if (!place) { const r = pick(sea.places, seed); place = r.item; seed = r.seed; }
  let firstName = clean(options.firstName, '');
  if (!firstName) { const r = pick(FIRST, seed); firstName = r.item; seed = r.seed; }
  let lastName = clean(options.lastName, '');
  if (!lastName) { const r = pick(LAST, seed); lastName = r.item; seed = r.seed; }
  let gender = options.gender;
  if (gender !== 'F' && gender !== 'M') { const r = pick(['F', 'M'], seed); gender = r.item; seed = r.seed; }
  const born = { id: 'birth', age: 0, type: 'birth', text: `Vous êtes né(e) à ${place}, en ${sea.name}.` };
  return {
    version: SCHEMA_VERSION,
    seed,
    character: {
      firstName, lastName, age: 0, gender, sea: sea.id, place,
      stats: { sante: 85, bonheur: 75, intelligence: 50, apparence: 60 },
      money: 0, alive: true, occupation: null
    },
    history: [born]
  };
}
export function advanceYear(game) {
  if (!isValidGame(game)) throw new TypeError('Sauvegarde invalide');
  if (!game.character.alive) return game;
  const age = game.character.age + 1;
  const character = { ...game.character, age, stats: { ...game.character.stats } };
  const history = [...game.history];
  let seed = game.seed;
  if (age >= MAX_AGE) {
    character.alive = false;
    history.push({ id: `death-${age}`, age, type: 'death', text: 'Votre histoire s’achève après une longue vie.' });
  } else {
    const available = eventsForAge(age);
    const outcome = pick(available, seed);
    seed = outcome.seed;
    const event = outcome.item;
    for (const [key, delta] of Object.entries(event.effects)) {
      character.stats[key] = clamp(character.stats[key] + delta);
    }
    history.push({ id: `${age}-${event.id}`, age, type: 'year', text: event.text });
  }
  return { ...game, seed, character, history };
}
export function isValidGame(g) {
  if (!g || g.version !== SCHEMA_VERSION || !Number.isInteger(g.seed) ||
      !g.character || !Array.isArray(g.history) || !g.history.length) return false;
  const c = g.character;
  if (!Number.isInteger(c.age) || c.age < 0 || c.age > MAX_AGE || typeof c.alive !== 'boolean' ||
      !['M','F'].includes(c.gender) || !seaById(c.sea)?.places.includes(c.place) ||
      typeof c.firstName !== 'string' || !c.firstName || c.firstName.length > 32 ||
      typeof c.lastName !== 'string' || !c.lastName || c.lastName.length > 32 ||
      !Number.isFinite(c.money) || !c.stats || c.occupation !== null) return false;
  if (!STAT_KEYS.every(k => Number.isInteger(c.stats[k]) && c.stats[k] >= 0 && c.stats[k] <= 100)) return false;
  if (g.history.length > MAX_AGE + 1 || g.history.some(e =>
    !e || !Number.isInteger(e.age) || e.age < 0 || e.age > c.age ||
    typeof e.text !== 'string' || e.text.length > 400 || typeof e.id !== 'string')) return false;
  return true;
}
