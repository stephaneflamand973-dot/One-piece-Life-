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
 getGame:function(){return game},setGame:function(v){game=v},save:save,load:load,purgeSaveSlot:purgeSaveSlot,deleteSaveSlot:deleteSaveSlot,slotKey:slotKey,slotMetaKey:slotMetaKey,pendingIsExecutable:pendingIsExecutable,
 make:make,migrate:migrate,world:world,worldMonthStep:worldMonthStep,advance:advance,render:render,renderChar:renderChar,renderWorld:renderWorld,bind:bind,simulateActors:simulateActors,simulateCrews:simulateCrews,actorIntentPool:actorIntentPool,assignActorIntent:assignActorIntent,resolveActorIntent:resolveActorIntent,actorIntentTick:actorIntentTick,crewIntentPool:crewIntentPool,assignCrewIntent:assignCrewIntent,resolveCrewIntent:resolveCrewIntent,crewIntentTick:crewIntentTick,
 advancePlan:advancePlan,chooseAdvanceDuration:chooseAdvanceDuration,advanceSlice:advanceSlice,event:event,resolveAmbientDanger:resolveAmbientDanger,dangerAlternativeScore:dangerAlternativeScore,eventChance:eventChance,eventNoveltyWeight:eventNoveltyWeight,migrateLifeLoop:migrateLifeLoop,recordSignatureMoment:recordSignatureMoment,scheduleConsequence:scheduleConsequence,resolveConsequence:resolveConsequence,processConsequences:processConsequences,consequenceRelation:consequenceRelation,registerArcSignal:registerArcSignal,signalArcFromConsequence:signalArcFromConsequence,arcPressureFor:arcPressureFor,arcTick:arcTick,closeArc:closeArc,rememberFoundingMoment:rememberFoundingMoment,captureAdvanceState:captureAdvanceState,finalizeAdvanceReport:finalizeAdvanceReport,renderAdvanceLoop:renderAdvanceLoop,durationText:durationText,renderTimeline:renderTimeline,
 power:power,styleMastery:styleMastery,combatProfile:combatProfile,combatPrimarySkill:combatPrimarySkill,gain:gain,train:train,trainHaki:trainHaki,trainFruit:trainFruit,fight:fight,activityGrowthKeys:activityGrowthKeys,activityFocusText:activityFocusText,renderActivityOptions:renderActivityOptions,focusOptions:focusOptions,recommendedFocus:recommendedFocus,normalizeActivityFocus:normalizeActivityFocus,currentFocus:currentFocus,simpleFocusKeys:simpleFocusKeys,styleFocusKeys:styleFocusKeys,careerFocusKeys:careerFocusKeys,hasPowerFocus:hasPowerFocus,
 developmentFactor:developmentFactor,recordProgressSnapshot:recordProgressSnapshot,progressionDelta:progressionDelta,attemptBreakthrough:attemptBreakthrough,allTechniqueDefs:allTechniqueDefs,techniqueBonus:techniqueBonus,renderAb:renderAb,renderPanel:renderPanel,activateTab:activateTab,setupSectionNavigation:setupSectionNavigation,setSectionState:function(name,value){sectionState[name]=value},getSectionState:function(){return Object.assign({},sectionState)},
 join:join,careerTick:careerTick,careerRecord:careerRecord,evaluatePromotion:evaluatePromotion,careerExpertise:careerExpertise,careerQualification:careerQualification,careerActivityFit:careerActivityFit,specializationDecision:specializationDecision,ambitionDecision:ambitionDecision,startMission:startMission,resolveMission:resolveMission,board:board,missionImportance:missionImportance,missionStakes:missionStakes,missionNoveltyKey:missionNoveltyKey,missionNoveltyScore:missionNoveltyScore,rememberMission:rememberMission,worldMissionOpportunities:worldMissionOpportunities,migrateWorldMissionSource:migrateWorldMissionSource,applyWorldMissionOutcome:applyWorldMissionOutcome,missionProfile:missionProfile,missionScore:missionScore,missionChance:missionChance,missionGuidance:missionGuidance,missionRecommendationScore:missionRecommendationScore,missionResolution:missionResolution,
 createRelation:createRelation,pursueRomance:pursueRomance,marryPartner:marryPartner,welcomeChild:welcomeChild,buildHeir:buildHeir,lifeTick:lifeTick,renderRel:renderRel,renderRelClose:renderRelClose,renderRelNetwork:renderRelNetwork,relationActionDecision:relationActionDecision,
 normalizeRelation:normalizeRelation,npcTick:npcTick,npcIntentPool:npcIntentPool,assignNpcIntent:assignNpcIntent,npcCareerPromotionChance:npcCareerPromotionChance,tryNpcCareerPromotion:tryNpcCareerPromotion,resolveNpcIntent:resolveNpcIntent,npcIntentTick:npcIntentTick,npcSocialTick:npcSocialTick,npcLinkBetween:npcLinkBetween,ensureNpcLink:ensureNpcLink,npcNearby:npcNearby,bondCanonicalActor:bondCanonicalActor,relationForActor:relationForActor,relationPower:relationPower,npcCareerRank:npcCareerRank,trainWithMentor:trainWithMentor,challengeRival:challengeRival,rivalStage:rivalStage,syncRivalryMilestone:syncRivalryMilestone,reconcileRival:reconcileRival,recruitKnownRelation:recruitKnownRelation,askMentorship:askMentorship,declareRivalry:declareRivalry,seekMentor:seekMentor,canonActor:canonActor,helpRelation:helpRelation,askRelationFavor:askRelationFavor,approachCanonicalActor:approachCanonicalActor,favorLabel:favorLabel,realignRelationsAfterFactionChange:realignRelationsAfterFactionChange,
 ensureOrganization:ensureOrganization,syncOrganizationRole:syncOrganizationRole,organizationPower:organizationPower,organizationCapacity:organizationCapacity,organizationTick:organizationTick,
 upgradeOrganizationShip:upgradeOrganizationShip,generateRecruitCandidate:generateRecruitCandidate,
 registerCrime:registerCrime,arrestPlayer:arrestPlayer,prisonTick:prisonTick,attemptEscape:attemptEscape,justiceTick:justiceTick,
 influenceMetrics:influenceMetrics,establishDomain:establishDomain,fortifyDomain:fortifyDomain,influenceTick:influenceTick,
 startStrategicWar:startStrategicWar,simulateWars:simulateWars,simulateConflicts:simulateConflicts,resolveWar:resolveWar,warBetween:warBetween,
 marketPrice:marketPrice,marketPriceIndex:marketPriceIndex,buyCommodity:buyCommodity,sellCommodity:sellCommodity,tradeRouteOpportunities:tradeRouteOpportunities,
 simulateEconomy:simulateEconomy,cargoUsed:cargoUsed,cargoCapacity:cargoCapacity,cargoBookValue:cargoBookValue,blackMarketRisk:blackMarketRisk,inspectSmugglingAtArrival:inspectSmugglingAtArrival,
 releasePlayerFruits:releasePlayerFruits,checkAchievements:checkAchievements,chargeMoney:chargeMoney,serviceDebt:serviceDebt,netWorth:netWorth,
 explorationSite:explorationSite,islandProfile:islandProfile,discoveryPool:discoveryPool,registerDiscovery:registerDiscovery,discoverByKnowledge:discoverByKnowledge,explorationTick:explorationTick,migrateExploration:migrateExploration,currentRumor:currentRumor,learnLocalRumor:learnLocalRumor,routeEstimate:routeEstimate,chooseSeaCondition:chooseSeaCondition,seaJourneyTick:seaJourneyTick,travel:travel,setExplorationActivity:setExplorationActivity,renderExploration:renderExploration,renderJourney:renderJourney,renderCodexExploration:renderCodexExploration,
 defaultStoryEngine:defaultStoryEngine,migrateStoryEngine:migrateStoryEngine,activeStories:activeStories,awaitingStory:awaitingStory,storyNoveltyWeight:storyNoveltyWeight,storyEligibleTypes:storyEligibleTypes,startStory:startStory,maybeStartStory:maybeStartStory,storyPrompt:storyPrompt,storyChoices:storyChoices,storyChoice:storyChoice,storyTick:storyTick,closeStory:closeStory,showStoryDecision:showStoryDecision,renderStories:renderStories,die:die,
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

test('Static: unique HTML ids',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),dupes=ids.filter((x,i)=>ids.indexOf(x)!==i);
  assert(!dupes.length,'duplicate ids: '+[...new Set(dupes)].join(', '));return ids.length+' ids'
});
test('Static: no broken dynamic selector pattern',()=>{
  assert(!appSource.includes('$$$('),'contains $$$(');
  const bad=[...appSource.matchAll(/(?<!\$)\$\([^;\n]*?\)\.forEach/g)];
  assert(!bad.length,'single-element selector used as list: '+bad.map(x=>x[0]).join(','));return 'selectors clean'
});
test('Creation: Custom mode initializes full V2.0 state',()=>{
  const g=fresh(1111,'custom');assert(g.version===28,'wrong version');assert(g.player.name==='QA Tester','name');assert(g.player.origin==='East Blue','origin');
  assert(Object.keys(g.world.markets).length===Object.keys(q.constants.PL).length,'market coverage mismatch');assert(g.world.treaties.some(t=>t.a==='Marine'&&t.b==='Gouvernement'),'foundation alliance absent');
  assert(g.player.trade&&g.player.strategy&&g.player.influence&&g.player.justice,'new subsystem state missing');bounds(g);return Object.keys(g.world.markets).length+' markets'
});
test('Creation: Destiny mode is seed deterministic',()=>{
  function snap(){const g=fresh(424242,'destiny');return JSON.stringify({origin:g.player.origin,race:g.player.race,style:g.player.style,stats:g.player.stats,skills:g.player.skills,caps:g.player.caps,island:g.player.island})}
  const a=snap(),b=snap();assert(a===b,'same seed generated different character');return 'seed 424242 reproducible'
});
test('Migration: legacy state upgrades idempotently to V2.0',()=>{
  let g=fresh(3001);g=JSON.parse(JSON.stringify(g));g.version=9;delete g.player.trade;delete g.player.strategy;delete g.player.influence;delete g.world.markets;delete g.world.economy;delete g.world.wars;delete g.world.treaties;
  let m=q.migrate(g);assert(m.version===28,'migration version');assert(m.player.trade&&m.player.strategy&&m.player.influence,'player migration missing');assert(Object.keys(m.world.markets).length===Object.keys(q.constants.PL).length,'markets not restored');
  const counts=[m.world.actors.length,m.world.crews.length,m.world.treaties.length];m=q.migrate(m);assert(counts.join('/')===[m.world.actors.length,m.world.crews.length,m.world.treaties.length].join('/'),'idempotent migration duplicated world entities');q.setGame(m);bounds(m);return 'legacy v9 -> v23'
});
test('World simulation: 30 years without numerical corruption',()=>{
  const g=fresh(3101);q.world(360);assert(g.world.year===30,'expected year 30, got '+g.world.year);bounds(g);
  const overdue=g.world.canon.filter(c=>c.status==='future'&&(c.year*12+(c.month||0))<=g.world.year*12+g.world.month);assert(!overdue.length,'overdue canon still future: '+overdue.map(x=>x.title).join(','));
  return g.world.wars.length+' wars / '+g.world.economy.shocks.length+' economic shocks'
});
test('Progression: training respects caps',()=>{
  const g=fresh(3201),p=g.player;p.ageMonths=240;p.activity='Entraînement';for(let i=0;i<500;i++)q.train(1);
  Object.keys(p.stats).forEach(k=>assert(p.stats[k]<=p.caps[k]+1e-9,k+' exceeded cap'));Object.keys(p.skills).forEach(k=>assert(p.skills[k]<=p.caps[k]+1e-9,k+' exceeded cap'));return 'caps respected'
});
test('Haki and Fruit progression remain bounded',()=>{
  const g=fresh(3301),p=g.player;p.ageMonths=300;p.latent.Observation=100;for(let i=0;i<300;i++)q.trainHaki('Observation',1);assert(p.haki.Observation>0&&p.haki.Observation<=100,'Observation progression invalid');
  p.fruit='Test Fruit';p.fruitMastery=0;for(let i=0;i<300;i++)q.trainFruit(1);assert(p.fruitMastery>80&&p.fruitMastery<=100,'fruit mastery invalid');return 'Observation '+p.haki.Observation.toFixed(1)+' / Fruit '+p.fruitMastery.toFixed(1)
});
test('Combat: strong character handles low-risk fights and bounds health',()=>{
  const g=fresh(3401),p=g.player;p.ageMonths=300;Object.keys(p.stats).forEach(k=>p.stats[k]=90);Object.keys(p.skills).forEach(k=>p.skills[k]=85);let wins=0;
  for(let i=0;i<20;i++){p.health=100;p.energy=100;if(q.fight(15,'QA sparring'))wins++}
  assert(wins>=16,'unexpectedly low win rate '+wins+'/20');assert(p.health>=0&&p.health<=100,'health bound');return wins+'/20 wins'
});
test('Career: join, organization and promotion pipeline',()=>{
  const g=fresh(3501),p=g.player;p.ageMonths=300;Object.keys(p.stats).forEach(k=>p.stats[k]=95);Object.keys(p.skills).forEach(k=>p.skills[k]=95);p.factionRep.Marine=100;q.join('Marine','Recrue');
  assert(p.organization&&p.organization.faction==='Marine','organization missing');const start=p.rank,rec=q.careerRecord();rec.xp=10000;for(let i=0;i<8;i++)q.evaluatePromotion();assert(p.rank!==start,'no promotion despite max requirements');assert(p.organization.playerRole,'organization role missing');return start+' -> '+p.rank
});
test('Mission: acceptance and resolution integrate career and organization',()=>{
  const g=fresh(3601),p=g.player;p.ageMonths=300;p.money=100000;Object.keys(p.stats).forEach(k=>p.stats[k]=95);Object.keys(p.skills).forEach(k=>p.skills[k]=95);p.factionRep.Marine=100;q.join('Marine','Recrue');
  q.startMission(0);assert(g.mission,'mission not accepted');const before=q.careerRecord().successes+q.careerRecord().failures;g.mission.danger=5;g.mission.remaining=0;q.resolveMission();assert(!g.mission,'mission not cleared');assert(q.careerRecord().successes+q.careerRecord().failures===before+1,'mission record not updated');return 'mission pipeline complete'
});
test('Organization: leadership, recruit state and ship upgrade',()=>{
  const g=adultPirate(3701),p=g.player,o=p.organization;assert(o.authority==='leader','captain not leader');const c=q.generateRecruitCandidate();o.members.push(c);assert(q.organizationPower()>0,'organization power invalid');
  const tier=o.ship.tier;q.upgradeOrganizationShip();assert(o.ship.tier===tier+1,'ship upgrade failed');assert(q.organizationCapacity()>=o.ship.capacity,'capacity mismatch');return o.ship.name+' / '+o.members.length+' members'
});
test('Relationships: marriage, child and legacy handoff',()=>{
  const g=fresh(3801),p=g.player;p.ageMonths=360;p.money=500000;const r=q.createRelation('partenaire');r.affection=95;r.trust=95;r.attraction=95;r.relationshipMonths=18;p.life.partnerId=r.id;p.life.relationshipStatus='En couple';p.life.socialActions=2;q.marryPartner();assert(p.life.relationshipStatus==='Marié','marriage failed');
  p.life.socialActions=2;q.welcomeChild();assert(p.children.length===1,'child creation failed');p.children[0].ageMonths=220;const childName=p.children[0].name,generation=g.dynasty.generation;g.death={cause:'QA'};q.buildHeir(p.children[0]);assert(g.dynasty.generation===generation+1,'generation not advanced');assert(g.player.name===childName,'heir not selected');return 'generation '+g.dynasty.generation
});
test('Justice: witnessed crime -> bounty -> detention -> release',()=>{
  const g=adultPirate(3901),p=g.player;const b=p.bounty;q.registerCrime('QA raid',4,true);assert(p.bounty>b,'bounty did not increase');assert(p.justice.regionalHeat[p.region]>0,'heat did not increase');q.arrestPlayer('QA arrest');assert(p.justice.detained,'arrest failed');const months=p.justice.prison.remaining;for(let i=0;i<Math.ceil(months)+2&&p.justice.detained;i++)q.prisonTick(1);assert(!p.justice.detained,'prison did not release');return 'bounty '+p.bounty.toLocaleString('fr-FR')+' B'
});
test('Justice: escape path is reachable',()=>{
  const g=adultPirate(4001),p=g.player;q.arrestPlayer('QA escape');p.justice.prison.security=1;p.skills.Discrétion=98;p.stats.Agilité=98;p.stats.Réflexes=98;let tries=0;
  while(p.justice.detained&&tries<25){p.justice.actions=1;q.attemptEscape();tries++}
  assert(!p.justice.detained,'escape still failed after '+tries+' favorable attempts');assert(p.justice.escapes>=1,'escape counter');return tries+' attempt(s)'
});
test('Influence: domain establishment and fortification',()=>{
  const g=adultPirate(4101),p=g.player,t=g.world.territories[p.island];t.controller='Civil';t.stability=80;p.influence.actions=1;q.establishDomain();assert(t.playerControl&&t.playerControl.ownerKey===String(g.seed),'domain not established');const before=t.playerControl.control;p.influence.actions=1;q.fortifyDomain();assert(t.playerControl.control>before,'fortification ineffective');return p.island+' control '+Math.round(t.playerControl.control)
});
test('Strategy: war creates fronts and always resolves by long horizon',()=>{
  const g=adultPirate(4201),p=g.player;g.world.diplomacy[['Marine','Pirates'].sort().join('|')]=-100;let target=Object.keys(g.world.territories).find(n=>g.world.territories[n].controller==='Marine');assert(target,'no Marine target');
  const war=q.startStrategicWar('Pirates','Marine','territory',target,'player');assert(war&&war.status==='active','war not created');for(let i=0;i<30&&war.status==='active';i++){q.simulateConflicts();q.simulateWars()}assert(war.status==='resolved','war did not resolve after 30 strategic months');assert(g.world.treaties.some(t=>t.type==='truce'&&((t.a==='Pirates'&&t.b==='Marine')||(t.a==='Marine'&&t.b==='Pirates'))),'no post-war truce');return war.outcome+' after '+war.months+' months'
});
test('Economy: buy/sell updates cargo, money and profit correctly',()=>{
  const g=fresh(4301),p=g.player;p.ageMonths=300;p.money=500000;p.skills.Navigation=60;const before=p.money;q.buyCommodity('provisions',1,false);assert(q.cargoUsed()>0,'cargo not added');assert(p.money<before,'money not debited');q.sellCommodity('provisions',1,false);assert(q.cargoUsed()===0,'cargo not removed');assert(p.trade.trades===2,'trade count incorrect');assert(p.trade.profit<0,'same-market spread should lose money');return p.trade.profit+' B same-port P/L'
});
test('Economy: at least one generated direct-route arbitrage is executable',()=>{
  const g=fresh(4401),p=g.player;p.ageMonths=300;p.money=1000000;p.skills.Navigation=80;let routes=q.tradeRouteOpportunities();
  if(!routes.length){q.simulateEconomy();routes=q.tradeRouteOpportunities()}
  assert(routes.length>0,'no profitable direct-route opportunity generated');const r=routes[0];q.buyCommodity(r.good.id,1,false);const item=p.trade.cargo.find(c=>c.good===r.good.id);assert(item,'purchase failed');p.island=r.dest;p.region=q.inf(r.dest).region;const before=p.trade.profit;q.sellCommodity(r.good.id,1,false);assert(p.trade.profit>before,'route did not realize profit at current quoted prices');return r.good.name+' to '+r.dest+' ~'+Math.round(r.margin)+'%'
});
test('Economy: blockade raises essentials and stops normal trade flow',()=>{
  const g=fresh(4501),p=g.player;p.ageMonths=300;const place=p.island;g.world.conflicts=[];const before=q.marketPrice(place,'provisions',true);g.world.conflicts.push({id:'qa-block',location:place,region:p.region,attacker:'Pirates',defender:'Marine',intensity:80,months:1,status:'active'});const after=q.marketPrice(place,'provisions',true);assert(after>before,'blockade did not increase provisions price');q.simulateEconomy();assert(g.world.markets[place].blockade===true,'blockade state not applied');return before+' -> '+after+' B'
});
test('Economy/Justice: illegal cargo can trigger smuggling system without corrupting state',()=>{
  const g=adultPirate(4601),p=g.player;p.money=2000000;p.skills.Navigation=80;p.skills.Discrétion=0;const market=g.world.markets[p.island];market.goods.seastone.stock=20;q.buyCommodity('seastone',1,true);assert(p.trade.cargo.some(c=>c.good==='seastone'),'restricted cargo not purchased');
  let attempts=0;while(p.trade.cargo.some(c=>c.good==='seastone')&&attempts<20){q.inspectSmugglingAtArrival(p.island);attempts++}
  assert(p.trade.smugglingRuns+p.trade.seizures>=1,'smuggling system recorded no outcome');bounds(g);return p.trade.seizures+' seizure(s), '+p.trade.smugglingRuns+' pass(es)'
});
test('Fruit lifecycle: player death release returns fruit to world',()=>{
  const g=fresh(4701),p=g.player,fruit=g.world.fruits.find(n=>!g.world.fruitRegistry[n]||g.world.fruitRegistry[n].status==='available');assert(fruit,'no available fruit');p.fruit=fruit;g.world.fruitRegistry[fruit]={status:'consumed',holder:p.name};q.releasePlayerFruits();assert(g.world.fruitRegistry[fruit].status==='available'&&g.world.fruitRegistry[fruit].holder===null,'fruit not released');return fruit
});
test('Rendering smoke test: main views render on complex state',()=>{
  const g=adultPirate(4801),p=g.player;p.justice.regionalHeat[p.region]=60;p.bounty=250000000;p.life.assets.business=100000;p.influence.titles=['Supernova'];q.render();q.renderChar();q.renderWorld();return 'render completed without exception'
});



test('V2.0 migration: legacy relations gain persistent NPC state',()=>{
  let g=fresh(4901);g.version=15;g.relations=[{id:'old-rel',name:'Mira',role:'ami',faction:'Civil',status:'active'}];g=q.migrate(JSON.parse(JSON.stringify(g)));q.setGame(g);
  const r=g.relations[0];assert(g.version===28,'migration did not reach v23');assert(Number.isFinite(r.npcPower)&&Number.isFinite(r.npcPotential),'NPC power state missing');assert(r.npcSpecialty&&r.npcTrajectory&&Array.isArray(r.memories),'NPC profile migration incomplete');return r.npcSpecialty+' / '+r.npcTrajectory
});
test('V2.0 canon: canonical encounter becomes a persistent synchronized bond',()=>{
  const g=fresh(4911),p=g.player;p.ageMonths=300;const a=q.canonActor('Monkey D. Garp');assert(a&&a.status==='active','Garp unavailable');p.region=a.region;
  const r=q.bondCanonicalActor(a,'QA encounter');assert(r&&r.canonical&&r.actorName===a.name,'canonical relation not created');assert(q.relationForActor(a.name)===r,'canonical relation not retrievable');assert(Math.abs(q.relationPower(r)-r.npcPower)<.001,'canonical power not synchronized');assert(r.memories.length>=1,'canonical memory missing');return r.role+' / '+Math.round(r.npcPower)+' power'
});
test('V2.0 mentor: training changes progression and persists sessions',()=>{
  const g=fresh(4921),p=g.player;p.ageMonths=300;p.life.socialActions=2;p.region='East Blue';p.island='Loguetown';p.skills.Navigation=20;p.caps.Navigation=90;
  const r=q.normalizeRelation(g,{id:'mentor-qa',name:'Maître QA',role:'mentor',faction:'Civil',region:p.region,location:p.island,npcPower:85,npcPotential:92,npcSpecialty:'Navigation',respect:85,trust:80,status:'active'},99);g.relations.push(r);
  const before=p.skills.Navigation;q.trainWithMentor(r.id);assert(p.skills.Navigation>before,'mentor training did not improve skill');assert(r.mentorSessions===1,'mentor session not recorded');assert(r.memories.length>=1,'mentor memory missing');return before.toFixed(1)+' -> '+p.skills.Navigation.toFixed(1)
});
test('V2.0 rival: duel persists rivalry history',()=>{
  const g=fresh(4931),p=g.player;p.ageMonths=300;p.life.socialActions=2;p.health=100;p.energy=100;p.region='East Blue';p.island='Loguetown';Object.keys(p.stats).forEach(k=>p.stats[k]=90);Object.keys(p.skills).forEach(k=>p.skills[k]=85);
  const r=q.normalizeRelation(g,{id:'rival-qa',name:'Rival QA',role:'rival',faction:'Pirates',region:p.region,location:p.island,npcPower:12,npcPotential:90,rivalry:75,status:'active'},100);g.relations.push(r);
  q.challengeRival(r.id);assert(r.rivalWins+r.rivalLosses===1,'rival duel result not recorded');assert(r.lastDuelAge===p.ageMonths,'last duel timestamp missing');assert(r.memories.length>=1,'rival memory missing');return r.rivalWins+'-'+r.rivalLosses
});
test('V2.0 living NPC: autonomous progression advances age and power',()=>{
  const g=fresh(4941),p=g.player;p.ageMonths=300;const r=q.normalizeRelation(g,{id:'npc-qa',name:'Seline',role:'ami',faction:'Civil',region:p.region,location:p.island,npcPower:20,npcPotential:90,npcTrajectory:'Stable',status:'active'},101);g.relations.push(r);
  const age0=r.npcAgeMonths,pow0=r.npcPower;q.npcTick(24);assert(r.npcAgeMonths===age0+24,'NPC age did not advance');assert(r.npcPower>pow0,'NPC power did not progress');assert(r.npcPower<=r.npcPotential,'NPC exceeded potential');return pow0.toFixed(1)+' -> '+r.npcPower.toFixed(1)
});
test('V2.0 recruitment: trusted relation can join player organization',()=>{
  const g=adultPirate(4951),p=g.player,o=p.organization;o.members=[];o.ship.tier=3;o.ship.capacity=24;o.commandActions=1;
  const r=q.normalizeRelation(g,{id:'recruit-qa',name:'Noa QA',role:'ami',faction:'Civil',region:p.region,location:p.island,npcPower:48,npcPotential:78,npcSpecialty:'Navigation',trust:90,loyalty:90,respect:90,status:'active'},102);g.relations.push(r);
  q.recruitKnownRelation(r.id);assert(r.joinedOrganization,'relation not marked recruited');assert(o.members.some(m=>m.linkedRelationId===r.id),'organization member not linked to relation');return o.members[0].role
});


test('V2.0 favors: help and reciprocal service persist social debt',()=>{
  const g=fresh(4961),p=g.player;p.ageMonths=300;p.money=100000;p.life.socialActions=5;p.health=40;
  const r=q.normalizeRelation(g,{id:'favor-qa',name:'Docteur QA',role:'ami',faction:'Civil',region:p.region,location:p.island,npcPower:50,npcPotential:70,npcSpecialty:'Médecine',trust:100,loyalty:100,respect:70,status:'active',favorBalance:1},103);g.relations.push(r);
  const b=r.favorBalance;q.helpRelation(r.id);assert(r.favorBalance===b+1,'help did not create a favor credit');const health=p.health;
  let tries=0;while(p.health===health&&tries<8){p.life.socialActions=2;r.favorBalance=5;q.askRelationFavor(r.id);tries++}
  assert(p.health>health,'medical favor never helped health');assert(r.memories.some(m=>m.type==='favor'),'favor memory missing');return q.favorLabel(r)
});
test('V2.0 canon interaction: known actor remembers repeated meetings',()=>{
  const g=fresh(4971),p=g.player;p.ageMonths=300;p.life.socialActions=4;const a=q.canonActor('Monkey D. Garp');assert(a&&a.status==='active','Garp unavailable');p.region=a.region;
  const r=q.bondCanonicalActor(a,'QA first meeting'),before=r.memories.length,trust=r.trust;p.ageMonths+=3;q.approachCanonicalActor(a.name);
  assert(r.memories.length>=before,'repeat canonical meeting lost memory');assert(r.trust>=trust,'repeat canonical meeting reduced trust unexpectedly');return r.memories.length+' memories'
});
test('V2.0 organization: recruited relation stays synchronized with member progression',()=>{
  const g=adultPirate(4981),p=g.player,o=p.organization;o.members=[];o.ship.tier=3;o.commandActions=1;
  const r=q.normalizeRelation(g,{id:'sync-qa',name:'Sync QA',role:'ami',faction:'Civil',region:p.region,location:p.island,npcPower:35,npcPotential:85,npcSpecialty:'Combat',trust:95,loyalty:95,respect:90,status:'active'},104);g.relations.push(r);
  q.recruitKnownRelation(r.id);const m=o.members.find(x=>x.linkedRelationId===r.id);assert(m,'linked member missing');m.power=65;q.organizationTick(1);assert(r.npcPower>=65,'linked relation power did not follow organization member');assert(r.joinedOrganization,'relation lost organization flag');return Math.round(r.npcPower)+' power'
});
test('V2.0 legacy: major social bonds survive into the next generation as memories',()=>{
  const g=fresh(4991),p=g.player;p.ageMonths=420;p.money=500000;const child={id:'child-qa',name:'Heir QA',ageMonths:220,birthplace:p.island,birthRegion:p.region,race:p.race,status:'active',bond:80};p.children=[child];
  const r=q.normalizeRelation(g,{id:'legacy-qa',name:'Ancien Rival',role:'rival',faction:'Pirates',region:p.region,location:p.island,npcPower:60,npcPotential:85,trust:80,loyalty:40,respect:90,rivalry:85,status:'active'},105);g.relations.push(r);
  q.buildHeir(child);const inherited=g.relations.find(x=>x.name==='Ancien Rival');assert(inherited,'major relation vanished across generation');assert(inherited.memories.some(m=>m.type==='legacy'),'dynastic memory missing');assert(g.player.name==='Heir QA','heir switch failed');return inherited.role+' / '+inherited.memories[0].text
});


test('V2.0 locality: same region is not enough for a procedural NPC',()=>{
  const g=fresh(4992),p=g.player;p.ageMonths=300;const other=Object.keys(q.constants.PL).find(n=>q.constants.PL[n][0]===p.region&&n!==p.island);assert(other,'no alternate place in region');const r=q.normalizeRelation(g,{id:'locality-qa',name:'Voyageur QA',role:'ami',faction:'Civil',region:p.region,location:other,status:'active'},106);g.relations.push(r);
  assert(!q.npcNearby(r),'NPC on another island counted as nearby');r.location=p.island;assert(q.npcNearby(r),'NPC on same island not nearby');p.travel={from:p.island,destination:other,remaining:1,danger:10};assert(!q.npcNearby(r),'non-crew NPC remained nearby at sea');return other
});
test('V2.0 canon cooldown: repeated interaction cannot be farmed immediately',()=>{
  const g=fresh(4993),p=g.player;p.ageMonths=300;p.life.socialActions=5;const a=q.canonActor('Monkey D. Garp');assert(a&&a.status==='active','Garp unavailable');p.region=a.region;const r=q.bondCanonicalActor(a,'Cooldown QA'),trust=r0=>r0;
  const beforeTrust=r.trust,beforeMem=r.memories.length,beforeActions=p.life.socialActions;q.approachCanonicalActor(a.name);
  assert(r.trust===beforeTrust,'canon trust increased inside cooldown');assert(r.memories.length===beforeMem,'canon memory duplicated inside cooldown');assert(p.life.socialActions===beforeActions,'cooldown consumed a social action');return 'cooldown enforced'
});
test('V2.0 organization locality: linked recruit follows the player instead of roaming independently',()=>{
  const g=adultPirate(4994),p=g.player,o=p.organization;o.members=[];o.ship.tier=3;o.ship.capacity=24;o.commandActions=1;const r=q.normalizeRelation(g,{id:'crew-locality',name:'Crew QA',role:'ami',faction:'Pirates',region:p.region,location:p.island,npcPower:45,npcPotential:80,trust:90,loyalty:90,respect:80,status:'active'},107);g.relations.push(r);q.recruitKnownRelation(r.id);assert(r.joinedOrganization,'relation did not join organization');
  const dest=(q.constants.PL[p.island][2]||[])[0];assert(dest,'no route for locality test');p.island=dest;p.region=q.constants.PL[dest][0];q.npcTick(12);assert(r.region===p.region&&r.location===p.island,'linked recruit wandered away from player');return p.island
});


test('V2.0 social generation: childhood relations use age-coherent roles',()=>{
  const g=fresh(4995),p=g.player;p.ageMonths=48;
  for(let i=0;i<40;i++){const r=q.createRelation();assert(r.role!=='mentor'&&r.role!=='collègue'&&r.role!=='rival','preschool child generated implausible role: '+r.role);assert(r.faction==='Civil','young child relation generated professional faction')}
  p.ageMonths=96;for(let i=0;i<40;i++){const r=q.createRelation();assert(r.role!=='mentor'&&r.role!=='collègue','child generated adult social role: '+r.role);assert(['Enfance','Formation'].includes(q.npcCareerRank(r)),'child NPC displayed adult career rank: '+q.npcCareerRank(r))}
  return '80 childhood relations coherent'
});


test('V2.0 favors: refused request does not create phantom debt',()=>{
  let found=false,detail='';
  for(let seed=6100;seed<6140&&!found;seed++){const g=fresh(seed),p=g.player;p.ageMonths=300;p.life.socialActions=3;const r=q.normalizeRelation(g,{id:'favor-ref-'+seed,name:'Favor Refusal QA',role:'ami',faction:'Civil',region:p.region,location:p.island,trust:48,loyalty:0,favorBalance:-3,status:'active'},150);g.relations.push(r);const before=r.favorBalance;q.askRelationFavor(r.id);if(r.memories[0]&&/Refuse/.test(r.memories[0].text)){assert(r.favorBalance===before,'refused favor changed debt balance');found=true;detail='seed '+seed+' balance '+r.favorBalance}}
  assert(found,'could not exercise a refused favor path');return detail
});
test('V2.0 mentor lifecycle: mentor recognizes player as a peer',()=>{
  const g=fresh(6150),p=g.player;p.ageMonths=360;Object.keys(p.stats).forEach(k=>p.stats[k]=90);Object.keys(p.skills).forEach(k=>p.skills[k]=88);const r=q.normalizeRelation(g,{id:'peer-qa',name:'Mentor QA',role:'mentor',faction:'Civil',region:p.region,location:p.island,npcPower:40,npcPotential:70,mentorSessions:4,respect:82,trust:78,status:'active'},151);g.relations.push(r);q.npcTick(1);assert(r.peerRecognized,'mentor did not recognize stronger student as peer');assert(r.memories.some(m=>/pair/.test(m.text)),'peer recognition memory missing');return 'peer recognized'
});
test('V2.0 rival lifecycle: five meaningful duels can create a nemesis',()=>{
  const g=fresh(6160),p=g.player;p.ageMonths=360;p.life.socialActions=5;Object.keys(p.stats).forEach(k=>p.stats[k]=98);Object.keys(p.skills).forEach(k=>p.skills[k]=95);p.health=100;p.energy=100;const r=q.normalizeRelation(g,{id:'nemesis-qa',name:'Nemesis QA',role:'rival',faction:'Pirates',region:p.region,location:p.island,npcPower:12,npcPotential:90,rivalry:88,rivalWins:2,rivalLosses:2,lastDuelAge:-999,status:'active'},152);g.relations.push(r);q.challengeRival(r.id);assert((r.rivalWins+r.rivalLosses)===5,'fifth duel not recorded');assert(q.rivalStage(r)==='Némésis','rival did not reach nemesis stage');assert(r.nemesisRecognized,'nemesis recognition flag missing');return r.rivalWins+'-'+r.rivalLosses
});
test('V2.0 rival lifecycle: mature rivalry can reconcile',()=>{
  const g=fresh(6170),p=g.player;p.ageMonths=360;p.life.socialActions=5;const r=q.normalizeRelation(g,{id:'reconcile-qa',name:'Rival Friend QA',role:'rival',faction:'Civil',region:p.region,location:p.island,npcPower:45,npcPotential:75,rivalry:76,rivalWins:2,rivalLosses:2,respect:80,trust:70,affection:65,status:'active'},153);g.relations.push(r);q.reconcileRival(r.id);assert(r.role==='ami','rivalry did not resolve into friendship');assert(r.rivalResolved,'rival resolution flag missing');assert(r.rivalry<50,'rivalry remained too high after reconciliation');return 'rivalry '+Math.round(r.rivalry)
});


test('V2.0 age safety: underage NPC cannot enter romance',()=>{
  const g=fresh(6180),p=g.player;p.ageMonths=300;p.life.socialActions=4;const r=q.normalizeRelation(g,{id:'minor-romance',name:'Minor QA',role:'ami',faction:'Civil',region:p.region,location:p.island,npcAgeMonths:180,attraction:100,affection:100,trust:100,status:'active'},160);g.relations.push(r);q.pursueRomance?q.pursueRomance(r.id):null;assert(!p.life.partnerId,'underage NPC became romantic partner');return 'romance blocked'
});
test('V2.0 age safety: underage NPC cannot join professional organization',()=>{
  const g=adultPirate(6190),p=g.player,o=p.organization;o.commandActions=3;const r=q.normalizeRelation(g,{id:'minor-recruit',name:'Young QA',role:'ami',faction:'Pirates',region:p.region,location:p.island,npcAgeMonths:150,trust:100,loyalty:100,respect:100,status:'active'},161);g.relations.push(r);q.recruitKnownRelation(r.id);assert(!o.members.some(m=>m.linkedRelationId===r.id),'underage NPC joined organization');assert(!r.joinedOrganization,'underage relation flagged as recruited');return 'recruitment blocked'
});
test('V2.0 age safety: child NPC does not gain hidden career levels or roam seas',()=>{
  const g=fresh(6200),p=g.player;p.ageMonths=72;const r=q.normalizeRelation(g,{id:'child-life',name:'Child QA',role:'ami',faction:'Civil',region:p.region,location:p.island,npcAgeMonths:72,npcPower:12,npcPotential:60,careerLevel:0,status:'active'},162);g.relations.push(r);const region=r.region,location=r.location;q.npcTick(60);assert(r.npcAgeMonths===132,'child age did not progress correctly');assert(r.careerLevel===0,'child accumulated hidden career levels');assert(r.region===region&&r.location===location,'child roamed to another region/island');return 'age '+Math.round(r.npcAgeMonths/12)+' years'
});
test('V2.0 migration safety: mentor and partner roles are adult-aged',()=>{
  const g=fresh(6210),p=g.player;p.ageMonths=240;const mentor=q.normalizeRelation(g,{id:'old-mentor',name:'Old Mentor QA',role:'mentor',npcAgeMonths:120,faction:'Civil'},163),partner=q.normalizeRelation(g,{id:'old-partner',name:'Old Partner QA',role:'partenaire',type:'partner',npcAgeMonths:150,faction:'Civil'},164);assert(mentor.npcAgeMonths>=216,'mentor remained underage after normalization');assert(partner.npcAgeMonths>=216,'partner remained underage after normalization');return mentor.npcAgeMonths+'/'+partner.npcAgeMonths+' months'
});


test('V2.0 politics: faction change strains hostile professional relations',()=>{
  const g=fresh(6220),p=g.player;p.ageMonths=300;p.faction='Pirates';g.world.diplomacy[['Marine','Pirates'].sort().join('|')]=-100;
  const weak=q.normalizeRelation(g,{id:'politics-weak',name:'Marine Weak QA',role:'collègue',faction:'Marine',region:p.region,location:p.island,npcAgeMonths:300,trust:45,loyalty:50,respect:50,rivalry:20,status:'active',joinedOrganization:true,type:'organization'},170);
  const strong=q.normalizeRelation(g,{id:'politics-strong',name:'Marine Strong QA',role:'ami',faction:'Marine',region:p.region,location:p.island,npcAgeMonths:300,trust:90,loyalty:90,respect:80,rivalry:10,status:'active'},171);
  g.relations.push(weak,strong);q.realignRelationsAfterFactionChange('Marine','Pirates');
  assert(weak.trust<45&&weak.loyalty<50&&weak.rivalry>20,'hostile relation did not react');assert(strong.trust<90,'strong hostile bond ignored faction change');assert((90-strong.trust)<(45-weak.trust),'strong bond did not resist better');assert(!weak.joinedOrganization,'old organization link survived faction change');return 'weak trust '+weak.trust.toFixed(1)+' / strong '+strong.trust.toFixed(1)
});
test('V2.0 politics: relation in new faction gains alignment',()=>{
  const g=fresh(6230),p=g.player;p.ageMonths=300;p.faction='Pirates';const r=q.normalizeRelation(g,{id:'politics-new',name:'Pirate Ally QA',role:'ami',faction:'Pirates',region:p.region,location:p.island,npcAgeMonths:300,trust:50,respect:50,status:'active'},172);g.relations.push(r);q.realignRelationsAfterFactionChange('Marine','Pirates');assert(r.trust>50&&r.respect>50,'new-faction relation did not strengthen');assert(r.memories.some(m=>m.type==='faction'),'faction alignment memory missing');return 'trust '+r.trust.toFixed(1)
});
test('V2.0 politics: prolonged faction hostility can become personal rivalry',()=>{
  const g=fresh(6240),p=g.player;p.ageMonths=360;p.faction='Pirates';g.world.diplomacy[['Marine','Pirates'].sort().join('|')]=-100;const r=q.normalizeRelation(g,{id:'politics-drift',name:'Marine Drift QA',role:'connaissance',faction:'Marine',region:p.region,location:p.island,npcAgeMonths:300,trust:20,loyalty:35,respect:40,rivalry:61.5,status:'active'},173);g.relations.push(r);q.npcTick(12);assert(r.trust<20,'hostile diplomacy did not erode trust');assert(r.rivalry>61.5,'hostile diplomacy did not increase rivalry');assert(r.role==='rival','political hostility did not cross into personal rivalry');return 'rivalry '+r.rivalry.toFixed(1)
});


test('V2.0 core loop: clicking AVANCER advances the game',()=>{
  const g=fresh(6901),before=g.player.ageMonths;q.bind();const btn=fakeElement('#advanceBtn');assert(typeof btn.onclick==='function','AVANCER has no click handler');btn.onclick();assert(q.getGame().player.ageMonths>before,'clicking AVANCER did not increase age');assert(q.getGame().timeline.length>=1,'timeline disappeared after advancing');return before+' -> '+q.getGame().player.ageMonths+' months'
});
test('V2.0 core loop: pending decisions no longer deadlock AVANCER',()=>{
  const g=fresh(6902);q.bind();g.pending={title:'QA decision',text:'Choose',choices:[['Continue','Resume',function(){}]]};q.render();const btn=fakeElement('#advanceBtn');assert(btn.disabled===false,'AVANCER is disabled while a decision is pending');const age=g.player.ageMonths;btn.onclick();assert(g.player.ageMonths===age,'pending-decision click advanced time instead of opening the decision');assert(g.pending,'pending decision vanished unexpectedly');return 'decision routed through AVANCER'
});
test('V2.0 saves: callback decisions are never persisted as broken JSON',()=>{
  const g=fresh(6903);g.pending={title:'QA decision',text:'Choose',choices:[['Continue','Resume',function(){}]]};q.save();const raw=JSON.parse(localStorage.getItem('opl-v05-1'));assert(raw.pending===null,'pending callback decision was persisted');return 'pending omitted from persisted save'
});
test('V2.0 migration: stale serialized pending decisions are repaired',()=>{
  const g=fresh(6904);g.pending={title:'Broken',text:'Old save',choices:[['Continue','Resume',null]]};const copy=JSON.parse(JSON.stringify(g)),m=q.migrate(copy);assert(m.pending===null,'stale pending decision survived migration');return 'stale pending cleared'
});

test('V2.0 adaptive time: life stages use distinct time windows',()=>{
  const g=fresh(8001),p=g.player;const stages={};
  p.ageMonths=6;stages.infant=q.advancePlan();p.ageMonths=48;stages.child=q.advancePlan();p.ageMonths=120;stages.teen=q.advancePlan();p.ageMonths=300;p.career='Aucune';p.activity='Explorer';stages.adult=q.advancePlan();
  assert(stages.infant.min>=5&&stages.infant.max>=7,'infancy window is too short');
  assert(stages.child.max<stages.infant.max,'childhood should narrow relative to infancy');
  assert(stages.teen.max<=5.5&&stages.teen.max<stages.child.max,'formation window is too long or no longer distinct from childhood');
  assert(stages.adult.max<=3,'adult calm window is too long');
  return 'infant '+stages.infant.min+'-'+stages.infant.max+' / child '+stages.child.min+'-'+stages.child.max+' / teen '+stages.teen.min+'-'+stages.teen.max+' / adult '+stages.adult.min+'-'+stages.adult.max
});
test('V2.0 adaptive time: mission and travel windows respect remaining duration',()=>{
  const g=fresh(8002),p=g.player;p.ageMonths=300;g.mission={remaining:.5,title:'QA mission'};let plan=q.advancePlan(),m=q.chooseAdvanceDuration(plan);assert(m<=.5,'mission step overshot remaining duration');
  g.mission=null;p.travel={remaining:.25,destination:'Shells Town',danger:20};plan=q.advancePlan();m=q.chooseAdvanceDuration(plan);assert(m<=.25,'travel step overshot remaining duration');return 'mission/travel limits respected'
});
test('V2.0 life loop: advance report records visible change',()=>{
  const g=fresh(8003),p=g.player,before=p.ageMonths;q.advance();assert(g.loop&&g.loop.lastAdvance,'advance report missing');assert(g.loop.lastAdvance.months>0,'reported duration invalid');assert(p.ageMonths>before,'time did not advance');assert(Number.isFinite(g.loop.lastAdvance.gainDelta)&&Number.isFinite(g.loop.lastAdvance.powerDelta),'report contains non-finite deltas');return q.durationText(g.loop.lastAdvance.months)+' / '+g.loop.lastAdvance.moments+' moment(s)'
});
test('V2.0 life loop: no more than two truly quiet advances in a row',()=>{
  const g=fresh(8004),p=g.player;p.ageMonths=300;p.career='Aucune';p.activity='Explorer';let maxQuiet=0;
  for(let i=0;i<30;i++){if(g.pending){g.pending=null}q.advance();maxQuiet=Math.max(maxQuiet,g.loop.quietAdvances);assert(g.loop.quietAdvances<=2,'quiet streak exceeded guard at advance '+i)}
  return 'max quiet streak '+maxQuiet
});
test('V2.0 life loop: childhood director never sends a child into generic adult commerce/fight events',()=>{
  const g=fresh(8005),p=g.player;p.ageMonths=48;const money=p.money,wins=p.wins,losses=p.losses;
  for(let i=0;i<40;i++){q.event(6,true);if(g.pending)g.pending=null}
  assert(p.wins===wins&&p.losses===losses,'young child entered generic combat event');
  assert(Math.abs(p.money-money)<1,'young child entered generic money event');
  return '40 forced childhood events remained age-safe'
});
test('V2.0 event director: quiet streak increases interruption chance',()=>{
  const g=fresh(8006);g.loop.quietAdvances=0;const low=q.eventChance(1);g.loop.quietAdvances=2;const high=q.eventChance(1);assert(high>low+.12,'quiet streak barely changes event chance');assert(high<=.68,'event chance exceeded cap');return low.toFixed(2)+' -> '+high.toFixed(2)
});
test('V2.0 migration: V17 save gains life-loop state without losing timeline',()=>{
  let g=fresh(8007);const len=g.timeline.length;delete g.loop;delete g.player.exploration;g.version=17;g=q.migrate(g);assert(g.version===28,'migration did not reach V26');assert(g.loop&&g.loop.advanceCount===0,'loop state missing');assert(g.player.exploration,'exploration state missing');assert(g.timeline.length===len,'timeline changed during migration');return 'V17 -> V26'
});
test('V2.0 UI: life screen exposes adaptive rhythm and last-period report',()=>{
  const g=fresh(8008);q.render();assert(html.includes('id="advanceRhythm"')&&html.includes('id="advanceReport"'),'adaptive life-loop UI missing');assert(fakeElement('#advanceWindowBadge').textContent.length>0,'advance window did not render');q.advance();assert(!fakeElement('#advanceReport').classList.contains('hidden'),'advance report stayed hidden after advancing');return fakeElement('#advanceWindowBadge').textContent
});


test('V2.0 exploration: new life starts with coherent birthplace knowledge',()=>{
  const g=fresh(9001),p=g.player,site=q.explorationSite(p.island);assert(g.version===28,'wrong V2.0 state version');assert(p.exploration&&p.exploration.sites,'exploration state missing');assert(site.familiarity>=20&&site.familiarity<=30,'birthplace familiarity is incoherent');assert(site.visits===1,'birthplace visit count incorrect');return p.island+' '+site.familiarity.toFixed(1)+'%'
});
test('V2.0 exploration: island profiles are deterministic and differentiated',()=>{
  const g=fresh(9002),a=q.islandProfile('Water 7'),b=q.islandProfile('Water 7'),c=q.islandProfile('Wano');assert(JSON.stringify(a)===JSON.stringify(b),'same island profile changed');assert(a.identity!==c.identity,'distinct major islands share identity');assert(a.tags.length>=3&&c.tags.length>=3,'profile tags missing');return a.tags.join('/')+' vs '+c.tags.join('/')
});
test('V2.0 exploration: local exploration gains knowledge and unlocks finite discoveries',()=>{
  const g=fresh(9003),p=g.player;p.ageMonths=300;p.activity='Explorer';const site=q.explorationSite(p.island),start=site.familiarity;for(let i=0;i<24;i++)q.explorationTick(2);assert(site.familiarity>start,'familiarity did not increase');assert(site.familiarity<=100,'familiarity exceeded 100');assert(site.discoveries.length>0,'no discovery unlocked');assert(site.discoveries.length<=q.discoveryPool(p.island).length,'duplicate/excess discoveries');return start.toFixed(1)+' -> '+site.familiarity.toFixed(1)+' / '+site.discoveries.length+' discoveries'
});
test('V2.0 exploration: non-exploration activity does not grant local knowledge',()=>{
  const g=fresh(9004),p=g.player;p.ageMonths=300;p.activity='Entraînement';const site=q.explorationSite(p.island),start=site.familiarity;for(let i=0;i<10;i++)q.explorationTick(2);assert(site.familiarity===start,'knowledge increased outside Explorer activity');return 'stable at '+start.toFixed(1)+'%'
});
test('V2.0 exploration: rumors are grounded and bounded',()=>{
  const g=fresh(9005),p=g.player;p.ageMonths=300;for(let i=0;i<20;i++){p.ageMonths+=3;q.learnLocalRumor(p.island)}const site=q.explorationSite(p.island);assert(site.rumors.length>0,'no rumor learned');assert(site.rumors.length<=6,'rumor history exceeded cap');assert(site.rumors.every(r=>r.text&&r.text.length>15),'empty rumor generated');return site.rumors.length+' stored rumor(s)'
});
test('V2.0 exploration: route estimates are finite and weather modifies travel',()=>{
  const g=fresh(9006),p=g.player;p.ageMonths=300;p.skills.Navigation=40;const dest=q.constants.PL[p.island][2][0],est=q.routeEstimate(p.island,dest);assert(est.months>=.5&&Number.isFinite(est.months),'invalid route duration');assert(est.condition&&Number.isFinite(est.condition.speed)&&Number.isFinite(est.condition.incident),'invalid sea condition');assert(est.load>=0&&est.load<=1,'invalid cargo load ratio');return dest+' '+est.condition.name+' '+est.months+'m'
});
test('V2.0 exploration: sea incidents remain bounded and can progress Navigation',()=>{
  const g=fresh(9007),p=g.player;p.ageMonths=300;p.skills.Navigation=40;const dest=q.constants.PL[p.island][2][0];p.travel={from:p.island,destination:dest,remaining:8,total:8,danger:90,condition:'storm',logs:[],startedAge:p.ageMonths};const before=p.skills.Navigation;for(let i=0;i<80&&g.alive;i++)q.seaJourneyTick(.5);assert(p.travel.logs.length<=5,'journey log exceeded cap');assert(p.exploration.seaIncidents>0,'no sea incident recorded');assert(p.skills.Navigation>=before,'Navigation regressed');return p.exploration.seaIncidents+' incident(s) / Navigation '+before.toFixed(1)+' -> '+p.skills.Navigation.toFixed(1)
});
test('V2.0 exploration: arrival records visit knowledge and Codex place',()=>{
  const g=fresh(9008),p=g.player;p.ageMonths=300;const from=p.island,dest=q.constants.PL[from][2][0];p.travel={from,destination:dest,remaining:.2,total:1,danger:q.infStatic(dest).danger,condition:'calm',logs:[],startedAge:p.ageMonths};q.travel(.5);assert(p.island===dest&&p.travel===null,'arrival failed');assert(p.visited.includes(dest)&&g.codex.places.includes(dest),'destination not registered');const site=q.explorationSite(dest);assert(site.visits>=1&&site.familiarity>0,'arrival did not seed local knowledge');return dest+' familiarity '+site.familiarity.toFixed(1)
});
test('V2.0 exploration: structured discoveries enter Codex exactly once',()=>{
  const g=fresh(9009),p=g.player,site=q.explorationSite(p.island),d=q.discoveryPool(p.island)[0];site.familiarity=100;assert(q.registerDiscovery(p.island,d)===true,'first discovery failed');assert(q.registerDiscovery(p.island,d)===false,'duplicate discovery accepted');assert(g.codex.discoveries.filter(x=>x.id===d.id).length===1,'Codex duplicated discovery');return d.name
});
test('V2.0 exploration: child cannot switch to autonomous exploration',()=>{
  const g=fresh(9010),p=g.player;p.ageMonths=48;p.activity='Grandir';q.setExplorationActivity();assert(p.activity==='Grandir','young child entered autonomous exploration');p.ageMonths=84;q.setExplorationActivity();assert(p.activity==='Explorer','older child could not start exploration');return 'age gate respected'
});
test('V2.0 migration: V18 save gains exploration without losing Codex',()=>{
  let g=fresh(9011);g.codex.people.push('QA Person');delete g.player.exploration;delete g.codex.discoveries;g.version=18;g=q.migrate(g);assert(g.version===28,'migration did not reach V26');assert(g.player.exploration&&g.player.exploration.sites,'exploration state missing');assert(Array.isArray(g.codex.discoveries),'Codex discovery migration missing');assert(g.codex.people.includes('QA Person'),'existing Codex data lost');return 'V18 -> V26'
});
test('V2.0 UI: exploration journey and Codex panels render',()=>{
  const g=fresh(9012);q.renderWorld();for(const id of ['explorationSummary','localDiscoveries','localRumors','codexSummary','codexDiscoveries'])assert(fakeElement('#'+id).innerHTML!==undefined,'UI element unavailable '+id);assert(fakeElement('#explorationBadge').textContent.length>0,'exploration badge empty');return fakeElement('#explorationBadge').textContent
});


test('V2.0 story engine: new life initializes persistent narrative state',()=>{
  const g=fresh(10001);assert(g.version===28,'wrong V2.0 state version');assert(g.story&&Array.isArray(g.story.active)&&Array.isArray(g.story.history),'story state missing');assert(g.story.stats.started===0&&g.story.stats.resolved===0,'story counters not clean');return 'story state ready'
});
test('V2.0 story engine: threads are plain serializable data',()=>{
  const g=fresh(10002),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const st=q.startStory('island-secret');assert(st&&st.type==='island-secret','story did not start');const copy=JSON.parse(JSON.stringify(g));assert(copy.story.active.length===1,'story disappeared in JSON');assert(copy.story.active[0].id===st.id,'story id changed');assert(!JSON.stringify(copy.story).includes('function'),'function leaked into persisted story');return st.title
});
test('V2.0 story engine: scheduled beat becomes a durable decision',()=>{
  const g=fresh(10003),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const st=q.startStory('island-secret');st.nextAge=p.ageMonths;g.story.lastStartAge=p.ageMonths;q.storyTick(.25);assert(st.awaiting===true,'story did not enter awaiting state');assert(q.awaitingStory().id===st.id,'awaiting lookup failed');assert(q.storyChoices(st).length>=2,'decision choices missing');return q.storyPrompt(st)
});
test('V2.0 story engine: AVANCER cannot skip an awaiting story choice',()=>{
  const g=fresh(10004),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const st=q.startStory('island-secret');st.awaiting=true;const age=p.ageMonths;q.advance();assert(p.ageMonths===age,'AVANCER skipped story decision');assert(g.pending&&g.pending.title===st.title,'AVANCER did not surface story decision');return 'age stayed '+age
});
test('V2.0 story engine: awaiting stories survive save and reload without callbacks',()=>{
  let g=fresh(10005),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const st=q.startStory('island-secret');st.awaiting=true;q.save();const raw=JSON.parse(localStorage.getItem('opl-v05-1'));assert(raw.pending===null,'callback pending leaked into save');assert(raw.story.active[0].awaiting===true,'awaiting story not persisted');g=q.migrate(raw);q.setGame(g);assert(q.awaitingStory()&&q.awaitingStory().id===st.id,'story decision could not be reconstructed after reload');return 'rehydrated '+st.id
});
test('V2.2 story engine: abandoning a mystery closes once without counting as success',()=>{
  const g=fresh(10006),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const st=q.startStory('island-secret');st.awaiting=true;const resolved=g.story.stats.resolved,abandoned=g.story.stats.abandoned;q.storyChoice(st.id,'leave');assert(q.activeStories().every(x=>x.id!==st.id),'abandoned story remained active');assert(g.story.history.filter(x=>x.id===st.id).length===1,'story history duplicated or missing');assert(g.story.stats.resolved===resolved,'abandonment counted as successful resolution');assert(g.story.stats.abandoned===abandoned+1,'abandoned counter incorrect');return g.story.history[0].outcome
});
test('V2.0 story engine: helping a relation changes the relationship later',()=>{
  const g=fresh(10007),p=g.player;p.ageMonths=300;p.money=50000;const r=q.createRelation('ami'),trust=r.trust,st=q.startStory('social-favor');assert(st&&st.participantId,'social story missing participant');st.awaiting=true;q.storyChoice(st.id,'help');st.nextAge=p.ageMonths;g.story.lastStartAge=p.ageMonths;q.storyTick(.25);const rel=q.getGame().relations.find(x=>x.id===st.participantId);assert(g.story.history.some(x=>x.id===st.id),'social story did not resolve');assert(rel.trust>trust,'help did not improve trust');assert(rel.favorBalance>0,'help did not create social debt');return rel.name+' trust '+trust.toFixed(1)+' -> '+rel.trust.toFixed(1)
});
test('V2.0 story engine: cautious career choice grants bounded career progress',()=>{
  const g=fresh(10008),p=g.player;p.ageMonths=300;p.career='Civil';p.faction='Civil';const rec=q.careerRecord(),xp=rec.xp,st=q.startStory('career-crossroads');assert(st,'career story did not start');st.awaiting=true;q.storyChoice(st.id,'steady');st.nextAge=p.ageMonths;g.story.lastStartAge=p.ageMonths;q.storyTick(.25);assert(rec.xp>xp,'career story gave no XP');assert(rec.xp-xp<=20,'safe career branch over-rewarded XP');return 'XP +'+(rec.xp-xp)
});
test('V2.0 story engine: defying authorities has persistent justice consequences',()=>{
  const g=fresh(10009),p=g.player;p.ageMonths=300;p.faction='Pirates';p.justice.regionalHeat[p.region]=45;const heat=p.justice.regionalHeat[p.region],rep=p.reputation,st=q.startStory('justice-shadow');assert(st,'justice story did not start');st.awaiting=true;q.storyChoice(st.id,'defy');st.nextAge=p.ageMonths;g.story.lastStartAge=p.ageMonths;q.storyTick(.25);assert(p.justice.regionalHeat[p.region]>heat,'defiance did not raise heat');assert(p.reputation>rep,'defiance did not raise reputation');return 'heat '+heat+' -> '+p.justice.regionalHeat[p.region]
});
test('V2.0 story engine: local mysteries break when the player sails away',()=>{
  const g=fresh(10010),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const st=q.startStory('island-secret');p.travel={from:p.island,destination:q.constants.PL[p.island][2][0],remaining:2,total:2,danger:20,condition:'calm',logs:[]};g.story.lastStartAge=p.ageMonths;q.storyTick(.25);assert(!q.activeStories().some(x=>x.id===st.id),'local mystery followed player to sea');const h=g.story.history.find(x=>x.id===st.id);assert(h&&h.outcome==='piste laissée derrière','departure outcome incorrect');return h.outcome
});
test('V2.0 story engine: death closes every active thread',()=>{
  const g=fresh(10011),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;q.startStory('island-secret');q.createRelation('ami');q.startStory('social-favor');const count=q.activeStories().length;assert(count>=1,'no active story to test');q.die('QA narrative death');assert(q.activeStories().length===0,'stories survived player death');assert(g.story.stats.interrupted>=count,'death did not archive interrupted stories');return count+' interrupted thread(s)'
});
test('V2.0 story engine: migration from V19 preserves existing game data',()=>{
  let g=fresh(10012);g.codex.people.push('Narrative Witness');delete g.story;g.version=19;g=q.migrate(g);q.setGame(g);assert(g.version===28,'migration did not reach V26');assert(g.story&&Array.isArray(g.story.active),'story engine missing after migration');assert(g.codex.people.includes('Narrative Witness'),'existing save data lost');return 'V19 -> V26'
});
test('V2.0 story UI: active threads and history render independently of callbacks',()=>{
  const g=fresh(10013),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const st=q.startStory('island-secret');q.renderStories();assert(fakeElement('#storyEngineBadge').textContent.length>0,'story badge empty');assert(fakeElement('#activeStories').innerHTML.includes(st.title),'active story missing from UI');st.awaiting=true;q.render();assert(!fakeElement('#attentionCard').classList.contains('hidden'),'attention card did not surface story choice');return fakeElement('#storyEngineBadge').textContent
});
test('V2.0 story engine: active thread count never exceeds two through natural starts',()=>{
  const g=fresh(10014),p=g.player;p.ageMonths=300;p.career='Civil';p.faction='Civil';p.activity='Explorer';q.explorationSite(p.island).familiarity=70;q.createRelation('ami');for(let i=0;i<160;i++){g.story.lastStartAge=-999;q.maybeStartStory(4);assert(q.activeStories().length<=2,'more than two active stories');if(q.activeStories().length>=2)break}assert(q.activeStories().length<=2,'active cap failed');return q.activeStories().length+' active'
});

test('V2.0 progression: difficulty modes have distinct growth rates',()=>{
  const g=fresh(7001),p=g.player;p.ageMonths=300;p.stats.Force=40;p.caps.Force=90;const rates={};
  for(const d of ['Casual','Standard','Grand Line','New World','Ironman']){p.difficulty=d;p.stats.Force=40;rates[d]=q.gain('Force',1)}
  assert(rates.Casual>rates.Standard,'Casual should progress faster than Standard');
  assert(rates.Standard>rates['Grand Line']&&rates['Grand Line']>rates['New World']&&rates['New World']>rates.Ironman,'harder modes do not progressively slow growth');
  return Object.entries(rates).map(([k,v])=>k+' '+v.toFixed(3)).join(' / ')
});
test('V2.0 progression: childhood development is slower than adult training',()=>{
  const g=fresh(7010),p=g.player;p.difficulty='Standard';p.caps.Force=95;p.stats.Force=30;p.ageMonths=48;const child=q.gain('Force',2);p.stats.Force=30;p.ageMonths=300;const adult=q.gain('Force',2);
  assert(adult>child*2,'child growth modifier is not meaningfully lower');return 'child '+child.toFixed(2)+' / adult '+adult.toFixed(2)
});
test('V2.0 progression: six childhood years do not create an elite fighter',()=>{
  const g=fresh(7020),p=g.player;p.activity='Grandir';for(let i=0;i<12;i++){p.ageMonths+=6;q.train(6)}
  const avg=Object.values(p.stats).reduce((a,b)=>a+b,0)/Object.values(p.stats).length,max=Math.max(...Object.values(p.stats));
  assert(avg<32,'average physical/mental stats too high at age 6: '+avg);assert(max<60,'single stat became implausibly elite at age 6: '+max);return 'avg '+avg.toFixed(1)+' / max '+max.toFixed(1)
});
test('V2.3 progression: technique mastery follows the adaptive combat focus',()=>{
  const g=fresh(7030),p=g.player;p.ageMonths=300;p.style='Sabreur';const def=q.allTechniqueDefs().find(x=>x.skill==='Sabre');assert(def,'no Sabre technique definition');p.techniques=[def.id];p.techniqueMastery[def.id]=25;
  p.focus='Carrière';q.train(3);const afterCareer=p.techniqueMastery[def.id];assert(Math.abs(afterCareer-25)<.001,'career focus improved sword technique mastery');
  p.focus='Combat';q.train(3);assert(p.techniqueMastery[def.id]>afterCareer,'Sabreur Combat focus did not improve Sabre technique mastery');return afterCareer.toFixed(1)+' -> '+p.techniqueMastery[def.id].toFixed(1)
});
test('V2.0 progression: technique mastery changes effective combat value',()=>{
  const g=fresh(7035),p=g.player;p.ageMonths=300;const def=q.allTechniqueDefs().find(x=>x.skill==='Combat');assert(def,'no Combat technique');p.techniques=[def.id];p.techniqueMastery[def.id]=1;const low=q.techniqueBonus();p.techniqueMastery[def.id]=100;const high=q.techniqueBonus();assert(high>low*2,'mastery barely changes technique value');assert(high<=def.bonus+.001,'effective bonus exceeded definition max');return low.toFixed(2)+' -> '+high.toFixed(2)
});
test('V2.0 progression: global power rewards combat ability, not unrelated professions',()=>{
  const g=fresh(7037),p=g.player;p.ageMonths=300;for(const k of q.constants.ST)p.stats[k]=50;for(const k of q.constants.SK)p.skills[k]=10;p.style='Équilibré';const base=q.power();p.skills.Médecine=100;const medicine=q.power();p.skills.Médecine=10;p.skills.Combat=100;const combat=q.power();assert(medicine-base<2,'Medicine inflates combat power too much');assert(combat-base>15,'Combat skill does not materially affect global power');return 'Medicine +'+(medicine-base).toFixed(1)+' / Combat +'+(combat-base).toFixed(1)
});
test('V2.0 progression: advanced powers develop slower in childhood',()=>{
  const g=fresh(7038),p=g.player;p.latent.Observation=100;p.haki.Observation=10;p.ageMonths=60;const h0=p.haki.Observation;q.trainHaki('Observation',12);const childH=p.haki.Observation-h0;p.haki.Observation=10;p.ageMonths=300;q.trainHaki('Observation',12);const adultH=p.haki.Observation-10;assert(adultH>childH*2,'Haki age scaling is too weak');
  p.fruit='QA Fruit';p.fruitMastery=10;p.ageMonths=60;q.trainFruit(12);const childF=p.fruitMastery-10;p.fruitMastery=10;p.ageMonths=300;q.trainFruit(12);const adultF=p.fruitMastery-10;assert(adultF>childF*2,'Fruit mastery age scaling is too weak');return 'Haki '+childH.toFixed(2)+'/'+adultH.toFixed(2)+' • Fruit '+childF.toFixed(2)+'/'+adultF.toFixed(2)
});
test('V2.0 progression: snapshots record global evolution',()=>{
  const g=fresh(7040),p=g.player;const n=p.progression.snapshots.length;p.ageMonths+=6;p.activity='Entraînement';q.train(6);q.recordProgressSnapshot(false);assert(p.progression.snapshots.length===n+1,'six-month progression snapshot missing');const d=q.progressionDelta();assert(Number.isFinite(d.power)&&d.months===6,'invalid progression delta');return 'power delta '+d.power.toFixed(2)
});
test('V2.0 progression: breakthroughs cannot exceed extraordinary ceiling',()=>{
  const g=fresh(7050),p=g.player;p.ageMonths=300;for(const k of [...q.constants.ST,...q.constants.SK]){const b=p.stats[k]!=null?p.stats:p.skills;b[k]=20;p.caps[k]=80;p.absoluteCaps[k]=80}
  p.skills.Combat=80;p.caps.Combat=80;p.absoluteCaps.Combat=81;let hit=false;for(let i=0;i<400&&!hit;i++)hit=q.attemptBreakthrough('combat',100);
  assert(hit,'favorable breakthrough path was never reached');assert(p.caps.Combat>80&&p.caps.Combat<=81,'breakthrough exceeded absolute ceiling');return 'Combat cap '+p.caps.Combat
});
test('V2.0 UI: main render is lazy instead of rebuilding every heavy panel',()=>{
  const renderBody=appSource.slice(appSource.indexOf('function render(){'),appSource.indexOf('\nfunction deathModal'));
  assert(renderBody.includes('renderPanel(activeTab)'),'active-panel renderer missing');
  assert(!renderBody.includes('renderChar();renderAb();renderRel();renderWorld()'),'legacy full-render chain still present');
  assert(html.includes('id="characterSectionTabs"')&&html.includes('id="abilitiesSectionTabs"')&&html.includes('id="relationsSectionTabs"')&&html.includes('id="worldSectionTabs"'),'segmented navigation containers missing');
  return 'lazy panel render + segmented navigation'
});
test('V2.0 UI: every primary tab renders independently',()=>{
  const g=fresh(7065);q.setupSectionNavigation();for(const tab of ['life','abilities','character','relations','world'])q.activateTab(tab,false);return '5 primary tabs rendered independently'
});
test('V2.0 migration: existing saves gain layered caps without changing current ceilings',()=>{
  let g=fresh(7060);const oldCaps={...g.player.caps};delete g.player.naturalCaps;delete g.player.absoluteCaps;delete g.player.progression;delete g.player.exploration;g.version=18;g=q.migrate(g);
  assert(g.version===28,'migration did not reach V26');for(const k of [...q.constants.ST,...q.constants.SK]){assert(g.player.caps[k]===oldCaps[k],'current cap changed during migration for '+k);assert(g.player.absoluteCaps[k]>=g.player.caps[k],'absolute cap below current cap for '+k)}
  assert(g.player.progression&&Array.isArray(g.player.progression.snapshots),'progression state missing');return 'layered caps migrated'
});


test('V2.1 progression: every displayed stat has a targeted training path',()=>{
  fresh(11001);
  const activities=['Études','Entraînement','Renforcement','Mobilité','Condition physique','Mental','Navigation','Sabre','Tir','Médecine','Commandement','Discrétion','Science','Formation Marine','Formation Pirates','Formation Révolutionnaires','Formation Gouvernement'];
  const covered=new Set(activities.flatMap(a=>q.activityGrowthKeys(a)));
  for(const k of q.constants.ST)assert(covered.has(k),'no targeted training path for stat '+k);
  return q.constants.ST.join(', ');
});
test('V2.1 progression: every displayed skill has a targeted training path',()=>{
  fresh(11002);
  const activities=['Études','Entraînement','Renforcement','Mobilité','Condition physique','Mental','Navigation','Sabre','Tir','Médecine','Commandement','Discrétion','Science','Formation Marine','Formation Pirates','Formation Révolutionnaires','Formation Gouvernement'];
  const covered=new Set(activities.flatMap(a=>q.activityGrowthKeys(a)));
  for(const k of q.constants.SK)assert(covered.has(k),'no targeted training path for skill '+k);
  return q.constants.SK.join(', ');
});
test('V2.3 progression: Forme automatically improves the two weakest physical attributes',()=>{
  const g=fresh(11003),p=g.player;p.ageMonths=300;p.focus='Forme';Object.assign(p.stats,{Force:70,Vitesse:12,Agilité:13,Endurance:65,Résistance:60,Réflexes:68});p.caps.Vitesse=90;p.caps.Agilité=90;
  const v=p.stats.Vitesse,a=p.stats.Agilité;q.train(2);
  assert(p.stats.Vitesse>v,'Vitesse did not improve under adaptive Forme');
  assert(p.stats.Agilité>a,'Agilité did not improve under adaptive Forme');
  return v.toFixed(1)+'/'+a.toFixed(1)+' -> '+p.stats.Vitesse.toFixed(1)+'/'+p.stats.Agilité.toFixed(1);
});
test('V2.3 progression: each simple focus improves the targets selected by the engine',()=>{
  const focuses=['Équilibre','Combat','Forme','Carrière'];
  for(let i=0;i<focuses.length;i++){const focus=focuses[i],g=fresh(11100+i),p=g.player;p.ageMonths=300;if(focus==='Carrière'){q.join('Civil');p.specialization='Scientifique';q.careerRecord().specialization='Scientifique'}p.focus=focus;for(const k of [...q.constants.ST,...q.constants.SK]){const b=p.stats[k]!=null?p.stats:p.skills;b[k]=20;p.caps[k]=90}if(focus==='Combat')p.style='Sabreur';const keys=q.simpleFocusKeys(focus),before=keys.map(k=>(p.stats[k]!=null?p.stats:p.skills)[k]);q.train(1);keys.forEach((k,j)=>assert((p.stats[k]!=null?p.stats:p.skills)[k]>before[j],focus+' did not improve '+k))}
  return focuses.join(', ');
});
test('V2.4 UI: progression surface exposes Auto and only simple manual overrides',()=>{
  const g=fresh(11005);g.player.ageMonths=300;g.player.career='Civil';g.player.faction='Civil';g.player.focus='Auto';q.renderActivityOptions();const htmlOut=fakeElement('#activityOptions').innerHTML;
  for(const a of ['Auto','Combat','Forme','Carrière'])assert(htmlOut.includes(a),'missing simple focus '+a);
  for(const legacy of ['Renforcement','Mobilité','Condition physique','Mental','Médecine','Commandement','Discrétion','Science'])assert(!htmlOut.includes('>'+legacy+'<'),'legacy micro-training still exposed: '+legacy);
  assert(!htmlOut.includes('>Équilibre<'),'Équilibre should be handled inside Auto rather than exposed as a permanent first-level button');
  return q.focusOptions().join(', ');
});
test('V2.1 migration: V20 save upgrades without altering progression values',()=>{
  let g=fresh(11006),p=g.player;p.stats.Agilité=37;p.stats.Vitesse=41;p.skills.Tir=29;g.version=20;
  g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.version===28,'migration did not reach V26');assert(g.player.stats.Agilité===37&&g.player.stats.Vitesse===41&&g.player.skills.Tir===29,'progression values changed during V20 -> V26 migration');
  return 'V20 -> V26';
});


test('V2.4 adaptive time: progression focus no longer forces short adult pacing',()=>{
  const g=fresh(11007),p=g.player;p.ageMonths=300;p.career='Aucune';p.activity='Mobilité';p.focus='Forme';const plan=q.advancePlan();
  assert(plan.key==='calm-life','progression focus still forces active-life pacing');
  assert(plan.min===4.5&&plan.max===6.5,'calm adult window is wrong');
  return plan.label+' '+plan.min+'-'+plan.max+' months';
});


test('V2.6 creation uses GameState 26',()=>{
  const g=fresh(12001);assert(g.version===28,'new life did not start on V26');return 'V26';
});
test('V2.2 mission taxonomy assigns every mission a valid profile',()=>{
  fresh(12002);let count=0;
  for(const list of Object.values(q.constants.MISSIONS))for(const m of list){const p=q.missionProfile(m);assert(p&&p.config&&p.config.label,'missing mission profile for '+m.title);count++}
  return count+' missions profiled';
});
test('V2.2 medicine mission depends on Medicine rather than combat power',()=>{
  const g=fresh(12003),p=g.player;p.ageMonths=300;q.join('Civil');p.specialization='Médecin';q.careerRecord().specialization='Médecin';
  const m={title:'Soigner un équipage blessé',danger:38,reward:1000,xp:10,tier:1,spec:'Médecin',profile:'medicine'};
  p.skills.Médecine=8;p.skills.Science=8;p.stats.Discipline=20;p.stats.Réflexes=20;const low=q.missionChance(m);
  p.skills.Médecine=80;p.skills.Science=65;p.stats.Discipline=70;p.stats.Réflexes=55;const high=q.missionChance(m);
  assert(high>low+.25,'Medicine barely affects medical mission chance');return low.toFixed(2)+' -> '+high.toFixed(2);
});
test('V2.2 noncombat mission can resolve without adding combat wins or losses',()=>{
  const g=fresh(12004),p=g.player;p.ageMonths=300;q.join('Civil');p.skills.Médecine=95;p.skills.Science=90;p.stats.Discipline=90;p.stats.Réflexes=80;
  const m={title:'Soigner un équipage blessé',danger:20,reward:1000,xp:10,tier:1,spec:'Médecin',profile:'medicine'},w=p.wins,l=p.losses;
  const r=q.missionResolution(m);assert(!r.dead,'medical mission killed player');assert(p.wins===w&&p.losses===l,'noncombat mission changed combat record');return r.profile+' '+Math.round(r.chance*100)+'%';
});
test('V2.2 scientist career can qualify through expertise',()=>{
  const g=fresh(12005),p=g.player;p.ageMonths=300;q.join('Civil');p.specialization='Scientifique';q.careerRecord().specialization='Scientifique';
  Object.keys(p.stats).forEach(k=>p.stats[k]=8);Object.keys(p.skills).forEach(k=>p.skills[k]=8);
  p.skills.Science=72;p.stats.Discipline=68;p.skills.Navigation=55;const expert=q.careerExpertise(),qual=q.careerQualification();
  assert(expert>60,'scientist expertise too low');assert(qual>12,'scientist qualification still tied to combat power');return 'expertise '+expert.toFixed(1)+' / qualification '+qual.toFixed(1);
});
test('V2.3 career XP rewards the simple Career focus',()=>{
  const g=fresh(12006),p=g.player;p.ageMonths=300;q.join('Civil');p.specialization='Scientifique';q.careerRecord().specialization='Scientifique';
  p.focus='Carrière';const aligned=q.careerActivityFit();p.focus='Forme';const off=q.careerActivityFit();
  assert(aligned>off,'Career focus is not better for career progression');return aligned.toFixed(2)+' vs '+off.toFixed(2);
});
test('V2.2 debt migration converts negative cash into explicit debt',()=>{
  let g=fresh(12007);g.version=21;g.player.money=-12500;g.player.life.debt=0;g=q.migrate(JSON.parse(JSON.stringify(g)));
  assert(g.version===28,'migration did not reach V26');assert(g.player.money===0,'negative cash survived migration');assert(g.player.life.debt>=12500,'debt was not created');return Math.round(g.player.life.debt)+' B debt';
});
test('V2.2 living costs create debt without negative Berry',()=>{
  const g=fresh(12008),p=g.player;p.ageMonths=300;p.career='Aucune';p.money=0;p.life.debt=0;q.lifeTick(2);
  assert(p.money>=0,'Berry became negative');assert(p.life.debt>0,'unfunded living costs did not become debt');return Math.round(p.life.debt)+' B';
});
test('V2.2 social favor cannot erase debt through a negative payment',()=>{
  const g=fresh(12009),p=g.player;p.ageMonths=300;p.money=0;const r=q.createRelation('ami'),st=q.startStory('social-favor');assert(st,'social favor did not start');st.awaiting=true;st.data.cost=4000;
  q.storyChoice(st.id,'help');assert(p.money===0,'helping changed zero Berry incorrectly');assert(st.data.paid===0,'negative/phantom payment recorded');return 'paid 0 B';
});
test('V2.2 abandoning a story no longer counts as a successful resolution',()=>{
  const g=fresh(12010),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const st=q.startStory('island-secret');st.awaiting=true;
  const before=g.story.stats.resolved;q.storyChoice(st.id,'leave');assert(g.story.stats.resolved===before,'abandonment increased resolved counter');assert(g.story.stats.abandoned===1,'abandonment counter did not increase');return 'abandoned '+g.story.stats.abandoned;
});
test('V2.2 death classifies active stories as interrupted',()=>{
  const g=fresh(12011),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;q.startStory('island-secret');const before=g.story.stats.interrupted;q.die('QA');
  assert(g.story.stats.interrupted>before,'death did not increment interrupted stories');return g.story.stats.interrupted+' interrupted';
});
test('V2.2 mobile style mastery rewards agility and speed',()=>{
  const g=fresh(12012),p=g.player;p.style='Mobile / esquive';p.skills.Combat=30;p.stats.Agilité=80;p.stats.Vitesse=70;const mobile=q.styleMastery();
  p.style='Corps-à-corps';p.stats.Force=20;p.stats.Endurance=20;const melee=q.styleMastery();
  assert(mobile>melee+15,'mobile style does not meaningfully reward mobility stats');return mobile.toFixed(1)+' vs '+melee.toFixed(1);
});


test('V2.2 equal-stat combat profiles stay in the same baseline band',()=>{
  const g=fresh(12013),p=g.player;p.ageMonths=300;for(const k of q.constants.ST)p.stats[k]=50;for(const k of q.constants.SK)p.skills[k]=50;p.haki={Observation:0,Armement:0,Conquérant:0};p.fruit=null;
  const vals={};for(const style of ['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive']){p.style=style;const c=q.combatProfile();vals[style]=c.offense*.58+c.defense*.34+c.stamina*.08}
  const arr=Object.values(vals),spread=Math.max(...arr)-Math.min(...arr);assert(spread<5,'equal-stat styles have an excessive baseline spread: '+spread.toFixed(2));return JSON.stringify(vals);
});
test('V2.2 sword victories progress Sabre as the primary combat skill',()=>{
  const g=fresh(12014),p=g.player;p.ageMonths=300;p.style='Sabreur';for(const k of q.constants.ST)p.stats[k]=80;for(const k of q.constants.SK)p.skills[k]=40;p.skills.Sabre=45;p.caps.Sabre=95;p.caps.Combat=95;
  const before=p.skills.Sabre;for(let i=0;i<12&&p.skills.Sabre===before;i++){p.health=100;p.energy=100;g.alive=true;q.fight(20,'QA sword fight')}
  assert(p.skills.Sabre>before,'Sabreur victory did not progress Sabre');return before.toFixed(1)+' -> '+p.skills.Sabre.toFixed(1);
});
test('V2.4 lazy wealth UI exposes explicit debt in Situation',()=>{
  const g=fresh(12015),p=g.player;p.ageMonths=300;p.life.debt=12345;q.setSectionState('character','situation');q.renderChar();assert(fakeElement('#economySummary').innerHTML.includes('Dette'),'debt is absent from wealth UI');assert(fakeElement('#economySummary').innerHTML.includes('12 345')||fakeElement('#economySummary').innerHTML.includes('12 345')||fakeElement('#economySummary').innerHTML.includes('12345'),'debt amount is absent from wealth UI');return 'debt visible';
});


test('V2.2 every noncombat mission profile rewards its relevant build',()=>{
  const cases={
    navigation:{title:'Cartographier une route dangereuse',keys:['Navigation','Discipline','Réflexes','Endurance']},
    medicine:{title:'Soigner un équipage blessé',keys:['Médecine','Science','Discipline','Réflexes']},
    science:{title:'Étudier un phénomène rare',keys:['Science','Discipline','Navigation','Commandement']},
    stealth:{title:'Opération de renseignement',keys:['Discrétion','Agilité','Réflexes','Discipline']},
    command:{title:'Sécuriser un royaume allié',keys:['Commandement','Volonté','Discipline','Combat']},
    trade:{title:'Ouvrir une route commerciale',keys:['Commandement','Navigation','Discipline','Science']},
    hunt:{title:'Traque longue distance',keys:['Réflexes','Discrétion','Navigation','Combat']},
    exploration:{title:'Chasse au trésor',keys:['Navigation','Discipline','Réflexes','Science']},
    rescue:{title:'Évacuer des civils',keys:['Médecine','Commandement','Endurance','Navigation']}
  };
  const g=fresh(12016),p=g.player;p.ageMonths=300;
  for(const [profile,c] of Object.entries(cases)){
    for(const k of q.constants.ST)p.stats[k]=10;for(const k of q.constants.SK)p.skills[k]=10;
    const m={title:c.title,danger:55,reward:0,xp:0,tier:2,profile};
    const low=q.missionChance(m);for(const k of c.keys){if(p.stats[k]!=null)p.stats[k]=75;else p.skills[k]=75}const high=q.missionChance(m);
    assert(high>=low+.20,profile+' build barely changes mission chance: '+low.toFixed(2)+' -> '+high.toFixed(2));
  }
  return Object.keys(cases).length+' specialist profiles verified';
});
test('V2.2 combat styles remain comparable at equal attributes',()=>{
  const styles=['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],rates={};
  for(let si=0;si<styles.length;si++){
    const g=fresh(12100+si),p=g.player;p.ageMonths=300;p.style=styles[si];for(const k of q.constants.ST)p.stats[k]=50;for(const k of q.constants.SK)p.skills[k]=50;p.haki={Observation:0,Armement:0,Conquérant:0};p.fruit=null;let wins=0;
    for(let i=0;i<200;i++){g.alive=true;g.death=null;p.health=100;p.energy=100;p.conditions=[];if(q.fight(50,'V2.2 style audit'))wins++}
    rates[styles[si]]=wins/200;
  }
  const vals=Object.values(rates),spread=Math.max(...vals)-Math.min(...vals);assert(spread<=.18,'equal-stat style win-rate spread too large: '+spread.toFixed(2)+' '+JSON.stringify(rates));return JSON.stringify(rates);
});


test('V2.4 focus surface stays at five choices or fewer',()=>{
  const g=fresh(13001),p=g.player;p.ageMonths=300;q.join('Civil');p.specialization='Scientifique';q.careerRecord().specialization='Scientifique';
  const opts=q.focusOptions();assert(opts.length<=5,'too many focus choices: '+opts.length);assert(new Set(opts).size===opts.length,'duplicate focuses');return opts.join(' / ');
});
test('V2.3 Combat focus adapts to fighting style',()=>{
  const g=fresh(13002),p=g.player;p.ageMonths=300;
  p.style='Sabreur';assert(JSON.stringify(q.simpleFocusKeys('Combat'))===JSON.stringify(['Sabre','Réflexes']),'Sabreur focus incorrect');
  p.style='Tireur';assert(JSON.stringify(q.simpleFocusKeys('Combat'))===JSON.stringify(['Tir','Réflexes']),'Tireur focus incorrect');
  p.style='Mobile / esquive';assert(JSON.stringify(q.simpleFocusKeys('Combat'))===JSON.stringify(['Combat','Agilité']),'Mobile focus incorrect');
  return 'style-adaptive';
});
test('V2.3 Forme automatically targets weakest physical attributes',()=>{
  const g=fresh(13003),p=g.player;p.ageMonths=300;
  Object.assign(p.stats,{Force:70,Vitesse:60,Agilité:15,Endurance:55,Résistance:20,Réflexes:65});
  const keys=q.simpleFocusKeys('Forme');assert(keys.includes('Agilité')&&keys.includes('Résistance'),'weak physical stats were not selected: '+keys.join(','));return keys.join(' + ');
});
test('V2.3 Carrière focus adapts to specialization',()=>{
  const g=fresh(13004),p=g.player;p.ageMonths=300;q.join('Civil');p.specialization='Médecin';q.careerRecord().specialization='Médecin';
  p.skills.Médecine=12;p.skills.Science=18;p.stats.Discipline=70;const keys=q.simpleFocusKeys('Carrière');
  assert(keys.includes('Médecine')&&keys.includes('Science'),'medical career focus ignored weakest professional skills: '+keys.join(','));return keys.join(' + ');
});
test('V2.3 Équilibre automatically corrects one weak stat and one weak skill',()=>{
  const g=fresh(13005),p=g.player;p.ageMonths=300;p.ambition='Faire fortune';
  for(const k of q.constants.ST)p.stats[k]=60;for(const k of q.constants.SK)p.skills[k]=60;p.stats.Vitesse=8;p.skills.Navigation=7;
  const keys=q.simpleFocusKeys('Équilibre');assert(keys.includes('Vitesse')&&keys.includes('Navigation'),'balanced focus did not target weak axes');return keys.join(' + ');
});
test('V2.3 power focus stays contextual',()=>{
  const g=fresh(13006),p=g.player;p.ageMonths=120;p.fruit=null;p.haki={Observation:0,Armement:0,Conquérant:0};p.latent={Observation:40,Armement:45,Conquérant:0};
  assert(!q.focusOptions().includes('Pouvoirs'),'power focus exposed without relevant power path');
  p.ageMonths=180;p.latent.Observation=80;assert(q.focusOptions().includes('Pouvoirs'),'power focus missing with strong latent Haki');return 'contextual';
});
test('V2.3 legacy training choices migrate into persistent simple focuses',()=>{
  let g=fresh(13007),p=g.player;p.ageMonths=300;p.focus=null;p.activity='Mobilité';g.version=22;g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.version===28,'migration did not reach V26');assert(g.player.focus==='Forme','Mobilité did not migrate to Forme focus');assert(g.player.activity==='Routine','legacy training activity was not simplified');
  g.player.focus=null;g.player.activity='Médecine';q.normalizeActivityFocus(g.player,g);assert(g.player.focus==='Carrière','Médecine did not normalize to Carrière focus');return 'legacy focus migration';
});
test('V2.3 focus migration preserves active travel context',()=>{
  let g=fresh(13008),p=g.player;p.ageMonths=300;p.focus='Combat';p.activity='Navigation';p.travel={from:p.island,destination:p.island,remaining:1,total:1,danger:10,condition:'calm',logs:[]};g.version=22;
  g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.player.activity==='Navigation','travel activity was overwritten during migration');assert(g.player.focus==='Combat','persistent focus was overwritten during travel migration');return 'travel + focus preserved';
});
test('V2.3 mission board shows at most three contextual opportunities',()=>{
  const g=fresh(13009),p=g.player;p.ageMonths=300;q.join('Civil');p.specialization='Scientifique';q.careerRecord().specialization='Scientifique';const b=q.board();
  assert(b.length<=3,'mission board exposes more than three choices');if(b.length)assert(b[0].recommended===true,'first mission is not marked recommended');return b.map(x=>x.title).join(' / ');
});
test('V2.4 specialization and ambition surfaces each collapse into one contextual control',()=>{
  const g=fresh(13010),p=g.player;p.ageMonths=300;q.join('Civil');
  q.setSectionState('character','career');q.renderChar();const spec=fakeElement('#specializationOptions').innerHTML;
  q.setSectionState('character','profile');q.renderChar();const amb=fakeElement('#ambitionOptions').innerHTML;
  assert((spec.match(/<button/g)||[]).length===1,'specialization surface has more than one persistent button');
  assert((amb.match(/<button/g)||[]).length===1,'ambition surface has more than one persistent button');return '1 + 1 controls';
});
test('V2.3 simplified section navigation reduces permanent sub-tabs',()=>{
  const g=fresh(13011);q.render();q.setupSectionNavigation();
  const counts=['#characterSectionTabs','#abilitiesSectionTabs','#relationsSectionTabs','#worldSectionTabs'].map(sel=>(fakeElement(sel).innerHTML.match(/section-tab/g)||[]).length);
  assert(counts[0]===3&&counts[1]===3&&counts[2]===2&&counts[3]===3,'unexpected simplified tab counts '+counts.join('/'));return counts.join('/');
});
test('V2.3 recommended focus reacts to ambition and condition',()=>{
  const g=fresh(13012),p=g.player;p.ageMonths=300;p.career='Civil';p.faction='Civil';
  p.ambition='Devenir puissant';p.health=100;p.energy=100;assert(q.recommendedFocus()==='Combat','power ambition did not recommend Combat');
  p.health=60;assert(q.recommendedFocus()==='Forme','low health did not prioritize Forme');return 'adaptive recommendation';
});


test('V2.3 exploration does not erase the progression focus',()=>{
  const g=fresh(13013),p=g.player;p.ageMonths=300;p.focus='Combat';p.activity='Routine';q.setExplorationActivity();
  assert(p.activity==='Explorer','exploration context did not activate');assert(p.focus==='Combat','exploration erased persistent focus');return p.activity+' / '+p.focus;
});
test('V2.3 missions do not erase the progression focus',()=>{
  const g=fresh(13014),p=g.player;p.ageMonths=300;q.join('Civil');p.focus='Forme';const b=q.board();assert(b.length,'no mission available');q.startMission(0);
  assert(p.focus==='Forme','mission erased persistent focus');assert(g.mission,'mission did not start');return g.mission.title+' / '+p.focus;
});
test('V2.3 focus selection changes focus without faking the current activity',()=>{
  const g=fresh(13015),p=g.player;p.ageMonths=300;p.activity='Explorer';p.focus='Équilibre';q.renderActivityOptions();
  const before=p.activity;const btn=fakeElement('#activityOptions');assert(btn.innerHTML.includes('Combat'),'Combat focus unavailable');
  p.focus='Combat';assert(p.activity===before,'changing focus changed activity context');assert(q.currentFocus()==='Combat','current focus mismatch');return p.activity+' / '+p.focus;
});


test('V2.4 Auto focus resolves dynamically without losing Auto mode',()=>{
  const g=fresh(14001),p=g.player;p.ageMonths=300;p.focus='Auto';p.career='Aucune';p.health=100;p.energy=100;p.ambition='Devenir puissant';
  assert(q.currentFocus()==='Combat','Auto did not resolve power ambition to Combat');assert(p.focus==='Auto','Auto mode was overwritten');
  p.health=60;assert(q.currentFocus()==='Forme','Auto did not react to low health');assert(p.focus==='Auto','Auto mode was overwritten by condition');
  return 'Auto -> '+q.currentFocus();
});
test('V2.4 every ambition has a real Auto progression effect',()=>{
  const g=fresh(14002),p=g.player;p.ageMonths=300;p.focus='Auto';p.health=100;p.energy=100;p.career='Aucune';
  p.ambition='Explorer le monde';let k=q.simpleFocusKeys('Équilibre');assert(k.includes('Navigation'),'Explorer ambition does not influence Auto targets');
  p.ambition='Entrer dans l’histoire';k=q.simpleFocusKeys('Équilibre');assert(k.includes('Volonté')&&k.includes('Commandement'),'History ambition does not influence Auto targets');
  p.ambition='Survivre';p.stats.Résistance=30;assert(q.recommendedFocus()==='Forme','Survival ambition does not prioritize resilience when weak');
  p.ambition='Devenir puissant';p.stats.Résistance=80;p.stats.Endurance=80;assert(q.recommendedFocus()==='Combat','Power ambition does not prioritize Combat');
  return '5 ambitions meaningful through Auto rules';
});
test('V2.5 fun flow: calm adult pacing uses 4.5–6.5 month windows',()=>{
  const g=fresh(14003),p=g.player;p.ageMonths=300;p.career='Aucune';p.activity='Routine';p.focus='Auto';p.health=100;p.energy=100;p.conditions=[];p.ambition='Explorer le monde';
  const plan=q.advancePlan();assert(plan.key==='calm-life','expected calm-life, got '+plan.key);assert(plan.min===4.5&&plan.max===6.5,'calm window is not 4.5–6.5 months');return plan.min+'-'+plan.max;
});
test('V2.4 career pacing uses 2.5–4.5 month windows',()=>{
  const g=fresh(14004),p=g.player;p.ageMonths=300;q.join('Civil');p.activity='Carrière';p.focus='Auto';p.health=100;p.energy=100;p.conditions=[];
  const plan=q.advancePlan();assert(plan.key==='active-life','expected active-life, got '+plan.key);assert(plan.min===2.5&&plan.max===4.5,'career window is not 2.5–4.5 months');return plan.min+'-'+plan.max;
});
test('V2.4 event progression reads persistent focus rather than temporary activity',()=>{
  const g=fresh(14005),p=g.player;p.ageMonths=300;p.activity='Routine';p.focus='Combat';p.style='Sabreur';
  assert(q.activityGrowthKeys(p.activity).length===0,'Routine unexpectedly exposes training keys');const keys=q.activityGrowthKeys(q.currentFocus());assert(keys.includes('Sabre'),'persistent Combat focus does not expose Sabre');
  assert(appSource.includes("activityKeys=activityGrowthKeys(currentFocus())"),'event director still reads temporary activity');return keys.join(' + ');
});
test('V2.4 segmented advance is present and bounded by the selected plan',()=>{
  const g=fresh(14006),p=g.player;p.ageMonths=300;p.career='Aucune';p.activity='Routine';p.focus='Auto';p.ambition='Explorer le monde';const before=p.ageMonths,plan=q.advancePlan();q.advance();const moved=p.ageMonths-before;
  assert(moved>0,'advance did not move time');assert(moved<=plan.max+.001,'segmented advance exceeded selected plan');assert(g.loop.lastAdvance&&Math.abs(g.loop.lastAdvance.months-moved)<.01,'advance report duration mismatch');return moved.toFixed(2)+' months';
});
test('V2.4 advance report exposes concrete progression details',()=>{
  const g=fresh(14007),p=g.player;p.ageMonths=300;p.focus='Combat';p.style='Sabreur';p.activity='Routine';q.advance();
  assert(g.loop.lastAdvance&&Array.isArray(g.loop.lastAdvance.details),'detailed progression missing from advance report');assert(g.loop.lastAdvance.focus,'focus missing from advance report');return g.loop.lastAdvance.focus+' / '+g.loop.lastAdvance.details.length+' detail(s)';
});
test('V2.4 world renderer only builds the selected subsection',()=>{
  const g=fresh(14008),p=g.player;p.ageMonths=300;q.setSectionState('world','explore');elementMap.clear();q.renderWorld();
  assert(elementMap.has('#placeName'),'explore group did not render location');assert(!elementMap.has('#worldPulse'),'hidden world-state group was rendered eagerly');assert(!elementMap.has('#canonList'),'hidden history group was rendered eagerly');
  q.setSectionState('world','history');elementMap.clear();q.renderWorld();assert(elementMap.has('#canonList'),'history group did not render');assert(!elementMap.has('#placeName'),'explore group was rendered while history selected');return 'true lazy world groups';
});
test('V2.4 progression renderer only builds the selected subsection',()=>{
  const g=fresh(14009),p=g.player;p.ageMonths=300;q.setSectionState('abilities','progress');elementMap.clear();q.renderAb();
  assert(elementMap.has('#progressionSummary'),'progress group missing');assert(!elementMap.has('#statsList'),'details group rendered eagerly');assert(!elementMap.has('#fruitCard'),'powers group rendered eagerly');
  q.setSectionState('abilities','details');elementMap.clear();q.renderAb();assert(elementMap.has('#statsList'),'details group missing');assert(!elementMap.has('#activityOptions'),'progress group rendered while details selected');return 'true lazy progression groups';
});
test('V2.4 relation network exposes one contextual action per visible relation',()=>{
  const g=fresh(14010),p=g.player;p.ageMonths=300;for(let i=0;i<9;i++)q.createRelation(i===0?'rival':i===1?'mentor':'ami');q.setSectionState('relations','network');elementMap.clear();q.renderRel();
  const htmlOut=fakeElement('#relationsList').innerHTML,visible=(htmlOut.match(/class="relation-card"/g)||[]).length,buttons=(htmlOut.match(/data-rel-open=/g)||[]).length;
  assert(visible<=6,'network exposes too many people at once');assert(buttons===visible,'relations expose more than one direct action each');return visible+' visible / '+buttons+' interaction buttons';
});
test('V2.4 lifeTick no longer performs duplicate achievement scans',()=>{
  const st=appSource.indexOf('function lifeTick('),en=appSource.indexOf('\nfunction estateValue',st),body=appSource.slice(st,en);assert(!body.includes('checkAchievements()'),'lifeTick still runs achievement scan before advance does');return 'single end-of-advance scan';
});
test('V2.4 default timeline renders five recent entries',()=>{
  const g=fresh(14011);for(let i=0;i<12;i++)g.timeline.unshift({age:'20 ans',title:'QA '+i,desc:'event',type:''});q.renderTimeline();const htmlOut=fakeElement('#timeline').innerHTML;
  assert((htmlOut.match(/timeline-item/g)||[]).length===5,'default timeline did not stop at five items');assert(htmlOut.includes('Voir toute l’histoire'),'timeline expansion control missing');return '5 recent events';
});


test('V2.5 migration: V24 save gains living intelligence state',()=>{
  let g=fresh(15001);g.version=24;delete g.world.npcLinks;for(const a of g.world.actors){delete a.intention;delete a.intentionMonths;delete a.momentum}for(const c of g.world.crews){delete c.intention;delete c.intentionMonths;delete c.resources}
  g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.version===28,'migration did not reach V26');assert(Array.isArray(g.world.npcLinks),'NPC graph missing');assert(g.world.actors.every(a=>a.intentionMonths>=0&&Number.isFinite(a.momentum)),'actor intent state missing');assert(g.world.crews.every(c=>c.intentionMonths>=0&&Number.isFinite(c.resources)),'crew intent state missing');return 'V24 -> V26';
});
test('V2.5 saves: purging one slot removes save and metadata only',()=>{
  fresh(15002);storage.set(q.slotKey(1),'SAVE1');storage.set(q.slotMetaKey(1),'META1');storage.set(q.slotKey(2),'SAVE2');storage.set(q.slotMetaKey(2),'META2');
  assert(q.purgeSaveSlot(1),'purge reported no data');assert(!storage.has(q.slotKey(1))&&!storage.has(q.slotMetaKey(1)),'slot 1 data survived purge');assert(storage.get(q.slotKey(2))==='SAVE2'&&storage.get(q.slotMetaKey(2))==='META2','other slot was altered');return 'slot 1 deleted / slot 2 preserved';
});
test('V2.5 actors: intention resolution changes persistent actor state',()=>{
  const g=fresh(15003),a=g.world.actors.find(x=>x.status==='active');assert(a,'no active actor');a.intention='S’entraîner';a.intentionMonths=0;a.momentum=0;q.actorIntentTick(a);assert(a.momentum>0,'training intention did not change momentum');assert(a.lastIntentOutcome&&a.intention===null,'actor intention did not close cleanly');return a.lastIntentOutcome;
});
test('V2.5 crews: autonomous intention resolves into crew consequences',()=>{
  const g=fresh(15004),c=g.world.crews.find(x=>x.status==='active');assert(c,'no active crew');c.intention='S’entraîner';c.intentionMonths=0;const before=c.power;q.crewIntentTick(c);assert(c.power>before,'crew training intention did not improve power');assert(c.lastIntentOutcome&&c.intention===null,'crew intention did not close cleanly');return before.toFixed(1)+' -> '+c.power.toFixed(1);
});
test('V2.5 relations: NPC project follows personal ambition',()=>{
  const g=fresh(15005),p=g.player;p.ageMonths=300;const r=q.createRelation('ami');r.npcAgeMonths=300;r.npcAmbition='Devenir plus fort';r.npcIntent='S’entraîner';r.npcIntentMonths=0;r.npcPower=25;r.npcPotential=70;const before=r.npcPower;q.npcIntentTick(r,1);assert(r.npcPower>before,'NPC training project did not improve power');assert(r.lastIntentOutcome,'NPC intent outcome missing');return r.lastIntentOutcome;
});
test('V2.5 NPC network: people can form autonomous links with each other',()=>{
  const g=fresh(15006),p=g.player;p.ageMonths=300;const a=q.createRelation('ami'),b=q.createRelation('ami');a.region=p.region;b.region=p.region;a.location=p.island;b.location=p.island;a.faction='Civil';b.faction='Civil';g.world.npcLinks=[];const link=q.ensureNpcLink(a,b);const pre=q.npcLinkBetween(a,b);assert(link&&pre&&Number.isFinite(link.bond)&&link.months===0,'NPC-to-NPC link was not initialized');q.npcSocialTick(12);const evolved=q.npcLinkBetween(a,b);assert(evolved&&Number.isFinite(evolved.bond)&&evolved.months===12,'NPC link state invalid');return evolved.type+' '+evolved.bond.toFixed(1);
});
test('V2.5 missions: living-world crew creates a contextual opportunity',()=>{
  const g=fresh(15007),p=g.player;p.ageMonths=300;q.join('Marine');p.rank='Sous-officier';q.careerRecord().rank=p.rank;const c=g.world.crews[0];c.status='active';c.faction='Pirates';c.region=p.region;c.power=28;c.intention='Chercher un butin';const list=q.worldMissionOpportunities();const m=list.find(x=>x.sourceType==='crew');assert(m&&m.worldGenerated,'crew did not generate mission');assert(m.sourceName&&m.title.includes(m.sourceName),'mission is not tied to its source crew');return m.title;
});
test('V2.5 missions: resolving a world mission changes its source entity',()=>{
  const g=fresh(15008),p=g.player;p.ageMonths=300;const c=g.world.crews[0];c.status='active';c.morale=70;c.resources=70;c.power=40;const m={worldGenerated:true,sourceType:'crew',sourceId:c.id,sourceName:c.name};const morale=c.morale,res=c.resources;q.applyWorldMissionOutcome(m,true);assert(c.morale<morale&&c.resources<res,'world mission did not weaken source crew');return c.morale.toFixed(0)+' morale / '+c.resources.toFixed(0)+' resources';
});
test('V2.5 intentions remain plain serializable save data',()=>{
  const g=fresh(15009),a=g.world.actors.find(x=>x.status==='active'),c=g.world.crews[0],r=q.createRelation('ami');q.assignActorIntent(a);q.assignCrewIntent(c);q.assignNpcIntent(r);const raw=JSON.stringify(g);const copy=JSON.parse(raw);assert(!raw.includes('function'),'function leaked into living-world save');assert(copy.world.actors.find(x=>x.name===a.name).intention,'actor intention disappeared');assert(copy.world.crews[0].intention,'crew intention disappeared');assert(copy.relations.find(x=>x.id===r.id).npcIntent,'NPC intent disappeared');return 'serializable';
});
test('V2.5 board: contextual world missions compete with static opportunities',()=>{
  const g=fresh(15010),p=g.player;p.ageMonths=300;q.join('Marine');p.rank='Sous-officier';q.careerRecord().rank=p.rank;const c=g.world.crews[0];c.status='active';c.faction='Pirates';c.region=p.region;c.power=24;const b=q.board();assert(b.length<=3,'board exceeded compact limit');assert(b.some(x=>x.worldGenerated),'world-generated mission absent from board');return b.map(x=>x.worldGenerated?'WORLD:'+x.title:x.title).join(' / ');
});


test('V2.5 actor goals strongly bias autonomous intent selection',()=>{
  const g=fresh(14101),a=g.world.actors.find(x=>x.status==='active')||g.world.actors[0];a.goal='Étendre son territoire et sa domination';a.faction='Pirates';a.momentum=4;
  const counts={};for(let i=0;i<180;i++){a.intention=null;a.intentionMonths=0;const x=q.assignActorIntent(a);counts[x]=(counts[x]||0)+1}
  assert((counts['Étendre son influence']||0)>(counts['Voyager']||0),'territorial goal failed to bias influence '+JSON.stringify(counts));
  return JSON.stringify(counts);
});
test('V2.5 damaged crews overwhelmingly choose recovery',()=>{
  const g=fresh(14102),c=g.world.crews[0];c.resources=7;c.morale=12;c.members=14;
  const counts={};for(let i=0;i<120;i++){c.intention=null;c.intentionMonths=0;const x=q.assignCrewIntent(c);counts[x]=(counts[x]||0)+1}
  assert((counts['Se remettre']||0)>=80,'damaged crew did not prioritize recovery '+JSON.stringify(counts));return JSON.stringify(counts);
});
test('V2.5 NPC ambition strongly biases autonomous intent selection',()=>{
  const g=fresh(14103),r=q.createRelation('ami');r.npcAgeMonths=300;r.npcAmbition='Faire fortune';r.npcWealth=0;
  const counts={};for(let i=0;i<180;i++){r.npcIntent=null;r.npcIntentMonths=0;const x=q.assignNpcIntent(r);counts[x]=(counts[x]||0)+1}
  assert((counts['S’enrichir']||0)>(counts['Voyager']||0),'fortune ambition failed to bias wealth '+JSON.stringify(counts));
  assert((counts['S’enrichir']||0)>(counts['Faire carrière']||0),'fortune ambition failed to dominate generic career '+JSON.stringify(counts));return JSON.stringify(counts);
});


test('V2.5 context bonuses can introduce recovery and recruitment',()=>{
  const g=fresh(14104),c=g.world.crews[0];c.faction='Pirates';c.morale=58;c.resources=24;c.members=12;
  let recover=0;for(let i=0;i<140;i++){c.intention=null;c.intentionMonths=0;if(q.assignCrewIntent(c)==='Se remettre')recover++}
  assert(recover>0,'resource pressure bonus never introduced recovery');
  c.resources=70;c.morale=70;c.members=7;let recruit=0;for(let i=0;i<140;i++){c.intention=null;c.intentionMonths=0;if(q.assignCrewIntent(c)==='Recruter')recruit++}
  assert(recruit>0,'small-crew bonus never introduced recruitment');return recover+' recover / '+recruit+' recruit';
});
test('V2.5 recruitment intent changes crew state and resolves cleanly',()=>{
  const g=fresh(14105),c=g.world.crews[0];c.members=5;c.resources=70;c.morale=52;c.intention='Recruter';const members=c.members,res=c.resources,out=q.resolveCrewIntent(c);
  assert(c.members>members,'recruitment did not add members');assert(c.resources<res,'recruitment did not consume resources');assert(out&&out.includes('recrute'),'recruitment produced an empty outcome');assert(c.lastIntentOutcome===out,'last outcome was not persisted');return out;
});
test('V2.5 latent NPC needs can influence autonomous intentions',()=>{
  const g=fresh(14106),r=q.createRelation('ami');r.npcAgeMonths=300;r.npcAmbition='Explorer le monde';r.npcPower=20;r.npcPotential=75;r.npcWealth=0;
  const counts={};for(let i=0;i<220;i++){r.npcIntent=null;r.npcIntentMonths=0;const x=q.assignNpcIntent(r);counts[x]=(counts[x]||0)+1}
  assert((counts['S’entraîner']||0)>0,'large potential gap never influenced training');assert((counts['S’enrichir']||0)>0,'low wealth never influenced earning');return JSON.stringify(counts);
});

test('V2.5 conflict missions keep the unique causal conflict id',()=>{
  const g=fresh(14107),p=g.player;p.ageMonths=300;const t=Object.keys(g.world.territories)[0],def=g.world.territories[t].controller;
  const enemy=def==='Pirates'?'Marine':'Pirates';
  g.world.conflicts=[];const spawned=(function(){const w=g.world;const c={id:'qa-conflict-unique',location:t,region:q.infStatic(t).region,attacker:enemy,defender:def,intensity:30,months:0,status:'active',source:'qa',warId:null};w.conflicts.push(c);return c})();
  p.region=spawned.region;p.island=t;const list=q.worldMissionOpportunities(),m=list.find(x=>x.sourceType==='conflict');
  assert(m,'conflict did not generate contextual mission');assert(m.sourceId===spawned.id,'mission did not persist unique conflict id');return m.sourceId;
});
test('V2.5 stale conflict mission cannot mutate a replacement conflict',()=>{
  const g=fresh(14108),p=g.player;p.ageMonths=300;const t=Object.keys(g.world.territories)[0],def=g.world.territories[t].controller,enemy=def==='Pirates'?'Marine':'Pirates';
  const old={id:'old-conf',location:t,region:q.infStatic(t).region,attacker:enemy,defender:def,intensity:60,months:4,status:'resolved',source:'qa',warId:null};
  const freshConflict={id:'new-conf',location:t,region:q.infStatic(t).region,attacker:enemy,defender:def,intensity:44,months:0,status:'active',source:'qa',warId:null};
  g.world.conflicts=[old,freshConflict];const before=freshConflict.intensity;q.applyWorldMissionOutcome({worldGenerated:true,sourceType:'conflict',sourceId:'old-conf',sourceName:t},true);
  assert(freshConflict.intensity===before,'stale mission changed replacement conflict');return 'replacement '+before+' unchanged';
});

test('V2.5 resolved conflicts never appear as contextual missions',()=>{
  const g=fresh(14113),p=g.player;p.ageMonths=300;const t=Object.keys(g.world.territories)[0],def=g.world.territories[t].controller,enemy=def==='Pirates'?'Marine':'Pirates',region=q.infStatic(t).region;
  g.world.crews=[];g.world.actors.forEach(a=>{a.status='inactive'});g.world.conflicts=[{id:'resolved-only',location:t,region,attacker:enemy,defender:def,intensity:28,months:5,status:'resolved',source:'qa',warId:null}];
  p.region=region;p.island=t;const list=q.worldMissionOpportunities();assert(!list.some(x=>x.sourceType==='conflict'),'resolved conflict leaked into mission board');return 'resolved conflict ignored';
});


test('V2.5 migration upgrades legacy conflict mission source to unique id',()=>{
  let g=fresh(14111),p=g.player;p.ageMonths=300;const t=Object.keys(g.world.territories)[0],def=g.world.territories[t].controller,enemy=def==='Pirates'?'Marine':'Pirates';
  const cf={id:'migration-conf',location:t,region:q.infStatic(t).region,attacker:enemy,defender:def,intensity:36,months:0,status:'active',source:'qa',warId:null};g.world.conflicts=[cf];
  g.mission={title:'Legacy',danger:30,reward:1,xp:1,tier:1,spec:null,profile:'mixed',remaining:1,worldGenerated:true,sourceType:'conflict',sourceId:t+'|'+enemy+'|'+def,sourceName:t};g.version=24;
  g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.mission.sourceId===cf.id,'legacy conflict source was not upgraded to unique id');return g.mission.sourceId;
});
test('V2.5 migration neutralizes legacy conflict source when original conflict is gone',()=>{
  let g=fresh(14112),p=g.player;p.ageMonths=300;const t=Object.keys(g.world.territories)[0],def=g.world.territories[t].controller,enemy=def==='Pirates'?'Marine':'Pirates';
  g.world.conflicts=[];g.mission={title:'Legacy stale',danger:30,reward:1,xp:1,tier:1,spec:null,profile:'mixed',remaining:1,worldGenerated:true,sourceType:'conflict',sourceId:t+'|'+enemy+'|'+def,sourceName:t};g.version=24;
  g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.mission.sourceId===null,'stale legacy source was not neutralized');
  const replacement={id:'replacement-conf',location:t,region:q.infStatic(t).region,attacker:enemy,defender:def,intensity:42,months:0,status:'active',source:'qa',warId:null};g.world.conflicts=[replacement];const before=replacement.intensity;q.applyWorldMissionOutcome(g.mission,true);
  assert(replacement.intensity===before,'neutralized legacy mission mutated replacement conflict');return 'replacement '+before+' unchanged';
});


test('V2.5 NPC career chance respects trajectory and seniority',()=>{
  const g=fresh(14109),r=q.createRelation('ami');r.npcAgeMonths=300;r.npcPower=55;r.npcAmbition='Explorer le monde';r.careerLevel=2;r.npcTrajectory='Ascension';const rise=q.npcCareerPromotionChance(r);
  r.npcTrajectory='Déclin';const decline=q.npcCareerPromotionChance(r);r.npcTrajectory='Stable';r.careerLevel=5;const senior=q.npcCareerPromotionChance(r);
  assert(rise>decline,'career trajectory does not affect promotion chance');assert(senior<rise,'senior ranks are not harder to reach');return rise.toFixed(3)+' / '+decline.toFixed(3)+' / '+senior.toFixed(3);
});
test('V2.5 career intention is no longer an automatic promotion',()=>{
  const g=fresh(14110),r=q.createRelation('ami');r.npcAgeMonths=300;r.npcPower=42;r.npcPotential=78;r.npcTrajectory='Stable';r.npcAmbition='Explorer le monde';let promotions=0;
  for(let i=0;i<120;i++){r.careerLevel=3;r.npcIntent='Faire carrière';q.resolveNpcIntent(r);if(r.careerLevel>3)promotions++}
  assert(promotions>0&&promotions<90,'career intent is either impossible or still nearly automatic: '+promotions);return promotions+'/120 promotions';
});

test('V2.5 fun flow: event novelty strongly suppresses immediate repetition',()=>{
  const g=fresh(15101),l=q.migrateLifeLoop(g);l.recentEvents=['local'];assert(q.eventNoveltyWeight('local')<.3,'immediate event repetition is not strongly suppressed');assert(q.eventNoveltyWeight('danger')===1,'unseen event lost full novelty');return q.eventNoveltyWeight('local').toFixed(2);
});
test('V2.5 fun flow: story novelty suppresses recently used archetypes',()=>{
  const g=fresh(15102),st=q.migrateStoryEngine(g);st.recentTypes=['island-secret','social-favor'];assert(q.storyNoveltyWeight('island-secret')<q.storyNoveltyWeight('career-crossroads'),'recent story was not penalized');return q.storyNoveltyWeight('island-secret').toFixed(2);
});
test('V2.5 fun flow: accepted missions are remembered and demoted',()=>{
  const g=fresh(15103),p=g.player;p.ageMonths=300;q.join('Civil');const first=q.board()[0];q.rememberMission(first);assert(q.missionNoveltyScore(first)<.3,'accepted mission kept full novelty');return first.title;
});
test('V2.5 fun flow: story history is rendered instead of discarded',()=>{
  const g=fresh(15104),st=q.migrateStoryEngine(g);st.history=[{id:'h1',type:'island-secret',title:'Secret QA',result:'Résultat persistant',closure:'resolved',resolvedAge:180,generation:1}];q.renderStories();assert(fakeElement('#storyHistory').innerHTML.includes('Secret QA'),'story history is still invisible');assert(fakeElement('#storyHistory').innerHTML.includes('Résultat persistant'),'story result is missing from history');return 'history visible';
});
test('V2.5 fun flow: world changes surface in the advance report',()=>{
  const g=fresh(15105),p=g.player;p.ageMonths=300;const l=q.migrateLifeLoop(g),before=l.worldSeq;q.world(12);const recent=l.recentWorld.filter(x=>x.seq>before);assert(recent.length>0,'world simulation created no reportable highlights');return recent[0].title;
});
test('V2.5 fun flow: combat report has three simulated phases',()=>{
  const g=fresh(15106),p=g.player;p.ageMonths=300;Object.keys(p.stats).forEach(k=>p.stats[k]=70);Object.keys(p.skills).forEach(k=>p.skills[k]=70);p.health=100;p.energy=100;q.fight(35,'QA phased fight');assert(g.lastCombat&&g.lastCombat.phases&&g.lastCombat.phases.length===3,'combat phases missing');return g.lastCombat.phases.map(x=>x.label).join(' / ');
});

test('V2.5 story variety: mentor lesson becomes eligible and resolves',()=>{
  const g=fresh(15201),p=g.player;p.ageMonths=240;const r=q.createRelation('mentor');r.location=p.island;r.region=p.region;const types=q.storyEligibleTypes().map(x=>x.id);assert(types.includes('mentor-lesson'),'mentor story not eligible');const st=q.startStory('mentor-lesson');st.awaiting=true;q.storyChoice(st.id,'observe');p.ageMonths=st.nextAge+1;q.storyTick(1);assert(!q.activeStories().some(x=>x.id===st.id),'mentor story did not resolve');return 'mentor lesson resolved';
});
test('V2.5 story variety: hostile crew can create a pressure arc',()=>{
  const g=fresh(15202),p=g.player;p.ageMonths=300;p.faction='Marine';const c=g.world.crews.find(x=>x.status==='active');c.region=p.region;c.faction='Pirates';const types=q.storyEligibleTypes().map(x=>x.id);assert(types.includes('crew-pressure'),'crew pressure story not eligible');const st=q.startStory('crew-pressure');assert(st.data.crewId,'crew story lost source id');return st.data.crewName;
});
test('V2.5 story variety: family crossroads appears for established family life',()=>{
  const g=fresh(15203),p=g.player;p.ageMonths=300;const r=q.createRelation('ami');r.npcAgeMonths=300;r.location=p.island;r.region=p.region;r.attraction=90;p.life.partnerId=r.id;p.life.relationshipStatus='En couple';const types=q.storyEligibleTypes().map(x=>x.id);assert(types.includes('family-crossroads'),'family story not eligible');return 'family crossroads eligible';
});
test('V2.5 story variety: horizon call rewards established exploration',()=>{
  const g=fresh(15204),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=55;const types=q.storyEligibleTypes().map(x=>x.id);assert(types.includes('horizon-call'),'horizon story not eligible');return 'horizon call eligible';
});
test('V2.5 progression: crossing a global power rank becomes a major moment',()=>{
  const g=fresh(15205),p=g.player;p.ageMonths=300;Object.keys(p.stats).forEach(k=>p.stats[k]=34);Object.keys(p.skills).forEach(k=>p.skills[k]=34);const before=q.captureAdvanceState();Object.keys(p.stats).forEach(k=>p.stats[k]=55);Object.keys(p.skills).forEach(k=>p.skills[k]=55);q.finalizeAdvanceReport(before,1,{key:'qa',label:'QA'});assert(g.timeline.some(x=>x.title==='PALIER DE PUISSANCE'),'power-rank milestone missing');return g.timeline[0].desc;
});

test('V2.5 fun flow: story openings do not interrupt AVANCER as major events',()=>{
  const g=fresh(15206),p=g.player;p.ageMonths=300;p.activity='Explorer';q.explorationSite(p.island).familiarity=60;const before=q.migrateLifeLoop(g).majorSeq;const st=q.startStory('island-secret');assert(st,'story did not start');assert(q.migrateLifeLoop(g).majorSeq===before,'story opening still counts as a major interruption');assert(g.timeline[0]&&g.timeline[0].type==='story','story opening lost its timeline identity');return 'background opening';
});

test('V2.6 migration: V25 save gains signature-moment state',()=>{
  let g=fresh(16001);g.version=25;delete g.loop.signatureSeq;delete g.loop.signatureMoments;g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.version===28,'migration did not reach V26');assert(g.loop.signatureSeq===0&&Array.isArray(g.loop.signatureMoments),'signature state missing after migration');return 'V25 -> V26';
});
test('V2.6 signature missions: dangerous world opportunities are classified as exceptional',()=>{
  const g=fresh(16002),c=g.world.crews[0];c.power=88;const m={title:'QA World Mission',danger:76,tier:4,worldGenerated:true,sourceType:'crew',sourceId:c.id,sourceName:c.name};const importance=q.missionImportance(m);assert(importance>=58,'high-stakes world mission was not signature-worthy: '+importance);assert(['Exceptionnelle','Décisive'].includes(q.missionStakes(m)),'wrong stakes label');return importance+' / '+q.missionStakes(m);
});
test('V2.6 signature registry: major combat is remembered without extra interaction',()=>{
  const g=fresh(16003),p=g.player;p.ageMonths=300;Object.keys(p.stats).forEach(k=>p.stats[k]=92);Object.keys(p.skills).forEach(k=>p.skills[k]=92);p.health=100;p.energy=100;q.fight(82,'Combat QA majeur');assert(g.lastCombat&&g.lastCombat.signature,'major fight not classified as signature');assert(g.loop.signatureMoments.some(x=>x.kind==='combat'),'major fight missing from signature registry');return g.lastCombat.importance;
});
test('V2.6 rivalry: confirmed rivalries create a one-time signature milestone',()=>{
  const g=fresh(16004),r={name:'QA Rival',role:'rival',rivalWins:1,rivalLosses:1,rivalry:60,rivalMilestones:[],memories:[],status:'active'};const direct=q.rivalStage(r);assert(direct==='Rival confirmé','direct rival stage wrong: '+direct);const stage=q.syncRivalryMilestone(r,'Rivalité naissante');assert(stage==='Rival confirmé','rival stage did not advance: '+stage);assert(g.loop.signatureMoments.some(x=>x.kind==='rivalry'),'rival milestone not registered');const countBefore=g.loop.signatureMoments.length;q.syncRivalryMilestone(r,'Rivalité naissante');assert(g.loop.signatureMoments.length===countBefore,'rival milestone duplicated');return stage;
});
test('V2.6 achievements surface inside the same advance report',()=>{
  const g=fresh(16005),p=g.player;p.ageMonths=300;const snapshot=q.captureAdvanceState();const extra=Object.keys(q.constants.PL).find(x=>!p.visited.includes(x));p.visited.push(extra);q.checkAchievements();const report=q.finalizeAdvanceReport(snapshot,1,{key:'qa',label:'QA'});assert(report.achievementHighlights&&report.achievementHighlights.length>0,'new achievement absent from advance report');assert(g.loop.signatureMoments.some(x=>x.kind==='achievement'),'achievement absent from signature registry');return report.achievementHighlights.join(', ');
});
test('V2.6 advance report surfaces newly created signature moments',()=>{
  const g=fresh(16006),p=g.player;p.ageMonths=300;const snapshot=q.captureAdvanceState();q.recordSignatureMoment('QA Moment','Persistent highlight','qa',80);const report=q.finalizeAdvanceReport(snapshot,1,{key:'qa',label:'QA'});assert(report.signatureHighlights&&report.signatureHighlights[0].title==='QA Moment','signature moment absent from report');return report.signatureHighlights[0].title;
});
test('V2.6 migration backfills active mission importance safely',()=>{
  let g=fresh(16007);g.player.ageMonths=300;const c=g.world.crews[0];c.power=90;g.mission={title:'Legacy signature candidate',danger:78,reward:25000,xp:30,tier:4,spec:null,profile:'combat',remaining:2,worldGenerated:true,sourceType:'crew',sourceId:c.id,sourceName:c.name};g.version=25;g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.mission.importance>=58&&g.mission.signature,'active V25 mission was not backfilled');assert(g.mission.stakes,'active mission stakes missing');return g.mission.stakes;
});


test('V2.7 creation initializes persistent consequence memory',()=>{
  const g=fresh(17001);assert(g.version===28,'wrong V2.8 version');assert(Array.isArray(g.loop.consequences),'consequence queue missing');assert(Array.isArray(g.loop.consequenceHistory),'consequence history missing');assert(g.loop.consequenceSeq===0&&g.loop.consequenceResultSeq===0,'consequence counters not initialized');return 'GameState 28 consequence memory ready';
});
test('V2.7 migration upgrades V26 consequence state idempotently',()=>{
  let g=fresh(17002);g.version=26;delete g.loop.consequences;delete g.loop.consequenceHistory;delete g.loop.consequenceSeq;delete g.loop.consequenceResultSeq;g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.version===28,'legacy save not upgraded to V2.8');assert(Array.isArray(g.loop.consequences)&&Array.isArray(g.loop.consequenceHistory),'V2.7 memory fields missing');q.scheduleConsequence('life','Migration QA','',8,{},60,'qa:migration');const count=g.loop.consequences.length;g=q.migrate(JSON.parse(JSON.stringify(g)));assert(g.loop.consequences.length===count,'migration duplicated causal entries');return count+' pending echo';
});
test('V2.7 story consequence remembers a relationship outcome',()=>{
  const g=fresh(17003),p=g.player;p.ageMonths=300;const r=q.createRelation('ami'),before=r.trust;q.scheduleConsequence('story','Ancien service','',0,{closure:'resolved',storyType:'social-favor',relationId:r.id,relationName:r.name},70,'qa:story-memory');const hit=q.processConsequences();assert(hit,'due story consequence did not resolve');assert(r.trust>before,'past relationship choice had no future effect');assert(g.loop.consequenceHistory[0]&&g.loop.consequenceHistory[0].kind==='story','story echo absent from history');return r.name+' trust '+before.toFixed(1)+' -> '+r.trust.toFixed(1);
});
test('V2.7 mission consequence changes a surviving crew future plan',()=>{
  const g=fresh(17004),p=g.player;p.ageMonths=300;const c=g.world.crews[0];c.status='active';const before=c.playerGrudge||0;q.scheduleConsequence('mission','Mission contre '+c.name,'',0,{success:true,sourceType:'crew',sourceId:c.id,sourceName:c.name},78,'qa:crew-memory');q.processConsequences();assert((c.playerGrudge||0)>before,'crew did not remember player intervention');assert(c.intention==='S’entraîner'||c.intention==='Traquer une cible','crew future plan was not redirected');return c.name+' grudge '+c.playerGrudge+' / '+c.intention;
});
test('V2.7 rivalry consequence reactivates a dormant rival',()=>{
  const g=fresh(17005),p=g.player;p.ageMonths=300;const r=q.createRelation('rival');r.status='active';r.challengeReady=false;r.npcIntent=null;r.rivalry=82;q.scheduleConsequence('rivalry','Némésis — '+r.name,'',0,{relationId:r.id,relationName:r.name,stage:'Némésis'},92,'qa:nemesis-memory');q.processConsequences();assert(r.challengeReady,'nemesis did not become challenge-ready');assert(r.npcIntent==='Défier son rival','nemesis future intent not redirected');assert(r.rivalry>82,'nemesis rivalry did not intensify');return r.name+' rivalry '+r.rivalry.toFixed(1);
});
test('V2.7 consequence processor resolves only one due echo per tick',()=>{
  const g=fresh(17006),p=g.player;p.ageMonths=300;q.scheduleConsequence('life','Echo A','A',0,{},55,'qa:a');q.scheduleConsequence('life','Echo B','B',0,{},65,'qa:b');const before=g.loop.consequenceHistory.length;q.processConsequences();assert(g.loop.consequenceHistory.length===before+1,'processor resolved more than one consequence');assert(g.loop.consequences.length===1,'unexpected pending consequence count');return g.loop.consequenceHistory[0].title;
});
test('V2.7 advance report surfaces causal callbacks',()=>{
  const g=fresh(17007),p=g.player;p.ageMonths=300;const snapshot=q.captureAdvanceState();q.scheduleConsequence('combat','Combat ancien','',0,{success:true},82,'qa:report');q.processConsequences();const report=q.finalizeAdvanceReport(snapshot,1,{key:'qa',label:'QA'});assert(report.causalHighlights&&report.causalHighlights.length===1,'causal callback absent from advance report');assert(report.causalHighlights[0].title==='Combat ancien','wrong causal highlight');return report.causalHighlights[0].title;
});
test('V2.7 resolved story automatically schedules a future callback',()=>{
  const g=fresh(17008),p=g.player;p.ageMonths=300;const r=q.createRelation('ami'),st=q.startStory('social-favor');assert(st,'story setup failed');q.closeStory(st,'QA résolu','Une décision terminée doit revenir plus tard.',false,'resolved');const queued=g.loop.consequences.find(x=>x.sourceKey==='story:'+st.id);assert(queued,'resolved story did not schedule a callback');assert(queued.dueAge>p.ageMonths,'story callback is not delayed');assert(queued.payload.participantId===r.id||queued.payload.participantName===r.name,'story participant identity lost');return +(queued.dueAge-p.ageMonths).toFixed(1)+' months';
});
test('V2.7 signature mission automatically schedules a future consequence',()=>{
  const g=fresh(17009),p=g.player;p.ageMonths=300;p.factionRep.Civil=100;q.join('Civil');Object.keys(p.stats).forEach(k=>p.stats[k]=95);Object.keys(p.skills).forEach(k=>p.skills[k]=95);g.mission={title:'Mission signature QA',danger:2,reward:1000,xp:4,tier:0,spec:null,profile:'science',remaining:0,worldGenerated:false,sourceType:null,sourceId:null,sourceName:null,importance:70,stakes:'Exceptionnelle',signature:true};q.resolveMission();const queued=g.loop.consequences.find(x=>x.kind==='mission'&&x.title==='Mission signature QA');assert(queued,'signature mission did not schedule future consequence');assert(g.lastMission&&g.lastMission.signature,'signature mission result not retained');return g.lastMission.success?'success callback':'failure callback';
});


test('V2.7 rival story callback strengthens rivalry instead of generic friendship',()=>{
  const g=fresh(17010),p=g.player;p.ageMonths=300;const r=q.createRelation('rival');r.rivalry=60;r.trust=55;r.respect=50;const trust=r.trust,respect=r.respect;q.scheduleConsequence('story','Ancien duel','',0,{closure:'resolved',storyType:'rival-challenge',relationId:r.id,relationName:r.name},72,'qa:rival-story');q.processConsequences();assert(r.rivalry>60,'rivalry did not intensify');assert(r.respect>respect,'rival respect did not evolve');assert(r.trust===trust,'rival callback incorrectly used generic friendship trust gain');return 'rivalry '+r.rivalry.toFixed(1);
});
test('V2.7 crew victory creates momentum instead of recovery behavior',()=>{
  const g=fresh(17011),p=g.player;p.ageMonths=300;const c=g.world.crews.find(x=>x.faction==='Pirates')||g.world.crews[0];c.status='active';c.faction='Pirates';c.morale=50;q.scheduleConsequence('mission','Échec contre '+c.name,'',0,{success:false,sourceType:'crew',sourceId:c.id,sourceName:c.name},70,'qa:crew-win');q.processConsequences();assert(c.intention==='Chercher un butin','victorious pirate crew entered wrong intent: '+c.intention);assert(c.morale>50,'victorious crew did not gain morale');return c.intention+' / morale '+c.morale.toFixed(1);
});

const metrics={};
{
  const origins={},races={},styles={};
  for(let seed=5000;seed<5200;seed++){const g=fresh(seed,'destiny'),p=g.player;origins[p.origin]=(origins[p.origin]||0)+1;races[p.race]=(races[p.race]||0)+1;styles[p.style]=(styles[p.style]||0)+1}
  metrics.destinyDiversity={sample:200,origins,races,styles};
}
{
  const curve={};
  for(const danger of [20,40,60,80]){
    const g=fresh(5300+danger),p=g.player;p.ageMonths=300;Object.keys(p.stats).forEach(k=>p.stats[k]=55);Object.keys(p.skills).forEach(k=>p.skills[k]=55);let wins=0;
    for(let i=0;i<200;i++){g.alive=true;g.death=null;p.health=100;p.energy=100;p.conditions=[];if(q.fight(danger,'Balance fight'))wins++}
    curve[danger]=Math.round(wins/2)/100;
  }
  metrics.combatWinRateAtMidStats=curve;
}
{
  const g=fresh(5501),seen=new Set(),margins=[];
  for(const [a,data] of Object.entries(q.constants.PL))for(const b of data[2]||[]){const key=[a,b].sort().join('|');if(seen.has(key))continue;seen.add(key);for(const good of q.constants.TRADE_GOODS.filter(x=>!x.restricted)){const ab=(q.marketPrice(b,good.id,false)-q.marketPrice(a,good.id,true))/Math.max(1,q.marketPrice(a,good.id,true))*100;const ba=(q.marketPrice(a,good.id,false)-q.marketPrice(b,good.id,true))/Math.max(1,q.marketPrice(b,good.id,true))*100;margins.push(Math.max(ab,ba))}}
  margins.sort((a,b)=>a-b);const positive=margins.filter(x=>x>4);
  metrics.initialTradeMargins={routeGoodPairs:margins.length,profitableOver4Pct:positive.length,medianPct:+margins[Math.floor(margins.length/2)].toFixed(1),p90Pct:+margins[Math.floor(margins.length*.9)].toFixed(1),maxPct:+margins[margins.length-1].toFixed(1)};
}
{
  const rows=[];
  for(let seed=5600;seed<5610;seed++){const g=fresh(seed);q.world(360);rows.push({div:g.world.divergence,wars:g.world.warHistory.length+(g.world.wars||[]).filter(w=>w.status==='active').length,price:g.world.economy.priceIndex,short:g.world.economy.shortages,crews:g.world.crews.filter(c=>c.status==='active').length})}
  const avg=k=>+(rows.reduce((a,x)=>a+x[k],0)/rows.length).toFixed(1);
  metrics.thirtyYearWorld={samples:rows.length,avgDivergence:avg('div'),avgWars:avg('wars'),avgPriceIndex:avg('price'),avgShortages:avg('short'),avgActiveCrews:avg('crews'),minPrice:Math.min(...rows.map(x=>x.price)),maxPrice:Math.max(...rows.map(x=>x.price))};
}
{
  const durations=[],outcomes={};
  for(let seed=5700;seed<5730;seed++){const g=adultPirate(seed),p=g.player;g.world.diplomacy[['Marine','Pirates'].sort().join('|')]=-100;const target=Object.keys(g.world.territories).find(n=>g.world.territories[n].controller==='Marine');if(!target)continue;const war=q.startStrategicWar('Pirates','Marine','territory',target,'player');if(!war)continue;for(let i=0;i<36&&war.status==='active';i++){q.simulateConflicts();q.simulateWars()}durations.push(war.months);outcomes[war.outcome]=(outcomes[war.outcome]||0)+1}
  durations.sort((a,b)=>a-b);metrics.warPacing={samples:durations.length,avgMonths:+(durations.reduce((a,b)=>a+b,0)/Math.max(1,durations.length)).toFixed(1),medianMonths:durations[Math.floor(durations.length/2)]||0,minMonths:durations[0]||0,maxMonths:durations[durations.length-1]||0,outcomes};
}
assert(metrics.combatWinRateAtMidStats[20]>metrics.combatWinRateAtMidStats[40]&&metrics.combatWinRateAtMidStats[40]>metrics.combatWinRateAtMidStats[60]&&metrics.combatWinRateAtMidStats[60]>metrics.combatWinRateAtMidStats[80],'combat danger curve is not strictly descending');
assert(metrics.combatWinRateAtMidStats[60]<=.55,'danger 60 remains too forgiving');
assert(metrics.initialTradeMargins.maxPct<150,'initial trade arbitrage exceeds 150%');
assert(metrics.thirtyYearWorld.avgShortages>=.2,'persistent shortages are effectively absent');
assert((metrics.warPacing.outcomes.attacker||0)>=5,'attackers almost never win strategic wars');

{
  const g=fresh(6300),p=g.player;p.ageMonths=300;g.relations=[];
  const trajectories=['Stable','Ascension','Instable','Déclin'];
  for(let i=0;i<120;i++){
    const tr=trajectories[i%trajectories.length],pow=22+(i%7)*4,pot=Math.min(96,pow+28+(i%5)*5);
    g.relations.push(q.normalizeRelation(g,{id:'tele-'+i,name:'NPC '+i,role:i%9===0?'rival':'ami',faction:i%4===0?'Marine':i%4===1?'Pirates':'Civil',region:p.region,location:p.island,npcAgeMonths:216+(i%8)*24,npcPower:pow,npcPotential:pot,npcTrajectory:tr,status:'active'},300+i));
  }
  const before=g.relations.map(r=>r.npcPower);
  for(let month=0;month<180;month++)q.npcTick(1);
  const active=g.relations.filter(r=>r.status!=='dead'),gains=active.map((r,i)=>r.npcPower-before[+r.id.split('-')[1]]).filter(Number.isFinite);
  const byTrajectory={};
  trajectories.forEach(tr=>{const rs=g.relations.filter(r=>r.npcTrajectory===tr&&r.status!=='dead');byTrajectory[tr]={count:rs.length,avgPower:+(rs.reduce((a,r)=>a+r.npcPower,0)/Math.max(1,rs.length)).toFixed(1),avgCareer:+(rs.reduce((a,r)=>a+r.careerLevel,0)/Math.max(1,rs.length)).toFixed(1)}});
  metrics.npcFifteenYearProgression={sample:g.relations.length,alive:active.length,avgGain:+(gains.reduce((a,b)=>a+b,0)/Math.max(1,gains.length)).toFixed(1),maxPower:+Math.max(...active.map(r=>r.npcPower)).toFixed(1),atOrAbove95:active.filter(r=>r.npcPower>=95).length,byTrajectory};
  assert(byTrajectory.Ascension.avgCareer>=byTrajectory.Déclin.avgCareer+.5,'NPC career trajectories remain too similar after 15 years: '+JSON.stringify(byTrajectory));
  assert(Math.max(...Object.values(byTrajectory).map(x=>x.avgCareer))<=5.0,'NPC careers still saturate near maximum after 15 years: '+JSON.stringify(byTrajectory));
}
assert(metrics.npcFifteenYearProgression.avgGain>=3,'NPC long-term progression is effectively stagnant');
assert(metrics.npcFifteenYearProgression.avgGain<=30,'NPC long-term progression is too explosive');
assert(metrics.npcFifteenYearProgression.atOrAbove95<=Math.ceil(metrics.npcFifteenYearProgression.sample*.15),'too many NPCs converge to elite power');


{
  const rows=[];
  for(let seed=7100;seed<7120;seed++){
    const g=fresh(seed),p=g.player;p.difficulty='Standard';
    for(let month=0;month<300;month+=3){p.ageMonths=month+3;p.activity=p.ageMonths<72?'Grandir':p.ageMonths<180?'Études':month%12<6?'Entraînement':'Navigation';q.train(3);q.recordProgressSnapshot(false)}
    rows.push({power:q.power(),avgStat:Object.values(p.stats).reduce((a,b)=>a+b,0)/8,avgSkill:Object.values(p.skills).reduce((a,b)=>a+b,0)/8,capped:[...q.constants.ST,...q.constants.SK].filter(k=>{const b=p.stats[k]!=null?p.stats:p.skills;return b[k]>=p.caps[k]-.05}).length})
  }
  const avg=k=>+(rows.reduce((a,x)=>a+x[k],0)/rows.length).toFixed(1);
  metrics.playerAge25Progression={samples:rows.length,avgPower:avg('power'),avgStat:avg('avgStat'),avgSkill:avg('avgSkill'),avgCapped:avg('capped'),minPower:+Math.min(...rows.map(x=>x.power)).toFixed(1),maxPower:+Math.max(...rows.map(x=>x.power)).toFixed(1)};
}
assert(metrics.playerAge25Progression.avgPower>=20,'age-25 progression is too stagnant');
assert(metrics.playerAge25Progression.avgPower<=70,'age-25 baseline training becomes legendary too easily');
assert(metrics.playerAge25Progression.avgCapped<=4,'too many characteristics hit cap by age 25 under ordinary training');


{
  const rows=[];
  for(let seed=8200;seed<8230;seed++){
    const g=fresh(seed),p=g.player;let clicks=0,events=0,quietMax=0;
    while(p.ageMonths<180&&clicks<100&&g.alive){if(g.pending)g.pending=null;const aw=q.awaitingStory();if(aw){const choices=q.storyChoices(aw);if(choices.length)q.storyChoice(aw.id,choices[0].id)}q.advance();clicks++;events+=g.loop.lastAdvance?g.loop.lastAdvance.moments:0;quietMax=Math.max(quietMax,g.loop.quietAdvances)}
    rows.push({clicks,events,quietMax,age:p.ageMonths,alive:g.alive,reached:p.ageMonths>=180})
  }
  const reached=rows.filter(x=>x.reached),avg=(arr,k)=>+(arr.reduce((a,x)=>a+x[k],0)/Math.max(1,arr.length)).toFixed(1),totalClicks=rows.reduce((a,x)=>a+x.clicks,0),totalEvents=rows.reduce((a,x)=>a+x.events,0);
  metrics.adaptiveChildhoodPacing={samples:rows.length,reached15:reached.length,earlyDeaths:rows.filter(x=>!x.alive&&x.age<180).length,avgClicksTo15:avg(reached,'clicks'),avgMomentsPerLife:avg(rows,'events'),momentsPerClick:+(totalEvents/Math.max(1,totalClicks)).toFixed(2),maxQuiet:Math.max(...rows.map(x=>x.quietMax)),minClicks:Math.min(...reached.map(x=>x.clicks)),maxClicks:Math.max(...reached.map(x=>x.clicks))};
}
assert(metrics.adaptiveChildhoodPacing.reached15>=24,'too many simulated lives fail to reach age 15');
assert(metrics.adaptiveChildhoodPacing.avgClicksTo15>=28,'childhood simulation is skipping too aggressively');
assert(metrics.adaptiveChildhoodPacing.avgClicksTo15<=40,'childhood simulation is too click-heavy');
assert(metrics.adaptiveChildhoodPacing.momentsPerClick>=.25&&metrics.adaptiveChildhoodPacing.momentsPerClick<=1.2,'event density per click is outside the intended range');
assert(metrics.adaptiveChildhoodPacing.maxQuiet<=2,'quiet streak guard failed in telemetry');


{
  const rows=[];
  for(let seed=9300;seed<9320;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=300;p.activity='Explorer';const site=q.explorationSite(p.island);for(let i=0;i<18;i++)q.explorationTick(2);rows.push({familiarity:site.familiarity,discoveries:site.discoveries.length,rumors:site.rumors.length})
  }
  const avg=k=>+(rows.reduce((a,x)=>a+x[k],0)/rows.length).toFixed(1);
  metrics.explorationPacing={samples:rows.length,avgFamiliarityAfter36m:avg('familiarity'),avgDiscoveries:avg('discoveries'),avgRumors:avg('rumors'),maxDiscoveries:Math.max(...rows.map(x=>x.discoveries))};
}
assert(metrics.explorationPacing.avgFamiliarityAfter36m>=45,'local exploration is too slow');
assert(metrics.explorationPacing.avgFamiliarityAfter36m<=95,'local exploration completes too quickly');
assert(metrics.explorationPacing.avgDiscoveries>=1&&metrics.explorationPacing.avgDiscoveries<=5,'discovery pacing outside intended range');


{
  const rows=[];
  for(let seed=10300;seed<10320;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=180;p.career='Civil';p.faction='Civil';p.activity='Explorer';q.explorationSite(p.island).familiarity=55;q.createRelation('ami');let clicks=0,maxActive=0;
    while(p.ageMonths<300&&clicks<100&&g.alive){if(g.pending)g.pending=null;const aw=q.awaitingStory();if(aw){const choices=q.storyChoices(aw);q.storyChoice(aw.id,choices[0].id)}q.advance();maxActive=Math.max(maxActive,q.activeStories().length);clicks++}
    rows.push({started:g.story.stats.started,resolved:g.story.stats.resolved,failed:g.story.stats.failed,choices:g.story.stats.choices,maxActive,uniqueTypes:new Set(g.story.history.map(x=>x.type).concat(g.story.active.map(x=>x.type))).size})
  }
  const avg=k=>+(rows.reduce((a,x)=>a+x[k],0)/rows.length).toFixed(1);
  metrics.storyTenYearPacing={samples:rows.length,avgStarted:avg('started'),avgResolved:avg('resolved'),avgFailed:avg('failed'),avgChoices:avg('choices'),avgUniqueTypes:avg('uniqueTypes'),maxActive:Math.max(...rows.map(x=>x.maxActive))};
}
assert(metrics.storyTenYearPacing.avgStarted>=2,'story engine is too dormant over ten years');
assert(metrics.storyTenYearPacing.avgStarted<=18,'story engine overwhelms the life simulation');
assert(metrics.storyTenYearPacing.maxActive<=2,'natural story engine exceeded active cap');
assert(metrics.storyTenYearPacing.avgUniqueTypes>=3.5,'story variety remains too narrow over ten years: '+metrics.storyTenYearPacing.avgUniqueTypes);


{
  const rows=[];
  for(let seed=14500;seed<14524;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=180;p.activity='Routine';p.focus='Auto';p.career='Aucune';p.faction='Civil';p.ambition='Explorer le monde';let clicks=0;
    while(p.ageMonths<360&&clicks<160&&g.alive){
      if(g.pending){const c=g.pending.choices&&g.pending.choices[0];if(c&&typeof c[2]==='function')c[2]();g.pending=null}
      const st=q.awaitingStory();if(st){const cs=q.storyChoices(st);if(cs.length)q.storyChoice(st.id,cs[0].id)}
      q.advance();clicks++;
    }
    rows.push({clicks,years:Math.max(.01,(p.ageMonths-180)/12)});
  }
  metrics.v24Fluidity={adultFlowClicksPerYear:+(rows.reduce((a,x)=>a+x.clicks,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),sample:rows.length};
  assert(metrics.v24Fluidity.adultFlowClicksPerYear<=5.5,'V2.4 adult flow missed <=5.5 clicks/year target: '+metrics.v24Fluidity.adultFlowClicksPerYear);
}


{
  const rows=[];
  for(let seed=14600;seed<14612;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=180;q.join('Civil');p.specialization='Scientifique';q.careerRecord().specialization='Scientifique';p.focus='Auto';p.activity='Carrière';let clicks=0,lastMissionAge=-999,missions=0,start=p.ageMonths;
    while(p.ageMonths<300&&clicks<140&&g.alive){
      if(g.pending){const c=g.pending.choices&&g.pending.choices[0];if(c&&typeof c[2]==='function')c[2]();g.pending=null}
      const st=q.awaitingStory();if(st){const cs=q.storyChoices(st);if(cs.length)q.storyChoice(st.id,cs[0].id)}
      if(!g.mission&&p.ageMonths-lastMissionAge>=12){const b=q.board();if(b.length){q.startMission(0);lastMissionAge=p.ageMonths;missions++}}
      q.advance();clicks++;
    }
    rows.push({clicks,years:Math.max(.01,(p.ageMonths-start)/12),missions});
  }
  metrics.v24CareerFlow={
    clicksPerYear:+(rows.reduce((a,x)=>a+x.clicks,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    missionsPerYear:+(rows.reduce((a,x)=>a+x.missions,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    sample:rows.length
  };
  assert(metrics.v24CareerFlow.clicksPerYear<=7.5,'V2.4 career flow missed <=7.5 clicks/year target: '+metrics.v24CareerFlow.clicksPerYear);
}

{
  const rows=[];
  for(let seed=14700;seed<14712;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=180;p.focus='Auto';p.activity='Explorer';p.ambition='Explorer le monde';let clicks=0,start=p.ageMonths;
    while(p.ageMonths<300&&clicks<140&&g.alive){
      if(g.pending){const c=g.pending.choices&&g.pending.choices[0];if(c&&typeof c[2]==='function')c[2]();g.pending=null}
      const st=q.awaitingStory();if(st){const cs=q.storyChoices(st);if(cs.length)q.storyChoice(st.id,cs[0].id)}
      q.advance();clicks++;
    }
    rows.push({clicks,years:Math.max(.01,(p.ageMonths-start)/12)});
  }
  metrics.v24ExplorationFlow={
    clicksPerYear:+(rows.reduce((a,x)=>a+x.clicks,0)/rows.reduce((a,x)=>a+x.years,0)).toFixed(2),
    sample:rows.length
  };
  assert(metrics.v24ExplorationFlow.clicksPerYear<=7.5,'V2.4 exploration flow missed <=7.5 clicks/year target: '+metrics.v24ExplorationFlow.clicksPerYear);
}


test('V2.8 creation initializes emergent arc memory',()=>{
  const g=fresh(18001);assert(g.version===28,'wrong V2.8 version');assert(Array.isArray(g.loop.arcs)&&Array.isArray(g.loop.arcHistory)&&Array.isArray(g.loop.foundingMemories),'arc state missing');assert(g.loop.arcSeq===0&&g.loop.arcResultSeq===0,'arc counters not initialized');return 'GameState 28 arc memory ready';
});
test('V2.8 migration upgrades V27 arc state idempotently',()=>{
  let g=fresh(18002);g.version=27;delete g.loop.arcs;delete g.loop.arcHistory;delete g.loop.foundingMemories;delete g.loop.arcSeq;delete g.loop.arcResultSeq;g=q.migrate(JSON.parse(JSON.stringify(g)));q.setGame(g);assert(g.version===28,'V27 save not upgraded');assert(Array.isArray(g.loop.arcs)&&Array.isArray(g.loop.arcHistory),'arc fields missing');q.registerArcSignal('crew','crew','qa-crew','QA Crew',70,{region:g.player.region});const count=g.loop.arcs.length;assert(count===1,'forming arc not stored');g=q.migrate(JSON.parse(JSON.stringify(g)));q.setGame(g);assert(g.loop.arcs.length===count,'migration duplicated or dropped arcs');return count+' forming arc';
});
test('V2.8 mission recommendation never labels an unsafe option as recommended',()=>{
  const factions=['Civil','Marine','Pirates','Chasseur de primes','Révolutionnaires','Gouvernement'];let checked=0,withRecommendation=0,worstGap=0;
  factions.forEach((faction,ix)=>{const g=fresh(18100+ix),p=g.player;p.ageMonths=180;p.factionRep[faction]=100;q.join(faction);const b=q.board();if(!b.length)return;const safest=Math.max(...b.map(x=>x.chance)),pick=b.find(x=>x.recommended);
    if(pick){withRecommendation++;assert(pick.chance>=.45,'unsafe mission labeled recommended for '+faction+': '+Math.round(pick.chance*100)+'%');worstGap=Math.max(worstGap,safest-pick.chance);assert(safest-pick.chance<=.08,'recommended mission trails safer board option by '+Math.round((safest-pick.chance)*100)+' points for '+faction)}
    else assert(safest<.45,'board omitted recommendation despite a viable option for '+faction+' at '+Math.round(safest*100)+'%');
    checked++
  });
  assert(checked>=5,'insufficient faction boards tested');assert(withRecommendation>=3,'too few faction boards surface a recommendation');return checked+' factions / '+withRecommendation+' recommended / worst gap '+Math.round(worstGap*100)+' pts';
});
test('V2.8 mission guidance exposes readable risk classes',()=>{
  const g=fresh(18004),p=g.player;p.ageMonths=300;p.factionRep.Civil=100;q.join('Civil');const labels=q.board().map(x=>x.guidance);assert(labels.length&&labels.every(x=>['Sûre','Adaptée','Ambitieuse','Extrême','Signature extrême'].includes(x)),'invalid guidance '+labels.join(','));return labels.join(' / ');
});
test('V2.8 non-combat excellence can trigger a breakthrough',()=>{
  const g=fresh(18005),p=g.player;p.ageMonths=300;p.skills.Science=60;p.caps.Science=60;p.absoluteCaps.Science=68;let ok=false;for(let i=0;i<300&&!ok;i++)ok=q.attemptBreakthrough('science',90,['Science']);assert(ok,'science never broke through after repeated exceptional attempts');assert(p.caps.Science>60,'Science cap unchanged');return 'Science cap '+p.caps.Science;
});
test('V2.8 ambient danger can be avoided by non-combat expertise',()=>{
  let avoided=0;for(let seed=18200;seed<18220;seed++){const g=fresh(seed),p=g.player;p.ageMonths=300;Object.keys(p.stats).forEach(k=>p.stats[k]=8);Object.keys(p.skills).forEach(k=>p.skills[k]=8);p.skills.Navigation=95;p.stats.Réflexes=90;p.stats.Agilité=90;g.lastCombat=null;q.resolveAmbientDanger('QA danger',25);if(!g.lastCombat)avoided++}assert(avoided>=10,'expert navigator was forced into combat too often: '+avoided+'/20 avoided');return avoided+'/20 avoided';
});
test('V2.8 real story callbacks recover their actual participant',()=>{
  const g=fresh(18007),p=g.player;p.ageMonths=300;const r=q.createRelation('ami'),st=q.startStory('social-favor');assert(st&&st.participantId,'story participant missing');q.closeStory(st,'QA','QA',false,'resolved');const c=g.loop.consequences.find(x=>x.sourceKey==='story:'+st.id);assert(c,'callback missing');c.dueAge=p.ageMonths;const before=r.trust;q.processConsequences();assert(r.trust>before,'automatic callback did not affect original participant');return r.name+' '+before.toFixed(1)+' -> '+r.trust.toFixed(1);
});
test('V2.8 repeated crew echoes form an emergent arc',()=>{
  const g=fresh(18008),p=g.player;p.ageMonths=300;const c=g.world.crews[0];c.status='active';for(let i=0;i<2;i++){q.scheduleConsequence('mission','Conflit '+i,'',0,{success:i===0,sourceType:'crew',sourceId:c.id,sourceName:c.name},76,'qa:arc:'+i);q.processConsequences()}const a=g.loop.arcs.find(x=>x.sourceType==='crew'&&String(x.sourceId)===String(c.id));assert(a,'crew arc not created');assert(a.stage>=1&&a.hits>=2,'crew arc did not escalate');return a.title+' / '+a.hits+' hits / stage '+a.stage;
});
test('V2.8 crew grudge influences autonomous intentions',()=>{
  const g=fresh(18009),c=g.world.crews[0];c.status='active';c.morale=70;c.resources=70;c.members=12;c.playerGrudge=70;const pool=q.crewIntentPool(c);assert(pool.includes('Traquer le joueur'),'grudge is still ignored by crew AI');return pool.filter(x=>x==='Traquer le joueur').length+' hunt entries';
});
test('V2.8 recognized nemesis influences NPC intentions',()=>{
  const g=fresh(18010),p=g.player;p.ageMonths=300;const r=q.createRelation('rival');r.nemesisRecognized=true;const pool=q.npcIntentPool(r);assert(pool.includes('Poursuivre sa némésis'),'nemesis flag is still inert');return pool.filter(x=>x==='Poursuivre sa némésis').length+' nemesis entries';
});
test('V2.8 arc transitions surface in AVANCER report',()=>{
  const g=fresh(18011),p=g.player;p.ageMonths=300;const snap=q.captureAdvanceState();q.registerArcSignal('crew','crew','report-crew','Report Crew',80,{});q.registerArcSignal('crew','crew','report-crew','Report Crew',80,{});const report=q.finalizeAdvanceReport(snap,1,{key:'qa',label:'QA'});assert(report.arcHighlights&&report.arcHighlights.length,'arc transition absent from report');return report.arcHighlights[0].title;
});
test('V2.8 active arc registry remains compact',()=>{
  const g=fresh(18012),p=g.player;p.ageMonths=300;for(let i=0;i<9;i++)q.registerArcSignal('crew','crew','crew-'+i,'Crew '+i,60+i,{});assert(g.loop.arcs.length<=4,'active arcs exceeded cap');assert(g.loop.arcHistory.length>=1,'dropped arcs left no history');return g.loop.arcs.length+' active / '+g.loop.arcHistory.length+' history';
});

console.log('\nQA_METRICS '+JSON.stringify(metrics));

const failed=results.filter(r=>r.status==='FAIL');
const summary={
  commit:process.env.GITHUB_SHA||'local',
  total:results.length,passed:results.length-failed.length,failed:failed.length,
  failures:failed.map(x=>({name:x.name,error:x.error.split('\n')[0]}))
};
console.log('\nQA_SUMMARY '+JSON.stringify(summary));
if(failed.length) process.exitCode=1;

// V2.8 Emergent Arcs release candidate
