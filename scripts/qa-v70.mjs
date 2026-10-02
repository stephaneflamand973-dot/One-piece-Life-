import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V7.0 engine: init marker missing');

source=source.replace(initCall,`window.__v70qa={
  initialGame,
  setGame(v){game=v},
  getGame(){return game},
  ensure:ensureV6,
  ensure70:v70Ensure,
  stats:v70CanonStats,
  persona:v70Persona,
  personaRelation:v70PersonaRelation,
  canonRole:v70CanonRole,
  canonEventState:v70CanonEventState,
  applyCanonEffects:v70ApplyCanonEffects,
  localCanonCrews:v70LocalCanonCrews,
  canonMissions:v70CanonMissionCandidates,
  regionState:v68RegionState,
  simulateCanon,
  chars:CANON_CHARACTERS,
  crews:CANON_CREWS,
  fruits:DEVIL_FRUITS,
  events:CANON_EVENTS,
  places:PLACE_DATA
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
fakeElement('#seedInput').value='700070';
fakeElement('#nameInput').value='QA Canon';
fakeElement('#difficultyInput').value='Casual';

const localStorage={getItem(){return null},setItem(){},removeItem(){},clear(){}};
const document={visibilityState:'visible',querySelector:fakeElement,querySelectorAll(){return[]},addEventListener(){},removeEventListener(){}};
const sandbox={
  console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,Promise,
  parseInt,parseFloat,isFinite,isNaN,encodeURIComponent,decodeURIComponent,
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(fn){if(typeof fn==='function')fn();return 1},
  localStorage,document,navigator:{userAgent:'V7.0-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'index-live-v70.js'});
const q=sandbox.__v70qa;
if(!q) throw new Error('Live V7.0 QA API was not exposed');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}

// Release and content floor.
assert(html.includes('ONE PIECE LIFE — V7.0'),'V7.0 title missing');
assert(html.includes('const SAVE_VERSION = 700;'),'Save version 700 missing');
assert(html.includes("const GAME_VERSION = '7.0.0';"),'Game version 7.0.0 missing');
for(const marker of [
  'const CANON_CREWS',
  'const V70_PERSONAS',
  'const V70_CANON_REQUIREMENTS',
  'const V70_CANON_EFFECTS',
  'function v70Ensure',
  'function v70PersonaRelation',
  'function v70CanonMissionCandidates',
  'function v70ApplyCanonEffects'
]) assert(html.includes(marker),`Missing V7.0 integration: ${marker}`);

assert(q.chars.length>=58,'Canonical character expansion below target');
assert(q.crews.length>=12,'Canonical crew/group expansion below target');
assert(q.fruits.length>=26,'Devil Fruit expansion below target');
assert(q.events.length>=21,'Canonical event expansion below target');
assert(Object.keys(q.places).length>=47,'Place expansion below target');

// Fresh game receives all content.
let g=q.initialGame();q.setGame(g);q.ensure();
let stats=q.stats();
assert(stats.characters>=58,'Fresh world missing canonical characters');
assert(stats.crews>=12,'Fresh world missing canonical crews');
assert(stats.fruits>=26,'Fresh world missing Fruits');
assert(stats.events>=21,'Fresh world missing canonical events');
assert(stats.places>=47,'Fresh world missing places');

// Migration from a pre-V7 world must add missing content without replaying old completed effects.
g=q.initialGame();q.setGame(g);
delete g.world.canonV70;
g.clock.year=50;g.ageMonths=50*12;
g.world.characters=g.world.characters.filter(c=>!['blackbeard','fujitora','yamato'].includes(c.id));
g.world.fruits=g.world.fruits.filter(f=>!['ope_ope','gura_gura'].includes(f.id));
g.world.canon=g.world.canon.filter(e=>!['marineford_war','egghead_incident'].includes(e.id));
g.world.canonCrews=[];
const existingCompleted=g.world.canon.find(e=>e.id==='alabasta_crisis');
existingCompleted.status='completed';
const beforeInstability=g.world.regionalPressures['Grand Line'].Instabilité;
q.ensure70();
assert(g.world.characters.some(c=>c.id==='blackbeard'),'Migration failed to restore canonical character');
assert(g.world.fruits.some(f=>f.id==='gura_gura'),'Migration failed to restore canonical Fruit');
assert(g.world.canonCrews.length>=12,'Migration failed to restore canonical crews');
const migratedMarineford=g.world.canon.find(e=>e.id==='marineford_war');
const migratedEgghead=g.world.canon.find(e=>e.id==='egghead_incident');
assert(migratedMarineford?.status==='archived','Past missing Marineford event should migrate as archived');
assert(migratedEgghead?.status==='archived','Past missing Egghead event should migrate as archived');
q.simulateCanon();
eq(g.world.regionalPressures['Grand Line'].Instabilité,beforeInstability,'Migration replayed old completed canon effects');

// Persona system must materially distinguish characters.
g=q.initialGame();q.setGame(g);q.ensure();
g.ageMonths=28*12;g.clock.year=28;g.player.faction='Pirates';g.player.career='Pirate';g.player.rank='Capitaine';
g.player.ambitionType='power';g.player.skills.Sabre=82;g.player.skills.Combat=78;g.player.skills.Commandement=70;
g.player.reputation.pirate=72;g.player.reputation.world=40;
const mihawk=g.world.characters.find(c=>c.id==='mihawk');
const sakazuki=g.world.characters.find(c=>c.id==='sakazuki');
const shanks=g.world.characters.find(c=>c.id==='shanks');
const mRel=q.personaRelation(mihawk),sakaRel=q.personaRelation(sakazuki),shanksRel=q.personaRelation(shanks);
assert(mRel.respect>=55,'Mihawk did not respect high sword mastery');
assert(sakaRel.hostile===true,'Sakazuki should treat Pirate fixture as hostile');
assert(sakaRel.trust<shanksRel.trust,'Hostile Marine persona should trust Pirate less than Shanks');
assert(sakaRel.rivalry>shanksRel.rivalry+15,'Persona rivalry differences are too weak');
assert(q.persona(mihawk).mentorSkill==='Sabre','Mihawk persona lost sword mentorship identity');

// Historical graph blocks downstream events until prerequisites exist.
const marineford=g.world.canon.find(e=>e.id==='marineford_war');
const aceCapture=g.world.canon.find(e=>e.id==='ace_capture');
const summit=g.world.canon.find(e=>e.id==='summit_war_pressure');
marineford.status='future';aceCapture.status='future';summit.status='future';
let state=q.canonEventState(marineford);
assert(!state.ready&&state.blockedBy.includes('ace_capture'),'Marineford should be blocked without Ace capture');
aceCapture.status='completed';summit.status='completed';
state=q.canonEventState(marineford);
assert(state.ready,'Marineford did not unlock after prerequisites');

// Canon event effects must change characters, groups and Fruits.
const ace=g.world.characters.find(c=>c.id==='ace');
const whitebeard=g.world.characters.find(c=>c.id==='whitebeard');
const wbCrew=g.world.canonCrews.find(c=>c.id==='whitebeard_crew');
const mera=g.world.fruits.find(f=>f.id==='mera_mera');
const gura=g.world.fruits.find(f=>f.id==='gura_gura');
ace.status='alive';whitebeard.status='alive';wbCrew.status='active';mera.holder='Ace';mera.status='held';gura.holder='Whitebeard';gura.status='held';
delete g.world.canonV70.eventEffectsApplied['marineford_war'];
q.applyCanonEffects(marineford);
eq(ace.status,'dead','Marineford effect did not update Ace');
eq(whitebeard.status,'dead','Marineford effect did not update Whitebeard');
eq(wbCrew.status,'dissolved','Marineford effect did not dissolve Whitebeard crew');
eq(mera.holder,null,'Mera Mera should return to world after event effect');
eq(gura.holder,'Blackbeard','Gura Gura transfer effect missing');

// Canonical groups must affect regional state.
g.player.region='New World';g.player.island='Wano';
for(const c of g.world.canonCrews)c.status='dissolved';
let quiet=q.regionState('New World');
for(const id of ['red_hair','beasts','big_mom_crew']){const c=g.world.canonCrews.find(x=>x.id===id);c.status='active';c.currentRegion='New World'}
let crowded=q.regionState('New World');
assert(crowded.canonCrews.length>=3,'Canonical crews missing from regional state');
assert(crowded.extraDanger>quiet.extraDanger,'Canonical crews do not increase regional danger');

// Canonical crews must create real missions for an opposing career.
g.player.faction='Marine';g.player.career='Marine';g.player.rank='Vice-Amiral';
const missions=q.canonMissions(crowded);
assert(missions.some(m=>m.sourceType==='canon_crew'&&m.targetCanonCrewId),'Canonical crew did not produce mission');
assert(missions.some(m=>String(m.enemyName||'').includes('Équipage')),'Canonical mission lost named target');

// Global UI regression guard: no querySelector result may be treated as a list.
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'A mono-element $() selector is still followed by forEach somewhere in the live UI');

// Ensure old systems remain visible in V7.0.
for(const marker of [
  'function v69CareerTier',
  'function v68RegionState',
  'function v67CrewTick',
  'function v66ProgressValue',
  'function v65CombatAssessment',
  'function v64RiskFactor'
]) assert(html.includes(marker),`Prior system missing from V7.0: ${marker}`);

console.log('V7.0 LIVE QA OK',JSON.stringify({
  runtime:'index.html inline engine',
  version:'7.0.0',
  content:q.stats(),
  mihawkRespect:mRel.respect,
  sakazukiTrust:sakaRel.trust,
  shanksTrust:shanksRel.trust,
  marinefordDependencies:state.requires.length,
  canonicalCrewsInRegion:crowded.canonCrews.length,
  quietDanger:quiet.extraDanger,
  crowdedDanger:crowded.extraDanger,
  canonMissionCount:missions.length,
  migrationSafe:true,
  personaRules:true,
  historicalGraph:true
}));
