import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createEmptyState, isEmptyState, SCHEMA_VERSION } from '../foundation/src/core/state.mjs';
import { createModuleRegistry, MODULE_ORDER } from '../foundation/src/core/modules.mjs';
import { createEngine } from '../foundation/src/core/engine.mjs';

const page=readFileSync('foundation/index.html','utf8');
const app=readFileSync('foundation/src/ui/app.mjs','utf8');
const rootIndex=readFileSync('index.html','utf8');
const pwa=JSON.parse(readFileSync('foundation/manifest.webmanifest','utf8'));

test('un nouveau jeu est vierge et sans événement ou caractéristique inventée',()=>{
  const state=createEmptyState();
  assert.equal(state.schemaVersion,SCHEMA_VERSION);
  assert.equal(state.activeLife,null);
  assert.deepEqual(state.history,[]);
  assert.deepEqual(state.domainData.story.qualities,{audace:0,curiosite:0,solidarite:0});
  assert.deepEqual(state.domainData.story.decisions,[]);
  assert.equal(state.domainData.story.pending,null);
  assert.equal(isEmptyState(state),true);
  assert.equal(createEngine({storage:null}).getState().activeLife,null);
});
test('seule la rubrique Vie est branchée sur un moteur de jeu',()=>{
  const registry=createModuleRegistry();
  assert.deepEqual(registry.visible(),[]);
  assert.deepEqual(MODULE_ORDER,['life','activities','relationships','career','assets']);
  registry.register({id:'life',label:'Vie',render:()=>''});
  assert.deepEqual(registry.visible().map(x=>x.id),['life']);
  assert.throws(()=>registry.register({id:'life',label:'Vie',render:()=>''}));
  assert.throws(()=>registry.register({id:'inconnu',label:'Inconnu',render:()=>''}));
});
test('nouveau moteur de décisions relié à la navigation existante',()=>{
  assert.ok(app.includes("engine.modules.register({") && app.includes("id: 'life'"));
  assert.ok(app.includes('data-age'));
  assert.ok(app.includes('engine.startLife(options)'));
  assert.ok(app.includes('engine.choose(button.dataset.choice)'));
  assert.ok(page.includes('app.mjs?v=feed-031'));
  assert.ok(!app.includes('STAT_KEYS'));
});
test('PWA séparée et anciens moteurs absents',()=>{
  assert.ok(rootIndex.includes('./foundation/'));
  assert.equal(pwa.id,'./foundation-blank');
  for(const path of ['app.js','content-v1.js','src/core/game.mjs','src/core/world.mjs','src/core/storage.mjs']){
    assert.equal(existsSync(path),false);
  }
});
