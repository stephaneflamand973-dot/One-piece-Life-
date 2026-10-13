import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState} from '../foundation/src/core/state.mjs';
import {foundAvailability,recruitingAvailability,recruitToCrew,giveOrder,
  orderAvailability,ageCommand,SHIP_COST,MAX_CREW_MEMBERS} from '../foundation/src/core/pirate-command.mjs';
import {missionAvailability} from '../foundation/src/core/pirate-missions.mjs';
import {SAVE_KEY,V13_SAVE_KEY,migrateV13,loadState} from '../foundation/src/core/storage.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
 voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function storageMemory(){
 const map=new Map();
 return {map,storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
}
function toAge(engine,age){
 while(engine.getState().activeLife.age<age){
  assert.ok(engine.age());
  const pending=engine.getState().domainData.story.pending;
  if(pending)assert.ok(engine.choose(choices[pending.eventId]));
  if(engine.getState().domainData.relationships.pending)
    assert.ok(engine.answerNpc('accept'));
  assert.ok(isValidState(engine.getState()));
 }
 return engine.getState();
}
function setup(age=16,random=()=>0){
 const {map,storage}=storageMemory();
 const engine=createEngine({storage,random});
 assert.ok(engine.startLife(hero));
 toAge(engine,age);
 return {engine,storage,map};
}
function pirateWithMoney(){
 const data=setup(16);
 assert.ok(data.engine.applyPirate('alizes','combattant'));
 assert.ok(data.engine.mission('escort'));
 assert.ok(data.engine.mission('explore'));
 assert.equal(data.engine.getState().domainData.career.missions.berys,56000);
 return data;
}
test('acheter un navire débloque le rang de capitaine sans modifier les talents',()=>{
 const {engine,storage}=pirateWithMoney();
 const before=engine.getState();
 assert.equal(foundAvailability(before.domainData.career,before.activeLife,
   before.domainData.relationships).enabled,true);
 assert.ok(engine.foundCrew());
 const after=engine.getState(),career=after.domainData.career;
 assert.equal(career.pirate.crewId,'own');
 assert.equal(career.pirate.rank,3);
 assert.equal(career.command.name,'Équipage de Lina');
 assert.equal(career.command.hull,75);
 assert.equal(career.missions.berys,56000-SHIP_COST);
 assert.equal(career.missions.used,2,'La création ne rend pas de nouvelles missions disponibles');
 assert.deepEqual(after.domainData.abilities,before.domainData.abilities);
 assert.deepEqual(after.domainData.relationships.people,before.domainData.relationships.people);
 assert.equal(after.domainData.relationships.world.unit,career.command.name);
 assert.equal(after.history.length,17);
 assert.match(renderCareer(after),/Commandement de mon équipage/);
 assert.equal(engine.foundCrew(),false);
 assert.ok(isValidState(after));
 assert.deepEqual(createEngine({storage}).getState(),after);
});
test('recruter crée un PNJ persistant avec spécialité, talent et loyauté',()=>{
 const {engine,storage}=pirateWithMoney();
 engine.foundCrew();
 assert.ok(engine.recruitCrew('navigateur'));
 const after=engine.getState().domainData.career;
 assert.equal(after.command.members.length,1);
 assert.equal(after.command.members[0].id,'crew-member-1');
 assert.equal(after.command.members[0].specialty,'navigateur');
 assert.ok(after.command.members[0].loyalty>=0);
 assert.equal(after.missions.berys,1000);
 assert.equal(engine.recruitCrew('cuisinier'),false);
 assert.ok(isValidState(engine.getState()));
 assert.deepEqual(createEngine({storage}).getState(),engine.getState());
});
test('un refus de recrutement permet de recommencer la même année',()=>{
 const {engine}=pirateWithMoney();
 engine.foundCrew();
 const old=engine.getState();
 const refused=recruitToCrew(old.domainData.career,old.activeLife,'cuisinier',
   ()=>0.99999);
 assert.equal(refused.accepted,false);
 assert.equal(refused.career.command.members.length,0);
 assert.equal(refused.career.missions.berys,old.domainData.career.missions.berys);
 assert.equal(refused.career.command.recruitedAtAge,16);
 assert.equal(recruitingAvailability(refused.career,old.activeLife).enabled,true);
});
test('les ordres améliorent les membres, le navire ou la loyauté avec coûts réels',()=>{
 const {engine}=pirateWithMoney();
 engine.foundCrew();
 engine.recruitCrew('navigateur');
 const before=engine.getState().domainData.career;
 assert.ok(engine.commandCrew('train'));
 const trained=engine.getState().domainData.career;
 assert.ok(trained.command.members[0].skill>before.command.members[0].skill);
 assert.ok(trained.command.morale<before.command.morale,'L’entraînement a un coût en moral');
 assert.equal(engine.commandCrew('repair'),false,'Manque de Berrys, pas quota annuel');
 assert.equal(orderAvailability(trained,engine.getState().activeLife,'share').enabled,false);
 const mock={...trained,missions:{...trained.missions,berys:30000},
   command:{...trained.command,hull:30}};
 const life=engine.getState().activeLife;
 const repaired=giveOrder(mock,life,'repair');
 assert.equal(repaired.missions.berys,22000);
 assert.equal(repaired.command.hull,54);
 const shared=giveOrder(repaired,life,'share');
 assert.equal(shared.missions.berys,17000);
 assert.ok(shared.command.members[0].loyalty>mock.command.members[0].loyalty);
 assert.equal(shared.command.orderAtAge,life.age);
 assert.equal(orderAvailability(shared,life,'train').enabled,true);
 const secondTraining=giveOrder(shared,life,'train');
 assert.ok(secondTraining.command.members[0].skill>shared.command.members[0].skill);
});
test('un capitaine effectue les trois ordres dans la même année sans vieillir',()=>{
 const {engine,storage,map}=pirateWithMoney();
 engine.foundCrew();engine.recruitCrew('navigateur');
 const saved=engine.getState();
 const funded={...saved,domainData:{...saved.domainData,
   career:{...saved.domainData.career,
     missions:{...saved.domainData.career.missions,berys:50000}}}};
 assert.ok(isValidState(funded));
 map.set(SAVE_KEY,JSON.stringify(funded));
 const captain=createEngine({storage});
 const age=captain.getState().activeLife.age;
 assert.ok(captain.commandCrew('train'));
 assert.ok(captain.commandCrew('repair'));
 assert.ok(captain.commandCrew('share'));
 assert.ok(captain.commandCrew('train'));
 const after=captain.getState();
 assert.equal(after.activeLife.age,age);
 assert.equal(after.history.length,age+1);
 assert.equal(after.domainData.career.missions.berys,50000-8000-5000);
 assert.equal(after.domainData.career.command.orderAtAge,age);
 assert.ok(isValidState(after));
 assert.deepEqual(createEngine({storage}).getState(),after);
});
test('les missions du capitaine dépendent du navire et des compagnons',()=>{
 const {engine}=pirateWithMoney();
 engine.foundCrew();engine.recruitCrew('navigateur');
 toAge(engine,17);
 const before=engine.getState();
 const good=missionAvailability(before.domainData.career,before.domainData.abilities,
   before.domainData.relationships,before.activeLife,'escort');
 const mock={...before.domainData.career,
   command:{...before.domainData.career.command,hull:10,morale:10,members:[]}};
 const poor=missionAvailability(mock,before.domainData.abilities,
   before.domainData.relationships,before.activeLife,'escort');
 assert.ok(good.chance>poor.chance);
 assert.equal(missionAvailability(mock,before.domainData.abilities,
   before.domainData.relationships,before.activeLife,'raid').enabled,false);
 assert.ok(engine.mission('escort'));
 const after=engine.getState().domainData.career;
 assert.equal(after.missions.used,1);
 assert.ok(after.command.hull<before.domainData.career.command.hull);
 assert.ok(after.command.morale>before.domainData.career.command.morale);
 assert.ok(isValidState(engine.getState()));
});
test('démission, année suivante et nouvel équipage préservent les biens et relations',()=>{
 const {engine,storage}=pirateWithMoney();
 const before=engine.getState();
 assert.ok(engine.resignPirate());
 const resigned=engine.getState();
 assert.equal(resigned.domainData.career.pirate,null);
 assert.equal(resigned.domainData.career.missions.berys,56000);
 assert.equal(resigned.domainData.career.missions.used,2);
 assert.equal(engine.mission('escort'),false);
 assert.deepEqual(resigned.domainData.abilities,before.domainData.abilities);
 assert.deepEqual(resigned.domainData.relationships.people,before.domainData.relationships.people);
 assert.ok(isValidState(resigned));
 toAge(engine,17);
 assert.equal(engine.getState().domainData.career.missions.used,0);
 assert.ok(engine.applyPirate('aurore','navigateur')===false ||
   engine.getState().domainData.career.appliedAtAge===17);
 // Même en cas de refus, la fortune personnelle ne disparaît pas.
 assert.equal(engine.getState().domainData.career.missions.berys,56000);
 assert.ok(isValidState(engine.getState()));
 assert.deepEqual(createEngine({storage}).getState(),engine.getState());
});
test('recrutement croissant, limites de membres et vieillissement de l’équipage',()=>{
 const {engine}=pirateWithMoney();
 engine.foundCrew();engine.recruitCrew('combattant');
 const first=engine.getState().domainData.career.command;
 assert.equal(first.members.length,1);
 const dummy=ageCommand(engine.getState().domainData.career,17,()=>0.99);
 assert.equal(dummy.career.command.orderAtAge,first.orderAtAge);
 assert.ok(dummy.career.command.hull<first.hull);
 assert.ok(dummy.career.command.morale<first.morale);
 const deserted=ageCommand({...engine.getState().domainData.career,
   command:{...first,morale:14,members:[{...first.members[0],loyalty:5}]}},17,()=>0);
 assert.equal(deserted.career.command.members.length,0);
 assert.match(deserted.note,/déserte/);
});
test('migration V0.5.3 laisse tous les champs existants strictement identiques',()=>{
 const {engine,map,storage}=pirateWithMoney();
 const s=engine.getState();
 const {command,...oldCareer}=s.domainData.career;
 const legacy={...s,schemaVersion:13,
   domainData:{...s.domainData,career:oldCareer}};
 map.clear();map.set(V13_SAVE_KEY,JSON.stringify(legacy));
 const imported=createEngine({storage}).getState();
 assert.equal(imported.schemaVersion,14);
 const {command:newCommand,...other}=imported.domainData.career;
 assert.equal(newCommand,null);
 assert.deepEqual(other,oldCareer);
 assert.deepEqual(imported.domainData.relationships,legacy.domainData.relationships);
 assert.deepEqual(imported.domainData.abilities,legacy.domainData.abilities);
 assert.deepEqual(imported.history,legacy.history);
 assert.deepEqual(migrateV13(legacy),imported);
 assert.equal(map.get(V13_SAVE_KEY),JSON.stringify(legacy));
 assert.ok(map.has(SAVE_KEY));
});
test('commandement sauvegardé sur plusieurs décennies jusqu’à 120 ans',()=>{
 const {engine}=pirateWithMoney();
 engine.foundCrew();engine.recruitCrew('combattant');
 for(let age=17;age<=120;age++){
   toAge(engine,age);
   assert.equal(engine.getState().history.length,age+1);
   assert.ok(isValidState(engine.getState()),'État invalide à '+age);
 }
 assert.equal(engine.getState().activeLife.alive,false);
 assert.equal(engine.recruitCrew('medecin'),false);
 assert.equal(engine.commandCrew('train'),false);
 assert.ok(engine.getState().domainData.career.command.hull>=0);
});
test('états falsifiés, manque d’argent et échec de stockage ne font rien perdre',()=>{
 const {engine,storage,map}=pirateWithMoney();
 engine.foundCrew();
 const s=engine.getState();
 assert.equal(foundAvailability(s.domainData.career,s.activeLife,
   s.domainData.relationships).enabled,false);
 const invalid={...s,domainData:{...s.domainData,
  career:{...s.domainData.career,command:{...s.domainData.career.command,hull:999}}}};
 assert.equal(isValidState(invalid),false);
 const another={...s,domainData:{...s.domainData,
  career:{...s.domainData.career,command:{...s.domainData.career.command,
   members:[{id:'crew-member-1',firstName:'A',lastName:'B',specialty:'combattant',
    joinedAtAge:16,skill:40,loyalty:40},{id:'crew-member-1',firstName:'A',lastName:'B',
    specialty:'combattant',joinedAtAge:16,skill:40,loyalty:40}]}}}};
 assert.equal(isValidState(another),false);
 const locked=createEngine({storage:{...storage,setItem:()=>{throw Error('quota');}},random:()=>0});
 const snapshot=locked.getState();
 assert.equal(locked.recruitCrew('medecin'),false);
 assert.equal(locked.commandCrew('train'),false);
 assert.deepEqual(locked.getState(),snapshot);
 map.set(SAVE_KEY,'{broken');
 assert.equal(loadState(storage),null);
 assert.equal(MAX_CREW_MEMBERS,4);
});
