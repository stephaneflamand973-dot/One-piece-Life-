import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState} from '../foundation/src/core/state.mjs';
import {CREW_ROLES,crewEffects,ageCrewLife,resolveCrewRequest,upgradeCommand} from '../foundation/src/core/pirate-crew-life.mjs';
import {migrateV14,V14_SAVE_KEY,SAVE_KEY} from '../foundation/src/core/storage.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
 voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
const storageMemory=()=>{
 const map=new Map();
 return {map,storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),
  removeItem:k=>map.delete(k)}};
};
function toAge(engine,target){
 while(engine.getState().activeLife.age<target){
  assert.equal(engine.age(),true,'Année bloquée');
  const state=engine.getState();
  if(state.domainData.story.pending)
   assert.equal(engine.choose(choices[state.domainData.story.pending.eventId]),true);
  if(engine.getState().domainData.relationships.pending)
   assert.equal(engine.answerNpc('accept'),true);
  if(engine.getState().domainData.career.command?.pending)
   assert.equal(engine.crewAnswer('refuse'),true);
 }
 return engine.getState();
}
function captain(){
 const {map,storage}=storageMemory();
 const engine=createEngine({storage,random:()=>0});
 assert.ok(engine.startLife(hero));toAge(engine,16);
 assert.ok(engine.applyPirate('alizes','combattant'));
 assert.ok(engine.mission('escort'));
 assert.ok(engine.mission('explore'));
 assert.ok(engine.foundCrew());
 assert.ok(engine.recruitCrew('navigateur'));
 return {engine,map,storage};
}
test('recrue V0.5.6 : psychologie et relation persistantes, gestion sans nouveau cycle',()=>{
 const {engine,storage}=captain();
 const state=engine.getState(),member=state.domainData.career.command.members[0];
 assert.ok(Object.hasOwn(CREW_ROLES,member.role));
 assert.ok(member.bond>=0);
 assert.ok(member.ambition>=0);
 const age=state.activeLife.age;
 assert.ok(engine.crewInteract(member.id,'talk'));
 assert.ok(engine.crewInteract(member.id,'talk'));
 assert.ok(engine.setCrewRole(member.id,'charpentier'));
 assert.equal(engine.setCrewRole(member.id,'charpentier'),false);
 const now=engine.getState();
 assert.equal(now.activeLife.age,age);
 assert.equal(now.history.length,age+1);
 assert.equal(now.domainData.career.command.members[0].role,'charpentier');
 assert.ok(now.domainData.career.command.members[0].strain>0);
 assert.ok(isValidState(now));
 assert.deepEqual(createEngine({storage}).getState(),now);
 assert.match(renderCareer(now),/Attribuer ce poste/);
});
test('bras droit unique et récompense payante sans limite annuelle',()=>{
 const {engine}=captain();
 const first=engine.getState().domainData.career.command.members[0].id;
 assert.ok(engine.mission('treasure'));
 assert.ok(engine.recruitCrew('medecin'));
 const second=engine.getState().domainData.career.command.members[1].id;
 assert.ok(engine.setCrewRole(first,'second'));
 assert.equal(engine.setCrewRole(second,'second'),false);
 const old=engine.getState().domainData.career.missions.berys;
 assert.ok(engine.crewInteract(first,'reward'));
 assert.ok(engine.crewInteract(first,'reward'));
 assert.equal(engine.getState().domainData.career.missions.berys,old-5000);
 assert.equal(engine.getState().domainData.career.command.members.filter(m=>m.role==='second').length,1);
 assert.ok(isValidState(engine.getState()));
});
test('les rôles améliorent concrètement les risques et la navigation',()=>{
 const {engine}=captain();
 const id=engine.getState().domainData.career.command.members[0].id;
 const nav=crewEffects(engine.getState().domainData.career.command,'explore');
 assert.ok(nav.chance>0);
 engine.setCrewRole(id,'medecin');
 const doctor=crewEffects(engine.getState().domainData.career.command,'explore');
 assert.ok(doctor.injuryMultiplier<1);
 engine.setCrewRole(id,'charpentier');
 const carpenter=crewEffects(engine.getState().domainData.career.command,'raid');
 assert.ok(carpenter.hullReduction>0);
 assert.ok(isValidState(engine.getState()));
});
test('un renvoi permet une nouvelle recrue et met à jour les liens',()=>{
 const {engine}=captain();
 const m=engine.getState().domainData.career.command.members[0];
 assert.ok(engine.crewInteract(m.id,'dismiss'));
 assert.equal(engine.getState().domainData.career.command.members.length,0);
 assert.equal(engine.commandCrew('train'),false);
 assert.ok(isValidState(engine.getState()));
});
test('un événement autonome demande une réponse et modifie durablement la cohésion',()=>{
 const {engine}=captain();
 assert.ok(engine.mission('treasure'));
 assert.ok(engine.recruitCrew('combattant'));
 const state=engine.getState(),career=state.domainData.career;
 const evolved=ageCrewLife(career,18,()=>0);
 assert.ok(evolved.career.command.pending);
 assert.equal(evolved.career.command.pending.age,18);
 const hero18={...state.activeLife,age:18};
 const answered=resolveCrewRequest(evolved.career,hero18,'refuse');
 assert.equal(answered.command.pending,null);
 assert.equal(answered.command.events.at(-1).age,18);
 assert.notDeepEqual(answered.command.members,evolved.career.command.members);
 // L'intégration moteur conserve aussi la décision de l'année suivante.
 toAge(engine,18);
 assert.ok(isValidState(engine.getState()));
 assert.equal(engine.getState().history.length,19);
});
test('migration 14 -> 15 conserve identité, richesse, spécialités, historique',()=>{
 const {engine,map,storage}=captain();
 const state=engine.getState();
 const cmd=state.domainData.career.command;
 const {cohesion,pending,events,...oldCommand}=cmd;
 const legacyCmd={...oldCommand,members:cmd.members.map(m=>{
  const {role,temperament,bond,ambition,rivalry,strain,...oldMember}=m;
  return oldMember;
 })};
 const previous={...state,schemaVersion:14,domainData:{...state.domainData,
  career:{...state.domainData.career,command:legacyCmd}}};
 map.clear();map.set(V14_SAVE_KEY,JSON.stringify(previous));
 const candidate=migrateV14(previous);
 assert.ok(isValidState(candidate));
 const restored=createEngine({storage}).getState();
 assert.deepEqual(restored,candidate);
 assert.deepEqual(restored.domainData.career.command.members[0].firstName,
  cmd.members[0].firstName);
 assert.equal(restored.domainData.career.missions.berys,state.domainData.career.missions.berys);
 assert.deepEqual(restored.history,state.history);
 assert.equal(map.get(V14_SAVE_KEY),JSON.stringify(previous));
 assert.ok(map.has(SAVE_KEY));
 assert.deepEqual(upgradeCommand(legacyCmd),restored.domainData.career.command);
});
test('chargement impossible si rôle, cohésion ou événement de bord sont corrompus',()=>{
 const {engine,storage}=captain();
 const old=engine.getState(),cmd=old.domainData.career.command;
 const invalid={...old,domainData:{...old.domainData,career:{...old.domainData.career,
  command:{...cmd,members:cmd.members.map(m=>({...m,role:'roi'}))}}}};
 assert.equal(isValidState(invalid),false);
 const invalidCohesion={...old,domainData:{...old.domainData,career:{...old.domainData.career,
  command:{...cmd,cohesion:101}}}};
 assert.equal(isValidState(invalidCohesion),false);
 const locked=createEngine({storage:{...storage,setItem:()=>{throw new Error('quota');}},random:()=>0});
 assert.equal(locked.crewInteract(cmd.members[0].id,'talk'),false);
 assert.deepEqual(locked.getState(),old);
});

test('demande spontanée en vraie partie : + Âge attend le choix, puis débloque',()=>{
 const {engine,storage}=captain();
 assert.ok(engine.mission('treasure'));
 assert.ok(engine.recruitCrew('combattant'));
 toAge(engine,17);
 assert.ok(engine.age());
 const pendingState=engine.getState();
 assert.equal(pendingState.activeLife.age,18);
 assert.ok(pendingState.domainData.career.command.pending);
 assert.equal(engine.age(),false);
 if(pendingState.domainData.story.pending)
  assert.ok(engine.choose(choices[pendingState.domainData.story.pending.eventId]));
 if(engine.getState().domainData.relationships.pending)
  assert.ok(engine.answerNpc('accept'));
 assert.ok(engine.crewAnswer('refuse'));
 const state=engine.getState();
 assert.equal(state.domainData.career.command.pending,null);
 assert.equal(state.activeLife.age,18);
 assert.equal(state.history.length,19);
 assert.ok(isValidState(state));
 assert.deepEqual(createEngine({storage}).getState(),state);
 assert.ok(engine.age());
});
