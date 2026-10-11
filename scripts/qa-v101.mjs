import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const hub=fs.readFileSync('src/v95/action-hub-runtime-v95.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(inline,'Missing inline game source');
new Function(inline);
assert(/const GAME_VERSION\s*=\s*'10\.1\.0'/.test(html),'Expected V10.1 release');
assert(/const SAVE_VERSION\s*=\s*1000/.test(html),'Save version should stay compatible');
assert(sw.includes('one-piece-life-v10-1-0'),'V10.1 offline cache not invalidated');
assert(manifest.description.includes('V10.1'),'PWA manifest version missing');

const a=inline.indexOf('function v100Status(id)');
const b=inline.indexOf('function v100Act(id)',a);
const c=inline.indexOf('function v100AdvanceYear()',b);
const d=inline.indexOf('function v100RenderManualPanel()',c);
const e=inline.indexOf('function v91Module()',d);
assert(a>=0&&a<b&&b<c&&c<d&&d<e,'V10.1 manual functions missing');
const status=inline.slice(a,b),action=inline.slice(b,c),year=inline.slice(c,d),panel=inline.slice(d,e);
for(const key of ['game.pendingDecision','p.travel','v73PromotionReview(p)','game.activeMission','p.energy>=100','grade maximal'.toUpperCase()]) {
  if(key==='GRADE MAXIMAL'){assert(status.includes('Grade maximal'),'Max grade check missing');continue}
  assert(status.includes(key),'Shared eligibility lacks '+key);
}
assert(action.includes('st=v100Status(id)'),'Execution bypasses centralized status');
assert(action.includes("if(id==='navigation')")&&action.includes('p.energy=clamp(p.energy-st.cost,0,100)'),'Navigation did not pay displayed energy cost');
assert(panel.includes("const st=v100Status(x[0])"),'Manual UI bypasses centralized status');
assert(panel.includes("st.available?'':'disabled'"),'Manual buttons do not reflect availability');
assert(!panel.includes("p.career==='Aucune'"),'Manual UI duplicates backend prerequisites');
assert(hub.includes('bridge.manualStatus?.(id)'),'Hub bypasses centralized manual status');
assert(!hub.includes("if(id==='work'&&(p.career==='Aucune'||p.travel))"),'Hub still duplicates manual prerequisites');
const execute=hub.slice(hub.indexOf('  function execute(id){'),hub.indexOf('  function star(id){'));
assert(execute.indexOf('const ok=bridge.execute(id)')<execute.indexOf('engine.recordAction(state,id)'),'Hub incorrectly records failed action');
assert(year.includes('v61EventsSince(before)')&&year.includes('v80CompleteYear(yearEvents,report)'),'Annual world events missing digest');
for(const forbidden of ['careerTick(','trainProgress(','tickMission(','tickTravel(','v69AnnualEconomy('])assert(!year.includes(forbidden),'Time advance still grants passive progress: '+forbidden);

console.log('V10.1 MANUAL LIFE STABILITY QA OK');
