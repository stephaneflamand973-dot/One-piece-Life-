import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {createEmptyState,isValidState} from '../foundation/src/core/state.mjs';
import {SKILLS,MAX_TRAININGS} from '../foundation/src/core/abilities.mjs';
import {CREWS,SPECIALTIES,hiringAvailability} from '../foundation/src/core/pirate-career.mjs';
import {SAVE_KEY,V09_SAVE_KEY,migrateV09,loadState} from '../foundation/src/core/storage.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
import {renderActivities} from '../foundation/src/ui/activities-view.mjs';
const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const decision={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
  voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function store(){
  const map=new Map();
  return {map,storage:{getItem:k=>map.get(k)??null,
    setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
}
function aging(engine,age){
  while(engine.getState().activeLife.age<age){
    assert.ok(engine.age());
    const rel=engine.getState().domainData.relationships;
    const pending=engine.getState().domainData.story.pending;
    if(pending)assert.ok(engine.choose(decision[pending.eventId]));
    if(rel.pending)assert.ok(engine.answerNpc('accept'));
    assert.ok(isValidState(engine.getState()));
  }
}
function setup(age=0,random=()=>0){
  const {map,storage}=store();
  const engine=createEngine({storage,random});
  engine.startLife(hero);aging(engine,age);
  return {engine,map,storage};
}
test('on naît avec 11 capacités, indépendamment de tout emploi',()=>{
  const state=createEmptyState();
  assert.equal(Object.keys(state.domainData.abilities.skills).length,11);
  assert.equal(state.domainData.career.pirate,null);
  assert.ok(isValidState(state));
  const {engine}=setup(0);
  const life=engine.getState();
  assert.ok(Object.keys(SKILLS).every(id=>life.domainData.abilities.skills[id]>0));
  assert.ok(renderCareer(life).includes('Offres de recrutement'));
  assert.ok(renderActivities(life).includes('Entraînement'));
  assert.ok(isValidState(life));
});
test('entraînement dès 6 ans, trois séances, fatigue et récupération annuelle',()=>{
  const {engine,storage}=setup(5);
  assert.equal(engine.train('force'),false);
  aging(engine,6);
  const initial=engine.getState().domainData.abilities.skills.force;
  for(let i=1;i<=MAX_TRAININGS;i++){
    assert.ok(engine.train('force'),'session '+i);
    const a=engine.getState().domainData.abilities;
    assert.equal(a.trainingUsed,i);
    assert.ok(a.skills.force>initial);
  }
  assert.equal(engine.train('force'),false);
  const after=engine.getState().domainData.abilities;
  assert.ok(after.fatigue>0&&after.fatigue<=100);
  const reloaded=createEngine({storage}).getState();
  assert.deepEqual(reloaded.domainData.abilities,after);
  aging(engine,7);
  const next=engine.getState().domainData.abilities;
  assert.equal(next.trainingUsed,0);
  assert.ok(next.fatigue<after.fatigue);
  assert.ok(isValidState(engine.getState()));
});
test('postuler à 16 ans avec compétences réelles, embauche non automatique',()=>{
  const {engine}=setup(15,()=>0.9999);
  assert.equal(engine.applyPirate('alizes','combattant'),false);
  aging(engine,16);
  const before=engine.getState();
  assert.equal(hiringAvailability(before.domainData.career,before.domainData.relationships,
    before.domainData.abilities,before.activeLife,'alizes','navigateur').enabled,
    before.domainData.abilities.skills.navigation>=18);
  assert.ok(engine.applyPirate('alizes','combattant'),'candidature enregistrée');
  assert.equal(engine.getState().domainData.career.pirate,null);
  assert.match(engine.getState().domainData.career.lastNotice,/refusée/);
  assert.equal(engine.applyPirate('alizes','combattant'),false);
  aging(engine,17);
  assert.equal(engine.getState().domainData.career.appliedAtAge,16);
});
test('acceptation dans deux équipages et conservation du capitaine dans Relations',()=>{
  for(const crewId of Object.keys(CREWS)){
    const {engine,storage}=setup(16);
    assert.ok(engine.applyPirate(crewId,'combattant'));
    const state=engine.getState();
    const job=state.domainData.career.pirate;
    assert.equal(job.crewId,crewId);
    assert.equal(job.specialty,'combattant');
    assert.equal(job.rank,0);
    assert.equal(state.domainData.relationships.world.faction,'pirate');
    assert.equal(state.domainData.relationships.world.unit,CREWS[crewId].label);
    assert.ok(state.domainData.relationships.people.find(p=>p.id==='world-leader'));
    assert.ok(renderCareer(state).includes(CREWS[crewId].label));
    assert.ok(isValidState(state));
    assert.deepEqual(createEngine({storage}).getState(),state);
  }
});
test('travailler davantage améliore la performance et la confiance du capitaine',()=>{
  const {engine}=setup(16);
  engine.applyPirate('alizes','combattant');
  const before=engine.getState();
  const captain=before.domainData.relationships.people.find(p=>p.id==='world-leader');
  assert.ok(engine.workPirate());
  const after=engine.getState();
  assert.ok(after.domainData.career.pirate.performance>before.domainData.career.pirate.performance);
  assert.equal(after.domainData.relationships.people.find(p=>p.id==='world-leader').trust,
    Math.min(100,captain.trust+2));
  assert.equal(engine.workPirate(),false);
  assert.equal(after.history.length,17);
  assert.ok(isValidState(after));
  aging(engine,17);
  assert.equal(engine.getState().domainData.career.pirate.workUsed,0);
  assert.ok(engine.workPirate());
});
test('rang et ancienneté évoluent avec les années et la compétence pertinente',()=>{
  const {engine}=setup(16);
  engine.applyPirate('alizes','combattant');
  engine.workPirate();
  aging(engine,18);
  let p=engine.getState().domainData.career.pirate;
  assert.equal(p.tenure,2);
  assert.ok(p.performance>=40);
  for(let age=19;age<=26;age++){
    if(engine.getState().activeLife.age<age)aging(engine,age);
    if(engine.getState().activeLife.alive&&engine.getState().domainData.career.pirate.rank===0)
      engine.workPirate();
  }
  assert.equal(engine.getState().domainData.career.pirate.rank,1);
  assert.ok(engine.getState().domainData.career.notices.some(n=>n.type==='promotion'));
  assert.ok(isValidState(engine.getState()));
});
test('carrière bloquée pendant un choix, autres factions non piratables',()=>{
  const {engine}=setup(15);
  assert.ok(engine.age());
  assert.equal(engine.applyPirate('alizes','combattant'),false);
  assert.equal(engine.train('force'),false);
  assert.ok(engine.choose(decision[engine.getState().domainData.story.pending.eventId]));
  assert.ok(engine.joinFaction('marine'));
  assert.equal(engine.applyPirate('alizes','combattant'),false);
  assert.ok(isValidState(engine.getState()));
});
test('migration V0.4.5 intacte, même si une faction pirate a déjà été rejointe',()=>{
  const {engine,map,storage}=setup(18);
  engine.joinFaction('pirate');
  const now=engine.getState();
  const old={...now,schemaVersion:9,domainData:{
    story:now.domainData.story,relationships:now.domainData.relationships}};
  map.clear();map.set(V09_SAVE_KEY,JSON.stringify(old));
  const newer=createEngine({storage}).getState();
  assert.equal(newer.schemaVersion,10);
  assert.deepEqual(newer.history,old.history);
  assert.deepEqual(newer.domainData.relationships,old.domainData.relationships);
  assert.equal(newer.domainData.career.pirate,null);
  assert.ok(newer.domainData.abilities.skills.force>=0);
  assert.ok(isValidState(newer));
  assert.deepEqual(migrateV09(old),newer);
  assert.equal(map.get(V09_SAVE_KEY),JSON.stringify(old));
  assert.ok(map.has(SAVE_KEY));
  const continuing=createEngine({storage,random:()=>0});
  assert.ok(continuing.applyPirate('alizes','combattant'));
  assert.ok(isValidState(continuing.getState()));
});
test('vie longue avec formation et emploi, 121 années sans duplication',()=>{
  const {engine}=setup(16);
  assert.ok(engine.applyPirate('alizes','combattant'));
  for(let age=17;age<=120;age++){
    aging(engine,age);
    assert.equal(engine.getState().history.length,age+1);
    assert.ok(isValidState(engine.getState()),'valeur invalide à '+age);
    if(age<95 && age%6===0&&engine.getState().activeLife.alive)engine.train('navigation');
  }
  assert.equal(engine.age(),false);
  assert.equal(engine.workPirate(),false);
  assert.equal(engine.train('force'),false);
});
test('état frauduleux et refus d’écriture ne corrompent pas la partie',()=>{
  const {engine,map,storage}=setup(16);
  const readOnly={...storage,setItem:()=>{throw Error('quota')}};
  const duplicate=createEngine({storage:readOnly,random:()=>0});
  const old=duplicate.getState();
  assert.equal(duplicate.applyPirate('alizes','combattant'),false);
  assert.strictEqual(duplicate.getState(),old);
  assert.ok(engine.applyPirate('alizes','combattant'));
  const state=engine.getState();
  const forged={...state,domainData:{...state.domainData,
    abilities:{...state.domainData.abilities,trainingUsed:100}}};
  assert.equal(isValidState(forged),false);
  map.set(SAVE_KEY,'{broken');
  assert.equal(loadState(storage),null);
});
