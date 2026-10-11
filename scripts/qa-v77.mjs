import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/consequences-v77.js','utf8');
const engineSrc=fs.readFileSync('src/v77/consequence-engine-v77.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'consequences-v77.js'});
vm.runInContext(engineSrc,sandbox,{filename:'consequence-engine-v77.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('consequenceDataV77');
const engine=registry.get('consequenceEngineV77');

assert(data&&engine,'V7.7 modules not registered');
eq(data.version,'7.7.0','Consequence data version mismatch');
eq(engine.version,'7.7.0','Consequence engine version mismatch');
assert(Object.keys(data.consequenceTypes).length>=10,'Consequence catalog too small');
assert(Object.keys(data.triggerMap).length>=5,'Trigger map too small');

const state=engine.normalizeState({});
eq(state.active.length,0,'Fresh consequence state should be empty');
eq(state.totalCreated,0,'Fresh created counter mismatch');
eq(state.lastTickMonth,-99,'Fresh tick marker mismatch');

const ctx={nowMonth:120,region:'Grand Line',faction:'Pirates',reputation:65,worldDivergence:35,hasFruit:false};
const missionTrigger={domain:'mission',key:'failure',outcome:'failure',sourceId:'m1',sourceLabel:'Mission test',major:true,importance:80,risk:72};
const types=engine.triggerTypes(missionTrigger,ctx);
assert(types.includes('grudge')&&types.includes('scrutiny'),'Failed mission should expose persistent negative consequences');
gt(engine.triggerScore(missionTrigger,ctx),60,'Major failed mission should have a high trigger score');

const created=engine.create(missionTrigger,ctx,{gate:0,type:0,delay:.5,severity:.5});
assert(created,'Guaranteed consequence creation failed');
eq(created.status,'pending','Created consequence should be pending');
assert(created.dueMonth>ctx.nowMonth,'Consequence must be delayed');
assert(created.severity>=18&&created.severity<=92,'Consequence severity out of bounds');

const rejected=engine.create(missionTrigger,ctx,{gate:.999,type:0,delay:.5,severity:.5});
eq(rejected,null,'High gate roll should reject consequence creation');

const dueState=engine.normalizeState({active:[created,{...created,id:'later',dueMonth:999,severity:90}]});
const due=engine.due(dueState,created.dueMonth);
eq(due.length,1,'Due selector should not include future consequences');
eq(due[0].id,created.id,'Due consequence mismatch');

const grudge={...created,type:'grudge',severity:64,id:'g1'};
const strongCtx={stats:{Volonté:75,Réflexes:60,Endurance:70,Résistance:72},skills:{Combat:80,Sabre:25,Tir:15,Commandement:70,Discrétion:65,Navigation:50},power:82,reputation:70,relationStrength:60,authority:68,standing:72,observation:58,money:30000,health:90,worldKnowledge:60};
const weakCtx={stats:{Volonté:15,Réflexes:12,Endurance:20,Résistance:18},skills:{Combat:10,Sabre:5,Tir:3,Commandement:8,Discrétion:7,Navigation:9},power:18,reputation:5,relationStrength:10,authority:3,standing:10,observation:0,money:500,health:40,worldKnowledge:8};
const strongChoices=engine.choices(grudge,strongCtx);
const weakChoices=engine.choices(grudge,weakCtx);
const strongConfront=strongChoices.find(x=>x.id==='confront');
const weakConfront=weakChoices.find(x=>x.id==='confront');
gt(strongConfront.chance,weakConfront.chance,'Dynamic choice chance should reward relevant strength');
assert(strongConfront.chance<=.97&&weakConfront.chance>=.08,'Dynamic chance clamps failed');

const win=engine.resolve(grudge,'confront',strongCtx,0);
assert(win.success,'Zero roll should win a valid consequence choice');
assert(win.effects.repWorld>0,'Successful confrontation should produce effects');
const fail=engine.resolve(grudge,'ignore',weakCtx,.99);
assert(!fail.success,'High roll should fail low-probability ignore');
eq(fail.spawn,'scrutiny','Failed ignore should create an escalation chain');

const child=engine.spawnFrom(grudge,'scrutiny',{nowMonth:140,region:'Grand Line',faction:'Pirates'},.5);
assert(child,'Escalation child missing');
eq(child.chainDepth,grudge.chainDepth+1,'Chain depth did not increase');
eq(child.sourceDomain,'chain','Escalation source should be chain');

const deep={...grudge,chainDepth:3};
eq(engine.spawnFrom(deep,'scrutiny',{nowMonth:140},.5),null,'Consequence chain should stop after depth 3');

const loyalty={...created,type:'loyalty_call',severity:55,relationId:'r1'};
const loyaltyChoices=engine.choices(loyalty,{...strongCtx,relationStrength:80});
assert(loyaltyChoices.some(x=>x.id==='answer'),'Loyalty call choices missing');
const loyaltyWin=engine.resolve(loyalty,'answer',{...strongCtx,relationStrength:80},0);
assert(loyaltyWin.effects.relationTrust>0&&loyaltyWin.effects.relationLoyalty>0,'Loyalty success should affect relationship');

const auto={...created,type:'reputation_echo',severity:45};
const autoPreview=engine.preview(auto,strongCtx);
assert(!autoPreview.interactive,'Reputation echo should resolve automatically');
const autoResult=engine.resolve(auto,'auto',strongCtx,0);
assert(autoResult.success&&autoResult.effects.repWorld>0,'Positive auto consequence failed');

const summary=engine.activeSummary({active:[grudge,{...created,id:'h',severity:70,dueMonth:100},{...created,id:'f',severity:30,dueMonth:500}]},120);
eq(summary.active,3,'Active consequence count mismatch');
eq(summary.overdue,1,'Overdue consequence count mismatch');
eq(summary.high,2,'High-severity consequence count mismatch');

const zeroState=engine.normalizeState({totalCreated:0,totalResolved:0,totalEscalated:0,lastTickMonth:0});
eq(zeroState.lastTickMonth,0,'Explicit zero tick month must be preserved');

// Live integration contract.
const saveVersion=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
const gameVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
assert(/ONE PIECE LIFE — V(?:[7-9]|\d{2,})\./.test(html),'V7+ release title missing');
assert(saveVersion>=770,'V7.7 regression QA requires save version >= 770');
const [gameMajor,gameMinor]=gameVersion.split('.').map(Number);
assert(gameMajor>7||(gameMajor===7&&gameMinor>=7),'V7.7 regression QA requires game version >= 7.7');
for(const asset of ['src/data/consequences-v77.js','src/v77/consequence-engine-v77.js','src/v77/consequences-v77.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:7-[7-9]|8-[0-9]+|9-[0-9]+|10)-[0-9]+/.test(sw),'PWA cache must remain at V7.7 or newer');
assert(html.includes("consequencesV77:{version:1,active:[]"),'Fresh-save consequence state missing');
assert(html.includes("if(!game.consequencesV77||typeof game.consequencesV77!=='object')"),'Old-save V7.7 migration guard missing');
assert(html.includes('id="v77ConsequencesCard"'),'Consequence UI card missing');
for(const fn of ['function v77Ensure','function v77Create','function v77FromMission','function v77FromCombat','function v77FromWorldHook','function v77FromSocialArc','function v77Tick','function v77ResolveConsequence','function renderV77Consequences']){
  assert(html.includes(fn),'Missing live V7.7 bridge '+fn);
}
assert(html.includes("v77FromMission(m,'success',approach.id)"),'Mission success is not connected to V7.7');
assert(html.includes("if(!opts.mission)v77FromCombat"),'Combat consequences are not connected');
assert(html.includes("v77FromWorldHook(h,success?'success':'failure',approach)"),'World hooks are not connected');
assert(html.includes('v77FromSocialArc(r,result,choiceId)'), 'Social arcs are not connected');
assert(html.includes('if(!game.pendingDecision)v77Tick()')||(html.includes('function v80PriorityInterrupt')&&html.includes("c.kind==='consequence'")),'Annual consequence arbitration missing');
assert(html.includes("if(parts[0]==='v77consequence')v77ResolveConsequence(parts)"),'Consequence decisions are not connected');
assert(html.includes('renderV77Consequences();renderTimeline()'),'Consequence render hook missing');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V7.7 CONSEQUENCES & LIFE EVENTS QA OK',JSON.stringify({
  version:gameVersion,
  types:Object.keys(data.consequenceTypes).length,
  triggers:Object.keys(data.triggerMap).length,
  triggerScore:engine.triggerScore(missionTrigger,ctx),
  strongConfront:strongConfront.chance,
  weakConfront:weakConfront.chance,
  dueMonth:created.dueMonth,
  chainDepth:child.chainDepth,
  activeHigh:summary.high,
  migrationGuard:true
}));
