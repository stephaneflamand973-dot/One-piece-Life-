import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('src/v92/npc-lives-v92.css','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/npc-lives-v92.js','utf8');
const engineSrc=fs.readFileSync('src/v92/npc-lives-engine-v92.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'npc-lives-v92.js'});
vm.runInContext(engineSrc,sandbox,{filename:'npc-lives-engine-v92.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('npcLivesDataV92'),engine=registry.get('npcLivesEngineV92');
assert(data&&engine,'V9.2 NPC life modules not registered');
eq(data.version,'9.2.0','NPC life data version mismatch');
eq(engine.version,'9.2.0','NPC life engine version mismatch');
eq(data.careerTiers.length,6,'NPC career tier count mismatch');
assert(Object.keys(data.objectives).length>=18,'NPC objective pool too small');

let actor={id:'qa_actor',v92Id:'qa_actor',sourceType:'world',name:'Mira Venn',faction:'Pirates',importance:70,power:52,experience:28,health:100,injuryMonths:0,currentRegion:'Grand Line',region:'Grand Line',goal:'Renforcer sa puissance',status:'alive'};
let state=engine.normalizeState({});
let first=engine.tickActor(state,actor,{month:240,months:12},{drift:.65,objective:.35});
state=first.state;
assert(state.actors.qa_actor,'Tracked actor missing');
gt(first.life.objectiveProgress,0,'Passive objective progression missing');
gt(first.life.careerProgress,0,'Passive career progression missing');
assert(first.life.influence>=0&&first.life.influence<=100,'Influence out of bounds');
assert(first.life.wealth>=0&&first.life.wealth<=100,'Wealth out of bounds');
assert(first.life.energy>=0&&first.life.energy<=100,'Energy out of bounds');
assert(first.life.stress>=0&&first.life.stress<=100,'Stress out of bounds');

actor={...actor,currentRegion:'New World',power:60,experience:44,goal:'Accroître sa réputation'};
const moved=engine.tickActor(state,actor,{month:252,months:12},{drift:.7,objective:.55});
state=moved.state;
eq(moved.life.moves,1,'NPC move should be remembered');
gt(moved.life.renown,first.life.renown,'Power/career progress should improve renown');
assert(moved.life.history.some(x=>x.type==='move'),'Move history missing');
assert(moved.life.history.some(x=>x.type==='goal_change'),'Goal change history missing');

const beforeWin=moved.life.wins;
const victory=engine.recordAction(state,actor,'clash_win',{label:'Victoire QA',nextObjectiveRoll:.2},{month:253});
state=victory.state;
eq(victory.life.wins,beforeWin+1,'World clash win not recorded');
gt(victory.life.momentum,moved.life.momentum,'Victory should increase momentum');

let promote=engine.normalizeActor(victory.life,actor);
promote.careerTier=1;promote.careerProgress=98;
state.actors.qa_actor=promote;
const promoted=engine.recordAction(state,actor,'career_step',{label:'Responsabilité accrue',nextObjectiveRoll:.3},{month:254});
state=promoted.state;
eq(promoted.life.careerTier,2,'Career promotion should advance one tier');
assert(promoted.events.some(x=>x.type==='career'),'Career milestone missing');

let stressed=engine.normalizeActor(promoted.life,actor);
stressed.stress=84;stressed.energy=22;
state.actors.qa_actor=stressed;
const recovering=engine.tickActor(state,{...actor,health:42,injuryMonths:2},{month:255,months:1},{drift:.5,objective:.5});
eq(recovering.life.phase,'recovering','Injured/stressed actor should enter recovery');
eq(recovering.life.objectiveId,'recover','Recovery objective should be selected when fragile');

const support=engine.supportScore({...promoted.life,influence:75,renown:72,careerTier:3,stress:25});
gt(support,0,'Influential ally support should be positive');
assert(support<=4,'NPC support bonus must remain bounded');

let bounded=engine.normalizeState({});
for(let i=0;i<70;i++){
  const a={id:'a'+i,v92Id:'a'+i,name:'Actor '+i,faction:'Civil',importance:45,power:35,experience:10,health:100,currentRegion:'East Blue',region:'East Blue',goal:'Explorer',status:'alive',sourceType:'world'};
  bounded=engine.tickActor(bounded,a,{month:300+i,months:1},{drift:.5,objective:.5}).state;
}
assert(Object.keys(bounded.actors).length===70,'Engine should preserve distinct actor profiles before bridge pruning');
assert(bounded.globalHistory.length<=50,'Global NPC life history must remain bounded');
for(const life of Object.values(bounded.actors)){
  assert(life.history.length<=8,'Individual NPC history exceeded bound');
  assert(life.milestones.length<=10,'Individual NPC milestones exceeded bound');
}

const rows=engine.summary(state,[actor],{region:'New World'});
eq(rows.totalTracked,1,'NPC summary tracked count mismatch');
assert(rows.local.length===1,'Local NPC summary should expose actor');
assert(rows.local[0].careerLabel,'Career label missing from summary');

assert(/ONE PIECE LIFE — V9\.[2-9](?:\.\d+)?/.test(html),'V9.2+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=920,'Save version 920+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'',p=v.split('.').map(Number);assert(p[0]>9||(p[0]===9&&p[1]>=2),'Game version 9.2+ missing')}
for(const asset of ['src/data/npc-lives-v92.js','src/v92/npc-lives-engine-v92.js','src/v92/npc-lives-v92.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v9-[2-9]-\d+/.test(sw),'PWA cache must remain V9.2+');
assert(html.includes('v91Ensure();v92Ensure()'),'Old-save V9.2 migration hook missing');
for(const fn of ['function v92Module','function v92Ensure','function v92TrackedActors','function v92RelationActor','function v92NemesisActors','function v92Tick','function v92RecordWorldAction','function renderV92Lives']){
  assert(html.includes(fn),'Missing live V9.2 bridge '+fn);
}
assert(html.includes('id="v92LivesCard"'),'V9.2 NPC lives UI shell missing');
assert(html.includes('renderV92Lives();'),'V9.2 relations render hook missing');
assert(html.includes('v58VerifyRumors(months);v92Tick(months);'),'V9.2 world loop hook missing');
assert(html.includes("v92RecordWorldAction(win.id,'clash_win'"),'V5.8 conflict integration missing');
assert(html.includes("v92RecordWorldAction(winner.id,'clash_win'"),'V7.5 canon clash integration missing');
assert(html.includes('v92RelationSupportBonus(r)'),'V9.2 relation support integration missing');
assert(html.includes("String(e.actorId).startsWith('rel:')"),'V9.2 relation publication filter missing');
assert(!html.includes('v91Ensure(;v92Ensure()'),'Malformed V9.2 ensure chain regression');
assert(css.includes('.v92-lives'),'V9.2 life UI styling missing');
assert(css.includes('.v92-progress.career'),'V9.2 career progress styling missing');

console.log('V9.2 NPC LIVING LIVES 5.2 QA OK',JSON.stringify({
  version:'9.2.0',
  objectives:Object.keys(data.objectives).length,
  careerTiers:data.careerTiers.length,
  phase:recovering.life.phase,
  promotedTier:promoted.life.careerTier,
  support,
  summary:{phase:rows.local[0].phaseLabel,career:rows.local[0].careerLabel,influence:Math.round(rows.local[0].influence),wealth:Math.round(rows.local[0].wealth)}
}));
