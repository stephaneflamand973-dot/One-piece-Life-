import fs from 'node:fs';
const assert=(v,m)=>{if(!v)throw Error(m)};
const html=fs.readFileSync('index.html','utf8');
let source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const init="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
assert(source&&source.includes(init),'Game runtime entrypoint missing');
source=source.replace(init,"window.__qa95={initialGame,setGame(v){game=v},getGame(){return game},ensure:ensureV6,render,openTab:(tab)=>v76OpenTab(tab,true),uiState:()=>v76Ensure(),hub:()=>v95Ensure(),manualStatus:v100Status,manual:v100Act,advance,resolveDecision,saveVersion:SAVE_VERSION,gameVersion:GAME_VERSION};");
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
 'src/data/ui-layout-v76.js','src/v76/ui-components-v76.js',
 'src/data/simulation-core-v80.js','src/v80/simulation-core-v80.js',
 'src/data/game-flow-v90.js','src/v90/game-flow-engine-v90.js',
 'src/data/goals-v91.js','src/v91/goals-engine-v91.js',
 'src/data/npc-lives-v92.js','src/v92/npc-lives-engine-v92.js',
 'src/data/relationships-v93.js','src/v93/relationships-engine-v93.js',
 'src/data/world-intel-v94.js','src/v94/world-intel-engine-v94.js',
 'src/data/action-hub-v95.js','src/v95/action-hub-engine-v95.js','src/v95/action-hub-runtime-v95.js',
 'src/data/manual-life-v100.js','src/v100/manual-life-engine-v100.js'
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
assert(q.gameVersion==='10.0.0'&&q.saveVersion===1000,'Version mismatch');
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
assert(q.manualStatus('work').remaining===0,'Work quota not consumed');
assert(q.manual('work')===false,'Work unexpectedly repeats in the same year');
const afterWorkXp=g.player.careerXP;
g.pendingDecision=null;
assert(q.advance()!==false,'Second year aging failed');
assert(g.player.careerXP===afterWorkXp,'Aging gave passive XP after earlier work');
assert(q.manualStatus('work').available,'New year did not reopen work action');
g.pendingDecision={id:'v100qa_pause',title:'Décision en attente',choices:[]};
const blockedAge=g.ageMonths;
assert(q.advance()===false&&g.ageMonths===blockedAge,'Aging must not skip pending decisions');
g.pendingDecision=null;

console.log('V10.0 INTEGRATED RUNTIME QA OK',JSON.stringify({tabs:['life','actions','character','relations','world'],actions:actions.length,
 favorites:g.meta.actionHubV95.favorites.length,lastAction:g.meta.actionHubV95.recent[0],saveVersion:q.saveVersion}));
