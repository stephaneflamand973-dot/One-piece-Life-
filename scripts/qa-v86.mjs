import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/daily-life-v86.js','utf8');
const engineSrc=fs.readFileSync('src/v86/daily-life-engine-v86.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'daily-life-v86.js'});
vm.runInContext(engineSrc,sandbox,{filename:'daily-life-engine-v86.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('dailyLifeDataV86'),engine=registry.get('dailyLifeEngineV86');
assert(data&&engine,'V8.6 daily life modules not registered');
eq(data.version,'8.6.0','Daily life data version mismatch');
eq(engine.version,'8.6.0','Daily life engine version mismatch');
assert(Object.keys(data.profiles).length>=18,'Activity profile catalog too small');
assert(Object.keys(data.opportunities).length>=14,'Opportunity catalog too small');
assert(Object.keys(data.microEvents).length>=6,'Micro-event catalog too small');

let state=engine.normalizeState({});
let first=engine.tickMonth(state,{activityType:'combat',month:180,regionDanger:20,localOpportunity:30,worldRep:10,energy:80,health:90},{micro:1,offer:1});
state=first.state;
gt(state.tracks.combat.mastery,0,'Activity mastery should increase');
eq(state.streak,1,'First month streak mismatch');

for(let i=1;i<13;i++){
  state=engine.tickMonth(state,{activityType:'combat',month:180+i,regionDanger:20,localOpportunity:30,worldRep:10,energy:80,health:90},{micro:1,offer:1}).state;
}
const after13=engine.activitySnapshot(state,'combat');
eq(after13.streak,13,'Activity streak should persist');
gt(after13.mastery,first.state.tracks.combat.mastery,'Activity mastery should accumulate');
gt(after13.efficiency,1,'Consistent activity should gain efficiency before routine fatigue');

let long=state;
for(let i=0;i<45;i++){
  long=engine.tickMonth(long,{activityType:'combat',month:193+i,regionDanger:20,localOpportunity:20,worldRep:10,energy:75,health:90},{micro:1,offer:1}).state;
}
const tired=engine.activitySnapshot(long,'combat');
gt(long.routineFatigue,0,'Long routine should generate fatigue');
assert(tired.efficiency<=1.3,'Routine efficiency should remain bounded');

const beforeSwitchFatigue=long.routineFatigue;
const switched=engine.tickMonth(long,{activityType:'study',month:240,regionDanger:20,localOpportunity:20,worldRep:10,energy:75,health:90},{micro:1,offer:1});
eq(switched.state.activeType,'study','Activity switch not persisted');
eq(switched.state.streak,1,'Activity switch should reset current streak');
lt(switched.state.routineFatigue,beforeSwitchFatigue,'Activity switch should reduce routine fatigue');
gt(switched.state.tracks.combat.mastery,0,'Switching activity must not erase old mastery');

const micro=engine.tickMonth(engine.normalizeState({}),{activityType:'study',month:180,regionDanger:12,localOpportunity:20,worldRep:5,energy:80,health:90},{micro:0,microType:0,microScale:.5,skill:.2,offer:1});
assert(micro.micro,'Forced micro-event missing');
eq(micro.state.microEvents,1,'Micro-event counter mismatch');

const offered=engine.tickMonth(engine.normalizeState({}),{activityType:'explore',month:180,regionDanger:30,localOpportunity:80,worldRep:20,energy:75,health:90},{micro:1,offer:0,type:.2,difficulty:.4,id:.3});
assert(offered.opportunity,'Forced opportunity missing');
eq(offered.state.opportunities.length,1,'Opportunity should remain open');
eq(offered.opportunity.expiresMonth-offered.opportunity.createdMonth,18,'Opportunity lifetime should be 18 months');

const op=offered.opportunity;
const chance=engine.opportunityChance(op,{skill:65,power:60,mastery:40,energy:80,worldRep:20});
assert(chance>=.12&&chance<=.94,'Opportunity chance out of bounds');

const success=engine.resolveOpportunity(offered.state,op.id,{month:181,skill:70,power:70,energy:85,worldRep:25},0);
eq(success.outcome,'success','Low roll should resolve opportunity successfully');
eq(success.state.opportunities.length,0,'Resolved opportunity should leave open queue');
eq(success.state.accepted,1,'Accepted opportunity counter mismatch');
eq(success.state.succeeded,1,'Successful opportunity counter mismatch');
gt(success.effects.skillGain,0,'Opportunity should grant some experiential skill gain');

const failureOffer=engine.tickMonth(engine.normalizeState({}),{activityType:'crime',month:200,regionDanger:60,localOpportunity:80,worldRep:5,energy:45,health:65},{micro:1,offer:0,type:.99,difficulty:.9,id:.9});
assert(failureOffer.opportunity,'Risk opportunity missing');
const failure=engine.resolveOpportunity(failureOffer.state,failureOffer.opportunity.id,{month:201,skill:5,power:10,energy:35,worldRep:0},.999);
eq(failure.outcome,'failure','High roll with weak context should fail');
assert(failure.effects.energy<0,'Failed opportunity should consume energy');

const dismissedOffer=engine.tickMonth(engine.normalizeState({}),{activityType:'work',month:220,regionDanger:10,localOpportunity:60,worldRep:10,energy:80,health:90},{micro:1,offer:0,type:.5,difficulty:.5,id:.5});
const dismissed=engine.dismissOpportunity(dismissedOffer.state,dismissedOffer.opportunity.id,221);
eq(dismissed.state.opportunities.length,0,'Dismissed opportunity should be removed');

const expiredBase=engine.normalizeState({opportunities:[{id:'old',type:'work',label:'Ancienne',desc:'',skill:'Commandement',difficulty:30,risk:5,reward:'money',money:1000,rep:1,createdMonth:100,expiresMonth:105,status:'open',activityType:'work'}]});
const expired=engine.tickMonth(expiredBase,{activityType:'work',month:106,regionDanger:10,localOpportunity:0,worldRep:0,energy:80,health:90},{micro:1,offer:1});
eq(expired.expired.length,1,'Expired opportunity should be detected');
eq(expired.state.opportunities.length,0,'Expired opportunity should leave queue');

const summary=engine.summary(switched.state,'study');
assert(summary.current&&summary.tracks.length>=2,'Daily-life summary missing tracks');
assert(summary.routineFatigue>=0&&summary.routineFatigue<=100,'Routine fatigue summary out of bounds');

assert(/ONE PIECE LIFE — V8\.\d+/.test(html),'V8.6+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=860,'Save version 860+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0',p=v.split('.').map(Number);assert(p[0]>8||(p[0]===8&&p[1]>=6),'Game version 8.6+ missing')}
for(const asset of ['src/data/daily-life-v86.js','src/v86/daily-life-engine-v86.js','src/v86/daily-life-v86.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v8-[6-9]-\d+/.test(sw),'PWA cache must remain at V8.6 or newer');
assert(html.includes('v85Ensure();v86Ensure()'),'Old-save V8.6 migration hook missing');
for(const fn of ['function v86Module','function v86Ensure','function v86ActivitySnapshot','function v86ProgressMultiplier','function v86CareerMultiplier','function v86MonthlyTick','function v86OpportunityPreview','function v86ResolveOpportunity','function v86DismissOpportunity','function renderV86Daily']){
  assert(html.includes(fn),'Missing live V8.6 bridge '+fn);
}
assert(html.includes('careerMult=v61AnnualMultiplier(\'career\')*v86CareerMultiplier(p.activityType)'),'Career routine integration missing');
assert(html.includes("v67RivalMultiplier('stats',k)*v86ProgressMultiplier(activity)"),'Stat routine progression hook missing');
assert(html.includes("v67RivalMultiplier('skills',k)*v86ProgressMultiplier(activity)"),'Skill routine progression hook missing');
assert(html.includes('careerTick(1);v86MonthlyTick();'),'Monthly daily-life tick missing');
assert(html.includes('id="v86DailyCard"'),'V8.6 daily UI card missing');
assert(html.includes('renderV86Daily();'),'V8.6 daily UI render missing');
assert(html.includes('data-v86-op'),'V8.6 optional opportunity action missing');
assert(html.includes('v86ActivityMetaHtml(type)'),'Activity mastery metadata missing');

console.log('V8.6 DAILY LIFE & OPPORTUNITIES 4.0 QA OK',JSON.stringify({
  version:'8.6.0',
  profiles:Object.keys(data.profiles).length,
  opportunities:Object.keys(data.opportunities).length,
  masteryAfter13:+after13.mastery.toFixed(1),
  streakAfter13:after13.streak,
  longRoutineFatigue:+long.routineFatigue.toFixed(1),
  switchedFatigue:+switched.state.routineFatigue.toFixed(1),
  opportunityType:op.type,
  opportunityChance:chance,
  microEvent:micro.micro.id,
  failureType:failureOffer.opportunity.type
}));
