/** V0.5.6. Vie autonome et postes des compagnons, sans quota annuel d'interactions. */
export const CREW_ROLES=Object.freeze({
 combattant:'Combattant',navigateur:'Navigateur',medecin:'Médecin',
 cuisinier:'Cuisinier',charpentier:'Charpentier',tireur:'Tireur',
 second:'Bras droit'
});
export const TEMPERAMENTS=Object.freeze(['loyal','ambitieux','prudent','rebelle','solidaire']);
export const TEMPERAMENT_LABELS=Object.freeze({
 loyal:'Loyal',ambitieux:'Ambitieux',prudent:'Prudent',rebelle:'Rebelle',solidaire:'Solidaire'
});
import {scaledBenefit} from './diminishing.mjs';
import {usage,used} from './action-usage.mjs';
export const CREW_BONUS_COST=2500;
const cap=n=>Math.max(0,Math.min(100,Math.round(n)));
const draw=random=>{
 const n=random();
 if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Tirage invalide');
 return n;
};
const stamp=(career,age,text,type='order')=>({
 ...career,lastNotice:text,
 notices:[...career.notices,{age,type,text}].slice(-25)
});
const event=(command,age,text)=>({
 ...command,events:[...command.events,{age,text}].slice(-12)
});
export function newMemberLife(member,random=Math.random){
 return {...member,role:member.specialty,
  temperament:TEMPERAMENTS[Math.floor(draw(random)*TEMPERAMENTS.length)],
  bond:45,ambition:25+Math.floor(draw(random)*55),rivalry:8,
  strain:0};
}
/** Migration déterministe : les compagnons existants conservent identité, talents et loyauté. */
export function upgradeCommand(command){
 if(!command)return null;
 return {...command,cohesion:60,pending:null,events:[],
  members:command.members.map(m=>({...m,role:m.specialty,
   temperament:TEMPERAMENTS[(m.id.charCodeAt(m.id.length-1)-48)%TEMPERAMENTS.length],
   bond:Math.min(80,Math.max(20,m.loyalty)),ambition:45,rivalry:8,strain:0}))};
}
export function validCrewLife(command,age){
 if(!Number.isInteger(command.cohesion)||command.cohesion<0||command.cohesion>100||
  !Array.isArray(command.events)||command.events.length>12||
  command.events.some(e=>!e||!Number.isInteger(e.age)||e.age<16||e.age>age||
   typeof e.text!=='string'||!e.text.trim()||e.text.length>160))return false;
 const seconds=command.members.filter(m=>m.role==='second');
 if(seconds.length>1)return false;
 for(const m of command.members){
  if(!Object.hasOwn(CREW_ROLES,m.role)||!TEMPERAMENTS.includes(m.temperament)||
   !['bond','ambition','rivalry','strain'].every(k=>Number.isInteger(m[k])&&m[k]>=0&&m[k]<=100))
   return false;
 }
 const p=command.pending;
 return p===null||Boolean(p&&
  ['pay','conflict','mate'].includes(p.kind)&&
  Number.isInteger(p.age)&&p.age===age&&
  typeof p.memberId==='string'&&command.members.some(m=>m.id===p.memberId)&&
  typeof p.text==='string'&&p.text.length>0&&p.text.length<=160);
}
export function crewEffects(command,mission='escort'){
 if(!command)return {chance:0,hullReduction:0,injuryMultiplier:1,heal:0};
 const members=command.members;
 const strength=role=>members.filter(m=>m.role===role).reduce((sum,m)=>sum+m.skill,0);
 const coeff=role=>strength(role)/100;
 let chance=(command.cohesion-50)*.09+
   (members.reduce((s,m)=>s+m.bond-m.rivalry*.6,0)/Math.max(1,members.length)-35)*.055;
 if(['escort','explore','treasure'].includes(mission))chance+=coeff('navigateur')*8;
 if(['raid','marine'].includes(mission))chance+=coeff('combattant')*7+coeff('tireur')*6;
 chance+=coeff('second')*4;
 return {chance:Math.round(chance),
  hullReduction:Math.min(7,Math.floor(coeff('charpentier')*6+coeff('navigateur')*2)),
  injuryMultiplier:Math.max(.55,1-coeff('medecin')*.42),
  heal:Math.round(coeff('cuisinier')*3+coeff('second')*2)};
}
export function roleAvailability(career,life,memberId,role){
 const cmd=career.command;
 if(!life?.alive||!cmd||cmd.pending)return {enabled:false,reason:'Décision de l’équipage en cours.'};
 const m=cmd.members.find(m=>m.id===memberId);
 if(!m||!Object.hasOwn(CREW_ROLES,role))return {enabled:false,reason:'Compagnon ou poste inconnu.'};
 if(m.role===role)return {enabled:false,reason:'Poste déjà occupé.'};
 if(role==='second'&&cmd.members.some(m=>m.role==='second'&&m.id!==memberId))
  return {enabled:false,reason:'Un seul bras droit à la fois.'};
 return {enabled:true};
}
export function assignCrewRole(career,life,memberId,role){
 if(!roleAvailability(career,life,memberId,role).enabled)return null;
 const cmd=career.command;
 const m=cmd.members.find(m=>m.id===memberId);
 const members=cmd.members.map(x=>x.id===memberId?{...x,role,
  bond:cap(x.bond+2),ambition:cap(x.ambition+(role==='second'?-8:0))}:x);
 const text=m.firstName+' devient '+CREW_ROLES[role]+' à bord.';
 return stamp({...career,command:event({...cmd,members,cohesion:cap(cmd.cohesion+1)},
  life.age,text)},life.age,text,'crew');
}
export function crewActionAvailability(career,life,memberId,action){
 const cmd=career.command;
 if(!life?.alive||!cmd||cmd.pending)return {enabled:false,reason:'Décision de l’équipage en cours.'};
 if(!cmd.members.some(m=>m.id===memberId)||!['talk','reward','dismiss'].includes(action))
  return {enabled:false,reason:'Compagnon ou action inconnu.'};
 if(action==='reward'&&career.missions.berys<CREW_BONUS_COST)
  return {enabled:false,reason:'Il faut '+CREW_BONUS_COST+' Berrys.'};
 return {enabled:true};
}
export function actWithCrew(career,life,memberId,action){
 if(!crewActionAvailability(career,life,memberId,action).enabled)return null;
 const cmd=career.command,m=cmd.members.find(m=>m.id===memberId);
 const count=usage(cmd,'crew:'+memberId);
 let members=cmd.members,morale=cmd.morale,cohesion=cmd.cohesion,berys=career.missions.berys,text;
 if(action==='talk'){
  // Discussions à volonté, mais elles deviennent improductives quand on insiste trop.
  const gain=m.strain<30?scaledBenefit(5,count):m.strain<60?scaledBenefit(1,count):-2;
  members=members.map(x=>x.id===memberId?{...x,
    bond:cap(x.bond+gain),loyalty:cap(x.loyalty+(gain>0?1:-1)),
    strain:cap(x.strain+18),rivalry:cap(x.rivalry+(gain<0?3:-1))}:x);
  cohesion=cap(cohesion+(gain>0?1:-2));
  text='Vous échangez avec '+m.firstName+(gain<0?', qui réclame un peu d’espace.':'.');
 }else if(action==='reward'){
  berys-=CREW_BONUS_COST;
  members=members.map(x=>x.id===memberId?{...x,
    loyalty:cap(x.loyalty+scaledBenefit(9,count)),bond:cap(x.bond+scaledBenefit(6,count)),rivalry:cap(x.rivalry-6),
    strain:cap(x.strain-8)}:x);
  morale=cap(morale+scaledBenefit(3,count));
  text='Vous récompensez '+m.firstName+' avec '+CREW_BONUS_COST+' Berrys.';
 }else{
  members=members.filter(x=>x.id!==memberId);
  cohesion=cap(cohesion-8);morale=cap(morale-5);
  text=m.firstName+' quitte votre équipage sur votre ordre.';
 }
 const command=event(used({...cmd,members,morale,cohesion},'crew:'+memberId),life.age,text);
 return stamp({...career,command,missions:{...career.missions,berys}},life.age,text,'crew');
}
export function ageCrewLife(career,age,random=Math.random){
 const cmd=career.command;
 if(!cmd)return {career,note:''};
 const crew=cmd.members.map(m=>{
  const isolated=m.temperament==='rebelle'&&cmd.cohesion<55;
  const frustrated=m.temperament==='ambitieux'&&m.role!=='second'&&m.ambition>=60;
  return {...m,strain:Math.max(0,m.strain-28),
   ambition:cap(m.ambition+(m.temperament==='ambitieux'?1:0)),
   rivalry:cap(m.rivalry+(cmd.cohesion<30?3:-1)+(isolated?3:0)+(frustrated?2:0)),
   loyalty:cap(m.loyalty+(cmd.morale<25?-2:0)+
     (m.temperament==='loyal'&&cmd.morale>=55?1:0)+
     (m.temperament==='rebelle'&&cmd.morale<35?-1:0))};
 });
 const avg=crew.reduce((s,m)=>s+m.rivalry,0)/Math.max(1,crew.length);
 const supportive=crew.filter(m=>m.temperament==='solidaire'&&m.loyalty>=45).length;
 let cohesion=cap(cmd.cohesion+(cmd.morale>=65?2:cmd.morale<30?-4:-1)-
  (avg>60?3:0)+supportive);
 let pending=null,note='';
 // Une proposition par passage d'âge, à résoudre avant de vieillir de nouveau.
 if(age<120&&crew.length>=2&&age>cmd.foundedAtAge+1&&
  draw(random)<Math.min(.48,.15+avg/300+(100-cohesion)/450)){
  const m=crew[Math.floor(draw(random)*crew.length)];
  const kind=m.rivalry>=45||cohesion<35?'conflict':
   m.ambition>=60&&m.role!=='second'&&!crew.some(x=>x.role==='second')?'mate':'pay';
  const text=kind==='conflict'?m.firstName+' se dispute avec des compagnons.':
   kind==='mate'?m.firstName+' demande à devenir bras droit.':
   m.firstName+' réclame une prime pour ses efforts.';
  pending={age,memberId:m.id,kind,text};note=text;
 }
 return {career:{...career,command:{...cmd,members:crew,cohesion,pending}},note};
}
export function resolveCrewRequest(career,life,answer){
 const cmd=career.command,p=cmd?.pending;
 if(!life?.alive||!p||p.age!==life.age||!['accept','refuse'].includes(answer))return null;
 const m=cmd.members.find(x=>x.id===p.memberId);
 if(!m)return null;
 if(answer==='accept'&&p.kind==='pay'&&career.missions.berys<CREW_BONUS_COST)return null;
 let members=cmd.members,cohesion=cmd.cohesion,morale=cmd.morale;
 let berys=career.missions.berys;
 if(p.kind==='pay'){
  if(answer==='accept')berys-=CREW_BONUS_COST;
  members=members.map(x=>x.id===m.id?{...x,
   loyalty:cap(x.loyalty+(answer==='accept'?11:-12)),
   bond:cap(x.bond+(answer==='accept'?6:-7))}:x);
  morale=cap(morale+(answer==='accept'?4:-5));
 }else if(p.kind==='mate'){
  members=members.map(x=>x.id===m.id?{...x,
   role:answer==='accept'?'second':x.role,
   bond:cap(x.bond+(answer==='accept'?10:-8)),
   loyalty:cap(x.loyalty+(answer==='accept'?7:-6))}:x);
  cohesion=cap(cohesion+(answer==='accept'?4:-3));
 }else{
  members=members.map(x=>({...x,
   rivalry:cap(x.rivalry+(answer==='accept'?-12:8)),
   bond:cap(x.bond+(answer==='accept'?2:-3))}));
  cohesion=cap(cohesion+(answer==='accept'?9:-10));
 }
 const text=answer==='accept'?'Vous acceptez la demande de '+m.firstName+'.':
  'Vous refusez la demande de '+m.firstName+'.';
 const command=event({...cmd,members,cohesion,morale,pending:null},life.age,text);
 return stamp({...career,command,missions:{...career.missions,berys}},life.age,text,'crew');
}
