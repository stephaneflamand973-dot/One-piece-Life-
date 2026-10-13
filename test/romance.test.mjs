import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState} from '../foundation/src/core/state.mjs';
import {activePartner,romanceAvailability,MAX_PARTNERS} from '../foundation/src/core/romance.mjs';
import {renderRelationships} from '../foundation/src/ui/relations-view.mjs';
import {SAVE_KEY,V07_SAVE_KEY,migrateV07,loadState} from '../foundation/src/core/storage.mjs';

const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
  voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function memory(){
  const map=new Map();
  return {map,storage:{getItem:k=>map.get(k)??null,
    setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
}
function ageTo(engine,target){
  while(engine.getState().activeLife.age<target){
    assert.ok(engine.age(),'Impossible de vieillir à '+target);
    const state=engine.getState();
    if(state.domainData.story.pending)assert.ok(engine.choose(choices[state.domainData.story.pending.eventId]));
    if(engine.getState().domainData.relationships.pending)assert.ok(engine.answerNpc('accept'));
    assert.ok(isValidState(engine.getState()));
  }
  return engine.getState();
}
function setup(age){
  const {map,storage}=memory();
  const engine=createEngine({storage,random:()=>0});
  assert.ok(engine.startLife(hero));
  ageTo(engine,age);
  return {engine,map,storage};
}
test('les rencontres et les actions de couple restent réservées aux adultes',()=>{
  const {engine}=setup(17);
  assert.equal(engine.meetPartner(),false);
  ageTo(engine,18);
  assert.ok(engine.meetPartner());
  const p=activePartner(engine.getState().domainData.relationships);
  assert.equal(p.role,'partner');
  assert.equal(p.status,'dating');
  assert.ok(18+p.ageOffset>=18);
  assert.equal(engine.meetPartner(),false);
  assert.ok(isValidState(engine.getState()));
});
test('sorties et mariage : confiance, durée et refus possibles',()=>{
  const {engine}=setup(20);
  assert.ok(engine.meetPartner());
  const previous=activePartner(engine.getState().domainData.relationships);
  assert.equal(engine.romance('marry'),false);
  assert.ok(engine.romance('date'));
  assert.ok(activePartner(engine.getState().domainData.relationships).bond>previous.bond);
  ageTo(engine,21);assert.ok(engine.romance('date'));
  ageTo(engine,22);
  assert.equal(romanceAvailability(engine.getState().domainData.relationships,'marry',22).enabled,true);
  assert.ok(engine.romance('marry'));
  const spouse=activePartner(engine.getState().domainData.relationships);
  assert.equal(spouse.status,'married');
  assert.equal(spouse.marriedAtAge,22);
  assert.equal(engine.romance('marry'),false);
  assert.ok(isValidState(engine.getState()));
});
test('enfant avec parent identifié, naissance persistante et séparation',()=>{
  const {engine}=setup(20);
  engine.meetPartner();engine.romance('date');
  ageTo(engine,21);engine.romance('date');
  ageTo(engine,22);engine.romance('marry');
  ageTo(engine,23);assert.ok(engine.romance('child'));
  let rel=engine.getState().domainData.relationships;
  const child=rel.people.find(p=>p.role==='child');
  assert.ok(child);
  assert.equal(child.ageOffset,-23);
  assert.equal(child.createdAtAge,23);
  assert.equal(child.parentId,'partner-1');
  assert.equal(rel.records.at(-1).action,'romance-child');
  assert.match(renderRelationships(engine.getState(),{selectedId:child.id}),/Mes enfants/);
  assert.ok(isValidState(engine.getState()));
  ageTo(engine,24);assert.ok(engine.romance('separate'));
  rel=engine.getState().domainData.relationships;
  assert.equal(activePartner(rel),null);
  assert.equal(rel.people.find(p=>p.id==='partner-1').status,'separated');
  assert.ok(rel.people.some(p=>p.id===child.id));
  assert.ok(isValidState(engine.getState()));
});
test('partenaires successifs limités et ex toujours consultables',()=>{
  const {engine}=setup(20);
  for(let i=1;i<=MAX_PARTNERS;i++){
    assert.ok(engine.meetPartner(),'rencontre '+i);
    assert.equal(activePartner(engine.getState().domainData.relationships).id,'partner-'+i);
    assert.ok(engine.romance('separate'));
    ageTo(engine,20+i);
  }
  assert.equal(engine.meetPartner(),false);
  assert.equal(engine.getState().domainData.relationships.people.filter(p=>p.role==='partner').length,MAX_PARTNERS);
  assert.ok(isValidState(engine.getState()));
});
test('l’enfant devient adulte et la sauvegarde reste valide jusqu’à 120 ans',()=>{
  const {engine}=setup(20);
  engine.meetPartner();engine.romance('date');
  ageTo(engine,21);engine.romance('date');
  ageTo(engine,22);engine.romance('marry');
  ageTo(engine,23);engine.romance('child');
  const child=engine.getState().domainData.relationships.people.find(p=>p.role==='child');
  assert.ok(child);
  ageTo(engine,41);
  assert.equal(41+child.ageOffset,18);
  ageTo(engine,120);
  assert.equal(engine.getState().history.length,121);
  assert.equal(engine.getState().activeLife.alive,false);
  assert.ok(isValidState(engine.getState()));
  assert.equal(engine.romance('date'),false);
});
test('migration V0.4.3 conserve exactement les personnages et les décisions',()=>{
  const {engine,map,storage}=setup(9);
  const before=engine.getState();
  const {world,...oldRelations}=before.domainData.relationships;
  const legacy={...before,schemaVersion:7,domainData:{
    story:before.domainData.story,relationships:oldRelations
  }};
  map.clear();map.set(V07_SAVE_KEY,JSON.stringify(legacy));
  const migrated=createEngine({storage}).getState();
  assert.equal(migrated.schemaVersion,11);
  assert.deepEqual(migrated.activeLife,legacy.activeLife);
  assert.deepEqual(migrated.history,legacy.history);
  const {world:addedWorld,...oldDomainRel}=migrated.domainData.relationships;
  assert.deepEqual(oldDomainRel,legacy.domainData.relationships);
  assert.deepEqual(migrated.domainData.story,legacy.domainData.story);
  assert.equal(addedWorld.faction,'independent');
  assert.deepEqual(migrateV07(legacy),migrated);
  assert.equal(map.get(V07_SAVE_KEY),JSON.stringify(legacy));
  assert.ok(map.has(SAVE_KEY));
});
test('le refus du stockage et les états frauduleux ne modifient pas la partie',()=>{
  const {engine,map,storage}=setup(20);
  const readOnly={...storage,setItem:()=>{throw Error('quota')}};
  const another=createEngine({storage:readOnly,random:()=>0});
  const before=another.getState();
  assert.equal(another.meetPartner(),false);
  assert.strictEqual(another.getState(),before);
  assert.ok(engine.meetPartner());
  const current=engine.getState();
  const bogus={...current,domainData:{...current.domainData,relationships:{
    ...current.domainData.relationships,
    people:current.domainData.relationships.people.map(p=>p.role==='partner'?
      {...p,status:'married',marriedAtAge:19}:p)}}};
  assert.equal(isValidState(bogus),false);
  map.set(SAVE_KEY,'{bad');
  assert.equal(loadState(storage),null);
});
