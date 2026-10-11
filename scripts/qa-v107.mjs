import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const w={console,Math,JSON,Object,Array,String,Number,Map,Set};w.window=w;vm.createContext(w);
for(const file of ['src/core/module-registry.js','src/data/encounters-v107.js','src/v107/encounter-engine-v107.js'])
 vm.runInContext(fs.readFileSync(file,'utf8'),w,{filename:file});
const m=w.OPL_MODULES.get('encounterEngineV107'),d=w.OPL_MODULES.get('encounterDataV107');
assert.equal(m.version,'10.7.0');assert.equal(d.stages.length,3);
const ctx={year:23,age:23,island:'Loguetown',region:'East Blue',alive:true,pending:false,travel:false,playerFaction:'Pirates',
 danger:42,worldRep:24,preparation:50,approach:'balanced',crew:45,priceIndex:1,
 skills:{Navigation:35,Commandement:43,Discrétion:32,Combat:40,Médecine:31},
 actors:[{id:'canon-1',name:'Vice-amiral local',faction:'Marine',canon:true},{id:'group-1',name:'Patrouille locale',faction:'Marine',canon:false}]};
assert(!m.begin({active:{id:'stale',stage:0,faction:'Pirates'}},{...ctx,pending:true}).ok);
assert(!m.begin({}, {...ctx,age:11}).ok);
const selected=m.pickEncounter(ctx,{faction:.22,actor:0});
if(selected.faction==='Marine')assert.equal(selected.actor,'Vice-amiral local');
let begin=m.begin({},ctx,{faction:.22,actor:0});assert(begin.ok);
let s=begin.state;assert.equal(m.decision(s,ctx).choices.length,5);
assert(!m.begin(s,ctx).ok);assert(!m.resolve(s,'fake',ctx,{outcome:0}).ok);
const baseline=m.choiceOdds(s.active,'observe',ctx).chance;
assert(m.choiceOdds(s.active,'observe',{...ctx,skills:{...ctx.skills,Navigation:85}}).chance>baseline);
assert(m.choiceOdds(s.active,'observe',{...ctx,danger:95}).chance<baseline);
for(const action of ['observe','help','share']){
 assert(m.decision(s,ctx).choices.some(x=>x.action.endsWith(':'+action)));
 const result=m.resolve(s,action,ctx,{outcome:0,injury:1});assert(result.ok);s=result.state;
 if(action==='share')assert(result.finished&&result.summary.outcome==='success'&&s.total===1&&s.won===1&&s.contacts.length===1);
 else assert(!result.finished&&s.active);
}
assert(m.normalize(JSON.parse(JSON.stringify(s))).total===1);
const re=m.begin(s,ctx,{faction:.1}),stop=m.resolve(re.state,'withdraw',ctx,{outcome:0});
assert(stop.finished&&stop.summary.berry===0&&stop.summary.outcome==='withdraw'&&stop.state.total===2);
let bad=m.begin(stop.state,ctx,{faction:.6}).state;
for(const id of ['attack','fight','secure']){const out=m.resolve(bad,id,ctx,{outcome:1,injury:0});assert(out.ok);bad=out.state;if(out.finished)assert(out.summary.outcome==='failure'&&out.summary.berry===0);}
const dirty=m.normalize({history:Array(99).fill({id:'x',berry:1e20}),contacts:Array(80).fill({key:'x',rivalry:-5}),active:{stage:100,faction:'Invalid'}});
assert(dirty.history.length===30&&dirty.contacts.length===24);
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(html.includes("const GAME_VERSION = '11.0.0'")&&html.includes('function v107Resolve(parts,overrides={})'));
assert(html.includes("if(parts[0]==='v107exp'){v107Resolve(parts);return}"));
assert(html.includes("if(id==='expedition_scout'&&v107Module())"));
assert(sw.includes('one-piece-life-v11-0-0')&&sw.includes('src/v107/encounter-engine-v107.js'));
assert(manifest.description.includes('V11.0'));
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
console.log('V10.7 ENCOUNTERS QA OK',JSON.stringify({stages:3,completed:stop.state.total,retreat:stop.summary.outcome}));