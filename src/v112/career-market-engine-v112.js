(function(global){
'use strict';
const r=global.OPL_MODULES,data=r?.get('careerMarketDataV112');
if(!data)throw Error('Career market data missing');
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(n))?Number(n):min));
const ageOf=c=>Math.max(0,Math.floor(Number(c.age)||0));
function normalize(raw={},year=0){
 const r=raw&&typeof raw==='object'?raw:{};
 return {version:2,year:Math.max(0,Math.floor(Number(year)||0)),
  current:r.current&&typeof r.current==='object'?{
   kind:r.current.kind==='special'?'special':'ordinary',id:String(r.current.id||'').slice(0,60),
   startYear:Math.floor(clamp(r.current.startYear,0,9999))
  }:null,
  raisePct:Math.floor(clamp(r.raisePct,0,40)),
  // V12 special-career record: wholly distinct from ordinary employee tenure.
  specialMerit:Math.floor(clamp(r.specialMerit,0,9999)),
  specialPath:String(r.specialPath||'').slice(0,36),
  lastSpecialPathYear:Number.isFinite(Number(r.lastSpecialPathYear))?Math.floor(Number(r.lastSpecialPathYear)):-1,
  lastSpecialPromotionYear:Number.isFinite(Number(r.lastSpecialPromotionYear))?Math.floor(Number(r.lastSpecialPromotionYear)):-1,
  jobHunt:!!r.jobHunt,
  lastPromotionYear:Number.isFinite(Number(r.lastPromotionYear))?Math.floor(Number(r.lastPromotionYear)):-1,
  lastRaiseYear:Number.isFinite(Number(r.lastRaiseYear))?Math.floor(Number(r.lastRaiseYear)):-1,
  operations:Array.isArray(r.operations)?r.operations.slice(-45).filter(x=>x&&typeof x==='object').map(x=>({
   id:String(x.id||'').slice(0,72),year:Math.floor(clamp(x.year,0,9999)),success:!!x.success})):[],
  tasks:Array.isArray(r.tasks)?r.tasks.slice(-60).filter(x=>x&&typeof x==='object').map(x=>({
   id:String(x.id||'').slice(0,72),jobId:String(x.jobId||'').slice(0,60),
   year:Math.floor(clamp(x.year,0,9999)),success:!!x.success})):[],
  applications:Array.isArray(r.applications)?r.applications.slice(-24).filter(x=>x&&typeof x==='object').map(x=>({
   id:String(x.id||'').slice(0,60),year:Math.floor(clamp(x.year,0,9999)),
   accepted:!!x.accepted,kind:x.kind==='special'?'special':'ordinary',
   chance:clamp(x.chance,0,1)})):[],
  history:Array.isArray(r.history)?r.history.slice(-25).filter(x=>x&&typeof x==='object').map(x=>({
   kind:String(x.kind||'').slice(0,25),title:String(x.title||'').slice(0,100),
   year:Math.floor(clamp(x.year,0,9999))})):[],
  selected:r.selected==='special'?'special':'ordinary',
  allOffers:!!r.allOffers,
  crewChoice:r.crewChoice&&typeof r.crewChoice==='object'&&Number(r.crewChoice.year)===Number(year)?
    {id:String(r.crewChoice.id||'').slice(0,90),year:Math.floor(Number(year)||0)}:null,
  interview:r.interview&&typeof r.interview==='object'&&Math.floor(Number(r.interview.year)||0)===Math.floor(Number(year)||0)&&byIdSafe(r.interview.id)?
    {id:String(r.interview.id),year:Math.floor(Number(r.interview.year)||0)}:null};
}
const all=()=>[...data.ordinary,...data.special];
const byIdSafe=id=>all().some(x=>x.id===id);
const byId=id=>all().find(x=>x.id===id)||null;
function crewHash(str){let h=2166136261;for(const ch of String(str))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0}
function crewOffers(ctx={},worldCrews=[]){
 const year=Math.floor(Number(ctx.year)||0),location=String(ctx.island||'Port inconnu'),region=String(ctx.region||'');
 const live=(Array.isArray(worldCrews)?worldCrews:[]).filter(c=>c&&c.status==='active'&&c.id&&c.name&&(!region||c.region===region))
   .sort((a,b)=>(Number(b.power)||0)-(Number(a.power)||0)).slice(0,2).map(c=>({
     id:'world:'+String(c.id).slice(0,72),name:String(c.name).slice(0,70),
     captain:'Capitaine de '+String(c.name).slice(0,54),power:Math.round(clamp(c.captainPower??c.power,15,100)),
     region:String(c.region||region),origin:'Équipage du monde vivant'
   }));
 const names=['Équipage de la Brume Pourpre','Équipage des Trois Voiles','Équipage du Corail Noir',
   'Équipage du Requin d’Argent','Équipage du Vent Écarlate','Équipage des Étoiles Salées'];
 const captains=['Mara Voss','Rook Dalen','Sena Morin','Kael Vane','Neris Flint','Aren Sol'];
 const order=names.map((name,i)=>({name,i,hash:crewHash(location+'|'+year+'|'+i)})).sort((a,b)=>a.hash-b.hash).slice(0,3);
 const local=order.map(({name,i},k)=>({
   id:'port:'+year+':'+crewHash(location)+':'+i,
   name,captain:captains[(i+year+k)%captains.length],
   power:26+(crewHash(name+'|'+location+'|'+year)%49),
   region,origin:'Recrute à '+location
 }));
 return [...live,...local].slice(0,5);
}
function chooseCrew(raw,id,ctx={}){
 const state=normalize(raw,ctx.year);
 const crew=(ctx.crewOptions||[]).find(c=>c.id===id);
 const gate=status(byId('pirate_join'),state,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason,state};
 if(state.interview)return {ok:false,reason:'Termine d’abord l’entretien en cours.',state};
 if(!crew)return {ok:false,reason:'Cet équipage n’est plus disponible sur cette île.',state};
 return {ok:true,crew,state:{...state,crewChoice:{id:crew.id,year:Math.floor(Number(ctx.year)||0)}}};
}
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
 if(state?.current){
   if(state.current.kind!=='ordinary'||job.kind!=='ordinary')
     return 'Quitte d’abord ta carrière actuelle : les carrières spéciales restent indépendantes du marché civil.';
   if(state.current.id===job.id)return 'Tu occupes déjà ce poste.';
 }else if(ctx.career&&ctx.career!=='Aucune')return 'Quitte d’abord ton ancien poste pour changer de parcours.';
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
 if(job.id==='pirate_join'&&!(ctx.crewOptions||[]).some(c=>c.id===state.crewChoice?.id))
   return {ok:false,reason:'Choisis d’abord un équipage dans les recrutements spéciaux.',state};
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
 if(job?.id!=='pirate_found'&&job?.id!=='hunter'&&!state.interview)
   return {ok:false,reason:'Passe d’abord ton entretien de recrutement.',state};
 if(state.interview&&!['skills','team','ambition'].includes(answer))return {ok:false,reason:'Choisis une réponse à l’entretien.',state};
 const joinCrew=job?.id==='pirate_join'?(ctx.crewOptions||[]).find(c=>c.id===state.crewChoice?.id):null;
 if(job?.id==='pirate_join'&&!joinCrew)return {ok:false,reason:'Sélectionne un équipage disponible avant de postuler.',state};
 const crewDifficulty=joinCrew?clamp((Number(joinCrew.power)-38)*.003,-.07,.18):0;
 const chance=clamp(gate.chance+(state.interview?interviewBonus(job,answer,ctx):0)-crewDifficulty,0,1);
 const accepted=job.id==='pirate_found'||job.id==='hunter'||clamp(roll,0,1)<chance;
 const previous=state.current?byId(state.current.id):null;
 const switched=!!(accepted&&previous?.kind==='ordinary'&&job.kind==='ordinary');
 const applications=[...state.applications,{id,year:Math.floor(Number(ctx.year)||0),accepted,kind:job.kind,chance}].slice(-24);
 const history=[...state.history,{kind:accepted?(switched?'switched':'hired'):'rejected',title:job.label,year:Math.floor(Number(ctx.year)||0)}].slice(-25);
 return {ok:true,accepted,job,previous:switched?previous:null,switched,joinCrew:accepted?joinCrew:null,chance,energyCost:3,fee:accepted?(job.money||0):0,
  state:{...state,interview:null,crewChoice:accepted?null:state.crewChoice,applications,history,
    raisePct:accepted?0:state.raisePct,lastRaiseYear:accepted?-1:state.lastRaiseYear,
    lastPromotionYear:accepted?-1:state.lastPromotionYear,jobHunt:accepted?false:state.jobHunt,
    specialMerit:accepted?0:state.specialMerit,specialPath:accepted?'':state.specialPath,
    lastSpecialPathYear:accepted?-1:state.lastSpecialPathYear,
    lastSpecialPromotionYear:accepted?-1:state.lastSpecialPromotionYear,
    operations:accepted?[]:state.operations,tasks:accepted?[]:state.tasks,
    current:accepted?{kind:job.kind,id:job.id,startYear:Math.floor(Number(ctx.year)||0)}:state.current}};
}
function resign(raw,ctx={}){
 const state=normalize(raw,ctx.year),job=byId(state.current?.id);
 if(!state.current)return {ok:false,state,reason:'Tu n’as pas de carrière active.'};
 if(!ctx.alive||ctx.pending||ctx.annual)return {ok:false,state,reason:'Démission impossible pour le moment.'};
 if(ctx.travel)return {ok:false,state,reason:'Attends d’arriver à terre pour quitter ton organisation.'};
 const title=job?.label||ctx.career||'Carrière précédente';
 return {ok:true,job,
  state:{...state,current:null,jobHunt:false,raisePct:0,lastRaiseYear:-1,lastPromotionYear:-1,
    specialMerit:0,specialPath:'',lastSpecialPathYear:-1,lastSpecialPromotionYear:-1,
    history:[...state.history,{kind:'resigned',title,year:Math.floor(Number(ctx.year)||0)}].slice(-25)}};
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
 const perAction=Math.round(job.pay*(1+grade*.18)*(1+clamp(state.raisePct,0,40)/100));
 return {perAction,annualMax:perAction*4,raisePct:Math.floor(clamp(state.raisePct,0,40))};
}
// BitLife-style civilian promotion is distinct from faction and pirate grades.
// It is a deliberate annual request with eligibility checks and a real possibility of refusal.
const CIVIL_GRADES=['Apprenti','Professionnel','Expert','Maître'];
function civilPromotionStatus(raw,ctx={}){
 const state=normalize(raw,ctx.year),job=byId(state.current?.id),index=CIVIL_GRADES.indexOf(ctx.rank);
 const next=index>=0?CIVIL_GRADES[index+1]:null;
 const xpRequired=[20,48,88][index]??0;
 const sessionsRequired=[2,4,7][index]??0;
 const performanceRequired=[45,60,75][index]??0;
 const xp=Math.max(0,Number(ctx.careerXP)||0),sessions=Math.max(0,Number(ctx.workSessions)||0);
 const performance=clamp(ctx.performance,0,100),trust=clamp(ctx.trust,0,100);
 let reason='';
 if(!state.current||state.current.kind!=='ordinary'||job?.kind!=='ordinary')
   reason='Les promotions d’employé sont réservées aux métiers civils.';
 else if(!ctx.alive||ctx.pending||ctx.annual||ctx.travel)
   reason='Tu dois être disponible et à terre pour demander une promotion.';
 else if(!next)reason='Tu as atteint le plus haut niveau de ce métier.';
 else if(state.lastPromotionYear===Math.floor(Number(ctx.year)||0))
   reason='Ta demande de promotion a déjà été examinée cette année.';
 else if(clamp(ctx.energy,0,100)<6)reason='Il faut 6 énergie pour demander une promotion.';
 else if(xp<xpRequired)reason='Expérience insuffisante : '+Math.floor(xp)+' / '+xpRequired+' XP.';
 else if(sessions<sessionsRequired)reason='Tu dois travailler '+sessionsRequired+' fois dans ce métier (actuellement '+sessions+').';
 else if(performance<performanceRequired)reason='Performance exigée : '+performanceRequired+'/100 (actuellement '+Math.round(performance)+').';
 else if(trust<25)reason='La confiance de ton supérieur doit atteindre 25/100.';
 const chance=clamp(.18+performance*.004+trust*.002+Math.min(90,skillValue(job,ctx))*.0015,.20,.88);
 return {available:!reason,reason,rank:ctx.rank||'',next,grade:index,cost:6,chance,
  xpRequired,sessionsRequired,performanceRequired,xp,sessions,performance,trust};
}
function civilPromotion(raw,ctx={},roll=.5){
 const state=normalize(raw,ctx.year),gate=civilPromotionStatus(state,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason,state};
 const accepted=clamp(roll,0,1)<gate.chance;
 const year=Math.floor(Number(ctx.year)||0);
 const job=byId(state.current.id);
 const next={...state,lastPromotionYear:year,
  history:[...state.history,{kind:accepted?'promoted':'promotion_refused',
   title:accepted?'Promotion : '+gate.next:'Promotion refusée chez '+(job?.label||'l’employeur'),
   year}].slice(-25)};
 return {ok:true,accepted,rank:accepted?gate.next:ctx.rank,cost:gate.cost,
  chance:gate.chance,state:next,job};
}
// Ordinary employees have their own salary negotiation. Special careers never use this mechanic.
function raiseStatus(raw,ctx={}){
 const s=normalize(raw,ctx.year),current=byId(s.current?.id),ordinary=s.current?.kind==='ordinary';
 const performance=clamp(ctx.performance,0,100),trust=clamp(ctx.trust,0,100),sessions=Math.max(0,Number(ctx.workSessions)||0);
 let reason='';
 if(!ordinary||current?.kind!=='ordinary')reason='Les augmentations sont réservées aux métiers ordinaires.';
 else if(!ctx.alive||ctx.pending||ctx.annual||ctx.travel)reason='Négociation impossible pendant cette situation.';
 else if(clamp(ctx.energy,0,100)<4)reason='Il faut 4 énergie pour négocier.';
 else if(s.lastRaiseYear===Math.floor(Number(ctx.year)||0))reason='Une négociation a déjà eu lieu cette année.';
 else if(sessions<2)reason='Travaille au moins deux fois avant de négocier.';
 else if(performance<52)reason='Il faut au moins 52/100 en performance.';
 else if(trust<24)reason='La confiance du supérieur doit atteindre 24/100.';
 else if(s.raisePct>=40)reason='Le plafond de rémunération négociée est atteint.';
 const chance=clamp(.28+performance*.0045+trust*.0022-s.raisePct*.005,.18,.86);
 return {available:!reason,reason,chance,cost:4,raisePct:s.raisePct,bonus:8};
}
function negotiateRaise(raw,ctx={},roll=.5){
 const state=normalize(raw,ctx.year),gate=raiseStatus(state,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason,state};
 const accepted=clamp(roll,0,1)<gate.chance;
 const raisePct=accepted?Math.min(40,state.raisePct+gate.bonus):state.raisePct;
 const next={...state,raisePct,lastRaiseYear:Math.floor(Number(ctx.year)||0),
  history:[...state.history,{kind:accepted?'raise':'raise_refused',
   title:accepted?'Augmentation obtenue':'Augmentation refusée',year:Math.floor(Number(ctx.year)||0)}].slice(-25)};
 return {ok:true,state:next,accepted,raisePct,cost:gate.cost,chance:gate.chance};
}
// Each special career owns its own missions, cooldowns and rewards.
// Each faction defines its own specialization and merit-based promotions.
function specialPathOptions(raw,ctx={}){
 const state=normalize(raw,ctx.year),job=byId(state.current?.id);
 const faction=job?.kind==='special'?job.faction:null;
 return (data.specialPaths?.[faction]||[]).map(path=>({
   ...path,status:specialPathStatus(state,path.id,ctx)
 }));
}
function specialPathStatus(raw,id,ctx={}){
 const s=normalize(raw,ctx.year),job=byId(s.current?.id);
 const faction=job?.kind==='special'?job.faction:null;
 const path=(data.specialPaths?.[faction]||[]).find(x=>x.id===id);
 let reason='';
 if(!path)reason='Cette spécialisation ne correspond pas à ta carrière.';
 else if(!ctx.alive||ctx.pending||ctx.annual)reason='Termine la décision ou l’année en cours.';
 else if(ctx.travel)reason='Reviens à terre pour choisir une spécialisation.';
 else if(s.specialPath===id)reason='Cette spécialisation est déjà active.';
 else if(s.lastSpecialPathYear===Math.floor(Number(ctx.year)||0))reason='Tu as déjà changé de spécialisation cette année.';
 else if((Number(ctx.energy)||0)<5)reason='Il faut 5 énergie.';
 return {available:!reason,reason,cost:5,current:s.specialPath===id};
}
function chooseSpecialPath(raw,id,ctx={}){
 const s=normalize(raw,ctx.year),gate=specialPathStatus(s,id,ctx);
 if(!gate.available)return {ok:false,state:s,reason:gate.reason};
 const job=byId(s.current.id),path=data.specialPaths[job.faction].find(p=>p.id===id),year=Math.floor(Number(ctx.year)||0);
 return {ok:true,path,cost:gate.cost,state:{...s,specialPath:id,lastSpecialPathYear:year,
   history:[...s.history,{kind:'special_path',title:path.label,year}].slice(-25)}};
}
function specialPromotionStatus(raw,ctx={}){
 const s=normalize(raw,ctx.year),job=byId(s.current?.id);
 const faction=job?.kind==='special'?job.faction:null;
 const config=data.specialProgression?.[faction];
 const ranks=data.specialRanks?.[faction]||[];
 const index=ranks.indexOf(ctx.rank),next=index>=0?ranks[index+1]:null;
 const successes=s.operations.filter(op=>op.success).length;
 const meritRequired=(config?.meritStep||18)*(index+1);
 const xpRequired=18+(index+1)*Math.round((index+3)*9);
 const successesRequired=(config?.successStep||1)+Math.floor(index/2);
 const merit=Math.floor(s.specialMerit),xp=Math.floor(Math.max(0,Number(ctx.careerXP)||0));
 const trust=clamp(ctx.trust,0,100);
 let reason='';
 if(!config)reason='Choisis une carrière spéciale pour progresser dans une faction.';
 else if(index<0)reason='Grade non reconnu dans cette organisation.';
 else if(!next)reason='Grade maximal atteint.';
 else if(faction==='Pirates'&&next==='Capitaine')reason='Le capitanat doit se gagner en créant un équipage ou en défiant le capitaine.';
 else if(!ctx.alive||ctx.pending||ctx.annual||ctx.travel)reason='Cette promotion nécessite une situation stable à terre.';
 else if(s.lastSpecialPromotionYear===Math.floor(Number(ctx.year)||0))reason='Dossier déjà examiné cette année.';
 else if((Number(ctx.energy)||0)<8)reason='Il faut 8 énergie pour présenter ton dossier.';
 else if(merit<meritRequired)reason='Mérite insuffisant : '+merit+' / '+meritRequired+'.';
 else if(xp<xpRequired)reason='Expérience insuffisante : '+xp+' / '+xpRequired+' XP.';
 else if(successes<successesRequired)reason='Réussis '+successesRequired+' opération(s) au sein de la faction ('+successes+' validées).';
 else if(trust<(config?.trust||0))reason='Confiance insuffisante : '+Math.round(trust)+' / '+config.trust+'.';
 const chance=clamp((config?.baseChance||.4)+Math.min(120,Math.max(0,merit-meritRequired))*.001+
   (trust-35)*.002+Math.min(200,xp)*.0005,.17,.89);
 return {available:!reason,reason,label:config?.promotion||'Examen de grade',faction,next,
  merit,meritRequired,xp,xpRequired,successes,successesRequired,trust,trustRequired:config?.trust||0,
  chance,cost:8,rank:ctx.rank};
}
function specialPromotion(raw,ctx={},roll=.5){
 const s=normalize(raw,ctx.year),gate=specialPromotionStatus(s,ctx);
 if(!gate.available)return {ok:false,state:s,reason:gate.reason};
 const accepted=clamp(roll,0,1)<gate.chance,year=Math.floor(Number(ctx.year)||0);
 return {ok:true,accepted,rank:accepted?gate.next:ctx.rank,cost:gate.cost,chance:gate.chance,
  state:{...s,lastSpecialPromotionYear:year,specialMerit:accepted?Math.max(0,s.specialMerit-6):s.specialMerit,
    history:[...s.history,{kind:accepted?'special_promoted':'special_promotion_refused',
      title:gate.next,year}].slice(-25)}};
}
function specialStatus(op,raw,ctx={}){
 const state=normalize(raw,ctx.year),career=state.current;
 if(!op||!data.specialOperations.some(x=>x.id===op.id))return {available:false,reason:'Opération inconnue.'};
 const route=byId(career?.id);
 const faction=route?.faction||(career?.kind==='special'?ctx.faction:null);
 let reason='';
 if(!career||career.kind!=='special'||faction!==op.faction)reason='Cette opération appartient à une autre carrière spéciale.';
 else if(!ctx.alive)reason='Cette vie est terminée.';
 else if(ctx.pending)reason='Résous d’abord la décision en attente.';
 else if(ctx.annual)reason='Termine l’année en cours.';
 else if(ctx.travel)reason='Termine la traversée avant cette opération.';
 else if((Number(ctx.energy)||0)<op.cost)reason='Énergie insuffisante : '+op.cost+' nécessaires.';
 else if(op.role==='captain'&&!ctx.isCaptain)reason='Réservé au capitaine de l’équipage.';
 else if(op.role==='subordinate'&&ctx.isCaptain)reason='Un capitaine dirige ses propres opérations.';
 else if(op.role==='heir'&&ctx.isCaptain)reason='Tu es déjà capitaine.';
 else if(op.role==='heir'&&ctx.rank!=='Bras droit')reason='Il faut devenir bras droit avant de revendiquer le capitanat.';
 else if(op.role==='heir'&&clamp(ctx.trust,0,100)<55)reason='La confiance dans ton équipage doit atteindre 55/100.';
 else if(op.role==='heir'&&!ctx.hasCrewCaptain)reason='Tu dois d’abord rejoindre un équipage commandé par un capitaine.';
 else if(op.role==='elite'&&!['Agent spécial','Cipher Pol'].includes(ctx.rank))reason='Réservé aux agents spéciaux et au Cipher Pol.';
 else if(skillValue(op,ctx)<op.skillMin)reason=op.skill+' requis : '+op.skillMin+'/100.';
 const year=Math.floor(Number(ctx.year)||0),used=state.operations.filter(x=>x.year===year&&x.id===op.id).length;
 const remaining=Math.max(0,Math.max(1,op.limit)-used);
 if(!reason&&remaining===0)reason='Toutes les tentatives ont été utilisées cette année.';
 const rankFactor=Math.min(0.08,Math.max(0,Number(ctx.rankIndex)||0)*.012);
 const path=(data.specialPaths?.[faction]||[]).find(x=>x.id===state.specialPath);
 const pathBonus=path?.skill===op.skill?.07:0;
 const chance=clamp(op.chance+(skillValue(op,ctx)-op.skillMin)*.003+rankFactor+pathBonus+
  (op.role==='heir'?(clamp(ctx.trust,0,100)-55)*.005:0),0.18,0.93);
 return {available:!reason,reason,remaining,limit:op.limit,cost:op.cost,chance};
}
function specialOperations(raw,ctx={}){
 return (data.specialOperations||[]).filter(op=>op.faction===(
   byId(raw?.current?.id)?.faction||(raw?.current?.kind==='special'?ctx.faction:null)
 )).map(op=>({...op,status:specialStatus(op,raw,ctx)}));
}
function specialPerform(raw,id,ctx={},roll=.5){
 const state=normalize(raw,ctx.year),op=(data.specialOperations||[]).find(x=>x.id===id),gate=specialStatus(op,state,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason,state};
 const success=clamp(roll,0,1)<gate.chance;
 const factor=success?1:0.22;
 const faction=byId(state.current?.id)?.faction||ctx.faction;
 const path=(data.specialPaths?.[faction]||[]).find(x=>x.id===state.specialPath);
 const bonus=path?.skill===op.skill;
 const xp=Math.max(1,Math.round(op.xp*factor*(bonus?1.18:1)));
 const pay=success?Math.round(op.pay*(0.85+(1-clamp(roll,0,1))*.3)):0;
 const bounty=success?op.bounty:Math.round(op.bounty*.22);
 const healthLoss=success?0:Math.round(op.injury*(.65+clamp(roll,0,1)*.35));
 const year=Math.floor(Number(ctx.year)||0);
 const meritGain=Math.max(1,success?(9+Math.round(xp/5)+(bonus?3:0)):2);
 const next={...state,specialMerit:Math.min(9999,state.specialMerit+meritGain),
   operations:[...state.operations,{id:op.id,year,success}].slice(-45)};
 return {ok:true,op,state:next,success,xp,pay,bounty,healthLoss,energyCost:op.cost,successChance:gate.chance,
  standing:success?3.8:-0.5,trust:op.role==='heir'?(success?8:-14):(success?2.2:-0.9),meritGain};
}
// Sector-specific everyday employment is separate from faction operations.
// Every project requires a deliberate player action; no passive money or XP.
function ordinaryTaskStatus(task,raw,ctx={}){
 const state=normalize(raw,ctx.year),current=byId(state.current?.id);
 let reason='';
 if(!task||!data.ordinaryTasks.some(x=>x.id===task.id))reason='Activité professionnelle inconnue.';
 else if(state.current?.kind!=='ordinary'||!current||current.kind!=='ordinary')reason='Il faut occuper un métier ordinaire.';
 else if(current.sector!==task.sector)reason='Cette tâche appartient à un autre secteur professionnel.';
 else if(!ctx.alive)reason='Cette vie est terminée.';
 else if(ctx.pending)reason='Résous d’abord la décision en attente.';
 else if(ctx.annual)reason='Termine d’abord l’année en cours.';
 else if(ctx.travel)reason='Reviens à terre pour effectuer cette tâche.';
 else if(clamp(ctx.energy,0,100)<task.cost)reason='Il faut '+task.cost+' énergie.';
 else if(skillValue(task,ctx)<task.skillMin)reason=task.skill+' requis : '+task.skillMin+'/100.';
 const year=Math.floor(Number(ctx.year)||0);
 const used=state.tasks.filter(x=>x.year===year&&x.jobId===current?.id&&x.id===task?.id).length;
 const remaining=Math.max(0,(task?.limit||1)-used);
 if(!reason&&!remaining)reason='Cette tâche a déjà été réalisée deux fois cette année.';
 const chance=clamp((task?.chance||.5)+(skillValue(task||{},ctx)-(task?.skillMin||0))*.0025+
   clamp(ctx.performance,0,100)*.0009,.25,.92);
 return {available:!reason,reason,remaining,limit:task?.limit||1,cost:task?.cost||0,chance};
}
function ordinaryTasks(raw,ctx={}){
 const state=normalize(raw,ctx.year),job=byId(state.current?.id);
 if(!job||job.kind!=='ordinary')return [];
 return (data.ordinaryTasks||[]).filter(x=>x.sector===job.sector)
   .map(x=>({...x,status:ordinaryTaskStatus(x,state,ctx)}));
}
function ordinaryTaskPerform(raw,id,ctx={},roll=.5){
 const state=normalize(raw,ctx.year),task=(data.ordinaryTasks||[]).find(x=>x.id===id);
 const gate=ordinaryTaskStatus(task,state,ctx);
 if(!gate.available)return {ok:false,state,reason:gate.reason};
 const success=clamp(roll,0,1)<gate.chance;
 const current=byId(state.current.id);
 const xp=Math.max(1,Math.round(task.xp*(success?1:.35)));
 const bonus=success?Math.max(1,Math.round(current.pay*task.bonusRate)):0;
 const healthLoss=success?0:Math.round(task.injury*.75);
 const performanceDelta=success?6:-4;
 const trustDelta=success?2.5:-1.5;
 const year=Math.floor(Number(ctx.year)||0);
 const next={...state,tasks:[...state.tasks,{id,jobId:current.id,year,success}].slice(-60),
  history:[...state.history,{kind:success?'work_project':'project_failed',title:task.label,year}].slice(-25)};
 return {ok:true,state:next,task,success,xp,bonus,healthLoss,performanceDelta,trustDelta,
  cost:task.cost,chance:gate.chance};
}
r.register('careerMarketEngineV112',{
 version:'12.0.0',normalize,byId,crewOffers,chooseCrew,skillValue,status,startInterview,cancelInterview,interviewQuestions,interviewBonus,apply,resign,offers,isOffered,estimatedPay,raiseStatus,negotiateRaise,
 specialPathOptions,specialPathStatus,chooseSpecialPath,specialPromotionStatus,specialPromotion,
 civilPromotionStatus,civilPromotion,ordinaryTaskStatus,ordinaryTasks,ordinaryTaskPerform,specialStatus,specialOperations,specialPerform
});
})(window);
