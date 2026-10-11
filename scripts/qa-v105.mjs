import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,Math,JSON,Object,Array,String,Number,Set,Map};
context.window=context;vm.createContext(context);
for(const path of ['src/core/module-registry.js','src/data/economy-v105.js','src/v105/economy-engine-v105.js'])
  vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});
const mod=context.OPL_MODULES.get('economyEngineV105'),data=context.OPL_MODULES.get('economyDataV105');
assert(mod?.version==='10.5.0'&&data?.version==='10.5.0','V10.5 economy modules missing');
assert(Object.keys(data.assets).length===4,'Four playable investments expected');
const ctx={year:22,alive:true,pending:false,annual:false,travel:false,money:500000,priceIndex:1,
  expertise:50,prosperity:55,roll:0};
let s=mod.normalize({},22);
assert(s.selected==='workshop'&&s.assets.workshop.tier===0,'New portfolio should start empty');
assert(!mod.gate(s,'operate',ctx).available,'Operating a non-owned asset allowed');
assert(!mod.gate(s,'divest',ctx).available,'Selling a non-owned asset allowed');
assert(!mod.gate(s,'invest',{...ctx,money:20}).available,'Investing without funds allowed');
assert(!mod.gate(s,'invest',{...ctx,travel:true}).available,'Investing from a ship allowed');
assert(!mod.gate(s,'invest',{...ctx,pending:true}).available,'Investing during a pending decision allowed');
assert(!mod.gate(s,'invest',{...ctx,annual:true}).available,'Investing mid-year transition allowed');
assert(!mod.gate(s,'invest',{...ctx,alive:false}).available,'Dead characters can buy companies');
const original=JSON.stringify(s);
const first=mod.apply(s,'invest',ctx);
assert(first.ok&&first.moneyDelta===-16000&&first.state.assets.workshop.tier===1,'First acquisition not charged');
assert(JSON.stringify(s)===original,'Engine mutated original portfolio');
s=first.state;
assert(mod.perks(s).workshopEfficiency===.04,'Workshop trade perk incorrect');
assert(mod.assetValue(s,1)>0&&mod.assetValue(s,1)<16000,'Resale value should be less than purchase');
const success=mod.apply(s,'operate',ctx);
assert(success.ok&&success.success&&success.moneyDelta>0&&success.state.assets.workshop.operatedCount===1,'Manual operating income failed');
s=success.state;
const loss=mod.apply(s,'operate',{...ctx,roll:1});
assert(loss.ok&&!loss.success&&loss.moneyDelta<0&&loss.state.assets.workshop.operatedCount===2,'Failed business operation must cost money');
s=loss.state;
assert(!mod.gate(s,'operate',ctx).available,'Per-company annual operating cap bypassed');
const rolled=mod.normalize(s,23);
assert(rolled.assets.workshop.operatedCount===0&&rolled.assets.workshop.tier===1,'Next year should reset uses but preserve ownership');
assert(rolled.totalGross===s.totalGross&&rolled.totalCosts===s.totalCosts,'Annual update erased financial history');
const beforeSale=mod.resale('workshop',1,1);
const sold=mod.apply(rolled,'divest',{...ctx,year:23});
assert(sold.ok&&sold.moneyDelta===beforeSale&&sold.state.assets.workshop.tier===0,'Liquidation failed');
let portfolio=mod.normalize({},23);
for(const [id,kind] of Object.entries(data.assets)){
 portfolio=mod.select(portfolio,id,23);
 const acquisition=mod.apply(portfolio,'invest',{...ctx,year:23});
 assert(acquisition.ok&&acquisition.state.assets[id].tier===1,'Buying '+id+' failed');
 portfolio=acquisition.state
}
const perks=mod.perks(portfolio);
assert(perks.workPayMultiplier>1&&perks.missionBonus>0&&perks.cargoCapacity>0&&perks.workshopEfficiency>0,'Owned assets do not provide practical gameplay benefits');
assert(mod.assetValue(portfolio)>0,'Company holdings missing from net wealth');
portfolio=mod.select(portfolio,'shop',23);
for(let i=1;i<3;i++){const up=mod.apply(portfolio,'invest',{...ctx,year:23});assert(up.ok&&up.state.assets.shop.tier===i+1,'Asset upgrades unavailable');portfolio=up.state}
assert(!mod.gate(portfolio,'invest',{...ctx,year:23}).available,'Max-tier upgrade allowed');
assert(mod.perks(portfolio).workPayMultiplier<=1.09,'Career pay bonus exceeds cap');
const malformed=mod.normalize({selected:'__proto__',assets:{shop:{tier:999,spent:-5,operatedYear:28,operatedCount:7}},history:Array(60).fill({year:999999,detail:'x'.repeat(300),amount:1e30})},28);
assert(malformed.selected==='workshop'&&malformed.assets.shop.tier===3&&malformed.assets.shop.spent===0&&malformed.assets.shop.operatedCount===2,'Save corruption not constrained');
assert(malformed.history.length===30&&malformed.history.every(x=>x.detail.length<=120&&x.amount<=1e9),'Transaction history not bounded');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(html.includes("const GAME_VERSION = '10.5.0'")&&html.includes('src/v105/economy-engine-v105.js'),'V10.5 scripts not loaded');
assert(html.includes('function v105RenderPortfolio()')&&html.includes('function v105Gate(id)'),'V10.5 portfolio UI missing');
assert(sw.includes('one-piece-life-v10-5-0')&&sw.includes('src/v105/economy-engine-v105.js'),'Offline economy assets missing');
assert(manifest.description.includes('V10.5'),'Manifest version out of date');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
console.log('V10.5 ECONOMY QA OK',JSON.stringify({assets:Object.keys(data.assets).length,operations:success.state.assets.workshop.operatedCount,manualLoss:loss.moneyDelta,perks}));
