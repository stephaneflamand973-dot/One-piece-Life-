import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V6.6 engine: init marker missing');

source=source.replace(initCall,`window.__v66qa={
  setGame(v){game=v},
  getGame(){return game},
  ensure:v66Ensure,
  cap:v66Cap,
  growth:v66GrowthMultiplier,
  ageFactor:v66AgeGrowthFactor,
  progress:v66ProgressValue,
  highlights:v66PotentialHighlights,
  skillGain:v63SkillGain
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
  localStorage,document,navigator:{userAgent:'V6.6-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'index-live-v66.js'});
const q=sandbox.__v66qa;
if(!q) throw new Error('Live V6.6 QA API was not exposed');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}

const stats={Force:30,Vitesse:30,Agilité:30,Endurance:30,Résistance:30,Réflexes:30,Discipline:30,Volonté:30};
const skills={Combat:30,Sabre:20,Tir:15,Navigation:25,Médecine:10,Commandement:20,Discrétion:18,Science:12};
function fixture(potential='Correct',talent='Correct',seed='660066'){
  return {
    version:'6.6.0',saveVersion:660,ageMonths:240,alive:true,seed,rngCounters:{},dev:{rngLog:[]},
    meta:{difficulty:'Standard'},flags:{},clock:{year:20,month:0,day:1},
    player:{
      name:'QA Potential',potential,
      talents:{Physique:talent,Martial:talent,Social:talent,Navigation:talent,Apprentissage:talent},
      stats:{...stats},skills:{...skills},caps:{},
      health:100,energy:100,
      haki:{
        Observation:{state:'Éveillé',mastery:12,latent:true},
        Armement:{state:'Dormant',mastery:0,latent:true},
        Conquérant:{state:'Inconnu',mastery:0,latent:false}
      },
      combatStyle:{primary:'Équilibré',tendency:'Adaptatif',experience:10},
      devilFruit:null
    }
  };
}

// Release markers.
assert(html.includes('ONE PIECE LIFE — V6.6'),'V6.6 title missing');
assert(html.includes('const SAVE_VERSION = 660;'),'Save version 660 missing');
assert(html.includes("const GAME_VERSION = '6.6.0';"),'Game version 6.6.0 missing');

// Deterministic generation: same seed + player = same potential profile.
let g=fixture('Correct','Correct','same-seed');q.setGame(g);const a=JSON.stringify(q.ensure());
g=fixture('Correct','Correct','same-seed');q.setGame(g);const b=JSON.stringify(q.ensure());
eq(a,b,'Potential profile must be deterministic');

// Global + domain talent materially change ceilings and growth.
g=fixture('Faible','Faible','contrast');q.setGame(g);q.ensure();
const low={cap:q.cap('skills','Combat'),growth:q.growth('skills','Combat'),overall:g.player.potentialV66.overall.score};
g=fixture('Prodigieux','Prodigieux','contrast');q.setGame(g);q.ensure();
const high={cap:q.cap('skills','Combat'),growth:q.growth('skills','Combat'),overall:g.player.potentialV66.overall.score};
assert(high.cap>low.cap,'Prodigious profile should have higher Combat ceiling');
assert(high.growth>low.growth,'Prodigious profile should grow faster in Combat');
assert(high.overall>low.overall,'Prodigious profile should have higher overall potential score');

// Global Growth Rate must be mechanically active, not cosmetic.
g=fixture('Correct','Correct','global-growth');q.setGame(g);q.ensure();
g.player.potentialV66.overall.growthRate=.65;const slowGlobal=q.growth('skills','Combat');
g.player.potentialV66.overall.growthRate=1.35;const fastGlobal=q.growth('skills','Combat');
assert(fastGlobal>slowGlobal*1.5,'Global Growth Rate is not materially affecting progression');

// Haki latent state matters.
g=fixture('Remarquable','Remarquable','haki');q.setGame(g);q.ensure();
assert(q.cap('haki','Observation')>0,'Latent/awakened Observation should have a potential cap');
eq(q.cap('haki','Conquérant'),0,'Non-latent Conqueror should not receive a usable cap');

// Current achievements are never nerfed by migration.
g=fixture('Faible','Faible','legacy-high');g.player.stats.Force=97;q.setGame(g);q.ensure();
assert(q.cap('stats','Force')>=97,'Migration reduced an already-earned stat');
assert(g.player.caps.Force.natural>=97,'Natural cap fell below current stat');

// Progress respects individual ceilings.
g=fixture('Correct','Correct','cap-test');q.setGame(g);q.ensure();
const combatCap=q.cap('skills','Combat');
g.player.skills.Combat=Math.max(0,combatCap-.15);
const gained=q.skillGain('Combat',100);
assert(g.player.skills.Combat<=combatCap+1e-9,'Skill progress exceeded personal cap');
assert(gained<=.16,'Near-cap skill gain should not overshoot');

// Development curves really alter growth by age.
g=fixture('Correct','Correct','curve');q.setGame(g);q.ensure();
g.player.potentialV66.curve='early';g.ageMonths=14*12;const earlyTeen=q.ageFactor();
g.player.potentialV66.curve='late';const lateTeen=q.ageFactor();
assert(earlyTeen>lateTeen,'Early curve should outperform late curve in adolescence');
g.ageMonths=30*12;const lateAdult=q.ageFactor('late',30),earlyAdult=q.ageFactor('early',30);
assert(lateAdult>earlyAdult,'Late curve should outperform early curve around age 30');

// UI + integration guards.
for(const marker of [
  'id="potentialProfile"',
  'id="potentialGrowthBadge"',
  "v66GrowthMultiplier('stats',k)",
  "v66ProgressValue('skills',k,cur,gain)",
  "v66ProgressValue('haki',key,old,base)",
  "v66ProgressValue('fruit','mastery',old,base)",
  "v66ProgressValue('style','experience',oldStyle,styleGain)",
  "hc&&!['Dormant','Inconnu'].includes(hc.state)"
]) assert(html.includes(marker),`Missing V6.6 integration marker: ${marker}`);

const highlights=q.highlights();
assert(highlights.length===5,'Potential highlights should expose five strengths');

console.log('V6.6 LIVE QA OK',JSON.stringify({
  runtime:'index.html inline engine',
  version:'6.6.0',
  low,
  high,
  deterministic:true,
  hakiObservationCap:q.cap('haki','Observation'),
  earlyTeen,
  lateTeen,
  lateAdult,
  earlyAdult,
  personalCaps:true,
  growthCurves:true,
  globalGrowthActive:true,
  migrationSafe:true
}));
