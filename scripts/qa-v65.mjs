import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V6.5 engine: init marker missing');

source=source.replace(initCall,`window.__v65qa={
  setGame(v){game=v},
  getGame(){return game},
  ensure63:v63Ensure,
  readiness:v6MissionReadiness,
  missionChance:v6MissionSuccessChance,
  preview:v65MissionPreview,
  crewSupport:v65CrewSupport,
  condition:v65MissionCondition,
  combatAssessment:v65CombatAssessment,
  approach:v65MissionApproach,
  skillResolution:v65ResolveSkillMission
};`);

const elements=new Map();
function fakeElement(sel){
  if(!elements.has(sel)){
    const cls=new Set();
    elements.set(sel,{
      value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{},
      classList:{add(...xs){xs.forEach(x=>cls.add(x))},remove(...xs){xs.forEach(x=>cls.delete(x))},toggle(x,force){if(force===undefined){if(cls.has(x)){cls.delete(x);return false}cls.add(x);return true}force?cls.add(x):cls.delete(x);return !!force},contains(x){return cls.has(x)}},
      addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},focus(){},select(){},closest(){return null}
    });
  }
  return elements.get(sel);
}
const storage=new Map();
const localStorage={
  getItem(k){return storage.has(k)?storage.get(k):null},
  setItem(k,v){storage.set(k,String(v))},
  removeItem(k){storage.delete(k)},clear(){storage.clear()}
};
const document={visibilityState:'visible',querySelector:fakeElement,querySelectorAll(){return[]},addEventListener(){},removeEventListener(){}};
const sandbox={
  console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,Promise,
  parseInt,parseFloat,isFinite,isNaN,encodeURIComponent,decodeURIComponent,
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(fn){if(typeof fn==='function')fn();return 1},
  localStorage,document,navigator:{userAgent:'V6.5-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'index-live-v65.js'});
const q=sandbox.__v65qa;
if(!q) throw new Error('Live V6.5 QA API was not exposed');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}

const basePlan=()=>({career:'steady',training:'steady',relations:'steady',adventure:'steady',resources:'steady',mission:'standard'});
function fixture(planMission='standard'){
  const plan=basePlan();plan.mission=planMission;
  return {
    version:'6.5.0',saveVersion:650,ageMonths:240,alive:true,seed:'650065',rngCounters:{},dev:{rngLog:[]},
    meta:{difficulty:'Standard'},flags:{},pendingDecision:null,activeMission:null,
    clock:{year:20,month:0,day:1},
    agency:{annualPlan:{...plan},annualTurn:{active:true,plan:{...plan},risk:{budget:90,spent:0,events:0,ambient:0,travel:0,mission:0,hook:0}}},
    player:{
      faction:'Marine',career:'Marine',rank:'Lieutenant',region:'Grand Line',island:'Water 7',
      health:82,energy:78,money:100000,bounty:0,highestBounty:0,wins:0,losses:0,
      activity:'Service',activityType:'marine',situation:'Service actif',
      reputation:{local:12,pirate:0,marine:20,government:0,revolution:0,world:4},
      economy:{gearLevel:0,intelUntilMonth:-99,lastActionYear:-99},
      stats:{Force:46,Vitesse:44,Agilité:45,Endurance:48,Résistance:47,Réflexes:50,Volonté:44,Discipline:51},
      skills:{Navigation:38,Combat:52,Sabre:24,Tir:18,Discrétion:40,Commandement:43,Médecine:18,Science:15},
      haki:{Observation:{mastery:22},Armement:{mastery:18},Conquérant:{mastery:0}},
      combatStyle:{primary:'Corps à corps',tendency:'Adaptatif',experience:28},
      devilFruit:null,crew:null,careerPrestige:{level:0}
    }
  };
}
const mission={id:'qa_mission',title:'Interception',desc:'QA',type:'combat',danger:'medium',power:52,reward:12000,duration:1};

// Version and public release markers.
assert(html.includes('ONE PIECE LIFE — V6.5'),'V6.5 title missing');
assert(html.includes('const SAVE_VERSION = 650;'),'Save version 650 missing');
assert(html.includes("const GAME_VERSION = '6.5.0';"),'Game version 6.5.0 missing');

// Readiness responds to actual preparation layers.
let g=fixture('standard');q.setGame(g);
const base=q.readiness(mission);
eq(q.crewSupport(mission),0,'Solo crew support');
g.player.economy.gearLevel=3;
g.player.economy.intelUntilMonth=g.ageMonths+12;
g.player.crew={morale:84,members:[{role:'Bras droit'},{role:'Navigateur'},{role:'Combattant'},{role:'Médecin'}],ship:{condition:88}};
const prepared=q.readiness(mission);
assert(prepared.score>base.score+10,'Gear + intel + crew should materially improve readiness');
assert(prepared.crew>0,'Crew support missing');
assert(prepared.intel===5,'Intel readiness bonus missing');
assert(prepared.gear>0,'Gear readiness bonus missing');

// Annual mission doctrine changes completion odds and combat posture.
g=fixture('cautious');q.setGame(g);const cautiousChance=q.missionChance(mission);const cautiousCombat=q.combatAssessment({name:'QA enemy',power:55,lethal:.08},{mission:true,missionData:mission});
g=fixture('bold');q.setGame(g);const boldChance=q.missionChance(mission);const boldCombat=q.combatAssessment({name:'QA enemy',power:55,lethal:.08},{mission:true,missionData:mission});
assert(cautiousChance>0 && boldChance>0,'Mission chances invalid');
assert(boldCombat.winEstimate>cautiousCombat.winEstimate,'Bold doctrine should increase combat initiative');
assert(q.approach().id==='bold','Mission doctrine not read from annual plan');

// Health + energy are part of combat and mission readiness.
g=fixture('standard');q.setGame(g);const fresh=q.combatAssessment({name:'QA enemy',power:55,lethal:.08},{mission:true,missionData:mission});
g.player.health=24;g.player.energy=20;const exhausted=q.combatAssessment({name:'QA enemy',power:55,lethal:.08},{mission:true,missionData:mission});
assert(exhausted.condition<fresh.condition,'Condition did not react to health/energy');
assert(exhausted.winEstimate<fresh.winEstimate,'Poor condition should reduce combat estimate');

// Static regression guards: three tactical phases, retreat and partial mission outcomes.
for(const marker of ["'v65Opening'","'v65Pressure'","'v65Finish'","phasesWon>=2","outcome:'retreat'","Mission partiellement réussie","partialChance","riskMult=approach.id==='cautious'?.78:approach.id==='bold'?1.18:1"]){
  assert(html.includes(marker),`Missing V6.5 integration marker: ${marker}`);
}
assert(!html.includes("let winProb=clamp(.17+ratio*.43"),'Legacy one-roll combat engine returned');

console.log('V6.5 LIVE QA OK',JSON.stringify({
  runtime:'index.html inline engine',
  version:'6.5.0',
  readinessGain:+(prepared.score-base.score).toFixed(1),
  preparedCrew:prepared.crew,
  cautiousMissionChance:+cautiousChance.toFixed(3),
  boldMissionChance:+boldChance.toFixed(3),
  cautiousCombat:+cautiousCombat.winEstimate.toFixed(3),
  boldCombat:+boldCombat.winEstimate.toFixed(3),
  freshCombat:+fresh.winEstimate.toFixed(3),
  exhaustedCombat:+exhausted.winEstimate.toFixed(3),
  tacticalPhases:3,
  partialSuccess:true,
  tacticalRetreat:true
}));
