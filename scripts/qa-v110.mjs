import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const w={console,Math,JSON,Object,Array,String,Number,Map,Set};w.window=w;vm.createContext(w);
for(const path of ['src/core/module-registry.js','src/data/action-v102.js','src/v102/action-engine-v102.js','src/data/sagas-v110.js','src/v110/saga-engine-v110.js'])vm.runInContext(fs.readFileSync(path,'utf8'),w,{filename:path});
const m=w.OPL_MODULES.get('sagaEngineV110'),d=w.OPL_MODULES.get('sagaDataV110'),
 actions=w.OPL_MODULES.get('actionDataV102'),quota=w.OPL_MODULES.get('actionEngineV102');
assert.equal(m.version,'11.0.0');assert.equal(Object.keys(d.themes).length,3);
assert.equal(Object.keys(actions.actions).length,17);assert.equal(actions.actions.saga_chapter.limit,3);
const ctx={region:'East Blue',island:'Loguetown',year:24,age:24,alive:true,pending:false,travel:false,energy:80,
 skills:{Commandement:60,Discrétion:58,Combat:50},power:65,crew:40,trust:80,rivalry:15};
const contract=(id,kind='alliance')=>({id,contactKey:'Marine|Smoker',contact:'Smoker',faction:'Marine',
 region:'East Blue',kind,difficulty:45});
let gen=m.create({},contract('contract_01'),ctx);
assert(gen.saga?.kind==='alliance'&&gen.saga.chapter===0);
assert(!m.create(gen.state,contract('contract_01'),ctx).saga,'Duplicate saga');
assert(!m.select(gen.state,gen.saga.id,{...ctx,region:'North Blue'}).ok,'Wrong region allowed');
const chosen=m.select(gen.state,gen.saga.id,ctx);assert(chosen.ok);
assert(!m.status(chosen.state,{...ctx,energy:1}).available,'Energy requirement ignored');
assert(!m.status(chosen.state,{...ctx,age:11}).available,'Age gate ignored');
assert(!m.status(chosen.state,{...ctx,travel:true}).available,'Travel gate ignored');
let begin=m.begin(chosen.state,ctx);assert(begin.ok&&begin.decision.choices.length===4,'Missing narrative decision');
assert(!m.begin(begin.state,ctx).ok,'Double chapter start');
assert(!m.select(begin.state,gen.saga.id,ctx).ok,'Selection while decision pending');
assert(m.decision(begin.state,ctx).title.includes('1/3'));
assert(m.odds(gen.saga,'negotiate',{...ctx,trust:95}).chance>m.odds(gen.saga,'negotiate',{...ctx,trust:5}).chance,'Trust not dynamic');
assert(m.odds(gen.saga,'negotiate',{...ctx,skills:{...ctx.skills,Commandement:95}}).chance>m.odds(gen.saga,'negotiate',{...ctx,skills:{...ctx.skills,Commandement:5}}).chance,'Skills not dynamic');
assert(m.odds(gen.saga,'confront',ctx).injuryChance>m.odds(gen.saga,'negotiate',ctx).injuryChance);
const retreat=m.resolve(begin.state,'withdraw',ctx,{success:0,injury:0});
assert(retreat.ok&&retreat.withdraw&&retreat.saga.chapter===0&&retreat.reward===0,'Retreat progressed');
let current=retreat.state;
for(let chapter=0;chapter<3;chapter++){
 begin=m.begin(current,ctx);assert(begin.ok);
 const result=m.resolve(begin.state,'negotiate',ctx,{success:0,injury:1});
 assert(result.ok&&result.success&&result.saga.chapter===chapter+1,'Chapter did not progress');
 if(chapter<2)assert(!result.complete&&result.reward===0,'Premature reward');
 if(chapter===2)assert(result.complete&&result.reward>0&&result.state.completed===1,'Final reward missing');
 current=result.state;
}
assert(!m.begin(current,ctx).ok,'Completed saga replayable');
assert(current.totalReward===current.campaigns[0].reward,'Reward duplicated');
let failed=m.create({},contract('rival','challenge'),ctx).state;
failed=m.select(failed,'saga_rival',ctx).state;
for(let i=0;i<5;i++){
 begin=m.begin(failed,ctx);assert(begin.ok);
 const r=m.resolve(begin.state,'confront',ctx,{success:1,injury:0});
 assert(r.ok&&!r.success&&r.healthLoss>0&&r.reward===0,'Failure incorrectly rewarded');
 failed=r.state;
}
assert(failed.lost===1&&failed.campaigns[0].status==='failed'&&!m.begin(failed,ctx).ok,'Saga cannot fail definitively');
let capacity=m.create({},contract('a'),ctx).state;
capacity=m.create(capacity,contract('b'),ctx).state;capacity=m.create(capacity,contract('c'),ctx).state;
assert(!m.create(capacity,contract('d'),ctx).saga,'No active saga limit');
const serialized=m.normalize(JSON.parse(JSON.stringify(current)));
assert(serialized.completed===1&&serialized.totalReward===current.totalReward,'Save invalid');
const malformed=m.normalize({campaigns:Array(80).fill({id:'x',difficulty:999}),history:Array(90).fill({chapter:9,reward:1e9}),pending:{id:'orphan',chapter:0}});
assert(malformed.campaigns.length===16&&malformed.history.length===30&&!malformed.pending,'Save normalization invalid');
let ledger=quota.normalize({},24);
for(let i=0;i<3;i++){
 const x=quota.perform(ledger,'saga_chapter',24,{alive:true,pending:false,land:true,energy:100},()=>({detail:'Saga action'}));
 assert(x.changed);ledger=x.state;
}
assert(!quota.status(ledger,'saga_chapter',24,{alive:true,pending:false,land:true,energy:100}).available,'Extra yearly action');
const next=quota.nextYear(ledger,25);assert(next.spent.saga_chapter===0&&next.total===ledger.total,'Automatic progression on aging');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(html.includes("const GAME_VERSION = '11.0.0'")&&html.includes("if(id==='saga_chapter')"),'V11 action integration absent');
assert(html.includes("if(parts[0]==='v110saga')")&&html.includes('id="v110SagaCard"'),'V11 scene or UI absent');
assert(sw.includes('one-piece-life-v11-0-0')&&sw.includes('src/v110/saga-engine-v110.js'),'V11 cache missing');
assert(manifest.description.includes('V11.0'),'V11 manifest absent');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
console.log('V11.0 SAGA QA OK',JSON.stringify({chapters:3,won:current.completed,lost:failed.lost,reward:current.totalReward}));
