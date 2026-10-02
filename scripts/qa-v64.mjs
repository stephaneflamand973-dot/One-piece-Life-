import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V6.4 engine: init marker missing');

source=source.replace(initCall,`window.__v64qa={
  setGame(v){game=v},
  getGame(){return game},
  ensure:v64Ensure,
  riskProfile:v64RiskProfile,
  ensureRisk:v64EnsureRiskTurn,
  riskFactor:v64RiskFactor,
  recordRisk:v64RecordRisk,
  riskLabel:v64RiskLabel,
  rarity:v64RarityMultiplier,
  rareLeadActive:v64RareLeadActive,
  queueAdventure:v64QueueAdventureDecision
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
  removeItem(k){storage.delete(k)},
  clear(){storage.clear()}
};
const document={
  visibilityState:'visible',
  querySelector:fakeElement,
  querySelectorAll(){return[]},
  addEventListener(){},
  removeEventListener(){}
};
const sandbox={
  console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,Promise,
  parseInt,parseFloat,isFinite,isNaN,encodeURIComponent,decodeURIComponent,
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(fn){if(typeof fn==='function')fn();return 1},
  localStorage,document,
  navigator:{userAgent:'V6.4-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},
  indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'index-live-v64.js'});
const q=sandbox.__v64qa;
if(!q) throw new Error('Live V6.4 QA API was not exposed');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}
function near(actual,expected,eps,msg){if(Math.abs(actual-expected)>eps)throw new Error(`${msg}: got ${actual}, expected ${expected} ±${eps}`)}

const basePlan=()=>({career:'steady',training:'steady',relations:'steady',adventure:'steady',resources:'steady',mission:'standard'});
function gameFixture(faction='Civil',adventure='steady'){
  const plan=basePlan();plan.adventure=adventure;
  return {
    ageMonths:216,alive:true,seed:'640064',rngCounters:{},dev:{rngLog:[]},
    flags:{},pendingDecision:null,activeMission:null,
    agency:{annualPlan:{...plan},annualTurn:{active:true,plan:{...plan},risk:null,adventureDiscoveries:0}},
    player:{
      faction,region:'East Blue',island:'Loguetown',travel:null,visited:['Loguetown'],
      money:50000,reputation:{local:0,pirate:0,marine:0,government:0,revolution:0,world:0},
      rarityV64:{fruitCooldownUntil:-99,rareLeadUntil:-99,fruitFinds:0,rareFinds:0,rareLeads:0},
      stats:{Force:30,Vitesse:30,Agilité:30,Endurance:30,Résistance:30,Réflexes:30,Volonté:30,Discipline:30},
      skills:{Navigation:30,Combat:30,Sabre:10,Tir:10,Discrétion:20,Commandement:20},
      haki:{Observation:{mastery:0},Armement:{mastery:0},Conquérant:{mastery:0}},
      combatStyle:{experience:0},devilFruit:null
    }
  };
}

// 1. Risk budgets vary by plan and faction.
let g=gameFixture('Civil','steady');q.setGame(g);eq(q.riskProfile().budget,76,'Civil steady risk budget');
g=gameFixture('Marine','steady');q.setGame(g);eq(q.riskProfile().budget,89,'Marine steady risk budget');
g=gameFixture('Pirates','explore');q.setGame(g);eq(q.riskProfile().budget,126,'Pirate explore risk budget');
g=gameFixture('Chasseurs de primes','hunt');q.setGame(g);eq(q.riskProfile().budget,118,'Bounty hunter hunt risk budget');

// 2. Exposure dampens future danger while preserving travel/hook floors.
g=gameFixture('Civil','steady');q.setGame(g);
g.agency.annualTurn.risk={budget:100,spent:0,events:0,ambient:0,travel:0,mission:0,hook:0};
near(q.riskFactor('ambient'),1,1e-9,'Fresh ambient factor');
g.agency.annualTurn.risk.spent=50;near(q.riskFactor('ambient'),.78,1e-9,'Mid ambient factor');
g.agency.annualTurn.risk.spent=80;near(q.riskFactor('ambient'),.52,1e-9,'High ambient factor');
g.agency.annualTurn.risk.spent=120;
near(q.riskFactor('ambient'),.24,1e-9,'Saturated ambient floor');
near(q.riskFactor('hook'),.48,1e-9,'Saturated hook floor');
near(q.riskFactor('travel'),.52,1e-9,'Saturated travel floor');
q.recordRisk(18,'ambient');eq(g.agency.annualTurn.risk.spent,138,'Risk spend recording');eq(g.agency.annualTurn.risk.ambient,18,'Ambient spend recording');

// 3. Rarity responds to annual intent, rare leads and cooldowns.
g=gameFixture('Civil','steady');q.setGame(g);near(q.rarity('fruit'),1,1e-9,'Steady rarity');
g.agency.annualTurn.plan.adventure='cautious';near(q.rarity('fruit'),.42,1e-9,'Cautious rarity');
g.agency.annualTurn.plan.adventure='explore';near(q.rarity('fruit'),1.55,1e-9,'Explore rarity');
g.agency.annualTurn.plan.adventure='hunt';near(q.rarity('fruit'),2.45,1e-9,'Hunt rarity');
g.player.rarityV64.rareLeadUntil=g.ageMonths+12;near(q.rarity('fruit'),4.2,1e-9,'Rare-lead rarity cap');
g.player.rarityV64.fruitCooldownUntil=g.ageMonths+10;eq(q.rarity('fruit'),0,'Fruit cooldown blocks rediscovery');

// 4. Explore/hunt creates a real player decision in the live engine.
g=gameFixture('Civil','explore');q.setGame(g);
assert(q.queueAdventure()===true,'Explore plan did not queue an adventure decision');
eq(g.pendingDecision?.id,'v64_adventure_year','Adventure decision id');
assert((g.pendingDecision?.choices?.length||0)>=2,'Adventure decision needs routes plus local exploration');
assert(g.pendingDecision.choices.some(c=>String(c.action).startsWith('v64adv:local:')),'Local expedition choice missing');

// 5. Static integration guards for code paths that are expensive to execute in isolation.
assert(html.includes("{v:'fruit',w:.12*v64RarityMultiplier('fruit')}"),'Adult Fruit rarity weight regression');
assert(html.includes("fruitCooldownUntil=game.ageMonths+120"),'120-month Fruit cooldown missing');
assert(!html.includes("h.expiresAt<v58MonthIndex()+12"),'World Hook expiry extension regression');
assert(html.includes("v64RecordRisk(hookRisk,'hook')"),'World Hook resolutions do not consume annual risk');
assert(html.includes("hookExposure=v64RiskFactor('hook')"),'World Hook presentation is not dampened by annual exposure');
assert(html.includes(".72*v62Metric('hook',1)*hookExposure"),'World Hook chance is not tied to plan + risk exposure');
assert(!html.includes("h.type!=='threat'||v64RiskFactor('hook')>.42"),'Obsolete always-true threat hook gate returned');
assert(html.includes("v64AdventureMonthTick();"),'Adventure monthly integration missing');
assert(html.includes("riskSpent:Math.round(risk.spent||0)"),'Annual report lost risk spend');

console.log('V6.4 LIVE QA OK',JSON.stringify({
  runtime:'index.html inline engine',
  riskBudgets:{civilSteady:76,marineSteady:89,pirateExplore:126,bountyHunt:118},
  saturatedFactors:{ambient:.24,hook:.48,travel:.52},
  rarity:{steady:1,cautious:.42,explore:1.55,hunt:2.45,rareLeadCap:4.2,cooldown:0},
  adventureChoices:g.pendingDecision.choices.length,
  hookRiskIntegration:true,
  immutableHookExpiry:true
}));
