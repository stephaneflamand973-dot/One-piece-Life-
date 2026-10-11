import fs from 'node:fs';
import vm from 'node:vm';
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const eq=(a,b,message)=>assert(a===b,message+' ('+a+' !== '+b+')');
const source=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('src/v94/world-intel-v94.css','utf8');
const registry=fs.readFileSync('src/core/module-registry.js','utf8');
const data=fs.readFileSync('src/data/world-intel-v94.js','utf8');
const engine=fs.readFileSync('src/v94/world-intel-engine-v94.js','utf8');
const ctx={console,Math,JSON,Object,Array,String,Number,Map,Set};
ctx.window=ctx;vm.createContext(ctx);
for(const [name,s] of [['registry',registry],['data',data],['engine',engine]])vm.runInContext(s,ctx,{filename:name});
const d=ctx.OPL_MODULES.get('worldIntelDataV94'),m=ctx.OPL_MODULES.get('worldIntelEngineV94');
assert(d&&m,'World intelligence modules missing');
eq(d.version,'9.4.0','Data version');eq(m.version,'9.4.0','Engine version');
const world={
 worldHooks:[
  {id:'intel_local',status:'open',expiresAt:126,region:'East Blue',urgency:85,difficulty:48,title:'Convoi intercepté',desc:'Un signal de détresse'},
  {id:'past',status:'open',expiresAt:120,region:'East Blue',urgency:100,title:'Expiré'},
  {id:'completed',status:'resolved',expiresAt:150,region:'East Blue',title:'Déjà terminé'}
 ],
 rumors:[
  {id:'unconfirmed',status:'unverified',region:'East Blue',confidence:40,title:'Rumeur incertaine',text:'À vérifier'},
  {id:'confirmed',status:'confirmed',region:'Grand Line',confidence:78,title:'Rumeur confirmée',text:'Vérifiée'},
  {id:'false',status:'false',region:'East Blue',confidence:99,title:'Rumeur démentie'}
 ],
 autonomousHistory:[
  {id:'known',known:true,title:'Mouvement identifié',desc:'Fait vu',region:'East Blue'},
  {id:'secret',known:false,title:'Événement secret',desc:'Caché',region:'East Blue'}
 ],
 regionalPressures:{'East Blue':{Instabilité:73,Piraterie:62}}
};
const p={region:'East Blue',power:34};
const signals=m.collect(world,p,120);
assert(signals.length===5,'Expected five known signals');
assert(!signals.some(x=>x.title==='Événement secret'||x.title==='Rumeur démentie'||x.title==='Expiré'||x.title==='Déjà terminé'),'Unknown or stale information leaked');
assert(signals.some(x=>x.kind==='pressure'&&x.local),'Local pressure missing');
const hook=signals.find(x=>x.id==='hook:intel_local');
assert(hook?.actionable&&hook.hookId==='intel_local','Actionable world hook missing');
assert(hook.priority>=60,'High urgency local opportunity not prioritized');
assert(signals.find(x=>x.title==='Rumeur incertaine').confidence===40,'Unverified rumor confidence modified');
assert(signals.find(x=>x.title==='Rumeur confirmée').confidence===100,'Confirmed rumor not identified');
eq(m.visible(signals,{},'local').length,4,'Local filter');
let state=m.normalizeState({});
let r=m.follow(state,hook.id,120);assert(r.following&&r.changed,'Tracking failed');state=r.state;
r=m.follow(state,hook.id,121);assert(!r.following&&!r.state.tracked.length,'Untracking failed');
state=m.follow(r.state,hook.id,122).state;
state=m.markRead(state,[hook.id]);
eq(m.overview(signals,state,p.region).unread,signals.length-1,'Unread count');
assert(!m.visible(signals,state,'unread').some(x=>x.id===hook.id),'Unread filter ignores read status');
const overflow=m.normalizeState({tracked:Array(100).fill('same').concat(Array.from({length:100},(_,i)=>'entry'+i)),read:Array.from({length:140},(_,i)=>'entry'+i),history:Array.from({length:60},()=>({id:'test',action:'follow',month:10}))});
assert(overflow.tracked.length<=24&&overflow.read.length<=90&&overflow.history.length<=35,'Bounded persistence broken');
const many=Array.from({length:90},(_,i)=>({id:'item'+i,status:'open',expiresAt:150,region:'East Blue',title:'Signal '+i,urgency:50}));
assert(m.collect({...world,worldHooks:many},p,120).length<=45,'Signal cap broken');
assert(source.includes('<title>ONE PIECE LIFE — V9.4</title>'),'Page title not V9.4');
assert(/const GAME_VERSION\s*=\s*'9\.4\.0';/.test(source),'Game version missing');
assert(/const SAVE_VERSION\s*=\s*940;/.test(source),'Save version missing');
for(const file of ['src/data/world-intel-v94.js','src/v94/world-intel-engine-v94.js','src/v94/world-intel-v94.css'])assert(source.includes(file)&&sw.includes(file),'Missing live and offline asset '+file);
assert(sw.includes('one-piece-life-v9-4-0'),'Offline cache version missing');
for(const frag of ['function v94Ensure','function v94Signals','function v94Action','function v94RenderLife','function v94RenderIntel','id="v94LifeCard"','id="v94IntelCard"','v93Ensure();v94Ensure();','renderV88Market();v94RenderIntel();','v94RenderLife();v80RenderActiveTab','v59OpenHook(signal.hookId)'])assert(source.includes(frag),'World Intelligence integration missing: '+frag);
assert(css.includes('.v94-signal')&&css.includes('.v94-life'),'Missing styling');
console.log('V9.4 WORLD INTELLIGENCE QA OK',JSON.stringify({signals:signals.length,local:m.visible(signals,state,'local').length,tracked:state.tracked.length,unread:m.overview(signals,state,p.region).unread}));
