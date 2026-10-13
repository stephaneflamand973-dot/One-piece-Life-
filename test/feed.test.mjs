import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createEmptyState, beginLife, advanceOneYear, resolveDecision, isValidState
} from '../foundation/src/core/state.mjs';
import { sceneForAge } from '../foundation/src/core/events.mjs';
import { renderLife } from '../foundation/src/ui/life-view.mjs';

const person={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};

function ageTo(target) {
  let state = beginLife(createEmptyState(),person);
  while(state.activeLife.age < target){
    state = advanceOneYear(state);
    if(state.domainData.story.pending){
      const event=sceneForAge(state.activeLife.age);
      state=resolveDecision(state,event.options[0].id);
    }
  }
  assert.equal(isValidState(state),true);
  return state;
}
function displayedAges(html) {
  return [...html.matchAll(/data-history-age="(\d+)"/g)].map(match=>Number(match[1]));
}

test('le fil est inversé visuellement : année actuelle en tête, huit entrées seulement',()=>{
  const state=ageTo(20);
  const snapshot=JSON.stringify(state);
  const html=renderLife(state);
  assert.deepEqual(displayedAges(html),[20,19,18,17,16,15,14,13]);
  assert.ok(html.includes('class="story-event story-latest '));
  assert.ok(html.includes('data-show-older'));
  assert.match(html,/Voir les années précédentes/);
  assert.match(html,/\(13\)/);
  assert.equal(state.history.length,21);
  assert.equal(JSON.stringify(state),snapshot,'le rendu ne modifie pas les sauvegardes');
});
test('les anciens événements restent accessibles par lots, sans être supprimés',()=>{
  const state=ageTo(20);
  assert.deepEqual(displayedAges(renderLife(state,{historyLimit:4})),[20,19,18,17]);
  assert.deepEqual(displayedAges(renderLife(state,{historyLimit:12})),[
    20,19,18,17,16,15,14,13,12,11,10,9
  ]);
  const entire=renderLife(state,{historyLimit:1000});
  assert.equal(displayedAges(entire).length,21);
  assert.equal(displayedAges(entire).at(-1),0);
  assert.ok(entire.includes('Naissance'));
  assert.ok(!entire.includes('data-show-older'));
  assert.equal(state.history[0].age,0,'l’ordre de stockage reste chronologique');
  assert.equal(state.history.at(-1).age,20);
});
test('décision en attente immédiatement en haut et pas en double dans le journal',()=>{
  const fifth=ageTo(5);
  const pending=advanceOneYear(fifth);
  const html=renderLife(pending);
  assert.ok(html.includes('decision-panel'));
  assert.ok(html.indexOf('decision-panel') < html.indexOf('story-title'));
  assert.equal((html.match(/Près du port, un enfant a perdu son petit bateau en bois/g)??[]).length,1);
  assert.deepEqual(displayedAges(html),[5,4,3,2,1,0]);
  const resolved=resolveDecision(pending,'aider');
  const resolvedHtml=renderLife(resolved);
  assert.equal(displayedAges(resolvedHtml)[0],6);
  assert.ok(!resolvedHtml.includes('data-choice='));
  assert.ok(isValidState(resolved));
});
test('la nouvelle page conserve le bouton fixe et n’envoie plus le joueur en bas',()=>{
  const app=readFileSync('foundation/src/ui/app.mjs','utf8');
  const css=readFileSync('foundation/styles.css','utf8');
  const html=readFileSync('foundation/index.html','utf8');
  assert.ok(app.includes('window.scrollTo(0, 0)'));
  assert.ok(app.includes('visibleHistoryCount = HISTORY_PAGE_SIZE'));
  assert.ok(app.includes("button.hasAttribute('data-show-older')"));
  assert.ok(!app.includes('scrollIntoView('));
  assert.ok(!app.includes('.story-event:last-child'));
  assert.match(css,/\.bottom-nav\s*\{[^}]*position:fixed/);
  assert.ok(css.includes('.character-header{') && css.includes('position:sticky'));
  assert.ok(html.includes('factions-045'));
});
