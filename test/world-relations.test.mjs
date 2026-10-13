import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState,createEmptyState,beginLife,advanceOneYear} from '../foundation/src/core/state.mjs';
import {FACTIONS,WORLD_ROLES,worldActionAvailability,takeWorldAction,
  advanceWorld,isValidWorld} from '../foundation/src/core/world-relations.mjs';
import {SAVE_KEY,V08_SAVE_KEY,migrateV08,loadState} from '../foundation/src/core/storage.mjs';
import {renderRelationships} from '../foundation/src/ui/relations-view.mjs';

const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
  voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function mem(){
  const map=new Map();
  const storage={getItem:key=>map.get(key)??null,
    setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
  return {map,storage};
}
function toAge(engine,age){
  while(engine.getState().activeLife.age<age){
    assert.equal(engine.age(),true,'+ Âge a échoué à '+age);
    const pending=engine.getState().domainData.story.pending;
    if(pending)assert.ok(engine.choose(choices[pending.eventId]));
    if(engine.getState().domainData.relationships.pending)
      assert.ok(engine.answerNpc('accept'));
  }
  return engine.getState();
}
function start(age=0,random=()=>0){
  const {map,storage}=mem();
  const engine=createEngine({storage,random});
  assert.ok(engine.startLife(hero));
  toAge(engine,age);
  return {engine,map,storage};
}
test('débloquer faction après 16 ans, contacts uniques et sauvegarde exacte',()=>{
  const {engine,storage}=start(15);
  assert.equal(engine.joinFaction('pirate'),false);
  toAge(engine,16);
  assert.ok(engine.joinFaction('pirate'));
  const state=engine.getState(),rel=state.domainData.relationships;
  assert.equal(rel.world.faction,'pirate');
  assert.equal(rel.world.joinedAtAge,16);
  assert.deepEqual(rel.people.filter(p=>WORLD_ROLES.includes(p.role)).map(p=>p.id),
    ['world-leader','world-mentor','world-ally','world-rival']);
  assert.equal(rel.world.log.length,1);
  assert.equal(rel.world.standings.marine,25);
  assert.equal(rel.actionsUsed,1);
  assert.equal(engine.joinFaction('marine'),false);
  assert.equal(state.history.length,17);
  assert.ok(isValidState(state));
  assert.deepEqual(createEngine({storage}).getState(),state);
});
test('les trois factions produisent des unités cohérentes avec la loyauté et une rivalité',()=>{
  for(const faction of Object.keys(FACTIONS)){
    const {engine}=start(18);
    assert.ok(engine.joinFaction(faction));
    const state=engine.getState(),rel=state.domainData.relationships;
    assert.ok(renderRelationships(state).includes(FACTIONS[faction].unit));
    assert.ok(rel.people.every(p=>!WORLD_ROLES.includes(p.role)||p.worldFaction===faction));
    assert.ok(isValidWorld(rel,18,true));
    assert.ok(isValidState(state));
  }
});
test('missions, entraînement, duel et protection changent réellement les liens',()=>{
  const {engine}=start(18);
  engine.joinFaction('marine');
  toAge(engine,19);
  const before=engine.getState().domainData.relationships;
  const chance=worldActionAvailability(before,'mission',19);
  assert.equal(chance.enabled,true);
  assert.ok(chance.chance>=15&&chance.chance<=95);
  assert.ok(engine.factionAction('mission'));
  const after=engine.getState().domainData.relationships;
  assert.ok(after.world.reputation>before.world.reputation);
  assert.ok(after.world.loyalty>before.world.loyalty);
  assert.ok(after.world.standings.marine>before.world.standings.marine);
  assert.ok(after.people.find(p=>p.id==='world-leader').trust>
    before.people.find(p=>p.id==='world-leader').trust);
  assert.equal(engine.factionAction('train'),false);
  assert.equal(after.world.log.at(-1).outcome,'positive');
  assert.ok(isValidState(engine.getState()));
  for(const action of ['train','protect','challenge']){
    const good=takeWorldAction({...before,actionsUsed:0},action,19,()=>0);
    const bad=takeWorldAction({...before,actionsUsed:0},action,19,()=>0.9999);
    assert.ok(good&&bad);
    assert.equal(good.world.log.at(-1).outcome,'positive');
    assert.equal(bad.world.log.at(-1).outcome,'negative');
    assert.ok(good.world.reputation>bad.world.reputation);
    assert.notEqual(good.people.find(p=>p.id==='world-'+
      (action==='train'?'mentor':action==='protect'?'ally':'rival')).bond,
      bad.people.find(p=>p.id==='world-'+
      (action==='train'?'mentor':action==='protect'?'ally':'rival')).bond);
  }
});
test('événement autonome de faction dépend de la réputation et de la loyauté',()=>{
  const {engine}=start(16);
  assert.ok(engine.joinFaction('pirate'));
  const neutral=engine.getState().domainData.relationships;
  assert.equal(advanceWorld(neutral,19,()=>0).announcements.length,0);
  const weak=advanceWorld(neutral,20,()=>0);
  assert.equal(weak.announcements.length,1);
  assert.ok(weak.relations.world.reputation<neutral.world.reputation);
  const strong={...neutral,world:{...neutral.world,reputation:70,loyalty:85}};
  const positive=advanceWorld(strong,20,()=>0);
  assert.ok(positive.relations.world.reputation>strong.world.reputation);
  assert.notEqual(positive.announcements[0],weak.announcements[0]);
  assert.deepEqual(advanceWorld(strong,20,()=>0.99999).announcements,[]);
});
test('l’action est bloquée durant une décision ou si la sauvegarde ne fonctionne pas',()=>{
  const {engine,storage}=start(15);
  engine.age(); // 16 ans, décision scénarisée en attente
  assert.equal(engine.joinFaction('pirate'),false);
  assert.ok(engine.choose(choices[engine.getState().domainData.story.pending.eventId]));
  assert.ok(engine.joinFaction('pirate'));
  const snapshot=engine.getState();
  const unavailable=createEngine({storage:{...storage,setItem:()=>{throw Error('quota');}},random:()=>0});
  assert.equal(unavailable.factionAction('train'),false);
  assert.deepEqual(unavailable.getState(),snapshot);
  assert.ok(isValidState(snapshot));
});
test('les rencontres, la famille et la faction restent cohérentes jusqu’à 120 ans',()=>{
  const {engine}=start(18);
  assert.ok(engine.joinFaction('revolutionary'));
  for(let age=19;age<=120;age++){
    toAge(engine,age);
    assert.equal(engine.getState().history.length,age+1);
    assert.ok(isValidState(engine.getState()),'État invalide à '+age);
  }
  assert.equal(engine.factionAction('mission'),false);
  assert.ok(engine.getState().domainData.relationships.world.log.length<=25);
  assert.equal(engine.getState().domainData.relationships.world.log[0].action,'join');
});
test('migration V0.4.4 : tous les proches, le fil et les décisions demeurent inchangés',()=>{
  const {engine,map,storage}=start(25);
  const current=engine.getState();
  const {world,...legacyRel}=current.domainData.relationships;
  const old={...current,schemaVersion:8,domainData:{
    story:current.domainData.story,relationships:legacyRel}};
  map.clear();map.set(V08_SAVE_KEY,JSON.stringify(old));
  const fresh=createEngine({storage});
  const imported=fresh.getState();
  assert.ok(isValidState(imported));
  assert.equal(imported.activeLife.age,25);
  assert.deepEqual(imported.history,old.history);
  assert.deepEqual(imported.domainData.story,old.domainData.story);
  const {world:newWorld,...unchanged}=imported.domainData.relationships;
  assert.deepEqual(unchanged,legacyRel);
  assert.equal(newWorld.faction,'independent');
  assert.deepEqual(migrateV08(old),imported);
  assert.equal(map.get(V08_SAVE_KEY),JSON.stringify(old));
  assert.ok(map.has(SAVE_KEY));
  assert.ok(fresh.restart());
  assert.equal(createEngine({storage}).getState().activeLife,null);
});
test('détection des états altérés et protections contre les sauvegardes cassées',()=>{
  const {engine,map,storage}=start(18);
  assert.ok(engine.joinFaction('pirate'));
  const state=engine.getState();
  const rel=state.domainData.relationships;
  const corrupt={...state,domainData:{...state.domainData,relationships:{
    ...rel,world:{...rel.world,loyalty:999}
  }}};
  assert.equal(isValidState(corrupt),false);
  const missing={...state,domainData:{...state.domainData,relationships:{
    ...rel,people:rel.people.filter(p=>p.role!=='mentor')
  }}};
  assert.equal(isValidState(missing),false);
  map.set(SAVE_KEY,'{unreadable');
  assert.equal(loadState(storage),null);
  assert.equal(migrateV08({...state,schemaVersion:8}),null);
});
