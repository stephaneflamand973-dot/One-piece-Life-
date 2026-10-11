(function(global){
'use strict';
const r=global.OPL_MODULES,data=r?.get('economyDataV105');if(!data)throw Error('V10.5 economy data missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const integer=(v,a=0,b=1e9)=>Math.floor(clamp(num(v),a,b));
const keys=Object.keys(data.assets);
function normalize(raw={},year=0){
 const holdings={};
 for(const [id,def] of Object.entries(data.assets))holdings[id]=integer(raw?.holdings?.[id],0,def.max);
 const h=Array.isArray(raw?.history)?raw.history.slice(-30).filter(x=>x&&typeof x==='object').map(x=>({
  year:integer(x.year,0,9999),type:['buy','operate'].includes(x.type)?x.type:'buy',
  id:keys.includes(x.id)?x.id:'unknown',amount:Math.round(clamp(num(x.amount),-1e10,1e10)),success:!!x.success
 })):[];
 const y=integer(year,0,9999),same=integer(raw?.year,0,9999)===y;
 return {version:1,year:y,holdings,bought:same?integer(raw.bought,0,data.buyLimit):0,
  operated:same?integer(raw.operated,0,data.operateLimit):0,
  purchaseTarget:keys.includes(raw?.purchaseTarget)?raw.purchaseTarget:'dojo',
  operateTarget:keys.includes(raw?.operateTarget)&&data.assets[raw.operateTarget].category==='business'?raw.operateTarget:'shop',
  invested:integer(raw?.invested,0,1e12),netOperating:Math.round(clamp(num(raw?.netOperating),-1e12,1e12)),
  history:h}
}
function purchasePrice(state,id,index=1){
 const def=data.assets[id];if(!def)return Infinity;
 const level=integer(state?.holdings?.[id],0,def.max);
 if(level>=def.max)return Infinity;
 return Math.round(def.base*Math.pow(1.75,level)*clamp(num(index,1),.7,2.2));
}
function perks(state={}){
 const h=normalize(state,state?.year).holdings;
 return {training:1+h.dojo*.09,recovery:1+h.clinic*.18,navigationCost:Math.max(3,8-h.navigation*2),
  tradeExpertise:h.shop*.025,missionSupport:h.navigation*.65+h.shipyard*.35};
}
function purchaseStatus(state,id,ctx={}){
 const s=normalize(state,ctx.year),d=data.assets[id];
 if(!d)return {available:false,reason:'Actif inconnu.',cost:0};
 const cost=purchasePrice(s,id,ctx.priceIndex),energy=2;
 let reason='';
 if(ctx.alive===false)reason='Cette vie est terminée.';
 else if(ctx.pending)reason='Résous la décision en cours.';
 else if(ctx.travel)reason='Impossible d’investir durant une traversée.';
 else if(num(ctx.age)<18)reason='Investissement réservé aux personnages majeurs.';
 else if(s.bought>=data.buyLimit)reason='Limite de deux acquisitions par an atteinte.';
 else if(s.holdings[id]>=d.max)reason='Actif au niveau maximal.';
 else if(num(ctx.energy,0)<energy)reason='Énergie insuffisante.';
 else if(num(ctx.money,0)<cost)reason='Berry insuffisants pour cet achat.';
 return {available:!reason,reason,cost,energy,level:s.holdings[id],max:d.max,label:d.label}
}
function buy(state,id,ctx={}){
 const s=normalize(state,ctx.year),st=purchaseStatus(s,id,ctx);
 if(!st.available)return {ok:false,reason:st.reason,state:s};
 const next={...s,holdings:{...s.holdings,[id]:s.holdings[id]+1},bought:s.bought+1,invested:s.invested+st.cost};
 next.history=[...s.history,{year:integer(ctx.year,0,9999),type:'buy',id,amount:-st.cost,success:true}].slice(-30);
 return {ok:true,state:next,cost:st.cost,energy:st.energy,level:next.holdings[id]}
}
function operatingStatus(state,id,ctx={}){
 const s=normalize(state,ctx.year),d=data.assets[id];
 if(!d||d.category!=='business')return {available:false,reason:'Activité professionnelle inconnue.'};
 const level=s.holdings[id]||0,energy=7,fee=d.operatingCost*level;
 let reason='';
 if(ctx.alive===false)reason='Cette vie est terminée.';
 else if(ctx.pending)reason='Résous la décision en cours.';
 else if(ctx.travel)reason='Gestion locale indisponible pendant une traversée.';
 else if(level<=0)reason='Achète d’abord cette entreprise.';
 else if(s.operated>=data.operateLimit)reason='Limite annuelle de trois exploitations atteinte.';
 else if(num(ctx.energy,0)<energy)reason='Énergie insuffisante.';
 else if(num(ctx.money,0)<fee)reason='Trésorerie insuffisante pour couvrir les frais.';
 return {available:!reason,reason,level,energy,fee,label:d.label}
}
function operate(state,id,ctx={}){
 const s=normalize(state,ctx.year),st=operatingStatus(s,id,ctx);
 if(!st.available)return {ok:false,reason:st.reason,state:s};
 const d=data.assets[id],roll=clamp(num(ctx.roll,.5),0,1),skill=clamp(num(ctx.skill),0,100);
 const prosperity=clamp(num(ctx.prosperity,50),0,100),price=clamp(num(ctx.priceIndex,1),.7,2.2);
 const chance=clamp(.62+skill*.0015+(prosperity-50)*.002,.40,.85);
 const success=roll<chance,efficiency=clamp(num(ctx.efficiency,1),.25,1);
 const fee=st.fee;
 const revenue=success?Math.round(d.revenue*st.level*(.75+prosperity/210)*price*efficiency):0;
 const net=revenue-fee;
 const next={...s,operated:s.operated+1,netOperating:s.netOperating+net};
 next.history=[...s.history,{year:integer(ctx.year,0,9999),type:'operate',id,amount:net,success}].slice(-30);
 return {ok:true,state:next,revenue,fee,net,success,chance,energy:st.energy}
}
function wealth(state,liquid=0,ctx={}){
 const s=normalize(state,ctx.year),index=clamp(num(ctx.priceIndex,1),.7,2.2);
 const holdings=Object.entries(data.assets).reduce((total,[id,d])=>{
  let level=s.holdings[id]||0,worth=0;
  for(let i=0;i<level;i++)worth+=d.base*Math.pow(1.75,i)*index*.72;
  return total+worth
 },0);
 return {liquid:Math.max(0,num(liquid)),assetValue:Math.round(holdings),netWorth:Math.round(Math.max(0,num(liquid))+holdings)}
}
r.register('economyEngineV105',{version:'10.5.0',normalize,purchasePrice,purchaseStatus,buy,operatingStatus,operate,perks,wealth});
})(window);
