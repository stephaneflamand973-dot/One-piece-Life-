import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState} from '../foundation/src/core/state.mjs';
import {trainingAvailability,trainSkill,ageAbilities,restAbilities,talentLabel}
  from '../foundation/src/core/abilities.mjs';
import {promotionAvailability,requestPromotion,ageCareer,RANKS}
  from '../foundation/src/core/pirate-career.mjs';
import {SAVE_KEY,V10_SAVE_KEY,migrateV10} from '../foundation/src/core/storage.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
import {renderActivities} from '../foundation/src/ui/activities-view.mjs';
const person={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
  voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function memory(){
  const map=new Map();
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),
    removeItem:k=>map.delete(k)};
  return {map,storage};
}
function aging(engine,target){
  while(engine.getState().activeLife.age<target){
    assert.ok(engine.age());
    const state=engine.getState();
    if(state.domainData.story.pending)
      assert.ok(engine.choose(choices[state.domainData.story.pending.eventId]));
    if(engine.getState().domainData.relationships.pending)
      assert.ok(engine.answerNpc('accept'));
    assert.ok(isValidState(engine.getState()));
  }
}
function setup(age=0,random=()=>0){
  const {map,storage}=memory();
  const engine=createEngine({storage,random});
  assert.ok(engine.startLife(person));
  aging(engine,age);
  return {engine,map,storage};
}
test('les talents individuels influencent les gains sans plafond bloquant',()=>{
  const {engine}=setup(7);
  const life=engine.getState().activeLife;
  const original=engine.getState().domainData.abilities;
  const high={...original,talents:{...original.talents,force:90}};
  const low={...original,talents:{...original.talents,force:35}};
  const good=trainSkill(high,life,'force',()=>0.3);
  const slow=trainSkill(low,life,'force',()=>0.3);
  assert.ok(good.skills.force>slow.skills.force);
  assert.equal(talentLabel(90),'Exceptionnel');
  assert.equal(talentLabel(35),'À développer');
  assert.ok(good.skills.force<=100);
  assert.equal(good.trainingUsed,1);
});
test('fatigue, blessures temporaires et récupération par repos puis années',()=>{
  const {engine}=setup(16);
  const life=engine.getState().activeLife;
  const previous=engine.getState().domainData.abilities;
  const injury=trainSkill(previous,life,'force',()=>0.99999);
  assert.equal(injury.injury.level,2);
  assert.equal(injury.injury.recoverAtAge,18);
  assert.equal(trainingAvailability(injury,life,'force').enabled,false);
  const rest=restAbilities(injury,life);
  assert.equal(rest.injury.level,1);
  assert.ok(rest.fatigue<injury.fatigue);
  assert.equal(restAbilities(rest,life),null);
  assert.equal(ageAbilities(rest,17).injury.level,0);
  assert.equal(ageAbilities(injury,17).injury.level,2);
  assert.equal(ageAbilities(injury,18).injury.level,0);
  assert.ok(renderActivities({...engine.getState(),domainData:{
    ...engine.getState().domainData,abilities:injury}}).includes('Blessure sérieuse'));
});
test('le mentor améliore une capacité et dépense une action sociale et une séance',()=>{
  const {engine,storage}=setup(16);
  assert.ok(engine.applyPirate('alizes','combattant'));
  const before=engine.getState();
  assert.ok(engine.mentorTrain('technique'));
  const after=engine.getState();
  assert.equal(after.domainData.abilities.trainingUsed,before.domainData.abilities.trainingUsed+1);
  assert.equal(after.domainData.relationships.actionsUsed,before.domainData.relationships.actionsUsed+1);
  assert.equal(after.domainData.relationships.world.lastActionAge,16);
  assert.equal(after.domainData.abilities.log.at(-1).mentor,true);
  assert.ok(after.domainData.abilities.skills.technique>before.domainData.abilities.skills.technique);
  assert.deepEqual(createEngine({storage}).getState(),after);
  assert.equal(engine.mentorTrain('technique'),false);
  assert.equal(engine.factionAction('train'),false);
  assert.ok(isValidState(after));
});
test('l’entraînement mentor du panneau Relations utilise le même moteur',()=>{
  const {engine}=setup(16);
  assert.ok(engine.applyPirate('alizes','combattant'));
  assert.ok(engine.factionAction('train'));
  const state=engine.getState();
  assert.equal(state.domainData.abilities.trainingUsed,1);
  assert.equal(state.domainData.abilities.log.at(-1).mentor,true);
  assert.equal(state.domainData.relationships.world.log.at(-1).action,'train');
  assert.equal(state.history.length,17);
});
test('le repos n’avance pas l’année, se limite à une action, et sauvegarde',()=>{
  const {engine,storage}=setup(7);
  engine.train('force');
  const fatigue=engine.getState().domainData.abilities.fatigue;
  assert.ok(engine.rest());
  assert.ok(engine.getState().domainData.abilities.fatigue<fatigue);
  assert.equal(engine.getState().activeLife.age,7);
  assert.equal(engine.rest(),false);
  assert.ok(engine.getState().domainData.abilities.restUsed);
  assert.deepEqual(createEngine({storage}).getState(),engine.getState());
  aging(engine,8);
  assert.equal(engine.getState().domainData.abilities.restUsed,0);
});
test('promotion dépend du capitaine, du niveau, des années et du hasard',()=>{
  const {engine}=setup(16);
  assert.ok(engine.applyPirate('alizes','combattant'));
  aging(engine,18);
  const state=engine.getState();
  const initial=state.domainData.career;
  const p={...initial.pirate,tenure:2,performance:88,rank:0,askedAtAge:-1};
  const career={...initial,pirate:p};
  const access=promotionAvailability(career,state.domainData.relationships,
    state.domainData.abilities,state.activeLife);
  assert.equal(access.enabled,true);
  assert.ok(access.chance>8&&access.chance<=90);
  const success=requestPromotion(career,state.domainData.relationships,
    state.domainData.abilities,state.activeLife,()=>0);
  assert.ok(success.success);
  assert.equal(success.career.pirate.rank,1);
  assert.equal(requestPromotion(success.career,state.domainData.relationships,
    state.domainData.abilities,state.activeLife,()=>0),null);
  const refused=requestPromotion(career,state.domainData.relationships,
    state.domainData.abilities,state.activeLife,()=>0.9999);
  assert.equal(refused.success,false);
  assert.equal(refused.career.pirate.rank,0);
  assert.equal(refused.career.notices.at(-1).type,'rejection');
  assert.ok(RANKS.includes('Officier'));
});
test('promotion et sanctions automatiques produisent de vraies conséquences',()=>{
  const {engine}=setup(18);
  assert.ok(engine.applyPirate('alizes','combattant'));
  aging(engine,20);
  const state=engine.getState(),career=state.domainData.career;
  const weak={...career,pirate:{...career.pirate,performance:15}};
  const lowTrust={...state.domainData.relationships,world:{
    ...state.domainData.relationships.world,loyalty:12}};
  const bad=ageCareer(weak,state.domainData.abilities,
    {...state.activeLife,age:21},lowTrust,()=>0);
  assert.equal(bad.career.notices.at(-1).type,'sanction');
  assert.ok(bad.career.pirate.performance<weak.pirate.performance);
  const strong={...career,pirate:{...career.pirate,performance:90,rank:0}};
  const promoted=ageCareer(strong,state.domainData.abilities,
    {...state.activeLife,age:21},state.domainData.relationships,()=>0);
  assert.equal(promoted.career.pirate.rank,1);
  assert.match(promoted.note,/promeut/);
});
test('une blessure grave empêche de travailler et de solliciter une promotion',()=>{
  const {engine}=setup(16);
  assert.ok(engine.applyPirate('alizes','combattant'));
  const state=engine.getState();
  const wounded={...state.domainData.abilities,
    injury:{level:2,recoverAtAge:18}};
  assert.equal(trainingAvailability(wounded,state.activeLife,'force').enabled,false);
  const rich={...state.domainData.career,pirate:{
    ...state.domainData.career.pirate,performance:88,tenure:2,joinedAtAge:14}};
  assert.equal(promotionAvailability(rich,state.domainData.relationships,
    wounded,{...state.activeLife,age:16}).enabled,false);
});
test('migration V0.5.0 préserve les anciens talents, compétences, relations et grade',()=>{
  const {engine,map,storage}=setup(18);
  assert.ok(engine.applyPirate('alizes','combattant'));
  engine.train('force');
  const state=engine.getState();
  const {injury,restUsed,...abilities}=state.domainData.abilities;
  const {askedAtAge,...pirate}=state.domainData.career.pirate;
  const {missions,wanted,command,...previousCareer}=state.domainData.career;
  const old={...state,schemaVersion:10,domainData:{
    ...state.domainData,abilities,
    career:{...previousCareer,pirate}
  }};
  map.clear();
  map.set(V10_SAVE_KEY,JSON.stringify(old));
  const imported=createEngine({storage}).getState();
  assert.equal(imported.schemaVersion,18);
  assert.deepEqual(imported.history,state.history);
  assert.deepEqual(imported.domainData.relationships,state.domainData.relationships);
  assert.deepEqual(imported.domainData.abilities.skills,abilities.skills);
  assert.deepEqual(imported.domainData.abilities.talents,abilities.talents);
  assert.equal(imported.domainData.career.pirate.rank,pirate.rank);
  assert.equal(imported.domainData.abilities.injury.level,0);
  assert.equal(imported.domainData.career.pirate.askedAtAge,-1);
  assert.deepEqual(migrateV10(old),imported);
  assert.equal(map.get(V10_SAVE_KEY),JSON.stringify(old));
  assert.ok(map.has(SAVE_KEY));
  assert.ok(isValidState(imported));
});
test('la sauvegarde refusée n’entraîne aucune blessure ni promotion fantôme',()=>{
  const {engine,storage}=setup(16);
  assert.ok(engine.applyPirate('alizes','combattant'));
  const locked={...storage,setItem:()=>{throw Error('quota')}};
  const another=createEngine({storage:locked,random:()=>0.99999});
  const old=another.getState();
  assert.equal(another.train('force'),false);
  assert.equal(another.mentorTrain('technique'),false);
  assert.equal(another.rest(),false);
  assert.strictEqual(another.getState(),old);
});
