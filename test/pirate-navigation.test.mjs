import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState} from '../foundation/src/core/state.mjs';
import {ISLANDS,SEA_LABELS,START_ISLAND,createNavigation,validNavigation,
 voyageAvailability,exploreAvailability} from '../foundation/src/core/pirate-navigation.mjs';
import {SAVE_KEY,V16_SAVE_KEY,migrateV16,loadState} from '../foundation/src/core/storage.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
 voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function memory(){
 const map=new Map();
 return {map,storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
}
function advance(engine,age){
 while(engine.getState().activeLife.age<age){
  assert.ok(engine.age(),'Passage année '+age);
  const state=engine.getState();
  if(state.domainData.story.pending)
   assert.ok(engine.choose(choices[state.domainData.story.pending.eventId]));
  if(engine.getState().domainData.relationships.pending)
   assert.ok(engine.answerNpc('accept'));
  if(engine.getState().domainData.career.command?.pending)
   assert.ok(engine.crewAnswer('refuse'));
 }
}
function captain(rng=()=>0){
 const {map,storage}=memory();
 const engine=createEngine({storage,random:rng});
 assert.ok(engine.startLife(hero));advance(engine,16);
 assert.ok(engine.applyPirate('alizes','combattant'));
 assert.ok(engine.mission('escort'));assert.ok(engine.mission('explore'));
 assert.ok(engine.foundCrew());
 const state=engine.getState();
 const rich={...state,domainData:{...state.domainData,
  career:{...state.domainData.career,missions:{...state.domainData.career.missions,berys:850000}}}};
 assert.ok(isValidState(rich));
 map.set(SAVE_KEY,JSON.stringify(rich));
 return {engine:createEngine({storage,random:rng}),map,storage};
}
function travelRoute(engine,route){
 for(const id of route)assert.ok(engine.sail(id),'Voyage vers '+id);
}
test('initialisation : îles canoniques, départ en East Blue, composants persistants',()=>{
 const {engine,storage}=captain();
 const state=engine.getState(),cmd=state.domainData.career.command;
 assert.equal(cmd.navigation.location,START_ISLAND);
 assert.equal(cmd.navigation.visited.length,1);
 assert.equal(cmd.navigation.journeys,0);
 assert.ok(Object.keys(ISLANDS).length>=20);
 assert.equal(SEA_LABELS.grand,'Grand Line');
 assert.equal(validNavigation(cmd.navigation,cmd,state.activeLife.age),true);
 assert.deepEqual(createEngine({storage}).getState(),state);
 assert.match(renderCareer(state),/Navigation/);
 assert.match(renderCareer(state),/Explorer/);
});
test('voyages successifs dans la même année, coûts réels, routes adjacentes et sauvegardes',()=>{
 const {engine,storage}=captain();
 const base=engine.getState(),age=base.activeLife.age;
 assert.equal(engine.sail('egghead'),false);
 assert.equal(engine.sail('inconnu'),false);
 assert.deepEqual(engine.getState(),base);
 travelRoute(engine,['shells','orange','syrup','baratie']);
 const now=engine.getState(),nav=now.domainData.career.command.navigation;
 assert.equal(now.activeLife.age,age);
 assert.equal(now.history.length,age+1);
 assert.equal(nav.location,'baratie');
 assert.deepEqual(nav.visited,['fuchsia','shells','orange','syrup','baratie']);
 assert.equal(nav.journeys,4);
 assert.equal(now.domainData.career.missions.berys,base.domainData.career.missions.berys-4000);
 assert.equal(nav.log.length,4);
 assert.ok(now.domainData.career.command.ship.voyages>=4);
 assert.ok(isValidState(now));
 assert.deepEqual(createEngine({storage}).getState(),now);
});
test('exploration libre, rencontres de factions et butin décroissant par île',()=>{
 const {engine}=captain();
 const age=engine.getState().activeLife.age;
 const money=engine.getState().domainData.career.missions.berys;
 for(let i=0;i<5;i++)assert.ok(engine.exploreIsland());
 const s=engine.getState(),nav=s.domainData.career.command.navigation;
 assert.equal(s.activeLife.age,age);
 assert.equal(s.history.length,age+1);
 assert.equal(nav.explorations,5);
 assert.equal(nav.explored.fuchsia,5);
 assert.equal(nav.log.at(-1).kind,'explore');
 assert.ok(nav.log.at(-1).berys>0,'Un rendement résiduel reste possible même après cinq fouilles');
 assert.ok(nav.log.at(-1).berys<4000,'Les trouvailles deviennent progressivement moins abondantes');
 assert.ok(s.domainData.career.missions.berys>money+10000);
 assert.ok(['pirate','marine','revolutionnaire','marchand','civil'].includes(nav.log.at(-1).faction));
 assert.equal(exploreAvailability(s.domainData.career,s.activeLife).enabled,true);
 assert.ok(isValidState(s));
});
test('passage Grand Line conditionné à un compagnon et à la navigation',()=>{
 const {engine}=captain();
 travelRoute(engine,['shells','orange','syrup','baratie','cocoyasi','loguetown']);
 const life=engine.getState().activeLife;
 const s=engine.getState().domainData;
 assert.equal(voyageAvailability(s.career,life,s.abilities,'whiskey').enabled,false);
 assert.equal(engine.sail('whiskey'),false);
 assert.ok(engine.recruitCrew('navigateur'));
 assert.equal(voyageAvailability(engine.getState().domainData.career,life,
  engine.getState().domainData.abilities,'whiskey').enabled,true);
 assert.ok(engine.sail('whiskey'));
 assert.equal(ISLANDS[engine.getState().domainData.career.command.navigation.location].sea,'grand');
 assert.ok(engine.sail('loguetown'),'Retour possible vers East Blue');
 assert.ok(isValidState(engine.getState()));
});
test('les îles célestes et le Nouveau Monde demandent réellement un navire préparé',()=>{
 const {engine,map,storage}=captain();
 assert.ok(engine.recruitCrew('navigateur'));
 travelRoute(engine,['shells','orange','syrup','baratie','cocoyasi','loguetown','whiskey',
  'little-garden','drum','alabasta','jaya']);
 assert.equal(engine.sail('skypiea'),false,'Compétence de navigation insuffisante');
 let s=engine.getState(),cmd=s.domainData.career.command;
 const boost={...s,domainData:{...s.domainData,career:{...s.domainData.career,
  command:{...cmd,members:cmd.members.map(m=>m.role==='navigateur'?{...m,skill:70}:m)}}}};
 assert.ok(isValidState(boost));map.set(SAVE_KEY,JSON.stringify(boost));
 const pilot=createEngine({storage,random:()=>0});
 assert.ok(pilot.sail('skypiea'));
 assert.ok(pilot.sail('jaya'));
 travelRoute(pilot,['water-seven','sabaody']);
 assert.equal(pilot.sail('fishman'),false,'Le sloop ne franchit pas le Nouveau Monde');
 assert.ok(pilot.recruitCrew('combattant'));
 assert.ok(pilot.shipAction('purchase','brig'));
 assert.equal(pilot.getState().domainData.career.command.hull,100,'Le brick neuf a une coque neuve');
 assert.ok(pilot.sail('fishman'));
 assert.equal(ISLANDS[pilot.getState().domainData.career.command.navigation.location].sea,'new');
 assert.ok(pilot.sail('punk-hazard'));
 assert.ok(pilot.getState().domainData.career.command.navigation.visited.includes('fishman'));
 assert.ok(isValidState(pilot.getState()));
});
test('tempête en mer, dégâts localisés et retour même année',()=>{
 const {engine,map,storage}=captain();
 const old=engine.getState();
 const risky=createEngine({storage,random:()=>.999});
 assert.ok(risky.sail('shells'));
 const after=risky.getState();
 assert.ok(after.domainData.career.command.hull<old.domainData.career.command.hull);
 assert.ok(after.domainData.career.command.ship.parts.sails<old.domainData.career.command.ship.parts.sails);
 assert.equal(after.domainData.career.command.navigation.log.at(-1).damage>0,true);
 assert.equal(after.activeLife.age,old.activeLife.age);
 assert.equal(after.domainData.career.command.navigation.location,'shells');
 assert.ok(isValidState(after));
 assert.deepEqual(loadState(storage),after);
});
test('migration V16 -> V17 conserve Berrys, bateau, équipage, âge et historique',()=>{
 const {engine,map,storage}=captain();
 assert.ok(engine.recruitCrew('navigateur'));
 assert.ok(engine.shipAction('upgrade','sails'));
 const now=engine.getState(),cmd=now.domainData.career.command;
 const {navigation,encounters,...oldCommand}=cmd;
 const legacy={...now,schemaVersion:16,domainData:{...now.domainData,
  career:{...now.domainData.career,command:oldCommand}}};
 map.clear();map.set(V16_SAVE_KEY,JSON.stringify(legacy));
 const converted=migrateV16(legacy);
 assert.ok(converted);
 assert.equal(converted.schemaVersion,18);
 assert.deepEqual(converted.domainData.career.command.ship,cmd.ship);
 assert.deepEqual(converted.domainData.career.command.members,cmd.members);
 assert.equal(converted.domainData.career.missions.berys,now.domainData.career.missions.berys);
 assert.deepEqual(converted.history,now.history);
 assert.deepEqual(converted.domainData.relationships,now.domainData.relationships);
 assert.deepEqual(converted.domainData.career.command.navigation,createNavigation());
 assert.deepEqual(createEngine({storage}).getState(),converted);
 assert.equal(map.get(V16_SAVE_KEY),JSON.stringify(legacy));
 assert.ok(map.has(SAVE_KEY));
});
test('rejet des sauvegardes altérées et des coûts impossibles sans effet de bord',()=>{
 const {engine,storage}=captain();
 const old=engine.getState();
 const n=old.domainData.career.command.navigation;
 const tampered={...old,domainData:{...old.domainData,career:{...old.domainData.career,
  command:{...old.domainData.career.command,navigation:{...n,location:'egghead'}}}}};
 assert.equal(isValidState(tampered),false);
 const broken={...old,domainData:{...old.domainData,career:{...old.domainData.career,
  command:{...old.domainData.career.command,navigation:{...n,visited:['fuchsia','fuchsia']}}}}};
 assert.equal(isValidState(broken),false);
 const locked=createEngine({storage:{...storage,setItem:()=>{throw Error('quota');}},random:()=>0});
 assert.equal(locked.sail('shells'),false);
 assert.equal(locked.exploreIsland(),false);
 assert.deepEqual(locked.getState(),old);
});
