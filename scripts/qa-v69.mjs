import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Inline live-game script missing from index.html');

let source=match[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source.includes(initCall)) throw new Error('Unable to instrument live V6.9 engine: init marker missing');

source=source.replace(initCall,`window.__v69qa={
  initialGame,
  setGame(v){game=v},
  getGame(){return game},
  ensure:ensureV6,
  ensure69:v69Ensure,
  careerTier:v69CareerTier,
  pathLabel:v69PathLabel,
  assetLabels:v69AssetLabels,
  assetCost:v69AssetCost,
  annualEconomy:v69AnnualEconomy,
  networkBonus:v69NetworkMissionBonus,
  wealthTier:v69WealthTier,
  legacyScore:v69LegacyScore,
  milestones:v69Milestones,
  directiveOptions:v69DirectiveOptions,
  strategicAction:v69StrategicAction,
  buyAsset:v69BuyAsset,
  canDelegate:v69CanDelegate,
  delegate:v69DelegateMission,
  missionAuthorityBonus:v69MissionAuthorityBonus,
  endgameTitle:v69EndgameTitle,
  regionState:v68RegionState,
  missionPreview:v65MissionPreview,
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
fakeElement('#seedInput').value='690069';
fakeElement('#nameInput').value='QA Endgame';
fakeElement('#difficultyInput').value='Casual';

const localStorage={getItem(){return null},setItem(){},removeItem(){},clear(){}};
const document={visibilityState:'visible',querySelector:fakeElement,querySelectorAll(){return[]},addEventListener(){},removeEventListener(){}};
const sandbox={
  console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,Promise,
  parseInt,parseFloat,isFinite,isNaN,encodeURIComponent,decodeURIComponent,
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(fn){if(typeof fn==='function')fn();return 1},
  localStorage,document,navigator:{userAgent:'V6.9-QA',clipboard:{writeText(){return Promise.resolve()}}},
  location:{protocol:'https:'},indexedDB:undefined
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.scrollTo=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'index-live-v69.js'});
const q=sandbox.__v69qa;
if(!q) throw new Error('Live V6.9 QA API was not exposed');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: got ${actual}, expected ${expected}`)}

assert(html.includes('ONE PIECE LIFE — V6.9'),'V6.9 title missing');
assert(html.includes('const SAVE_VERSION = 690;'),'Save version 690 missing');
assert(html.includes("const GAME_VERSION = '6.9.0';"),'Game version 6.9.0 missing');
for(const marker of [
  'function v69CareerTier',
  'function v69AnnualEconomy',
  'function v69StrategicAction',
  'function v69BuyAsset',
  'function v69CanDelegate',
  'function v69DelegateMission',
  'function v69LegacyScore',
  'function renderV69Endgame',
  'id="v69EndgameCard"',
  'id="v69AssetsCard"'
]) assert(html.includes(marker),`Missing V6.9 integration: ${marker}`);

// Low-level career should not unlock command gameplay.
let g=q.initialGame();q.setGame(g);
g.ageMonths=20*12;g.clock.year=20;g.player.faction='Marine';g.player.career='Marine';g.player.rank='Recrue';
g.player.skills.Commandement=18;g.player.skills.Combat=24;g.player.stats.Discipline=24;g.player.reputation.marine=5;g.player.reputation.world=0;
q.ensure();
const low=q.careerTier();
assert(low.tier<2,'Marine recruit unexpectedly unlocked strategic command');
eq(q.directiveOptions().length,0,'Low-level career should have no directives');
assert(!q.canDelegate({id:'low',danger:'low',power:8}),'Low-level career should not delegate missions');

// High-level career changes phase.
g.player.rank='Vice-Amiral';
for(const k of Object.keys(g.player.skills))g.player.skills[k]=Math.max(g.player.skills[k]||0,78);
for(const k of Object.keys(g.player.stats))g.player.stats[k]=Math.max(g.player.stats[k]||0,78);
g.player.reputation.marine=92;g.player.reputation.world=74;g.player.careerPrestige.level=3;g.player.money=5000000;
g.world.regionalPressures[g.player.region].Instabilité=76;
g.world.regionalPressures[g.player.region].Criminalité=64;
g.world.regionalPressures[g.player.region].Prospérité=58;
g.world.territoryState[g.player.region].influence.Marine=52;
q.ensure();
const high=q.careerTier();
assert(high.tier===3,'Vice-Admiral high-performance fixture should reach strategic tier');
assert(high.authority>75,'Strategic fixture authority unexpectedly low');
assert(q.directiveOptions().length>=3,'Strategic tier did not unlock directives');
assert(q.canDelegate({id:'medium',danger:'medium',power:30}),'Strategic tier should delegate medium missions');

// Strategic directive must alter the causal world and be annual-limited.
const region=g.player.region;
const instBefore=g.world.regionalPressures[region].Instabilité;
const ledgerBefore=g.world.causalV68.ledger.length;
const moneyBeforeDirective=g.player.money;
assert(q.strategicAction('stabilize')===true,'Strategic stabilize directive failed');
assert(g.world.regionalPressures[region].Instabilité<instBefore,'Strategic directive did not stabilize region');
assert(g.world.causalV68.ledger.length===ledgerBefore+1,'Strategic directive missing from causal ledger');
assert(g.player.money<moneyBeforeDirective,'Strategic directive did not consume resources');
assert(q.strategicAction('influence')===false,'Second strategic directive in same year should be blocked');

// Durable assets must cost money and persist.
const enterpriseBefore=g.player.economy.assets.enterprise;
const moneyBeforeAsset=g.player.money;
assert(q.buyAsset('enterprise')===true,'Enterprise asset purchase failed');
eq(g.player.economy.assets.enterprise,enterpriseBefore+1,'Enterprise level did not increase');
assert(g.player.money<moneyBeforeAsset,'Asset purchase did not cost money');
assert(q.buyAsset('network')===false,'Second major asset in same year should be blocked');

// Structural economy: once per year, with income and upkeep.
g.player.endgameV69.lastAnnualEconomyYear=-99;
const moneyPreEconomy=g.player.money;
const economy1=q.annualEconomy();
assert(economy1.income>0,'Enterprise did not generate structural income');
assert(economy1.upkeep>0,'Assets did not generate upkeep');
eq(g.player.money,moneyPreEconomy+economy1.net,'Structural economy net not applied to money');
const economyDuplicate=q.annualEconomy();
eq(economyDuplicate.net,0,'Structural economy paid twice in same year');
q.advanceClock(12);
const economy2=q.annualEconomy();
assert(economy2.income>0&&economy2.upkeep>0,'Structural economy did not renew next year');

// Network/base must improve mission organization bonus.
const bonusBefore=q.networkBonus();
g.player.economy.assets.network=3;g.player.economy.assets.base=3;
const bonusAfter=q.networkBonus();
assert(bonusAfter>bonusBefore+5,'Developed organization did not materially improve mission support');
assert(q.missionAuthorityBonus()>=bonusAfter,'Mission authority bonus lost organization contribution');

// Legacy score must react to assets and world impact.
g.world.causalV68.playerImpact=0;
g.player.economy.assets={base:0,network:0,enterprise:0};
const legacyBase=q.legacyScore();
g.player.economy.assets={base:3,network:3,enterprise:3};
g.world.causalV68.playerImpact=60;
const legacyBuilt=q.legacyScore();
assert(legacyBuilt>legacyBase+20,'Assets and world impact did not materially improve legacy');
assert(String(q.endgameTitle()).length>5,'Endgame title missing');

// Delegation must consume the annual delegation slot without exposing player health.
g.player.endgameV69.lastDelegationYear=-99;
g.player.health=88;
g.missionBoard=[{id:'deleg_qa',title:'Patrouille déléguée',desc:'QA',danger:'low',type:'patrol',reward:9000,duration:1,power:5,causal:false,region:g.player.region,cause:'QA delegation'}];
const healthBefore=g.player.health,delegationsBefore=g.player.endgameV69.totalDelegations;
assert(q.delegate('deleg_qa')===true,'High-authority delegation failed');
eq(g.player.endgameV69.totalDelegations,delegationsBefore+1,'Delegation counter did not increment');
eq(g.player.health,healthBefore,'Delegated mission should not directly damage player health');
assert(g.player.endgameV69.lastDelegationYear===Math.floor(g.ageMonths/12),'Delegation annual slot not recorded');

// Milestones/endgame are persistent.
const milestones=q.milestones();
assert(milestones.command.ok&&milestones.strategic.ok,'Strategic career milestones not recognized');
assert(Object.keys(g.player.endgameV69.milestones).length>=2,'Unlocked milestones were not persisted');

// Guard against UI regression from V6.7.1 and V6.9 economy controls.
assert(html.includes("$$('[data-v63-economy]').forEach"),'Economy buttons use mono-element selector');
assert(html.includes("$$('[data-v69-directive]').forEach"),'Directive buttons are not multi-bound');
assert(html.includes("$$('[data-v69-asset]').forEach"),'Asset buttons are not multi-bound');
assert(html.includes("$$('[data-v69-delegate]').forEach"),'Delegation buttons are not multi-bound');

// Verify long-horizon structural economy remains finite.
let maxMoney=g.player.money;
for(let year=0;year<20;year++){
  q.advanceClock(12);
  const e=q.annualEconomy();
  assert(Number.isFinite(e.income)&&Number.isFinite(e.upkeep)&&Number.isFinite(e.net),'Non-finite structural economy result');
  assert(Number.isFinite(g.player.money)&&g.player.money>=0,'Invalid money after long endgame economy');
  maxMoney=Math.max(maxMoney,g.player.money);
}
assert(maxMoney<1e9,'Structural economy exploded beyond sane long-career bounds');

console.log('V6.9 LIVE QA OK',JSON.stringify({
  runtime:'index.html inline engine',
  version:'6.9.0',
  lowAuthority:low.authority,
  highAuthority:high.authority,
  highTier:high.label,
  firstAnnualEconomy:economy1,
  nextAnnualEconomy:economy2,
  organizationBonus:+bonusAfter.toFixed(1),
  legacyBase:+legacyBase.toFixed(1),
  legacyBuilt:+legacyBuilt.toFixed(1),
  persistedMilestones:Object.keys(g.player.endgameV69.milestones).length,
  delegations:g.player.endgameV69.totalDelegations,
  directives:g.player.endgameV69.totalDirectives,
  twentyYearEconomyStable:true
}));
