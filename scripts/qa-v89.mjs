import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/equipment-v89.js','utf8');
const engineSrc=fs.readFileSync('src/v89/equipment-engine-v89.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'equipment-v89.js'});
vm.runInContext(engineSrc,sandbox,{filename:'equipment-engine-v89.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('equipmentDataV89'),engine=registry.get('equipmentEngineV89');
assert(data&&engine,'V8.9 equipment modules not registered');
eq(data.version,'8.9.0','Equipment data version mismatch');
eq(engine.version,'8.9.0','Equipment engine version mismatch');
eq(Object.keys(data.slots).length,4,'Equipment slot count mismatch');
assert(Object.keys(data.templates).length>=20,'Equipment template count too small');

const lowRarity=engine.rarityFor({danger:5,exploration:0,power:5,source:'combat'},.08);
const highRarity=engine.rarityFor({danger:92,exploration:85,power:90,source:'treasure'},.08);
gt(data.rarities[highRarity].tier,data.rarities[lowRarity].tier,'Danger/exploration should improve rarity at same roll');

const coat=engine.createItem('reinforced_coat',{uid:'coat',origin:'Water 7',source:'market',year:20},{rarity:.3,quality:.7,id:.1});
const blade=engine.createItem('pirate_blade',{uid:'blade',origin:'Jaya',source:'loot',year:20,danger:55,power:50},{rarity:.2,quality:.8,id:.2});
let state=engine.acquire({},coat,{bought:true}).state;
state=engine.acquire(state,blade,{loot:true}).state;
state=engine.equip(state,'coat').state;
state=engine.equip(state,'blade').state;
const fx=engine.effects(state);
gt(fx.defense,0,'Equipped outfit defense missing');
gt(fx.offense,0,'Equipped weapon offense missing');
lt(fx.damageMult,1,'Equipment should reduce damage');
gt(fx.missionBonus,0,'Equipment mission bonus missing');

const wear=engine.wear(state,12,['weapon','outfit']);
lt(wear.state.items.find(x=>x.uid==='coat').durability,coat.durability,'Wear should reduce durability');
const repairCost=engine.repairCost(wear.state.items.find(x=>x.uid==='coat'),1.1);
gt(repairCost,0,'Damaged item repair cost missing');
const repaired=engine.repair(wear.state,'coat',{money:100000,priceIndex:1.1,year:21});
assert(!repaired.error,'Repair failed');
eq(repaired.item.durability,repaired.item.maxDurability,'Repair should restore durability');

const beforeScore=engine.itemScore(repaired.item);
const upgraded=engine.upgrade(repaired.state,'coat',{money:100000,priceIndex:1,year:21});
assert(!upgraded.error,'Upgrade failed');
gt(engine.itemScore(upgraded.item),beforeScore,'Upgrade should improve item score');

let broken=engine.normalizeState(upgraded.state);
broken.items.find(x=>x.uid==='coat').durability=0;
const brokenFx=engine.effects(broken);
lt(brokenFx.defense,fx.defense,'Broken equipment should lose its bonus');

const bandage=engine.createItem('bandage',{uid:'bandage',origin:'Drum',source:'market',year:20},{rarity:.9,quality:.5,id:.4});
let consumableState=engine.acquire({},bandage,{bought:true}).state;
const used=engine.use(consumableState,'bandage');
assert(!used.error,'Consumable use failed');
gt(used.effects.health,0,'Bandage should heal');
eq(used.state.items.length,0,'Consumed item should leave inventory');

const place={region:'Grand Line',danger:29,tags:['Navires','Commerce','Gouvernement']};
const ctx={island:'Water 7',year:20,priceIndex:1.05,standing:35,familiarity:30,heat:0,danger:29,exploration:40};
const rolls=[0,1,2,3].map(i=>({pick:.12+i*.2,rarity:.55,quality:.55,id:.1+i*.1}));
const offers=engine.shopOffers(place,ctx,rolls);
eq(offers.length,4,'Shop offer count mismatch');
eq(new Set(offers.map(x=>x.item.templateId)).size,offers.length,'Shop offers should not duplicate templates');

const trusted=engine.marketPrice(coat,{priceIndex:1,standing:80,familiarity:80,heat:0});
const hostile=engine.marketPrice(coat,{priceIndex:1,standing:-40,familiarity:0,heat:70});
lt(trusted,hostile,'Local reputation should improve equipment prices');

const auto=engine.autoEquip(engine.acquire(engine.acquire({},coat,{}).state,blade,{}).state);
eq(auto.state.equipped.weapon,'blade','Auto-equip should choose weapon');
eq(auto.state.equipped.outfit,'coat','Auto-equip should choose outfit');

assert(/ONE PIECE LIFE — V(?:8\.9|9\.\d+|10\.\d+)/.test(html),'V8.9+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=890,'Save version 890+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0',p=v.split('.').map(Number);assert(p[0]>8||(p[0]===8&&p[1]>=9),'Game version 8.9+ missing')}
for(const asset of ['src/data/equipment-v89.js','src/v89/equipment-engine-v89.js','src/v89/equipment-v89.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:8-9|9-\d+|10)-\d+/.test(sw),'PWA cache must remain at V8.9 or newer');
assert(html.includes('v88Ensure();v89Ensure()'),'Old-save V8.9 migration hook missing');
for(const fn of ['function v89Module','function v89Ensure','function v89EquipmentEffects','function v89CombatBonus','function v89MissionBonus','function v89MaybeLoot','function v89AnnualUpgrade','function v89UnequipSlot','function renderV89Equipment']){
  assert(html.includes(fn),'Missing live V8.9 bridge '+fn);
}
assert(html.includes("function v63GearDamageMult(){v63Ensure();if(typeof v89DamageMult==='function')return v89DamageMult();"),'Legacy gear damage handoff missing');
assert(html.includes("v89MissionBonus(m)"),'Mission equipment bonus integration missing');
assert(html.includes("v89CombatBonus()"),'Combat equipment bonus integration missing');
assert(html.includes("v89WearCombat(phasesWon>=2?2:4)"),'Combat durability wear missing');
assert(html.includes("v89MaybeLoot('combat'"),'Combat loot hook missing');
assert(html.includes("v89MaybeLoot('mission'"),'Mission loot hook missing');
assert(html.includes("v89MaybeLoot('treasure'"),'Exploration loot hook missing');
assert(html.includes("navigation:(game.player.skills?.Navigation||0)+v89NavigationBonus()"),'Travel equipment integration missing');
assert(html.includes('id="v89EquipmentCard"'),'V8.9 equipment UI missing');
assert(html.includes('renderV89Equipment();'),'V8.9 equipment render hook missing');
assert(html.includes("$('[data-v89-buy]').forEach"),'V8.9 shop binding missing');
assert(html.includes("$('[data-v89-unequip]').forEach"),'V8.9 unequip binding missing');

console.log('V8.9 EQUIPMENT, ITEMS & LOOT 4.0 QA OK',JSON.stringify({
  version:'8.9.0',
  templates:Object.keys(data.templates).length,
  lowRarity,highRarity,
  defense:+fx.defense.toFixed(2),
  offense:+fx.offense.toFixed(2),
  damageMult:fx.damageMult,
  repairCost,
  upgradedScore:+engine.itemScore(upgraded.item).toFixed(2),
  offers:offers.map(x=>x.item.templateId)
}));
