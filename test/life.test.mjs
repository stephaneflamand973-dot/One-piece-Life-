import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyState, beginLife, advanceOneYear, isValidState, MAX_AGE } from '../foundation/src/core/state.mjs';
import { createCharacter } from '../foundation/src/core/life.mjs';
import { SEAS } from '../foundation/src/core/places.mjs';
import { createEngine } from '../foundation/src/core/engine.mjs';
import { SAVE_KEY, loadState, saveState, eraseState } from '../foundation/src/core/storage.mjs';

const options={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
function fakeStorage(){
  const map=new Map([['one-piece-life:legacy','intouchable']]);
  const storage={getItem:key=>map.get(key)??null,setItem:(key,v)=>map.set(key,v),removeItem:key=>map.delete(key)};
  return {storage,map};
}
test('création à 0 an et événement de naissance unique',()=>{
  const base=createEmptyState();
  const game=beginLife(base,options);
  assert.equal(base.activeLife,null);
  assert.equal(game.activeLife.age,0);
  assert.equal(game.history.length,1);
  assert.equal(game.history[0].type,'birth');
  assert.equal(game.activeLife.origin.place,'Village de Fuchsia');
  assert.ok(isValidState(game));
  assert.throws(()=>beginLife(game,options));
});
test('bouton + Âge = exactement un an et une entrée, sans modifier l’ancien état',()=>{
  const a=beginLife(createEmptyState(),options);
  const b=advanceOneYear(a);
  assert.equal(a.activeLife.age,0);
  assert.equal(b.activeLife.age,1);
  assert.equal(b.history.length,2);
  assert.equal(b.history[1].age,1);
  assert.equal(b.history[1].text,'Vous avez maintenant 1 an.');
  assert.ok(isValidState(b));
  assert.equal(b.activeLife, b.activeLife === a.activeLife ? a.activeLife : b.activeLife);
  assert.notStrictEqual(a.activeLife,b.activeLife);
});
test('120 années successives, limite, aucune dérive ou doublon',()=>{
  let state=beginLife(createEmptyState(),options);
  for(let n=1;n<=MAX_AGE;n++){
    state=advanceOneYear(state);
    assert.equal(state.activeLife.age,n);
    assert.equal(state.history.length,n+1);
    assert.ok(isValidState(state));
  }
  assert.equal(state.activeLife.alive,false);
  assert.equal(advanceOneYear(state),null);
});
test('sélection aléatoire contrôlable et liste de lieux cohérente',()=>{
  for(const n of [0,0.25,0.50,0.75,0.999999]){
    const person=createCharacter({},()=>n);
    assert.ok(SEAS.some(s=>s.id===person.origin.sea && s.places.includes(person.origin.place)));
    assert.ok(['M','F'].includes(person.gender));
    assert.ok(person.firstName && person.lastName);
  }
  assert.throws(()=>createCharacter({},()=>1));
  assert.throws(()=>createCharacter({},()=>-0.1));
});
test('persistance propre, reprise de vie et protection des sauvegardes historiques',()=>{
  const {storage,map}=fakeStorage();
  const app=createEngine({storage,random:()=>0});
  assert.equal(app.startLife(options),true);
  assert.equal(app.age(),true);
  assert.equal(app.getState().activeLife.age,1);
  const restored=createEngine({storage});
  assert.equal(restored.getState().activeLife.age,1);
  assert.equal(restored.getState().history.length,2);
  assert.ok(map.has(SAVE_KEY));
  assert.equal(restored.restart(),true);
  assert.equal(restored.getState().activeLife,null);
  assert.equal(map.has(SAVE_KEY),false);
  assert.equal(map.get('one-piece-life:legacy'),'intouchable');
});
test('sauvegarde bloquée = aucune transition silencieuse',()=>{
  const storage={getItem:()=>null,setItem:()=>{throw new Error('blocked')},removeItem:()=>{throw new Error('blocked')}};
  const app=createEngine({storage,random:()=>0});
  assert.equal(app.startLife(options),false);
  assert.equal(app.getState().activeLife,null);
  assert.equal(app.age(),false);
  assert.equal(app.restart(),false);
});
test('rejet des sauvegardes invalides et aucune migration de sauvegarde V0.1',()=>{
  const {storage,map}=fakeStorage();
  const state=beginLife(createEmptyState(),options);
  assert.equal(saveState(state,storage),true);
  const invalid={...state,activeLife:{...state.activeLife,age:80}};
  assert.equal(saveState(invalid,storage),false);
  map.set(SAVE_KEY,JSON.stringify(invalid));
  assert.equal(loadState(storage),null);
  assert.equal(eraseState(storage),true);
  assert.equal(map.get('one-piece-life:legacy'),'intouchable');
});
