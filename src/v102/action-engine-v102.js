(function(global){
'use strict';
const r=global.OPL_MODULES,data=r?.get('actionDataV102');
if(!data)throw new Error('V10.2 action registry missing');
const integer=(n,min=0,max=1e9)=>Math.max(min,Math.min(max,Math.floor(Number.isFinite(Number(n))?Number(n):0)));
const known=Object.keys(data.actions);
function normalize(raw={},year=0){
  const y=integer(year),same=integer(raw.year)===y,spent={};
  for(const id of known)spent[id]=same?integer(raw.spent?.[id],0,data.actions[id].limit):0;
  const history=Array.isArray(raw.history)?raw.history.slice(-24).filter(x=>x&&typeof x==='object').map(x=>({
    year:integer(x.year),id:known.includes(x.id)?x.id:'unknown',efficiency:Math.max(0,Math.min(1,Number(x.efficiency)||0)),detail:String(x.detail||'').slice(0,110)
  })):[];
  const focus=Object.prototype.hasOwnProperty.call(data.trainingFocus,raw.trainingFocus)?raw.trainingFocus:'physical';
  return {version:2,year:y,spent,total:integer(raw.total),lastAction:known.includes(raw.lastAction)?raw.lastAction:'',trainingFocus:focus,history};
}
function migrate(oldV100={},year=0){
  const prior=oldV100&&typeof oldV100==='object'?oldV100:{};
  return normalize({year:prior.year,spent:prior.spent,total:prior.total,lastAction:prior.lastAction},year);
}
const needs={
  career:'Une carrière est nécessaire pour cette action.',
  land:'Termine ta traversée avant cette action.',
  mission:'Accepte d’abord une mission.',
  promotion:'Dossier de promotion indisponible.',
  recovery:'Santé et énergie déjà au maximum.',
  travel:'Choisis d’abord une destination.'
};
function status(raw,id,year,context={}){
  const s=normalize(raw,year),a=data.actions[id];
  if(!a)return {available:false,id,remaining:0,limit:0,cost:0,efficiency:0,reason:'Action inconnue.'};
  const count=s.spent[id]||0,remaining=a.limit-count,efficiency=a.yields[Math.min(count,a.yields.length-1)],energy=Number(context.energy??100);
  let reason='';
  if(context.alive===false)reason='Cette vie est terminée.';
  else if(context.pending)reason='Résous d’abord la décision en attente.';
  else if(remaining<=0)reason='Limite annuelle atteinte. Avance d’un an pour renouveler cette action.';
  else if(!Number.isFinite(energy)||energy<a.cost)reason='Énergie insuffisante.';
  else for(const gate of a.requires){
    if(context[gate]===false){reason=gate==='promotion'&&context.promotionReason?String(context.promotionReason):needs[gate];break}
  }
  return {available:!reason,id,remaining:Math.max(0,remaining),limit:a.limit,spent:count,cost:a.cost,
    efficiency,reason,label:a.label,repeatable:a.limit>1};
}
function perform(raw,id,year,context,applyEffect){
  const s=normalize(raw,year),st=status(s,id,year,context);
  if(!st.available)return {state:s,changed:false,reason:st.reason,...st};
  if(typeof applyEffect!=='function')return {state:s,changed:false,reason:'Effet manquant.'};
  const result=applyEffect(st);
  if(result===false||result?.ok===false)return {state:s,changed:false,reason:result?.reason||'Action non effectuée.'};
  s.spent[id]=(s.spent[id]||0)+1;
  s.total++;s.lastAction=id;
  s.history.push({year:integer(year),id,efficiency:st.efficiency,detail:String(result?.detail||aLabel(id)).slice(0,110)});
  if(s.history.length>24)s.history=s.history.slice(-24);
  return {state:s,changed:true,...st,remaining:st.remaining-1,result};
}
function aLabel(id){return data.actions[id]?.label||id}
function nextYear(s,year){return normalize(s,year)}
r.register('actionEngineV102',{version:'10.2.0',normalize,migrate,status,perform,nextYear});
})(window);
