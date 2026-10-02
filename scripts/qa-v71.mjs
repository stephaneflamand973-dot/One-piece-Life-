import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/arc-definitions-v71.js','utf8');
const directorSrc=fs.readFileSync('src/v71/arc-director.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V7.1 engine: init marker missing');

source=source.replace(initCall,`window.__v71qa={
  initialGame,
  setGame(v){game=v},
  getGame(){return game},
  ensure:ensureV6,
  ensure71:v71Ensure,
  module:v71Module,
  context:v71Context,
  maybeStartArc:v71MaybeStartArc,
  buildDecision:v71BuildArcDecision,
  resolveArcChoice:v71ResolveArcChoice,
  applySpecial:v71ApplySpecialOutcome,
  finishArc:v71FinishArc,
  simulateCanon,
  relationMap:v71RelationMap
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
fakeElement('#seedInput').value='710071';
fakeElement('#nameInput').value='QA Arc';
fakeElement('#difficultyInput').value='Casual';

const localStorage={getItem(){return null},setItem(){},removeItem(){},clear(){}};
const document={visibilityState:'visible',querySelector:fakeElement,querySelectorAll(){return[]},addEventListener(){},removeEventListener(){}};
const sandbox={
  console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,Promise,
  parseInt,parseFloat,isFinite,isNaN,encodeURIComponent,decodeURIComponent,
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(fn){if(typeof fn==='function')fn();return 1},
  localStorage,document,navigator:{userAgent:'V7.1-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'arc-definitions-v71.js'});
vm.runInContext(directorSrc,sandbox,{filename:'arc-director.js'});
vm.runInContext(source,sandbox,{filename:'index-live-v71.js'});

const q=sandbox.__v71qa;
if(!q) throw new Error('Live V7.1 QA API was not exposed');
const registry=sandbox.OPL_MODULES;
const director=registry.get('arcDirector');
const defs=registry.get('arcDefinitionsV71');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}

// Release identity and modular loading.
assert(html.includes('ONE PIECE LIFE — V7.1'),'V7.1 title missing');
assert(html.includes('const SAVE_VERSION = 710;'),'Save version 710 missing');
assert(html.includes("const GAME_VERSION = '7.1.0';"),'Game version 7.1.0 missing');
for(const asset of [
  'src/core/module-registry.js',
  'src/data/arc-definitions-v71.js',
  'src/v71/arc-director.js',
  'src/v71/arc-director.css'
]) assert(html.includes(asset),`Index does not load modular asset: ${asset}`);
assert(registry&&registry.has('arcDefinitionsV71')&&registry.has('arcDirector'),'V7.1 modules were not registered');
assert(registry.list().length>=2,'Module registry does not expose loaded modules');
assert(sw.includes('one-piece-life-v7-1-0'),'PWA cache not bumped to V7.1');
for(const asset of ['src/core/module-registry.js','src/data/arc-definitions-v71.js','src/v71/arc-director.js','src/v71/arc-director.css'])assert(sw.includes(asset),`PWA does not cache modular asset: ${asset}`);

// Arc content floor.
const arcIds=Object.keys(defs.arcs);
assert(arcIds.length>=7,'Arc Director has too few major arcs');
for(const id of ['marineford_war','enies_lobby_clash','sabaody_collision','dressrosa_upheaval','wano_war','egghead_incident','cross_guild_rise'])assert(defs.arcs[id],`Missing arc definition: ${id}`);
assert(defs.arcs.marineford_war.stages.length>=3,'Marineford arc needs at least three stages');
assert(defs.arcs.wano_war.stages.length>=3,'Wano arc needs at least three stages');

// Fresh saves migrate to Arc Director state.
let g=q.initialGame();q.setGame(g);q.ensure();
assert(g.world.arcV71&&g.world.arcV71.version===1,'Fresh world missing V7.1 arc state');
eq(g.world.arcV71.totalArcs,0,'Fresh save should not have completed/started arcs');

// Low-profile character should not be force-dragged into Marineford.
g.ageMonths=18*12;g.clock.year=26;g.player.faction='Civil';g.player.career='Marchand';g.player.rank='Apprenti';
g.player.reputation.world=0;
for(const k of Object.keys(g.player.skills))g.player.skills[k]=15;
for(const k of Object.keys(g.player.stats))g.player.stats[k]=18;
const mf=g.world.canon.find(e=>e.id==='marineford_war');
mf.status='future';
const low=director.participation('marineford_war',q.context(mf));
assert(!low.eligible,'Low-profile civilian should not be forced into Marineford');

// High-profile pirate should be eligible and receive a faction-specific role.
g.player.faction='Pirates';g.player.career='Pirate';g.player.rank='Capitaine';g.player.reputation.world=82;g.player.reputation.pirate=90;
for(const k of Object.keys(g.player.skills))g.player.skills[k]=88;
for(const k of Object.keys(g.player.stats))g.player.stats[k]=88;
g.player.skills.Commandement=92;g.player.skills.Combat=94;g.player.skills.Discrétion=84;
g.player.haki.Observation.mastery=75;g.player.haki.Armement.mastery=80;g.player.haki.Conquérant.mastery=65;
const high=director.participation('marineford_war',q.context(mf));
assert(high.eligible,'High-profile pirate should qualify for Marineford participation');
assert(/pirate/i.test(high.role),'Marineford role did not reflect Pirate faction');

// Starting an arc must pause the event instead of applying it instantly.
g.pendingDecision=null;g.world.arcV71.active=null;
assert(q.maybeStartArc(mf,'completed')===true,'Eligible Marineford arc did not start');
eq(mf.status,'active_arc','Canon event should pause in active_arc while player participates');
assert(g.world.arcV71.active?.eventId==='marineford_war','Active arc state missing Marineford');
assert(g.pendingDecision&&g.pendingDecision.choices.length>=2,'Arc did not create a playable decision');
assert(g.pendingDecision.title.includes('Marineford'),'Arc decision title lost event identity');

// The modular resolver must materially distinguish good and bad execution.
const testArc=director.createArc('marineford_war',q.context(mf),'completed');
const firstStage=defs.arcs.marineford_war.stages[0];
const rescue=firstStage.choices.find(c=>c.id==='rescue_line');
const success=director.resolveChoice(testArc,'rescue_line',q.context(mf),0.01);
const failure=director.resolveChoice(testArc,'rescue_line',q.context(mf),0.999);
assert(success.success===true&&failure.success===false,'Arc roll did not affect stage outcome');
assert(success.impact>0&&failure.impact<0,'Arc success/failure should push contribution in opposite directions');
assert(failure.risk>success.risk,'Failed arc action should create more exposure');

// Stage filtering must respect faction-specific options.
const pirateChoices=director.availableChoices(firstStage,{faction:'Pirates'}).map(x=>x.id);
const marineChoices=director.availableChoices(firstStage,{faction:'Marine'}).map(x=>x.id);
assert(pirateChoices.includes('rescue_line')&&!pirateChoices.includes('marine_line'),'Pirate Marineford choices are wrong');
assert(marineChoices.includes('marine_line')&&!marineChoices.includes('rescue_line'),'Marine Marineford choices are wrong');

// Withdrawing must resolve deterministically and not leave the event frozen.
g=q.initialGame();q.setGame(g);q.ensure();
g.ageMonths=26*12;g.clock.year=26;g.player.faction='Pirates';g.player.career='Pirate';g.player.rank='Capitaine';g.player.reputation.world=90;
for(const k of Object.keys(g.player.skills))g.player.skills[k]=95;
for(const k of Object.keys(g.player.stats))g.player.stats[k]=95;
const mf2=g.world.canon.find(e=>e.id==='marineford_war');mf2.status='future';
assert(q.maybeStartArc(mf2,'completed')===true,'Second Marineford fixture did not start');
const withdrawAction=g.pendingDecision.choices.find(c=>/marge|guerre/i.test(c.label))?.action;
assert(withdrawAction,'Withdraw choice missing from first arc stage');
const parts=withdrawAction.split(':');
q.resolveArcChoice(parts);
assert(!g.world.arcV71.active,'Withdraw should close active arc');
assert(['completed','modified'].includes(mf2.status),'Withdraw should return canon event to a resolved state');
assert(g.world.arcV71.history[0]?.quality==='withdrawn','Withdrawn arc missing from arc history');

// Critical divergence path: legendary rescue can keep Ace alive.
g=q.initialGame();q.setGame(g);q.ensure();
const ace=g.world.characters.find(c=>c.id==='ace'),mera=g.world.fruits.find(f=>f.id==='mera_mera');
ace.status='dead';mera.holder=null;mera.status='world';
const specialArc={eventId:'marineford_war',critical:'save_ace',criticalSuccess:true,impact:8,successes:3,failures:0,risk:8,withdrawn:false,alignment:'rescue'};
const specialSummary=director.summary(specialArc);
assert(specialSummary.quality==='legendary','Special Marineford fixture should be legendary');
const divergenceBefore=g.world.divergence;
q.applySpecial(specialArc,specialSummary);
eq(ace.status,'alive','Legendary Marineford rescue did not keep Ace alive');
eq(mera.holder,'Ace','Legendary Marineford rescue did not restore Mera holder');
assert(g.world.divergence>=divergenceBefore+16,'Major arc divergence did not raise world divergence');

// A V7.0 save shape without arcV71 must migrate safely.
g=q.initialGame();q.setGame(g);delete g.world.arcV71;q.ensure71();
assert(g.world.arcV71&&Array.isArray(g.world.arcV71.history),'V7.0 -> V7.1 arc migration failed');

// Global UI safety remains intact.
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'A mono-element $() selector is still followed by forEach');
assert(html.includes('id="v71ArcCard"'),'Arc progress UI missing');

console.log('V7.1 LIVE QA OK',JSON.stringify({
  runtime:'index.html + modular src assets',
  version:'7.1.0',
  modules:registry.list(),
  arcDefinitions:arcIds.length,
  marinefordStages:defs.arcs.marineford_war.stages.length,
  lowParticipation:low.score,
  highParticipation:high.score,
  highRole:high.role,
  modularSuccessChance:success.chance,
  withdrawalHistory:true,
  criticalDivergence:true,
  migrationSafe:true
}));
