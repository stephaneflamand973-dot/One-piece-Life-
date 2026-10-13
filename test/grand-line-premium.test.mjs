import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {renderLife} from '../foundation/src/ui/life-view.mjs';
import {renderCareer} from '../foundation/src/ui/career-view.mjs';
import {renderRelationships} from '../foundation/src/ui/relations-view.mjs';
import {renderActivities} from '../foundation/src/ui/activities-view.mjs';
import {SCHEMA_VERSION,isValidState} from '../foundation/src/core/state.mjs';
const css=readFileSync('foundation/grand-line-premium.css','utf8');
const index=readFileSync('foundation/index.html','utf8');
const src=readFileSync('foundation/src/ui/app.mjs','utf8');
const oldEngine=readFileSync('foundation/src/core/state.mjs','utf8');
const originalSchema=18;
const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const choices={quai:'aider',cartes:'etudier',tempete:'aider',horizon:'apprendre',
 voyageur:'guider',passage:'oser',transmission:'enseigner',souvenirs:'raconter'};
const make=()=>{
 const map=new Map();const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const e=createEngine({storage,random:()=>0});
 assert.ok(e.startLife(hero));return e;
};
function ageTo(e,age){
 while(e.getState().activeLife.age<age){
  assert.ok(e.age());
  const state=e.getState();
  if(state.domainData.story.pending)
   assert.ok(e.choose(choices[state.domainData.story.pending.eventId]));
  if(e.getState().domainData.relationships.pending)assert.ok(e.answerNpc('accept'));
 }
}
test('thème premium distinct du moteur et chargé après la feuille historique',()=>{
 assert.equal(SCHEMA_VERSION,originalSchema);
 assert.match(index,/styles\.css\?v=grand-line-premium-1/);
 assert.match(index,/grand-line-premium\.css\?v=grand-line-premium-1/);
 assert.ok(index.indexOf('styles.css')<index.indexOf('grand-line-premium.css'));
 assert.match(index,/theme-color" content="#112b42"/);
 assert.match(css,/\.character-header\s*\{/);
 assert.match(css,/\.hero-stats\s*\{/);
 assert.match(css,/\.bottom-nav\s*\{/);
 assert.match(css,/\.sea-chart\s*\{/);
 assert.match(css,/\.relation-avatar\s*\{/);
 assert.match(src,/GRAND LINE PREMIUM/);
 assert.doesNotMatch(css,/@import|https?:\/\//);
 assert.match(oldEngine,/export const SCHEMA_VERSION = 18/);
});
test('fiche du personnage : quatre jauges réelles, aucun état fictif',()=>{
 const e=make(),state=e.getState();
 const serialized=JSON.stringify(state);
 const html=renderLife(state);
 assert.match(html,/class="hero-stats"/);
 assert.equal((html.match(/class="hero-meter hero-meter-/g)||[]).length,4);
 assert.match(html,/aria-label="Énergie"/);
 assert.match(html,/aria-valuenow="100"/);
 assert.match(html,/aria-label="Navigation"/);
 assert.match(html,/class="story-list"/);
 assert.match(html,/Lina Marin/);
 assert.doesNotMatch(html,/Bonheur|Santé fictive/);
 assert.equal(JSON.stringify(state),serialized);
 assert.ok(isValidState(state));
});
test('mise en scène maritime : trésor réel, navigation, bateau et relations intacts',()=>{
 const e=make();ageTo(e,16);
 assert.ok(e.applyPirate('alizes','combattant'));
 assert.ok(e.mission('escort'));assert.ok(e.mission('explore'));
 assert.ok(e.foundCrew());
 const state=e.getState(),before=JSON.stringify(state),money=state.domainData.career.missions.berys;
 const career=renderCareer(state),rel=renderRelationships(state),activities=renderActivities(state);
 assert.match(career,/career-hero-finances/);
 assert.match(career,/sea-chart/);
 assert.match(career,/ship-blueprint/);
 assert.match(career,new RegExp(money.toLocaleString('fr-FR').replace(/[\s\u00a0\u202f]/g,'[\\s\\u00a0\\u202f]*')));
 assert.match(rel,/relation-avatar/);
 assert.match(activities,/training-skill/);
 assert.equal(JSON.stringify(state),before);
 assert.ok(isValidState(state));
});
