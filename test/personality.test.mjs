import test from 'node:test';
import assert from 'node:assert/strict';
import { beginLife, createEmptyState, advanceOneYear, resolveDecision,
  socialize, makeFriend, isValidState } from '../foundation/src/core/state.mjs';
import { sceneForAge } from '../foundation/src/core/events.mjs';
import { ACTIONS, MAX_ACTIONS_PER_YEAR } from '../foundation/src/core/relationships.mjs';
import { availability, reactionChance, TRAITS } from '../foundation/src/core/personality.mjs';
import { renderRelationships } from '../foundation/src/ui/relations-view.mjs';
import { createEngine } from '../foundation/src/core/engine.mjs';
import { V04_SAVE_KEY, V03_SAVE_KEY, SAVE_KEY, migrateV04, loadState } from '../foundation/src/core/storage.mjs';

const character={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const memory=()=>{const map=new Map();return {map,storage:{
  getItem:key=>map.get(key)??null,
  setItem:(key,value)=>map.set(key,value),
  removeItem:key=>map.delete(key)
}};};
function ageTo(age){
  let game=beginLife(createEmptyState(),character,()=>0.37);
  while(game.activeLife.age<age){
    game=advanceOneYear(game);
    if(game.domainData.story.pending)
      game=resolveDecision(game,sceneForAge(game.activeLife.age).options[0].id);
  }
  return game;
}
function oldVersion(state){
  return {...state,schemaVersion:4,domainData:{
    story:state.domainData.story,
    relationships:Object.fromEntries(Object.entries({
      ...state.domainData.relationships,
      people:state.domainData.relationships.people.map(({traits,trust,respect,rivalry,...old})=>old)
    }).filter(([key])=>key!=='pending'&&key!=='initiatives'&&key!=='groups'&&key!=='milestones'&&key!=='world'))
  }};
}

test('profils distincts, bornés et conservés dans la sauvegarde',()=>{
  const game=beginLife(createEmptyState(),character,()=>0.3);
  for(const person of game.domainData.relationships.people){
    assert.deepEqual(Object.keys(person.traits).sort(),[...TRAITS].sort());
    assert.ok(TRAITS.every(key=>Number.isInteger(person.traits[key])&&person.traits[key]>=0&&person.traits[key]<=100));
    for(const key of ['trust','respect','rivalry'])
      assert.ok(person[key]>=0&&person[key]<=100);
  }
  assert.ok(isValidState(game));
});
test('personnalité et confiance changent la probabilité, sans dépasser les bornes',()=>{
  const game=ageTo(7),rel=game.domainData.relationships;
  const mother=rel.people.find(p=>p.id==='mother');
  const positive={...mother,trust:95,bond:95,traits:{...mother.traits,sociability:90}};
  const negative={...mother,trust:5,bond:5,traits:{...mother.traits,sociability:10}};
  const best=reactionChance(rel,positive,'talk');
  const worst=reactionChance(rel,negative,'talk');
  assert.ok(best>worst);
  assert.ok(best<=95&&worst>=12);
  assert.equal(availability(rel,mother,'confide',7).enabled,false);
  assert.equal(availability(rel,mother,'help',7).enabled,true);
  assert.equal(Object.keys(ACTIONS).length,7);
});
test('résultats probabilistes : acceptation et refus changent plusieurs indicateurs',()=>{
  const game=ageTo(7);
  const before=game.domainData.relationships.people.find(p=>p.id==='mother');
  const accepted=socialize(game,'mother','talk',()=>0);
  const rejected=socialize(game,'mother','talk',()=>0.9999);
  const good=accepted.domainData.relationships.people.find(p=>p.id==='mother');
  const bad=rejected.domainData.relationships.people.find(p=>p.id==='mother');
  assert.ok(good.bond>before.bond && good.trust>=before.trust);
  assert.ok(bad.bond<before.bond && bad.trust<=before.trust);
  assert.equal(accepted.domainData.relationships.records.at(-1).outcome,'positive');
  assert.equal(rejected.domainData.relationships.records.at(-1).outcome,'negative');
  assert.ok(isValidState(accepted) && isValidState(rejected));
  assert.equal(game.domainData.relationships.actionsUsed,0);
});
test('maximum trois actions par an avec fatigue et une action par personne',()=>{
  let state=ageTo(7);
  const rel=state.domainData.relationships;
  const mother=rel.people.find(p=>p.id==='mother');
  const beforeChance=reactionChance(rel,mother,'talk');
  state=socialize(state,'mother','talk',()=>0);
  assert.equal(socialize(state,'mother','spend',()=>0),null);
  const afterChance=reactionChance(state.domainData.relationships,
    state.domainData.relationships.people.find(p=>p.id==='mother'),'talk');
  assert.ok(beforeChance>afterChance);
  state=socialize(state,'father','help',()=>0);
  state=makeFriend(state,()=>0.3);
  assert.ok(state);
  assert.equal(state.domainData.relationships.actionsUsed,MAX_ACTIONS_PER_YEAR);
  assert.equal(makeFriend(state,()=>0.3),null);
  assert.equal(socialize(state,'friend-1','talk',()=>0),null);
  const next=advanceOneYear(state);
  assert.equal(next.domainData.relationships.actionsUsed,0);
  assert.ok(isValidState(next));
});
test('écrans lisibles avec personnalités, chances, actions verrouillées selon âge',()=>{
  const seven=ageTo(7);
  const html=renderRelationships(seven,{selectedId:'mother'});
  assert.ok(html.includes('Confiance'));
  assert.ok(html.includes('Respect'));
  assert.ok(html.includes('Rivalité'));
  assert.ok(html.includes('data-interact="gift"'));
  assert.ok(html.includes('data-interact="apologize"'));
  assert.ok(html.includes('Chance '));
  const twelve=renderRelationships(ageTo(12),{selectedId:'mother'});
  assert.ok(twelve.includes('Se confier'));
});
test('migration V0.4 conserve exactement personnes, âge, lien et historique',()=>{
  const {storage,map}=memory();
  let game=ageTo(8);
  game=socialize(game,'mother','argue',()=>0);
  const previous=oldVersion(game);
  map.set(V04_SAVE_KEY,JSON.stringify(previous));
  const result=createEngine({storage,random:()=>0});
  const latest=result.getState();
  assert.equal(latest.activeLife.age,8);
  assert.deepEqual(latest.history,previous.history);
  assert.deepEqual(latest.domainData.story,previous.domainData.story);
  const oldPeople=previous.domainData.relationships.people;
  for(let i=0;i<oldPeople.length;i++){
    const {traits,trust,respect,rivalry,...migratedOld}=latest.domainData.relationships.people[i];
    assert.deepEqual(migratedOld,oldPeople[i]);
  }
  assert.deepEqual(latest.domainData.relationships.records,previous.domainData.relationships.records);
  assert.equal(latest.domainData.relationships.actionsUsed,1);
  assert.ok(isValidState(latest));
  const reopened=createEngine({storage});
  assert.deepEqual(reopened.getState(),latest);
  assert.equal(map.get(V04_SAVE_KEY),JSON.stringify(previous));
  assert.ok(map.has(SAVE_KEY));
  assert.deepEqual(migrateV04(previous),latest);
});
test('sauvegarde corrompue protégée et migration non destructive',()=>{
  const {storage,map}=memory();
  const old=oldVersion(ageTo(4));
  const invalid={...old,domainData:{...old.domainData,
    relationships:{...old.domainData.relationships,
      people:old.domainData.relationships.people.map((p,i)=>i===0?{...p,bond:400}:p)}}};
  assert.equal(migrateV04(invalid),null);
  map.set(V04_SAVE_KEY,JSON.stringify(old));
  map.set(SAVE_KEY,'{broken');
  assert.equal(loadState(storage),null);
  assert.equal(map.get(V04_SAVE_KEY),JSON.stringify(old));
  assert.equal(map.has(V03_SAVE_KEY),false);
});
