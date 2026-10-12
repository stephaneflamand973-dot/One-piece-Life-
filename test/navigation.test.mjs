import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_ITEMS, SECTIONS, HOME, isSection, makeHash, resolveHash, parentHash, isHome } from '../foundation/src/core/navigation.mjs';
import { createModuleRegistry } from '../foundation/src/core/modules.mjs';

test('cinq destinations toujours dans un ordre cohérent autour de Vie', () => {
  assert.deepEqual(NAV_ITEMS.map(x=>x.id),['career','assets','life','relationships','activities']);
  assert.equal(new Set(NAV_ITEMS.map(x=>x.id)).size,5);
  assert.equal(HOME,'life');
  assert.ok(Object.isFrozen(NAV_ITEMS));
});
test('chaque rubrique possède une route stable et un retour vers Vie', () => {
  for(const section of Object.keys(SECTIONS)){
    assert.equal(isSection(section),true);
    const hash=makeHash(section);
    assert.equal(resolveHash(hash).section,section);
    const route=resolveHash(hash);
    assert.equal(parentHash(route),'#/life');
    if(section==='life') assert.equal(isHome(route),true);
  }
  assert.equal(isSection('none'),false);
  assert.throws(()=>makeHash('none'));
  assert.throws(()=>makeHash('life','../../evil'));
});
test('liens inconnus ou malformés retombent toujours sur Vie', () => {
  for(const bad of ['', '#', '#/nope','#/../life','#/career/%2Ffoo','#/career/foo/bar']){
    assert.deepEqual(resolveHash(bad),{section:'life',page:null,hash:'#/life'});
  }
});
test('une sous-page n’existe que si son module est réellement installé', () => {
  const registry=createModuleRegistry();
  assert.deepEqual(resolveHash('#/career/formations', registry), {section:'career',page:null,hash:'#/career'});
  registry.register({id:'career',label:'Carrière',render:()=>'',pages:[{id:'formations',label:'Formations',render:()=>''}]});
  const result=resolveHash('#/career/formations',registry);
  assert.equal(result.page,'formations');
  assert.equal(parentHash(result),'#/career');
  assert.equal(isHome(result),false);
  assert.equal(registry.getPage('career','formations')?.label,'Formations');
  assert.deepEqual(resolveHash('#/career/invalid',registry),{section:'career',page:null,hash:'#/career'});
});
