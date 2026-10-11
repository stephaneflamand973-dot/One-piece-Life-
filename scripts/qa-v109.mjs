import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const w={console,Math,JSON,Object,Array,String,Number,Map,Set};w.window=w;vm.createContext(w);
for(const file of ['src/core/module-registry.js','src/data/action-v102.js','src/v102/action-engine-v102.js','src/data/contracts-v109.js','src/v109/contract-engine-v109.js'])
 vm.runInContext(fs.readFileSync(file,'utf8'),w,{filename:file});
const m=w.OPL_MODULES.get('contractEngineV109'),data=w.OPL_MODULES.get('contractDataV109'),
 actions=w.OPL_MODULES.get('actionDataV102'),quota=w.OPL_MODULES.get('actionEngineV102');
assert.equal(m.version,'10.9.0');assert.equal(Object.keys(data.kinds).length,3);
assert.equal(Object.keys(actions.actions).length,17);
assert.equal(actions.actions.contact_contract.limit,2);
const ctx={year:24,age:24,alive:true,pending:false,travel:false,energy:100,money:10000,
 region:'Grand Line',island:'Water 7',danger:37,power:57,crewSupport:45,
 skills:{Commandement:57,Combat:40},trust:75,rivalry:6,efficiency:1};
function story(id,trust=75,rivalry=6,outcome='success'){
 return {id,actor:'Nami '+id,faction:'Civil',island:'Water 7',year:24,
 outcome,choices:['observe','help','share'],contact:{key:'Civil|Nami '+id,trust,rivalry}};
}
let initial=m.normalize({});let created=m.createOffer(initial,story('a'),ctx);assert(created.offer&&created.offer.kind==='alliance');
assert.equal(initial.offers.length,0,'Contract engine mutates input');
let state=created.state;assert(!m.createOffer(state,story('a'),ctx).offer,'Duplicate offer from same encounter');
const selected=m.select(state,created.offer.id,ctx);assert(selected.ok);
state=selected.state;
assert(!m.select(state,created.offer.id,{...ctx,region:'East Blue'}).ok,'Wrong region contract selection allowed');
assert(!m.status(state,{...ctx,money:1}).available,'Money check absent');
assert(!m.status(state,{...ctx,energy:0}).available,'Stamina gate absent');
assert(!m.status(state,{...ctx,pending:true}).available,'Pending event gate absent');
assert(!m.status(state,{...ctx,travel:true}).available,'Travel gate absent');
assert(!m.status(state,{...ctx,age:11}).available,'Child access gate absent');
const chance=m.odds(created.offer,ctx);assert(chance.chance>=.12&&chance.chance<=.94);
assert(m.odds(created.offer,{...ctx,skills:{Commandement:95}}).chance>chance.chance,'Skill influence absent');
assert(m.odds(created.offer,{...ctx,power:130}).chance>chance.chance,'Power influence absent');
const success=m.perform(state,ctx,{success:0,injury:1});assert(success.ok&&success.success&&success.net>0);
assert(success.state.total===1&&success.state.wins===1,'Success not recorded');
assert(!m.status(success.state,ctx).available,'Resolved contract remains selectable');
assert(!m.perform(success.state,ctx,{success:0}).ok,'Duplicating reward by replay');
const diplomacy=m.createOffer(success.state,story('b',40,7,'withdraw'),ctx);assert(diplomacy.offer.kind==='diplomacy');
const challenge=m.createOffer(diplomacy.state,story('c',15,65,'failure'),ctx);assert(challenge.offer.kind==='challenge');
const selectedChallenge=m.select(challenge.state,challenge.offer.id,ctx);
assert(selectedChallenge.ok);
const loss=m.perform(selectedChallenge.state,{...ctx,money:2000,energy:100,trust:15,rivalry:65},{success:1,injury:0});
assert(loss.ok&&!loss.success&&loss.earned===0&&loss.net<0,'Failure yielded guaranteed money');
assert(loss.healthLoss>=1,'Rival defeat has no injury risk');
const repeat=m.perform(m.select(diplomacy.state,diplomacy.offer.id,ctx).state,{...ctx,efficiency:.8},{success:0,injury:1});
assert(repeat.ok&&repeat.earned<diplomacy.offer.reward,'Second action should have diminishing reward');
let filled=loss.state;
for(let i=0;i<15;i++)filled=m.createOffer(filled,story('new_'+i),ctx).state;
assert(filled.offers.filter(x=>x.status==='available').length<=6,'Unbounded pending contract queue');
assert(m.normalize({offers:Array(100).fill({id:'x',reward:1e9}),history:Array(100).fill({berry:1e12}),
 total:Infinity,net:1e30}).offers.length<=18,'Save bounds fail for offers');
assert(m.normalize({history:Array(100).fill({berry:1e12}),net:1e30}).history.length===28,'Save bounds fail for history');
assert.equal(m.normalize(JSON.parse(JSON.stringify(success.state))).total,1,'Save round trip corrupts contracts');
assert.equal(m.normalize(success.state).net,success.state.net,'Normalizing old state grants money');
let ledger=quota.normalize({},24);
for(let i=0;i<2;i++){
 const out=quota.perform(ledger,'contact_contract',24,{alive:true,pending:false,land:true,energy:100},()=>({detail:'contact contract'}));
 assert(out.changed,'Contract quota spent too early');ledger=out.state;
}
assert(!quota.status(ledger,'contact_contract',24,{alive:true,pending:false,land:true,energy:100}).available,'Third contract action accepted');
const renewal=quota.nextYear(ledger,25);assert(renewal.spent.contact_contract===0&&renewal.total===ledger.total,'Year renewal gained actions or money');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(html.includes("const GAME_VERSION = '11.0.1'")&&html.includes('function v109RenderContracts()'),'Missing V10.9 UI');
assert(html.includes("if(id==='contact_contract')")&&html.includes('createOffer(v109Ensure(),sum'),'Manual resolution or generation missing');
assert(html.includes('v109RenderContracts();')&&html.includes('id="v109ContractCard"'),'World section not connected');
assert(sw.includes('one-piece-life-v11-0-1')&&sw.includes('src/v109/contract-engine-v109.js'),'Offline assets stale');
assert(manifest.description.includes('V11.0.1'),'Manifest stale');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
console.log('V10.9 NPC CONTRACT QA OK',JSON.stringify({types:Object.keys(data.kinds).length,net:success.net,failed:loss.healthLoss,annualLimit:2}));
