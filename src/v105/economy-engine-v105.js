(function(global){
'use strict';
const reg=global.OPL_MODULES,data=reg?.get('economyDataV105');if(!data)throw Error('V10.5 data unavailable');
const limit=(x,a,b)=>Math.min(b,Math.max(a,Number.isFinite(Number(x))?Number(x):a));
const int=(x,a=0,b=1e9)=>Math.floor(limit(x,a,b));
const keys=Object.keys(data.assets);
function normalize(raw={},year=0){
 const selection=keys.includes(raw.selected)?raw.selected:'workshop';
 const assets={};for(const id of keys){
  const v=raw.assets?.[id]||{};
  assets[id]={tier:int(v.tier,0,data.maxTier),spent:int(v.spent,0,1e12),revenue:int(v.revenue,0,1e12),expenses:int(v.expenses,0,1e12),
    operatedYear:int(v.operatedYear,-99,9999),operatedCount:int(v.operatedYear,0,9999)===int(year,0,9999)?int(v.operatedCount,0,2):0};
 }
 const history=Array.isArray(raw.history)?raw.history.slice(-30).filter(x=>x&&typeof x==='object').map(x=>({
  year:int(x.year,0,9999),id:keys.includes(x.id)?x.id:'unknown',action:String(x.action||'').slice(0,24),
  amount:Math.round(limit(x.amount,-1e9,1e9)),detail:String(x.detail||'').slice(0,120)
 })):[];
 return {version:1,year:int(year,0,9999),selected:selection,assets,history,
  totalInvestment:int(raw.totalInvestment,0,1e12),totalGross:int(raw.totalGross,0,1e12),
  totalCosts:int(raw.totalCosts,0,1e12),totalSales:int(raw.totalSales,0,1e12)};
}
function select(raw,id,year){const s=normalize(raw,year);if(keys.includes(id))s.selected=id;return s}
function investCost(id,tier,priceIndex=1){const a=data.assets[id];if(!a||tier>=data.maxTier)return Infinity;return Math.round(a.cost*Math.pow(1.72,tier)*limit(priceIndex,.75,1.7))}
function resale(id,tier,priceIndex=1){if(!data.assets[id]||tier<=0)return 0;let v=0;for(let i=0;i<tier;i++)v+=investCost(id,i,priceIndex);return Math.round(v*.56)}
function assetValue(s,priceIndex=1){return keys.reduce((n,id)=>n+resale(id,s.assets[id].tier,priceIndex),0)}
function perks(raw){
 const a=raw.assets||{},tier=k=>int(a[k]?.tier,0,3);
 return {workPayMultiplier:1+Math.min(.09,tier('shop')*.03),
  missionBonus:+(tier('network')*.85).toFixed(2),cargoCapacity:tier('transport')*6,
  workshopEfficiency:tier('workshop')*.04};
}
function gate(raw,id,ctx={}){
 const s=normalize(raw,ctx.year),type=s.selected,a=data.assets[type],row=s.assets[type];
 const opCost=id==='invest'?investCost(type,row.tier,ctx.priceIndex):id==='operate'?a.upkeep*row.tier:0;
 let reason='';
 if(!data.actions[id])reason='Action économique inconnue.';
 else if(ctx.alive===false)reason='Cette vie est terminée.';
 else if(ctx.pending||ctx.annual)reason='Décision ou transition annuelle en cours.';
 else if(ctx.travel)reason='Termine ta traversée pour gérer ces actifs.';
 else if(id==='invest'&&row.tier>=data.maxTier)reason='Actif au niveau maximal.';
 else if(id!=='invest'&&row.tier<1)reason='Achète cet actif avant de l’exploiter ou de le céder.';
 else if(id==='operate'&&row.operatedCount>=2)reason='Deux opérations maximum par actif chaque année.';
 else if(id!=='divest'&&limit(ctx.money,0,1e14)<opCost)reason='Berry insuffisants.';
 return {available:!reason,reason,id,asset:type,amount:opCost,selected:a.label,tier:row.tier,
  predictedSale:id==='divest'?resale(type,row.tier,ctx.priceIndex):0};
}
function apply(raw,id,ctx={}){
 const s=normalize(raw,ctx.year),g=gate(s,id,ctx);if(!g.available)return {ok:false,reason:g.reason,state:s};
 const row=s.assets[g.asset],info=data.assets[g.asset];let moneyDelta=0,detail='',success=true;
 if(id==='invest'){
  moneyDelta=-g.amount;row.spent+=g.amount;row.tier++;s.totalInvestment+=g.amount;
  detail='Niveau '+row.tier+' acquis';
 }else if(id==='divest'){
  moneyDelta=g.predictedSale;s.totalSales+=moneyDelta;row.tier=0;row.operatedCount=0;
  detail='Actif cédé contre '+moneyDelta+' B';
 }else if(id==='operate'){
  const chance=limit(.83-info.risk+limit(ctx.expertise,0,100)*.0015+limit(ctx.prosperity,0,100)*.001, .42,.97);
  success=limit(ctx.roll,0,1)<chance;
  const gross=success?Math.round(info.revenue*row.tier*(.84+limit(ctx.prosperity,0,100)/275)):Math.round(info.revenue*row.tier*.12);
  const upkeep=info.upkeep*row.tier;moneyDelta=gross-upkeep;
  row.revenue+=gross;row.expenses+=upkeep;s.totalGross+=gross;s.totalCosts+=upkeep;
  row.operatedYear=int(ctx.year,0,9999);row.operatedCount++;
  detail=success?'Opération fructueuse':'Opération déficitaire';
 }
 s.history.push({year:int(ctx.year,0,9999),id:g.asset,action:id,amount:moneyDelta,detail});
 s.history=s.history.slice(-30);
 return {ok:true,state:s,moneyDelta,success,detail,asset:g.asset,tier:row.tier}
}
reg.register('economyEngineV105',{version:'10.5.0',normalize,select,investCost,resale,assetValue,perks,gate,apply});
})(window);
