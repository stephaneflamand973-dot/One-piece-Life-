import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createEmptyState, isEmptyState } from '../foundation/src/core/state.mjs';
import { createModuleRegistry, MODULE_ORDER } from '../foundation/src/core/modules.mjs';
import { createEngine } from '../foundation/src/core/engine.mjs';

const page = readFileSync('foundation/index.html','utf8');
const app = readFileSync('foundation/src/ui/app.mjs','utf8');
const rootIndex = readFileSync('index.html','utf8');
const pwa = JSON.parse(readFileSync('foundation/manifest.webmanifest','utf8'));

test('le jeu reste vierge sans contenu ou statistiques avant le premier module', () => {
  const state = createEmptyState();
  assert.deepEqual(state, {schemaVersion:1, activeLife:null, history:[], domainData:{}});
  assert.equal(isEmptyState(state),true);
  assert.equal(createEngine().getState().activeLife,null);
  assert.notEqual(state,createEmptyState());
});
test('registre de modules vide au lancement', () => {
  const registry=createModuleRegistry();
  assert.deepEqual(registry.visible(),[]);
  assert.deepEqual(MODULE_ORDER,['life','activities','relationships','career','assets']);
  const page={id:'details',label:'Détails',render:()=>'<p>Détails</p>'};
  registry.register({id:'life',label:'Vie',render:()=>'',pages:[page]});
  assert.deepEqual(registry.visible().map(x=>x.id),['life']);
  assert.equal(registry.getPage('life','details')?.label,'Détails');
  assert.equal(registry.getPage('life','inconnu'),null);
  assert.throws(()=>registry.register({id:'life',label:'Vie',render:()=>''}));
  assert.throws(()=>registry.register({id:'inconnu',label:'Inconnu',render:()=>''}));
  assert.throws(()=>createModuleRegistry().register({id:'life',label:'Vie',render:()=>'',pages:[page,page]}));
});
test('aucun gameplay inventé dans la navigation', () => {
  assert.ok(app.includes('Aucune vie commencée.'));
  assert.ok(!app.includes('new-character'));
  assert.ok(!app.includes('advanceYear'));
  assert.ok(!app.includes('money'));
  assert.ok(!app.includes('STAT_KEYS'));
  assert.ok(!/localStorage\.(getItem|setItem|removeItem)/.test(app));
  assert.ok(page.includes('src/ui/app.mjs?v=nav-001'));
});
test('identité indépendante du jeu historique', () => {
  assert.ok(rootIndex.includes('./foundation/'));
  assert.equal(pwa.start_url,'./');
  assert.equal(pwa.scope,'./');
  assert.equal(pwa.id,'./foundation-blank');
});
test('aucun des anciens moteurs présents', () => {
  for(const path of ['app.js','content-v1.js','src/core/events.mjs','src/core/game.mjs','src/core/world.mjs','src/core/storage.mjs']){
    assert.equal(existsSync(path),false,'Ancien moteur détecté : '+path);
  }
});
