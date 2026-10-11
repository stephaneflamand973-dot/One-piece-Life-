import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,Math,JSON,Object,Array,String,Number,Map,Set};context.window=context;vm.createContext(context);
for(const path of ['src/core/module-registry.js','src/data/social-v104.js','src/v104/social-engine-v104.js'])
  vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});
const data=context.OPL_MODULES.get('socialDataV104'),engine=context.OPL_MODULES.get('socialEngineV104');
assert(data.version==='10.4.0'&&engine.version==='10.4.0','V10.5 modules missing');
assert(Object.keys(data.actions).length===9,'Expected nine social actions');
const alice={id:'alice',name:'Alice',adult:true,trust:72,affection:74,familiarity:65,respect:60,loyalty:48,rivalry:16,status:'active'};
const kid={...alice,id:'kid',adult:false};
const ctx={year:23,age:23,energy:100,money:10000,alive:true,pending:false,annual:false,compatibility:75,roll:0,partnerId:null,partnership:'single'};
let state=engine.normalize({},23);
assert(state.used===0&&state.lifetime===0,'New social state should be empty');
assert(engine.status(state,alice,'time',ctx).available,'Normal social action incorrectly blocked');
assert(!engine.status(state,alice,'date',{...ctx,age:15}).available,'Romance must require an adult player');
assert(!engine.status(state,kid,'date',ctx).available,'Romance must require an adult NPC');
assert(!engine.status(state,alice,'time',{...ctx,energy:0}).available,'Social energy cost not enforced');
assert(!engine.status(state,alice,'help',{...ctx,money:100}).available,'Social Berry cost not enforced');
assert(!engine.status(state,alice,'time',{...ctx,pending:true}).available,'Pending decision ignored');
assert(!engine.status(state,alice,'time',{...ctx,annual:true}).available,'Annual transition ignored');
assert(!engine.status(state,alice,'flirt',{...ctx,partnerId:'someone_else'}).available,'Flirting while committed elsewhere allowed');
assert(!engine.status(state,alice,'commit',ctx).available,'Commitment without dating allowed');
assert(!engine.status(state,alice,'foobar',ctx).available,'Unknown social action accepted');
const copy=JSON.stringify(state);
const first=engine.resolve(state,alice,'time',ctx);
assert(first.ok&&first.accepted&&first.energy===4&&first.state.used===1&&first.state.counts.alice===1,'First social action was not recorded');
assert(JSON.stringify(state)===copy,'Social resolver mutated original state');
assert(first.delta.affection>0&&first.state.history.length===1,'Social effects and memory missing');
state=first.state;
const second=engine.resolve(state,alice,'help',ctx);
assert(second.ok&&second.state.counts.alice===2&&second.money===1500&&second.efficiency===.82,'Second encounter efficiency wrong');
state=second.state;
const third=engine.resolve(state,alice,'confide',ctx);
assert(third.ok&&third.state.counts.alice===3&&third.efficiency===.65,'Third encounter efficiency wrong');
state=third.state;
const exhausted=engine.resolve(state,alice,'time',ctx);
assert(!exhausted.ok&&exhausted.state.used===3,'Four interactions with the same person permitted');
const nextYear=engine.normalize(state,24);
assert(nextYear.used===0&&nextYear.counts.alice===undefined&&nextYear.lifetime===3,'Aging did not renew social actions while retaining lifetime memories');
const date=engine.resolve(nextYear,alice,'date',ctx.year===24?ctx:{...ctx,year:24});
assert(date.ok&&date.accepted&&date.partnership==='dating','Mutual dating response missing');
const declining=engine.resolve(nextYear,alice,'date',{...ctx,year:24,roll:.99});
assert(declining.ok&&!declining.accepted&&declining.partnership===null&&declining.state.used===1,'Refused date should be a remembered attempt');
const commitment=engine.resolve(nextYear,alice,'commit',{...ctx,year:24,partnerId:'alice',partnership:'dating'});
assert(commitment.ok&&commitment.accepted&&commitment.partnership==='committed','Mutual household decision missing');
const disallowed=engine.resolve(nextYear,alice,'commit',{...ctx,year:24,partnerId:'other',partnership:'dating'});
assert(!disallowed.ok,'Commitment possible with wrong partner');
let global=engine.normalize({},25);
for(let i=0;i<4;i++){
 const npc={...alice,id:'rel'+i};
 for(let j=0;j<3;j++){
  const out=engine.resolve(global,npc,'time',{...ctx,year:25});
  assert(out.ok,'Social global capacity blocked early');global=out.state
 }
}
assert(global.used===12&&!engine.status(global,{...alice,id:'extra'},'time',{...ctx,year:25}).available,'Global annual social cap bypassed');
const malformed=engine.normalize({year:25,used:9999,counts:{alice:9999},lifetime:-1,history:Array(200).fill({year:90000,id:'x'.repeat(200),action:'t'.repeat(40),label:'z'.repeat(300)})},25);
assert(malformed.used===12&&malformed.counts.alice===3&&malformed.lifetime===0&&malformed.history.length===40,'Malformed social save not clamped');
assert(malformed.history.every(x=>x.id.length<=100&&x.label.length<=110),'History record too large');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8'),manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(html.includes("const GAME_VERSION = '10.5.0'")&&html.includes('social-engine-v104.js'),'V10.5 game release not linked');
assert(html.includes('function v104Perform(id,action)')&&html.includes('function v104RenderOverview()'),'Social game integration missing');
assert(sw.includes('one-piece-life-v10-5-0')&&sw.includes('social-engine-v104.js'),'V10.5 assets unavailable offline');
assert(manifest.description.includes('V10.5'),'V10.5 PWA metadata absent');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
console.log('V10.5 SOCIAL ENGINE QA OK',JSON.stringify({actions:Object.keys(data.actions).length,globalLimit:data.limits.global,perPerson:data.limits.perRelation}));
