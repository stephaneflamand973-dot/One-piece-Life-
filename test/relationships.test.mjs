import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyState, beginLife, advanceOneYear, resolveDecision,
  socialize, makeFriend, isValidState } from '../foundation/src/core/state.mjs';
import { EVENTS, sceneForAge } from '../foundation/src/core/events.mjs';
import { createFamily, MAX_ACTIONS_PER_YEAR, MAX_FRIENDS,
  isValidRelations } from '../foundation/src/core/relationships.mjs';
import { createEngine } from '../foundation/src/core/engine.mjs';
import { loadState, SAVE_KEY, V03_SAVE_KEY, PREVIOUS_SAVE_KEY,
  migrateV03 } from '../foundation/src/core/storage.mjs';
import { renderRelationships } from '../foundation/src/ui/relations-view.mjs';

const opts={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const fresh=()=>beginLife(createEmptyState(),opts,()=>0);
const storage=()=>{
  const map=new Map();
  return {map,adapter:{getItem:k=>map.get(k)??null,
    setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
};
function toAge(target,from=fresh()){
  let state=from;
  while(state.activeLife.age<target){
    state=advanceOneYear(state);
    if(state.domainData.story.pending){
      const scene=sceneForAge(state.activeLife.age);
      state=resolveDecision(state,scene.options[0].id);
    }
  }
  return state;
}
test('à la naissance, mère et père persistants, frères/sœurs parfois présents',()=>{
  const state=fresh();
  const family=state.domainData.relationships.people;
  assert.equal(state.activeLife.age,0);
  assert.equal(family.filter(p=>p.role==='mother').length,1);
  assert.equal(family.filter(p=>p.role==='father').length,1);
  assert.ok(family.every(p=>p.lastName==='Marin'));
  assert.equal(state.domainData.relationships.actionsUsed,0);
  assert.equal(isValidState(state),true);
  const siblingFamily=createFamily(state.activeLife,()=>0.999999);
  assert.equal(siblingFamily.people.filter(p=>p.role==='sibling').length,2);
  assert.ok(isValidRelations(siblingFamily,0,true));
});
test('interactions réelles : âge minimal, lien + ou -, un contact par personne/an, budget de deux',()=>{
  const baby=fresh();
  assert.equal(socialize(baby,'mother','talk'),null);
  const state=toAge(3);
  const initial=state.domainData.relationships.people[0].bond;
  const contacted=socialize(state,'mother','talk');
  assert.equal(contacted.domainData.relationships.people[0].bond,initial+6);
  assert.equal(contacted.domainData.relationships.actionsUsed,1);
  assert.equal(socialize(contacted,'mother','talk'),null);
  const argument=socialize(contacted,'father','argue');
  assert.ok(argument.domainData.relationships.people[1].bond <
    state.domainData.relationships.people[1].bond);
  assert.equal(argument.domainData.relationships.actionsUsed,MAX_ACTIONS_PER_YEAR);
  assert.equal(socialize(argument,'mother','spend'),null);
  assert.equal(state.domainData.relationships.actionsUsed,0);
  assert.equal(isValidState(argument),true);
});
test('rencontre possible à six ans, blocage pendant un événement et amitié persistante',()=>{
  const five=toAge(5);
  const pending=advanceOneYear(five);
  assert.equal(makeFriend(pending,()=>0),null);
  assert.equal(socialize(pending,'mother','talk'),null);
  const state=resolveDecision(pending,'aider');
  const withFriend=makeFriend(state,()=>0);
  assert.equal(withFriend.domainData.relationships.people.filter(p=>p.role==='friend').length,1);
  assert.equal(withFriend.domainData.relationships.records.at(-1).action,'meet');
  assert.equal(withFriend.domainData.relationships.actionsUsed,1);
  const friend=withFriend.domainData.relationships.people.find(p=>p.role==='friend');
  assert.ok(friend);
  const better=socialize(withFriend,friend.id,'spend');
  assert.ok(better.domainData.relationships.people.find(p=>p.id===friend.id).bond>friend.bond);
  assert.equal(better.domainData.relationships.actionsUsed,2);
  assert.equal(makeFriend(better,()=>0),null);
  const next=advanceOneYear(better);
  assert.equal(next.domainData.relationships.actionsUsed,0);
  assert.equal(next.domainData.relationships.people.find(p=>p.id===friend.id).bond,
    better.domainData.relationships.people.find(p=>p.id===friend.id).bond-2);
  assert.equal(isValidState(next),true);
});
test('cap de quatre amis, effets persistants sur plusieurs décennies, décès sans réactivation',()=>{
  let state=toAge(6);
  for(let year=6;year<=9;year++){
    if(state.activeLife.age<year)state=toAge(year,state);
    for(let count=0;count<2;count++)state=makeFriend(state,()=>0);
  }
  assert.equal(state.domainData.relationships.people.filter(p=>p.role==='friend').length,MAX_FRIENDS);
  assert.equal(makeFriend(state,()=>0),null);
  state=toAge(120,state);
  assert.ok(state.domainData.relationships.people.some(p=>p.deceased));
  assert.equal(socialize(state,'mother','talk'),null);
  assert.equal(makeFriend(state,()=>0),null);
  assert.ok(isValidState(state));
});
test('une décision solidaire impacte le lien familial sans consommer d’interaction',()=>{
  const before=advanceOneYear(toAge(5));
  const mother=before.domainData.relationships.people.find(p=>p.id==='mother');
  const after=resolveDecision(before,'aider');
  assert.equal(after.domainData.relationships.people.find(p=>p.id==='mother').bond,
    Math.min(100,mother.bond+3));
  assert.equal(after.domainData.relationships.actionsUsed,0);
});
test('relations visibles, détails et actions accessibles sans révéler du HTML injecté',()=>{
  const state=toAge(7);
  const html=renderRelationships(state,{selectedId:'mother'});
  assert.ok(html.includes('Famille'));
  assert.ok(html.includes('Amis'));
  assert.ok(html.includes('data-interact="talk"'));
  assert.ok(html.includes('data-person-id="mother"'));
  assert.ok(html.includes('data-meet'));
  const evil={...state,domainData:{...state.domainData,
    relationships:{...state.domainData.relationships,people:state.domainData.relationships.people
      .map((p,i)=>i===0?{...p,firstName:'<img src=x onerror=alert(1)>'}:p)}}};
  const safe=renderRelationships(evil,{selectedId:'mother'});
  assert.ok(safe.includes('&lt;img'));
  assert.ok(!safe.includes('<img src=x'));
});
test('rechargement V0.3 : âge, histoire et décisions intacts, famille générée une seule fois',()=>{
  const {adapter,map}=storage();
  const third=toAge(13);
  const legacy={schemaVersion:3,activeLife:third.activeLife,history:third.history,
    domainData:{story:third.domainData.story}};
  map.set(V03_SAVE_KEY,JSON.stringify(legacy));
  const first=createEngine({storage:adapter});
  assert.equal(first.getState().activeLife.age,13);
  assert.deepEqual(first.getState().history,legacy.history);
  assert.deepEqual(first.getState().domainData.story,legacy.domainData.story);
  assert.ok(first.getState().domainData.relationships.people.length>=2);
  const family=first.getState().domainData.relationships;
  const second=createEngine({storage:adapter});
  assert.deepEqual(second.getState().domainData.relationships,family);
  assert.equal(map.get(V03_SAVE_KEY),JSON.stringify(legacy));
  assert.ok(map.has(SAVE_KEY));
  assert.ok(migrateV03(legacy));
});
test('migration V0.2 et reset V0.4 ne réactivent pas les vies des anciennes versions',()=>{
  const {adapter,map}=storage();
  const state=toAge(2);
  const v02={schemaVersion:2,activeLife:state.activeLife,
    history:state.history,domainData:{}};
  map.set(PREVIOUS_SAVE_KEY,JSON.stringify(v02));
  const first=createEngine({storage:adapter});
  assert.equal(first.getState().activeLife.age,2);
  assert.ok(first.restart());
  const after=createEngine({storage:adapter});
  assert.equal(after.getState().activeLife,null);
  assert.equal(map.get(PREVIOUS_SAVE_KEY),JSON.stringify(v02));
});
test('save bloquée, état corrompu et action frauduleuse : aucune transition',()=>{
  let blocked=false;
  const {adapter,map}=storage();
  const adapter2={...adapter,setItem:(k,v)=>{if(blocked)throw Error('blocked');map.set(k,v)}};
  const engine=createEngine({storage:adapter2,random:()=>0});
  engine.startLife(opts);
  for(let i=0;i<3;i++)engine.age();
  const before=engine.getState();
  blocked=true;
  assert.equal(engine.interact('mother','spend'),false);
  assert.strictEqual(engine.getState(),before);
  assert.equal(engine.meet(),false);
  blocked=false;
  const changed={...before,domainData:{...before.domainData,relationships:{
    ...before.domainData.relationships,
    people:before.domainData.relationships.people.map((p,i)=>i===0?{...p,bond:120}:p)}}};
  assert.equal(isValidState(changed),false);
  assert.equal(migrateV03({schemaVersion:3,history:[],domainData:{story:{}},activeLife:{age:6}}),null);
  map.set(SAVE_KEY,'{broken');
  assert.equal(loadState(adapter2),null);
});
