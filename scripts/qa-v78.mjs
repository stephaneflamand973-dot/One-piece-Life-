import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/personal-life-v78.js','utf8');
const engineSrc=fs.readFileSync('src/v78/personal-life-engine-v78.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'personal-life-v78.js'});
vm.runInContext(engineSrc,sandbox,{filename:'personal-life-engine-v78.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('personalLifeDataV78');
const engine=registry.get('personalLifeEngineV78');

assert(data&&engine,'V7.8 modules not registered');
eq(data.version,'7.8.0','Personal-life data version mismatch');
eq(engine.version,'7.8.0','Personal-life engine version mismatch');
assert(Object.keys(data.housing).length>=6,'Housing catalog too small');
assert(Object.keys(data.householdActions).length>=4,'Household action catalog too small');
assert(Object.keys(data.personalEvents).length>=9,'Personal event catalog too small');

const young=engine.normalizeState({}, {bond:73}, {age:12,year:12,region:'East Blue'});
eq(young.home.id,'family_home','Young character should default to family home');
eq(young.familyBond,73,'Birth family bond should be preserved');
eq(young.independent,false,'Young character should not start independent');

const adult=engine.normalizeState({}, {bond:55}, {age:22,year:22,region:'Grand Line'});
eq(adult.home.id,'rented_room','Adult migration should default to independent housing');
eq(adult.independent,true,'Adult migration independence mismatch');

const marineCtx={age:22,year:22,region:'Grand Line',faction:'Marine',career:'Marine',money:150000,priceIndex:1};
const civilianCtx={...marineCtx,faction:'Civil',career:'Navigateur'};
const marineOptions=engine.housingOptions(adult,marineCtx);
assert(marineOptions.some(x=>x.id==='faction_quarters'&&x.available),'Marine housing should be available');
assert(!engine.housingOptions(adult,civilianCtx).some(x=>x.id==='faction_quarters'&&x.available),'Faction housing should not be available to Civil');

const poorCtx={...civilianCtx,money:1000};
assert(!engine.housingOptions(adult,poorCtx).some(x=>x.id==='comfortable_home'&&x.available),'Unaffordable housing should stay locked');
assert(engine.housingOptions(adult,civilianCtx).some(x=>x.id==='modest_home'&&x.available),'Affordable owned home should unlock');

const basicCost=engine.annualCost(adult,civilianCtx);
const familyState={...adult,children:[{id:'c1',name:'Ari',ageMonths:36,bond:60,status:'household'}],dependents:1};
const familyCost=engine.annualCost(familyState,civilianCtx);
gt(familyCost.total,basicCost.total,'Children and dependents should increase annual household cost');

const stressed={...adult,stress:82,stability:30,home:{...adult.home,condition:45}};
const stable={...adult,stress:10,partnership:'committed',familyBond:80,home:{id:'comfortable_home',condition:95,owned:true,region:'Grand Line',sinceYear:20}};
gt(engine.stabilityScore(stable,{...civilianCtx,money:100000}),engine.stabilityScore(stressed,{...civilianCtx,money:1000}),'Stable household should score higher');

const dependentAdult={...young,home:{id:'family_home',condition:78,owned:false,region:'East Blue',sinceYear:0},independent:false};
const independenceCandidates=engine.eventCandidates(dependentAdult,{...civilianCtx,age:19,year:19,money:8000,relationsPlan:'steady',partnerStrength:0});
assert(independenceCandidates.some(x=>x.id==='independence'),'Adult dependent should receive independence event');

const repairState={...adult,home:{...adult.home,condition:40}};
assert(engine.eventCandidates(repairState,{...civilianCtx,relationsPlan:'steady',partnerStrength:0}).some(x=>x.id==='home_repair'),'Low home condition should trigger repair candidate');

const dating={...adult,partnership:'dating',partnerId:'r1'};
assert(engine.eventCandidates(dating,{...civilianCtx,partnerStrength:70,relationsPlan:'steady'}).some(x=>x.id==='commitment'),'Strong dating relationship should unlock commitment');

const committed={...adult,partnership:'committed',partnerId:'r1',stability:78,children:[]};
assert(engine.eventCandidates(committed,{...civilianCtx,age:26,partnerStrength:80,relationsPlan:'steady'}).some(x=>x.id==='household_growth'),'Stable committed household should unlock household growth');

const choicesMarine=engine.eventChoices('independence',dependentAdult,{...marineCtx,age:19,money:12000});
assert(choicesMarine.some(x=>x.id==='faction'),'Faction housing independence option missing');
const choicesCivil=engine.eventChoices('independence',dependentAdult,{...civilianCtx,age:19,money:12000});
assert(!choicesCivil.some(x=>x.id==='faction'),'Civil character should not receive faction-housing choice');

const resolved=engine.resolveEvent('family_request','help',adult,{...civilianCtx,money:10000});
assert(!resolved.error,'Valid personal event choice failed');
lt(resolved.effects.money,0,'Family help should cost money');
gt(resolved.effects.bond,0,'Family help should strengthen family bond');

const moved=engine.applyStateEffects(adult,{independent:true,move:'modest_home',bond:4,stability:5,stress:-2},civilianCtx);
eq(moved.home.id,'modest_home','Move effect did not change home');
assert(moved.home.owned,'Owned-home move did not set ownership');
gt(moved.familyBond,adult.familyBond,'Family bond effect missing');
lt(moved.stress,adult.stress,'Stress reduction missing');

const profileA=engine.contactProfile({name:.1,temperament:.2,ambition:.3,trust:.4,affection:.5,respect:.6});
const profileB=engine.contactProfile({name:.1,temperament:.2,ambition:.3,trust:.4,affection:.5,respect:.6});
eq(JSON.stringify(profileA),JSON.stringify(profileB),'Personal contact generation must be deterministic for fixed rolls');
assert(profileA.adult===true,'Generated partner/contact must be explicitly adult');

const child=engine.childProfile(0,.2);
eq(child.ageMonths,0,'New household child should start at age 0');
const aged=engine.ageChildren({...committed,children:[child]},12);
eq(aged.children[0].ageMonths,12,'Children should age with annual household tick');

const annual=engine.annualTick({...committed,lastAnnualYear:-99,children:[child],dependents:1},{...civilianCtx,age:26,year:26,money:100000,relationsPlan:'invest'});
assert(annual.cost.total>0,'Adult household annual cost missing');
eq(annual.state.children[0].ageMonths,12,'Annual tick should age children');
gt(annual.state.familyBond,committed.familyBond,'Relationship investment should improve family bond');
const annualRepeat=engine.annualTick(annual.state,{...civilianCtx,age:26,year:26,money:100000,relationsPlan:'invest'});
eq(annualRepeat.cost.total,0,'Household economy must not charge twice in the same year');

const summary=engine.summary(stable,{...civilianCtx,age:26,money:100000});
eq(summary.homeLabel,'Maison confortable','Household summary home label mismatch');
eq(summary.partnership,'committed','Household summary partnership mismatch');
assert(summary.stability>=60,'Stable household summary unexpectedly weak');

// Live integration contract.
const saveVersion=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
const gameVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
assert(/ONE PIECE LIFE — V(?:[7-9]|\d{2,})\./.test(html),'V7+ release title missing');
assert(saveVersion>=780,'V7.8 regression QA requires save version >= 780');
const [gameMajor,gameMinor]=gameVersion.split('.').map(Number);
assert(gameMajor>7||(gameMajor===7&&gameMinor>=8),'V7.8 regression QA requires game version >= 7.8');
for(const asset of ['src/data/personal-life-v78.js','src/v78/personal-life-engine-v78.js','src/v78/personal-life-v78.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:7-[8-9]|8-[0-9]+|9-[0-9]+)-[0-9]+/.test(sw),'PWA cache must remain at V7.8 or newer');
assert(html.includes("personalV78:{version:1"),'Fresh-save personal-life state missing');
assert(html.includes("if(!game.player.personalV78||typeof game.player.personalV78!=='object')"),'Old-save V7.8 migration guard missing');
assert(html.includes('game.player.personalV78.familyBond=game.player.family.bond'),'Birth family bond synchronization missing');
assert(html.includes('id="v78HouseholdCard"'),'Household UI missing');
for(const fn of ['function v78Ensure','function v78MaybeEvent','function v78AnnualHousehold','function v78ResolvePersonalDecision','function v78HouseholdAction','function v78MoveHome','function renderV78PersonalLife']){
  assert(html.includes(fn),'Missing live V7.8 bridge '+fn);
}
assert(html.includes('v69AnnualEconomy();v78AnnualHousehold();v69Milestones()'),'Annual household economy not connected');
assert(html.includes('if(!game.pendingDecision)v78MaybeEvent()')||(html.includes('function v80CollectInterruptionCandidates')&&html.includes("kind:'personal'")),'Personal-life event arbitration missing');
assert(html.includes("if(parts[0]==='v78personal')v78ResolvePersonalDecision(parts)"),'Personal-life decisions not connected');
assert(html.includes('renderV74Network();renderV78PersonalLife();'),'Relations panel does not render household');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V7.8 PERSONAL LIFE & HOUSEHOLD QA OK',JSON.stringify({
  version:gameVersion,
  housing:Object.keys(data.housing).length,
  actions:Object.keys(data.householdActions).length,
  events:Object.keys(data.personalEvents).length,
  familyCost:familyCost.total,
  basicCost:basicCost.total,
  stableScore:engine.stabilityScore(stable,{...civilianCtx,money:100000}),
  stressedScore:engine.stabilityScore(stressed,{...civilianCtx,money:1000}),
  contact:profileA.name,
  migrationGuard:true
}));
