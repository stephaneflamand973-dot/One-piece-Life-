import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../foundation/src/core/engine.mjs';
import { createEmptyState, beginLife, advanceOneYear, resolveDecision,
  socialize, socializeGroup, makeFriend, isValidState } from '../foundation/src/core/state.mjs';
import { syncCircle } from '../foundation/src/core/social-evolution.mjs';
import { sceneForAge } from '../foundation/src/core/events.mjs';
import { migrateV06, V06_SAVE_KEY, SAVE_KEY } from '../foundation/src/core/storage.mjs';
import { renderRelationships } from '../foundation/src/ui/relations-view.mjs';

const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
function fakeStorage(){
  const data=new Map();
  return {data,storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),
    removeItem:k=>data.delete(k)}};
}
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
  voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function advanceTo(engine,age){
  while(engine.getState().activeLife.age<age){
    assert.equal(engine.age(),true);
    const pending=engine.getState().domainData.story.pending;
    if(pending)assert.ok(engine.choose(choices[pending.eventId]));
    if(engine.getState().domainData.relationships.pending)
      assert.ok(engine.answerNpc('accept'));
  }
  return engine.getState();
}
test('une naissance de cadet est possible à 4 ans, sans ajouter de ligne dans le journal',()=>{
  const {storage}=fakeStorage();
  const engine=createEngine({storage,random:()=>0});
  assert.ok(engine.startLife(hero));
  assert.equal(engine.getState().domainData.relationships.people.filter(p=>p.role==='sibling').length,0);
  const state=advanceTo(engine,4);
  const baby=state.domainData.relationships.people.find(p=>p.role==='sibling');
  assert.ok(baby);
  assert.equal(baby.id,'sibling-1');
  assert.equal(baby.ageOffset,-4);
  assert.equal(baby.createdAtAge,4);
  assert.equal(state.history.length,5);
  assert.match(state.history[4].text,/famille accueille/);
  assert.equal(state.domainData.relationships.records.at(-1).action,'birth');
  assert.equal(socialize(state,baby.id,'talk',()=>0),null);
  assert.ok(isValidState(state));
});
test('naissance probabiliste non forcée, parents trop âgés et limite de fratrie',()=>{
  const state=beginLife(createEmptyState(),hero,()=>0);
  let noBirth=state;
  for(let age=1;age<=4;age++)noBirth=advanceOneYear(noBirth,()=>0.99999);
  assert.equal(noBirth.domainData.relationships.people.filter(p=>p.role==='sibling').length,0);
  // Trois naissances maximum, à 4, 8 et 12 ans.
  const {storage}=fakeStorage();
  const engine=createEngine({storage,random:()=>0});
  engine.startLife(hero);
  advanceTo(engine,15);
  const sibling=engine.getState().domainData.relationships.people.filter(p=>p.role==='sibling');
  assert.equal(sibling.length,3);
  assert.deepEqual(sibling.map(p=>p.createdAtAge),[4,8,12]);
  assert.ok(isValidState(engine.getState()));
});
test('à deux amis, un cercle apparaît ; sortie positive ou négative, cohésion et liens modifiés',()=>{
  let state=beginLife(createEmptyState(),hero,()=>0.4);
  for(let age=1;age<=6;age++){
    state=advanceOneYear(state);
    if(state.domainData.story.pending)
      state=resolveDecision(state,sceneForAge(age).options[0].id);
  }
  state=makeFriend(state,()=>0.5);
  assert.equal(state.domainData.relationships.groups.length,0);
  state=makeFriend(state,()=>0.6);
  assert.equal(state.domainData.relationships.groups.length,1);
  const group=state.domainData.relationships.groups[0];
  assert.deepEqual(group.members,['friend-1','friend-2']);
  assert.equal(group.cohesion,55);
  assert.equal(socializeGroup(state,()=>0),null,'activité uniquement à partir de 8 ans');
  while(state.activeLife.age<8) state=advanceOneYear(state);
  assert.equal(state.domainData.relationships.actionsUsed,0);
  const good=socializeGroup(state,()=>0);
  const bad=socializeGroup(state,()=>0.99999);
  assert.ok(good && bad);
  assert.ok(good.domainData.relationships.groups[0].cohesion>state.domainData.relationships.groups[0].cohesion);
  assert.ok(bad.domainData.relationships.groups[0].cohesion<state.domainData.relationships.groups[0].cohesion);
  assert.ok(good.domainData.relationships.people.find(p=>p.id==='friend-1').bond >
    bad.domainData.relationships.people.find(p=>p.id==='friend-1').bond);
  assert.equal(good.domainData.relationships.actionsUsed,1);
  assert.equal(socializeGroup(good,()=>0),null,'pas deux sorties de groupe la même année');
  assert.ok(isValidState(good));
});
test('une amitié forte devient un souvenir permanent et la fiche reste concise',()=>{
  let state=beginLife(createEmptyState(),hero,()=>0);
  while(state.activeLife.age<6){
    const age=state.activeLife.age+1;
    state=advanceOneYear(state);
    if(state.domainData.story.pending)
      state=resolveDecision(state,sceneForAge(age).options[0].id);
  }
  state=makeFriend(state,()=>0);
  const target=state.domainData.relationships.people.find(p=>p.role==='friend');
  const prepared={...state,domainData:{...state.domainData,
    relationships:{...state.domainData.relationships,
      people:state.domainData.relationships.people.map(p=>p.id===target.id?
        {...p,bond:79,trust:70}:p)}}};
  assert.ok(isValidState(prepared));
  const strong=socialize(prepared,target.id,'spend',()=>0);
  assert.equal(strong.domainData.relationships.milestones.length,1);
  assert.equal(strong.domainData.relationships.milestones[0].personId,target.id);
  assert.equal(socialize(strong,target.id,'talk',()=>0),null);
  const html=renderRelationships(strong,{selectedId:target.id});
  assert.match(html,/Amitié marquante/);
  assert.ok(!html.includes('<script>'));
  assert.ok(isValidState(strong));
});
test('migration depuis V0.4.2 conserve événements, liens, décisions et groupes reconstruits',()=>{
  const {storage,data}=fakeStorage();
  const engine=createEngine({storage,random:()=>0.4});
  engine.startLife(hero);
  advanceTo(engine,6);
  engine.meet();engine.meet();
  advanceTo(engine,9);
  const original=engine.getState();
  const previous={...original,schemaVersion:6,domainData:{
    ...original.domainData,
    relationships:Object.fromEntries(Object.entries(original.domainData.relationships)
      .filter(([key])=>key!=='groups'&&key!=='milestones'))
  }};
  const expected=previous.domainData.relationships;
  data.clear();data.set(V06_SAVE_KEY,JSON.stringify(previous));
  const imported=createEngine({storage});
  const migrated=imported.getState();
  assert.ok(isValidState(migrated));
  assert.equal(migrated.activeLife.age,9);
  assert.deepEqual(migrated.history,original.history);
  assert.deepEqual(migrated.domainData.story,original.domainData.story);
  for(const key of ['people','records','pending','initiatives','actionsUsed'])
    assert.deepEqual(migrated.domainData.relationships[key],expected[key]);
  assert.equal(migrated.domainData.relationships.groups.length,1);
  assert.ok(data.has(SAVE_KEY));
  assert.equal(data.get(V06_SAVE_KEY),JSON.stringify(previous));
  assert.deepEqual(migrateV06(previous),migrated);
  assert.ok(imported.restart());
  assert.equal(createEngine({storage}).getState().activeLife,null);
});
test('une sauvegarde impossible ne crée ni sortie ni naissance en mémoire',()=>{
  const {storage,data}=fakeStorage();
  const original=createEngine({storage,random:()=>0});
  original.startLife(hero);advanceTo(original,6);
  original.meet();original.meet();advanceTo(original,8);
  const blocked={...storage,setItem:()=>{throw Error('blocked')}};
  const engine=createEngine({storage:blocked,random:()=>0});
  const snapshot=engine.getState();
  assert.equal(engine.gather(),false);
  assert.strictEqual(engine.getState(),snapshot);
  assert.equal(engine.age(),false);
  assert.equal(data.has(SAVE_KEY),true);
});
