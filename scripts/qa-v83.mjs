import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const v80DataSrc=fs.readFileSync('src/data/simulation-core-v80.js','utf8');
const dataSrc=fs.readFileSync('src/data/antagonists-v83.js','utf8');
const engineSrc=fs.readFileSync('src/v83/antagonist-engine-v83.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function gte(a,b,msg){if(!(a>=b))throw new Error(msg+': '+a+' < '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(v80DataSrc,sandbox,{filename:'simulation-core-v80.js'});
vm.runInContext(dataSrc,sandbox,{filename:'antagonists-v83.js'});
vm.runInContext(engineSrc,sandbox,{filename:'antagonist-engine-v83.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('antagonistDataV83');
const engine=registry.get('antagonistEngineV83');
const v80=registry.get('simulationCoreDataV80');

assert(data&&engine,'V8.3 modules not registered');
eq(data.version,'8.3.0','Antagonist data version mismatch');
eq(engine.version,'8.3.0','Antagonist engine version mismatch');
eq(Object.keys(data.archetypes).length,7,'Antagonist archetype count mismatch');
assert(Object.keys(data.factionArchetypes).length>=6,'Faction antagonist profiles missing');
assert(Object.keys(data.actions).length>=4,'Antagonist action catalog too small');
assert(Object.keys(data.encounterChoices).length===4,'Nemesis encounter choice count mismatch');
assert(v80.interruptionKinds.nemesis,'Priority Director nemesis kind missing');
assert(v80.narrativeDomains.relation.patterns.includes('némésis'),'Nemesis narrative relation pattern missing');
assert(v80.narrativeDomains.world.patterns.includes('antagoniste'),'Antagonist world narrative pattern missing');
assert(v80.legacyCategories.relation.patterns.includes('némésis'),'Nemesis legacy relation pattern missing');

const rolls={id:.21,archetype:.74,motivation:.45,temperament:.36,potential:.72,growth:.61,cunning:.82,resolve:.73,charisma:.58,lieutenants:[.1,.2,.3,.4,.5,.6,.7,.8,.9]};
const created=engine.createAntagonist(
  {id:'boss_test',name:'Kael Voss',faction:'Pirates',power:66},
  {region:'Grand Line',threat:82,campaignId:'campaign_test'},
  rolls
);
eq(created.name,'Kael Voss','Antagonist identity mismatch');
eq(created.region,'Grand Line','Antagonist region mismatch');
eq(created.currentCampaignId,'campaign_test','Campaign binding missing');
assert(created.lieutenants.length>=2,'High-threat antagonist should have lieutenants');
gt(created.potentialPower,created.power,'Antagonist potential should exceed current power');
gt(engine.effectivePower(created),created.power,'Lieutenants/cunning should contribute to effective power');

const beforeRivalry=created.rivalry;
const encounter=engine.recordEncounter(created,{outcome:'success',opposed:true,year:20,region:'Grand Line',direct:true,danger:3,importance:'major',label:'Duel de campagne'});
eq(encounter.encounters,1,'Encounter count mismatch');
eq(encounter.losses,1,'Antagonist loss count mismatch');
gt(encounter.rivalry,beforeRivalry,'Player victory should intensify rivalry');
gt(encounter.respect,created.respect,'Player victory should increase antagonist respect');
assert(encounter.memories.some(x=>x.label==='Duel de campagne'),'Encounter memory missing');

const tick=engine.annualTick(encounter,{year:21},{growth:.5,action:.25,effect:.7,nameA:.2,nameB:.7});
assert(tick.changed,'Antagonist annual tick should run');
gte(tick.antagonist.power,encounter.power,'Antagonist should not lose power during normal growth');
assert(['scheme','recruit','train','hunt'].includes(tick.action),'Unknown antagonist autonomous action');
assert(Number.isFinite(tick.campaignSwing),'Campaign swing missing from antagonist action');

const escaped=engine.survivalOutcome(encounter,{year:21,margin:12,playerContribution:8,campaignId:'campaign_test'},0);
assert(escaped.survives,'Low survival roll should allow procedural antagonist escape');
eq(escaped.antagonist.status,'escaped','Escaping antagonist status mismatch');
eq(escaped.antagonist.currentCampaignId,null,'Escaping antagonist must detach from resolved campaign');
gt(escaped.antagonist.escapes,created.escapes,'Escape counter should increase');

const finalDefeat=engine.survivalOutcome(encounter,{year:21,margin:36,playerContribution:35,campaignId:'campaign_test'},.999);
assert(!finalDefeat.survives,'Extreme losing conditions should permit final defeat');
eq(finalDefeat.antagonist.status,'retired','Final defeat must retire procedural antagonist');

const canon=engine.normalizeAntagonist({...created,canonId:'canon_actor',currentCampaignId:'canon_campaign'});
const canonSurvival=engine.survivalOutcome(canon,{year:22,margin:40,playerContribution:40,campaignId:'canon_campaign'},.999);
assert(canonSurvival.survives,'Canon antagonist must not be procedurally deleted');
eq(canonSurvival.antagonist.currentCampaignId,null,'Canon antagonist must detach from finished campaign');
eq(canonSurvival.antagonist.lastCampaignId,'canon_campaign','Canon campaign memory missing');

const strong=engine.normalizeAntagonist({
  ...escaped.antagonist,status:'escaped',currentCampaignId:null,region:'Grand Line',returnCooldownUntil:22,lastDecisionYear:20,
  rivalry:88,respect:74,obsession:82,heat:78,power:83,potentialPower:96,encounters:6,escapes:2,campaigns:3
});
gt(engine.nemesisScore(strong),64,'Strong recurring antagonist should reach major-rival tier');
const ret=engine.bestReturn([strong],{region:'Grand Line',faction:'Pirates',year:25},0);
assert(ret&&ret.a.id===strong.id,'Eligible recurring antagonist should be reusable by a future campaign');
const candidate=engine.reappearanceCandidate([strong],{region:'Grand Line',year:25},0);
assert(candidate&&candidate.antagonistId===strong.id,'Strong local nemesis should create a Priority Director candidate');

const decision=engine.encounterDecision(strong);
eq(decision.choices.length,4,'Nemesis encounter decision options mismatch');
const playerCtx={year:25,region:'Grand Line',skills:{Combat:92,Discrétion:78,Commandement:80,Navigation:70},stats:{Combat:0,Discrétion:0,Commandement:0,Navigation:0},power:91,authority:50,organization:22,worldRep:56};
const direct=engine.resolveEncounterChoice(strong,'direct',playerCtx,0);
assert(direct.success,'High-level player should succeed on deterministic low roll');
eq(direct.antagonist.lastDecisionYear,25,'Nemesis encounter yearly gate not updated');
gt(direct.antagonist.encounters,strong.encounters,'Nemesis encounter should be remembered');
const avoided=engine.resolveEncounterChoice(strong,'avoid',playerCtx,.5);
assert(avoided.avoided,'Avoid option should not force combat');
gt(avoided.antagonist.obsession,strong.obsession,'Avoiding nemesis should increase obsession');

assert(html.includes('ONE PIECE LIFE — V8.3'),'V8.3 title missing');
assert(/const SAVE_VERSION\s*=\s*830;/.test(html),'Save version 830 missing');
assert(/const GAME_VERSION\s*=\s*'8\.3\.0';/.test(html),'Game version 8.3.0 missing');
for(const asset of ['src/data/antagonists-v83.js','src/v83/antagonist-engine-v83.js','src/v83/antagonists-v83.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(sw.includes('one-piece-life-v8-3-0'),'PWA cache not bumped to V8.3');
assert(html.includes('antagonistV83:{version:1'),'Fresh antagonist state missing');
assert(html.includes('v80Ensure();v81Ensure();v82Ensure();v83Ensure();'),'Old-save V8.3 migration hook missing');
assert(html.includes('id="v83NemesisCard"'),'Nemesis UI card missing');

for(const fn of ['function v83Module','function v83Ensure','function v83PromoteRival','function v83BindCampaign','function v83CampaignTick','function v83RecordCampaignDecision','function v83RecordCampaignMission','function v83CampaignResolved','function v83AnnualWorldTick','function v83Candidate','function v83QueueNemesis','function v83ResolveDecision','function v83FromLegacyRivalHook','function renderV83Nemeses']){
  assert(html.includes(fn),'Missing live V8.3 bridge '+fn);
}
assert(html.includes("kind:'nemesis'"),'Nemesis is not connected to Priority Director');
assert(html.includes("else if(c.kind==='nemesis')queued=v83QueueNemesis(c.payload)"),'Nemesis queue missing');
assert(html.includes("if(parts[0]==='v83nemesis')v83ResolveDecision(parts)"),'Nemesis decision route missing');
assert(html.includes('v83AnnualWorldTick();v82AnnualWorldTick();const newEvents='),'Nemesis annual tick must run before campaign/Life Director snapshot');
assert(html.includes('return v83BindCampaign(campaign)'),'Campaign boss binding missing');
assert(html.includes('v83CampaignResolved(campaign);'),'Campaign resolution survival hook missing');
assert(html.includes('v83CampaignTick(slot.active,year);'),'Campaign antagonist autonomous tick missing');
assert(html.includes('v83RecordCampaignDecision(result.campaign,result,choiceId);'),'Campaign decision nemesis memory hook missing');
assert(html.includes('v83RecordCampaignMission(slot.active,m,outcome);'),'Campaign mission nemesis memory hook missing');
assert(html.includes('v83PromoteRival(r);'),'Legacy rival promotion missing');
assert(html.includes('v83FromLegacyRivalHook(r,success,approach)'),'Legacy rival encounter delegation missing');
assert(html.includes('renderV75WorldDirector();renderV82Campaigns();renderV83Nemeses();'),'Nemesis world render hook missing');
assert(html.includes('const nemesis=v83LocalThreat();if(nemesis)d+=nemesis.heat*.035'),'Nemesis danger integration missing');

console.log('V8.3 NEMESIS & RIVALRY 4.0 QA OK',JSON.stringify({
  version:'8.3.0',
  archetypes:Object.keys(data.archetypes).length,
  lieutenants:created.lieutenants.length,
  effectivePower:engine.effectivePower(created),
  rivalryAfterDuel:encounter.rivalry,
  autonomousAction:tick.action,
  escapeChance:escaped.chance,
  nemesisScore:engine.nemesisScore(strong),
  tier:engine.tier(strong).label,
  reappearance:candidate.label,
  directChance:direct.chance
}));
