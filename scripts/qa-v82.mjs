import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const v80DataSrc=fs.readFileSync('src/data/simulation-core-v80.js','utf8');
const dataSrc=fs.readFileSync('src/data/campaigns-v82.js','utf8');
const engineSrc=fs.readFileSync('src/v82/campaign-engine-v82.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(v80DataSrc,sandbox,{filename:'simulation-core-v80.js'});
vm.runInContext(dataSrc,sandbox,{filename:'campaigns-v82.js'});
vm.runInContext(engineSrc,sandbox,{filename:'campaign-engine-v82.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('campaignDataV82');
const engine=registry.get('campaignEngineV82');
const v80=registry.get('simulationCoreDataV80');

assert(data&&engine,'V8.2 modules not registered');
eq(data.version,'8.2.0','Campaign data version mismatch');
eq(engine.version,'8.2.0','Campaign engine version mismatch');
eq(data.phases.length,4,'Campaign phase count mismatch');
assert(Object.keys(data.archetypes).length>=6,'Campaign archetype catalog too small');
assert(Object.keys(data.regionFlavor).length===6,'Region flavor catalog must cover six regions');
assert(v80.interruptionKinds.campaign,'V8.0 Priority Director is not extended with campaign interruptions');
assert(v80.narrativeDomains.world.patterns.includes('campagne'),'Campaign narrative pattern missing');
assert(v80.legacyCategories.world.patterns.includes('campagne'),'Campaign legacy pattern missing');

const regions=['East Blue','North Blue','West Blue','South Blue','Grand Line','New World'];
const state=engine.normalizeState({},regions);
for(const r of regions)assert(state.regions[r],'Missing campaign region state '+r);

const ctx={region:'Grand Line',leader:'Marine',second:'Pirates',leaderInfluence:62,secondInfluence:53,incumbentInfluence:62,challengerInfluence:53,crisis:78,contest:82,projects:3,crews:4};
gt(engine.startChance(ctx),.15,'High regional crisis should create meaningful saga start chance');
assert(engine.shouldStart(state.regions['Grand Line'],ctx,20,0),'Zero roll should start an eligible campaign');

const campaign=engine.startCampaign(ctx,20,{balance:.4,duration:.8,boss:.2,figure:.7});
eq(campaign.region,'Grand Line','Campaign region mismatch');
eq(campaign.incumbent,'Marine','Campaign incumbent mismatch');
eq(campaign.challenger,'Pirates','Campaign challenger mismatch');
assert(campaign.targetYears>=2&&campaign.targetYears<=5,'Campaign duration out of bounds');
assert(campaign.boss&&campaign.localFigure,'Campaign figures missing');
eq(campaign.pendingDecisionPhase,0,'New campaign must expose its opening decision');

const opening=engine.decisionCandidate(campaign,{region:'Grand Line',age:22});
assert(opening&&opening.phaseIndex===0,'Opening campaign decision missing');
const openingChoices=engine.decision(campaign,{region:'Grand Line'});
assert(openingChoices.choices.some(x=>x.id==='incumbent'),'Opening incumbent choice missing');
assert(openingChoices.choices.some(x=>x.id==='challenger'),'Opening challenger choice missing');
assert(openingChoices.choices.some(x=>x.id==='independent'),'Opening independent choice missing');

const playerCtx={region:'Grand Line',age:22,year:20,playerFaction:'Pirates',skills:{Combat:75,Commandement:54,Discrétion:61,Navigation:55},stats:{Combat:0,Commandement:0,Discrétion:0,Navigation:0},power:68,authority:25,organization:8,worldRep:22};
const joined=engine.resolveDecision(campaign,'challenger',playerCtx,0);
assert(!joined.error,'Opening campaign decision failed');
eq(joined.campaign.playerSide,'challenger','Opening campaign side not stored');
gt(joined.campaign.balance,campaign.balance,'Successful challenger support should move balance toward challenger');
eq(joined.campaign.lastDecisionPhase,0,'Opening campaign phase must be marked handled');

let escalated={...joined.campaign,stakes:72,phaseIndex:2,pendingDecisionPhase:2,lastDecisionPhase:1,boss:{...joined.campaign.boss,power:76}};
const climaxCandidate=engine.decisionCandidate(escalated,{region:'Grand Line',age:22});
assert(climaxCandidate&&climaxCandidate.bossPhase,'Climax decision should expose boss phase');
const direct=engine.resolveDecision(escalated,'direct',playerCtx,0);
assert(direct.success,'Strong direct intervention should succeed with low roll');
gt(direct.campaign.balance,escalated.balance,'Successful challenger tactic should move campaign balance');
gt(direct.campaign.playerContribution,escalated.playerContribution,'Player contribution should increase');

const mission=engine.missionCandidate(direct.campaign,{region:'Grand Line',playerFaction:'Pirates'});
assert(mission&&mission.campaignId===direct.campaign.id,'Campaign mission missing');
assert(mission.sourceType==='campaign','Campaign mission source type mismatch');
gt(mission.power,0,'Campaign mission boss power missing');
const missionWin=engine.missionImpact(direct.campaign,{side:'challenger',outcome:'success',danger:'high',year:21});
gt(missionWin.campaign.balance,direct.campaign.balance,'Campaign mission success should help selected side');

const beforeIndependent={...campaign,playerSide:'independent',stakes:72};
const protect=engine.resolveDecision(beforeIndependent,'preserve',{...playerCtx,playerFaction:'Civil'},0);
lt(protect.campaign.stakes,beforeIndependent.stakes,'Independent preservation should reduce campaign stakes');

const annualBase={...campaign,lastTickYear:19,stakes:40,phaseIndex:0,balance:48};
const annual=engine.annualTick(annualBase,{...ctx,incumbentInfluence:58,challengerInfluence:60},20,.95);
assert(annual.changed,'Annual campaign tick should run once');
assert(annual.campaign.lastTickYear===20,'Annual campaign tick year mismatch');
const annualAgain=engine.annualTick(annual.campaign,{...ctx,incumbentInfluence:58,challengerInfluence:60},20,.1);
assert(!annualAgain.changed,'Annual campaign tick must be idempotent per year');

const nearWin={...campaign,balance:85,lastTickYear:20,startedYear:18,phaseIndex:3,stakes:92};
const resolved=engine.annualTick(nearWin,{...ctx,incumbentInfluence:48,challengerInfluence:72},21,.8);
assert(resolved.resolved,'Campaign above collapse threshold should resolve');
eq(resolved.campaign.winner,'Pirates','Campaign winner mismatch');
eq(resolved.campaign.status,'resolved','Campaign status should be resolved');

assert(html.includes('ONE PIECE LIFE — V8.2'),'V8.2 title missing');
assert(/const SAVE_VERSION\s*=\s*820;/.test(html),'Save version 820 missing');
assert(/const GAME_VERSION\s*=\s*'8\.2\.0';/.test(html),'Game version 8.2.0 missing');
for(const asset of ['src/data/campaigns-v82.js','src/v82/campaign-engine-v82.js','src/v82/campaigns-v82.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(sw.includes('one-piece-life-v8-2-0'),'PWA cache not bumped to V8.2');
assert(html.includes('campaignV82:{version:1'),'Fresh campaign state missing');
assert(html.includes('v80Ensure();v81Ensure();v82Ensure();'),'Old-save V8.2 migration hook missing');
assert(html.includes('id="v82CampaignCard"'),'Campaign UI card missing');
for(const fn of ['function v82Module','function v82Ensure','function v82RegionContext','function v82AnnualWorldTick','function v82Candidate','function v82QueueCampaign','function v82ResolveDecision','function v82CampaignMissionCandidate','function v82RecordMissionOutcome','function renderV82Campaigns']){
  assert(html.includes(fn),'Missing live V8.2 bridge '+fn);
}
assert(html.includes("kind:'campaign'"),'Campaign is not connected to Priority Director');
assert(html.includes("else if(c.kind==='campaign')queued=v82QueueCampaign(c.payload)"),'Campaign queue missing');
assert(html.includes("if(parts[0]==='v82campaign')v82ResolveDecision(parts)"),'Campaign decision route missing');
assert(html.includes('v69Milestones();v82AnnualWorldTick();const newEvents='),'Campaign annual tick must run before Life Director snapshot');
assert(html.includes('const campaign=v82CampaignMissionCandidate();if(campaign)add(campaign);'),'Campaign mission board injection missing');
assert(html.includes("v81RecordMissionOutcome(m,'success');v82RecordMissionOutcome(m,'success');"),'Campaign mission success hook missing');
assert(html.includes("v81RecordMissionOutcome(m,'partial');v82RecordMissionOutcome(m,'partial');"),'Campaign mission partial hook missing');
assert(html.includes("v82RecordMissionOutcome(m,retreated?'retreat':'failure');"),'Campaign mission failure hook missing');
assert(html.includes('renderV75WorldDirector();renderV82Campaigns();'),'Campaign world render hook missing');
assert(html.includes('const campaign=v82LocalCampaign();if(campaign)d+=campaign.threat*.08+campaign.stakes*.05;'),'Campaign danger integration missing');

console.log('V8.2 REGIONAL SAGAS & CAMPAIGNS 4.0 QA OK',JSON.stringify({
  version:'8.2.0',
  phases:data.phases.length,
  archetypes:Object.keys(data.archetypes).length,
  startChance:engine.startChance(ctx),
  campaign:campaign.title,
  targetYears:campaign.targetYears,
  openingSide:joined.campaign.playerSide,
  directChance:direct.chance,
  missionPower:mission.power,
  resolvedWinner:resolved.campaign.winner
}));
