import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/markets-v88.js','utf8');
const engineSrc=fs.readFileSync('src/v88/market-engine-v88.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'markets-v88.js'});
vm.runInContext(engineSrc,sandbox,{filename:'market-engine-v88.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('marketDataV88'),engine=registry.get('marketEngineV88');
assert(data&&engine,'V8.8 market modules not registered');
eq(data.version,'8.8.0','Market data version mismatch');
eq(engine.version,'8.8.0','Market engine version mismatch');
eq(Object.keys(data.goods).length,8,'Trade good count mismatch');

const forest={region:'South Blue',danger:12,tags:['Nature','Navires']};
const city={region:'Grand Line',danger:30,tags:['Commerce','Ville','Gouvernement']};
const neutral={region:'East Blue',danger:10,tags:['Village']};

const cheapTimber=engine.price('timber','buy',{place:forest,priceIndex:1,standing:10,familiarity:10,heat:0,expertise:0});
const costlyTimber=engine.price('timber','buy',{place:city,priceIndex:1,standing:10,familiarity:10,heat:0,expertise:0});
lt(cheapTimber,costlyTimber,'Supply/demand should create geographic price difference');

const neutralBuy=engine.price('tools','buy',{place:neutral,priceIndex:1,standing:10,familiarity:10,heat:0,expertise:0});
const trustedBuy=engine.price('tools','buy',{place:neutral,priceIndex:1,standing:80,familiarity:80,heat:0,expertise:.8});
lt(trustedBuy,neutralBuy,'Standing, familiarity and expertise should improve buy price');

const heatedSell=engine.price('tools','sell',{place:neutral,priceIndex:1,standing:10,familiarity:10,heat:80,expertise:0});
const calmSell=engine.price('tools','sell',{place:neutral,priceIndex:1,standing:10,familiarity:10,heat:0,expertise:0});
lt(heatedSell,calmSell,'Heat should reduce sale conditions');

const capFoot=engine.capacity({hasShip:false,shipTier:0,enterpriseLevel:0});
const capShip=engine.capacity({hasShip:true,shipTier:2,enterpriseLevel:1});
gt(capShip,capFoot,'Ship and enterprise should increase cargo capacity');

const base=engine.normalizeState({});
const buy=engine.buy(base,'timber',2,{place:forest,island:'Forest Port',year:20,priceIndex:1,standing:20,familiarity:20,heat:0,expertise:.2,money:100000,hasShip:true,shipTier:1,enterpriseLevel:0});
assert(!buy.error,'Valid cargo purchase failed');
eq(buy.state.cargo.timber.qty,2,'Purchased cargo quantity mismatch');
gt(buy.cost,0,'Purchase should cost money');

const sell=engine.sell(buy.state,'timber',2,{place:city,island:'Trade City',year:21,priceIndex:1.15,standing:30,familiarity:25,heat:0,expertise:.4,hasShip:true,shipTier:1,enterpriseLevel:0});
assert(!sell.error,'Valid cargo sale failed');
eq(sell.state.cargo.timber,undefined,'Sold cargo should leave inventory');
gt(sell.revenue,0,'Sale should generate revenue');
assert(Number.isFinite(sell.profit),'Profit should be tracked');
eq(Object.keys(sell.state.routes).length,1,'Cross-island sale should register a route');

const tiny=engine.buy(base,'timber',99,{place:forest,island:'Forest Port',year:20,priceIndex:1,standing:0,familiarity:0,heat:0,expertise:0,money:999999,hasShip:false,shipTier:0,enterpriseLevel:0});
eq(tiny.error,'capacity','Cargo capacity guard missing');

const market=engine.market(city,{priceIndex:1.1,standing:30,familiarity:20,heat:0,expertise:.3});
eq(market.length,8,'Market summary should expose every trade good');
assert(market.every(x=>x.buy>x.sell),'Market spread should prevent same-island buy/sell exploit');

assert(/ONE PIECE LIFE — V(?:[89]|\d{2,})\.\d+/.test(html),'V8.8+ title missing');
assert(Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0)>=880,'Save version 880+ missing');
{const v=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0',p=v.split('.').map(Number);assert(p[0]>8||(p[0]===8&&p[1]>=8),'Game version 8.8+ missing')}
for(const asset of ['src/data/markets-v88.js','src/v88/market-engine-v88.js','src/v88/markets-v88.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:8-[8-9]|9-\d+|10|10)-\d+/.test(sw),'PWA cache must remain at V8.8 or newer');
assert(html.includes('v87Ensure();v88Ensure()'),'Old-save V8.8 migration hook missing');
for(const fn of ['function v88Module','function v88Ensure','function v88Context','function v88MarketAvailable','function v88Trade','function renderV88Market']){
  assert(html.includes(fn),'Missing live V8.8 bridge '+fn);
}
assert(html.includes('id="v88MarketCard"'),'V8.8 market UI missing');
assert(html.includes('renderV87Settlement();renderV88Market();'),'V8.8 world render hook missing');
assert(html.includes("$$('[data-v88-buy]').forEach"),'V8.8 market bindings missing');
assert(html.includes("if(id==='market'){toast('Le marché détaillé V8.8 est disponible dans la section Commerce & cargaison.');return false}"),'V8.7 market handoff missing');

console.log('V8.8 MARKETS, CARGO & TRADE 4.0 QA OK',JSON.stringify({
  version:'8.8.0',
  goods:Object.keys(data.goods).length,
  cheapTimber,costlyTimber,neutralBuy,trustedBuy,
  capFoot,capShip,
  route:Object.keys(sell.state.routes)[0],
  profit:Math.round(sell.profit)
}));
