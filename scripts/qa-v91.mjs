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
assert(Object.keys(data.shortTemplates).length>=11,'Short objective pool too small');

const base={
  year:20,ageYears:20,ambitionType:'power',power:35,money:50000,visited:4,region:'Grand Line',
  worldRep:8,localRep:20,strongRelations:1,missionWins:2,wins:3,tradeProfit:0,tradeAvailable:true,
  crewSize:0,hasCrew:false,brokenEquipment:0,equippedCount:2,health:90,energy:80,
  career:'Marine',faction:'Marine',rank:'Caporal',rankIndex:2,rankCount:6,legacyScore:5
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
const earlyWealth=engine.longProgress('wealth',{...base,money:50000,tradeProfit:0});
lt(earlyWealth,15,'50k Berry should remain early in a fortune ambition');
const wealthState=engine.refresh({}, {...base,ambitionType:'wealth',money:50000});
const wealthGoal=wealthState.activeMedium.find(x=>x.templateId==='wealth_reserve');
assert(wealthGoal,'Wealth reserve goal should be generated for fortune ambition');
eq(wealthGoal.start.money,50000,'Wealth goal must preserve its starting money');
lt(engine.goalProgress(wealthGoal,{...base,money:50000}),1,'Fresh wealth goal should start near 0%');
gt(engine.goalProgress(wealthGoal,{...base,money:75000}),0,'Wealth goal should progress only after actual gains');
const shortByAmbition={};
for(const ambition of ['survive','power','explore','wealth','legacy','protect']){
  shortByAmbition[ambition]=engine.refresh({}, {...base,ambitionType:ambition}).activeShort.map(x=>x.templateId);
}
assert(shortByAmbition.power.includes('gain_power'),'Power ambition should prioritize a combat short goal');
assert(shortByAmbition.explore.includes('visit_one'),'Explore ambition should prioritize a travel short goal');
assert(shortByAmbition.wealth.includes('earn_money')&&shortByAmbition.wealth.includes('trade_step'),'Wealth ambition should prioritize money and trade short goals');
assert(shortByAmbition.protect.includes('one_bond'),'Protect ambition should prioritize a relationship short goal');
assert(shortByAmbition.legacy.includes('gain_fame'),'Legacy ambition should prioritize world fame');
assert(!shortByAmbition.explore.includes('gain_fame'),'Legacy-only fame goal leaked into exploration');
assert(!shortByAmbition.wealth.includes('survive_year'),'Survival-only year goal leaked into wealth');
assert(shortByAmbition.survive.includes('survive_year'),'Survive ambition should include the one-year survival step');
assert(shortByAmbition.survive.includes('earn_money'),'Survive ambition should prioritize a financial reserve');
eq(new Set(Object.values(shortByAmbition).map(x=>x.join('|'))).size,6,'Every ambition should expose a distinct short-goal profile');


let state=engine.refresh({},base);
eq(state.activeMedium.length,2,'Two medium goals should be active');
eq(state.activeShort.length,3,'Three short goals should be active');
assert(state.activeMedium.some(x=>x.templateId==='power_growth'),'Power ambition should prioritize power growth');
const surviveState=engine.refresh({}, {...base,ambitionType:'survive'});
assert(surviveState.activeMedium.some(x=>x.templateId==='endure_years'),'Survive ambition should include five-year endurance');
const legacyState=engine.refresh({}, {...base,ambitionType:'legacy'});
assert(legacyState.activeMedium[0]?.templateId==='world_reputation','Legacy ambition should prioritize world reputation');
const rankGoal=state.activeMedium.find(x=>x.templateId==='career_rank');
assert(rankGoal,'Career rank goal should be generated in this context');
eq(rankGoal.start.rankIndex,2,'Rank goal baseline must preserve the current rank index');
eq(rankGoal.start.faction,'Marine','Rank goal must remember its source faction');
const rebased=engine.refresh(state,{...base,faction:'Pirates',career:'Pirate',rank:'Mousse',rankIndex:0,rankCount:5});
const rebasedRank=rebased.activeMedium.find(x=>x.templateId==='career_rank');
assert(rebasedRank,'Career rank goal should be regenerated after faction change');
assert(rebasedRank.uid!==rankGoal.uid,'Stale career goal should be replaced after faction change');
eq(rebasedRank.start.faction,'Pirates','Regenerated rank goal must use the new faction');
eq(rebasedRank.start.rankIndex,0,'Regenerated rank goal must use the new rank baseline');
const noCareer=engine.refresh({}, {...base,career:'Aucune',rank:'Enfant',rankIndex:-1,rankCount:4});
assert(!noCareer.activeMedium.some(x=>x.templateId==='career_rank'||x.templateId==='mission_record'),'Career goals must not appear before a career exists');
const staleShort=engine.normalizeState({...state,activeShort:[{...state.activeShort[0],startedYear:15,progress:10}]});
const refreshedStale=engine.refresh(staleShort,{...base,year:20});
assert(!refreshedStale.activeShort.some(x=>x.uid===staleShort.activeShort[0].uid),'Stagnant short goals should rotate after four years');

const progressed={...base,power:46,rank:'Sergent',rankIndex:3,wins:8,missionWins:3};
const tick=engine.tick(state,progressed);
assert(tick.completed.some(x=>x.templateId==='power_growth'),'Power goal did not complete');
assert(tick.completed.some(x=>x.templateId==='career_rank'),'Rank goal did not complete from non-zero rank baseline');
eq(tick.state.activeMedium.length,2,'Medium goals should replenish after completion');
eq(tick.state.activeShort.length,3,'Short goals should replenish after completion');
assert(tick.state.completed.length>=2,'Completed objective history missing');

const mastery=engine.setIntent(tick.state,'mastery',21);
assert(!mastery.error,'Valid mastery intent rejected');
eq(mastery.patch.training,'mastery','Mastery intent must affect the real mastery training plan');
const recovery=engine.setIntent(mastery.state,'recovery',21);
eq(recovery.patch.training,'recover','Recovery intent training patch mismatch');
eq(recovery.patch.adventure,'cautious','Recovery intent adventure patch mismatch');
eq(recovery.patch.mission,'cautious','Recovery intent mission patch mismatch');
recovery.state.intentBasePlan={career:'steady',training:'steady',relations:'steady',adventure:'steady',resources:'steady',mission:'standard'};
const normalizedWithBase=engine.normalizeState(recovery.state);
eq(normalizedWithBase.intentBasePlan.training,'steady','Intent baseline must survive normalization');
normalizedWithBase.lastAmbitionChangeYear=21;
const normalizedCooldown=engine.normalizeState(normalizedWithBase);
eq(normalizedCooldown.lastAmbitionChangeYear,21,'Ambition cooldown year must survive normalization');

const changed=engine.setAmbition(recovery.state,'explore',{...progressed,ambitionType:'explore'});
assert(!changed.error,'Valid ambition change rejected');
eq(changed.state.ambitionType,'explore','Ambition change not persisted');
assert(changed.state.activeMedium.some(x=>['explore_islands','reach_region'].includes(x.templateId)),'Explore ambition should create exploration goals');

assert(/ONE PIECE LIFE — V9\.(?:1(?:\.\d+)?|[2-9](?:\.\d+)*)/.test(html),'V9.1+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=910,'Save version 910+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0',p=v.split('.').map(Number);assert(p[0]>9||(p[0]===9&&p[1]>=1),'Game version 9.1+ missing')}
for(const asset of ['src/data/goals-v91.js','src/v91/goals-engine-v91.js','src/v91/goals-v91.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v9-[1-9]-\d+/.test(sw),'PWA cache must remain on V9.1 or newer');
assert(html.includes('v90Ensure();v91Ensure()'),'Old-save V9.1 migration hook missing');
for(const fn of ['function v91Module','function v91Ensure','function v91Context','function v91Sync','function v91ApplyIntent','function v91OnAmbitionChange','function v91ChangeAmbition','function v91RecordMission','function renderV91Goals']){
  assert(html.includes(fn),'Missing live V9.1 bridge '+fn);
}
assert(html.includes('id="v91GoalsBadge"'),'V9.1 goals UI shell missing');
assert(html.includes("v91RecordMission('success')"),'Mission success counter hook missing');
assert(html.includes('visible-1'),'First post-migration mission must not be double-counted');
assert(html.includes('game.player.danger=dangerLevel();v91Sync(true);'),'Monthly goal evaluation hook missing');
assert(html.includes('function renderAmbition(){renderV91Goals()}'),'Legacy ambition render handoff missing');
assert(html.includes('v91CockpitText()'),'V9.0 cockpit does not surface ambition progress');
assert(html.includes('function v91CockpitGoal'),'V9.1 personal goal cockpit helper missing');
assert(html.includes("goal:'ambitionCard'"),'V9.1 cockpit goal navigation target missing');
assert(html.includes("urgent=items.some(x=>x.severity==='critical'||x.severity==='high')"),'V9.1 calm cockpit goal protection missing');
assert(!html.includes('v91Ensure();v91Ensure();'),'V9.1 ensure must not run twice in migration');
assert(!html.includes('showGame();v91Sync(true);'),'Passive render must not complete or log objectives');
assert(html.includes('function v91OnManualPlanChange'),'Manual annual plan handoff missing');
assert(html.includes('function v91OnPresetApplied'),'V9 preset handoff missing');
assert(html.includes('function v91CompleteAnnualIntent'),'Annual intent expiry hook missing');
assert(html.includes('v91CompleteAnnualIntent();game.agency.annualTurn=null'),'Annual intent must expire when the yearly turn closes');
assert(html.includes('intentBasePlan'),'Annual intent baseline preservation missing');
assert(html.includes("$$('[data-v91-intent]').forEach"),'V9.1 intent binding must use querySelectorAll');
assert(html.includes("$('[data-v91-ambition]').forEach"),'V9.1 ambition binding must use querySelectorAll');
assert(html.includes('lastAmbitionChangeYear'),'V9.1 ambition cooldown persistence missing');
assert(html.includes('state.lastAmbitionChangeYear=year;'),'Initial ambition choice must start the yearly cooldown');
assert(html.includes('faction:p.faction'),'V9.1 goal context must expose faction changes');
assert(html.includes('v89Ensure();v90Ensure();v91Ensure()'),'V9.1 must participate in ensureV6 runtime chain');
assert(html.includes('Tu as déjà redéfini ton ambition cette année.'),'V9.1 yearly reorientation cooldown missing');
assert(html.includes('Termine l’année en cours avant de redéfinir ton ambition.'),'V9.1 active-year ambition lock missing');
assert(!/(?<!\$)\$\('\[data-v91-(?:intent|ambition)\]'\)\.forEach/.test(html),'V9.1 mono-element selector regression');
assert(css.includes('.v91-ambition'),'V9.1 ambition styling missing');
assert(css.includes('.v91-intents'),'V9.1 intention styling missing');

console.log('V9.1 GOALS & PLAYER AGENCY 5.1 QA OK',JSON.stringify({
  version:'9.1.x',
  ambitions:Object.keys(data.ambitions),
  intents:Object.keys(data.intents),
  initialMedium:state.activeMedium.map(x=>x.templateId),
  completed:tick.completed.map(x=>x.templateId),
  explorationGoals:changed.state.activeMedium.map(x=>x.templateId),
  rebasedRank:{from:rankGoal.start.faction,to:rebasedRank.start.faction},
  powerProgress:{low:+lowPower.toFixed(1),high:+highPower.toFixed(1)},
  shortProfiles:shortByAmbition,
  survivalMedium:surviveState.activeMedium.map(x=>x.templateId),
  legacyMedium:legacyState.activeMedium.map(x=>x.templateId)
}));
