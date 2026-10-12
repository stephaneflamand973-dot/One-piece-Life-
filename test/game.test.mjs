import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advanceYear, isValidGame, MAX_AGE } from '../src/core/game.mjs';
import { seaById, SEAS } from '../src/core/world.mjs';
import { loadGame, saveGame, deleteGame, SAVE_KEY } from '../src/core/storage.mjs';

const setup = { firstName: 'Lina', lastName: 'Dawn', gender: 'F', sea: 'east', place: 'Village de Fuchsia', seed: 12345 };
test('un nouveau personnage est vierge, complet et sauvegardable', () => {
  const game = createGame(setup);
  assert.equal(game.character.age, 0);
  assert.equal(game.character.occupation, null);
  assert.equal(game.character.money, 0);
  assert.equal(game.history.length, 1);
  assert.ok(isValidGame(game));
});
test('une pression correspond à exactement une année, sans mutation', () => {
  const before = createGame(setup);
  const after = advanceYear(before);
  assert.equal(before.character.age, 0);
  assert.equal(after.character.age, 1);
  assert.equal(after.history.length, before.history.length + 1);
  assert.notEqual(after.character, before.character);
  assert.notEqual(after.history, before.history);
});
test('même graine, même vie ; aucune statistique ne sort des limites', () => {
  let a = createGame(setup), b = createGame(setup);
  for (let i = 0; i < MAX_AGE; i++) {
    a = advanceYear(a); b = advanceYear(b);
    assert.deepEqual(a, b);
    assert.equal(a.character.age, i + 1);
    assert.ok(isValidGame(a));
  }
  assert.equal(a.character.alive, false);
  assert.strictEqual(advanceYear(a), a);
  assert.equal(a.history.length, MAX_AGE + 1);
});
test('la naissance aléatoire reste dans une mer et un lieu connus', () => {
  for (let seed = 1; seed < 200; seed++) {
    const g = createGame({ seed });
    assert.ok(SEAS.some(s => s.id === g.character.sea));
    assert.ok(seaById(g.character.sea).places.includes(g.character.place));
    assert.ok(['F','M'].includes(g.character.gender));
  }
});
test('une sauvegarde corrompue est rejetée sans écraser les anciennes clés', () => {
  const cache = new Map([['one-piece-life:legacy', 'intouchable']]);
  const store = { getItem:k=>cache.get(k)??null, setItem:(k,v)=>cache.set(k,v), removeItem:k=>cache.delete(k) };
  const g = createGame(setup);
  assert.equal(saveGame(g, store), true);
  assert.deepEqual(loadGame(store), g);
  cache.set(SAVE_KEY, JSON.stringify({...g, character:{...g.character, age: -2}}));
  assert.equal(loadGame(store), null);
  assert.equal(deleteGame(store), true);
  assert.equal(cache.get('one-piece-life:legacy'), 'intouchable');
});
test('les entrées de noms ne deviennent jamais des balises HTML de l’interface', () => {
  const g = createGame({...setup, firstName:'<script>alert(1)</script>'});
  assert.ok(g.character.firstName.length <= 32);
  assert.ok(isValidGame(g));
});
