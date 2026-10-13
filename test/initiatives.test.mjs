import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../foundation/src/core/engine.mjs';
import { createEmptyState, beginLife, isValidState, advanceOneYear } from '../foundation/src/core/state.mjs';
import { initiativeForAge, initiativeScene, INITIATIVE_AGES } from '../foundation/src/core/initiatives.mjs';
import { migrateV05, loadState, SAVE_KEY, V05_SAVE_KEY } from '../foundation/src/core/storage.mjs';
import { renderLife } from '../foundation/src/ui/life-view.mjs';

const person={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
function fakeStorage(){
  const map=new Map();
  return {map,storage:{getItem:key=>map.get(key)??null,
    setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)}};
}
function ageEngine(target,storage){
  const engine=createEngine({storage,random:()=>0});
  engine.startLife(person);
  while(engine.getState().activeLife.age<target){
    assert.equal(engine.age(),true);
    if(engine.getState().domainData.story.pending)assert.equal(engine.choose(
      engine.getState().domainData.story.pending.eventId==='quai'?'aider':
      ({cartes:'etudier',tempete:'aider',horizon:'apprendre',voyageur:'guider',
      passage:'oser',transmission:'enseigner',souvenirs:'raconter'})[
      engine.getState().domainData.story.pending.eventId]),true);
    if(engine.getState().domainData.relationships.pending && engine.getState().activeLife.age<target)
      assert.equal(engine.answerNpc('accept'),true);
  }
  return engine;
}
test('un proche sollicite spontanément le joueur à neuf ans et la partie attend sa réponse',()=>{
  const {storage,map}=fakeStorage();
  const engine=ageEngine(9,storage);
  const state=engine.getState();
  assert.equal(state.activeLife.age,9);
  assert.equal(state.history.length,10);
  assert.equal(state.history[9].type,'npc-event');
  assert.equal(state.domainData.relationships.pending.age,9);
  assert.equal(engine.age(),false);
  assert.equal(engine.meet(),false);
  assert.equal(engine.interact('mother','talk'),false);
  assert.equal(engine.answerNpc('bad'),false);
  assert.ok(isValidState(state));
  assert.ok(map.has(SAVE_KEY));
  const page=renderLife(state);
  assert.ok(page.includes('data-npc-choice="accept"'));
  assert.ok(page.includes('npc-panel'));
  assert.ok(page.includes('UN PROCHE PREND'));
  assert.ok(!page.includes('data-history-age="9"'));
});
test('un événement en attente reste identique après rechargement, sans nouveau tirage',()=>{
  const {storage}=fakeStorage();
  const one=ageEngine(9,storage);
  const before=one.getState();
  const reloaded=createEngine({storage,random:()=>0.99999});
  assert.deepEqual(reloaded.getState(),before);
  assert.equal(reloaded.age(),false);
  assert.equal(reloaded.answerNpc('accept'),true);
  const after=reloaded.getState();
  assert.equal(after.activeLife.age,9);
  assert.equal(after.history.length,10);
  assert.equal(after.history[9].type,'npc-decision');
  assert.equal(after.domainData.relationships.pending,null);
  assert.equal(after.domainData.relationships.initiatives.length,1);
  assert.equal(reloaded.answerNpc('accept'),false);
  assert.ok(isValidState(after));
});
test('deux réponses différentes ont des conséquences persistantes',()=>{
  const a=ageEngine(9,fakeStorage().storage);
  const b=ageEngine(9,fakeStorage().storage);
  const before=a.getState().domainData.relationships.people[0];
  assert.ok(a.answerNpc('accept'));
  assert.ok(b.answerNpc('refuse'));
  const good=a.getState().domainData.relationships.people[0];
  const bad=b.getState().domainData.relationships.people[0];
  assert.ok(good.bond>before.bond);
  assert.ok(bad.bond<before.bond);
  assert.ok(good.trust>bad.trust);
  assert.notEqual(a.getState().history[9].text,b.getState().history[9].text);
  assert.deepEqual(a.getState().domainData.relationships.initiatives[0],
    {age:9,personId:'mother',eventId:'help',option:'accept'});
});
test('initiative probabiliste et situations variées selon personnalité et âge',()=>{
  const rel=beginLife(createEmptyState(),person,()=>0).domainData.relationships;
  assert.equal(initiativeForAge(rel,10,()=>0),null);
  assert.equal(initiativeForAge(rel,9,()=>0.99999),null);
  const roll=values=>{let i=0;return ()=>values[i++];};
  for(const [value,type] of [[0,'help'],[0.4,'invite'],[0.7,'confide'],[0.96,'conflict']]){
    const pending=initiativeForAge(rel,14,roll([0,0,value]));
    assert.equal(pending.eventId,type);
    const scene=initiativeScene(rel,pending);
    assert.equal(scene.options.length,2);
  }
  assert.equal(INITIATIVE_AGES.length,7);
});
test('une vie entière garde une ligne par année et ne cumule jamais deux choix',()=>{
  const {storage}=fakeStorage();
  const engine=createEngine({storage,random:()=>0});
  assert.ok(engine.startLife(person));
  for(let age=1;age<=120;age++){
    assert.ok(engine.age(),'échec à '+age);
    const state=engine.getState();
    assert.equal(state.activeLife.age,age);
    assert.equal(state.history.length,age+1);
    assert.ok(!(state.domainData.story.pending&&state.domainData.relationships.pending));
    if(state.domainData.story.pending){
      const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
        voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
      assert.ok(engine.choose(choices[state.domainData.story.pending.eventId]));
    }
    if(engine.getState().domainData.relationships.pending)
      assert.ok(engine.answerNpc('accept'));
    assert.ok(isValidState(engine.getState()),'état invalide à '+age);
  }
  assert.equal(engine.age(),false);
  assert.ok(engine.getState().domainData.relationships.initiatives.length>=3);
});
test('migration V0.4.1 fidèle et non destructive',()=>{
  const {storage,map}=fakeStorage();
  const engine=ageEngine(8,storage);
  const current=engine.getState();
  const previous={...current,schemaVersion:5,domainData:{
    ...current.domainData,relationships:Object.fromEntries(
      Object.entries(current.domainData.relationships).filter(([key])=>
        key!=='pending'&&key!=='initiatives'&&key!=='groups'&&key!=='milestones'))}};
  map.delete(SAVE_KEY);
  map.set(V05_SAVE_KEY,JSON.stringify(previous));
  const imported=createEngine({storage});
  const next=imported.getState();
  assert.equal(next.activeLife.age,8);
  assert.deepEqual(next.history,previous.history);
  assert.deepEqual(next.domainData.relationships.people,previous.domainData.relationships.people);
  assert.equal(next.domainData.relationships.pending,null);
  assert.deepEqual(next.domainData.relationships.initiatives,[]);
  assert.ok(map.has(SAVE_KEY));
  assert.equal(map.get(V05_SAVE_KEY),JSON.stringify(previous));
  assert.deepEqual(migrateV05(previous),next);
  assert.ok(imported.restart());
  assert.equal(createEngine({storage}).getState().activeLife,null);
});
test('refus d’écriture : pas de résolution fantôme',()=>{
  const {storage,map}=fakeStorage();
  const engine=ageEngine(9,storage);
  const pending=engine.getState();
  const blocked={...storage,setItem:()=>{throw Error('storage blocked')}};
  const newEngine=createEngine({storage:blocked});
  assert.equal(newEngine.answerNpc('accept'),false);
  assert.deepEqual(newEngine.getState(),pending);
  assert.equal(createEngine({storage}).getState().domainData.relationships.pending.age,9);
  map.set(SAVE_KEY,'{broken');
  assert.equal(loadState(storage),null);
  assert.equal(migrateV05({schemaVersion:5,history:[],domainData:{},activeLife:null}),null);
});
