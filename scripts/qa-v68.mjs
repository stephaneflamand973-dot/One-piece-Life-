import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V6.8 engine: init marker missing');

source=source.replace(initCall,`window.__v68qa={
  initialGame,
  setGame(v){game=v},
  getGame(){return game},
  ensure:ensureV6,
  ensure68:v68Ensure,
  regionState:v68RegionState,
  causalMissions:v68CausalMissionCandidates,
  refreshMissionBoard,
  missionFromCause:v68MissionFromCause,
  applyMission:v68ApplyMissionOutcome,
  applyHook:v68ApplyHookOutcome,
  economyIndex:v68LocalEconomyIndex,
  travelRisk:v68TravelRisk,
  worldTick:v68WorldTick,
  autonomousEvent:v58AutonomousEvent,
  simulateWorld,
  advanceClock
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
fakeElement('#seedInput').value='680068';
fakeElement('#nameInput').value='QA Causal';
fakeElement('#difficultyInput').value='Casual';

const localStorage={getItem(){return null},setItem(){},removeItem(){},clear(){}};
const document={visibilityState:'visible',querySelector:fakeElement,querySelectorAll(){return[]},addEventListener(){},removeEventListener(){}};
const sandbox={
  console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,Promise,
  parseInt,parseFloat,isFinite,isNaN,encodeURIComponent,decodeURIComponent,
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(fn){if(typeof fn==='function')fn();return 1},
  localStorage,document,navigator:{userAgent:'V6.8-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'index-live-v68.js'});
const q=sandbox.__v68qa;
if(!q) throw new Error('Live V6.8 QA API was not exposed');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}

assert(html.includes('ONE PIECE LIFE — V6.8'),'V6.8 title missing');
assert(html.includes('const SAVE_VERSION = 680;'),'Save version 680 missing');
assert(html.includes("const GAME_VERSION = '6.8.0';"),'Game version 6.8.0 missing');
for(const marker of [
  'function v68RegionState',
  'function v68CausalMissionCandidates',
  'function v68ApplyMissionOutcome',
  'function v68ApplyHookOutcome',
  'function v68WorldTick',
  'id="causalRegionState"',
  'id="causalLedger"'
]) assert(html.includes(marker),`Missing V6.8 integration: ${marker}`);

let g=q.initialGame();
q.setGame(g);
g.ageMonths=24*12;g.clock.year=24;g.meta.difficulty='Casual';
g.player.region='Grand Line';g.player.island='Water 7';g.player.faction='Marine';g.player.career='Marine';g.player.rank='Lieutenant';
g.world.regionalPressures['Grand Line']={Piraterie:82,Marine:42,Criminalité:68,Révolution:35,Prospérité:31,Instabilité:78};
g.world.territoryState['Grand Line'].influence={Marine:43,Pirates:47,Révolutionnaires:26,Gouvernement:38,'Chasseurs de primes':18};
g.world.projects.unshift({id:'proj_qa_raid',faction:'Pirates',title:'Préparer un raid',type:'raid',region:'Grand Line',progress:18,target:22,difficulty:72,status:'active',startedAt:250});
g.world.emergentCrews.unshift({id:'crew_qa',name:'Équipage des Cendres',region:'Grand Line',power:62,potentialPower:75,notoriety:73,status:'active',members:5});
q.ensure();

const hot=q.regionState('Grand Line');
assert(hot.crisis>=55,'High-pressure Grand Line did not produce a serious crisis score');
assert(hot.priceIndex>1,'Low prosperity/high instability did not raise local prices');
assert(hot.routeRisk>10,'Regional instability did not raise route risk');
assert(hot.projects.length>=1,'Active project missing from causal state');
assert(hot.crews.some(c=>c.id==='crew_qa'),'Active local crew missing from causal state');

const candidates=q.causalMissions();
assert(candidates.some(m=>m.sourceType==='project'&&m.sourceId==='proj_qa_raid'),'Hostile faction project did not generate a mission');
assert(candidates.some(m=>m.sourceType==='crew'&&m.targetCrewId==='crew_qa'),'Local pirate crew did not generate a mission');
assert(candidates.some(m=>m.sourceType==='pressure'&&m.pressureKey==='Piraterie'),'High piracy did not generate a pressure mission');

q.refreshMissionBoard();
assert(g.missionBoard.length===3,'Mission board should still expose exactly three missions');
assert(g.missionBoard.some(m=>m.causal),'Mission board lost causal missions');
assert(g.missionBoard.filter(m=>m.causal).length<=2,'Causal missions should not completely erase career templates');
assert(g.missionBoard.some(m=>String(m.cause||'').length>0),'Mission cause explanation missing');

// World -> economy.
const expensive=q.economyIndex('Grand Line');
g.world.regionalPressures['Grand Line'].Prospérité=86;
g.world.regionalPressures['Grand Line'].Criminalité=18;
g.world.regionalPressures['Grand Line'].Instabilité=14;
g.world.regionalPressures['Grand Line'].Marine=72;
const cheap=q.economyIndex('Grand Line');
assert(expensive>cheap+.15,'Regional state does not materially affect local prices');

// Restore conflict and verify world -> routes.
g.world.regionalPressures['Grand Line'].Piraterie=82;
g.world.regionalPressures['Grand Line'].Instabilité=78;
const dangerousRoute=q.travelRisk('Water 7','Enies Lobby');
g.world.regionalPressures['Grand Line'].Piraterie=12;
g.world.regionalPressures['Grand Line'].Instabilité=12;
const safeRoute=q.travelRisk('Water 7','Enies Lobby');
assert(dangerousRoute>safeRoute+8,'World state does not materially affect route risk');

// Player -> world through project mission.
g.world.regionalPressures['Grand Line'].Piraterie=82;
g.world.regionalPressures['Grand Line'].Instabilité=78;
const projectCause=q.causalMissions().find(m=>m.sourceType==='project'&&m.sourceId==='proj_qa_raid');
assert(projectCause,'Project mission vanished before consequence test');
const pm=q.missionFromCause(projectCause,0);
const project=g.world.projects.find(x=>x.id==='proj_qa_raid');
const progressBefore=project.progress;
const marineBefore=g.world.territoryState['Grand Line'].influence.Marine;
const ledgerBefore=g.world.causalV68.ledger.length;
const result=q.applyMission(pm,'success');
assert(project.progress<progressBefore,'Successful hostile-project mission did not slow the project');
assert(g.world.territoryState['Grand Line'].influence.Marine>marineBefore,'Successful mission did not increase player-faction influence');
assert(g.world.causalV68.ledger.length===ledgerBefore+1,'Player mission consequence not recorded in causal ledger');
assert(result.delta>0,'Successful mission should produce positive causal delta');

// Player -> world through crew mission.
const crewCause=q.causalMissions().find(m=>m.sourceType==='crew'&&m.targetCrewId==='crew_qa');
assert(crewCause,'Crew mission vanished before consequence test');
const cm=q.missionFromCause(crewCause,1),crew=g.world.emergentCrews.find(x=>x.id==='crew_qa');
const notorietyBefore=crew.notoriety,powerBefore=crew.power;
q.applyMission(cm,'success');
assert(crew.notoriety<notorietyBefore,'Successful anti-crew mission did not reduce notoriety');
assert(crew.power<=powerBefore,'Successful anti-crew mission increased target power');

// Player hooks must feed back into regional state.
const instabilityBefore=g.world.regionalPressures['Grand Line'].Instabilité;
const hook={id:'hook_qa',title:'Briser un réseau pirate',region:'Grand Line',type:'threat',urgency:75,difficulty:55,faction:'Pirates'};
q.applyHook(hook,true);
assert(g.world.regionalPressures['Grand Line'].Instabilité<instabilityBefore,'Successful threat hook did not reduce instability');
assert(g.world.causalV68.ledger.some(x=>x.sourceId==='hook_qa'&&x.player),'Hook consequence missing from causal ledger');

// Autonomous world event -> causal ledger.
const autoBefore=g.world.causalV68.ledger.length;
q.autonomousEvent('Blocus régional','Une faction ferme temporairement une route.','Grand Line',70,'conflict',['qa']);
assert(g.world.causalV68.ledger.length===autoBefore+1,'Autonomous event was not ingested by causal ledger');
assert(g.world.causalV68.ledger[0].title==='Blocus régional','Wrong autonomous cause recorded');

// Causal ledger stays bounded during world simulation.
for(let i=0;i<144;i++){
  q.advanceClock(1);
  q.simulateWorld(1);
  if(i%12===0)q.refreshMissionBoard();
  const rs=q.regionState(g.player.region);
  for(const k of ['crisis','opportunity','extraDanger','routeRisk','priceIndex','rewardIndex'])assert(Number.isFinite(rs[k]),`Non-finite causal regional metric: ${k}`);
}
assert(g.world.causalV68.ledger.length<=80,'Causal ledger retention exceeded 80');
assert(g.missionBoard.length===3,'Long causal simulation broke mission-board size');

console.log('V6.8 LIVE QA OK',JSON.stringify({
  runtime:'index.html inline engine',
  version:'6.8.0',
  initialCrisis:hot.crisis,
  initialPriceIndex:hot.priceIndex,
  expensivePrice:expensive,
  stabilizedPrice:cheap,
  dangerousRoute,
  safeRoute,
  causalMissionCount:g.missionBoard.filter(m=>m.causal).length,
  projectProgressChange:+(project.progress-progressBefore).toFixed(2),
  marineInfluenceGain:+(g.world.territoryState['Grand Line'].influence.Marine-marineBefore).toFixed(2),
  ledgerSize:g.world.causalV68.ledger.length,
  bidirectionalCausality:true,
  yearsStress:12
}));
