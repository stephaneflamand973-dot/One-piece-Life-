import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/combat-techniques-v72.js','utf8');
const engineSrc=fs.readFileSync('src/v72/combat-engine-v72.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'combat-techniques-v72.js'});
vm.runInContext(engineSrc,sandbox,{filename:'combat-engine-v72.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('combatTechniquesV72');
const engine=registry.get('combatEngineV72');

assert(registry.has('combatTechniquesV72'),'Technique data module not registered');
assert(registry.has('combatEngineV72'),'Combat engine module not registered');
assert(data.version==='7.2.0'&&engine.version==='7.2.0','V7.2 module version mismatch');
assert(data.techniques.length>=16,'V7.2 needs at least 16 combat techniques');
for(const id of ['fundamentals','draw_slash','precision_shot','observation_read','armament_coat','conqueror_pressure','paramecia_control','zoan_assault','logia_shift','awakening_push']){
  assert(data.techniques.some(t=>t.id===id),'Missing technique '+id);
}
for(const id of ['balanced','aggressive','defensive','precision','overwhelm'])assert(data.doctrines[id],'Missing doctrine '+id);

const fighter=(overrides={})=>({
  power:70,
  combatStyle:{primary:'Sabreur'},
  combatV72:{doctrine:'balanced'},
  skills:{Combat:62,Sabre:82,Tir:12},
  stats:{Force:72,Vitesse:80,Agilité:74,Endurance:70,Résistance:68,Réflexes:79,Volonté:76},
  haki:{Observation:{mastery:55},Armement:{mastery:55},Conquérant:{mastery:36}},
  devilFruit:null,
  ...overrides
});
const logia=(arm=10)=>({
  power:68,
  combatStyle:{primary:'Équilibré'},
  skills:{Combat:70,Sabre:0,Tir:0},
  stats:{Force:68,Vitesse:70,Agilité:70,Endurance:68,Résistance:66,Réflexes:70,Volonté:66},
  haki:{Observation:{mastery:38},Armement:{mastery:arm},Conquérant:{mastery:0}},
  devilFruit:{type:'Logia',mastery:58},
  combatV72:{doctrine:'balanced'}
});

const base={opening:.55,pressure:.55,finish:.55};
const armed=engine.enhance(base,fighter(),logia(10));
const unarmed=engine.enhance(base,fighter({haki:{Observation:{mastery:55},Armement:{mastery:0},Conquérant:{mastery:36}}}),logia(10));
gt(armed.winEstimate,unarmed.winEstimate,'Armament should materially improve matchup against Logia');
assert(armed.matchup.interactions.includes('Armement contre Logia'),'Armament/Logia interaction not surfaced');
assert(unarmed.matchup.interactions.includes('Logia difficile à toucher'),'Unarmed Logia penalty missing');

const logiaDef=engine.enhance(base,logia(10),fighter({haki:{Observation:{mastery:45},Armement:{mastery:0},Conquérant:{mastery:0}}}));
assert(logiaDef.matchup.interactions.includes('Intangibilité Logia'),'Logia intangibility interaction missing');

const obsHigh=engine.enhance(base,fighter({haki:{Observation:{mastery:80},Armement:{mastery:30},Conquérant:{mastery:0}}}),logia(20));
assert(obsHigh.matchup.interactions.includes('Observation supérieure'),'Observation superiority not surfaced');

const conq=engine.enhance(base,fighter({stats:{Force:72,Vitesse:80,Agilité:74,Endurance:70,Résistance:68,Réflexes:79,Volonté:92},haki:{Observation:{mastery:55},Armement:{mastery:55},Conquérant:{mastery:70}}}),logia(20));
assert(conq.matchup.interactions.includes('Pression du Conquérant'),'Conqueror pressure not surfaced');

const swordIds=engine.available(fighter(),'opening').map(t=>t.id);
assert(swordIds.includes('draw_slash'),'Qualified swordsman did not unlock sword technique');
const weakSword=engine.available(fighter({skills:{Combat:20,Sabre:10,Tir:0}}),'opening').map(t=>t.id);
assert(!weakSword.includes('draw_slash'),'Unqualified swordsman unlocked sword technique');

const paramecia=fighter({devilFruit:{type:'Paramecia',mastery:60}});
const zoan=fighter({combatStyle:{primary:'Corps-à-corps'},devilFruit:{type:'Zoan',mastery:60}});
assert(engine.available(paramecia,'pressure').some(t=>t.id==='paramecia_control'),'Paramecia technique missing');
assert(engine.available(zoan,'finish').some(t=>t.id==='zoan_assault'),'Zoan technique missing');
assert(engine.powerInteractions(zoan,logia()).effects.includes('Endurance Zoan'),'Zoan identity missing from power interactions');

const lowFruit=fighter({devilFruit:{type:'Paramecia',mastery:60}});
const highFruit=fighter({devilFruit:{type:'Paramecia',mastery:86}});
assert(!engine.available(lowFruit,'finish').some(t=>t.id==='awakening_push'),'Awakening unlocked too early');
assert(engine.available(highFruit,'finish').some(t=>t.id==='awakening_push'),'High mastery did not unlock awakening');

const deterministicA=engine.enhance(base,fighter(),logia(10));
const deterministicB=engine.enhance(base,fighter(),logia(10));
eq(JSON.stringify(deterministicA),JSON.stringify(deterministicB),'Pure combat engine must be deterministic for identical inputs');

const win=engine.resolve(armed,{opening:0,pressure:0,finish:.99});
const loss=engine.resolve(armed,{opening:.99,pressure:.99,finish:0});
assert(win.phasesWon>=2&&win.outcome==='win','Resolver did not produce a win from two won phases');
assert(loss.phasesWon<2&&loss.outcome==='defeat','Resolver did not produce defeat from fewer than two phases');

// Live integration contract.
const saveVersion=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
const gameVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
assert(/ONE PIECE LIFE — V(?:[7-9]|\d{2,})\./.test(html),'V7+ release title missing');
assert(saveVersion>=720,'V7.2 regression QA requires save version >= 720');
const [gameMajor,gameMinor]=gameVersion.split('.').map(Number);
assert(gameMajor>7||(gameMajor===7&&gameMinor>=2),'V7.2 regression QA requires game version >= 7.2');
for(const asset of ['src/data/combat-techniques-v72.js','src/v72/combat-engine-v72.js']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:7-[2-9]|8-[0-9]+|9-[0-9]+)-[0-9]+/.test(sw),'PWA cache must remain at V7.2 or newer');
assert(html.includes('function v72CombatModule()'),'Legacy bridge missing combat module lookup');
assert(html.includes('mod.enhance({opening,pressure,finish}'),'Legacy assessment is not enhanced by V7.2');
assert(html.includes('v72RecordCombatUsage(a,phaseResults)'),'Combat usage/signature learning not connected');
assert(html.includes('data-v72-doctrine'),'Doctrine controls missing from combat UI');
assert(html.includes("combatV72:{doctrine:'balanced'"),'Fresh-save V7.2 state missing');
assert(html.includes("if(!game.player.combatV72||typeof game.player.combatV72!=='object')"),'Old-save V7.2 migration guard missing');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V7.2 COMBAT & POWERS QA OK',JSON.stringify({
  version:gameVersion,
  techniques:data.techniques.length,
  doctrines:Object.keys(data.doctrines).length,
  armedVsLogia:armed.winEstimate,
  unarmedVsLogia:unarmed.winEstimate,
  openingTechnique:armed.phases.opening.technique.name,
  pressureTechnique:armed.phases.pressure.technique.name,
  finishTechnique:armed.phases.finish.technique.name,
  deterministic:true,
  migrationGuard:true
}));
