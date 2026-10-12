import fs from 'node:fs';
const assert=(v,m)=>{if(!v)throw Error(m)};
const html=fs.readFileSync('index.html','utf8');
let source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const init="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
assert(source&&source.includes(init),'Game runtime entrypoint missing');
source=source.replace(init,"window.__qa95={initialGame,setGame(v){game=v},getGame(){return game},ensure:ensureV6,render,openTab:(tab)=>v76OpenTab(tab,true),uiState:()=>v76Ensure(),hub:()=>v95Ensure(),careerMarket:()=>v112Market(),careerDo:(kind,id)=>v112Do(kind,id),advance,resolveDecision,saveVersion:SAVE_VERSION,gameVersion:GAME_VERSION};");
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
Object.entries({'#seedInput':'950095','#nameInput':'V95 Integration','#difficultyInput':'Casual',
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
 'src/data/manual-life-v100.js','src/v100/manual-life-engine-v100.js',
 'src/data/action-v102.js','src/v102/action-engine-v102.js','src/data/career-v103.js','src/v103/career-engine-v103.js','src/data/career-market-v112.js','src/v112/career-market-engine-v112.js','src/data/social-v104.js','src/v104/social-engine-v104.js','src/data/economy-v105.js','src/v105/economy-engine-v105.js'
];
for(const path of modulePaths)new Function('window',fs.readFileSync(path,'utf8'))(w);
new Function('window','document','localStorage','navigator','location','indexedDB','setTimeout','clearTimeout','requestAnimationFrame','console','Promise',source)(
 w,document,localStorage,{userAgent:'V9.5 QA iPhone simulated',storage:{persist:()=>Promise.resolve(true)}},
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
assert(q.gameVersion==='12.0.0'&&q.saveVersion===1200,'Version mismatch: '+JSON.stringify({gameVersion:q.gameVersion,saveVersion:q.saveVersion}));
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
console.log('V9.5 INTEGRATED RUNTIME QA OK',JSON.stringify({tabs:['life','actions','character','relations','world'],actions:actions.length,
 favorites:g.meta.actionHubV95.favorites.length,lastAction:g.meta.actionHubV95.recent[0],saveVersion:q.saveVersion}));

/* V11.2: real-game application -> interview -> employment -> manual work -> resignation. */
const c=q.initialGame();q.setGame(c);c.ageMonths=21*12;c.clock.year=21;c.clock.month=0;
c.player.faction='Civil';c.player.career='Aucune';c.player.rank='Sans emploi';
c.player.energy=100;c.player.travel=null;c.player.bounty=0;c.pendingDecision=null;
for(const k of ['Navigation','Charisme','Cuisine','Artisanat','Combat','Tir','Commandement','Discrétion','Endurance','Physique','Intelligence','Discipline'])c.player.skills[k]=100;
for(const k of Object.keys(c.player.stats||{}))c.player.stats[k]=100;
c.agency.annualTurn=null;
q.openTab('actions');hub.ensure().category='career';hub.renderHub();
assert(el('#v95Hub').innerHTML.includes('Métiers ordinaires'),'The real career market must be rendered in the Activities tab');
const vacancies=q.careerMarket().entries.filter(j=>j.kind==='ordinary'&&j.status.available);
assert(vacancies.length>0,'Real-game employment offers must be available to qualified adults');
const job=vacancies[0];
const beforeCash=c.player.money;
assert(q.careerDo('apply',job.id),'Applying to a local ordinary job should open an interview');
assert(q.careerMarket().interview?.id===job.id,'Job interview must be saved before the player answers');
hub.renderHub();assert(el('#v95Hub').innerHTML.includes('data-v112-answer'),'A real in-game interview must show response choices');
assert(q.careerDo('answer','skills'),'The real interview response must resolve');
assert(c.player.career===job.label,'A qualified applicant with a favorable outcome must get the job');
assert(q.careerMarket().active?.id===job.id,'Job identity must persist after hiring');
hub.renderHub();
assert(el('#v95Hub').innerHTML.includes('Actions professionnelles'),'Employed characters need their own workplace menu');
assert(!el('#v95Hub').innerHTML.includes('data-v112-apply='),'Employed characters must not see irrelevant job applications');
assert(c.player.money===beforeCash,'Being hired must not create passive salary');
assert(hub.execute('manual:work'),'A newly hired ordinary worker must be able to work manually');
assert(c.player.money>beforeCash,'The chosen ordinary profession must pay only after work');
assert(c.player.careerXP>0,'Work must produce actual career experience');
assert(q.careerDo('quit'),'The worker must be able to resign');
assert(c.player.career==='Aucune'&&!q.careerMarket().active,'Resigning must return to unemployment without corrupting saved state');
console.log('V11.2 INTEGRATED CAREER MARKET QA OK',JSON.stringify({job:job.label,interview:true,paidOnAction:true,resignation:true}));
