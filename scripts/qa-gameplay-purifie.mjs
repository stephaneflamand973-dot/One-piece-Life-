import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8');
const hub=fs.readFileSync('src/v95/action-hub-runtime-v95.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert(html.includes('id="oplAgeBtn"')&&html.includes('id="oplAgeMain"'),'Persistent age action missing');
assert(html.includes('id="oplDetailsBtn"')&&html.includes('function v111ToggleDetails()'),'Optional detail toggle missing');
assert(html.includes('v111SyncUi();')&&html.includes("$('#oplAgeBtn').onclick="),'Age controls not bound');
assert(html.includes('game.meta.uiAdvanced=!game.meta.uiAdvanced'),'Advanced mode state must persist');
assert(html.includes('game.pendingDecision?showDecision():advance()'),'Pending choices must take priority over aging');
assert(html.includes('Renouvelle tes actions, sans progrès automatique'),'Age-up semantics unclear');
assert(html.includes('#gameScreen .advance-dock{display:none!important}'),'Duplicate age controls must be hidden');
assert(html.includes('#gameScreen:not(.opl-advanced) #annualTurnCard'),'Duplicated yearly actions are still on home');
assert(html.includes('#gameScreen:not(.opl-advanced) #v80DirectorCard'),'Life analysis must be progressively disclosed');
assert(html.includes('#gameScreen.active~.opl-age-global{display:flex}'),'Always-accessible age-up not visible while playing');
assert(html.includes('Événements récents'),'Timeline context not simplified');
for(const id of ['characterPanel','relationsPanel','worldPanel','abilitiesPanel']){
  const fragment=html.slice(html.indexOf('id="'+id+'"'),html.indexOf('id="'+id+'"')+300);
  assert(fragment.includes('data-opl-toggle-details'),'Missing advanced toggle for '+id);
}
assert(html.includes("#gameScreen:not(.opl-advanced) #characterPanel > section.paper-card:nth-of-type(n+6)"),'Profile still overloaded');
assert(html.includes("#gameScreen:not(.opl-advanced) #relationsPanel > section.paper-card:nth-of-type(n+5)"),'Relations still overloaded');
assert(html.includes("#gameScreen:not(.opl-advanced) #worldPanel > section.paper-card.world-deep"),'World encyclopedia still exposed');
assert(html.includes("if(['character','relations','world','abilities'].includes(tab)&&game)"),'Advanced activity destinations must be accessible');
assert(html.includes('class="opl-result-note"')||html.includes('.opl-result-note{'),'Action results are not styled');
assert(hub.includes('function actionFeedback()')&&hub.includes('actionFeedbackV111'),'Action outcome feedback missing');
assert(hub.includes('const before=actionSnapshot()')&&hub.includes('const after=actionSnapshot()'),'Action effects must be derived from game data');

assert(html.includes('data-tab="actions"><span>✦</span><small>Activités</small>'),'Navigation missing Activities');
assert(hub.includes("const selected=engine.select(all.filter(x=>x.id!=='advance')"),'Age-up still duplicated in activity catalog');
assert(hub.includes('selected.filter(x=>x.available).slice(0,7)'),'Main actions overload has not been removed');
assert(hub.includes("showAll?'Afficher seulement les actions disponibles'"),'Advanced catalog toggle missing');
assert(hub.includes('aria-expanded'),'Progressive disclosure is not accessible');
assert(hub.includes('function renderLife()')&&hub.includes('Toutes les actions'),'Life-to-activities journey is missing');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Invalid single-element query loop');
assert(sw.includes('one-piece-life-v11-0-1-gameplay-purifie2'),'Offline update not invalidated');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
new Function('window',hub);
console.log('ONE PIECE LIFE : GAMEPLAY PURIFIÉ STATIC QA OK');
