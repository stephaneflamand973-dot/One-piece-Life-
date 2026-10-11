import fs from 'node:fs';
import vm from 'node:vm';
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const files=['src/core/module-registry.js','src/data/action-hub-v95.js','src/v95/action-hub-engine-v95.js','src/v95/action-hub-runtime-v95.js'];
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('src/v95/action-hub-v95.css','utf8');
const elMap=new Map(),makeEl=()=>{const classes=new Set();return {value:'',innerHTML:'',textContent:'',dataset:{},
  classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},toggle(x,on){if(on)classes.add(x);else classes.delete(x)}},
  setAttribute(){},querySelectorAll(){return[]}
}};
const document={querySelector(s){if(!elMap.has(s))elMap.set(s,makeEl());return elMap.get(s)},
 getElementById(id){return this.querySelector('#'+id)}};
const win={document};
win.window=win;
const ctx={window:win,document,console,Math,JSON,Object,Array,String,Number,Map,Set};
vm.createContext(ctx);
for(const path of files)vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
const r=win.OPL_MODULES, data=r.get('actionHubDataV95'),model=r.get('actionHubEngineV95'),api=r.get('actionHubRuntimeV95');
assert(data&&model&&api,'V9.5 modules missing');
assert(data.version==='9.5.0'&&model.version==='9.5.0'&&api.version==='9.5.0','V9.5 module versions');
assert(data.categories.length===8,'Action categories incomplete');
assert(model.normalizeSearch('ÉQUIPAGE')==='equipage','Accent-insensitive search broken');
assert(model.normalizeState({category:'nonexistent'}).category==='all','Invalid old-save category should migrate');
let state=model.normalizeState({favorites:['a','a','b'],recent:['a','a']});
assert(state.favorites.length===2&&state.recent.length===1,'Save deduplication missing');
let toggle=model.toggleFavorite(state,'a');
assert(toggle.changed&&!toggle.starred&&toggle.state.favorites.length===1,'Remove favorite failed');
toggle=model.toggleFavorite(toggle.state,'c');
assert(toggle.starred&&toggle.state.favorites.includes('c'),'Add favorite failed');
assert(!model.toggleFavorite({favorites:Array.from({length:10},(_,i)=>'key'+i)},'new').changed,'Favorite limit exceeded');
state=model.recordAction(model.recordAction({},'x'),'x');
assert(state.totalActions===2&&state.recent.length===1,'Recent action tracking broken');
const cases=[{id:'a',category:'career',title:'Promotion',detail:'carrière',available:true,score:32},
 {id:'b',category:'relations',title:'Équipage',detail:'relation',available:true,score:45},
 {id:'c',category:'career',title:'Ancienne mission',available:false,score:60,reason:'Interdite'}];
assert(model.select(cases,{},'Equipage').length===1,'Search not accent insensitive');
assert(model.select(cases,{category:'career'}).length===2,'Category filtering broken');
assert(model.select(cases,{category:'favorites',favorites:['a']}).length===1,'Favorites filtering broken');
assert(model.select(cases,{category:'all'})[2].id==='c','Locked action should sort after available actions');
const game={meta:{},ageMonths:240,alive:true,pendingDecision:null,agency:{annualTurn:null},player:{
  region:'East Blue',island:'Shells Town',travel:null,health:90,energy:75},
  missionBoard:[{id:'mission_one',title:'Escorte',desc:'Convoi',reward:400}],
  relations:[{id:'friend',name:'Mira',status:'active',trust:75,familiarity:75}],
  flags:{relationInteractionYear:{}},activeMission:null
};
let saves=0,last=null,view='';
const runtime=api.createRuntime({
 getGame:()=>game,
 presets:()=>({balanced:{label:'Équilibré',desc:'Stable'},recovery:{label:'Repos',desc:'Soin'}}),
 recommendedPreset:()=> 'balanced',
 planGroups:()=>({career:{label:'Carrière',options:{steady:{label:'Normal',desc:'Régulier'}}},
  training:{label:'Entraînement',options:{hard:{label:'Intensif',desc:'Pratique'}}}}),
 plan:()=>({career:'steady',training:'hard'}),
 doctrines:()=>({balanced:{label:'Équilibrée'},precision:{label:'Précision'}}),
 routes:()=>[{dest:'Loguetown',ok:true,req:{label:'Libre'},duration:2,riskPct:13}],
 hooks:()=>[{id:'hook:x',actionable:true,hookId:'x',title:'Départ immédiat',region:'East Blue',priority:90,remaining:3}],
 services:()=>[{id:'inn',label:'Auberge',used:false}],
 toast:()=>{},save:()=>{saves++},openTab:tab=>{view=tab},
 execute:id=>{last=id;return true}
});
const actions=runtime.build();
for(const cat of ['career','training','relations','exploration','economy','life'])
  assert(actions.some(x=>x.category===cat),'Missing category '+cat);
for(const id of ['advance','mission:mission_one','doctrine:precision','relation:friend:time','travel:Loguetown','hook:x','service:inn'])
  assert(actions.some(x=>x.id===id&&x.available),'Dynamic direct action missing '+id);
assert(runtime.execute('mission:mission_one')&&last==='mission:mission_one','Direct execution bridge failed');
assert(runtime.ensure().recent.includes('mission:mission_one')&&saves>0,'Executed actions not persisted');
runtime.star('mission:mission_one');assert(runtime.ensure().favorites.includes('mission:mission_one'),'Persistent favorites missing');
runtime.renderHub();runtime.renderLife();
assert(document.getElementById('v95Hub').innerHTML.includes('Que veux-tu faire ?'),'Action hub UI not rendered');
assert(document.getElementById('v95HubResults').innerHTML.includes('mission_one')===false,'UI leaked internal IDs');
assert(document.getElementById('v95LifeQuick').innerHTML.includes('Toutes les actions'),'Life shortcut missing');
game.agency.annualTurn={active:true,monthsSimulated:4};
const during=runtime.build();
assert(during.some(x=>x.id==='advance'&&x.available),'Advance should remain active mid-year');
assert(during.some(x=>x.id==='mission:mission_one'&&!x.available),'Direct mission must lock mid-year');
game.agency.annualTurn=null;game.pendingDecision={title:'Décision prioritaire'};
const waiting=runtime.build();
assert(waiting.some(x=>x.id==='decision'&&x.available),'Pending decision must be actionable');
assert(waiting.some(x=>x.id==='doctrine:precision'&&!x.available),'Combat choices must lock on pending decision');
assert(!runtime.execute('mission:mission_one')&&last==='mission:mission_one','Locked action should not execute');

for(const file of ['src/data/action-hub-v95.js','src/v95/action-hub-engine-v95.js','src/v95/action-hub-runtime-v95.js','src/v95/action-hub-v95.css']){
 assert(html.includes(file),'Missing page asset '+file);
 assert(sw.includes(file),'Missing offline asset '+file);
}
assert(html.includes('<title>ONE PIECE LIFE — V9.5</title>'),'Wrong game title');
assert(/const GAME_VERSION\s*=\s*'9\.5\.0';/.test(html),'Wrong game version');
assert(/const SAVE_VERSION\s*=\s*950;/.test(html),'Save migration 950 missing');
assert(sw.includes('one-piece-life-v9-5-0'),'PWA cache not V9.5');
assert((html.match(/class="nav-item/g)||[]).length===5,'Mobile navigation not limited to five');
assert(html.includes('data-tab="actions"')&&html.includes('id="actionsPanel"'),'Action tab not wired');
assert(html.includes('v95Ensure()?.renderHub()')&&html.includes('v95Ensure()?.renderLife()'),'Action Hub hooks not wired');
assert(html.includes("v76OpenTab('abilities',true)"),'Abilities legacy route not accessible');
assert(css.includes('.v95-category')&&css.includes('.v95-search')&&css.includes('.v95-life-quick'),'Missing mobile Action Hub CSS');
console.log('V9.5 ACTION HUB & UX 6.0 QA OK',JSON.stringify({actions:actions.length,visibleCategories:data.categories.length,saves,latest:last}));
