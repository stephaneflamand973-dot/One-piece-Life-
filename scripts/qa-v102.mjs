import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const paths=['src/core/module-registry.js','src/data/action-v102.js','src/v102/action-engine-v102.js'];
const ctx={console,Math,JSON,Object,Array,String,Number,Set,Map};ctx.window=ctx;vm.createContext(ctx);
for(const p of paths)vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
const mod=ctx.OPL_MODULES.get('actionEngineV102'),data=ctx.OPL_MODULES.get('actionDataV102');
assert(mod?.version==='10.2.0'&&data?.version==='10.2.0','V10.2 modules missing');
assert(Object.keys(data.actions).length===6,'Unknown action registry size');
const allowed={alive:true,pending:false,energy:100,career:true,land:true,mission:true,promotion:true,recovery:true,travel:true};
let s=mod.normalize({},19);
assert(s.version===2&&s.year===19&&s.spent.work===0,'New action state missing');
assert(mod.status(s,'work',19,allowed).remaining===4,'Work limit incorrect');
let incomes=[],first=mod.status(s,'work',19,allowed);
assert(first.efficiency===1,'First action should have full efficiency');
for(let i=0;i<4;i++){
  const before=mod.status(s,'work',19,allowed);
  incomes.push(before.efficiency);
  let n=0;
  const r=mod.perform(s,'work',19,allowed,st=>{n++;assert(st.efficiency===before.efficiency,'Effect efficiency desynced');return{detail:'test '+i}});
  assert(n===1&&r.changed,'Work effect not invoked precisely once');
  s=r.state;
}
assert(JSON.stringify(incomes)===JSON.stringify([1,.78,.58,.42]),'Work yields must diminish predictably');
assert(mod.status(s,'work',19,allowed).remaining===0,'Work limit not enforced');
let callbacks=0;const blocked=mod.perform(s,'work',19,allowed,()=>{callbacks++;return true});
assert(!blocked.changed&&callbacks===0&&blocked.state.total===4,'Blocked effect consumed a quota');
assert(!mod.status(s,'training',19,{...allowed,land:false}).available,'Training during travel allowed');
assert(!mod.status(s,'work',19,{...allowed,career:false}).available,'Work without career allowed');
assert(!mod.status(s,'promotion',19,{...allowed,promotion:false,promotionReason:'Revue impossible.'}).available,'Promotion gate ignored');
assert(!mod.status(s,'rest',19,{...allowed,recovery:false}).available,'Unnecessary rest allowed');
assert(!mod.status(s,'mission',19,{...allowed,mission:false}).available,'Mission gate ignored');
assert(!mod.status(s,'navigation',19,{...allowed,travel:false}).available,'Navigation gate ignored');
assert(!mod.status(s,'navigation',19,{...allowed,energy:7}).available,'Energy cost bypassed');
assert(!mod.status(s,'rest',19,{...allowed,pending:true}).available,'Pending decision bypassed');
assert(!mod.status(s,'rest',19,{...allowed,alive:false}).available,'Dead character can act');
assert(!mod.status(s,'unknown',19,allowed).available,'Unknown action permitted');
const beforeFailure=JSON.stringify(s);
try{mod.perform(s,'training',19,allowed,()=>{throw new Error('Simulated failure')});assert(false,'Engine did not propagate technical error')}catch(e){assert(e.message==='Simulated failure','Unexpected engine error')}
assert(JSON.stringify(s)===beforeFailure,'Technical failure mutated action state');
const declined=mod.perform(s,'training',19,allowed,()=>false);
assert(!declined.changed&&JSON.stringify(declined.state)===beforeFailure,'Declined action spent quota');
let training=s;
for(let i=0;i<5;i++){const outcome=mod.perform(training,'training',19,allowed,()=>({detail:'Training'}));assert(outcome.changed,'Training cap too low');training=outcome.state}
assert(!mod.status(training,'training',19,allowed).available,'Training cap was bypassed');
const renewed=mod.nextYear(training,20);
assert(renewed.year===20&&renewed.spent.work===0&&renewed.spent.training===0,'Year transition did not restore actions');
assert(renewed.total===9&&renewed.history.length===9,'Lifetime action ledger lost across years');
const imported=mod.migrate({year:19,spent:{work:1,training:2,rest:1},total:11,lastAction:'rest'},19);
assert(imported.spent.work===1&&imported.spent.training===2&&imported.total===11,'V10.0 save migration lost annual quotas');
const aged=mod.migrate({year:19,spent:{work:1},total:11},20);
assert(aged.spent.work===0&&aged.total===11,'Migration retained previous-year quotas');
const malformed=mod.normalize({year:20,spent:{work:999,training:-9,attack:20},total:-77,trainingFocus:'hack',history:Array(100).fill({id:'work',year:20,efficiency:9,detail:'x'.repeat(300)})},20);
assert(malformed.spent.work===4&&malformed.spent.training===0&&malformed.spent.attack===undefined,'Corrupted action quotas not normalized');
assert(malformed.trainingFocus==='physical'&&malformed.history.length===24&&malformed.history.every(x=>x.efficiency<=1&&x.detail.length<=110),'Invalid focus or unbounded ledger accepted');

const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(html.includes('<title>ONE PIECE LIFE — V10.2</title>')&&html.includes("const GAME_VERSION = '10.2.0'"),'V10.2 version missing');
assert(html.includes('src/data/action-v102.js')&&html.includes('src/v102/action-engine-v102.js'),'V10.2 modules not loaded');
assert(sw.includes('one-piece-life-v10-2-0')&&sw.includes('src/data/action-v102.js')&&sw.includes('src/v102/action-engine-v102.js'),'V10.2 offline assets missing');
assert(manifest.description.includes('V10.2'),'PWA metadata outdated');
assert(html.includes('function v102SetTrainingFocus(id)'), 'Training focus selector missing');
assert(html.includes('game.meta.manualLifeV102=mod.nextYear(state'), 'V10.2 annual state reset missing');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
console.log('V10.2 ACTION ENGINE QA OK',JSON.stringify({limits:Object.fromEntries(Object.entries(data.actions).map(([k,v])=>[k,v.limit])),workYields:incomes,migration:imported.total,yearRestored:renewed.year}));
