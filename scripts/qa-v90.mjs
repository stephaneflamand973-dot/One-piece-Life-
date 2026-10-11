import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('src/v90/game-flow-v90.css','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/game-flow-v90.js','utf8');
const engineSrc=fs.readFileSync('src/v90/game-flow-engine-v90.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'game-flow-v90.js'});
vm.runInContext(engineSrc,sandbox,{filename:'game-flow-engine-v90.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('gameFlowDataV90'),engine=registry.get('gameFlowEngineV90');
assert(data&&engine,'V9.0 game flow modules not registered');
eq(data.version,'9.0.0','Game flow data version mismatch');
eq(engine.version,'9.0.0','Game flow engine version mismatch');
eq(Object.keys(data.presets).length,6,'Annual preset count mismatch');

const critical=engine.priorities({
  alive:true,pendingDecision:true,pendingDecisionTitle:'Choix critique',
  health:34,energy:28,activeMission:true,activeMissionTitle:'Interception',
  annualActive:true,annualProgress:5,brokenEquipment:1,consequenceSeverity:70
});
eq(critical[0].key,'decision','Pending decision must remain top priority');
assert(critical.some(x=>x.key==='mission'),'Mission priority missing');
assert(critical.some(x=>x.key==='health'),'Health priority missing');

const healthyScore=engine.flowScore({alive:true,health:95,energy:90,pendingDecision:false,brokenEquipment:0,consequenceSeverity:0});
const stressedScore=engine.flowScore({alive:true,health:28,energy:20,pendingDecision:true,brokenEquipment:2,consequenceSeverity:80});
gt(healthyScore,stressedScore,'Flow score should react to stress');

eq(engine.recommendedPreset({health:35,energy:30,money:50000}),'recovery','Low health/energy should recommend recovery');
eq(engine.recommendedPreset({health:90,energy:90,money:1000}),'wealth','Low money should recommend wealth');
eq(engine.recommendedPreset({health:90,energy:90,money:50000,travel:true}),'adventure','Travel should recommend adventure');
eq(engine.recommendedPreset({health:90,energy:90,money:50000,activeMission:true}),'career','Mission should recommend career');

const balanced=engine.presetPlan('balanced');
eq(balanced.career,'steady','Balanced career preset mismatch');
eq(balanced.training,'steady','Balanced training preset mismatch');
const recovery=engine.presetPlan('recovery');
eq(recovery.training,'recover','Recovery preset should reduce training');
eq(recovery.mission,'cautious','Recovery preset should use cautious missions');

const recognized=engine.planSummary(engine.presetPlan('adventure'));
eq(recognized.preset,'adventure','Preset recognition failed');
const custom=engine.planSummary({...engine.presetPlan('balanced'),training:'mastery'});
assert(custom.custom,'Custom plan should be detected');

const digest=engine.digest({
  year:21,classification:'Année charnière',powerDelta:4.2,moneyDelta:-12000,healthDelta:-8,xpDelta:9,
  rankBefore:'Recrue',rankAfter:'Lieutenant',interruptions:2,riskSpent:34,riskBudget:80,adventureDiscoveries:2,
  highlights:[{title:'Promotion validée',desc:'Tu passes Lieutenant.',type:'major'}]
},[]);
assert(digest.metrics.length<=4,'Digest must stay compact');
assert(digest.metrics.some(x=>x.label==='Promotion'),'Promotion should appear in digest');
eq(digest.interruptions,2,'Digest interruption count mismatch');
eq(digest.adventureDiscoveries,2,'Digest discoveries mismatch');

assert(/ONE PIECE LIFE — V(?:9\.\d+|10\.\d+)(?:\.\d+)?/.test(html),'V9+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=900,'Save version 900+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'',p=v.split('.').map(Number);assert(p[0]>9||(p[0]===9&&p[1]>=0),'Game version 9.0+ missing')}
for(const asset of ['src/data/game-flow-v90.js','src/v90/game-flow-engine-v90.js','src/v90/game-flow-v90.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:9-\d+|10)-\d+-\d+/.test(sw),'PWA cache must remain on V9.x');
assert(html.includes('v89Ensure();v90Ensure()'),'Old-save V9.0 migration hook missing');
for(const fn of ['function v90Module','function v90Ensure','function v90Context','function v90ApplyPreset','function v90ChoiceMeta','function renderV90Flow','function renderV90Presets','function renderV90Digest','function renderV90GameFlow']){
  assert(html.includes(fn),'Missing live V9.0 bridge '+fn);
}
assert(html.includes('id="v90FlowCard"'),'V9.0 cockpit UI missing');
assert(html.includes('id="v90PresetShell"'),'V9.0 annual preset UI missing');
assert(html.includes('id="v90AnnualDigest"'),'V9.0 annual digest UI missing');
assert(html.includes('v90MarkCustomPlan();'),'Manual annual changes do not mark custom plan');
assert(html.includes('renderV90GameFlow();'),'V9.0 render hook missing');
assert(html.includes('v90ChoiceMeta(c)'),'Decision metadata integration missing');
assert(html.includes("v89MaybeLoot('combat',Number(enemy.power)||0"),'Combat loot must use the active enemy power');
assert(!html.includes("v89MaybeLoot('combat',enemyPower"),'Undefined enemyPower combat crash regression');
assert(html.includes("$$('[data-v90-preset]').forEach"),'V9.0 preset bindings missing');
assert(css.includes('.v90-compact-life #v76FocusCard{display:none}'),'Legacy focus card is not compacted in V9.0');
assert(css.includes('.v90-choice-tag'),'Decision choice tag styling missing');

console.log('V9.0 GAME FLOW & UX 5.0 QA OK',JSON.stringify({
  version:'9.0.x',
  presets:Object.keys(data.presets),
  critical:critical.map(x=>x.key),
  healthyScore,stressedScore,
  recommended:{
    recovery:engine.recommendedPreset({health:35,energy:30,money:50000}),
    wealth:engine.recommendedPreset({health:90,energy:90,money:1000}),
    adventure:engine.recommendedPreset({health:90,energy:90,money:50000,travel:true})
  },
  digestMetrics:digest.metrics.map(x=>x.label)
}));
