import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/voyage-v85.js','utf8');
const engineSrc=fs.readFileSync('src/v85/voyage-engine-v85.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'voyage-v85.js'});
vm.runInContext(engineSrc,sandbox,{filename:'voyage-engine-v85.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('voyageDataV85'),engine=registry.get('voyageEngineV85');
assert(data&&engine,'V8.5 voyage modules not registered');
eq(data.version,'8.5.0','Voyage data version mismatch');
eq(engine.version,'8.5.0','Voyage engine version mismatch');
eq(Object.keys(data.modes).length,4,'Travel mode count mismatch');
assert(Object.keys(data.weather).length>=8,'Weather catalog too small');
assert(Object.keys(data.hazards).length>=7,'Hazard catalog too small');
assert(Object.keys(data.discoveries).length>=7,'Discovery catalog too small');

const baseState=engine.normalizeState({poseLevel:1});
const spec={from:'Jaya',to:'Water 7',fromRegion:'Grand Line',toRegion:'Grand Line',fromDanger:43,toDanger:40,baseDuration:1.2,causalRisk:8,navigation:52,crewTravel:64,shipCondition:78};
const normal=engine.routeProfile(baseState,{...spec,mode:'standard'});
const cautious=engine.routeProfile(baseState,{...spec,mode:'cautious'});
const fast=engine.routeProfile(baseState,{...spec,mode:'fast'});
const explore=engine.routeProfile(baseState,{...spec,mode:'explore'});
gt(cautious.duration,normal.duration,'Cautious travel should be slower');
lt(cautious.risk,normal.risk,'Cautious travel should reduce risk');
lt(fast.duration,normal.duration,'Fast travel should reduce duration');
gt(fast.risk,normal.risk,'Fast travel should increase risk');
gt(explore.discovery,normal.discovery,'Exploration travel should increase discovery odds');

const noPose=engine.routeProfile(engine.normalizeState({poseLevel:0}),{...spec,mode:'standard'});
gt(noPose.duration,normal.duration,'Missing Log Pose should slow Grand Line travel');
gt(noPose.risk,normal.risk,'Missing Log Pose should increase Grand Line risk');

const knownState=engine.normalizeState({poseLevel:1,routeKnowledge:{[engine.routeKey('Jaya','Water 7')]:{trips:5,mastery:82,lastYear:19}}});
const known=engine.routeProfile(knownState,{...spec,mode:'standard'});
lt(known.duration,normal.duration,'Route mastery should reduce travel duration');
lt(known.risk,normal.risk,'Route mastery should reduce travel risk');
gt(known.familiarity,normal.familiarity,'Route familiarity should grow');

const calm=engine.weatherFor('East Blue',0);
assert(['calm','fair'].includes(calm.id),'East Blue low roll should yield favorable weather');
const nw=engine.weatherFor('New World',0);
eq(nw.id,'storm','New World low roll should yield storm profile');

const start=engine.startVoyage(baseState,explore,{year:20});
eq(start.voyage.mode,'explore','Voyage mode not persisted');
gt(start.state.voyages,baseState.voyages,'Voyage counter should increase');

const tick=engine.tickVoyage(start.state,start.voyage,{year:20,region:'Grand Line',navigation:52,crewTravel:64,shipCondition:78},.5,{weather:.7,event:0,hazard:.2,discovery:0,discoveryType:.3});
assert(tick.event,'Forced voyage hazard missing');
assert(tick.discovery,'Forced sea discovery missing');
gt(tick.progress,0,'Voyage should progress');
lt(tick.voyage.remaining,start.voyage.remaining+tick.event.delay,'Voyage progress invalid');
gt(tick.state.monthsAtSea,0,'Sea time should accumulate');

const arrived=engine.arrive(tick.state,{...tick.voyage,remaining:0},'Water 7',{year:20,region:'Grand Line',navigation:52},{mastery:.6,exploration:.5});
gt(arrived.route.mastery,0,'Arrival should improve route mastery');
gt(arrived.state.islands['Water 7'].exploration,0,'Arrival should initialize island exploration');
eq(arrived.state.successfulVoyages,1,'Successful voyage counter mismatch');

const newWorldArrival=engine.arrive(engine.normalizeState({poseLevel:1}),{from:'Fish-Man Island',destination:'Punk Hazard',incidents:0},'Punk Hazard',{year:22,region:'New World',navigation:60},{mastery:.5,exploration:.5});
eq(newWorldArrival.state.poseLevel,2,'New World arrival should upgrade navigation tier');

const local=engine.exploreIsland(arrived.state,'Water 7',{mode:'explore',year:20,navigation:52,stealth:35,knowledge:30,crewSupport:50},{progress:.7,discovery:0,type:.4});
gt(local.gain,0,'Island exploration gain missing');
gt(local.island.exploration,arrived.state.islands['Water 7'].exploration,'Island exploration should increase');
assert(local.discovery,'Forced island discovery missing');

const summary=engine.summary(local.state,'Water 7');
gt(summary.totalDiscoveries,0,'Discovery count missing');
gt(summary.knownRoutes,0,'Known routes summary missing');

assert(/ONE PIECE LIFE — V8\.\d+/.test(html),'V8.5+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=850,'Save version 850+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0',p=v.split('.').map(Number);assert(p[0]>8||(p[0]===8&&p[1]>=5),'Game version 8.5+ missing')}
for(const asset of ['src/data/voyage-v85.js','src/v85/voyage-engine-v85.js','src/v85/voyage-v85.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v8-[5-9]-\d+/.test(sw),'PWA cache must remain at V8.5 or newer');
assert(html.includes('v84Ensure();v85Ensure()'),'Old-save V8.5 migration hook missing');
for(const fn of ['function v85Module','function v85Ensure','function v85RoutePreview','function v85StartVoyage','function v85ResolveTravelDecision','function v85TickVoyage','function v85Arrive','function v85ExploreCurrent','function renderV85Exploration']){
  assert(html.includes(fn),'Missing live V8.5 bridge '+fn);
}
assert(html.includes("action:'v85travel:'"),'Travel mode decision actions missing');
assert(html.includes("if(parts[0]==='v85travel')v85ResolveTravelDecision(parts)"),'Travel mode decision route missing');
assert(html.includes("if(v85Module()){v85ExploreCurrent(mode);return}"),'Annual exploration V8.5 bridge missing');
assert(html.includes('id="v85ExplorationCard"'),'V8.5 exploration UI card missing');
assert(html.includes('renderV75WorldDirector();renderV82Campaigns();renderV83Nemeses();renderV85Exploration();'),'V8.5 world render hook missing');
assert(html.includes("v85Data()?.weather?.[p.travel.weather]"),'Dynamic voyage weather UI missing');

console.log('V8.5 VOYAGE & EXPLORATION 4.0 QA OK',JSON.stringify({
  version:'8.5.0',
  modes:Object.keys(data.modes).length,
  weather:Object.keys(data.weather).length,
  normalRisk:normal.riskPct,
  cautiousRisk:cautious.riskPct,
  fastDuration:fast.duration,
  explorationDiscovery:explore.discovery,
  masteredRisk:known.riskPct,
  incident:tick.event.id,
  seaDiscovery:tick.discovery.id,
  routeMastery:arrived.route.mastery,
  islandExploration:local.island.exploration
}));
