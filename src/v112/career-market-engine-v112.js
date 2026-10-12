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
  allOffers:!!r.allOffers,
  interview:r.interview&&typeof r.interview==='object'&&Math.floor(Number(r.interview.year)||0)===Math.floor(Number(year)||0)&&byIdSafe(r.interview.id)?
    {id:String(r.interview.id),year:Math.floor(Number(r.interview.year)||0)}:null};
}
const all=()=>[...data.ordinary,...data.special];
const byIdSafe=id=>all().some(x=>x.id===id);
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
 if(state?.interview&&state.interview.id!==job.id)return 'Termine d’abord ton entretien en cours.';
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
 if(job.kind==='ordinary'&&!isOffered(job,ctx))return 'Pas de poste vacant sur cette île cette année. Consulte les nouvelles annonces l’an prochain.';
 return '';
}
function status(job,state,ctx={}){
 const reason=lockedReason(job,ctx,state);
 const skill=skillValue(job,ctx),need=job?.skillMin||0,school=clamp(ctx.schoolBonus||0,0,20);
 const independent=job?.id==='pirate_found'||job?.id==='hunter';
 const chance=independent?1:job?clamp(.44+(skill-need)*.007+school*.006+
    Math.min(8,Math.max(0,ageOf(ctx)-(job.minAge||15)))*.009-
    (job.kind==='special'?.09:0),.12,.94):0;
 return {available:!reason,reason,chance,skill,required:need};
}
function interviewQuestions(id){
 const job=byId(id);if(!job)return [];
 return [
  {id:'skills',label:'Présenter mes compétences',description:'Mettre en avant ce que tu sais faire.'},
  {id:'team',label:'Montrer mon esprit d’équipe',description:'Insister sur ton sérieux et ta fiabilité.'},
  {id:'ambition',label:'Exprimer mon ambition',description:'Promettre une progression rapide.'}
 ];
}
function interviewBonus(job,answer,ctx={}){
 const skill=skillValue(job,ctx),need=Number(job.skillMin)||0;
 if(answer==='skills')return skill>=need+18?.17:skill>=need?.10:.02;
 if(answer==='team')return .09;
 if(answer==='ambition')return job.kind==='special'?.12:.05;
 return 0;
}
function startInterview(raw,id,ctx={}){
 const state=normalize(raw,ctx.year),job=byId(id),gate=status(job,state,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason,state};
 if(state.interview)return {ok:false,reason:'Termine ton entretien en cours.',state};
 if(job.id==='pirate_found'||job.id==='hunter')return {ok:false,reason:'Cette activité indépendante ne nécessite pas d’entretien.',independent:true,state};
 return {ok:true,job,state:{...state,interview:{id,year:Math.floor(Number(ctx.year)||0)}}};
}
function cancelInterview(raw,year=0){
 const state=normalize(raw,year);
 return {...state,interview:null};
}
function apply(raw,id,ctx={},roll=.5,answer=null){
 const state=normalize(raw,ctx.year),job=byId(id),gate=status(job,state,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason,state};
 if(state.interview&&state.interview.id!==id)return {ok:false,reason:'Un autre entretien est en cours.',state};
 if(state.interview&&!['skills','team','ambition'].includes(answer))return {ok:false,reason:'Choisis une réponse à l’entretien.',state};
 const chance=clamp(gate.chance+(state.interview?interviewBonus(job,answer,ctx):0),0,1);
 const accepted=job.id==='pirate_found'||job.id==='hunter'||clamp(roll,0,1)<chance;
 const applications=[...state.applications,{id,year:Math.floor(Number(ctx.year)||0),accepted,kind:job.kind,chance}].slice(-24);
 const history=[...state.history,{kind:accepted?'hired':'rejected',title:job.label,year:Math.floor(Number(ctx.year)||0)}].slice(-25);
 return {ok:true,accepted,job,chance,energyCost:3,fee:accepted?(job.money||0):0,
  state:{...state,interview:null,applications,history,current:accepted?{kind:job.kind,id:job.id,startYear:Math.floor(Number(ctx.year)||0)}:null}};
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
function localOffers(ctx={}){
 const year=Math.floor(Number(ctx.year)||0);
 const pool=[...data.ordinary].sort((a,b)=>
  stringHash([a.id,year,ctx.island||''].join('|'))-stringHash([b.id,year,ctx.island||''].join('|')));
 const accessible=pool.filter(x=>x.minAge<=ageOf(ctx));
 return [...accessible.slice(0,10),...pool.filter(x=>x.minAge>ageOf(ctx)).slice(0,2)];
}
function isOffered(job,ctx={}){
 return job?.kind!=='ordinary'||localOffers(ctx).some(x=>x.id===job.id);
}
function offers(raw,ctx={}){
 const state=normalize(raw,ctx.year);
 return state.allOffers?data.ordinary:localOffers(ctx);
}
function estimatedPay(state,ctx={}){
 const job=byId(state?.current?.id);
 if(!job||job.kind!=='ordinary')return null;
 const grades=['Apprenti','Professionnel','Expert','Maître'];
 const grade=Math.max(0,grades.indexOf(ctx.rank));
 return {perAction:Math.round(job.pay*(1+grade*.18)),annualMax:Math.round(job.pay*(1+grade*.18)*4)};
}
r.register('careerMarketEngineV112',{
 version:'11.2.1',normalize,byId,skillValue,status,startInterview,cancelInterview,interviewQuestions,interviewBonus,apply,resign,offers,isOffered,estimatedPay
});
})(window);
