(function(global){
'use strict';
const r=global.OPL_MODULES,d=r?.get('adventureDataV106');if(!d)throw Error('V10.6 adventure data missing');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),num=(x,f=0)=>Number.isFinite(Number(x))?Number(x):f;
const bounded=(x,a=0,b=100)=>clamp(num(x),a,b),integer=(x,a=0,b=1e9)=>Math.floor(bounded(x,a,b));
const keys=Object.keys(d.actions);
function normalize(raw={},year=0,island=''){
 const s=raw&&typeof raw==='object'?raw:{},place=String(island||s.island||'').slice(0,100);
 const changed=s.island&&place&&s.island!==place,sameYear=integer(s.year,0,9999)===integer(year,0,9999),approach=d.approaches[s.approach]?s.approach:'balanced';
 const history=Array.isArray(s.history)?s.history.filter(e=>e&&typeof e==='object').slice(-24).map(e=>({
  year:integer(e.year,0,9999),kind:keys.includes(e.kind)?e.kind:'expedition_scout',
  place:String(e.place||'').slice(0,100),success:!!e.success,detail:String(e.detail||'').slice(0,140)
 })):[];
 return {version:1,year:integer(year,0,9999),island:place,approach,
  preparedness:changed?0:bounded(s.preparedness,0,80),
  commandBoost:sameYear?bounded(s.commandBoost,0,12):0,
  missionId:String(s.missionId||'').slice(0,140),
  missionBonus:bounded(s.missionBonus,0,14),
  expeditions:integer(s.expeditions),discoveries:integer(s.discoveries),missionPlans:integer(s.missionPlans),
  totalCosts:integer(s.totalCosts,0,1e12),history};
}
function selectApproach(raw,id,year,island){
 const s=normalize(raw,year,island);
 return d.approaches[id]?{...s,approach:id}:s
}
function status(raw,id,ctx={}){
 const s=normalize(raw,ctx.year,ctx.island),a=d.actions[id],energy=num(ctx.energy,0),money=num(ctx.money,0);
 if(!a)return {available:false,reason:'Action aventure inconnue.',cost:0,energy:0};
 const costs={expedition_prepare:5,expedition_scout:10,expedition_coordinate:6,expedition_command:8};
 const energyCost=costs[id],moneyCost=a.money;let reason='';
 if(ctx.alive===false)reason='Cette vie est terminée.';
 else if(ctx.pending)reason='Résous d’abord la décision en cours.';
 else if(ctx.travel)reason='Termine la traversée avant cette expédition.';
 else if(num(ctx.age)<12)reason='Les expéditions autonomes se débloquent à 12 ans.';
 else if(id==='expedition_prepare'&&s.preparedness>=80)reason='Expédition déjà préparée au maximum.';
 else if(id==='expedition_coordinate'&&!ctx.missionId)reason='Accepte une mission avant de la préparer.';
 else if(id==='expedition_coordinate'&&s.missionId===String(ctx.missionId)&&s.missionBonus>=14)reason='Cette mission est déjà préparée au maximum.';
 else if(id==='expedition_command'&&!ctx.crewActive)reason='Un équipage actif est nécessaire.';
 else if(id==='expedition_command'&&s.commandBoost>=12)reason='Équipage déjà mobilisé au maximum.';
 else if(energy<energyCost)reason='Énergie insuffisante.';
 else if(money<moneyCost)reason='Berry insuffisants pour le matériel prévu.';
 return {available:!reason,reason,energy:energyCost,cost:moneyCost,label:a.label}
}
function missionBonus(raw,missionId,year,island){
 const s=normalize(raw,year,island);
 return clamp((s.missionId===String(missionId||'')?s.missionBonus:0)+s.commandBoost*.35,0,18)
}
function scoutPreview(raw,ctx={}){
 const s=normalize(raw,ctx.year,ctx.island),strategy=d.approaches[s.approach];
 const skill=bounded(ctx.navigation)*.18+bounded(ctx.stealth)*.16+bounded(ctx.crewSupport)*.11+
  s.preparedness*.17+s.commandBoost*.35;
 const chance=clamp(.57+skill/130+strategy.success-bounded(ctx.danger)*.003,.22,.94);
 const injuryChance=clamp((.10+bounded(ctx.danger)*.003)*strategy.risk,0,.75);
 return {chance,injuryChance,skill};
}
function perform(raw,id,ctx={}){
 const s=normalize(raw,ctx.year,ctx.island),gate=status(s,id,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason,state:s};
 const next={...s,history:[...s.history]},strategy=d.approaches[s.approach],roll=clamp(num(ctx.roll,.5),0,1);
 let success=true,detail='',healthLoss=0,bonus=0;
 if(id==='expedition_prepare'){
  const gain=Math.round((18+bounded(ctx.navigation)*.045+bounded(ctx.crewSupport)*.04)*(num(ctx.efficiency,1)));
  next.preparedness=bounded(s.preparedness+gain,0,80);detail='Préparation '+Math.round(s.preparedness)+' → '+Math.round(next.preparedness)+'/80';
 }else if(id==='expedition_command'){
  const gain=Math.max(2,Math.round((5+bounded(ctx.command)*.055)*num(ctx.efficiency,1)));
  next.commandBoost=bounded(s.commandBoost+gain,0,12);detail='Coordination '+Math.round(s.commandBoost)+' → '+Math.round(next.commandBoost)+'/12';
 }else if(id==='expedition_coordinate'){
  const missionId=String(ctx.missionId);
  const current=s.missionId===missionId?s.missionBonus:0;
  bonus=Math.max(2,Math.round((5+bounded(ctx.command)*.06)*num(ctx.efficiency,1)));
  next.missionId=missionId;next.missionBonus=bounded(current+bonus,0,14);next.missionPlans++;
  detail='Plan tactique +'+(next.missionBonus-current).toFixed(0)+' • '+next.missionBonus+'/14';
 }else{
  const odds=scoutPreview(s,ctx),chance=odds.chance;
  success=roll<chance;
  if(!success&&clamp(num(ctx.injuryRoll,1),0,1)<odds.injuryChance)
    healthLoss=Math.max(1,Math.round((3+bounded(ctx.danger)*.09)*strategy.risk));
  next.expeditions++;if(success){next.discoveries++;next.preparedness=Math.max(0,s.preparedness-18)}
  else next.preparedness=Math.max(0,s.preparedness-8);
  detail=(success?'Reconnaissance réussie':'Expédition contrariée')+' • réussite '+Math.round(chance*100)+' %'+(healthLoss?' • blessure -'+healthLoss:'');
 }
 next.totalCosts+=gate.cost;
 next.history.push({year:integer(ctx.year,0,9999),kind:id,place:String(ctx.island||'').slice(0,100),success,detail});
 next.history=next.history.slice(-24);
 return {ok:true,state:next,success,detail,healthLoss,energy:gate.energy,cost:gate.cost,approach:next.approach,discoveryFactor:strategy.discovery}
}
function consumeMission(raw,missionId,year,island){
 const s=normalize(raw,year,island);if(s.missionId!==String(missionId||''))return s;
 return {...s,missionId:'',missionBonus:0}
}
r.register('adventureEngineV106',{version:'10.6.0',normalize,selectApproach,status,scoutPreview,perform,missionBonus,consumeMission});
})(window);
