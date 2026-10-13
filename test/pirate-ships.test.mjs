import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState} from '../foundation/src/core/state.mjs';
import {SHIP_MODELS,SHIP_PARTS,MAX_SHIP_UPGRADE,shipStats,shipMissionEffects,shipActionAvailability,upgradeShipSave} from '../foundation/src/core/pirate-ships.mjs';
import {missionAvailability} from '../foundation/src/core/pirate-missions.mjs';
import {SAVE_KEY,V15_SAVE_KEY,migrateV15} from '../foundation/src/core/storage.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
 voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function store(){
 const map=new Map();
 return {map,storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),
  removeItem:k=>map.delete(k)}};
}
function ageTo(engine,target){
 while(engine.getState().activeLife.age<target){
  assert.ok(engine.age());
  const pending=engine.getState().domainData.story.pending;
  if(pending)assert.ok(engine.choose(choices[pending.eventId]));
  if(engine.getState().domainData.relationships.pending)assert.ok(engine.answerNpc('accept'));
  if(engine.getState().domainData.career.command?.pending)assert.ok(engine.crewAnswer('refuse'));
 }
}
function setup(){
 const {map,storage}=store();
 const engine=createEngine({storage,random:()=>0});
 assert.ok(engine.startLife(hero));ageTo(engine,16);
 assert.ok(engine.applyPirate('alizes','combattant'));
 assert.ok(engine.mission('escort'));
 assert.ok(engine.mission('explore'));
 assert.ok(engine.foundCrew());
 const state=engine.getState();
 const wealthy={...state,domainData:{...state.domainData,
  career:{...state.domainData.career,missions:{...state.domainData.career.missions,berys:850000}}}};
 assert.ok(isValidState(wealthy));
 map.set(SAVE_KEY,JSON.stringify(wealthy));
 return {engine:createEngine({storage,random:()=>0}),map,storage};
}
test('achat initial : sloop de quatre places avec équipements persistants',()=>{
 const {engine,storage}=setup();
 const s=engine.getState(),ship=s.domainData.career.command.ship;
 assert.equal(ship.model,'sloop');
 assert.equal(SHIP_MODELS.sloop.capacity,4);
 assert.equal(ship.voyages,0);
 assert.equal(ship.maintenance,80);
 assert.equal(Object.keys(SHIP_PARTS).length,4);
 assert.equal(s.domainData.career.command.hull,75);
 assert.ok(isValidState(s));
 assert.deepEqual(createEngine({storage}).getState(),s);
 assert.match(renderCareer(s),/Mon navire/);
});
test('réparer plusieurs pièces, entretenir et entraîner sans avancer d’année',()=>{
 const {engine}=setup();
 const age=engine.getState().activeLife.age;
 const budget=engine.getState().domainData.career.missions.berys;
 const before=engine.getState().domainData.career.command.ship;
 assert.ok(engine.shipAction('repair','sails'));
 assert.ok(engine.shipAction('repair','rudder'));
 assert.ok(engine.shipAction('maintain'));
 assert.equal(engine.shipAction('maintain'),false,'Une action sans effet est indisponible');
 assert.ok(engine.shipAction('upgrade','hull'));
 assert.equal(engine.getState().activeLife.age,age);
 const cmd=engine.getState().domainData.career.command;
 assert.equal(cmd.ship.maintenance,100);
 assert.ok(cmd.ship.parts.sails>before.parts.sails);
 assert.equal(cmd.ship.upgrades.hull,1);
 assert.equal(engine.getState().domainData.career.missions.berys,budget-6000-6000-9000-25000);
 assert.ok(isValidState(engine.getState()));
});
test('trois niveaux maximum par pièce, coût croissant et gains réels',()=>{
 const {engine}=setup();
 const old=shipStats(engine.getState().domainData.career.command);
 assert.ok(engine.shipAction('upgrade','sails'));
 assert.ok(engine.shipAction('upgrade','sails'));
 assert.ok(engine.shipAction('upgrade','sails'));
 assert.equal(engine.shipAction('upgrade','sails'),false);
 const cmd=engine.getState().domainData.career.command;
 assert.equal(cmd.ship.upgrades.sails,MAX_SHIP_UPGRADE);
 assert.ok(shipStats(cmd).speed>old.speed);
 assert.equal(shipActionAvailability(engine.getState().domainData.career,
  engine.getState().activeLife,'upgrade','sails').enabled,false);
 assert.ok(isValidState(engine.getState()));
});
test('changement de modèle, reprise, élargissement du recrutement jusqu’à huit',()=>{
 const {engine}=setup();
 const old=engine.getState().domainData.career.missions.berys;
 assert.ok(engine.shipAction('purchase','brig'));
 assert.equal(engine.getState().domainData.career.missions.berys,old-125000);
 assert.equal(engine.getState().domainData.career.command.ship.model,'brig');
 for(let i=0;i<6;i++)assert.ok(engine.recruitCrew('combattant'));
 assert.equal(engine.getState().domainData.career.command.members.length,6);
 assert.equal(engine.recruitCrew('combattant'),false);
 assert.equal(engine.shipAction('purchase','sloop'),false,'Refuser de perdre deux places occupées');
 assert.ok(engine.shipAction('purchase','frigate'));
 assert.equal(engine.getState().domainData.career.command.ship.model,'frigate');
 assert.equal(engine.getState().domainData.career.command.ship.upgrades.hull,0);
 for(let i=0;i<2;i++)assert.ok(engine.recruitCrew('navigateur'));
 assert.equal(engine.getState().domainData.career.command.members.length,8);
 assert.equal(engine.recruitCrew('combattant'),false);
 assert.ok(isValidState(engine.getState()));
});
test('missions et temps abîment des pièces, des réparations débloquent un navire immobilisé',()=>{
 const {engine,map,storage}=setup();
 const before=engine.getState();
 assert.ok(engine.mission('explore'));
 const after=engine.getState();
 assert.ok(after.domainData.career.command.ship.parts.sails<
   before.domainData.career.command.ship.parts.sails);
 assert.ok(after.domainData.career.command.ship.maintenance<
   before.domainData.career.command.ship.maintenance);
 assert.equal(after.domainData.career.command.ship.voyages,1);
 assert.ok(after.domainData.career.command.hull<before.domainData.career.command.hull);
 ageTo(engine,17);
 assert.ok(engine.getState().domainData.career.command.ship.parts.rudder<
   after.domainData.career.command.ship.parts.rudder);
 const s=engine.getState();
 const damaged={...s,domainData:{...s.domainData,career:{...s.domainData.career,
  command:{...s.domainData.career.command,hull:0}}}};
 assert.ok(isValidState(damaged));map.set(SAVE_KEY,JSON.stringify(damaged));
 const immobilized=createEngine({storage,random:()=>0});
 assert.equal(immobilized.mission('escort'),false);
 assert.ok(immobilized.commandCrew('repair'));
 assert.ok(immobilized.mission('escort'));
 assert.ok(isValidState(immobilized.getState()));
});
test('bonus du navire variable selon équipement et mission',()=>{
 const {engine}=setup();
 const cmd=engine.getState().domainData.career.command;
 const before=shipMissionEffects(cmd,'raid');
 assert.ok(engine.shipAction('upgrade','cannons'));
 assert.ok(shipMissionEffects(engine.getState().domainData.career.command,'raid').chance>before.chance);
 const s=engine.getState();
 assert.ok(missionAvailability(s.domainData.career,s.domainData.abilities,
  s.domainData.relationships,s.activeLife,'escort').enabled);
});
test('migration V15 vers V16 conserve l’intégralité de l’histoire, l’argent et les PNJ',()=>{
 const {engine,map,storage}=setup();
 assert.ok(engine.recruitCrew('navigateur'));
 const now=engine.getState(),cmd=now.domainData.career.command;
 const {ship,navigation,...legacyCommand}=cmd;
 const original={...now,schemaVersion:15,domainData:{...now.domainData,
  career:{...now.domainData.career,command:legacyCommand}}};
 map.clear();map.set(V15_SAVE_KEY,JSON.stringify(original));
 const migrated=migrateV15(original);
 assert.ok(migrated);
 assert.equal(migrated.schemaVersion,17);
 assert.deepEqual(migrated.domainData.career.command.members,cmd.members);
 assert.deepEqual(migrated.history,now.history);
 assert.deepEqual(migrated.domainData.relationships,now.domainData.relationships);
 assert.equal(migrated.domainData.career.missions.berys,now.domainData.career.missions.berys);
 assert.deepEqual((( {navigation,...old} )=>old)(migrated.domainData.career.command),upgradeShipSave(legacyCommand));
 assert.deepEqual(createEngine({storage}).getState(),migrated);
 assert.equal(map.get(V15_SAVE_KEY),JSON.stringify(original));
 assert.ok(map.has(SAVE_KEY));
});
test('protection contre les achats frauduleux, pièces invalides et stockage interrompu',()=>{
 const {engine,storage}=setup();
 const original=engine.getState(),cmd=original.domainData.career.command;
 assert.equal(engine.shipAction('purchase','inexistant'),false);
 assert.equal(engine.shipAction('repair','hull'),false);
 assert.equal(engine.shipAction('upgrade','x'),false);
 const modified={...original,domainData:{...original.domainData,
  career:{...original.domainData.career,command:{...cmd,ship:{...cmd.ship,
   parts:{...cmd.ship.parts,sails:101}}}}}};
 assert.equal(isValidState(modified),false);
 const locked=createEngine({storage:{...storage,setItem:()=>{throw Error('quota');}}});
 assert.equal(locked.shipAction('upgrade','hull'),false);
 assert.deepEqual(locked.getState(),original);
});
