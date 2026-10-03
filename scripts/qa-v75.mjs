import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/world-canon-v75.js','utf8');
const engineSrc=fs.readFileSync('src/v75/world-canon-engine-v75.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'world-canon-v75.js'});
vm.runInContext(engineSrc,sandbox,{filename:'world-canon-engine-v75.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('worldCanonDataV75');
const engine=registry.get('worldCanonEngineV75');

assert(data&&engine,'V7.5 modules not registered');
eq(data.version,'7.5.0','World data version mismatch');
eq(engine.version,'7.5.0','World engine version mismatch');
eq(data.regions.length,6,'World region catalog mismatch');
assert(Object.keys(data.factionProfiles).length>=6,'Faction behavior profiles missing');
assert(Object.keys(data.eventAnchors).length>=10,'Canon event anchors too small');
lt(engine.factionRelation('Pirates','Marine'),0,'Pirates and Marine should be hostile');
gt(engine.factionRelation('Marine','Gouvernement'),0,'Marine and Government should cooperate');

const luffy={id:'luffy',name:'Monkey D. Luffy',faction:'Pirates',region:'Grand Line',currentRegion:'Grand Line',regions:['East Blue','Grand Line','New World'],power:82,importance:100,status:'alive',health:100,experience:80};
const smoker={id:'smoker',name:'Smoker',faction:'Marine',region:'Grand Line',currentRegion:'Grand Line',regions:['East Blue','Grand Line'],power:68,importance:72,status:'alive',health:100,experience:50};
const law={id:'law',name:'Trafalgar Law',faction:'Pirates',region:'Grand Line',currentRegion:'Grand Line',regions:['Grand Line','New World'],power:79,importance:87,status:'alive',health:100,experience:70};
const lowHealth={...luffy,id:'hurt',name:'Hurt Pirate',health:25,importance:70};
const freeFruit={id:'generic_para',name:'Fruit Paramecia inconnu',type:'Paramecia',status:'world',holder:null,region:'Grand Line'};

const luffyMoves=engine.regionOptions(luffy);
assert(luffyMoves.includes('East Blue')&&luffyMoves.includes('New World'),'Canonical region options missing');
assert(!luffyMoves.includes('North Blue'),'Actor moved outside canonical region constraints');

const ctx={actors:[luffy,smoker,law],fruits:[freeFruit],regionHeat:{'Grand Line':72}};
const candidates=engine.actionCandidates(luffy,ctx);
assert(candidates.some(x=>x.type==='clash'),'Hostile target should unlock clash');
assert(candidates.some(x=>x.type==='cooperate'),'Compatible target should unlock cooperation');
assert(candidates.some(x=>x.type==='fruit'),'Free Fruit should unlock Fruit search');
assert(engine.actionCandidates(lowHealth,{...ctx,actors:[lowHealth,smoker,law]}).some(x=>x.type==='recover'),'Low health should unlock recovery');

const actionA=engine.planAction(luffy,ctx,{action:.1,target:.2});
const actionB=engine.planAction(luffy,ctx,{action:.1,target:.2});
eq(JSON.stringify(actionA),JSON.stringify(actionB),'World Director plan must be deterministic for fixed rolls');

const clash=engine.resolveClash(luffy,smoker,.9);
assert([luffy.id,smoker.id].includes(clash.winnerId),'Clash winner invalid');
assert(clash.harm>=7&&clash.harm<=24,'Clash harm out of bounds');
assert(clash.injuryMonths>=1,'Clash injury missing');

const fruitWin=engine.resolveFruitSeek(luffy,freeFruit,0);
assert(fruitWin.success,'Strong actor with zero roll should secure free Fruit');
assert(fruitWin.chance>.5,'High-importance actor Fruit chance unexpectedly low');

const activeCrew={id:'straw_hat',name:'Straw Hat',leader:'luffy',region:'Grand Line',currentRegion:'Grand Line',status:'active',power:75,importance:100,momentum:60};
const movedLeader={...luffy,currentRegion:'New World'};
const follow=engine.syncCrew(activeCrew,movedLeader);
eq(follow.crew.currentRegion,'New World','Active crew did not follow living leader');
assert(follow.changes.some(x=>x.type==='follow_leader'),'Crew follow change missing');

const deadLeader={id:'whitebeard',name:'Edward Newgate',status:'dead',currentRegion:'Grand Line',power:98};
const wbCrew={id:'whitebeard_crew',name:'Whitebeard Pirates',leader:'whitebeard',region:'New World',currentRegion:'Grand Line',status:'active',power:98,importance:98,momentum:50};
const broken=engine.syncCrew(wbCrew,deadLeader);
eq(broken.crew.status,'fractured','Major crew should fracture after leader death');
assert(broken.crew.momentum<wbCrew.momentum,'Leader death should reduce crew momentum');

assert(engine.holderMatchesActor('Whitebeard',deadLeader),'Whitebeard alias did not match canonical actor');
assert(!engine.holderMatchesActor('Whitebeard',{id:'garp',name:'Monkey D. Garp'}),'Fruit alias matched wrong actor');
const released=engine.syncFruit({id:'gura',name:'Gura',holder:'Whitebeard',status:'held',region:'New World'},[deadLeader,luffy]);
assert(released.released,'Fruit was not released after holder death');
eq(released.fruit.status,'world','Released Fruit should return to world state');
eq(released.fruit.holder,null,'Released Fruit should have no holder');

const coherent=engine.eventCoherence({id:'marineford_war'},{characters:[{id:'ace',status:'alive'},{id:'whitebeard',status:'alive'}],crews:[{id:'whitebeard_crew',status:'active'}]});
assert(coherent.actorReady,'Marineford anchors should be coherent when all actors exist');
const brokenCanon=engine.eventCoherence({id:'marineford_war'},{characters:[{id:'ace',status:'dead'},{id:'whitebeard',status:'alive'}],crews:[{id:'whitebeard_crew',status:'active'}]});
assert(!brokenCanon.actorReady&&brokenCanon.missingCharacters.includes('ace'),'Dead anchor should block canonical event coherence');

const heatLow=engine.regionHeat('East Blue',{pressures:{'East Blue':{Instabilité:10,Piraterie:10,Marine:20,Révolution:5,Criminalité:8}},actors:[],crews:[]});
const heatHigh=engine.regionHeat('New World',{pressures:{'New World':{Instabilité:80,Piraterie:85,Marine:70,Révolution:40,Criminalité:60}},actors:[luffy,smoker,law],crews:[activeCrew]});
gt(heatHigh,heatLow,'Hotspot calculation does not distinguish dangerous regions');

const state=engine.normalizeState({lastDirectorMonth:0,totalActions:2});
eq(state.totalActions,2,'World state normalization lost action count');
const ledger=engine.ledgerEntry({actorId:'luffy',type:'move',region:'Grand Line',importance:90},{title:'Move',desc:'Desc'},120);
eq(ledger.actorId,'luffy','Ledger actor missing');
eq(ledger.month,120,'Ledger month missing');

// Live integration contract.
const saveVersion=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
const gameVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
assert(/ONE PIECE LIFE — V(?:7|8)\./.test(html),'V7+ release title missing');
assert(saveVersion>=750,'V7.5 regression QA requires save version >= 750');
const [gameMajor,gameMinor]=gameVersion.split('.').map(Number);
assert(gameMajor>7||(gameMajor===7&&gameMinor>=5),'V7.5 regression QA requires game version >= 7.5');
for(const asset of ['src/data/world-canon-v75.js','src/v75/world-canon-engine-v75.js']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v7-[5-9]-\d+/.test(sw),'PWA cache must remain at V7.5 or newer');
for(const fn of ['function v75Ensure','function v75WorldTick','function v75SyncCanonIntegrity','function v75ApplyAction','function v75EventCoherence','function renderV75WorldDirector']){
  assert(html.includes(fn),'Missing live V7.5 bridge '+fn);
}
assert(html.includes('id="v75WorldDirectorCard"'),'World Director UI missing');
assert(html.includes("worldV75:{version:1"),'Fresh-save V7.5 world state missing');
assert(html.includes('v75WorldTick(months)'),'World Director is not connected to world simulation');
assert(html.includes('const reqReady=v70CanonRequirementMet(e),req=V70_CANON_REQUIREMENTS[e.id]||[],coherence=v75EventCoherence(e);'),'Canon event state is not connected to actor coherence');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V7.5 WORLD & CANON QA OK',JSON.stringify({
  version:gameVersion,
  regions:data.regions.length,
  factionProfiles:Object.keys(data.factionProfiles).length,
  eventAnchors:Object.keys(data.eventAnchors).length,
  luffyMoves,
  fruitChance:fruitWin.chance,
  highHeat:heatHigh,
  lowHeat:heatLow,
  canonBlockers:brokenCanon.missingCharacters,
  migrationGuard:true
}));
