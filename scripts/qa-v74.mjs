import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/relation-personas-v74.js','utf8');
const engineSrc=fs.readFileSync('src/v74/relation-persona-engine-v74.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'relation-personas-v74.js'});
vm.runInContext(engineSrc,sandbox,{filename:'relation-persona-engine-v74.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('relationPersonaDataV74');
const engine=registry.get('relationPersonaEngineV74');

assert(data&&engine,'V7.4 modules not registered');
eq(data.version,'7.4.0','Persona data version mismatch');
eq(engine.version,'7.4.0','Persona engine version mismatch');
assert(Object.keys(data.temperamentValues).length>=20,'Temperament value map too small');
assert(Object.keys(data.interactionProfiles).length>=7,'Interaction profile set too small');
assert(data.socialArcs.length>=6,'Social arc catalog too small');
assert(Object.keys(data.arcChoices).length>=12,'Social arc choice catalog too small');

const relation={
  id:'r1',name:'Aren',temperament:'Loyaliste',ambition:'Loyauté',
  trust:62,respect:64,affection:58,familiarity:52,loyalty:68,rivalry:12,status:'active'
};
const canonPersona={values:['liberté','loyauté'],temperament:'Calme'};
const social=engine.normalize(relation,canonPersona);
assert(social.values.includes('loyauté'),'Canonical/persona values not inferred');
assert(social.values.includes('liberté'),'Canonical values not merged');

const compatibleCtx={faction:'Pirates',ambitionType:'protect',combatStyle:{primary:'Équilibré'},relationsPlan:'invest',careerPlan:'steady',month:120};
const conflictingCtx={faction:'Gouvernement',ambitionType:'wealth',combatStyle:{primary:'Équilibré'},relationsPlan:'isolate',careerPlan:'hard',month:120};
const compatible=engine.compatibility(relation,social,compatibleCtx);
const conflicting=engine.compatibility(relation,social,conflictingCtx);
gt(compatible.score,conflicting.score,'Values and life direction should affect compatibility');

let memorySocial=engine.addMemory(social,{id:'recent',label:'Protection récente',valence:8,impact:4,month:118,tags:['support']});
const recentTone=engine.memoryTone(memorySocial,120).score;
memorySocial={...memorySocial,memories:[{...memorySocial.memories[0],month:0}]};
const oldTone=engine.memoryTone(memorySocial,120).score;
gt(recentTone,oldTone,'Recent memories should weigh more than old memories');

const goodImpact=engine.interactionImpact(relation,social,'help',compatibleCtx);
const badImpact=engine.interactionImpact(relation,social,'help',conflictingCtx);
gt(goodImpact.delta.trust,badImpact.delta.trust,'Compatibility should change interaction impact');

const positiveMemory=engine.addMemory(social,{id:'p',label:'Soutien',valence:7,impact:3,month:120,tags:['support']});
gt(positiveMemory.bond,social.bond,'Positive memory should strengthen bond');
gt(positiveMemory.reliability,social.reliability,'Support memory should increase reliability');
const negativeMemory=engine.addMemory(social,{id:'n',label:'Trahison',valence:-8,impact:4,month:120,tags:['betrayal']});
gt(negativeMemory.unresolved,social.unresolved,'Strong negative memory should create unresolved tension');
lt(negativeMemory.reliability,social.reliability,'Betrayal memory should reduce reliability');

const trusted=engine.classify({...relation,trust:86,loyalty:82,affection:78,respect:75,familiarity:75,rivalry:5},{...social,bond:78,reliability:80});
assert(['trusted','bonded'].includes(trusted.id),'Strong relation should classify as trusted/bonded');
const rival=engine.classify({...relation,trust:40,respect:72,rivalry:80},{...social,bond:50,reliability:50});
eq(rival.id,'rival','High-respect rivalry should classify as rival');

const trustArcRelation={...relation,trust:55,respect:62,familiarity:55,loyalty:60,rivalry:20};
const trustArcs=engine.eligibleArcs(trustArcRelation,social,{year:10,mentor:false});
assert(trustArcs.some(a=>a.id==='trust_test'),'Trust test arc not eligible when expected');

const mentorArcs=engine.eligibleArcs({...relation,trust:75,respect:80,familiarity:65,loyalty:70,rivalry:10},social,{year:10,mentor:true});
assert(mentorArcs.some(a=>a.id==='mentor_breakthrough'),'Mentor breakthrough arc missing');

const rivalryArcs=engine.eligibleArcs({...relation,trust:42,respect:72,familiarity:62,loyalty:45,rivalry:78},social,{year:10,mentor:false});
assert(rivalryArcs.some(a=>a.id==='rivalry_escalation'),'Rivalry arc missing');

const arcResolved=engine.resolveArc(trustArcRelation,social,'trust_test','stand_by',{year:10,month:120});
assert(!arcResolved.error,'Valid social arc failed to resolve');
gt(arcResolved.relation.trust,trustArcRelation.trust,'Trust arc did not affect relation');
assert(arcResolved.social.memories.some(m=>m.type==='arc'),'Resolved arc did not create memory');

const fractureRelation={...relation,status:'active',trust:20,affection:20,respect:55,familiarity:60,loyalty:25,rivalry:72};
const fractureSocial={...social,unresolved:3};
const cut=engine.resolveArc(fractureRelation,fractureSocial,'fracture','cut_ties',{year:12,month:144});
eq(cut.relation.status,'distant','Cut ties choice did not distance relation');

const strongRelation={...relation,trust:88,respect:82,affection:75,familiarity:80,loyalty:86,rivalry:4};
const strongSocial={...social,bond:84,reliability:86,unresolved:0,memories:[{id:'s',label:'Soutien',valence:8,impact:4,month:118,tags:['support']}]};
const weakRelation={...relation,trust:28,respect:35,affection:30,familiarity:30,loyalty:25,rivalry:62};
const weakSocial={...social,bond:30,reliability:28,unresolved:3,memories:[{id:'b',label:'Rupture',valence:-8,impact:4,month:118,tags:['betrayal']}]};
gt(engine.supportScore(strongRelation,strongSocial,compatibleCtx),engine.supportScore(weakRelation,weakSocial,conflictingCtx),'Strong relationships should provide more support');
gt(engine.betrayalRisk(weakRelation,weakSocial,conflictingCtx),engine.betrayalRisk(strongRelation,strongSocial,compatibleCtx),'Fragile relationship should have higher fracture risk');

const zeroSocial=engine.normalize({...relation,socialV74:{bond:0,reliability:0,unresolved:0,values:['liberté']}},null);
eq(zeroSocial.bond,0,'Explicit zero bond must be preserved');
eq(zeroSocial.reliability,0,'Explicit zero reliability must be preserved');

// Live integration contract.
const saveVersion=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
const gameVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
assert(/ONE PIECE LIFE — V(?:[7-9]|\d{2,})\./.test(html),'V7+ release title missing');
assert(saveVersion>=740,'V7.4 regression QA requires save version >= 740');
const [gameMajor,gameMinor]=gameVersion.split('.').map(Number);
assert(gameMajor>7||(gameMajor===7&&gameMinor>=4),'V7.4 regression QA requires game version >= 7.4');
for(const asset of ['src/data/relation-personas-v74.js','src/v74/relation-persona-engine-v74.js']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:7-[4-9]|8-[0-9]+|9-[0-9]+)-[0-9]+/.test(sw),'PWA cache must remain at V7.4 or newer');
for(const fn of ['function v74EnsureRelation','function v74RecordMemory','function v74MaybeQueueArc','function v74ResolveArcDecision','function renderV74Network']){
  assert(html.includes(fn),'Missing live V7.4 bridge '+fn);
}
assert(html.includes('id="v74NetworkCard"'),'V7.4 social network UI missing');
assert(html.includes('data-rel-action="confide"'),'Confide interaction missing');
assert(html.includes('data-rel-action="challenge"'),'Challenge interaction missing');
assert(html.includes("socialV74:{version:1"),'Fresh-save V7.4 global state missing');
assert(html.includes("if(!game.player.socialV74||typeof game.player.socialV74!=='object')"),'Old-save V7.4 migration guard missing');
assert(html.includes("v74RememberCanonEncounter(r,c,persona,calc)"),'Canon encounters do not create V7.4 memories');
assert(html.includes("if(parts[0]==='v74arc')v74ResolveArcDecision(parts)"),'Social arc choices are not connected');
assert(html.includes('v74MaybeQueueArc()'),'Annual social arc trigger missing');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V7.4 RELATIONS & PERSONA QA OK',JSON.stringify({
  version:gameVersion,
  temperaments:Object.keys(data.temperamentValues).length,
  interactions:Object.keys(data.interactionProfiles).length,
  socialArcs:data.socialArcs.length,
  compatibleScore:compatible.score,
  conflictingScore:conflicting.score,
  recentMemoryTone:recentTone,
  oldMemoryTone:oldTone,
  strongSupport:engine.supportScore(strongRelation,strongSocial,compatibleCtx),
  weakFractureRisk:engine.betrayalRisk(weakRelation,weakSocial,conflictingCtx),
  migrationGuard:true
}));
