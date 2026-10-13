
import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../foundation/src/core/engine.mjs';
import { isValidState } from '../foundation/src/core/state.mjs';
import { MISSIONS, missionAvailability, performMission } from '../foundation/src/core/pirate-missions.mjs';
import { migrateV11, SAVE_KEY, V11_SAVE_KEY, loadState } from '../foundation/src/core/storage.mjs';
import { renderCareer } from '../foundation/src/ui/career-view.mjs';

const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
  voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function store(){
 const data=new Map();
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),
  removeItem:k=>data.delete(k)};
 return {data,storage};
}
function ageTo(engine,target){
 while(engine.getState().activeLife.age<target){
  assert.ok(engine.age(),'Avancée en âge bloquée');
  const game=engine.getState();
  if(game.domainData.story.pending)
    assert.ok(engine.choose(choices[game.domainData.story.pending.eventId]));
  if(engine.getState().domainData.relationships.pending)
    assert.ok(engine.answerNpc('accept'));
 }
 return engine.getState();
}
function setup(age=16,random=()=>0){
 const {data,storage}=store();
 const engine=createEngine({storage,random});
 assert.ok(engine.startLife(hero));
 ageTo(engine,age);
 return {engine,data,storage};
}
test('les missions sont indisponibles sans emploi pirate et les récompenses ne sont pas des primes',()=>{
 const {engine}=setup();
 assert.equal(engine.mission('escort'),false);
 assert.equal(engine.getState().domainData.career.missions.berys,0);
 assert.equal(Object.keys(MISSIONS).length,5);
});
test('réussite pirate : Berrys, compétence, performance, réputation et capitaine liés',()=>{
 const {engine,storage}=setup();
 assert.ok(engine.applyPirate('alizes','combattant'));
 const before=engine.getState();
 const chance=missionAvailability(before.domainData.career,before.domainData.abilities,
  before.domainData.relationships,before.activeLife,'escort');
 assert.equal(chance.enabled,true);
 assert.ok(chance.chance>=8&&chance.chance<=92);
 assert.ok(engine.mission('escort'));
 const after=engine.getState(),m=after.domainData.career.missions;
 assert.equal(m.used,1);
 assert.equal(m.completed,1);
 assert.equal(m.berys,18000);
 assert.equal(m.log.at(-1).outcome,'success');
 assert.ok(after.domainData.career.pirate.performance>before.domainData.career.pirate.performance);
 assert.ok(after.domainData.relationships.world.reputation>before.domainData.relationships.world.reputation);
 assert.ok(after.domainData.relationships.people.find(p=>p.id==='world-leader').trust>
   before.domainData.relationships.people.find(p=>p.id==='world-leader').trust);
 assert.ok(after.domainData.abilities.fatigue>before.domainData.abilities.fatigue);
 assert.equal(after.history.length,17);
 assert.match(after.history[16].text,/cargaison/);
 assert.ok(isValidState(after));
 assert.deepEqual(createEngine({storage}).getState(),after);
});
test('trois missions ou plus peuvent être jouées avant de vieillir selon la fatigue',()=>{
 const {engine}=setup();
 engine.applyPirate('alizes','combattant');
 assert.ok(engine.mission('escort'));
 assert.ok(engine.mission('explore'));
 assert.ok(engine.mission('treasure'));
 assert.equal(engine.getState().domainData.career.missions.used,3);
 const oldBalance=engine.getState().domainData.career.missions.berys;
 ageTo(engine,17);
 assert.equal(engine.getState().domainData.career.missions.used,0);
 assert.equal(engine.getState().domainData.career.missions.berys,oldBalance);
 assert.ok(engine.mission('escort'));
 assert.ok(isValidState(engine.getState()));
});
test('les probabilités suivent réellement les capacités, la fatigue et la loyauté',()=>{
 const {engine}=setup();
 engine.applyPirate('alizes','combattant');
 const s=engine.getState(),rel=s.domainData.relationships;
 const a=s.domainData.abilities,c=s.domainData.career;
 const weak=missionAvailability(c,a,rel,s.activeLife,'explore').chance;
 const strongSkills={...a.skills,navigation:95,vitesse:90,technique:90};
 const strong={...a,skills:strongSkills,fatigue:0};
 const highRel={...rel,world:{...rel.world,loyalty:95}};
 const better=missionAvailability(c,strong,highRel,s.activeLife,'explore').chance;
 const tired=missionAvailability(c,{...strong,fatigue:80},highRel,s.activeLife,'explore').chance;
 assert.ok(better>weak);
 assert.ok(tired<better);
 assert.equal(missionAvailability(c,{...a,injury:{level:2,recoverAtAge:17}},
   rel,s.activeLife,'escort').enabled,false);
 assert.equal(missionAvailability(c,{...a,fatigue:90},rel,s.activeLife,'escort').enabled,false);
});
test('succès partiel, échec et blessures : risques mais aucune mort automatique',()=>{
 const {engine}=setup(24);
 engine.applyPirate('alizes','combattant');
 const s=engine.getState();
 const c={...s.domainData.career,pirate:{...s.domainData.career.pirate,rank:2}};
 const a=s.domainData.abilities,rel=s.domainData.relationships;
 const chance=missionAvailability(c,a,rel,s.activeLife,'marine').chance/100;
 const partial=performMission(c,a,rel,s.activeLife,'marine',(()=>{let i=0;return()=>[Math.min(.96,chance+.05),0][i++];})());
 assert.equal(partial.entry.outcome,'partial');
 assert.equal(partial.entry.reward,Math.round(MISSIONS.marine.reward*.35));
 const failed=performMission(c,a,rel,s.activeLife,'marine',()=>0.99999);
 assert.equal(failed.entry.outcome,'failure');
 assert.equal(failed.entry.reward,0);
 assert.equal(failed.entry.injury,2);
 assert.equal(failed.abilities.injury.level,2);
 assert.ok(failed.career.pirate.performance<c.pirate.performance);
 assert.ok(failed.relationships.world.loyalty<rel.world.loyalty);
 assert.equal(s.activeLife.alive,true);
});
test('rangs requis : une recrue ne peut pas lancer un abordage ou briser un blocus',()=>{
 const {engine}=setup();
 engine.applyPirate('alizes','combattant');
 assert.equal(engine.mission('raid'),false);
 assert.equal(engine.mission('marine'),false);
 const s=engine.getState();
 assert.match(renderCareer(s),/Missions pirates/);
 assert.match(renderCareer(s),/data-pirate-mission="escort"/);
 assert.match(renderCareer(s),/Berrys/);
});
test('ancienne action mission de faction : moteur partagé une fois embauché',()=>{
 const {engine}=setup();
 engine.joinFaction('pirate');
 assert.ok(engine.applyPirate('alizes','combattant'));
 const before=engine.getState().domainData.career.missions.completed;
 assert.ok(engine.factionAction('mission'));
 assert.equal(engine.getState().domainData.career.missions.completed,before+1);
 assert.equal(engine.getState().domainData.career.missions.used,1);
});
test('migration V0.5.1 : carrière, équipage, talents et historique strictement conservés',()=>{
 const {engine,data,storage}=setup(19);
 engine.joinFaction('pirate');
 engine.applyPirate('alizes','combattant');
 engine.train('force');
 const current=engine.getState();
 const {missions,wanted,command,...oldCareer}=current.domainData.career;
 const old={...current,schemaVersion:11,domainData:{...current.domainData,career:oldCareer}};
 data.clear();
 data.set(V11_SAVE_KEY,JSON.stringify(old));
 const imported=createEngine({storage}).getState();
 assert.equal(imported.schemaVersion,14);
 assert.deepEqual(imported.history,old.history);
 assert.deepEqual(imported.domainData.story,old.domainData.story);
 assert.deepEqual(imported.domainData.relationships,old.domainData.relationships);
 assert.deepEqual(imported.domainData.abilities,old.domainData.abilities);
 const {missions:newMissions,wanted:newWanted,command:newCommand,...rest}=imported.domainData.career;
 assert.deepEqual(rest,oldCareer);
 assert.equal(newMissions.berys,0);
 assert.equal(newWanted.bounty,0);
 assert.equal(newCommand,null);
 assert.ok(isValidState(imported));
 assert.deepEqual(migrateV11(old),imported);
 assert.equal(data.get(V11_SAVE_KEY),JSON.stringify(old));
 assert.ok(data.has(SAVE_KEY));
});
test('une vie de 120 ans conserve son butin et une seule ligne de journal par âge',()=>{
 const {engine}=setup();
 engine.applyPirate('alizes','combattant');
 for(let age=16;age<=120;age++){
  if(age<120&&engine.getState().activeLife.alive){
   const s=engine.getState();
   if(s.domainData.abilities.injury.level!==2){
    engine.mission('escort');
   }
  }
  if(age<120)ageTo(engine,age+1);
  assert.equal(engine.getState().history.length,engine.getState().activeLife.age+1);
  assert.ok(isValidState(engine.getState()),'state invalid '+age);
 }
 assert.equal(engine.getState().activeLife.alive,false);
 assert.equal(engine.mission('escort'),false);
 assert.ok(engine.getState().domainData.career.missions.completed>5);
 assert.ok(engine.getState().domainData.career.missions.log.length<=20);
});
test('écriture refusée, état frauduleux et sauvegarde corrompue protégés',()=>{
 const {engine,storage,data}=setup();
 engine.applyPirate('alizes','combattant');
 const denied={...storage,setItem:()=>{throw Error('quota');}};
 const blocked=createEngine({storage:denied,random:()=>0});
 const original=blocked.getState();
 assert.equal(blocked.mission('escort'),false);
 assert.strictEqual(blocked.getState(),original);
 const s=engine.getState();
 const changed={...s,domainData:{...s.domainData,career:{...s.domainData.career,
  missions:{...s.domainData.career.missions,used:3}}}};
 assert.equal(isValidState(changed),false);
 data.set(SAVE_KEY,'{broken');
 assert.equal(loadState(storage),null);
});
