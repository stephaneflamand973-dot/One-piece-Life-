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
      addEventListener(){},removeEventListener(){},focus(){},select(){}
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
 getGame:function(){return game},setGame:function(v){game=v},
 make:make,migrate:migrate,world:world,worldMonthStep:worldMonthStep,advance:advance,render:render,renderChar:renderChar,renderWorld:renderWorld,
 power:power,gain:gain,train:train,trainHaki:trainHaki,trainFruit:trainFruit,fight:fight,
 join:join,careerTick:careerTick,careerRecord:careerRecord,evaluatePromotion:evaluatePromotion,startMission:startMission,resolveMission:resolveMission,board:board,
 createRelation:createRelation,marryPartner:marryPartner,welcomeChild:welcomeChild,buildHeir:buildHeir,lifeTick:lifeTick,
 ensureOrganization:ensureOrganization,syncOrganizationRole:syncOrganizationRole,organizationPower:organizationPower,organizationCapacity:organizationCapacity,organizationTick:organizationTick,
 upgradeOrganizationShip:upgradeOrganizationShip,generateRecruitCandidate:generateRecruitCandidate,
 registerCrime:registerCrime,arrestPlayer:arrestPlayer,prisonTick:prisonTick,attemptEscape:attemptEscape,justiceTick:justiceTick,
 influenceMetrics:influenceMetrics,establishDomain:establishDomain,fortifyDomain:fortifyDomain,influenceTick:influenceTick,
 startStrategicWar:startStrategicWar,simulateWars:simulateWars,simulateConflicts:simulateConflicts,resolveWar:resolveWar,warBetween:warBetween,
 marketPrice:marketPrice,marketPriceIndex:marketPriceIndex,buyCommodity:buyCommodity,sellCommodity:sellCommodity,tradeRouteOpportunities:tradeRouteOpportunities,
 simulateEconomy:simulateEconomy,cargoUsed:cargoUsed,cargoCapacity:cargoCapacity,cargoBookValue:cargoBookValue,blackMarketRisk:blackMarketRisk,inspectSmugglingAtArrival:inspectSmugglingAtArrival,
 releasePlayerFruits:releasePlayerFruits,checkAchievements:checkAchievements,
 firstRank:firstRank,rankIndex:rankIndex,nextRank:nextRank,inf:inf,infStatic:infStatic,req:req,
 constants:{PL:PL,REG:REG,ST:ST,SK:SK,TRADE_GOODS:TRADE_GOODS,SHIP_TIERS:SHIP_TIERS,ACHIEVEMENTS:ACHIEVEMENTS}
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
  setInput('seedInput',String(seed));setInput('originInput','East Blue');setInput('raceInput','Humain');setInput('styleInput','Équilibré');setInput('difficultyInput','Normal');setInput('nameInput','QA Tester');
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
  const bad=[...appSource.matchAll(/(?<!\$)\$\('\[[^']+\]'\)\.forEach/g)];
  assert(!bad.length,'single-element selector used as list: '+bad.map(x=>x[0]).join(','));return 'selectors clean'
});
test('Creation: Custom mode initializes full V1.5 state',()=>{
  const g=fresh(1111,'custom');assert(g.version===15,'wrong version');assert(g.player.name==='QA Tester','name');assert(g.player.origin==='East Blue','origin');
  assert(Object.keys(g.world.markets).length===Object.keys(q.constants.PL).length,'market coverage mismatch');assert(g.world.treaties.some(t=>t.a==='Marine'&&t.b==='Gouvernement'),'foundation alliance absent');
  assert(g.player.trade&&g.player.strategy&&g.player.influence&&g.player.justice,'new subsystem state missing');bounds(g);return Object.keys(g.world.markets).length+' markets'
});
test('Creation: Destiny mode is seed deterministic',()=>{
  function snap(){const g=fresh(424242,'destiny');return JSON.stringify({origin:g.player.origin,race:g.player.race,style:g.player.style,stats:g.player.stats,skills:g.player.skills,caps:g.player.caps,island:g.player.island})}
  const a=snap(),b=snap();assert(a===b,'same seed generated different character');return 'seed 424242 reproducible'
});
test('Migration: legacy state upgrades idempotently to V1.5',()=>{
  let g=fresh(3001);g=JSON.parse(JSON.stringify(g));g.version=9;delete g.player.trade;delete g.player.strategy;delete g.player.influence;delete g.world.markets;delete g.world.economy;delete g.world.wars;delete g.world.treaties;
  let m=q.migrate(g);assert(m.version===15,'migration version');assert(m.player.trade&&m.player.strategy&&m.player.influence,'player migration missing');assert(Object.keys(m.world.markets).length===Object.keys(q.constants.PL).length,'markets not restored');
  const counts=[m.world.actors.length,m.world.crews.length,m.world.treaties.length];m=q.migrate(m);assert(counts.join('/')===[m.world.actors.length,m.world.crews.length,m.world.treaties.length].join('/'),'idempotent migration duplicated world entities');q.setGame(m);bounds(m);return 'legacy v9 -> v15'
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
console.log('\nQA_METRICS '+JSON.stringify(metrics));

const failed=results.filter(r=>r.status==='FAIL');
const summary={
  commit:process.env.GITHUB_SHA||'local',
  total:results.length,passed:results.length-failed.length,failed:failed.length,
  failures:failed.map(x=>({name:x.name,error:x.error.split('\n')[0]}))
};
console.log('\nQA_SUMMARY '+JSON.stringify(summary));
if(failed.length) process.exitCode=1;
