import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState} from '../foundation/src/core/state.mjs';
import {emptyEncounters,encounterAvailability,rollEncounter,validEncounters} from '../foundation/src/core/pirate-encounters.mjs';
import {V17_SAVE_KEY,SAVE_KEY,migrateV17,loadState} from '../foundation/src/core/storage.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const options={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
 voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function store(){
 const map=new Map();
 return {map,storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
}
function ageTo(engine,target){
 while(engine.getState().activeLife.age<target){
  assert.ok(engine.age());
  const s=engine.getState();
  if(s.domainData.story.pending)assert.ok(engine.choose(options[s.domainData.story.pending.eventId]));
  if(engine.getState().domainData.relationships.pending)assert.ok(engine.answerNpc('accept'));
  if(engine.getState().domainData.career.command?.pending)assert.ok(engine.crewAnswer('refuse'));
 }
}
function captain(){
 const {map,storage}=store();
 const engine=createEngine({storage,random:()=>0});
 assert.ok(engine.startLife(hero));ageTo(engine,16);
 assert.ok(engine.applyPirate('alizes','combattant'));
 assert.ok(engine.mission('escort'));assert.ok(engine.mission('explore'));
 assert.ok(engine.foundCrew());
 const state=engine.getState();
 const funded={...state,domainData:{...state.domainData,
  career:{...state.domainData.career,missions:{...state.domainData.career.missions,berys:200000}}}};
 assert.ok(isValidState(funded));map.set(SAVE_KEY,JSON.stringify(funded));
 return {engine:createEngine({storage,random:()=>0}),map,storage};
}
function forceEncounter(storage,faction='marine'){
 const sequence=[0,faction==='marchand'?.50:faction==='pirate'?.25:
  faction==='revolutionnaire'?.65:0,.99];
 let i=0;
 const engine=createEngine({storage,random:()=>sequence[i++]??0});
 assert.ok(engine.sail('shells'),'La traversée est possible');
 const state=engine.getState();
 assert.ok(state.domainData.career.command.encounters.pending,'Une rencontre apparaît');
 assert.equal(state.domainData.career.command.encounters.pending.faction,faction);
 return engine;
}
test('nouvelle partie : journal de combats vierge et validé',()=>{
 const {engine,storage}=captain(),s=engine.getState();
 const cmd=s.domainData.career.command;
 assert.deepEqual(cmd.encounters,emptyEncounters());
 assert.equal(validEncounters(cmd.encounters,cmd,s.activeLife.age),true);
 assert.deepEqual(createEngine({storage}).getState(),s);
});
test('rencontre en mer persistante : bloque une autre année ou traversée, sans onglets',()=>{
 const {storage}=captain();
 const engine=forceEncounter(storage);
 const old=engine.getState(),p=old.domainData.career.command.encounters.pending;
 assert.equal(p.island,'shells');
 assert.equal(p.age,old.activeLife.age);
 assert.equal(engine.age(),false);
 assert.equal(engine.sail('orange'),false);
 assert.equal(engine.exploreIsland(),false);
 assert.equal(engine.shipAction('upgrade','hull'),false);
 assert.equal(engine.commandCrew('train'),false);
 assert.equal(engine.mission('escort'),false);
 assert.equal(old.history.length,old.activeLife.age+1);
 const copy=createEngine({storage});
 assert.deepEqual(copy.getState(),old);
 assert.match(renderCareer(old),/Rencontre en mer/);
 assert.match(renderCareer(old),/Combattre/);
});
test('victoire au canon : gagne du butin, de la notoriété et une vraie prime',()=>{
 const {storage}=captain();
 forceEncounter(storage);
 const engine=createEngine({storage,random:()=>0});
 const before=engine.getState(),money=before.domainData.career.missions.berys;
 const a=encounterAvailability(before.domainData.career,before.activeLife,
   before.domainData.abilities,'fight');
 assert.ok(a.chance>=8&&a.chance<=94);
 assert.ok(engine.encounter('fight'));
 const s=engine.getState(),career=s.domainData.career,e=career.command.encounters;
 assert.equal(e.pending,null);
 assert.equal(e.victories,1);
 assert.equal(e.defeats,0);
 assert.equal(e.resolved,1);
 assert.equal(e.log[0].outcome,'success');
 assert.equal(e.log[0].chance,a.chance);
 assert.equal(career.missions.berys,money+e.log[0].loot);
 assert.ok(career.wanted.bounty>before.domainData.career.wanted.bounty);
 assert.ok(career.wanted.heat>before.domainData.career.wanted.heat);
 assert.equal(s.history.length,before.history.length);
 assert.equal(s.activeLife.age,before.activeLife.age);
 assert.match(renderCareer(s),/Confrontations/);
 assert.ok(isValidState(s));
 assert.deepEqual(createEngine({storage}).getState(),s);
 assert.ok(engine.sail('orange'),'Repartir aussitôt, la même année');
});
test('un abordage exige un compagnon ; négocier permet toujours de résoudre',()=>{
 const {storage}=captain();
 const engine=forceEncounter(storage,'marchand');
 const s=engine.getState();
 assert.equal(encounterAvailability(s.domainData.career,s.activeLife,
  s.domainData.abilities,'board').enabled,false);
 assert.equal(engine.encounter('board'),false);
 assert.ok(engine.encounter('negotiate'));
 const result=engine.getState();
 assert.equal(result.domainData.career.command.encounters.negotiated,1);
 assert.equal(result.domainData.career.command.encounters.pending,null);
 assert.ok(isValidState(result));
});
test('défaite à l’abordage : dégâts, fatigue et perte d’argent réelles',()=>{
 const {storage}=captain();
 const prep=createEngine({storage,random:()=>0});
 assert.ok(prep.recruitCrew('combattant'));
 forceEncounter(storage,'pirate');
 const engine=createEngine({storage,random:()=>.999});
 const before=engine.getState();
 const oldMoney=before.domainData.career.missions.berys;
 const oldHull=before.domainData.career.command.hull;
 assert.ok(engine.encounter('board'));
 const s=engine.getState(),career=s.domainData.career;
 assert.equal(career.command.encounters.defeats,1);
 assert.equal(career.command.encounters.log[0].outcome,'failure');
 assert.ok(career.command.hull<oldHull);
 assert.ok(career.missions.berys<oldMoney);
 assert.ok(s.domainData.abilities.fatigue>before.domainData.abilities.fatigue);
 assert.ok(s.domainData.abilities.injury.level>=1);
 assert.ok(isValidState(s));
});
test('fuite : vitesse, navigation et pression modulent les chances',()=>{
 const {storage}=captain();forceEncounter(storage);
 const engine=createEngine({storage,random:()=>0});
 const base=engine.getState(),cmd=base.domainData.career.command;
 const flee=encounterAvailability(base.domainData.career,base.activeLife,
  base.domainData.abilities,'flee');
 const modified={...base.domainData.career,command:{...cmd,ship:{...cmd.ship,
  parts:{...cmd.ship.parts,rudder:10}}}};
 const poor=encounterAvailability(modified,base.activeLife,base.domainData.abilities,'flee');
 assert.ok(flee.chance>poor.chance);
 assert.ok(engine.encounter('flee'));
 assert.equal(engine.getState().domainData.career.command.encounters.escapes,1);
 assert.ok(isValidState(engine.getState()));
});
test('rencontres successives dans la même année, statistiques cohérentes',()=>{
 const {storage}=captain();
 let engine=forceEncounter(storage);
 assert.ok(engine.encounter('flee'));
 const age=engine.getState().activeLife.age;
 // Nouveau voyage, seconde interception, sans vieillissement.
 const sequence=[0,0,.99];let i=0;
 engine=createEngine({storage,random:()=>sequence[i++]??0});
 assert.ok(engine.sail('fuchsia'));
 assert.ok(engine.getState().domainData.career.command.encounters.pending);
 assert.ok(engine.encounter('fight'));
 const s=engine.getState(),e=s.domainData.career.command.encounters;
 assert.equal(e.resolved,2);
 assert.equal(e.victories+e.defeats+e.negotiated+e.escapes,2);
 assert.equal(s.activeLife.age,age);
 assert.ok(isValidState(s));
});
test('sauvegarde V17 -> V18 : navire, équipage, routes, relations et butin intacts',()=>{
 const {engine,map,storage}=captain();
 assert.ok(engine.recruitCrew('navigateur'));
 assert.ok(engine.sail('shells'));
 const now=engine.getState(),cmd=now.domainData.career.command;
 const {encounters,...oldCmd}=cmd;
 const previous={...now,schemaVersion:17,domainData:{...now.domainData,
  career:{...now.domainData.career,command:oldCmd}}};
 map.clear();map.set(V17_SAVE_KEY,JSON.stringify(previous));
 const migrated=migrateV17(previous);
 assert.ok(migrated);
 assert.equal(migrated.schemaVersion,18);
 assert.deepEqual(migrated.domainData.career.command.ship,cmd.ship);
 assert.deepEqual(migrated.domainData.career.command.navigation,cmd.navigation);
 assert.deepEqual(migrated.domainData.career.command.members,cmd.members);
 assert.deepEqual(migrated.domainData.relationships,now.domainData.relationships);
 assert.deepEqual(migrated.history,now.history);
 assert.equal(migrated.domainData.career.missions.berys,now.domainData.career.missions.berys);
 assert.deepEqual(migrated.domainData.career.command.encounters,emptyEncounters());
 assert.deepEqual(createEngine({storage}).getState(),migrated);
 assert.equal(map.get(V17_SAVE_KEY),JSON.stringify(previous));
 assert.ok(map.has(SAVE_KEY));
});
test('états falsifiés et stockage indisponible : aucun effet secondaire',()=>{
 const {storage,map}=captain();
 forceEncounter(storage);
 const previous=createEngine({storage,random:()=>0}).getState();
 const original=previous.domainData.career.command;
 const illegal={...previous,domainData:{...previous.domainData,
  career:{...previous.domainData.career,command:{...original,
   encounters:{...original.encounters,pending:{...original.encounters.pending,
    threat:101}}}}}};
 assert.equal(isValidState(illegal),false);
 const locked=createEngine({storage:{...storage,setItem:()=>{throw Error('quota');}},random:()=>0});
 assert.equal(locked.encounter('fight'),false);
 assert.deepEqual(locked.getState(),previous);
 assert.equal(locked.encounter('pirate'),false);
 map.set(SAVE_KEY,'{invalid');
 assert.equal(loadState(storage),null);
});
