import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const v80DataSrc=fs.readFileSync('src/data/simulation-core-v80.js','utf8');
const dataSrc=fs.readFileSync('src/data/crew-v84.js','utf8');
const engineSrc=fs.readFileSync('src/v84/crew-engine-v84.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function gte(a,b,msg){if(!(a>=b))throw new Error(msg+': '+a+' < '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(v80DataSrc,sandbox,{filename:'simulation-core-v80.js'});
vm.runInContext(dataSrc,sandbox,{filename:'crew-v84.js'});
vm.runInContext(engineSrc,sandbox,{filename:'crew-engine-v84.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('crewDataV84');
const engine=registry.get('crewEngineV84');
const v80=registry.get('simulationCoreDataV80');

assert(data&&engine,'V8.4 modules not registered');
eq(data.version,'8.4.0','Crew data version mismatch');
eq(engine.version,'8.4.0','Crew engine version mismatch');
eq(Object.keys(data.roles).length,11,'Crew role count mismatch');
eq(Object.keys(data.doctrines).length,6,'Crew doctrine count mismatch');
assert(Object.keys(data.traits).length>=8,'Crew trait catalog too small');
assert(Object.keys(data.managementActions).length===4,'Crew management action count mismatch');
assert(v80.interruptionKinds.crew,'Priority Director crew kind missing');
assert(v80.narrativeDomains.relation.patterns.includes('équipage'),'Crew narrative relation pattern missing');
assert(v80.legacyCategories.leadership.patterns.includes('équipage'),'Crew leadership legacy pattern missing');

const crew={name:'Équipage Test',morale:72,treasury:12000,ship:{condition:80},members:[
  {id:'fighter',name:'Rook',role:'Combattant',power:55,potentialPower:82,growthRate:1.0,loyalty:68,trust:60,roleMastery:64,status:'active',trait:'fearless'},
  {id:'nav',name:'Mira',role:'Navigateur',power:44,potentialPower:72,growthRate:1.1,loyalty:75,trust:70,roleMastery:68,status:'active',trait:'cautious'},
  {id:'doc',name:'Sena',role:'Médecin',power:30,potentialPower:66,growthRate:1.2,loyalty:80,trust:78,roleMastery:72,status:'active',trait:'loyal'},
  {id:'carp',name:'Toma',role:'Charpentier',power:36,potentialPower:70,growthRate:1.0,loyalty:65,trust:62,roleMastery:60,status:'active',trait:'veteran'}
]};
const state=engine.normalizeState({doctrine:'balanced',readiness:70,supplies:76,renown:32});
const ctx={year:20,cohesion:72,tension:18,training:'steady',danger:1,worldRep:18,command:54};

const cov=engine.coverage(crew.members);
eq(cov.coreCovered,4,'Core role coverage mismatch');
assert(!cov.missing.length,'Complete crew should not miss core roles');

const metrics=engine.metrics(state,crew,ctx);
assert(metrics.combat>0&&metrics.travel>0&&metrics.support>0&&metrics.command>0,'Crew domain metrics missing');
gt(metrics.synergy,50,'Healthy crew should have meaningful synergy');
gt(metrics.power,0,'Crew collective power missing');

const navMission=engine.missionSupport(state,crew,{type:'navigation',danger:'medium',title:'Route dangereuse'},ctx);
gt(navMission.bonus,0,'Crew mission support missing');
assert(navMission.teamNames.includes('Mira'),'Navigator should be selected for navigation mission');
assert(navMission.team.length<=3,'Mission team should be capped');

const assault=engine.normalizeState({...state,doctrine:'assault'});
const assaultMetrics=engine.metrics(assault,crew,ctx);
gt(assaultMetrics.combat,metrics.combat,'Assault doctrine should improve combat');

const survival=engine.normalizeState({...state,doctrine:'survival'});
const survivalMetrics=engine.metrics(survival,crew,ctx);
gt(survivalMetrics.support,metrics.support,'Survival doctrine should improve support');

const weakCrew={...crew,members:crew.members.filter(x=>['fighter','nav'].includes(x.id))};
const recruit=engine.recruitCandidate({members:weakCrew.members,renown:30,worldRep:18,year:20},{id:.2,role:.1,trait:.3,first:.2,last:.7,quality:.65,power:.5,potential:.8,growth:.5,loyalty:.6,trust:.5,mastery:.7});
assert(['doctor','carpenter'].includes(recruit.roleKey),'Recruitment should prioritize a missing core role');
gt(recruit.potentialPower,recruit.power,'Recruit potential must exceed current power');
const recruitChance=engine.recruitChance(recruit,{members:weakCrew.members,renown:30,worldRep:18,command:54});
assert(recruitChance>=.18&&recruitChance<=.92,'Recruitment chance out of bounds');

const drill=engine.applyManagement(state,crew,'drill',ctx,.7);
gt(drill.state.readiness,state.readiness,'Collective training should improve readiness');
gt(drill.crew.members[0].roleMastery,crew.members[0].roleMastery,'Collective training should improve role mastery');

const logistics=engine.applyManagement(state,crew,'logistics',ctx,.7);
gt(logistics.state.supplies,state.supplies,'Logistics should improve supplies');
gt(logistics.crew.ship.condition,crew.ship.condition,'Logistics should repair ship');

const appointed=engine.appointFirstMate(state,crew,'nav');
eq(appointed.state.firstMateId,'nav','First mate state mismatch');
eq(appointed.member.position,'first_mate','First mate position mismatch');
gt(appointed.member.loyalty,crew.members[1].loyalty,'Promotion should improve loyalty');

const tickRolls={injury0:0,duration0:.6,injury1:1,duration1:.5,injury2:1,duration2:.5,injury3:1,duration3:.5};
const tick=engine.monthlyTick(state,crew,{...ctx,danger:1.5},1,tickRolls);
gt(tick.crew.members[0].injuryMonths,0,'Deterministic injury tick should injure selected member');
assert(tick.state.totalInjuries>=1,'Crew injury counter missing');
assert(tick.state.supplies<state.supplies,'Monthly crew operation should consume supplies');

const missionRolls={injury0:0,duration0:.6,injury1:0,duration1:.4,injury2:0,duration2:.5,injury3:0,duration3:.5};
const missionResult=engine.recordMission(state,crew,{id:'mission_1',type:'combat',danger:'high',title:'Raid difficile'},'failure',ctx,missionRolls);
eq(missionResult.state.missions,1,'Crew mission counter mismatch');
assert(missionResult.support.team.length>0,'Mission outcome should identify deployed crew');
assert(missionResult.crew.members.some(x=>x.injuryMonths>0),'Failed high-risk mission should permit crew injuries');
assert(missionResult.crew.members.some(x=>x.memories.some(m=>m.type==='mission')),'Crew mission memories missing');

const campaignBonus=engine.campaignSupport(state,crew,{phaseIndex:2},ctx);
gt(campaignBonus,0,'Crew should contribute to campaign organization power');

const summary=engine.summary(state,crew,ctx);
eq(summary.members.length,4,'Crew summary roster mismatch');
eq(summary.coverage.coreCovered,4,'Crew summary coverage mismatch');

assert(/ONE PIECE LIFE — V(?:[89]|\d{2,})\.\d+/.test(html),'V8.4+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=840,'Save version 840+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0',p=v.split('.').map(Number);assert(p[0]>8||(p[0]===8&&p[1]>=4),'Game version 8.4+ missing')}
for(const asset of ['src/data/crew-v84.js','src/v84/crew-engine-v84.js','src/v84/crew-v84.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:8-[4-9]|9-\d+)-\d+/.test(sw),'PWA cache must remain at V8.4 or newer');
assert(html.includes('v80Ensure();v81Ensure();v82Ensure();v83Ensure();v84Ensure();'),'Old-save V8.4 migration hook missing');
for(const fn of ['function v84Module','function v84Ensure','function v84TickCrew','function v84MissionSupport','function v84CampaignSupport','function v84RecordMissionOutcome','function v84ManagementAction','function v84RecruitDecision','function v84SetDoctrine','function v84AppointFirstMate','function v84Candidate','function v84QueueCrew','function v84ResolveDecision','function v84RenderCrew']){
  assert(html.includes(fn),'Missing live V8.4 bridge '+fn);
}
assert(html.includes("kind:'crew'"),'Crew events are not connected to Priority Director');
assert(html.includes("else if(c.kind==='crew')queued=v84QueueCrew(c.payload)"),'Crew Priority Director queue missing');
assert(html.includes("if(parts[0]==='v84crew')v84ResolveDecision(parts)"),'Crew decision route missing');
assert(html.includes("v84RecordMissionOutcome(m,'success')"),'Crew mission success hook missing');
assert(html.includes("v84RecordMissionOutcome(m,'partial')"),'Crew mission partial hook missing');
assert(html.includes("v84RecordMissionOutcome(m,retreated?'retreat':'failure')"),'Crew mission failure hook missing');
assert(html.includes('organization:v69NetworkMissionBonus()+v84CampaignSupport(campaign)'),'Crew campaign support hook missing');
assert(html.includes('const social=v67MissionRelationSupport(),mod=v84Module();')&&html.includes('const v84=v84MissionSupport(m);'),'Crew mission support integration missing');
for(const selector of ['data-v84-doctrine','data-v84-manage','data-v84-firstmate','data-v84-recruit','data-ship-repair']){
  assert(html.includes("$('["+selector+"]')"+'.forEach'),'Crew dashboard multi-button binding missing: '+selector);
}
assert(html.includes('if(p.crew)v84RenderCrew();'),'Crew V8.4 UI render hook missing');

console.log('V8.4 CREW & ORGANIZATION 4.0 QA OK',JSON.stringify({
  version:'8.4.0',
  roles:Object.keys(data.roles).length,
  doctrines:Object.keys(data.doctrines).length,
  coverage:cov.score,
  synergy:metrics.synergy,
  missionBonus:navMission.bonus,
  team:navMission.teamNames,
  recruitRole:recruit.role,
  recruitChance,
  campaignBonus,
  collectivePower:metrics.power
}));
