import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createEmptyState, isEmptyState } from '../foundation/src/core/state.mjs';
import { createModuleRegistry, MODULE_ORDER } from '../foundation/src/core/modules.mjs';
import { createEngine } from '../foundation/src/core/engine.mjs';

const page = readFileSync('foundation/index.html', 'utf8');
const app = readFileSync('foundation/src/ui/app.mjs', 'utf8');
const rootIndex = readFileSync('index.html', 'utf8');
const pwa = JSON.parse(readFileSync('foundation/manifest.webmanifest','utf8'));
const docs = readFileSync('README.md','utf8');

test('l’état initial est réellement vierge, sans personnage, événements ou contenu', () => {
  const state = createEmptyState();
  assert.deepEqual(state, { schemaVersion: 1, activeLife: null, history: [], domainData: {} });
  assert.equal(isEmptyState(state), true);
  assert.notStrictEqual(state, createEmptyState());
  assert.equal(createEngine().getState().activeLife, null);
});
test('aucune rubrique n’est installée ni visible par défaut', () => {
  const registry = createModuleRegistry();
  assert.deepEqual(registry.visible(), []);
  assert.deepEqual(MODULE_ORDER, ['life','activities','relationships','career','assets']);
  registry.register({id:'life',label:'Vie',render:()=>''});
  assert.deepEqual(registry.visible().map(x=>x.id), ['life']);
  assert.throws(()=>registry.register({id:'life',label:'Vie',render:()=>''}));
  assert.throws(()=>registry.register({id:'invalid',label:'Inconnu',render:()=>''}));
});
test('l’interface ne lance aucun mécanisme de jeu et n’a pas de contenu préinstallé', () => {
  for (const word of ['+ Âge','Santé','Intelligence','Carrière','Relations','Patrimoine','new-character','Nouvelle vie']) {
    assert.equal(app.includes(word), false, 'Contenu prématuré : '+word);
  }
  assert.ok(app.includes('Base vierge.'));
  assert.equal(app.includes('localStorage'), true); // uniquement dans le commentaire de non-effacement
  assert.ok(!/localStorage\.(getItem|setItem|removeItem)/.test(app));
  assert.ok(!/indexedDB\.(open|deleteDatabase)/.test(app));
  assert.ok(page.includes('src/ui/app.mjs?v=blank-001'));
});
test('la version propre utilise une route et une identité PWA indépendantes', () => {
  assert.ok(rootIndex.includes('./foundation/'));
  assert.equal(pwa.start_url, './');
  assert.equal(pwa.scope, './');
  assert.equal(pwa.id, './foundation-blank');
  assert.ok(docs.toLowerCase().includes('aucune donnée de jeu'));
});
test('tous les moteurs historiques et données d’événements ont quitté la branche principale', () => {
  for(const path of ['app.js','content-v1.js','src/core/events.mjs','src/core/game.mjs','src/core/world.mjs','src/core/storage.mjs']) {
    assert.equal(existsSync(path),false,'Ancienne logique détectée : '+path);
  }
});
