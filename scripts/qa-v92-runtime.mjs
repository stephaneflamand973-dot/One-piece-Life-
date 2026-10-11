import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const goalsData=fs.readFileSync('src/data/goals-v91.js','utf8');
const goalsEngine=fs.readFileSync('src/v91/goals-engine-v91.js','utf8');
const livesData=fs.readFileSync('src/data/npc-lives-v92.js','utf8');
const livesEngine=fs.readFileSync('src/v92/npc-lives-engine-v92.js','utf8');

let source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
if(!source||!source.includes(initCall))throw new Error('V9.2 runtime instrumentation marker missing');
source=source.replace(initCall,`window.__v92runtime={
 initialGame,setGame(v){game=v},getGame(){return game},ensure:ensureV6,advance,resolveDecision,
 openRelations(){v76OpenTab('relations',true);renderRelations()},ensure92:v92Ensure,
 summary(){const m=v92Module();return m?m.summary(v92Ensure(),v92TrackedActors(),{region:game.player.region}):null},
 relationActors:v92RelationActors
};`);

const elements=new Map();
function el(sel){
  if(!elements.has(sel)){
    const cls=new Set();
    elements.set(sel,{value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{},onclick:null,
      classList:{add(...x){x.forEach(v=>cls.add(v))},remove(...x){x.forEach(v=>cls.delete(v))},toggle(v,f){if(f===undefined){if(cls.has(v)){cls.delete(v);return false}cls.add(v);return true}f?cls.add(v):cls.delete(v);return!!f},contains(v){return cls.has(v)}},
      addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},focus(){},select(){},closest(){return null},scrollIntoView(){}});
  }
  return elements.get(sel)
}
Object.entries({'#seedInput':'920092','#nameInput':'V92 Runtime','#difficultyInput':'Casual','#originInput':'East Blue','#raceInput':'Humain','#styleInput':'Équilibré'}).forEach(([k,v])=>el(k).value=v);
const document={visibilityState:'visible',querySelector:el,querySelectorAll(){return[]},addEventListener(){},removeEventListener(){},execCommand(){return true}};
const store=new Map(),localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const w={addEventListener(){},removeEventListener(){},scrollTo(){},matchMedia(){return{matches:false}},isSecureContext:true};w.window=w;w.document=document;w.localStorage=localStorage;

new Function('window',registrySrc)(w);
new Function('window',goalsData)(w);new Function('window',goalsEngine)(w);
new Function('window',livesData)(w);new Function('window',livesEngine)(w);
new Function('window','document','localStorage','navigator','location','indexedDB','setTimeout','clearTimeout','requestAnimationFrame','console','Promise',source)(
  w,document,localStorage,{userAgent:'V92-RUNTIME',clipboard:{writeText(){return Promise.resolve()}},storage:{persist(){return Promise.resolve(true)}}},{protocol:'https:'},undefined,()=>1,()=>{},cb=>{if(typeof cb==='function')cb();return 1},{log(){},warn(){},error(){}},Promise
);

const q=w.__v92runtime;if(!q)throw new Error('V9.2 runtime API missing');
const g=q.initialGame();q.setGame(g);
g.ageMonths=20*12;g.clock.year=20;g.clock.month=0;g.meta.difficulty='Casual';
Object.assign(g.player,{faction:'Marine',career:'Marine',rank:'Recrue',situation:'Service actif',activity:'Patrouille',activityType:'marine',health:100,energy:90});
g.flags.ambitionOffered=true;g.flags.careerOffered=true;g.flags.specializationOffered=true;g.player.specialization='combat';
g.relations.push({id:'qa_friend',name:'Mira Venn',role:'Contact',affection:68,respect:64,trust:72,familiarity:66,rivalry:8,status:'active',ambition:'Aventure',temperament:'Curieux'});
g.relations.push({id:'qa_rival',name:'Rook Voss',role:'Rival',affection:18,respect:70,trust:22,familiarity:58,rivalry:76,status:'active',ambition:'Maîtrise',temperament:'Ambitieux'});
q.ensure();q.ensure92();

let years=0,decisions=0,safety=0,maxActors=0,maxHistory=0,maxSave=0;
while(years<10&&g.alive&&safety++<700){
  const before=g.clock.year;
  if(g.pendingDecision){const ch=g.pendingDecision.choices?.[0];if(!ch)throw new Error('Pending decision without choices');decisions++;q.resolveDecision(ch.action)}
  else q.advance();
  if(!g.agency?.annualTurn?.active&&g.clock.year>before)years++;
  const state=g.world.npcLivesV92||{};
  maxActors=Math.max(maxActors,Object.keys(state.actors||{}).length);
  maxHistory=Math.max(maxHistory,(state.globalHistory||[]).length);
  maxSave=Math.max(maxSave,JSON.stringify(g).length)
}
if(years<8)throw new Error('V9.2 runtime did not progress enough years: '+years);
const sum=q.summary();if(!sum||sum.totalTracked<2)throw new Error('V9.2 runtime lost tracked lives');
if(maxActors>90)throw new Error('V9.2 actor persistence exceeded bound: '+maxActors);
if(maxHistory>50)throw new Error('V9.2 history exceeded bound: '+maxHistory);
if(maxSave>700*1024)throw new Error('V9.2 save exceeded 700KB: '+maxSave);
q.openRelations();
if(!el('#v92LivesCard').innerHTML.includes('Vies importantes'))throw new Error('V9.2 relation UI did not render');
const rels=q.relationActors();if(!rels.some(x=>x.name==='Mira Venn'))throw new Error('V9.2 custom relation missing from life actors');

console.log('V9.2 INTEGRATED RUNTIME QA OK',JSON.stringify({
  years,decisions,tracked:sum.totalTracked,promotions:sum.totalPromotions,objectives:sum.totalObjectives,milestones:sum.totalMilestones,
  maxActors,maxHistory,maxSaveKB:+(maxSave/1024).toFixed(1),
  relationRegions:rels.slice(0,6).map(x=>[x.name,x.currentRegion])
}));
