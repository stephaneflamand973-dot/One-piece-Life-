import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const modules=[
  'src/data/relation-personas-v74.js','src/v74/relation-persona-engine-v74.js',
  'src/data/antagonists-v83.js','src/v83/antagonist-engine-v83.js',
  'src/data/game-flow-v90.js','src/v90/game-flow-engine-v90.js',
  'src/data/goals-v91.js','src/v91/goals-engine-v91.js',
  'src/data/npc-lives-v92.js','src/v92/npc-lives-engine-v92.js',
  'src/data/relationships-v93.js','src/v93/relationships-engine-v93.js',
  'src/data/manual-life-v100.js','src/v100/manual-life-engine-v100.js','src/data/action-v102.js','src/v102/action-engine-v102.js'
].map(p=>fs.readFileSync(p,'utf8'));

function assert(c,m){if(!c)throw new Error(m)}

let source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
assert(source&&source.includes(initCall),'V9.3 runtime instrumentation marker missing');
source=source.replace(initCall,'window.__v93runtime={initialGame,setGame(v){game=v},getGame(){return game},ensure:ensureV6,advance,resolveDecision,ensure93:v93Ensure,onLife:v93OnNpcLifeEvent,maybeBeat:v93MaybeQueueBeat,recordInteraction:v93RecordInteraction,promote:v93MaybePromoteNemesis,profile:v93Profile,render93:renderV93Relationships,openRelations(){v76OpenTab("relations",true);renderRelations()}};');

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
Object.entries({'#seedInput':'930093','#nameInput':'V93 Runtime','#difficultyInput':'Casual','#originInput':'East Blue','#raceInput':'Humain','#styleInput':'Équilibré'}).forEach(([k,v])=>el(k).value=v);
const document={visibilityState:'visible',querySelector:el,querySelectorAll(){return[]},addEventListener(){},removeEventListener(){},execCommand(){return true}};
const store=new Map(),localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const w={addEventListener(){},removeEventListener(){},scrollTo(){},matchMedia(){return{matches:false}},isSecureContext:true};w.window=w;w.document=document;w.localStorage=localStorage;
new Function('window',registrySrc)(w);for(const m of modules)new Function('window',m)(w);
new Function('window','document','localStorage','navigator','location','indexedDB','setTimeout','clearTimeout','requestAnimationFrame','console','Promise',source)(
  w,document,localStorage,{userAgent:'V93-RUNTIME',clipboard:{writeText(){return Promise.resolve()}},storage:{persist(){return Promise.resolve(true)}}},
  {protocol:'https:'},undefined,()=>1,()=>{},cb=>{if(typeof cb==='function')cb();return 1},{log(){},warn(){},error(){}},Promise
);

const q=w.__v93runtime;assert(q,'V9.3 runtime API missing');
const g=q.initialGame();q.setGame(g);
g.ageMonths=22*12;g.clock.year=22;g.clock.month=0;g.meta.difficulty='Casual';
Object.assign(g.player,{faction:'Marine',career:'Marine',rank:'Caporal',situation:'Service actif',activity:'Patrouille',activityType:'marine',health:100,energy:90});
g.flags.ambitionOffered=true;g.flags.careerOffered=true;g.flags.specializationOffered=true;g.player.specialization='combat';
const friend={id:'qa_friend',name:'Mira Venn',role:'Contact',affection:76,respect:70,trust:78,loyalty:72,familiarity:78,rivalry:5,status:'active',ambition:'Loyauté',temperament:'Protecteur'};
const rival={id:'qa_rival',name:'Rook Voss',role:'Rival',affection:10,respect:86,trust:12,loyalty:8,familiarity:88,rivalry:94,status:'active',ambition:'Maîtrise',temperament:'Ambitieux'};
g.relations.push(friend,rival);
q.ensure();q.ensure93();

q.recordInteraction(friend,'help');
q.onLife(friend,{id:'qa_setback',type:'setback',importance:86,month:g.ageMonths,title:'Mira traverse un revers',desc:'Une opération difficile la force à ralentir.'});
assert(q.maybeBeat(),'V9.3 runtime failed to queue relationship beat');
assert(g.pendingDecision&&g.pendingDecision.choices.some(x=>x.action.endsWith(':support')),'Support choice missing from queued relationship beat');
const supportChoice=g.pendingDecision.choices.find(x=>x.action.endsWith(':support'));
q.resolveDecision(supportChoice.action);
assert(!g.pendingDecision,'Relationship beat did not resolve');
const friendLink=g.player.socialV93.relations.qa_friend;
assert(friendLink.npcOwes>=2,'Support and help should create persistent social debt');
assert(friend.socialV74.memories.some(m=>m.type==='v93'),'V9.3 choice did not enter V7.4 memory');

for(let i=0;i<4;i++)q.recordInteraction(rival,'challenge');
g.player.socialV93.relations.qa_rival.grudge=55;
const nemesisId=q.promote(rival);
assert(nemesisId,'Hostile personal rival did not become a V8.3 nemesis');
assert(g.player.socialV93.relations.qa_rival.promotedNemesis,'Nemesis promotion not persisted');
assert((g.world.rivals||[]).some(x=>x.sourceRelationId==='qa_rival'),'Legacy rival bridge missing');
assert((g.world.antagonistV83?.antagonists||[]).some(x=>x.id===nemesisId),'V8.3 antagonist bridge missing');

let years=0,decisions=0,safety=0,maxSave=0;
while(years<8&&g.alive&&safety++<700){
  const before=g.clock.year;
  if(g.pendingDecision){const ch=g.pendingDecision.choices?.[0];assert(ch,'Pending decision without choices');decisions++;q.resolveDecision(ch.action)}
  else q.advance();
  if(!g.agency?.annualTurn?.active&&g.clock.year>before)years++;
  maxSave=Math.max(maxSave,JSON.stringify(g).length)
}
assert(years>=6,'V9.3 integrated simulation did not advance enough years');
assert(g.player.socialV93.totalNemeses===1,'Nemesis count changed unexpectedly');
assert((g.player.socialV93.history||[]).length<=40,'V9.3 global history exceeded bound');
assert(Object.values(g.player.socialV93.relations||{}).every(x=>(x.history||[]).length<=12),'V9.3 link history exceeded bound');
assert(maxSave<750*1024,'V9.3 save grew beyond 750 KiB');

q.render93();
assert(el('#v93SocialCard').innerHTML.includes('Liens les plus structurants'),'V9.3 social dashboard did not render');
assert(el('#v93SocialCard').innerHTML.includes('Némésis persistante'),'V9.3 promoted nemesis not visible in social dashboard');

console.log('V9.3 INTEGRATED RUNTIME QA OK',JSON.stringify({
  years,decisions,alive:g.alive,totalBeats:g.player.socialV93.totalBeats,totalNemeses:g.player.socialV93.totalNemeses,
  totalCommitments:g.player.socialV93.totalCommitments,friendDebt:friendLink.npcOwes,
  friendTier:q.profile(friend).tierLabel,rivalNemesisScore:q.profile(rival).nemesisScore,
  maxSaveKB:+(maxSave/1024).toFixed(1)
}));
