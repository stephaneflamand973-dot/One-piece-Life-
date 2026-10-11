(function(global){
'use strict';
const registry=global.OPL_MODULES,data=registry?.get('socialDataV104');if(!data)throw Error('V10.4 social data missing');
const finite=(n,d=0)=>Number.isFinite(Number(n))?Number(n):d;
const bounded=(n,a,b)=>Math.max(a,Math.min(b,finite(n)));
const int=(n,a=0,b=999999)=>Math.floor(bounded(n,a,b));
function normalize(raw={},year=0){
 const current=int(year,0,9999),same=int(raw.year,0,9999)===current;
 const counts={};
 if(same&&raw.counts&&typeof raw.counts==='object')
   for(const [key,val] of Object.entries(raw.counts).slice(0,300)){
     if(typeof key!=='string'||key.length>110||['__proto__','constructor','prototype'].includes(key))continue;
     counts[key]=int(val,0,data.limits.perRelation);
   }
 const last=Array.isArray(raw.history)?raw.history.slice(-40).filter(x=>x&&typeof x==='object').map(x=>({
   year:int(x.year,0,9999),id:String(x.id||'').slice(0,100),action:String(x.action||'').slice(0,24),
   accepted:!!x.accepted,label:String(x.label||'').slice(0,110)
 })):[];
 return {version:1,year:current,used:same?int(raw.used,0,data.limits.global):0,counts,
   lifetime:int(raw.lifetime,0,1e9),history:last}
}
function status(raw,relation,action,ctx={}){
 const s=normalize(raw,ctx.year),a=data.actions[action];
 if(!a)return {available:false,reason:'Interaction inconnue.',remaining:0,cost:0,money:0};
 if(!relation||!relation.id||relation.status==='left'||relation.status==='distant')return {available:false,reason:'Ce lien ne permet plus d’interagir.',remaining:0,cost:a.cost,money:a.money};
 const id=String(relation.id),count=s.counts[id]||0,remaining=Math.min(data.limits.perRelation-count,data.limits.global-s.used);
 let reason='';
 if(ctx.alive===false)reason='Cette vie est terminée.';
 else if(ctx.pending)reason='Résous d’abord la décision en attente.';
 else if(remaining<=0)reason='Interactions sociales épuisées pour cette année ou cette personne.';
 else if(finite(ctx.energy,0)<a.cost)reason='Énergie insuffisante.';
 else if(finite(ctx.money,0)<a.money)reason='Berry insuffisants.';
 else if(finite(ctx.age,0)<a.minAge)reason='Personnage trop jeune pour cette interaction.';
 else if(a.adult&&relation.adult!==true)reason='Cette relation ne comporte pas d’âge adulte confirmé.';
 else if(a.minTrust&&finite(relation.trust)<a.minTrust)reason='Confiance insuffisante.';
 else if(a.minAffection&&finite(relation.affection)<a.minAffection)reason='Affection insuffisante.';
 else if(a.minFamiliarity&&finite(relation.familiarity)<a.minFamiliarity)reason='Familiarité insuffisante.';
 else if(a.minRivalry&&finite(relation.rivalry)<a.minRivalry)reason='Il n’y a pas de conflit notable à résoudre.';
 else if(['flirt','date'].includes(action)&&ctx.partnerId&&ctx.partnerId!==id)reason='Tu es déjà engagé dans une autre relation.';
 else if(action==='date'&&ctx.partnerId===id)reason='Vous êtes déjà ensemble.';
 else if(action==='commit'&&(ctx.partnerId!==id||ctx.partnership!=='dating'))reason='Une relation de couple existante est nécessaire.';
 return {available:!reason,reason,remaining:Math.max(0,remaining),cost:a.cost,money:a.money,label:a.label}
}
function resolve(raw,relation,action,ctx={}){
 const s=normalize(raw,ctx.year),st=status(s,relation,action,ctx);
 if(!st.available)return {ok:false,reason:st.reason,state:s};
 const a=data.actions[action],compat=bounded(ctx.compatibility??50,0,100),trust=bounded(relation.trust,0,100),
   affection=bounded(relation.affection,0,100),rivalry=bounded(relation.rivalry,0,100);
 const nextNumber=s.counts[String(relation.id)]||0;
 const efficiency=[1,.82,.65][Math.min(nextNumber,2)];
 const roll=bounded(ctx.roll??.5,0,1);
 let chance=1;
 if(action==='flirt')chance=bounded(.30+compat*.004+affection*.002-rivalry*.003,.12,.87);
 if(action==='date')chance=bounded(.23+compat*.0035+trust*.002+affection*.002-rivalry*.003,.12,.88);
 if(action==='commit')chance=bounded(.22+compat*.003+trust*.003+affection*.0025-rivalry*.002,.18,.92);
 if(action==='reconcile')chance=bounded(.40+trust*.003+compat*.002-rivalry*.002,.20,.85);
 const accepted=roll<chance,delta={};
 for(const [key,value] of Object.entries(a.delta)){
   const effective=accepted?value:(value>0?-Math.max(1,Math.round(value*.35)):Math.min(2,Math.abs(value)));
   delta[key]=Math.round(effective*efficiency*100)/100
 }
 if(!accepted&&['flirt','date','commit'].includes(action))delta.rivalry=2;
 const label=accepted?a.label+' : interaction favorable':a.label+' : réponse défavorable';
 const next=normalize(s,ctx.year);
 next.used++;next.counts[String(relation.id)]=nextNumber+1;next.lifetime++;
 next.history.push({year:int(ctx.year,0,9999),id:String(relation.id).slice(0,100),action,accepted,label});
 if(next.history.length>40)next.history=next.history.slice(-40);
 return {ok:true,state:next,accepted,chance,efficiency,delta,energy:a.cost,money:a.money,
   bond:accepted?Math.round(a.bond*efficiency):Math.min(0,a.bond),
   grudge:accepted?a.grudge:2,
   partnership:accepted&&action==='date'?'dating':accepted&&action==='commit'?'committed':null,
   label}
}
registry.register('socialEngineV104',{version:'10.4.0',normalize,status,resolve});
})(window);
