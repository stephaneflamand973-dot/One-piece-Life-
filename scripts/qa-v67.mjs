import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V6.7 engine: init marker missing');

source=source.replace(initCall,`window.__v67qa={
  setGame(v){game=v},
  getGame(){return game},
  ensure:v67Ensure,
  ensureRelation:v67EnsureRelation,
  ensureCrewMember:v67EnsureCrewMember,
  relationStrength:v67RelationStrength,
  mentorCandidate:v67MentorCandidate,
  activeMentor:v67ActiveMentor,
  setMentor:v67SetMentor,
  mentorMultiplier:v67MentorMultiplier,
  rivalMultiplier:v67RivalMultiplier,
  missionRelationSupport:v67MissionRelationSupport,
  crewMetrics:v67CrewMetrics,
  crewSupport:v65CrewSupport,
  ambitionFit:v67AmbitionFit,
  resolveCrewConflict:v67ResolveCrewConflict
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
  localStorage,document,navigator:{userAgent:'V6.7-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'index-live-v67.js'});
const q=sandbox.__v67qa;
if(!q) throw new Error('Live V6.7 QA API was not exposed');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}

const basePlan=()=>({career:'steady',training:'steady',relations:'steady',adventure:'steady',resources:'steady',mission:'standard'});
function fixture(seed='670067'){
  const plan=basePlan();
  return {
    version:'6.7+ regression',saveVersion:670,ageMonths:300,alive:true,seed,rngCounters:{},dev:{rngLog:[]},
    meta:{difficulty:'Standard'},flags:{},clock:{year:25,month:0,day:1},relations:[],history:[],news:[],pendingDecision:null,
    pacing:{calmStreak:0,lastDecisionAge:0,lastMajorAge:0},
    agency:{annualPlan:{...plan},annualTurn:null},
    player:{
      name:'QA Social',faction:'Pirates',career:'Pirate',rank:'Capitaine',region:'Grand Line',
      health:90,energy:84,money:80000,
      stats:{Force:50,Vitesse:48,Agilité:51,Endurance:52,Résistance:50,Réflexes:54,Discipline:45,Volonté:52},
      skills:{Combat:55,Sabre:30,Tir:18,Navigation:42,Médecine:16,Commandement:58,Discrétion:36,Science:12},
      haki:{Observation:{state:'Éveillé',mastery:20,latent:true},Armement:{state:'Éveillé',mastery:18,latent:true},Conquérant:{state:'Inconnu',mastery:0,latent:false}},
      combatStyle:{primary:'Corps-à-corps',tendency:'Adaptatif',experience:32},
      socialV67:null,mentor:null,
      crew:{
        name:'Équipage QA',morale:72,ship:{name:'QA Ship',condition:84,tier:1},
        members:[
          {name:'Mira',role:'Bras droit',power:42,loyalty:82,status:'active'},
          {name:'Rook',role:'Navigateur',power:34,loyalty:68,status:'active'},
          {name:'Sena',role:'Combattant',power:39,loyalty:61,status:'active'}
        ]
      }
    }
  };
}

// V6.7 systems must remain present in V6.7 or later releases.
const saveMatch=html.match(/const SAVE_VERSION = (\d+);/);
const versionMatch=html.match(/const GAME_VERSION = '([0-9.]+)';/);
assert(saveMatch&&Number(saveMatch[1])>=670,'Save version regressed below 670');
assert(versionMatch&&Number(versionMatch[1].split('.')[0])>=6,'Game version missing or invalid');
assert(html.includes('function v67Ensure'),'V6.7 relationship engine missing');

// Crew enrichment is deterministic and creates persistent relations.
let g=fixture('same-seed');q.setGame(g);q.ensure();
const snapshotA=g.player.crew.members.map(m=>({id:m.id,temperament:m.temperament,ambition:m.ambition,growth:m.growthRate,potential:m.potentialPower}));
const relCountA=g.relations.length;
g=fixture('same-seed');q.setGame(g);q.ensure();
const snapshotB=g.player.crew.members.map(m=>({id:m.id,temperament:m.temperament,ambition:m.ambition,growth:m.growthRate,potential:m.potentialPower}));
eq(JSON.stringify(snapshotA),JSON.stringify(snapshotB),'Crew personality generation must be deterministic');
eq(g.relations.length,relCountA,'Crew relation synchronization should be deterministic');
assert(g.relations.some(r=>r.crewMemberId),'Crew members were not synchronized into relationships');

// Cohesion and tension react to loyalty/rivalry.
let metrics=q.crewMetrics();
assert(metrics.cohesion>metrics.tension,'Healthy crew should start more cohesive than tense');
for(const m of g.player.crew.members){m.loyalty=18;m.rivalry=82}
const strained=q.crewMetrics();
assert(strained.tension>metrics.tension+25,'Low loyalty/high rivalry should materially increase crew tension');
assert(strained.cohesion<metrics.cohesion-20,'Low loyalty/high rivalry should reduce cohesion');

// Strong non-crew allies contribute mission support.
g=fixture('ally');g.player.crew=null;g.relations=[
  {id:'ally1',name:'Aren',role:'Allié',affection:80,respect:78,trust:82,loyalty:75,rivalry:4,familiarity:75,status:'active'},
  {id:'ally2',name:'Kiro',role:'Informateur',affection:70,respect:68,trust:76,loyalty:62,rivalry:8,familiarity:60,status:'active'}
];
q.setGame(g);q.ensure();
const socialSupport=q.missionRelationSupport();
assert(socialSupport>0,'Strong relationships should provide mission support');
assert(q.crewSupport({type:'combat'})>=socialSupport,'Crew support wrapper lost relationship support');

// Mentorship requires a real relationship and affects progression.
g=fixture('mentor');g.player.crew=null;g.relations=[{id:'mentor1',name:'Solan',role:'Instructeur vétéran',affection:70,respect:82,trust:78,loyalty:65,rivalry:5,familiarity:70,status:'active'}];
q.setGame(g);q.ensure();
const mentor=g.relations[0];
assert(q.mentorCandidate(mentor),'Qualified mentor was not recognized');
assert(q.setMentor(mentor.id),'Mentor assignment failed');
assert(q.activeMentor()?.id===mentor.id,'Active mentor lookup failed');
assert(q.mentorMultiplier('skills','Combat')>1.05,'Mentor should materially improve relevant skill growth');

// Respected rivalry sharpens combat development.
g.relations.push({id:'rival1',name:'Dalen',role:'Rival',affection:30,respect:78,trust:30,loyalty:20,rivalry:84,familiarity:65,status:'active'});
q.ensureRelation(g.relations[1]);
assert(q.rivalMultiplier('skills','Combat')>1,'Strong respected rivalry should sharpen combat progression');
eq(q.rivalMultiplier('skills','Médecine'),1,'Rivalry should not boost unrelated medicine');

// Ambitions react to annual plans.
const adventurePlan=basePlan();adventurePlan.adventure='explore';
eq(q.ambitionFit('Aventure',adventurePlan),1,'Adventure ambition should like explore plan');
const isolatedPlan=basePlan();isolatedPlan.relations='isolate';
eq(q.ambitionFit('Loyauté',isolatedPlan),-1,'Loyalty ambition should dislike isolation');

// Static integration guards for autonomous conflicts/departures and decisions.
for(const marker of [
  "m.status='left'",
  "id:'v67_crew_conflict_'",
  "v67ResolveCrewConflict(parts.slice(2).join(':'),parts[1])",
  "id:'v67_mentor_offer_'",
  "v67MentorMultiplier('skills',k)",
  "v67RivalMultiplier('skills',k)",
  "v67CrewTick(months)",
  "Cohésion "
]) assert(html.includes(marker),`Missing V6.7 integration marker: ${marker}`);

// UI binding regression discovered during V6.7 work.
assert(html.includes("$$('[data-fruit-eat]').forEach"),'Fruit UI binding regressed to single-element selector');
assert(html.includes("$$('#activityOptions .action-card').forEach"),'Activity UI binding regressed to single-element selector');
assert(html.includes("$$('[data-ship-repair]').forEach"),'Ship repair UI binding regressed to single-element selector');

console.log('V6.7 LIVE QA OK',JSON.stringify({
  runtime:'index.html inline engine',
  version:'6.7.0',
  crewRelations:relCountA,
  healthyCrew:metrics,
  strainedCrew:strained,
  socialSupport,
  mentorBonus:q.mentorMultiplier('skills','Combat'),
  rivalBonus:q.rivalMultiplier('skills','Combat'),
  deterministicCrew:true,
  autonomousDepartures:true,
  crewConflictDecisions:true,
  mentorSystem:true
}));
