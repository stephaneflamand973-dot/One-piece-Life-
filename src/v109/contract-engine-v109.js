(function(g){'use strict';
const r=g.OPL_MODULES,d=r?.get('contractDataV109');if(!d)throw Error('Contracts V10.9 missing');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),num=(x,f=0)=>Number.isFinite(Number(x))?Number(x):f;
const integer=(x,a=0,b=1e9)=>Math.floor(clamp(num(x),a,b)),str=(x,max=130)=>String(x||'').slice(0,max);
const kinds=Object.keys(d.kinds);
function normalize(raw={}){
 const s=raw&&typeof raw==='object'?raw:{};
 const offers=Array.isArray(s.offers)?s.offers.filter(x=>x&&typeof x==='object').slice(-18).map(x=>({
  id:str(x.id,110),contactKey:str(x.contactKey,180),contact:str(x.contact,110),faction:str(x.faction,55),
  kind:kinds.includes(x.kind)?x.kind:'diplomacy',region:str(x.region,80),island:str(x.island,100),
  year:integer(x.year,0,9999),difficulty:integer(x.difficulty,0,100),reward:integer(x.reward,0,30000),
  status:['available','completed','failed'].includes(x.status)?x.status:'available'
 })):[];
 const history=Array.isArray(s.history)?s.history.filter(x=>x&&typeof x==='object').slice(-28).map(x=>({
  id:str(x.id,110),year:integer(x.year,0,9999),kind:kinds.includes(x.kind)?x.kind:'diplomacy',
  contact:str(x.contact,110),success:!!x.success,berry:integer(x.berry,-10000,40000),
  healthLoss:integer(x.healthLoss,0,50),chance:clamp(num(x.chance,.5),0,1)
 })):[];
 return {version:1,selected:str(s.selected,110),total:integer(s.total),wins:integer(s.wins),
  net:integer(s.net,-1e12,1e12),offers,history};
}
function createOffer(raw,summary,ctx={}){
 const s=normalize(raw),contact=summary?.contact;
 if(!summary?.id||!contact||!summary.actor||!summary.faction)return {state:s,offer:null};
 const id='contract_'+str(summary.id,85);
 if(s.offers.some(o=>o.id===id))return {state:s,offer:null};
 if(!['success','failure','withdraw'].includes(summary.outcome))return {state:s,offer:null};
 const kind=(contact.rivalry>=25||summary.choices?.includes('attack')||summary.choices?.includes('fight'))?'challenge':
  contact.trust>=55&&summary.outcome==='success'?'alliance':'diplomacy';
 const difficulty=integer(clamp(28+num(ctx.danger,40)*.47+num(contact.rivalry)*.20-num(contact.trust,50)*.13,12,90),0,100);
 const reward=Math.round(d.kinds[kind].baseReward*(.78+difficulty*.009));
 const offer={id,contactKey:str(contact.key,180),contact:str(summary.actor,110),faction:str(summary.faction,55),
  kind,region:str(ctx.region,80),island:str(summary.island||ctx.island,100),year:integer(ctx.year,0,9999),
  difficulty,reward,status:'available'};
 // Keep at most 6 unresolved and retain the latest 18 records.
 const open=s.offers.filter(x=>x.status==='available');
 if(open.length>=6)return {state:s,offer:null};
 return {state:{...s,offers:[...s.offers,offer].slice(-18)},offer};
}
function select(raw,id,ctx={}){
 const s=normalize(raw),offer=s.offers.find(x=>x.id===id&&x.status==='available');
 if(!offer||offer.region!==ctx.region||ctx.pending||ctx.travel)return {ok:false,state:s,reason:'Contrat inaccessible dans cette région.'};
 return {ok:true,state:{...s,selected:s.selected===id?'':id},offer};
}
function odds(offer,ctx={}){
 if(!offer)return null;
 const profile=d.kinds[offer.kind]||d.kinds.diplomacy;
 const skill=clamp(num(ctx.skills?.[profile.skill]),0,100),power=clamp(num(ctx.power),0,200);
 const trust=clamp(num(ctx.trust,50),0,100),rivalry=clamp(num(ctx.rivalry),0,100);
 const support=clamp(num(ctx.crewSupport),0,100);
 const chance=clamp(.55+skill*.0026+power*.0008+support*.0007+
   (trust-50)*(offer.kind==='challenge'?-.00035:.0014)-
   rivalry*(offer.kind==='challenge'?-.00035:.0009)-
   offer.difficulty*.0048,.12,.94);
 const injuryChance=clamp((.06+offer.difficulty*.004)*profile.healthRisk,0,.68);
 return {chance,injuryChance,profile};
}
function status(raw,ctx={}){
 const s=normalize(raw),offer=s.offers.find(x=>x.id===s.selected&&x.status==='available');
 if(!offer)return {available:false,reason:'Sélectionne un contrat proposé par un ancien contact.',offer:null};
 const o=odds(offer,ctx),cost=o.profile.cost;
 let reason='';
 if(ctx.alive===false)reason='Ce personnage ne peut plus agir.';
 else if(ctx.pending)reason='Résous la décision en attente.';
 else if(ctx.travel)reason='Termine la traversée avant de gérer ce contrat.';
 else if(num(ctx.age,0)<12)reason='Les contrats se débloquent à partir de 12 ans.';
 else if(offer.region!==ctx.region)reason='Ce contact agit dans la région '+offer.region+'.';
 else if(num(ctx.money)<cost)reason='Il manque des Berry pour préparer le contrat.';
 else if(num(ctx.energy)<o.profile.energy)reason='Énergie insuffisante.';
 return {available:!reason,reason,offer,cost,energy:o.profile.energy,chance:o.chance,injuryChance:o.injuryChance};
}
function perform(raw,ctx={},rolls={}){
 const s=normalize(raw),gate=status(s,ctx);if(!gate.available)return {ok:false,reason:gate.reason,state:s};
 const offer=gate.offer,profile=d.kinds[offer.kind],success=clamp(num(rolls.success,.5),0,1)<gate.chance;
 const healthLoss=!success&&clamp(num(rolls.injury,1),0,1)<gate.injuryChance?
  Math.max(1,Math.round((3+offer.difficulty*.10)*profile.healthRisk)):0;
 const earned=success?offer.reward:0,net=earned-gate.cost;
 const trustDelta=success?profile.trust:Math.min(-2,Math.floor(profile.trust/2)),
  rivalryDelta=success?profile.rivalry:Math.max(3,Math.round(Math.abs(profile.rivalry)*.6));
 const entry={id:offer.id,year:integer(ctx.year,0,9999),kind:offer.kind,contact:offer.contact,
  success,berry:net,healthLoss,chance:gate.chance};
 const state={...s,selected:'',total:s.total+1,wins:s.wins+(success?1:0),net:s.net+net,
  offers:s.offers.map(x=>x.id===offer.id?{...x,status:success?'completed':'failed'}:x),
  history:[...s.history,entry].slice(-28)};
 return {ok:true,state,offer,success,earned,cost:gate.cost,net,energy:gate.energy,healthLoss,
  trustDelta,rivalryDelta,detail:(success?'Contrat accompli':'Contrat échoué')+' • '+(net>=0?'+':'')+net+' B'};
}
r.register('contractEngineV109',{version:'10.9.0',normalize,createOffer,select,odds,status,perform});
})(window);