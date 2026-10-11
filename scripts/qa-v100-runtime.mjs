import fs from 'node:fs';
const assert=(v,m)=>{if(!v)throw Error(m)};
const html=fs.readFileSync('index.html','utf8');
let source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const init="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
assert(source&&source.includes(init),'Game runtime entrypoint missing');
source=source.replace(init,"window.__qa95={initialGame,setGame(v){game=v},getGame(){return game},ensure:ensureV6,render,openTab:(tab)=>v76OpenTab(tab,true),uiState:()=>v76Ensure(),hub:()=>v95Ensure(),manualStatus:v100Status,manual:v100Act,trainingFocus:v102SetTrainingFocus,careerMode:v103SetMode,careerStatus:v103ActionStatus,socialStatus:v104Status,socialAction:v104Perform,economyStatus:v105ActionStatus,economySelect:v105SelectTarget,economyPerks:v105Perks,adventureStatus:v106Status,adventureApproach:v106SetApproach,adventureState:v106Ensure,advance,resolveDecision,saveVersion:SAVE_VERSION,gameVersion:GAME_VERSION};");
const elements=new Map();
function el(sel){
 if(!elements.has(sel)){
  const classes=new Set();
  elements.set(sel,{value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{},onclick:null,
    classList:{add(...names){names.forEach(x=>classes.add(x))},remove(...names){names.forEach(x=>classes.delete(x))},
     contains(x){return classes.has(x)},toggle(x,on){if(on===undefined){if(classes.has(x)){classes.delete(x);return false}classes.add(x);return true}on?classes.add(x):classes.delete(x);return !!on}},
    addEventListener(){},removeEventListener(){},setAttribute(){},
    querySelectorAll(){return[]},querySelector(){return null},
    focus(){},select(){},closest(){return null},scrollIntoView(){}
  });
 }
 return elements.get(sel);
}
Object.entries({'#seedInput':'1000095','#nameInput':'V95 Integration','#difficultyInput':'Casual',
 '#originInput':'East Blue','#raceInput':'Humain','#styleInput':'Équilibré'}).forEach(([k,v])=>el(k).value=v);
const document={visibilityState:'visible',querySelector:el,getElementById:id=>el('#'+id),querySelectorAll(){return[]},
 addEventListener(){},removeEventListener(){},execCommand(){return true}};
const store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear(){store.clear()}};
const w={addEventListener(){},removeEventListener(){},scrollTo(){},matchMedia(){return{matches:false}},isSecureContext:true,scrollY:0};
w.window=w;w.document=document;w.localStorage=localStorage;
const modulePaths=[
 'src/core/module-registry.js',
 'src/data/career-organizations-v73.js','src/v73/career-organization-engine-v73.js',
 'src/data/relation-personas-v74.js','src/v74/relation-persona-engine-v74.js',
 'src/data/personal-life-v78.js','src/v78/personal-life-engine-v78.js',
 'src/data/ui-layout-v76.js','src/v76/ui-components-v76.js',
 'src/data/simulation-core-v80.js','src/v80/simulation-core-v80.js',
 'src/data/game-flow-v90.js','src/v90/game-flow-engine-v90.js',
 'src/data/goals-v91.js','src/v91/goals-engine-v91.js',
 'src/data/npc-lives-v92.js','src/v92/npc-lives-engine-v92.js',
 'src/data/relationships-v93.js','src/v93/relationships-engine-v93.js',
 'src/data/world-intel-v94.js','src/v94/world-intel-engine-v94.js',
 'src/data/action-hub-v95.js','src/v95/action-hub-engine-v95.js','src/v95/action-hub-runtime-v95.js',
 'src/data/manual-life-v100.js','src/v100/manual-life-engine-v100.js',
 'src/data/action-v102.js','src/v102/action-engine-v102.js','src/data/career-v103.js','src/v103/career-engine-v103.js','src/data/social-v104.js','src/v104/social-engine-v104.js','src/data/economy-v105.js','src/v105/economy-engine-v105.js','src/data/adventure-v106.js','src/v106/adventure-engine-v106.js','src/data/voyage-v85.js','src/v85/voyage-engine-v85.js'
];
for(const path of modulePaths)new Function('window',fs.readFileSync(path,'utf8'))(w);
new Function('window','document','localStorage','navigator','location','indexedDB','setTimeout','clearTimeout','requestAnimationFrame','console','Promise',source)(
 w,document,localStorage,{userAgent:'V10.0 QA iPhone simulated',storage:{persist:()=>Promise.resolve(true)}},
 {protocol:'https:'},undefined,()=>1,()=>{},cb=>{if(typeof cb==='function')cb();return 1},
 {log(){},error(e){throw e},warn(){}},Promise
);
const q=w.__qa95;assert(q,'Integrated test bridge unavailable');
const g=q.initialGame();q.setGame(g);g.ageMonths=21*12;g.clock.year=21;g.clock.month=0;
Object.assign(g.player,{faction:'Marine',career:'Marine',rank:'Recrue',health:90,energy:86,situation:'Service actif',activity:'Patrouille',activityType:'marine'});
g.flags.ambitionOffered=true;g.flags.careerOffered=true;g.flags.specializationOffered=true;
g.player.specialization='combat';
g.missionBoard=[{id:'v95_escort_qa',title:'Escorte de QA',desc:'Protéger un convoi',reward:1500,duration:3,danger:'low',power:20,type:'escort'}];
g.relations.push({id:'v95_friend',name:'Nami QA',role:'Ami',affection:60,respect:67,trust:69,loyalty:60,familiarity:67,rivalry:1,status:'active',ambition:'Loyauté',temperament:'Curieux'});
q.ensure();
assert(q.gameVersion==='10.6.0'&&q.saveVersion===1000,'Version mismatch');
const hub=q.hub();assert(hub&&hub.version==='9.5.0','Live Action Hub failed to initialize');
let actions=hub.build();
assert(actions.some(x=>x.id==='mission:v95_escort_qa'&&x.available),'Live mission action missing');
assert(actions.some(x=>x.id==='relation:v95_friend:time'&&x.available),'Live relation action missing');
assert(actions.some(x=>x.id==='open:abilities:trainingAnnualActions'),'Abilities advanced destination missing');
q.openTab('actions');
assert(q.uiState().activeTab==='actions','Action navigation was not persisted');
assert(el('#v95Hub').innerHTML.includes('Que veux-tu faire ?'),'Live Action Hub failed to render');
hub.star('mission:v95_escort_qa');
assert(g.meta.actionHubV95.favorites.includes('mission:v95_escort_qa'),'Persistent mission favorite not saved');
assert(hub.execute('mission:v95_escort_qa'),'Live mission action returned failure');
assert(g.activeMission?.id==='v95_escort_qa','Action Hub did not dispatch to real mission engine');
assert((g.history||[]).some(x=>x.title==='Mission acceptée'),'Mission did not produce canonical history');
assert(hub.ensure().recent.includes('mission:v95_escort_qa'),'Recent live action was not recorded');
q.openTab('abilities');assert(q.uiState().activeTab==='abilities','Hidden legacy abilities navigation broken');
q.render();assert(q.uiState().activeTab==='abilities','Abilities sub-tab failed to persist across rerender');
q.openTab('actions');assert(q.uiState().activeTab==='actions','Cannot return to Action Hub');
g.agency.annualTurn={active:true,monthsSimulated:4,plan:{...g.agency.annualPlan}};
actions=hub.build();
assert(actions.some(x=>x.id==='advance'&&x.available),'Continue yearly simulation missing');
assert(actions.some(x=>x.id==='relation:v95_friend:time'&&!x.available),'Social action not locked during annual simulation');
g.agency.annualTurn=null;
g.pendingDecision={id:'qa',title:'Choix majeur',text:'Décider',choices:[{label:'Accepter',action:'travel:cancel'}]};
actions=hub.build();
assert(actions.some(x=>x.id==='decision'&&x.available),'Pending choice was not surfaced as actionable');
assert(!hub.execute('relation:v95_friend:time'),'Pending choice allowed direct social action');
g.pendingDecision=null;
assert(JSON.stringify(g.meta.actionHubV95).length<2200,'Action Hub metadata grows too large');

/* V10.0: executable age-only regression against the actual inline game engine */
g.pendingDecision=null;g.activeMission=null;g.player.travel=null;g.agency.annualTurn=null;
g.player.energy=85;
const ageBefore=g.ageMonths,moneyBefore=g.player.money,xpBefore=g.player.careerXP,rankBefore=g.player.rank;
const powerBefore=Object.values(g.player.stats).map(x=>Number(x)||0);
assert(q.advance()!==false,'Manual-year aging must succeed');
assert(g.ageMonths===ageBefore+12,'Advance must increment precisely one year');
assert(g.player.money===moneyBefore,'Aging changed money without manual action');
assert(g.player.careerXP===xpBefore,'Aging generated career XP automatically');
assert(g.player.rank===rankBefore,'Aging generated automatic promotion');
assert(Object.values(g.player.stats).every((x,i)=>Number(x)===powerBefore[i]),'Aging trained stats passively');
assert(q.manualStatus('work').available,'Aging did not replenish work quota');
const afterAge=g.ageMonths,afterMoney=g.player.money,afterXp=g.player.careerXP;
assert(q.manual('work')===true,'Manual career work action rejected');
assert(g.ageMonths===afterAge,'Work should not advance age');
assert(g.player.money>afterMoney&&g.player.careerXP>afterXp,'Manual work must add real salary and XP');
assert(q.manualStatus('work').remaining===3,'First work action did not decrement the annual allowance');
assert(q.manualStatus('work').efficiency===.78,'Second work action must yield 78%');
assert(q.manual('work')===true,'Second work session rejected');
assert(q.manualStatus('work').remaining===2,'Second work session not counted');
assert(q.manual('work')===true&&q.manual('work')===true,'Third or fourth work session rejected');
assert(q.manualStatus('work').remaining===0,'Four work sessions should exhaust the cap');
assert(q.manual('work')===false,'Work cap was bypassed');
assert(g.meta.manualLifeV102.spent.work===4&&g.meta.manualLifeV102.history.filter(x=>x.id==='work').length===4,'V10.2 work ledger does not match successful actions');
const afterWorkXp=g.player.careerXP;
g.pendingDecision=null;
assert(q.advance()!==false,'Second year aging failed');
assert(g.player.careerXP===afterWorkXp,'Aging gave passive XP after earlier work');
assert(q.manualStatus('work').available,'New year did not reopen work action');
g.pendingDecision={id:'v100qa_pause',title:'Décision en attente',choices:[]};
const blockedAge=g.ageMonths;
assert(q.advance()===false&&g.ageMonths===blockedAge,'Aging must not skip pending decisions');
g.pendingDecision=null;

/* V10.1: shared real-game eligibility and rejected-action history consistency. */
const previousCareer=g.player.career;
g.player.career='Aucune';
const unavailableWork=q.manualStatus('work');
assert(!unavailableWork.available&&/carrière/.test(unavailableWork.reason),'Manual work eligibility ignored absent career');
const hubWork=hub.build().find(a=>a.id==='manual:work');
assert(hubWork&&!hubWork.available&&hubWork.reason===unavailableWork.reason,'Hub and manual engine disagree on blocked work');
q.openTab('life');q.render();
assert(/data-v100-action="work" disabled/.test(el('#annualFocusOptions').innerHTML),'Manual panel still shows unavailable work as enabled');
const recentBefore=[...hub.ensure().recent];
assert(hub.execute('manual:work')===false,'Rejected work was executed through the Hub');
assert(JSON.stringify(hub.ensure().recent)===JSON.stringify(recentBefore),'Rejected Hub action polluted the action history');
g.player.career=previousCareer;
const previousTravel=g.player.travel,previousEnergy=g.player.energy,previousHealth=g.player.health;
g.player.travel={from:'Shells Town',destination:'Loguetown',remaining:2,total:2,danger:10};
assert(!q.manualStatus('training').available,'Training while traveling was not blocked by shared status');
assert(!hub.build().find(a=>a.id==='manual:training').available,'Hub training while traveling is inconsistently enabled');
g.player.energy=5;
assert(!q.manualStatus('navigation').available&&/Énergie/.test(q.manualStatus('navigation').reason),'Navigation cost is not enforced at eligibility');
g.player.travel=previousTravel;
g.player.energy=100;g.player.health=100;
assert(!q.manualStatus('rest').available,'Full health and energy should not spend a rest action');
g.player.health=previousHealth;g.player.energy=previousEnergy;
assert(!q.manualStatus('mission').available,'Mission completion offered without an active mission');
assert(q.manualStatus('training').remaining===5,'Training capacity should be 5 at start of year');
assert(q.trainingFocus('combat')===true,'Training focus selection failed');
assert(g.meta.manualLifeV102.trainingFocus==='combat','Training focus not persisted');
assert(q.manual('training')===true,'Manual combat training rejected');
assert(q.manualStatus('training').efficiency===.82,'Second training must diminish to 82%');
assert(q.manualStatus('training').remaining===4,'Training cap not consumed correctly');

g.pendingDecision={id:'qa_v101',title:'Décision',choices:[]};
assert(!q.manualStatus('work').available,'Shared manual status ignored a pending decision');
g.pendingDecision=null;
assert(Array.isArray(g.agency.lastAnnualReport.highlights),'Manual yearly events missing from digest');
assert(g.agency.lastAnnualReport.director&&typeof g.agency.lastAnnualReport.director.theme==='string','Life Director no longer receives annual events');

/* V10.3: active career gameplay across multiple actions, with contextual costs. */
g.player.energy=100;g.player.health=90;g.player.career='Marine';g.player.faction='Marine';g.pendingDecision=null;g.player.travel=null;
assert(q.careerMode('intensive')===true,'V10.3 intensive mode cannot be selected');
assert(g.player.careerV103.mode==='intensive','Work mode not saved');
assert(q.manualStatus('work').cost===18,'Dynamic intensive work energy cost not displayed');
g.player.energy=14;
assert(!q.manualStatus('work').available,'Intensive work should be blocked with only 14 energy');
g.player.energy=100;
const startCareerMoney=g.player.money,startCareerXp=g.player.careerXP;
const careerRank=g.player.rank;
assert(q.manualStatus('work').remaining===4,'Career work quota unexpectedly used');
for(let i=0;i<4;i++)assert(q.manual('work')===true,'V10.3 manual work session '+i+' failed');
assert(g.player.money>startCareerMoney&&g.player.careerXP>startCareerXp,'Work should pay and earn career XP');
assert(g.player.rank===careerRank,'Work automatically changed rank');
assert(g.player.careerV103.workSessions===4&&g.player.careerV103.performance>55,'Career performance did not track actual work');
assert(!q.manualStatus('work').available,'Yearly work cap was bypassed');
assert(q.manualStatus('career_support').available,'Team support unavailable with an active career');
assert(hub.build().some(x=>x.id==='manual:career_support'&&x.available),'Career action absent from Hub');
assert(q.manual('career_support')===true,'Professional support action failed');
assert(q.manual('career_initiative')===true,'Professional initiative failed');
assert(g.player.careerV103.performance>60,'Professional actions did not improve performance');
assert(q.manualStatus('career_bonus').available,'Successful work should unlock bonus request: '+JSON.stringify({status:q.manualStatus('career_bonus'),performance:g.player.careerV103.performance,standing:g.player.careerV73.standing,energy:g.player.energy,identity:g.player.careerV103.identity,career:g.player.career}));
const attemptedBonus=q.manual('career_bonus');
assert(attemptedBonus===true,'Bonus review was not performed');
assert(q.manualStatus('career_bonus').remaining===0,'Bonus request quota was not consumed');
assert(g.player.careerV103.history.some(x=>x.kind==='career_bonus'),'Bonus review not written to career ledger');
assert(g.player.careerV73.standing>30&&g.player.careerV73.trust>40,'Professional decisions did not impact V7.3 hierarchy');
assert(q.careerMode('strategic')===true,'Work mode cannot be changed');
assert(q.manualStatus('career_bonus').available===false,'One bonus review per year was not enforced');
assert(g.meta.manualLifeV102.spent.career_support===1&&g.meta.manualLifeV102.spent.career_initiative===1,'Career actions not counted through unified V10.2 engine');
assert(g.player.careerV103.earned>=g.player.careerV103.bonusEarned,'Career account totals inconsistent');
console.log('V10.3 INTEGRATED CAREER QA OK',JSON.stringify({performance:g.player.careerV103.performance,sessions:g.player.careerV103.workSessions,bonus:g.player.careerV103.bonusEarned}));

/* V10.4: same real browser/character data, repeatable social encounters and mutual romance. */
g.player.energy=100;g.player.money=Math.max(20000,g.player.money);g.pendingDecision=null;g.agency.annualTurn=null;
const friend=g.relations.find(r=>r.id==='v95_friend');
friend.adult=true;
assert(q.socialStatus('v95_friend','time').available,'Friendship action unavailable');
const originalBond=friend.trust;
assert(q.socialAction('v95_friend','time')===true,'V10.4 friendship action failed');
assert(g.player.socialV104.counts.v95_friend===1,'Social action not recorded in new ledger');
assert(friend.trust>=originalBond,'Social friendship did not affect trust');
assert(q.socialAction('v95_friend','help')===true,'Second social action with same person failed');
assert(q.socialStatus('v95_friend','confide').available,'Third social action unexpectedly locked');
assert(q.socialAction('v95_friend','confide')===true,'Third social action failed');
assert(!q.socialStatus('v95_friend','time').available,'Per-person social limit not enforced');
assert(g.player.socialV104.history.length===3,'Social interaction memory missing');
assert(hub.build().some(x=>x.id==='relation:v95_friend:time'&&!x.available),'Hub and game disagree on exhausted social actions');
assert(g.player.socialV93.relations.v95_friend,'V9.3 relationship history no longer synchronized');
const adult={...friend,id:'v104_adult_qa',name:'Relation QA adulte',role:'Ami',adult:true,trust:77,affection:79,familiarity:72,rivalry:0};
g.relations.push(adult);
const noRomance={...adult,id:'v104_minor_qa',name:'Personnage âge inconnu',adult:false};
g.relations.push(noRomance);
assert(!q.socialStatus('v104_minor_qa','flirt').available,'Adult age check ignored');
assert(q.socialStatus('v104_adult_qa','date').available,'Qualified adult relation cannot propose dating');
assert(q.socialAction('v104_adult_qa','date')===true,'Dating proposal was not resolved');
assert(g.player.socialV104.history.some(x=>x.action==='date'),'Dating proposal not stored');
const paired=g.player.personalV78?.partnerId==='v104_adult_qa';
if(paired)assert(g.player.personalV78.partnership==='dating','Accepted dating not reflected in household');
else assert(g.player.personalV78?.partnerId!=='v104_adult_qa','Rejected dating improperly created a partner');
assert(!q.socialStatus('v104_adult_qa','commit').available||paired,'Commitment possible without being in a couple');
assert(g.meta.manualLifeV102.spent.work===4,'V10.4 social actions modified career quota');
console.log('V10.4 INTEGRATED SOCIAL QA OK',JSON.stringify({socialActions:g.player.socialV104.used,partner:paired,memory:g.player.socialV104.history.length}));

/* V10.5 : game-level purchase and active revenue, not passive salary while aging. */
g.pendingDecision=null;g.player.travel=null;g.player.money=250000;g.player.energy=100;
assert(q.economyPerks().training===1,'Training perk must start neutral');
assert(q.economySelect('purchase','dojo')===true,'Cannot select training facility');
assert(q.manualStatus('economy_buy').available,'Economic purchase unavailable despite cash and adulthood');
const beforeBuyMoney=g.player.money,expectedCost=q.economyStatus('economy_buy').cost;
assert(q.manual('economy_buy')===true,'Purchasing training facility failed');
assert(g.player.money===beforeBuyMoney-expectedCost,'Purchase must deduct region-adjusted Berry exactly once');
assert(g.player.economyV105.holdings.dojo===1,'Bought asset missing from player save');
assert(q.economyPerks().training>1,'Purchased facility does not boost voluntary training');
assert(q.economySelect('purchase','shop')===true,'Cannot select business for investment');
assert(q.manual('economy_buy')===true,'Purchase of business failed');
assert(g.player.economyV105.holdings.shop===1,'Purchased business not retained');
assert(!q.manualStatus('economy_buy').available,'Two annual investments limit ignored');
assert(q.economySelect('operate','shop')===true,'Cannot select enterprise operation');
const beforeOperate=g.player.money;
assert(q.manualStatus('economy_operate').available,'Purchased enterprise cannot operate');
assert(hub.build().some(x=>x.id==='manual:economy_operate'&&x.available),'Business operating action missing from central Hub');
assert(q.manual('economy_operate')===true,'Enterprise operation failed');
assert(g.player.economyV105.operated===1,'Enterprise decision not counted');
const result=g.player.economyV105.history.at(-1);
assert(result.type==='operate'&&g.player.money-beforeOperate===result.amount,'Operational P&L differs from actual Berry balance');
assert(g.player.careerV103.workSessions===4,'Business operations improperly increased professional work');
assert(g.meta.manualLifeV102.spent.economy_buy===2&&g.meta.manualLifeV102.spent.economy_operate===1,'Economy actions bypassed unified quota engine');
assert(q.economyStatus('economy_operate').available,'Second operation should be available');
console.log('V10.5 INTEGRATED ECONOMY QA OK',JSON.stringify({invested:g.player.economyV105.invested,net:g.player.economyV105.netOperating,businessLevel:g.player.economyV105.holdings.shop}));

/* V10.6 : real game action execution, dynamic preparation, mission planning and island scouting. */
g.pendingDecision=null;g.player.travel=null;g.player.money=50000;g.player.energy=100;g.player.health=100;g.activeMission=null;
assert(q.adventureStatus('expedition_prepare').available,'Expedition preparation incorrectly blocked');
assert(!q.adventureStatus('expedition_command').available,'Crewless command should be unavailable');
assert(!q.manualStatus('expedition_coordinate').available,'Mission planning needs an accepted mission');
assert(hub.build().some(x=>x.id==='manual:expedition_prepare'&&x.available),'Expedition action missing from Hub');
assert(hub.build().some(x=>x.id==='open:world:v106AdventureCard'),'Active adventure page missing from Hub');
const cash0=g.player.money,energy0=g.player.energy;
assert(q.manual('expedition_prepare')===true,'Expedition prep action failed');
assert(g.player.money===cash0-400&&g.player.energy===energy0-5,'Expedition action charged wrong cash or energy');
assert(g.player.adventureV106.preparedness>0,'Expedition prep state missing');
assert(g.meta.manualLifeV102.spent.expedition_prepare===1,'Prep not recorded in shared action registry');
assert(q.manual('expedition_prepare')===true,'Second expedition preparation failed');
assert(!q.manualStatus('expedition_prepare').available,'Expedition limit must stop the third preparation');
g.activeMission={id:'qa-expedition-mission',title:'V10.6 mission',type:'explore',danger:'low',power:6,reward:1000,remaining:2};
assert(q.manualStatus('expedition_coordinate').available,'Accepted mission should enable tactical plan');
assert(q.manual('expedition_coordinate')===true,'Tactical mission planning failed');
assert(g.player.adventureV106.missionId===g.activeMission.id&&g.player.adventureV106.missionBonus>0,'Mission tactical bonus missing');
assert(q.manual('expedition_scout')===true,'Island scouting action failed');
assert(g.player.adventureV106.expeditions===1,'Scouting not persisted on player');
assert(g.meta.manualLifeV102.spent.expedition_scout===1,'Scouting bypassed shared quotas');
const restoredJSON=JSON.parse(JSON.stringify(g));
assert(restoredJSON.player.adventureV106.expeditions===1&&restoredJSON.player.adventureV106.missionBonus>0,'V10.6 state missing after save roundtrip');
g.pendingDecision={id:'v106_lock',title:'En attente',text:'Décision',choices:[]};
assert(!q.manualStatus('expedition_scout').available,'Pending decision should lock scouts');
g.pendingDecision=null;
console.log('V10.6 INTEGRATED ADVENTURE QA OK',JSON.stringify({prepared:g.player.adventureV106.preparedness,expeditions:g.player.adventureV106.expeditions,missionBoost:g.player.adventureV106.missionBonus}));

console.log('V10.1 INTEGRATED RUNTIME QA OK',JSON.stringify({tabs:['life','actions','character','relations','world'],actions:actions.length,
 favorites:g.meta.actionHubV95.favorites.length,lastAction:g.meta.actionHubV95.recent[0],saveVersion:q.saveVersion}));
