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

test('nouveau jeu vierge tant que le joueur ne démarre pas une vie',()=>{
  const initial=createEmptyState();
  assert.deepEqual(initial,{schemaVersion:SCHEMA_VERSION,activeLife:null,history:[],domainData:{}});
  assert.equal(isEmptyState(initial),true);
  assert.equal(createEngine({storage:null}).getState().activeLife,null);
});
test('modules autonomes : seules les rubriques installées ont du contenu',()=>{
  const registry=createModuleRegistry();
  assert.deepEqual(registry.visible(),[]);
  assert.deepEqual(MODULE_ORDER,['life','activities','relationships','career','assets']);
  registry.register({id:'life',label:'Vie',render:()=>''});
  assert.deepEqual(registry.visible().map(x=>x.id),['life']);
  assert.throws(()=>registry.register({id:'life',label:'Vie',render:()=>''}));
  assert.throws(()=>registry.register({id:'inconnu',label:'Inconnu',render:()=>''}));
});
test('écran de vie activé sans importer les anciennes mécaniques',()=>{
  assert.ok(app.includes("engine.modules.register({ id: 'life'"));
  assert.ok(app.includes('data-age'));
  assert.ok(app.includes("engine.startLife(options)")); // submission delegates to the life engine
  assert.ok(page.includes('app.mjs?v=life-002'));
  assert.ok(!app.includes('STAT_KEYS'));
});
test('la PWA indépendante et les anciennes sauvegardes sont conservées',()=>{
  assert.ok(rootIndex.includes('./foundation/'));
  assert.equal(pwa.start_url,'./');
  assert.equal(pwa.scope,'./');
  assert.equal(pwa.id,'./foundation-blank');
  assert.ok(!/localStorage\.(removeItem|clear)/.test(app));
});
test('anciens moteurs toujours absents',()=>{
  for(const path of ['app.js','content-v1.js','src/core/events.mjs','src/core/game.mjs','src/core/world.mjs','src/core/storage.mjs']){
    assert.equal(existsSync(path),false);
  }
});
