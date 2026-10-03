(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('marketDataV88');if(!data)throw new Error('Market data V8.8 missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=v=>Number(v)||0,clone=o=>JSON.parse(JSON.stringify(o));
const round50=n=>Math.max(50,Math.round(n/50)*50);

function normalizeState(state={}){
  const cargo={};
  for(const [id,row] of Object.entries(state.cargo&&typeof state.cargo==='object'?state.cargo:{})){
    if(!data.goods[id])continue;
    const qty=Math.max(0,Math.floor(num(row.qty)));
    if(qty>0)cargo[id]={qty,avgCost:Math.max(0,num(row.avgCost)),origin:String(row.origin||'Inconnu')};
  }
  const routes={};
  for(const [k,v] of Object.entries(state.routes&&typeof state.routes==='object'?state.routes:{})){
    routes[k]={trips:Math.max(0,Math.floor(num(v.trips))),profit:num(v.profit),revenue:Math.max(0,num(v.revenue)),bestProfit:num(v.bestProfit)};
  }
  return {
    version:1,cargo,routes,
    totalBought:Math.max(0,num(state.totalBought)),
    totalSold:Math.max(0,num(state.totalSold)),
    realizedProfit:num(state.realizedProfit),
    unitsBought:Math.max(0,Math.floor(num(state.unitsBought))),
    unitsSold:Math.max(0,Math.floor(num(state.unitsSold))),
    history:Array.isArray(state.history)?clone(state.history).slice(0,50):[]
  };
}
function cargoUsed(state){
  const s=normalizeState(state);let used=0;
  for(const [id,row] of Object.entries(s.cargo))used+=(data.goods[id]?.size||1)*row.qty;
  return used;
}
function capacity(ctx={}){
  const ship=ctx.hasShip?22+Math.max(0,Math.floor(num(ctx.shipTier)))*12:0;
  const enterprise=Math.max(0,Math.floor(num(ctx.enterpriseLevel)))*8;
  return 10+ship+enterprise;
}
function signal(good,place={}){
  const tags=Array.isArray(place.tags)?place.tags:[],region=String(place.region||'');
  const supply=good.supply.filter(t=>tags.includes(t)||t===region).length;
  const demand=good.demand.filter(t=>tags.includes(t)||t===region).length;
  const score=demand-supply;
  const label=score>=2?'Demande forte':score===1?'Demande':score<=-2?'Surplus local':score===-1?'Offre abondante':'Marché stable';
  return {supply,demand,score,label};
}
function price(goodId,side='buy',ctx={}){
  const good=data.goods[goodId];if(!good)return 0;
  const sig=signal(good,ctx.place||{});
  const priceIndex=clamp(num(ctx.priceIndex)||1,.65,2.2),danger=clamp(num(ctx.danger),0,100);
  const standing=clamp(num(ctx.standing),-100,100),familiarity=clamp(num(ctx.familiarity),0,100),heat=clamp(num(ctx.heat),0,100),expertise=clamp(num(ctx.expertise),0,1);
  const local=clamp(1-sig.supply*.12+sig.demand*.14+danger*.0012,.62,1.72);
  const negotiation=clamp(standing*.0008+familiarity*.0004-heat*.0012,-.08,.12);
  const reference=good.base*priceIndex*local;
  const factor=side==='sell'?(.88+expertise*.03+negotiation*.35):(1.08-expertise*.02-negotiation*.5);
  return round50(reference*factor);
}
function market(place={},ctx={}){
  return Object.entries(data.goods).map(([id,good])=>{
    const sig=signal(good,place);
    const full={...ctx,place,danger:ctx.danger??place.danger};
    return {id,...good,buy:price(id,'buy',full),sell:price(id,'sell',full),signal:sig};
  }).sort((a,b)=>(a.signal.score-b.signal.score)||a.buy-b.buy);
}
function buy(state,goodId,qty=1,ctx={}){
  const s=normalizeState(state),good=data.goods[goodId];if(!good)return {state:s,error:'unknown_good'};
  qty=Math.max(1,Math.floor(num(qty)));
  const cap=capacity(ctx),used=cargoUsed(s),space=good.size*qty;
  if(used+space>cap)return {state:s,error:'capacity',capacity:cap,used,needed:space};
  const unit=price(goodId,'buy',ctx),cost=unit*qty;
  if(num(ctx.money)<cost)return {state:s,error:'insufficient_funds',cost,unit};
  const old=s.cargo[goodId]||{qty:0,avgCost:0,origin:String(ctx.island||'Inconnu')},newQty=old.qty+qty;
  s.cargo[goodId]={
    qty:newQty,
    avgCost:(old.avgCost*old.qty+cost)/newQty,
    origin:old.qty>0&&old.origin!==String(ctx.island||'Inconnu')?'Mixte':String(ctx.island||old.origin||'Inconnu')
  };
  s.totalBought+=cost;s.unitsBought+=qty;
  s.history.unshift({type:'buy',island:String(ctx.island||''),goodId,qty,unit,total:cost,year:num(ctx.year)});
  s.history=s.history.slice(0,50);
  return {state:s,goodId,qty,unit,cost,moneyDelta:-cost,capacity:cap,used:cargoUsed(s)};
}
function sell(state,goodId,qty=1,ctx={}){
  const s=normalizeState(state),good=data.goods[goodId];if(!good)return {state:s,error:'unknown_good'};
  const old=s.cargo[goodId];if(!old||old.qty<=0)return {state:s,error:'no_cargo'};
  qty=Math.max(1,Math.min(old.qty,Math.floor(num(qty))));
  const unit=price(goodId,'sell',ctx),revenue=unit*qty,costBasis=old.avgCost*qty,profit=revenue-costBasis,origin=old.origin||'Inconnu';
  old.qty-=qty;if(old.qty<=0)delete s.cargo[goodId];else s.cargo[goodId]=old;
  s.totalSold+=revenue;s.unitsSold+=qty;s.realizedProfit+=profit;
  const island=String(ctx.island||'Inconnu'),route=origin+' → '+island;
  if(origin!=='Mixte'&&origin!==island){
    const r=s.routes[route]||{trips:0,profit:0,revenue:0,bestProfit:0};
    r.trips++;r.profit+=profit;r.revenue+=revenue;r.bestProfit=Math.max(r.bestProfit,profit);s.routes[route]=r;
  }
  s.history.unshift({type:'sell',island,origin,route,goodId,qty,unit,total:revenue,profit,year:num(ctx.year)});
  s.history=s.history.slice(0,50);
  return {state:s,goodId,qty,unit,revenue,profit,moneyDelta:revenue,route,capacity:capacity(ctx),used:cargoUsed(s)};
}
function summary(state,ctx={}){
  const s=normalizeState(state),used=cargoUsed(s),cap=capacity(ctx);
  let costValue=0,units=0;
  for(const row of Object.values(s.cargo)){units+=row.qty;costValue+=row.avgCost*row.qty}
  return {state:s,used,capacity:cap,units,costValue,totalBought:s.totalBought,totalSold:s.totalSold,realizedProfit:s.realizedProfit,routeCount:Object.keys(s.routes).length,history:s.history.slice(0,8)};
}
registry.register('marketEngineV88',{version:'8.8.0',normalizeState,cargoUsed,capacity,signal,price,market,buy,sell,summary});
})(window);
