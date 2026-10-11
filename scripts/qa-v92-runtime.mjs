import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const modules=[
  'src/data/game-flow-v90.js','src/v90/game-flow-engine-v90.js',
  'src/data/goals-v91.js','src/v91/goals-engine-v91.js',
  'src/data/npc-lives-v92.js','src/v92/npc-lives-engine-v92.js'
].map(p=>fs.readFileSync(p,'utf8'));

function assert(c,m){if(!c)throw new Error(m)}

let source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
assert(source&&source.includes(initCall),'V9.2 runtime instrumentation marker missing');
source=source.replace(initCall,'window.__qa92={initialGame,setGame(v){game=v},getGame(){return game},ensure:ensureV6,advance,resolveDecision,tick:v92Tick,renderLives:renderV92Lives,renderRelations,snapshot:v92RelationSnapshot,state:v92Ensure,overallPower};');

const elements=new Map();
function fakeElement(sel){
  if(!elements.has(sel)){
    const cls=new Set();
    elements.set(sel,{value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{},onclick:null,
      classList:{add(...xs){xs.forEach(x=>cls.add(x))},remove(...xs){xs.forEach(x=>cls.delete(x))},toggle(x,f){if(f===undefined){if(cls.has(x)){cls.delete(x);return false}cls.add(x);return true}f?cls.add(x):cls.delete(x);return!!f},contains(x){return cls.has(x)}},
      addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},focus(){},select(){},closest(){return null},scrollIntoView(){}
    });
  }
  return elements.get(sel)
}
for(const [k,v] of Object.entries({'#seedInput':'920092','#nameInput':'NPC Runtime QA','#difficultyInput':'Casual','#originInput':'East Blue','#raceInput':'Humain','#styleInput':'Équilibré'}))fakeElement(k).value=v;
const document={visibilityState:'visible',querySelector:fakeElement,querySelectorAll(){return[]},addEventListener(){},removeEventListener(){},execCommand(){return true}};
const storage=new Map(),localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear()};
const win={addEventListener(){},removeEventListener(){},scrollTo(){},matchMedia(){return{matches:false}},isSecureContext:true};win.window=win;win.document=document;win.localStorage=localStorage;
new Function('window',registrySrc)(win);for(const m of modules)new Function('window',m)(win);
new Function('window','document','localStorage','navigator','location','indexedDB','setTimeout','clearTimeout','requestAnimationFrame','console','Promise',source)(
  win,document,localStorage,{userAgent:'V9.2-RUNTIME-QA',clipboard:{writeText(){return Promise.resolve()}},storage:{persist(){return Promise.resolve(true)}}},
  {protocol:'https:'},undefined,()=>1,()=>{},cb=>{if(typeof cb==='function')cb();return 1},{log(){},warn(){},error(){}},Promise
);

const q=win.__qa92;assert(q,'V9.2 runtime API missing');
const game=q.initialGame();q.setGame(game);
game.ageMonths=20*12;game.clock.year=20;game.clock.month=0;game.meta.difficulty='Casual';
Object.assign(game.player,{faction:'Marine',career:'Marine',rank:'Caporal',situation:'Service actif',activity:'Patrouille',activityType:'marine',health:100,energy:90});
game.flags.ambitionOffered=true;game.flags.careerOffered=true;game.flags.specializationOffered=true;
game.player.specialization='combat';
game.relations=[
  {id:'mira',name:'Mira',role:'Camarade',affection:58,respect:62,trust:55,loyalty:52,fear:0,rivalry:8,familiarity:35,status:'active',temperament:'Ambitieux',ambition:'Influence'},
  {id:'neris',name:'Neris',role:'Marchand itinérant',affection:46,respect:42,trust:48,loyalty:35,fear:0,rivalry:4,familiarity:26,status:'active',temperament:'Opportuniste',ambition:'Fortune'},
  {id:'rook',name:'Rook',role:'Rival',affection:24,respect:65,trust:22,loyalty:15,fear:3,rivalry:62,familiarity:44,status:'active',temperament:'Téméraire',ambition:'Aventure'}
];
q.ensure();
for(const r of game.relations)assert(typeof r.socialV74==='object','Relation normalization failed');

let years=0,decisions=0,maxSave=0,safety=0;
while(years<12&&game.alive&&safety++<1000){
  const before=game.clock.year;
  if(game.pendingDecision){
    const choice=game.pendingDecision.choices?.[0];assert(choice,'Decision without choice');decisions++;q.resolveDecision(choice.action)
  }else q.advance();
  if(!game.agency?.annualTurn?.active&&game.clock.year>before)years++;
  maxSave=Math.max(maxSave,JSON.stringify(game).length);
}
assert(years>=10,'V9.2 integrated simulation too short');

const state=q.state(),lives=game.relations.map(r=>q.snapshot(r)).filter(Boolean);
assert(Object.keys(state.actors).filter(x=>x.startsWith('rel:')).length>=3,'Procedural relations were not tracked');
assert(state.totalActions>=30,'Too few autonomous actions');
assert(state.totalMoves>=1,'No autonomous travel over twelve years');
assert(state.totalPromotions>=1,'No autonomous promotion over twelve years');
assert(lives.some(x=>x.region!==game.player.region),'No NPC ever built an independent geography');
assert(lives.some(x=>x.rankIndex>0),'No NPC career progressed');
assert(lives.every(x=>Number.isFinite(x.wealth)&&Number.isFinite(x.power)&&Number.isFinite(x.condition)),'NPC numeric state corrupted');
assert(maxSave<600*1024,'V9.2 save grew beyond 600 KiB');

q.renderLives();
assert(fakeElement('#v92LivesCard').innerHTML.includes('Vies suivies'),'V9.2 life dashboard did not render');
q.renderRelations();
assert(fakeElement('#relationsList').innerHTML.includes('v92-relation-meta'),'V9.2 relation metadata did not render');

console.log('V9.2 INTEGRATED RUNTIME QA OK',JSON.stringify({
  years,decisions,alive:game.alive,totalTracked:Object.keys(state.actors).length,totalActions:state.totalActions,
  moves:state.totalMoves,promotions:state.totalPromotions,careerChanges:state.totalCareerChanges,
  maxSaveKB:+(maxSave/1024).toFixed(1),
  lives:lives.map(x=>({name:x.actorId,profession:x.profession,rank:x.rankLabel,region:x.region,power:+x.power.toFixed(1),wealth:Math.round(x.wealth),action:x.lastAction}))
}));
