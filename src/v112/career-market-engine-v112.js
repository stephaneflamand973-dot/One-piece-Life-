(function(global){
'use strict';
const r=global.OPL_MODULES,data=r?.get('careerMarketDataV112');
if(!data)throw Error('Career market data missing');
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(n))?Number(n):min));
const ageOf=c=>Math.max(0,Math.floor(Number(c.age)||0));
function normalize(raw={},year=0){
 const r=raw&&typeof raw==='object'?raw:{};
 return {version:1,year:Math.max(0,Math.floor(Number(year)||0)),
  current:r.current&&typeof r.current==='object'?{
   kind:r.current.kind==='special'?'special':'ordinary',id:String(r.current.id||'').slice(0,60),
   startYear:Math.floor(clamp(r.current.startYear,0,9999))
  }:null,
  applications:Array.isArray(r.applications)?r.applications.slice(-24).filter(x=>x&&typeof x==='object').map(x=>({
   id:String(x.id||'').slice(0,60),year:Math.floor(clamp(x.year,0,9999)),
   accepted:!!x.accepted,kind:x.kind==='special'?'special':'ordinary',
   chance:clamp(x.chance,0,1)})):[],
  history:Array.isArray(r.history)?r.history.slice(-25).filter(x=>x&&typeof x==='object').map(x=>({
   kind:String(x.kind||'').slice(0,25),title:String(x.title||'').slice(0,100),
   year:Math.floor(clamp(x.year,0,9999))})):[],
  selected:r.selected==='special'?'special':'ordinary',
  allOffers:!!r.allOffers};
}
const all=()=>[...data.ordinary,...data.special];
const byId=id=>all().find(x=>x.id===id)||null;
function skillValue(job,ctx={}){
 const stats=ctx.stats||{},skills=ctx.skills||{};
 const key=job.skill;
 const source=Number(skills[key]??stats[key]);
 if(Number.isFinite(source))return clamp(source,0,100);
 if(key==='Physique')return clamp(Math.max(Number(stats.Force)||0,Number(stats.Endurance)||0),0,100);
 if(key==='Endurance')return clamp(Number(stats.Endurance)||Number(stats.Vitalité)||0,0,100);
 if(key==='Intelligence')return clamp(Number(stats.Intelligence)||Number(stats.Esprit)||0,0,100);
 if(key==='Charisme')return clamp(Number(stats.Charisme)||Number(stats.Volonté)||0,0,100);
 return 0;
}
function lockedReason(job,ctx={},state){
 if(!job)return 'Offre inconnue.';
 if(!ctx.alive)return 'Cette vie est terminée.';
 if(ctx.pending)return 'Résous la décision en cours.';
 if(ctx.annual)return 'Termine l’année en cours.';
 if(ctx.travel)return 'Il faut être à terre pour postuler.';
 if(ageOf(ctx)<job.minAge)return 'Disponible à '+job.minAge+' ans.';
 if(state?.current||ctx.career&&ctx.career!=='Aucune')return 'Démissionne de ton poste actuel avant de changer de carrière.';
 if(clamp(ctx.energy,0,100)<3)return 'Énergie insuffisante : 3 nécessaires.';
 if(job.money&&clamp(ctx.money,0,1e12)<job.money)return 'Il faut '+job.money.toLocaleString('fr-FR')+' B pour créer ton équipage.';
 if(job.kind==='special'&&['Marine','Gouvernement'].includes(job.faction)&&clamp(ctx.bounty,0,1e12)>0)
   return 'Ta prime sur ta tête empêche ce recrutement.';
 if(job.skillMin>0&&skillValue(job,ctx)<job.skillMin)
   return 'Niveau requis en '+job.skill+' : '+job.skillMin+'/100 (actuel '+Math.floor(skillValue(job,ctx))+').';
 const used=(state?.applications||[]).filter(x=>x.year===Math.floor(Number(ctx.year)||0));
 const special=job.kind==='special';
 const max=special?data.maxSpecialApplications:data.maxOrdinaryApplications;
 if(used.filter(x=>x.kind===job.kind).length>=max)return 'Limite annuelle de candidatures atteinte ('+max+').';
 if(used.some(x=>x.id===job.id))return 'Candidature déjà envoyée cette année.';
 return '';
}
function status(job,state,ctx={}){
 const reason=lockedReason(job,ctx,state);
 const skill=skillValue(job,ctx),need=job?.skillMin||0,school=clamp(ctx.schoolBonus||0,0,20);
 const chance=job?clamp(.44+(skill-need)*.007+school*.006+
    Math.min(8,Math.max(0,ageOf(ctx)-(job.minAge||15)))*.009-
    (job.kind==='special'?.09:0),.12,.94):0;
 return {available:!reason,reason,chance,skill,required:need};
}
function apply(raw,id,ctx={},roll=.5){
 const state=normalize(raw,ctx.year),job=byId(id),gate=status(job,state,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason,state};
 const accepted=clamp(roll,0,1)<gate.chance;
 const applications=[...state.applications,{id,year:Math.floor(Number(ctx.year)||0),accepted,kind:job.kind,chance:gate.chance}].slice(-24);
 const history=[...state.history,{kind:accepted?'hired':'rejected',title:job.label,year:Math.floor(Number(ctx.year)||0)}].slice(-25);
 return {ok:true,accepted,job,chance:gate.chance,energyCost:3,fee:accepted?(job.money||0):0,
  state:{...state,applications,history,current:accepted?{kind:job.kind,id:job.id,startYear:Math.floor(Number(ctx.year)||0)}:null}};
}
function resign(raw,ctx={}){
 const state=normalize(raw,ctx.year),job=byId(state.current?.id);
 if(!state.current)return {ok:false,state,reason:'Tu n’as pas de carrière active.'};
 if(!ctx.alive||ctx.pending||ctx.annual)return {ok:false,state,reason:'Démission impossible pour le moment.'};
 if(ctx.travel)return {ok:false,state,reason:'Attends d’arriver à terre pour quitter ton organisation.'};
 const title=job?.label||ctx.career||'Carrière précédente';
 return {ok:true,job,
  state:{...state,current:null,history:[...state.history,{kind:'resigned',title,year:Math.floor(Number(ctx.year)||0)}].slice(-25)}};
}
function stringHash(str){let h=2166136261;for(const ch of String(str)){h=Math.imul(h^ch.charCodeAt(0),16777619)}return h>>>0}
function offers(raw,ctx={}){
 const state=normalize(raw,ctx.year),year=Math.floor(Number(ctx.year)||0);
 const pool=[...data.ordinary].sort((a,b)=>{
  const a0=stringHash([a.id,year,ctx.island||''].join('|'));
  const b0=stringHash([b.id,year,ctx.island||''].join('|'));
  return a0-b0
 });
 const accessible=pool.filter(x=>x.minAge<=ageOf(ctx));
 const selected=[...accessible.slice(0,10),...pool.filter(x=>x.minAge>ageOf(ctx)).slice(0,2)];
 return state.allOffers?data.ordinary:selected;
}
function estimatedPay(state,ctx={}){
 const job=byId(state?.current?.id);
 if(!job||job.kind!=='ordinary')return null;
 const grades=['Apprenti','Professionnel','Expert','Maître'];
 const grade=Math.max(0,grades.indexOf(ctx.rank));
 return {perAction:Math.round(job.pay*(1+grade*.18)),annualMax:Math.round(job.pay*(1+grade*.18)*4)};
}
r.register('careerMarketEngineV112',{
 version:'11.2.0',normalize,byId,skillValue,status,apply,resign,offers,estimatedPay
});
})(window);
