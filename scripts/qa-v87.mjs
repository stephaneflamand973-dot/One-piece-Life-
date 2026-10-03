import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/settlements-v87.js','utf8');
const engineSrc=fs.readFileSync('src/v87/settlement-engine-v87.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'settlements-v87.js'});
vm.runInContext(engineSrc,sandbox,{filename:'settlement-engine-v87.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('settlementDataV87'),engine=registry.get('settlementEngineV87');
assert(data&&engine,'V8.7 settlement modules not registered');
eq(data.version,'8.7.0','Settlement data version mismatch');
eq(engine.version,'8.7.0','Settlement engine version mismatch');
eq(Object.keys(data.services).length,8,'Settlement service count mismatch');
eq(Object.keys(data.districtTemplates).length,5,'District template count mismatch');

const water7={region:'Grand Line',danger:40,tags:['Ville','Port','Commerce','Charpentiers']};
const jaya={region:'Grand Line',danger:43,tags:['Pirates','Port','Criminalité']};
const ohara={region:'West Blue',danger:8,tags:['Savoir','Histoire']};

const waterDistricts=engine.districtsFor(water7);
assert(waterDistricts.some(x=>x.id==='port'),'Port island should expose port district');
const waterServices=engine.servicesFor(water7,{familiarity:10,standing:10});
assert(waterServices.some(x=>x.id==='shipyard'),'Water-style port should expose shipyard');
assert(waterServices.some(x=>x.id==='market'),'Commercial port should expose market');

const jayaServices=engine.servicesFor(jaya,{familiarity:20,standing:5});
assert(jayaServices.some(x=>x.id==='underworld'),'Criminal pirate port should expose underworld');
const oharaServices=engine.servicesFor(ohara,{familiarity:20,standing:10});
assert(oharaServices.some(x=>x.id==='archive'),'Knowledge island should expose archives');

const base=engine.normalizeState({});
const first=engine.visit(base,'Water 7',{year:20,exploration:20});
eq(first.record.visits,1,'First island visit mismatch');
gt(first.record.familiarity,0,'First visit should grant familiarity');
const second=engine.visit(first.state,'Water 7',{year:21,exploration:50});
eq(second.record.visits,2,'Return visit mismatch');
gt(second.record.familiarity,first.record.familiarity,'Return should increase familiarity');

const neutralPrice=engine.price('market',{priceIndex:1,standing:10,familiarity:10,heat:0});
const goodPrice=engine.price('market',{priceIndex:1,standing:80,familiarity:80,heat:0});
const crisisPrice=engine.price('market',{priceIndex:1.4,standing:10,familiarity:10,heat:50});
lt(goodPrice,neutralPrice,'High standing/familiarity should lower local prices');
gt(crisisPrice,neutralPrice,'Regional inflation and heat should raise prices');

const clinic=engine.serviceOutcome(second.state,'Water 7','clinic',{year:21,priceIndex:1,money:10000},.7);
assert(!clinic.error,'Clinic service should resolve');
gt(clinic.effects.health,0,'Clinic should heal');
lt(clinic.effects.money,0,'Clinic should cost money');
eq(clinic.record.lastServiceYear,21,'Service year not persisted');

const shipyard=engine.serviceOutcome(second.state,'Water 7','shipyard',{year:21,priceIndex:1,money:10000},.8);
gt(shipyard.effects.ship,0,'Shipyard should repair ship');
gt(shipyard.effects.supplies,0,'Shipyard should support supplies');

const tavern=engine.serviceOutcome(second.state,'Water 7','tavern',{year:21,priceIndex:1,money:10000},.9);
assert(tavern.effects.contact,'High tavern roll should generate contact');
assert(tavern.effects.lead,'High tavern roll should generate rare lead');
gt(tavern.record.contacts,second.record.contacts,'Contact counter should increase');

const underground=engine.serviceOutcome(engine.visit(base,'Jaya',{year:20,exploration:10}).state,'Jaya','underworld',{year:20,priceIndex:1,money:10000},.8);
gt(underground.effects.heat,0,'Underworld should raise local heat');
gt(underground.record.heat,0,'Local heat should persist');

const drift=engine.monthlyDrift(underground.state,'Jaya',{month:24,year:21});
lt(drift.record.heat,underground.record.heat,'Heat should cool over time');

const highStanding={standing:82,familiarity:55,heat:0,contacts:3,visits:5,servicesUsed:3,lastVisitYear:20,lastServiceYear:19,knownDistricts:[],flags:{}};
const withAuthority=engine.servicesFor({region:'East Blue',danger:8,tags:['Village']},highStanding);
assert(withAuthority.some(x=>x.id==='authority'),'High local standing should unlock authority access');

const summary=engine.summary(second.state,'Water 7',water7,{priceIndex:1.15});
eq(summary.record.visits,2,'Settlement summary visits mismatch');
assert(summary.districts.length>0&&summary.services.length>0,'Settlement summary content missing');
eq(engine.standingLabel(85),'Figure locale','Standing label mismatch');

assert(/ONE PIECE LIFE — V8\.\d+/.test(html),'V8.7+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=870,'Save version 870+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0',p=v.split('.').map(Number);assert(p[0]>8||(p[0]===8&&p[1]>=7),'Game version 8.7+ missing')}
for(const asset of ['src/data/settlements-v87.js','src/v87/settlement-engine-v87.js','src/v87/settlements-v87.css']){
 assert(html.includes(asset),'Index does not load '+asset);
 assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v8-[7-9]-\d+/.test(sw),'PWA cache must remain at V8.7 or newer');
assert(html.includes('v86Ensure();v87Ensure()'),'Old-save V8.7 migration hook missing');
for(const fn of ['function v87Module','function v87Ensure','function v87OnArrival','function v87MonthlyTick','function v87OnLocalOutcome','function v87Service','function renderV87Settlement']){
 assert(html.includes(fn),'Missing live V8.7 bridge '+fn);
}
assert(html.includes('careerTick(1);v86MonthlyTick();v87MonthlyTick();t.phase=2'),'Monthly settlement tick missing');
assert(html.includes('p.island=dest;p.region=target.region;v87OnArrival(dest);p.travel=null;'),'Arrival settlement hook missing');
assert(html.includes('v87OnLocalOutcome(result.outcome,e.rep||0);'),'Daily opportunity local-standing hook missing');
assert(html.includes('id="v87SettlementCard"'),'V8.7 settlement UI missing');
assert(html.includes('renderV75WorldDirector();renderV82Campaigns();renderV83Nemeses();renderV85Exploration();renderV87Settlement();'),'V8.7 world render hook missing');
assert(html.includes("$$('[data-v87-service]').forEach"),'V8.7 service button collection binding missing');

console.log('V8.7 ISLANDS & SETTLEMENTS 4.0 QA OK',JSON.stringify({
 version:'8.7.0',
 services:Object.keys(data.services).length,
 districts:Object.keys(data.districtTemplates).length,
 waterDistricts:waterDistricts.map(x=>x.id),
 waterServices:waterServices.map(x=>x.id),
 firstFamiliarity:first.record.familiarity,
 secondFamiliarity:second.record.familiarity,
 neutralPrice,goodPrice,crisisPrice,
 tavernContact:tavern.record.contacts,
 underworldHeat:underground.record.heat
}));
