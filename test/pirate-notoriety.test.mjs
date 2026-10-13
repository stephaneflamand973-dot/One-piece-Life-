import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {isValidState} from '../foundation/src/core/state.mjs';
import {missionWanted,emptyWanted,validWanted,pursuitChance,wantedLevel,
  hideAvailability,hideFromMarine,annualPursuit,MAX_BOUNTY} from '../foundation/src/core/pirate-notoriety.mjs';
import {migrateV12,V12_SAVE_KEY,SAVE_KEY,loadState} from '../foundation/src/core/storage.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
  voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function memory(){
 const map=new Map();
 return {map,storage:{getItem:key=>map.get(key)??null,
  setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)}};
}
function advance(engine,age){
 while(engine.getState().activeLife.age<age){
  assert.ok(engine.age());
  const pending=engine.getState().domainData.story.pending;
  if(pending)assert.ok(engine.choose(choices[pending.eventId]));
  if(engine.getState().domainData.relationships.pending)
    assert.ok(engine.answerNpc('accept'));
  assert.ok(isValidState(engine.getState()));
 }
}
function start(age=16,random=()=>0){
 const {map,storage}=memory(),engine=createEngine({storage,random});
 assert.ok(engine.startLife(hero));advance(engine,age);
 return {map,storage,engine};
}
test('une carrière naît sans prime, notoriété ni pression de la Marine',()=>{
 const {engine}=start();
 const w=engine.getState().domainData.career.wanted;
 assert.deepEqual(w,emptyWanted());
 assert.equal(engine.hidePirate(),false);
 assert.equal(pursuitChance(w),0);
 assert.equal(wantedLevel(w),'Sans prime');
 assert.equal(engine.applyPirate('alizes','combattant'),true);
 assert.ok(renderCareer(engine.getState()).includes('Avis de recherche'));
 assert.ok(isValidState(engine.getState()));
});
test('la prime est différente de la fortune et exige un fait remarqué',()=>{
 const {engine}=start();
 assert.ok(engine.applyPirate('alizes','combattant'));
 const prior=engine.getState().domainData.career.wanted;
 assert.ok(engine.mission('escort'));
 const afterward=engine.getState().domainData.career;
 assert.equal(afterward.wanted.bounty,0);
 assert.equal(afterward.missions.berys,18000);
 assert.ok(afterward.wanted.notoriety>0);
 const raid=missionWanted(afterward.wanted,{id:'raid',outcome:'success'},16);
 assert.equal(raid.bounty,3500000);
 assert.equal(raid.incidents,1);
 assert.ok(raid.heat>afterward.wanted.heat);
 assert.equal(raid.events.at(-1).type,'bounty');
 assert.equal(afterward.missions.berys,18000);
 const escaped=missionWanted(raid,{id:'marine',outcome:'success'},17);
 assert.equal(escaped.bounty,15500000);
 assert.equal(wantedLevel(escaped),'Pirate redouté');
 assert.equal(escaped.events.at(-1).age,17);
});
test('une réputation mondiale peut évoluer sans augmenter automatiquement la prime',()=>{
 let w=emptyWanted();
 for(let age=16;age<27;age++)w=missionWanted(w,{id:'explore',outcome:'success'},age);
 assert.equal(w.bounty,0);
 assert.ok(w.notoriety>=30);
 assert.equal(w.events.length,0);
 w=missionWanted(w,{id:'treasure',outcome:'success'},27);
 assert.equal(w.bounty,250000);
 assert.equal(wantedLevel(w),'Avis de recherche local');
 const failure=missionWanted(w,{id:'marine',outcome:'failure'},28);
 assert.equal(failure.bounty,w.bounty);
 assert.ok(failure.heat>w.heat);
 assert.equal(failure.incidents,w.incidents);
});
test('se faire discret réduit la pression, mais pas le montant de la prime',()=>{
 const {engine,storage}=start();
 assert.ok(engine.applyPirate('alizes','combattant'));
 const old=engine.getState();
 const w=missionWanted(old.domainData.career.wanted,{id:'marine',outcome:'success'},16);
 const career={...old.domainData.career,wanted:w};
 assert.equal(hideAvailability(career,old.activeLife).enabled,true);
 const hidden=hideFromMarine(career,old.activeLife);
 assert.equal(hidden.wanted.bounty,w.bounty);
 assert.equal(hidden.wanted.heat,Math.max(0,w.heat-22));
 assert.equal(hidden.pirate.performance,Math.max(0,career.pirate.performance-2));
 assert.equal(hideFromMarine(hidden,old.activeLife),null);
 assert.equal(hidden.wanted.events.at(-1).type,'hide');
 assert.equal(engine.hidePirate(),false,'Aucune prime sur une vie non médiatisée');
 assert.deepEqual(createEngine({storage}).getState(),old);
});
test('le niveau de poursuite dépend de la notoriété et de la pression',()=>{
 const low={...emptyWanted(),bounty:100000,heat:20,notoriety:5};
 const high={...low,bounty:350000000,heat:95,notoriety:90};
 assert.ok(pursuitChance(high)>pursuitChance(low));
 assert.ok(pursuitChance(high)<=70);
 assert.equal(pursuitChance({...high,bounty:0}),0);
 assert.equal(pursuitChance({...high,heat:10}),0);
});
test('évasion : la Marine fait réagir les capacités du personnage',()=>{
 const {engine}=start(18);
 engine.applyPirate('alizes','combattant');
 const game=engine.getState();
 const career={...game.domainData.career,wanted:{...emptyWanted(),bounty:45000000,notoriety:65,heat:95}};
 const outcome=annualPursuit(career,game.domainData.abilities,
   game.domainData.relationships,{...game.activeLife,age:19},()=>0);
 assert.match(outcome.note,/échappe/);
 assert.equal(outcome.career.wanted.bounty,45000000);
 assert.equal(outcome.career.wanted.lastPursuitAge,19);
 assert.ok(outcome.career.wanted.heat<95);
 assert.ok(outcome.abilities.fatigue>game.domainData.abilities.fatigue);
 assert.equal(outcome.career.wanted.events.at(-1).type,'pursuit');
 assert.equal(outcome.career.missions.berys,career.missions.berys);
});
test('interception : confiscation, baisse de performance et blessure temporaires',()=>{
 const {engine}=start(18);
 engine.applyPirate('alizes','combattant');
 const game=engine.getState();
 const career={...game.domainData.career,
   missions:{...game.domainData.career.missions,berys:180000},
   wanted:{...emptyWanted(),bounty:45000000,notoriety:65,heat:95}};
 const seq=[0,0.99999];let cursor=0;
 const result=annualPursuit(career,game.domainData.abilities,
   game.domainData.relationships,{...game.activeLife,age:19},()=>seq[cursor++]);
 assert.match(result.note,/saisis/);
 assert.ok(result.career.missions.berys<180000);
 assert.ok(result.career.pirate.performance<career.pirate.performance);
 assert.equal(result.abilities.injury.level,1);
 assert.equal(result.abilities.injury.recoverAtAge,20);
 assert.equal(game.activeLife.alive,true,'Une interception ne doit pas inventer une mort');
});
test('aucune poursuite sans prime, ou si la chance annuelle échoue',()=>{
 const {engine}=start(18);
 engine.applyPirate('alizes','combattant');
 const game=engine.getState(),career=game.domainData.career;
 const no=annualPursuit(career,game.domainData.abilities,
   game.domainData.relationships,{...game.activeLife,age:19},()=>0);
 assert.equal(no.note,'');
 const flagged={...career,wanted:{...emptyWanted(),bounty:3000000,heat:50,notoriety:45}};
 const missed=annualPursuit(flagged,game.domainData.abilities,
   game.domainData.relationships,{...game.activeLife,age:19},()=>0.99999);
 assert.equal(missed.note,'');
 assert.equal(missed.career.wanted.heat,45);
});
test('migration 0.5.2 conservatrice : missions, Berrys, relations, talents',()=>{
 const {engine,map,storage}=start(20);
 engine.applyPirate('alizes','combattant');
 engine.mission('escort');
 const game=engine.getState();
 const {wanted,command,...oldCareer}=game.domainData.career;
 const original={...game,schemaVersion:12,
  domainData:{...game.domainData,career:oldCareer}};
 map.clear();map.set(V12_SAVE_KEY,JSON.stringify(original));
 const restored=createEngine({storage}).getState();
 assert.equal(restored.schemaVersion,18);
 assert.deepEqual(restored.history,original.history);
 assert.deepEqual(restored.domainData.story,original.domainData.story);
 assert.deepEqual(restored.domainData.relationships,original.domainData.relationships);
 assert.deepEqual(restored.domainData.abilities,original.domainData.abilities);
 assert.deepEqual(restored.domainData.career.missions,oldCareer.missions);
 assert.equal(restored.domainData.career.wanted.bounty,0);
 assert.deepEqual(migrateV12(original),restored);
 assert.equal(map.get(V12_SAVE_KEY),JSON.stringify(original));
 assert.ok(map.has(SAVE_KEY));
 assert.ok(isValidState(restored));
});
test('la vie progresse jusqu’à 120 ans sans saturation du journal de recherches',()=>{
 const {engine}=start();
 engine.applyPirate('alizes','combattant');
 for(let age=17;age<=120;age++){
  advance(engine,age);
  assert.equal(engine.getState().history.length,age+1);
  assert.ok(isValidState(engine.getState()),'incohérence à '+age);
 }
 assert.equal(engine.getState().activeLife.alive,false);
 assert.ok(engine.getState().domainData.career.wanted.events.length<=20);
});
test('états falsifiés et échecs de sauvegarde ne modifient jamais la vie',()=>{
 const {engine,storage,map}=start();
 engine.applyPirate('alizes','combattant');
 const before=engine.getState();
 const corrupted={...before,domainData:{...before.domainData,
  career:{...before.domainData.career,wanted:{...before.domainData.career.wanted,bounty:-1}}}};
 assert.equal(isValidState(corrupted),false);
 const invalid={...before,domainData:{...before.domainData,
  career:{...before.domainData.career,wanted:{...before.domainData.career.wanted,heat:101}}}};
 assert.equal(isValidState(invalid),false);
 const locked=createEngine({storage:{...storage,setItem:()=>{throw Error('quota');}},random:()=>0});
 assert.equal(locked.mission('escort'),false);
 assert.equal(locked.hidePirate(),false);
 assert.deepEqual(locked.getState(),before);
 map.set(SAVE_KEY,'{invalid');
 assert.equal(loadState(storage),null);
 assert.equal(MAX_BOUNTY,2000000000);
});
