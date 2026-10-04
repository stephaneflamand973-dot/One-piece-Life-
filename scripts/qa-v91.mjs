import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('src/v91/goals-v91.css','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/goals-v91.js','utf8');
const engineSrc=fs.readFileSync('src/v91/goals-engine-v91.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'goals-v91.js'});
vm.runInContext(engineSrc,sandbox,{filename:'goals-engine-v91.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('goalsDataV91'),engine=registry.get('goalsEngineV91');
assert(data&&engine,'V9.1 goals modules not registered');
eq(data.version,'9.1.0','Goals data version mismatch');
eq(engine.version,'9.1.0','Goals engine version mismatch');
eq(Object.keys(data.ambitions).length,6,'Historical ambition count changed');
eq(Object.keys(data.intents).length,7,'Annual intent count mismatch');
assert(Object.keys(data.mediumTemplates).length>=11,'Medium objective pool too small');
assert(Object.keys(data.shortTemplates).length>=8,'Short objective pool too small');

const base={
  year:20,ageYears:20,ambitionType:'power',power:35,money:50000,visited:4,region:'Grand Line',
  worldRep:8,localRep:20,strongRelations:1,missionWins:2,wins:3,tradeProfit:0,tradeAvailable:true,
  crewSize:0,hasCrew:false,brokenEquipment:0,equippedCount:2,health:90,energy:80,
  career:'Marine',rank:'Caporal',rankIndex:2,rankCount:6,legacyScore:5
};

const lowPower=engine.longProgress('power',{...base,power:20});
const highPower=engine.longProgress('power',{...base,power:70});
gt(highPower,lowPower,'Power ambition should track real power');
const lowExplore=engine.longProgress('explore',{...base,visited:2,region:'East Blue'});
const highExplore=engine.longProgress('explore',{...base,visited:12,region:'New World'});
gt(highExplore,lowExplore,'Exploration ambition should track travel progress');
const lowWealth=engine.longProgress('wealth',{...base,money:1000,tradeProfit:0});
const highWealth=engine.longProgress('wealth',{...base,money:1500000,tradeProfit:500000});
gt(highWealth,lowWealth,'Wealth ambition should track actual assets');

let state=engine.refresh({},base);
eq(state.activeMedium.length,2,'Two medium goals should be active');
eq(state.activeShort.length,3,'Three short goals should be active');
assert(state.activeMedium.some(x=>x.templateId==='power_growth'),'Power ambition should prioritize power growth');
const rankGoal=state.activeMedium.find(x=>x.templateId==='career_rank');
assert(rankGoal,'Career rank goal should be generated in this context');
eq(rankGoal.start.rankIndex,2,'Rank goal baseline must preserve the current rank index');

const progressed={...base,power:46,rank:'Sergent',rankIndex:3,wins:8,missionWins:3};
const tick=engine.tick(state,progressed);
assert(tick.completed.some(x=>x.templateId==='power_growth'),'Power goal did not complete');
assert(tick.completed.some(x=>x.templateId==='career_rank'),'Rank goal did not complete from non-zero rank baseline');
eq(tick.state.activeMedium.length,2,'Medium goals should replenish after completion');
eq(tick.state.activeShort.length,3,'Short goals should replenish after completion');
assert(tick.state.completed.length>=2,'Completed objective history missing');

const mastery=engine.setIntent(tick.state,'mastery',21);
assert(!mastery.error,'Valid mastery intent rejected');
eq(mastery.patch.training,'hard','Mastery intent must affect the real training plan');
const recovery=engine.setIntent(mastery.state,'recovery',21);
eq(recovery.patch.training,'recover','Recovery intent training patch mismatch');
eq(recovery.patch.adventure,'cautious','Recovery intent adventure patch mismatch');
eq(recovery.patch.mission,'cautious','Recovery intent mission patch mismatch');

const changed=engine.setAmbition(recovery.state,'explore',{...progressed,ambitionType:'explore'});
assert(!changed.error,'Valid ambition change rejected');
eq(changed.state.ambitionType,'explore','Ambition change not persisted');
assert(changed.state.activeMedium.some(x=>['explore_islands','reach_region'].includes(x.templateId)),'Explore ambition should create exploration goals');

assert(html.includes('ONE PIECE LIFE — V9.1'),'V9.1 title missing');
assert(/const SAVE_VERSION\s*=\s*910;/.test(html),'Save version 910 missing');
assert(/const GAME_VERSION\s*=\s*'9\.1\.0';/.test(html),'Game version 9.1.0 missing');
for(const asset of ['src/data/goals-v91.js','src/v91/goals-engine-v91.js','src/v91/goals-v91.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(sw.includes('one-piece-life-v9-1-0'),'PWA cache not bumped to V9.1');
assert(html.includes('v90Ensure();v91Ensure()'),'Old-save V9.1 migration hook missing');
for(const fn of ['function v91Module','function v91Ensure','function v91Context','function v91Sync','function v91ApplyIntent','function v91OnAmbitionChange','function v91RecordMission','function renderV91Goals']){
  assert(html.includes(fn),'Missing live V9.1 bridge '+fn);
}
assert(html.includes('id="v91GoalsBadge"'),'V9.1 goals UI shell missing');
assert(html.includes("v91RecordMission('success')"),'Mission success counter hook missing');
assert(html.includes('game.player.danger=dangerLevel();v91Sync(true);'),'Monthly goal evaluation hook missing');
assert(html.includes('function renderAmbition(){renderV91Goals()}'),'Legacy ambition render handoff missing');
assert(html.includes('v91CockpitText()'),'V9.0 cockpit does not surface ambition progress');
assert(html.includes("$$('[data-v91-intent]').forEach"),'V9.1 intent binding must use querySelectorAll');
assert(html.includes("$$('[data-v91-ambition]').forEach"),'V9.1 ambition binding must use querySelectorAll');
assert(!/(?<!\$)\$\('\[data-v91-(?:intent|ambition)\]'\)\.forEach/.test(html),'V9.1 mono-element selector regression');
assert(css.includes('.v91-ambition'),'V9.1 ambition styling missing');
assert(css.includes('.v91-intents'),'V9.1 intention styling missing');

console.log('V9.1 GOALS & PLAYER AGENCY 5.1 QA OK',JSON.stringify({
  version:'9.1.0',
  ambitions:Object.keys(data.ambitions),
  intents:Object.keys(data.intents),
  initialMedium:state.activeMedium.map(x=>x.templateId),
  completed:tick.completed.map(x=>x.templateId),
  explorationGoals:changed.state.activeMedium.map(x=>x.templateId),
  powerProgress:{low:+lowPower.toFixed(1),high:+highPower.toFixed(1)}
}));
