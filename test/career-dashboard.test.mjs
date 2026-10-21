import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {SCHEMA_VERSION,isValidState} from '../foundation/src/core/state.mjs';
import {renderCareerDashboard,CAREER_PAGES} from '../foundation/src/ui/career-layout.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
import {SAVE_KEY} from '../foundation/src/core/storage.mjs';
const who={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const answers={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
function make(random=()=>0){
 const map=new Map();
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const e=createEngine({storage,random});assert.ok(e.startLife(who));return {e,map,storage};
}
function adult(e){
 while(e.getState().activeLife.age<16){
  assert.ok(e.age());
  const s=e.getState();
  if(s.domainData.story.pending)assert.ok(e.choose(answers[s.domainData.story.pending.eventId]));
  if(e.getState().domainData.relationships.pending)assert.ok(e.answerNpc('accept'));
 }
}
function pirate(){
 const a=make();adult(a.e);assert.ok(a.e.applyPirate('alizes','combattant'));return a;
}
function captain(){
 const a=pirate();assert.ok(a.e.mission('escort'));assert.ok(a.e.mission('explore'));
 assert.ok(a.e.foundCrew());return a;
}
test('six destinations Carrière, schéma et sérialisation préservés',()=>{
 assert.deepEqual(Object.keys(CAREER_PAGES),['parcours','equipage','aventures','navire','finances','influence']);
 assert.equal(SCHEMA_VERSION,18);
 const a=make(),s=a.e.getState(),before=JSON.stringify(s);
 assert.match(renderCareerDashboard(s),/Tracer votre route/);
 assert.match(renderCareerDashboard(s,{page:'parcours'}),/data-career-apply/);
 assert.equal(JSON.stringify(s),before);
});
test('membre pirate : progression, missions, influence et compagnons réels',()=>{
 const {e}=pirate(),s=e.getState(),before=JSON.stringify(s);
 const board=renderCareerDashboard(s);
 assert.match(board,/career-dashboard/);
 assert.equal((board.match(/data-career-page="/g)||[]).length>=6,true);
 assert.match(board,/performance professionnelle/i);
 assert.doesNotMatch(board,/data-crew-order=/);
 const parcours=renderCareerDashboard(s,{page:'parcours'});
 assert.match(parcours,/data-work-pirate/);
 assert.match(parcours,/data-ask-promotion/);
 assert.match(parcours,/data-found-crew/);
 const aventures=renderCareerDashboard(s,{page:'aventures'});
 assert.match(aventures,/data-pirate-mission="escort"/);
 assert.doesNotMatch(aventures,/data-voyage=/);
 const exploration=renderCareerDashboard(s,{page:'aventures',adventureTab:'exploration'});
 assert.match(exploration,/Diriger des traversées nécessite votre propre navire/);
 const influence=renderCareerDashboard(s,{page:'influence'});
 assert.match(influence,/data-hide-pirate/);
 const equipage=renderCareerDashboard(s,{page:'equipage'});
 assert.match(equipage,/data-nav="relationships"/);
 assert.doesNotMatch(equipage,/data-crew-recruit/);
 assert.equal(JSON.stringify(s),before);
 assert.ok(isValidState(s));
});
test('capitaine : six espaces exclusivement dédiés, sans duplication des missions',()=>{
 const {e,storage}=captain(),s=e.getState(),snapshot=JSON.stringify(s);
 const board=renderCareerDashboard(s);
 assert.match(board,/Capitaine/);assert.match(board,/career-dash-quick/);
 assert.doesNotMatch(board,/data-pirate-mission=/);
 assert.doesNotMatch(board,/data-ship-action=/);
 const parcours=renderCareerDashboard(s,{page:'parcours'});
 assert.match(parcours,/data-work-pirate/);
 assert.doesNotMatch(parcours,/data-pirate-mission=/);
 const equipage=renderCareerDashboard(s,{page:'equipage'});
 assert.match(equipage,/captain-panel/);
 assert.match(equipage,/data-crew-recruit/);
 assert.match(equipage,/data-crew-order="share"/);
 const navire=renderCareerDashboard(s,{page:'navire'});
 assert.match(navire,/data-ship-action="upgrade"/);
 assert.match(navire,/data-crew-order="repair"/);
 assert.doesNotMatch(navire,/data-crew-recruit/);
 const explor=renderCareerDashboard(s,{page:'aventures',adventureTab:'exploration'});
 assert.match(explor,/data-voyage="shells"/);
 assert.match(explor,/data-explore-island/);
 assert.doesNotMatch(explor,/data-pirate-mission=/);
 const missions=renderCareerDashboard(s,{page:'aventures',adventureTab:'missions'});
 assert.match(missions,/data-pirate-mission="escort"/);
 assert.doesNotMatch(missions,/data-voyage=/);
 const money=renderCareerDashboard(s,{page:'finances'});
 assert.match(money,/data-crew-order="share"/);
 assert.match(money,/Trésorerie/i);
 const influence=renderCareerDashboard(s,{page:'influence'});
 assert.match(influence,/data-hide-pirate/);
 assert.equal(JSON.stringify(s),snapshot,'aucune mutation pendant le rendu');
 assert.deepEqual(createEngine({storage}).getState(),s);
 assert.ok(isValidState(s));
 assert.match(renderCareer(s),/captain-panel/,'moteur HTML historique préservé');
});
test('rencontre navale : un seul dialogue persistant et tous les choix du moteur',()=>{
 const {storage}=captain();
 const draws=[0,0,.99];
 const voyage=createEngine({storage,random:()=>draws.shift()??0});
 assert.ok(voyage.sail('shells'));
 const e=createEngine({storage,random:()=>0});
 const s=e.getState(),before=JSON.stringify(s);
 assert.ok(s.domainData.career.command.encounters.pending);
 const board=renderCareerDashboard(s);
 assert.match(board,/role="dialog" aria-modal="true"/);
 assert.equal((board.match(/data-encounter-choice="/g)||[]).length,4);
 assert.match(board,/Rencontre en mer/);
 assert.match(renderCareerDashboard(s,{page:'aventures'}),/career-decision-overlay/);
 assert.equal(JSON.stringify(s),before);
 assert.deepEqual(createEngine({storage}).getState(),s);
 assert.equal(e.age(),false,'aucun passage d’année pendant un dialogue');
 assert.ok(e.encounter('flee'));
 assert.doesNotMatch(renderCareerDashboard(e.getState()),/career-decision-overlay/);
 assert.ok(isValidState(e.getState()));
});
