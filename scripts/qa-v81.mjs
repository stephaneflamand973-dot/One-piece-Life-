import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const v80DataSrc=fs.readFileSync('src/data/simulation-core-v80.js','utf8');
const dataSrc=fs.readFileSync('src/data/faction-identity-v81.js','utf8');
const engineSrc=fs.readFileSync('src/v81/faction-identity-engine-v81.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(v80DataSrc,sandbox,{filename:'simulation-core-v80.js'});
vm.runInContext(dataSrc,sandbox,{filename:'faction-identity-v81.js'});
vm.runInContext(engineSrc,sandbox,{filename:'faction-identity-engine-v81.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('factionIdentityDataV81');
const engine=registry.get('factionIdentityEngineV81');
const v80=registry.get('simulationCoreDataV80');

assert(data&&engine,'V8.1 modules not registered');
eq(data.version,'8.1.0','Faction data version mismatch');
eq(engine.version,'8.1.0','Faction engine version mismatch');
eq(Object.keys(data.factions).length,6,'Faction profile count mismatch');
eq(engine.canonicalFaction('Chasseur de primes'),'Chasseurs de primes','Bounty hunter alias mismatch');
assert(v80.interruptionKinds.faction,'V8.0 Priority Director is not extended with faction interruptions');

for(const [id,p] of Object.entries(data.factions)){
  assert(p.identity&&p.desc,'Missing identity text for '+id);
  assert(Array.isArray(p.values)&&p.values.length>=3,'Missing faction values for '+id);
  assert(Array.isArray(p.events)&&p.events.length>=3,'Faction event catalog too small for '+id);
  const types=new Set(p.events.map(e=>e.type));
  for(const t of ['duty','opportunity','friction'])assert(types.has(t),'Missing '+t+' event for '+id);
  for(const e of p.events)assert(Object.keys(e.choices||{}).length>=3,'Event choices too small for '+e.id);
}

const baseCtx={faction:'Marine',careerActive:true,age:22,year:22,month:264,standing:56,trust:62,discipline:68,influence:24,sanctions:0,rankRatio:.42};
const fresh=engine.normalizeState({},baseCtx);
eq(fresh.currentFaction,'Marine','Fresh faction mismatch');
assert(fresh.loyalty>0&&fresh.autonomy>0,'Fresh identity meters missing');
eq(fresh.lastEventCheckYear,-99,'Fresh annual event check mismatch');

const highPressure=engine.normalizeState({...fresh,pressure:96,friction:62},baseCtx);
const forced=engine.eventCandidate(highPressure,baseCtx,.999,.1);
assert(forced,'Extreme faction pressure should force a candidate');
assert(['duty','opportunity','friction'].includes(forced.type),'Unknown faction event type');

const duty=data.factions.Marine.events.find(e=>e.id==='marine_duty');
const resolved=engine.resolve(highPressure,{id:duty.id,event:duty},'commit',baseCtx);
assert(!resolved.error,'Marine duty resolution failed');
gt(resolved.state.loyalty,highPressure.loyalty,'Duty should increase loyalty');
lt(resolved.state.pressure,highPressure.pressure,'Duty should reduce stored pressure');
gt(resolved.factionDelta.standing,0,'Duty should improve internal standing');
gt(resolved.factionDelta.trust,0,'Duty should improve internal trust');
eq(resolved.state.dutiesCompleted,highPressure.dutiesCompleted+1,'Duty counter mismatch');

const renegotiated=engine.resolve(highPressure,{id:duty.id,event:duty},'negotiate',baseCtx);
gt(renegotiated.state.autonomy,highPressure.autonomy,'Negotiation should increase autonomy');
assert(renegotiated.factionDelta.influence>0,'Negotiation should reward influence');

const refused=engine.resolve(highPressure,{id:duty.id,event:duty},'refuse',baseCtx);
gt(refused.state.friction,highPressure.friction,'Refusal should increase friction');
eq(refused.state.dutiesIgnored,highPressure.dutiesIgnored+1,'Ignored duty counter mismatch');
assert(refused.factionDelta.sanctions>=1,'Marine refusal should create a sanction');

const missionSuccess=engine.missionImpact(fresh,{...baseCtx,outcome:'success',danger:'high',aligned:true});
gt(missionSuccess.state.identity,fresh.identity,'Aligned mission success should strengthen identity');
gt(missionSuccess.state.loyalty,fresh.loyalty,'Aligned mission success should strengthen loyalty');
lt(missionSuccess.state.pressure,fresh.pressure,'Aligned mission success should relieve pressure');

const missionFailure=engine.missionImpact(fresh,{...baseCtx,outcome:'failure',danger:'high',aligned:true});
lt(missionFailure.state.identity,fresh.identity,'Mission failure should weaken identity');
gt(missionFailure.state.pressure,fresh.pressure,'Mission failure should raise pressure');

const changed=engine.factionChange({...fresh,lastEventCheckYear:22},'Marine','Pirates',{...baseCtx,faction:'Pirates',month:270,year:22});
eq(changed.currentFaction,'Pirates','Faction change did not update identity');
eq(changed.defections,fresh.defections+1,'Faction change counter mismatch');
eq(changed.lastEventCheckYear,-99,'Faction change must reopen annual faction evaluation');
assert(changed.history.some(x=>x.kind==='faction_change'),'Faction change history missing');

const tick1=engine.annualTick(fresh,{...baseCtx,year:23,month:276});
assert(tick1.changed,'First annual faction tick should run');
const tick2=engine.annualTick(tick1.state,{...baseCtx,year:23,month:276});
assert(!tick2.changed,'Faction annual tick must be idempotent per year');

assert(/ONE PIECE LIFE — V8\.\d+/.test(html),'V8.1+ title missing');
const liveSave=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
assert(liveSave>=810,'Save version 810+ missing');
const liveVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
const [liveMajor,liveMinor]=liveVersion.split('.').map(Number);
assert(liveMajor>8||(liveMajor===8&&liveMinor>=1),'Game version 8.1+ missing');
for(const asset of ['src/data/faction-identity-v81.js','src/v81/faction-identity-engine-v81.js','src/v81/faction-identity-v81.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v8-[1-9]-\d+/.test(sw),'PWA cache must remain at V8.1 or newer');
assert(html.includes("factionV81:{version:1"),'Fresh V8.1 state missing');
assert(html.includes('v80Ensure();v81Ensure();'),'Old-save V8.1 migration hook missing');
assert(html.includes('id="v81FactionCard"'),'Faction identity UI card missing');
for(const fn of ['function v81Module','function v81Context','function v81Ensure','function v81Candidate','function v81QueueFaction','function v81ResolveDecision','function v81AnnualTick','function v81RecordMissionOutcome','function v81OnFactionChange','function renderV81FactionIdentity']){
  assert(html.includes(fn),'Missing live V8.1 bridge '+fn);
}
assert(html.includes("kind:'faction'"),'Faction pressure is not connected to V8.0 interruption arbitration');
assert(html.includes("else if(c.kind==='faction')queued=v81QueueFaction(c.payload)"),'Faction decision queue missing');
assert(html.includes("if(parts[0]==='v81faction')v81ResolveDecision(parts)"),'Faction decision resolver missing');
assert(html.includes("v79ApplyCareerPreparation(parts[1]);v81OnFactionChange(oldFaction,p.faction);refreshMissionBoard();"),'Career faction-change hook missing');
assert(html.includes("v73RecordMissionOutcome(m,'success',approach.id);v81RecordMissionOutcome(m,'success');"),'Mission success identity hook missing');
assert(html.includes("v73RecordMissionOutcome(m,'partial',approach.id);v81RecordMissionOutcome(m,'partial');"),'Mission partial identity hook missing');
assert(html.includes("v81RecordMissionOutcome(m,retreated?'retreat':'failure');"),'Mission failure identity hook missing');
assert(html.includes('renderV73Organization();renderV81FactionIdentity();renderV69Endgame();'),'Faction UI render hook missing');

console.log('V8.1 FACTION IDENTITY 4.0 QA OK',JSON.stringify({
  version:'8.1.0',
  factions:Object.keys(data.factions).length,
  forcedEvent:forced.id,
  marineDutyLoyalty:+resolved.state.loyalty.toFixed(1),
  refusalFriction:+refused.state.friction.toFixed(1),
  missionIdentity:+missionSuccess.state.identity.toFixed(1),
  defectionCount:changed.defections
}));
