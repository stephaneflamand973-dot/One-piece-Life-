import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import vm from 'node:vm';

const appSource=fs.readFileSync('app.js','utf8');
const contentSource=fs.readFileSync('content-v1.js','utf8');
const html=fs.readFileSync('index.html','utf8');

const elementMap=new Map();
function fakeElement(sel){
  if(!elementMap.has(sel)){
    const cls=new Set();
    elementMap.set(sel,{
      selector:sel,value:'',textContent:'',innerHTML:'',disabled:false,className:'',dataset:{},style:{},onclick:null,_t:null,
      classList:{add(...xs){xs.forEach(x=>cls.add(x))},remove(...xs){xs.forEach(x=>cls.delete(x))},toggle(x,force){if(force===undefined){if(cls.has(x)){cls.delete(x);return false}cls.add(x);return true}force?cls.add(x):cls.delete(x);return !!force},contains(x){return cls.has(x)}},
      children:[],parentElement:null,closest(){return null},querySelectorAll(){return []},addEventListener(){},removeEventListener(){},focus(){},select(){}
    });
  }
  return elementMap.get(sel);
}
const storage=new Map();
const localStorage={
  getItem(k){return storage.has(k)?storage.get(k):null},
  setItem(k,v){storage.set(k,String(v))},
  removeItem(k){storage.delete(k)},
  clear(){storage.clear()},
  key(i){return [...storage.keys()][i]||null},
  get length(){return storage.size}
};
const document={
  visibilityState:'visible',
  querySelector(sel){return fakeElement(sel)},
  querySelectorAll(){return []},
  addEventListener(){},
  removeEventListener(){}
};
const sandbox={
  console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,
  parseInt,parseFloat,isFinite,isNaN,encodeURIComponent,decodeURIComponent,escape,unescape,
  setTimeout(){return 1},clearTimeout(){},scrollTo(){},
  btoa(s){return Buffer.from(String(s),'binary').toString('base64')},
  atob(s){return Buffer.from(String(s),'base64').toString('binary')},
  localStorage,document,
  navigator:{userAgent:'QA-Node',clipboard:{writeText(){}}},
  location:{protocol:'https:'},
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.removeEventListener=()=>{};
sandbox.window.matchMedia=()=>({matches:false});
sandbox.window.navigator=sandbox.navigator;
vm.createContext(sandbox);
vm.runInContext(contentSource,sandbox,{filename:'content-v1.js'});

const exposure=`
window.__qa={
 setMode:function(v){mode=v},getMode:function(){return mode},
 getGame:function(){return game},setGame:function(v){game=v},save:save,load:load,pendingIsExecutable:pendingIsExecutable,
 make:make,migrate:migrate,world:world,worldMonthStep:worldMonthStep,advance:advance,render:render,renderChar:renderChar,renderRel:renderRel,renderWorld:renderWorld,bind:bind,
 advancePlan:advancePlan,chooseAdvanceDuration:chooseAdvanceDuration,event:event,eventChance:eventChance,migrateLifeLoop:migrateLifeLoop,renderAdvanceLoop:renderAdvanceLoop,durationText:durationText,
 power:power,styleMastery:styleMastery,combatProfile:combatProfile,combatPrimarySkill:combatPrimarySkill,gain:gain,train:train,trainHaki:trainHaki,trainFruit:trainFruit,fight:fight,activityGrowthKeys:activityGrowthKeys,activityFocusText:activityFocusText,renderActivityOptions:renderActivityOptions,focusOptions:focusOptions,recommendedFocus:recommendedFocus,normalizeActivityFocus:normalizeActivityFocus,currentFocus:currentFocus,simpleFocusKeys:simpleFocusKeys,styleFocusKeys:styleFocusKeys,careerFocusKeys:careerFocusKeys,hasPowerFocus:hasPowerFocus,
 developmentFactor:developmentFactor,recordProgressSnapshot:recordProgressSnapshot,progressionDelta:progressionDelta,attemptBreakthrough:attemptBreakthrough,allTechniqueDefs:allTechniqueDefs,techniqueBonus:techniqueBonus,renderAb:renderAb,renderPanel:renderPanel,activateTab:activateTab,setupSectionNavigation:setupSectionNavigation,
 join:join,careerTick:careerTick,careerRecord:careerRecord,evaluatePromotion:evaluatePromotion,careerExpertise:careerExpertise,careerQualification:careerQualification,careerActivityFit:careerActivityFit,specializationDecision:specializationDecision,ambitionDecision:ambitionDecision,startMission:startMission,resolveMission:resolveMission,board:board,missionProfile:missionProfile,missionScore:missionScore,missionChance:missionChance,missionResolution:missionResolution,
 createRelation:createRelation,pursueRomance:pursueRomance,marryPartner:marryPartner,welcomeChild:welcomeChild,buildHeir:buildHeir,lifeTick:lifeTick,
 normalizeRelation:normalizeRelation,npcTick:npcTick,npcNearby:npcNearby,bondCanonicalActor:bondCanonicalActor,relationForActor:relationForActor,relationPower:relationPower,npcCareerRank:npcCareerRank,trainWithMentor:trainWithMentor,challengeRival:challengeRival,rivalStage:rivalStage,reconcileRival:reconcileRival,recruitKnownRelation:recruitKnownRelation,askMentorship:askMentorship,declareRivalry:declareRivalry,seekMentor:seekMentor,canonActor:canonActor,helpRelation:helpRelation,askRelationFavor:askRelationFavor,approachCanonicalActor:approachCanonicalActor,favorLabel:favorLabel,realignRelationsAfterFactionChange:realignRelationsAfterFactionChange,
 ensureOrganization:ensureOrganization,syncOrganizationRole:syncOrganizationRole,organizationPower:organizationPower,organizationCapacity:organizationCapacity,organizationTick:organizationTick,
 upgradeOrganizationShip:upgradeOrganizationShip,generateRecruitCandidate:generateRecruitCandidate,
 registerCrime:registerCrime,arrestPlayer:arrestPlayer,prisonTick:prisonTick,attemptEscape:attemptEscape,justiceTick:justiceTick,
 influenceMetrics:influenceMetrics,establishDomain:establishDomain,fortifyDomain:fortifyDomain,influenceTick:influenceTick,
 startStrategicWar:startStrategicWar,simulateWars:simulateWars,simulateConflicts:simulateConflicts,resolveWar:resolveWar,warBetween:warBetween,
 marketPrice:marketPrice,marketPriceIndex:marketPriceIndex,buyCommodity:buyCommodity,sellCommodity:sellCommodity,tradeRouteOpportunities:tradeRouteOpportunities,
 simulateEconomy:simulateEconomy,cargoUsed:cargoUsed,cargoCapacity:cargoCapacity,cargoBookValue:cargoBookValue,blackMarketRisk:blackMarketRisk,inspectSmugglingAtArrival:inspectSmugglingAtArrival,
 releasePlayerFruits:releasePlayerFruits,checkAchievements:checkAchievements,chargeMoney:chargeMoney,serviceDebt:serviceDebt,netWorth:netWorth,
 explorationSite:explorationSite,islandProfile:islandProfile,discoveryPool:discoveryPool,registerDiscovery:registerDiscovery,discoverByKnowledge:discoverByKnowledge,explorationTick:explorationTick,migrateExploration:migrateExploration,currentRumor:currentRumor,learnLocalRumor:learnLocalRumor,routeEstimate:routeEstimate,chooseSeaCondition:chooseSeaCondition,seaJourneyTick:seaJourneyTick,travel:travel,setExplorationActivity:setExplorationActivity,renderExploration:renderExploration,renderJourney:renderJourney,renderCodexExploration:renderCodexExploration,
 defaultStoryEngine:defaultStoryEngine,migrateStoryEngine:migrateStoryEngine,activeStories:activeStories,awaitingStory:awaitingStory,storyEligibleTypes:storyEligibleTypes,startStory:startStory,maybeStartStory:maybeStartStory,storyPrompt:storyPrompt,storyChoices:storyChoices,storyChoice:storyChoice,storyTick:storyTick,closeStory:closeStory,showStoryDecision:showStoryDecision,renderStories:renderStories,die:die,
 firstRank:firstRank,rankIndex:rankIndex,nextRank:nextRank,inf:inf,infStatic:infStatic,req:req,
 constants:{PL:PL,REG:REG,ST:ST,SK:SK,TRADE_GOODS:TRADE_GOODS,SHIP_TIERS:SHIP_TIERS,ACHIEVEMENTS:ACHIEVEMENTS,MISSIONS:MISSIONS,MISSION_TITLE_PROFILES:MISSION_TITLE_PROFILES}
};
`;
let instrumented=appSource.replace(/init\(\);\s*\}\)\(\);\s*$/m,exposure+'\n})();');
if(instrumented===appSource) throw new Error('QA instrumentation could not replace init()');
vm.runInContext(instrumented,sandbox,{filename:'app.js'});
const q=sandbox.__qa;

const results=[];
function assert(cond,msg){if(!cond)throw new Error(msg)}
function test(name,fn){
  const t=Date.now();
  try{const detail=fn()||'';results.push({name,status:'PASS',ms:Date.now()-t,detail});console.log('PASS',name,detail)}
  catch(e){results.push({name,status:'FAIL',ms:Date.now()-t,error:e.stack||String(e)});console.log('FAIL',name,'\n ',e.stack||e)}
}
function setInput(id,value){fakeElement('#'+id).value=value}
function fresh(seed=1001,mode='custom'){
  storage.clear();elementMap.clear();
  setInput('seedInput',String(seed));setInput('originInput','East Blue');setInput('raceInput','Humain');setInput('styleInput','Équilibré');setInput('difficultyInput','Standard');setInput('nameInput','QA Tester');
  q.setMode(mode);q.make();return q.getGame();
}
function adultPirate(seed=2001){
  const g=fresh(seed);const p=g.player;p.ageMonths=300;p.money=3000000;p.reputation=100;
  Object.keys(p.stats).forEach(k=>{p.stats[k]=88;p.caps[k]=98});
  Object.keys(p.skills).forEach(k=>{p.skills[k]=82;p.caps[k]=98});
  p.factionRep.Pirates=100;q.join('Pirates','Capitaine');p.rank='Capitaine';q.careerRecord().rank='Capitaine';
  q.syncOrganizationRole();if(p.organization){p.organization.renown=100;p.organization.morale=90;p.organization.cohesion=90;p.organization.treasury=1000000;p.organization.supplies=100}
  return g;
}
function walkFinite(obj,path='root',seen=new Set()){
  if(obj===null||typeof obj==='string'||typeof obj==='boolean'||typeof obj==='undefined'||typeof obj==='function')return;
  if(typeof obj==='number'){if(!Number.isFinite(obj))throw new Error('Non-finite number at '+path+': '+obj);return}
  if(typeof obj!=='object'||seen.has(obj))return;seen.add(obj);
  if(Array.isArray(obj))obj.forEach((v,i)=>walkFinite(v,path+'['+i+']',seen));else Object.entries(obj).forEach(([k,v])=>walkFinite(v,path+'.'+k,seen));
}
function bounds(g){
  assert(g.player.health>=0&&g.player.health<=100,'health out of bounds');
  assert(g.player.energy>=0&&g.player.energy<=100,'energy out of bounds');
  Object.entries(g.world.markets).forEach(([name,m])=>Object.entries(m.goods).forEach(([id,x])=>{assert(x.stock>=0&&x.stock<=150,'market stock out of bounds '+name+'/'+id);assert(x.demand>=0&&x.demand<=120,'market demand out of bounds '+name+'/'+id)}));
  Object.values(g.world.territories).forEach(t=>{assert(t.stability>=0&&t.stability<=100,'territory stability out of bounds');assert(t.influence>=0&&t.influence<=100,'territory influence out of bounds')});
  walkFinite(g);
}


const fluidity={};

function resolveOnePending(g){
  if(!g.pending)return false;
  const p=g.pending;
  if(q.pendingIsExecutable(p)&&p.choices&&p.choices.length){
    const c=p.choices[0];
    if(typeof c[2]==='function')c[2]();
  }
  g.pending=null;
  return true;
}
function resolveOneStory(){
  const st=q.awaitingStory();
  if(!st)return false;
  const choices=q.storyChoices(st);
  if(choices.length)q.storyChoice(st.id,choices[0].id);
  return !!choices.length;
}
function avg(rows,key){return rows.length?rows.reduce((a,x)=>a+x[key],0)/rows.length:0}

{
  const rows=[];
  for(let seed=20000;seed<20020;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=180;p.activity='Routine';p.focus='Équilibre';p.career='Aucune';p.faction='Civil';
    let clicks=0,pending=0,storyChoices=0,focusSwitches=0,lastFocus=p.focus,major=0,moments=0;
    while(p.ageMonths<360&&clicks<220&&g.alive){
      if(g.pending){pending++;resolveOnePending(g)}
      if(q.awaitingStory()){storyChoices++;resolveOneStory()}
      const rec=q.recommendedFocus();
      if(rec!==lastFocus){focusSwitches++;lastFocus=rec}
      q.advance();clicks++;
      if(g.loop.lastAdvance){moments+=g.loop.lastAdvance.moments;major+=g.loop.lastAdvance.major}
    }
    rows.push({clicks,pending,storyChoices,focusSwitches,major,moments,years:(p.ageMonths-180)/12});
  }
  fluidity.passiveAdult={
    sample:rows.length,
    clicksPerYear:+(rows.reduce((a,x)=>a+x.clicks,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    mandatoryInterruptionsPerYear:+(rows.reduce((a,x)=>a+x.pending+x.storyChoices,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    storyChoicesPerYear:+(rows.reduce((a,x)=>a+x.storyChoices,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    pendingDecisionsPerYear:+(rows.reduce((a,x)=>a+x.pending,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    recommendationChangesPerYear:+(rows.reduce((a,x)=>a+x.focusSwitches,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    momentsPerClick:+(rows.reduce((a,x)=>a+x.moments,0)/rows.reduce((a,x)=>a+x.clicks,0)).toFixed(2),
    majorPerYear:+(rows.reduce((a,x)=>a+x.major,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2)
  };
}

{
  const rows=[];
  for(let seed=20200;seed<20215;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=180;q.join('Civil');p.specialization='Scientifique';q.careerRecord().specialization='Scientifique';p.focus='Carrière';
    let clicks=0,missions=0,interruptions=0,lastMissionAge=-999;
    while(p.ageMonths<360&&clicks<260&&g.alive){
      if(g.pending){interruptions++;resolveOnePending(g)}
      if(q.awaitingStory()){interruptions++;resolveOneStory()}
      if(!g.mission&&p.ageMonths-lastMissionAge>=12){const b=q.board();if(b.length){q.startMission(0);missions++;lastMissionAge=p.ageMonths}}
      q.advance();clicks++;
    }
    rows.push({clicks,missions,interruptions,years:(p.ageMonths-180)/12});
  }
  fluidity.engagedCareer={
    sample:rows.length,
    clicksPerYear:+(rows.reduce((a,x)=>a+x.clicks,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    missionsPerYear:+(rows.reduce((a,x)=>a+x.missions,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    interruptionsPerYear:+(rows.reduce((a,x)=>a+x.interruptions,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2)
  };
}

{
  const rows=[];
  for(let seed=20400;seed<20415;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=180;p.focus='Combat';p.activity='Explorer';q.explorationSite(p.island).familiarity=10;
    let clicks=0,interruptions=0;
    while(p.ageMonths<300&&clicks<180&&g.alive){
      if(g.pending){interruptions++;resolveOnePending(g)}
      if(q.awaitingStory()){interruptions++;resolveOneStory()}
      q.advance();clicks++;
    }
    const site=q.explorationSite(p.island);
    rows.push({clicks,interruptions,familiarity:site.familiarity,discoveries:site.discoveries.length,years:(p.ageMonths-180)/12});
  }
  fluidity.explorer={
    clicksPerYear:+(rows.reduce((a,x)=>a+x.clicks,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    interruptionsPerYear:+(rows.reduce((a,x)=>a+x.interruptions,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    avgFamiliarity:+avg(rows,'familiarity').toFixed(1),
    avgDiscoveries:+avg(rows,'discoveries').toFixed(1)
  };
}

{
  const g=fresh(20600),p=g.player;p.ageMonths=360;q.join('Pirates');p.rank='Capitaine reconnu';q.careerRecord().rank=p.rank;p.specialization='Combattant';q.careerRecord().specialization='Combattant';p.money=900000;p.bounty=120000000;p.focus='Combat';
  for(let i=0;i<9;i++)q.createRelation(i===0?'rival':i===1?'mentor':'ami');
  q.ensureOrganization();q.explorationSite(p.island).familiarity=72;
  const panels={};
  function collect(name,fn){
    elementMap.clear();
    fn();
    const values=[...elementMap.values()];
    const markup=values.map(x=>x.innerHTML||'').join('');
    panels[name]={
      generatedButtons:(markup.match(/<button/g)||[]).length,
      generatedChars:markup.length,
      populatedNodes:values.filter(x=>(x.innerHTML||x.textContent)).length,
      touchedNodes:values.length
    };
  }
  collect('character',q.renderChar);
  collect('abilities',q.renderAb);
  collect('relations',function(){q.renderPanel('relations')});
  collect('world',q.renderWorld);
  fluidity.renderDensity=panels;
}

{
  const g0=fresh(20700);
  const baseline=JSON.stringify(g0).length;
  const g=fresh(20701),p=g.player;p.ageMonths=180;q.join('Pirates');p.focus='Combat';
  for(let i=0;i<12;i++)q.createRelation(i<2?'rival':'ami');
  let clicks=0;
  while(p.ageMonths<540&&clicks<500&&g.alive){
    if(g.pending)resolveOnePending(g);if(q.awaitingStory())resolveOneStory();
    if(!g.mission&&clicks%10===0){const b=q.board();if(b.length)q.startMission(0)}
    q.advance();clicks++;
  }
  fluidity.saveSize={newLifeBytes:baseline,evolvedLifeBytes:JSON.stringify(g).length,growthMultiple:+(JSON.stringify(g).length/baseline).toFixed(2),timeline:g.timeline.length,relations:g.relations.length,storyHistory:g.story.history.length,news:g.world.news.length};
}

{
  const timings=[];
  for(let seed=20800;seed<20803;seed++){
    const g=fresh(seed);
    const t0=performance.now();q.world(600);const t1=performance.now();
    timings.push(t1-t0);
  }
  fluidity.worldSim50YearsNodeMs={avg:+(timings.reduce((a,b)=>a+b,0)/timings.length).toFixed(1),max:+Math.max(...timings).toFixed(1),min:+Math.min(...timings).toFixed(1)};
}

{
  const g=fresh(20900),p=g.player;p.ageMonths=300;p.activity='Routine';p.focus='Combat';
  fluidity.focusEventMismatch={
    currentFocus:q.currentFocus(),
    focusKeys:q.activityGrowthKeys(q.currentFocus()),
    activity:p.activity,
    activityKeys:q.activityGrowthKeys(p.activity),
    losesContextualActivityEvent:q.activityGrowthKeys(p.activity).length===0&&q.activityGrowthKeys(q.currentFocus()).length>0
  };
}

{
  const appText=appSource;
  function block(name){const st=appText.indexOf('function '+name+'(');if(st<0)return'';const nx=appText.indexOf('\nfunction ',st+10);return appText.slice(st,nx<0?appText.length:nx)}
  fluidity.codeSurface={
    appBytes:Buffer.byteLength(appText),
    functions:(appText.match(/\bfunction\s+[A-Za-z0-9_]+\s*\(/g)||[]).length,
    innerHTMLAssignments:(appText.match(/\.innerHTML\s*=/g)||[]).length,
    saveCalls:(appText.match(/\bsave\(\)/g)||[]).length,
    fullRenderCalls:(appText.match(/\brender\(\)/g)||[]).length,
    legacyTrainingProfileRefs:(appText.match(/TRAINING_PROFILES/g)||[]).length,
    renderChar:{chars:block('renderChar').length,innerHTML:(block('renderChar').match(/\.innerHTML\s*=/g)||[]).length},
    renderWorld:{chars:block('renderWorld').length,innerHTML:(block('renderWorld').match(/\.innerHTML\s*=/g)||[]).length},
    renderRel:{chars:block('renderRel').length,innerHTML:(block('renderRel').match(/\.innerHTML\s*=/g)||[]).length},
    renderAb:{chars:block('renderAb').length,innerHTML:(block('renderAb').match(/\.innerHTML\s*=/g)||[]).length}
  };
}

console.log('\nFLUIDITY_AUDIT '+JSON.stringify(fluidity));


console.log('\nAUDIT_COMPLETE');
