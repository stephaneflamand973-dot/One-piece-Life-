import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const g={console,Math,JSON,Object,Array,String,Number,Map,Set};g.window=g;vm.createContext(g);
for(const path of ['src/core/module-registry.js','src/data/action-v102.js','src/v102/action-engine-v102.js',
  'src/data/sagas-v110.js','src/v110/saga-engine-v110.js'])
  vm.runInContext(fs.readFileSync(path,'utf8'),g,{filename:path});
const engine=g.OPL_MODULES.get('sagaEngineV110'),defs=g.OPL_MODULES.get('sagaDataV110');
const acts=g.OPL_MODULES.get('actionDataV102'),quota=g.OPL_MODULES.get('actionEngineV102');
assert.equal(engine.version,'11.0.0');assert.equal(Object.keys(defs.themes).length,3);
assert.equal(Object.keys(acts.actions).length,17);
assert.equal(acts.actions.saga_chapter.limit,3);
const ctx={year:24,age:24,region:'East Blue',island:'Loguetown',alive:true,pending:false,travel:false,
 energy:100,skills:{Commandement:80,Discrétion:55,Combat:45},crew:45,trust:77,rivalry:12};
function contract(id,kind='alliance'){return {id:'contract_'+id,contactKey:'Pirates|Contact '+id,contact:'Contact '+id,
 faction:'Pirates',region:'East Blue',kind,difficulty:36}}
let created=engine.create({},contract('a'),{year:24,success:true});
assert(created.saga&&created.saga.kind==='alliance'&&created.saga.chapter===0);
assert(!engine.create(created.state,contract('a'),{year:24,success:true}).saga,'Duplicate saga generated');
let selected=engine.select(created.state,created.saga.id,ctx);assert(selected.ok);
assert(!engine.select(selected.state,created.saga.id,{...ctx,region:'Grand Line'}).ok,'Saga selectable from another sea');
let state=selected.state;
assert(!engine.status(state,{...ctx,energy:2}).available,'Energy gate failed');
assert(!engine.status(state,{...ctx,pending:true}).available,'Modal gate failed');
assert(!engine.status(state,{...ctx,travel:true}).available,'Travel gate failed');
assert(!engine.status(state,{...ctx,age:11}).available,'Age gate failed');
assert(engine.status(state,ctx).available);
const start=engine.begin(state,ctx);assert(start.ok&&start.state.pending&&start.decision.choices.length===4);
assert(!engine.begin(start.state,ctx).ok,'Duplicate chapter allowed');
assert(start.decision.choices.some(x=>x.action.endsWith(':withdraw')),'Player cannot retreat');
const persisted=engine.normalize(JSON.parse(JSON.stringify(start.state)));
assert.deepEqual(engine.decision(persisted,ctx).choices.map(x=>x.label),start.decision.choices.map(x=>x.label));
assert(!engine.resolve(persisted,'fake',ctx,{success:0}).ok,'Invalid choice accepted');
assert(!engine.resolve(persisted,'negotiate',{...ctx,year:25},{success:0}).ok,'Wrong year decision accepted');
const retreat=engine.resolve(persisted,'withdraw',ctx,{success:0});
assert(retreat.ok&&retreat.withdraw&&retreat.saga.chapter===0&&retreat.reward===0&&retreat.state.pending===null);
assert(retreat.state.history.length===1&&retreat.state.totalReward===0);
assert(engine.odds(retreat.saga,'negotiate',{...ctx,skills:{Commandement:95}}).chance>
 engine.odds(retreat.saga,'negotiate',{...ctx,skills:{Commandement:15}}).chance,'Commandement not relevant');
assert(engine.odds(retreat.saga,'negotiate',{...ctx,trust:95}).chance>
 engine.odds(retreat.saga,'negotiate',{...ctx,trust:10}).chance,'Contact trust not relevant');
state=retreat.state;
let sum=0;
for(let chapter=0;chapter<3;chapter++){
 const opening=engine.begin(state,ctx);assert(opening.ok);
 assert(opening.decision.title.includes('Chapitre '+(chapter+1)+'/3'),'Wrong chapter text');
 const out=engine.resolve(opening.state,'negotiate',ctx,{success:0,injury:1});
 assert(out.ok&&out.success,'Certain successful tactical choice failed');
 assert(out.saga.chapter===chapter+1,'Chapter did not advance');
 if(chapter<2)assert(!out.complete&&out.reward===0,'Money paid before final resolution');
 else assert(out.complete&&out.reward===created.saga.reward,'Final saga reward absent or wrong');
 sum+=out.reward;state=out.state
}
assert(state.completed===1&&state.totalReward===sum&&state.campaigns[0].status==='complete');
assert(!engine.begin(state,ctx).ok,'Finished campaign is replayable');
assert(!engine.select(state,created.saga.id,ctx).ok,'Finished saga selectable');
let rivalry=engine.create(state,contract('b','challenge'),{year:24,success:false});assert(rivalry.saga.kind==='rivalry');
let intrigue=engine.create(rivalry.state,contract('c','diplomacy'),{year:24,success:true});assert(intrigue.saga.kind==='intrigue');
assert(!engine.create(intrigue.state,contract('d'),{year:24}).saga,'Active campaign limit not enforced');
state=engine.select(intrigue.state,rivalry.saga.id,ctx).state;
for(let i=0;i<5;i++){
 const begin=engine.begin(state,ctx);assert(begin.ok);
 const fail=engine.resolve(begin.state,'confront',ctx,{success:1,injury:0});
 assert(fail.ok&&!fail.success&&fail.reward===0,'Failed choice grants campaign reward');
 assert(fail.healthLoss>=1,'Risky failure lacks health penalty');
 state=fail.state;
 if(i===4)assert(fail.failed&&fail.saga.status==='failed','Five failures should terminate the saga');
 else assert(!fail.failed&&fail.saga.chapter===0)
}
assert(state.lost===1&&state.totalReward===sum,'Failure granted more money');
assert(!engine.select(state,rivalry.saga.id,ctx).ok,'Failed saga cannot be restarted');
const dirty=engine.normalize({campaigns:Array(30).fill({id:'a',kind:'arbitrary',chapter:100,status:'active'}),
 history:Array(55).fill({chapter:99,reward:1e12}),pending:{id:'missing',chapter:0,year:1},totalReward:1e20});
assert(dirty.campaigns.length===16&&dirty.history.length===30&&dirty.pending===null);
assert(dirty.campaigns.every(x=>x.chapter<=3)&&dirty.history.every(x=>x.reward<=30000));
let ledger=quota.normalize({},24);
for(let i=0;i<3;i++){
 const performed=quota.perform(ledger,'saga_chapter',24,
  {alive:true,pending:false,land:true,energy:100},()=>({detail:'Choix de chapitre'}));
 assert(performed.changed,'Annual saga quota exhausted prematurely');ledger=performed.state
}
assert(!quota.status(ledger,'saga_chapter',24,{alive:true,pending:false,land:true,energy:100}).available);
const next=quota.nextYear(ledger,25);assert(next.spent.saga_chapter===0,'Next year did not renew chapters');
assert(next.total===ledger.total,'Annual transition granted extra completed actions');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(html.includes("const GAME_VERSION = '11.0.0'"),'Game version missing');
assert(html.includes('function v110ResolveChoice(parts)')&&html.includes("if(id==='saga_chapter')"),'V11 actual game route missing');
assert(html.includes('v110RenderSagas();')&&html.includes('id="v110SagaCard"'),'Saga screen missing');
assert(html.includes("if(parts[0]==='v110saga'){v110ResolveChoice(parts);return}"),'Saga modal handler missing');
assert(sw.includes('one-piece-life-v11-0-0')&&sw.includes('src/v110/saga-engine-v110.js'),'PWA cache incomplete');
assert(manifest.description.includes('V11.0'),'Manifest stale');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
console.log('V11.0 PERSONAL SAGAS QA OK',JSON.stringify({chapters:3,totalReward:sum,failed:state.lost,annualActions:3}));
