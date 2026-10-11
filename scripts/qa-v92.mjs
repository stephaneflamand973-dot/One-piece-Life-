import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('src/v92/npc-lives-v92.css','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/npc-lives-v92.js','utf8');
const engineSrc=fs.readFileSync('src/v92/npc-lives-engine-v92.js','utf8');

function assert(c,m){if(!c)throw new Error(m)}
function eq(a,b,m){if(a!==b)throw new Error(m+': '+a+' !== '+b)}
function gt(a,b,m){if(!(a>b))throw new Error(m+': '+a+' <= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'npc-lives-v92.js'});
vm.runInContext(engineSrc,sandbox,{filename:'npc-lives-engine-v92.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('npcLivesDataV92'),engine=registry.get('npcLivesEngineV92');
assert(data&&engine,'V9.2 modules not registered');
eq(data.version,'9.2.0','NPC lives data version mismatch');
eq(engine.version,'9.2.0','NPC lives engine version mismatch');
assert(Object.keys(data.objectives).length>=18,'NPC objective pool too small');
assert(Object.keys(data.careers).length>=7,'NPC career pool too small');
assert(data.regions.includes('New World'),'New World missing from autonomous travel graph');

const actor={id:'rel_mira',name:'Mira',sourceType:'relation',faction:'Marine',region:'East Blue',power:28,potentialPower:70,age:20,temperament:'Ambitieux',ambition:'Influence',status:'active',importance:45};
let state={},events=[],actions=[];
for(let month=6;month<=120;month+=6){
  const r=engine.stepRelation(state,actor,{month,months:6,playerAge:20+month/12,playerRegion:'East Blue'},{
    action:(month%30)/30,effect:.72,effect2:.63,outcome:.4,travel:.45,
    career:.99,careerTarget:.2,objective:.3,retire:.99
  });
  state=r.state;events.push(...r.events);actions.push(r.action);
}
const snap=engine.snapshot(state,actor,{playerAge:30,playerRegion:'East Blue'});
gt(snap.rankIndex,0,'Autonomous NPC career did not progress');
gt(snap.careerXP,50,'Autonomous NPC career XP too low');
gt(snap.wealth,500,'Autonomous NPC wealth did not evolve');
gt(snap.moves,0,'Autonomous NPC never travelled');
gt(snap.completedObjectives,0,'Autonomous NPC never completed an objective');
assert(actions.includes('risk')&&actions.includes('travel')&&actions.includes('network'),'Autonomous action diversity missing');
assert(events.some(e=>e.type==='promotion'),'Promotion milestone missing');
assert(events.some(e=>e.type==='move'),'Travel milestone missing');

const weak={id:'rel_weak',name:'Neris',sourceType:'relation',faction:'Civil',region:'South Blue',power:18,potentialPower:55,age:24,temperament:'Calme',ambition:'Maîtrise',status:'active',importance:30};
let weakState=engine.ensureActor({},weak,{playerAge:24,playerRegion:'South Blue'}).state;
weakState.actors.rel_weak.condition=30;
const weights=engine.actionWeights(weak,weakState.actors.rel_weak);
gt(weights.recover,weights.risk,'Injured NPC should favor recovery');

const canon={id:'shanks',name:'Shanks',sourceType:'canon',lockedCareer:true,faction:'Pirates',currentRegion:'New World',region:'New World',power:96,potentialPower:99,age:39,health:100,status:'alive',importance:99,lastAction:'Observe les mouvements du monde'};
const c0=engine.tickCanon({},canon,{month:12,months:6,playerAge:25,playerRegion:'Grand Line'},{objective:.4});
const c1=engine.tickCanon(c0.state,{...canon,currentRegion:'Grand Line',power:97},{month:18,months:6,playerAge:25,playerRegion:'Grand Line'},{objective:.6});
const cs=engine.snapshot(c1.state,canon,{playerAge:25,playerRegion:'Grand Line'});
eq(cs.faction,'Pirates','Canon faction should remain authoritative');
assert(cs.lockedCareer,'Canon careers must remain locked to World Director');
assert(c1.events.some(e=>e.type==='move'),'Canon movement should be observed as a milestone');

assert(html.includes('ONE PIECE LIFE — V9.2'),'V9.2 title missing');
assert(/const SAVE_VERSION\s*=\s*920;/.test(html),'Save version 920 missing');
assert(/const GAME_VERSION\s*=\s*'9\.2\.0';/.test(html),'Game version 9.2.0 missing');
for(const asset of ['src/data/npc-lives-v92.js','src/v92/npc-lives-engine-v92.js','src/v92/npc-lives-v92.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(sw.includes('one-piece-life-v9-2-0'),'PWA cache not V9.2');
assert(html.includes('v91Ensure();v92Ensure()'),'V9.2 migration/ensure hook missing');
for(const fn of ['function v92Module','function v92RelationActor','function v92Ensure','function v92Tick','function v92RelationSnapshot','function renderV92Lives']){
  assert(html.includes(fn),'Missing live V9.2 bridge '+fn);
}
assert(html.includes('id="v92LivesCard"'),'V9.2 Relations UI missing');
assert(html.includes('v91Sync(true);v92Tick(1);'),'V9.2 monthly autonomous tick missing');
assert(html.includes('renderV78PersonalLife();renderV92Lives();'),'V9.2 Relations render hook missing');
assert(html.includes('v92RelationSnapshot(r)'),'Relation cards do not show autonomous life state');
assert(html.includes("sourceType:'canon',lockedCareer:true"),'Canon authority boundary missing');
assert(css.includes('.v92-lives')&&css.includes('.v92-relation-meta'),'V9.2 CSS incomplete');

console.log('V9.2 NPC LIVING LIVES QA OK',JSON.stringify({
  version:'9.2.0',rank:snap.rankLabel,careerXP:+snap.careerXP.toFixed(1),wealth:Math.round(snap.wealth),
  moves:snap.moves,objectives:snap.completedObjectives,phase:snap.phase,
  actionDiversity:[...new Set(actions)],milestones:events.length
}));
