import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/simulation-core-v80.js','utf8');
const engineSrc=fs.readFileSync('src/v80/simulation-core-v80.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'simulation-core-v80.js'});
vm.runInContext(engineSrc,sandbox,{filename:'simulation-core-v80.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('simulationCoreDataV80');
const engine=registry.get('simulationCoreEngineV80');

assert(data&&engine,'V8.0 modules not registered');
eq(data.version,'8.0.0','Simulation-core data version mismatch');
eq(engine.version,'8.0.0','Simulation-core engine version mismatch');
assert(Object.keys(data.interruptionKinds).length>=4,'Interruption kind catalog too small');
assert(Object.keys(data.narrativeDomains).length>=7,'Narrative-domain catalog too small');
assert(Object.keys(data.legacyCategories).length>=7,'Legacy category catalog too small');

const fresh=engine.normalizeState({});
eq(fresh.director.chapterHistory.length,0,'Fresh chapter history should be empty');
eq(fresh.legacy.count,0,'Fresh legacy ledger should be empty');
eq(fresh.render.total,0,'Fresh render counter should be zero');

const interruptionState=engine.normalizeState({director:{interruptionHistory:[
  {kind:'personal',month:118,score:70},{kind:'personal',month:112,score:62}
]}});
const ranked=engine.rankInterruptions([
  {kind:'personal',id:'p',importance:72,severity:55,personal:true},
  {kind:'consequence',id:'c',importance:78,severity:82,causal:true,mandatory:true},
  {kind:'education',id:'e',importance:65,severity:20,ageCritical:true}
],{nowMonth:120},interruptionState);
eq(ranked[0].kind,'consequence','Mandatory severe consequence should win arbitration');
const personalRepeated=engine.scoreInterruption({kind:'personal',importance:70,severity:50,personal:true},{nowMonth:120},interruptionState);
const personalFresh=engine.scoreInterruption({kind:'personal',importance:70,severity:50,personal:true},{nowMonth:120},engine.normalizeState({}));
lt(personalRepeated,personalFresh,'Recent interruption repetition should be penalized');

const events=[
  {id:'h1',title:'Promotion au commandement',desc:'Tu prends la tête d’une unité.',type:'major',ageMonths:240,worldYear:20},
  {id:'h2',title:'Économie structurelle',desc:'Tes actifs produisent leurs revenus.',type:'normal',ageMonths:240,worldYear:20},
  {id:'h3',title:'Événement historique',desc:'Une guerre modifie la région.',type:'canon',ageMonths:240,worldYear:20},
  {id:'h4',title:'Retrouvailles familiales',desc:'Ta famille se retrouve.',type:'major',ageMonths:240,worldYear:20},
  {id:'h5',title:'Petite progression',desc:'Tu gagnes un peu d’expérience.',type:'normal',ageMonths:240,worldYear:20}
];
const narrative=engine.annualNarrative(events,{year:20,worldDivergence:50});
assert(narrative.primary,'Annual narrative should select a primary event');
eq(narrative.primary.title,'Événement historique','Canon event should dominate this annual narrative');
assert(narrative.secondary.length<=2,'Annual narrative should cap secondary events');
gt(narrative.compressed,0,'Annual narrative should compress low-priority changes');

let directorState=engine.advanceDirector(fresh,narrative,{year:20,nowMonth:240});
assert(directorState.director.currentChapter,'Significant year should open a chapter');
eq(directorState.director.currentChapter.beats,1,'New chapter beat count mismatch');

const narrative2=engine.annualNarrative([
  {id:'h6',title:'Nouvelle crise mondiale',desc:'La guerre continue.',type:'canon',ageMonths:252,worldYear:21}
],{year:21,worldDivergence:55});
directorState=engine.advanceDirector(directorState,narrative2,{year:21,nowMonth:252});
eq(directorState.director.currentChapter.beats,2,'Same-theme significant year should merge into chapter');

const relationNarrative=engine.annualNarrative([
  {id:'h7',title:'Foyer agrandi',desc:'Un enfant rejoint le foyer.',type:'major',ageMonths:264,worldYear:22}
],{year:22,worldDivergence:55});
directorState=engine.advanceDirector(directorState,relationNarrative,{year:22,nowMonth:264});
assert(directorState.director.chapterHistory.length>=1,'Meaningful replaced chapter should archive');
eq(directorState.director.currentChapter.theme,'relation','New narrative theme should open a relation chapter');

let ledger=engine.normalizeState({});
const major={id:'x1',title:'Éveil du Haki',desc:'Maîtrise exceptionnelle.',type:'major',ageMonths:200,worldYear:17};
const evidence=engine.evidenceFromHistory(major);
assert(evidence.some(x=>x.category==='mastery'),'Haki milestone should create mastery evidence');
for(const e of evidence)ledger=engine.recordEvidence(ledger,e);
const beforeDup=ledger.legacy.count;
for(const e of evidence)ledger=engine.recordEvidence(ledger,e);
eq(ledger.legacy.count,beforeDup,'Duplicate evidence must not be counted twice');

for(let i=0;i<100;i++){
  ledger=engine.recordEvidence(ledger,{id:'lead_'+i,category:'leadership',label:'Promotion '+i,score:2,ageMonths:200+i,worldYear:17+i});
}
assert(ledger.legacy.entries.length<=80,'Legacy ledger entry list must stay bounded');
assert(ledger.legacy.totals.leadership.count>=100,'Permanent legacy totals must survive entry rotation');
assert(ledger.legacy.totals.leadership.score<=data.legacyCategories.leadership.cap,'Legacy category score cap failed');

const evidenceScore=engine.permanentEvidenceScore(ledger);
gt(evidenceScore,0,'Permanent evidence score missing');
const combined=engine.legacyScore(ledger,{currentScore:35});
assert(combined>=evidenceScore&&combined>=35,'Legacy score must preserve strongest durable evidence');
let peak=engine.updateLegacyPeak(ledger,combined);
peak=engine.updateLegacyPeak(peak,10);
eq(peak.legacy.scorePeak,combined,'Legacy peak must never decrease');

const renderLife=engine.renderPlan('life');
eq(renderLife.tabs.length,1,'Lazy render should target only one heavy tab');
eq(renderLife.tabs[0],'life','Life render route mismatch');
const renderWorld=engine.renderPlan('world');
eq(renderWorld.tabs[0],'world','World render route mismatch');

// Live integration contract.
assert(/ONE PIECE LIFE — V8\.\d+/.test(html),'V8.x title missing');
const liveSave=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
assert(liveSave>=800,'Save version 800+ missing');
const liveVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
assert(Number(liveVersion.split('.')[0])>=8,'Game version 8.x+ missing');
for(const asset of ['src/data/simulation-core-v80.js','src/v80/simulation-core-v80.js','src/v80/simulation-core-v80.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v8-\d+-\d+/.test(sw),'PWA cache not on V8.x');
assert(html.includes("coreV80:{version:1"),'Fresh V8.0 core state missing');
assert(html.includes('v80Ensure();'),'Old-save V8.0 migration hook missing');
assert(html.includes('id="v80DirectorCard"'),'Life Director UI card missing');
for(const fn of ['function v80Ensure','function v80ObserveHistory','function v80CollectInterruptionCandidates','function v80PriorityInterrupt','function v80CompleteYear','function v80LegacyScore','function v80RenderActiveTab','function renderV80Director']){
  assert(html.includes(fn),'Missing live V8.0 bridge '+fn);
}
assert(html.includes('v80ObserveHistory(event)'), 'History is not connected to permanent legacy ledger');
assert(html.includes('if(!game.pendingDecision)v80PriorityInterrupt()'),'Annual interruption arbitration missing');
assert(html.includes('v80CompleteYear(newEvents,report)'),'Annual Life Director completion hook missing');
assert(html.includes('const score=v80LegacyScore(raw);'),'V6.9 legacy score not protected by V8.0 ledger');
assert(html.includes('v80RenderActiveTab(v80ActiveTab(),false);renderDev();v76AfterRender()'),'Main render is not routed through V8.0 lazy rendering');
assert(!html.includes('renderTimeline();renderCharacter();renderAbilities();renderRelations();renderWorld();renderDev();v76AfterRender()'),'Old eager five-panel render still present');
assert(html.includes("if(previous!==tab)v80RenderActiveTab(tab,true)"),'Tab opening does not refresh the newly active panel');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V8.0 SIMULATION CORE & LIFE DIRECTOR QA OK',JSON.stringify({
  version:'8.0.0',
  interruptionKinds:Object.keys(data.interruptionKinds).length,
  narrativeDomains:Object.keys(data.narrativeDomains).length,
  legacyCategories:Object.keys(data.legacyCategories).length,
  topInterruption:ranked[0].kind,
  repeatPenalty:+(personalFresh-personalRepeated).toFixed(1),
  compressed:narrative.compressed,
  archivedChapters:directorState.director.chapterHistory.length,
  ledgerEntries:ledger.legacy.entries.length,
  permanentLeadershipCount:ledger.legacy.totals.leadership.count,
  evidenceScore,
  lazyTabs:renderLife.tabs.length
}));
