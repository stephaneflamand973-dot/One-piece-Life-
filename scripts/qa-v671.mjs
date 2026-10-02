import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V6.7.1 engine: init marker missing');

source=source.replace(initCall,`window.__v671qa={
  initialGame,
  setGame(v){game=v},
  getGame(){return game},
  ensure:ensureV6,
  gain:v671Gain,
  cap:v66Cap,
  simulateCrew,
  renderMissions,
  renderRelations,
  advanceClock,
  trainProgress,
  updateCondition,
  monthlyPlan:v62MonthlyPlanEffects,
  simulateRelations,
  careerTick,
  simulateWorld,
  tickMission,
  tickTravel,
  simulateEvent,
  naturalMortality,
  createPirateCrewIfNeeded
};`);

const elements=new Map();
const qsaCalls=new Map();
function baseElement(sel){
  if(!elements.has(sel)){
    const cls=new Set();
    const el={
      value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{},
      classList:{add(...xs){xs.forEach(x=>cls.add(x))},remove(...xs){xs.forEach(x=>cls.delete(x))},toggle(x,force){if(force===undefined){if(cls.has(x)){cls.delete(x);return false}cls.add(x);return true}force?cls.add(x):cls.delete(x);return !!force},contains(x){return cls.has(x)}},
      addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},focus(){},select(){},closest(){return null}
    };
    elements.set(sel,el);
  }
  return elements.get(sel);
}
baseElement('#seedInput').value='671671';
baseElement('#nameInput').value='QA Stabilization';
baseElement('#difficultyInput').value='Casual';

function listNode(dataset={}){
  return {dataset:{...dataset},onclick:null,classList:{add(){},remove(){},toggle(){},contains(){return false}}};
}
const document={
  visibilityState:'visible',
  querySelector:baseElement,
  querySelectorAll(sel){
    qsaCalls.set(sel,(qsaCalls.get(sel)||0)+1);
    if(sel==='[data-mission]') return [listNode({mission:'qa_mission_a'}),listNode({mission:'qa_mission_b'})];
    if(sel==='[data-rel-action]') return [listNode({rel:'qa_rel',relAction:'time'}),listNode({rel:'qa_rel',relAction:'help'})];
    return [];
  },
  addEventListener(){},removeEventListener(){}
};
const storage=new Map();
const localStorage={
  getItem(k){return storage.has(k)?storage.get(k):null},
  setItem(k,v){storage.set(k,String(v))},
  removeItem(k){storage.delete(k)},clear(){storage.clear()}
};
const sandbox={
  console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,Promise,
  parseInt,parseFloat,isFinite,isNaN,encodeURIComponent,decodeURIComponent,
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(fn){if(typeof fn==='function')fn();return 1},
  localStorage,document,navigator:{userAgent:'V6.7.1-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'index-live-v671.js'});
const q=sandbox.__v671qa;
if(!q) throw new Error('Live V6.7.1 QA API was not exposed');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}

// V6.7.1 systems must remain present in V6.7.1 or later releases.
const saveMatch=html.match(/const SAVE_VERSION = (\d+);/);
const versionMatch=html.match(/const GAME_VERSION = '([0-9.]+)';/);
assert(saveMatch&&Number(saveMatch[1])>=671,'Save version regressed below 671');
assert(versionMatch&&Number(versionMatch[1].split('.')[0])>=6,'Game version missing or invalid');
assert(html.includes('function v671Gain'),'Unified progression gateway missing');

// UI bindings must use querySelectorAll.
assert(html.includes("$$('[data-mission]').forEach"),'Mission cards still use mono-element selector');
assert(html.includes("$$('[data-rel-action]').forEach"),'Relation actions still use mono-element selector');
assert(!/(?<!\$)\$\('\[data-mission\]'\)\.forEach/.test(html),'Legacy mission selector survived');
assert(!/(?<!\$)\$\('\[data-rel-action\]'\)\.forEach/.test(html),'Legacy relation selector survived');

// Old progression bypasses must be gone.
for(const legacy of [
  "p.stats.Discipline=clamp(p.stats.Discipline+.35",
  "p.skills.Discrétion=clamp((p.skills.Discrétion||0)+randInt(1,3,'v59HookResolve')",
  "p.skills.Discrétion=clamp(p.skills.Discrétion+months*.08*careerMult",
  "p.stats.Discipline=clamp(p.stats.Discipline+months*.05*careerMult",
  "p.stats[key]=clamp(old+randInt(1,4,'life')"
]) assert(!html.includes(legacy),`Legacy progression bypass survived: ${legacy}`);

// Fresh live game fixture.
let g=q.initialGame();
q.setGame(g);
q.ensure();

// Unified stat progression must obey the soft/personal cap.
const statKey='Discipline';
const statSoft=g.player.caps[statKey].soft;
const statNatural=q.cap('stats',statKey);
g.player.stats[statKey]=Math.min(statSoft,statNatural)-.1;
q.gain('stats',statKey,500);
assert(g.player.stats[statKey]<=Math.min(statSoft,statNatural)+1e-9,'Unified stat gain exceeded soft/personal cap');

// Unified skill progression must obey personal cap.
const skillKey='Discrétion';
const skillCap=q.cap('skills',skillKey);
g.player.skills[skillKey]=Math.max(0,skillCap-.1);
q.gain('skills',skillKey,500);
assert(g.player.skills[skillKey]<=skillCap+1e-9,'Unified skill gain exceeded personal cap');

// Crew legacy simulation may maintain/recruit, but it may no longer delete members directly.
g.player.faction='Pirates';g.player.career='Pirate';g.player.rank='Capitaine';
g.player.crew={
  name:'QA Crew',morale:50,
  ship:{name:'QA Ship',condition:90,tier:1},
  members:[
    {name:'Mira',role:'Bras droit',power:35,loyalty:5,status:'active'},
    {name:'Rook',role:'Navigateur',power:30,loyalty:5,status:'active'},
    {name:'Sena',role:'Combattant',power:33,loyalty:5,status:'active'}
  ]
};
q.ensure();
const originalIds=g.player.crew.members.map(m=>m.id);
q.simulateCrew(24);
for(const id of originalIds) assert(g.player.crew.members.some(m=>m.id===id),'Legacy simulateCrew removed a member outside Crew 2.0');
assert(!html.includes("c.members=c.members.filter(x=>x!==m)"),'Legacy hard-delete crew departure path survived');
assert(html.includes("m.status='left'"),'Crew 2.0 departure authority missing');

// Exercise mission and relation renders and verify querySelectorAll is actually used at runtime.
g.player.career='Pirate';
g.missionBoard=[
  {id:'qa_mission_a',title:'QA Mission A',desc:'Test',danger:'low',type:'work',reward:5000,duration:1,power:18},
  {id:'qa_mission_b',title:'QA Mission B',desc:'Test',danger:'medium',type:'combat',reward:12000,duration:2,power:35}
];
g.activeMission=null;
q.renderMissions();
assert((qsaCalls.get('[data-mission]')||0)>0,'renderMissions did not call querySelectorAll');

g.relations=[{id:'qa_rel',name:'Aren',role:'Allié',affection:65,respect:70,trust:72,loyalty:68,rivalry:10,familiarity:60,status:'active'}];
q.renderRelations();
assert((qsaCalls.get('[data-rel-action]')||0)>0,'renderRelations did not call querySelectorAll');

// 30-year live core-loop stress on an adult civilian career.
g=q.initialGame();q.setGame(g);
g.ageMonths=15*12;g.clock.year=15;g.meta.difficulty='Casual';
g.player.faction='Civil';g.player.career='Marchand';g.player.rank='Apprenti';
g.player.situation='Travail';g.player.activity='Commerce local';g.player.activityType='work';
g.flags.ambitionOffered=true;g.flags.careerOffered=true;g.flags.specializationOffered=true;
g.player.specialization='trade';
q.ensure();

let monthsSimulated=0,decisionCount=0,maxBytes=JSON.stringify(g).length;
for(let month=0;month<360&&g.alive;month++){
  q.advanceClock(1);
  q.trainProgress(1);
  q.updateCondition(1);
  q.monthlyPlan();
  q.simulateRelations(1);
  q.careerTick(1);
  q.simulateWorld(1);
  q.tickMission(1);
  q.tickTravel(1);
  if(!g.activeMission&&!g.player.travel)q.simulateEvent(1);
  q.naturalMortality(1);
  if(g.pendingDecision){decisionCount++;g.pendingDecision=null}
  monthsSimulated++;
  if(month%12===0)maxBytes=Math.max(maxBytes,JSON.stringify(g).length);
  for(const k of Object.keys(g.player.stats)){
    const v=g.player.stats[k];
    assert(Number.isFinite(v),`Non-finite stat after long stress: ${k}`);
    assert(v<=q.cap('stats',k)+1e-6,`Stat exceeded personal cap after long stress: ${k}`);
  }
  for(const k of Object.keys(g.player.skills)){
    const v=g.player.skills[k];
    assert(Number.isFinite(v),`Non-finite skill after long stress: ${k}`);
    assert(v<=q.cap('skills',k)+1e-6,`Skill exceeded personal cap after long stress: ${k}`);
  }
}
assert(monthsSimulated>=300,'Long-career stress ended too early');
assert(g.history.length<=240,'History retention exceeded live bound');
assert(g.news.length<=60,'News retention exceeded live bound');
assert(maxBytes<600*1024,'Long-career save exceeded 600 KB');

console.log('V6.7.1 LIVE QA OK',JSON.stringify({
  runtime:'index.html inline engine',
  version:'6.7.1+ regression',
  selectors:{missions:qsaCalls.get('[data-mission]')||0,relations:qsaCalls.get('[data-rel-action]')||0},
  unifiedProgression:true,
  singleCrewDepartureAuthority:true,
  monthsSimulated,
  yearsSimulated:+(monthsSimulated/12).toFixed(1),
  decisionCount,
  finalAge:+(g.ageMonths/12).toFixed(1),
  finalRank:g.player.rank,
  finalPower:sandbox.window.__v671qa?undefined:undefined,
  maxSaveKB:+(maxBytes/1024).toFixed(1),
  history:g.history.length,
  news:g.news.length
}));
