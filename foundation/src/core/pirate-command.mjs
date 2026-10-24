/** V0.5.5 : commandement libre, sans quotas annuels d'ordres ni de candidatures. */
import {newMemberLife,upgradeCommand,validCrewLife,ageCrewLife,crewEffects} from './pirate-crew-life.mjs';
import {newShip,validShip,crewCapacity,ageShip} from './pirate-ships.mjs';
import {createNavigation,validNavigation} from './pirate-navigation.mjs';
import {emptyEncounters,validEncounters} from './pirate-encounters.mjs';
import {scaledBenefit} from './diminishing.mjs';
import {usage,used,validUsage,resetUsage} from './action-usage.mjs';
export const SHIP_COST=50000;
export const RECRUIT_COST=5000;
export const REPAIR_COST=8000;
export const SHARE_COST=5000;
export const MAX_CREW_MEMBERS=8;
export const ORDERS=Object.freeze({
 train:{label:'Entraîner les membres',description:'Améliore les talents, au prix d’un effort collectif'},
 repair:{label:'Réparer le navire',description:'Consommer des Berrys pour restaurer la coque'},
 share:{label:'Partager le butin',description:'Renforcer la loyauté de l’équipage'}
});
export const RECRUIT_SPECIALTIES=Object.freeze({
 combattant:'Combattant',navigateur:'Navigateur',medecin:'Médecin',
 cuisinier:'Cuisinier',charpentier:'Charpentier',tireur:'Tireur'
});
const FIRST=Object.freeze(['Kaito','Sora','Aya','Mika','Ren','Tora','Akari','Haru','Niko','Iro']);
const LAST=Object.freeze(['des Brumes','Corail','du Phare','de l’Aube','du Vent']);
const cap=n=>Math.max(0,Math.min(100,Math.round(n)));
const roll=random=>{
 const v=random();
 if(!Number.isFinite(v)||v<0||v>=1)throw new TypeError('Tirage invalide');
 return v;
};
export function validCommand(command,life,career){
 if(command===null)return !career.pirate||career.pirate.crewId!=='own';
 if(!command||!career.pirate||career.pirate.crewId!=='own'||!life||
  typeof command.name!=='string'||command.name.length<3||command.name.length>65||
  !Number.isInteger(command.foundedAtAge)||command.foundedAtAge<16||
  command.foundedAtAge>life.age||
  !Number.isInteger(command.morale)||command.morale<0||command.morale>100||
  !Number.isInteger(command.hull)||command.hull<0||command.hull>100||
  ![-1,...Array.from({length:life.age+1},(_,i)=>i)].includes(command.recruitedAtAge)||
  ![-1,...Array.from({length:life.age+1},(_,i)=>i)].includes(command.orderAtAge)||
  !Array.isArray(command.members)||command.members.length>MAX_CREW_MEMBERS||
  !validCrewLife(command,life.age)||!validShip(command.ship,command)||
  !validNavigation(command.navigation,command,life.age)||
  !validEncounters(command.encounters,command,life.age)||!validUsage(command))return false;
 const ids=new Set();
 for(const member of command.members){
  if(!member||typeof member.id!=='string'||!/^crew-member-[1-8]$/.test(member.id)||
    ids.has(member.id)||typeof member.firstName!=='string'||
    !member.firstName.trim()||member.firstName.length>35||
    typeof member.lastName!=='string'||!member.lastName.trim()||
    member.lastName.length>35||
    !Object.hasOwn(RECRUIT_SPECIALTIES,member.specialty)||
    !Number.isInteger(member.loyalty)||member.loyalty<0||member.loyalty>100||
    !Number.isInteger(member.skill)||member.skill<0||member.skill>100||
    !Number.isInteger(member.joinedAtAge)||member.joinedAtAge<command.foundedAtAge||
    member.joinedAtAge>life.age)return false;
  ids.add(member.id);
 }
 return career.pirate.rank===3&&career.pirate.joinedAtAge===command.foundedAtAge;
}
export function foundAvailability(career,life,rel){
 if(!life?.alive||life.age<16)return {enabled:false,reason:'Disponible à partir de 16 ans.'};
 if(career.command)return {enabled:false,reason:'Vous commandez déjà un équipage.'};
 if(rel.world.faction!=='pirate')
  return {enabled:false,reason:'Vous devez d’abord rejoindre la piraterie.'};
 if(career.missions.berys<SHIP_COST)
  return {enabled:false,reason:'Navire : '+SHIP_COST.toLocaleString('fr-FR')+' Berrys nécessaires.'};
 return {enabled:true,reason:''};
}
export function foundOwnCrew(career,life,rel){
 if(!foundAvailability(career,life,rel).enabled)return null;
 const name=('Équipage de '+life.firstName).slice(0,65);
 const prior=career.pirate;
 const pirate={crewId:'own',specialty:prior?.specialty??'combattant',
  joinedAtAge:life.age,tenure:0,rank:3,
  performance:prior?.performance??45,workUsed:0,askedAtAge:-1};
 const command=upgradeCommand({name,foundedAtAge:life.age,morale:60,hull:75,
  recruitedAtAge:-1,orderAtAge:-1,members:[],
  ship:newShip('sloop','Navire de '+life.firstName),navigation:createNavigation(),
  encounters:emptyEncounters()});
 const notice={age:life.age,type:'found',text:'Vous fondez '+name+' et achetez votre navire.'};
 const notices=[...career.notices,notice].slice(-25);
 return {career:{...career,pirate,command,
  missions:{...career.missions,berys:career.missions.berys-SHIP_COST},
  notices,lastNotice:notice.text},
  relationships:{...rel,world:{...rel.world,unit:name},
    recent:'Vous devenez capitaine de '+name+'.'}};
}
export function leaveOwnEmployer(career,life,rel){
 if(!life?.alive||!career.pirate||career.command)return null;
 const label=rel.world.unit??'votre équipage';
 const text='Vous quittez '+label+'. Vos acquis et votre prime sont conservés.';
 const notice={age:life.age,type:'leave',text};
 return {career:{...career,pirate:null,appliedAtAge:life.age,
  notices:[...career.notices,notice].slice(-25),lastNotice:text}};
}
export function recruitingAvailability(career,life){
 const command=career.command;
 if(!life?.alive||!command)return {enabled:false,reason:'Réservé aux capitaines.'};
 if(command.members.length>=crewCapacity(command))
  return {enabled:false,reason:'Équipage complet : changez de navire pour recruter davantage.'};
 if(career.missions.berys<RECRUIT_COST)
  return {enabled:false,reason:'Recrutement : '+RECRUIT_COST+' Berrys nécessaires.'};
 return {enabled:true,reason:''};
}
export function recruitToCrew(career,life,specialty,random=Math.random){
 if(!recruitingAvailability(career,life).enabled||
  !Object.hasOwn(RECRUIT_SPECIALTIES,specialty))return null;
 const cmd=career.command,chance=cap(48+cmd.morale*.30+
  career.pirate.performance*.10+Math.min(12,career.wanted.notoriety*.13));
 const accepted=roll(random)<Math.min(92,chance)/100;
 let members=cmd.members,text;
 if(accepted){
  const taken=new Set(members.map(m=>m.id));
  const id=Array.from({length:MAX_CREW_MEMBERS},(_,i)=>'crew-member-'+(i+1)).find(n=>!taken.has(n));
  const firstName=FIRST[Math.floor(roll(random)*FIRST.length)];
  const lastName=LAST[Math.floor(roll(random)*LAST.length)];
  const member={id,firstName,lastName,specialty,loyalty:50+
    Math.floor(roll(random)*26),skill:30+Math.floor(roll(random)*38),
    joinedAtAge:life.age};
  members=[...members,newMemberLife(member,random)];
  text=firstName+' '+lastName+' rejoint votre équipage comme '+
    RECRUIT_SPECIALTIES[specialty]+'.';
 }else text='Le candidat refuse de rejoindre votre équipage.';
 const command={...cmd,members,recruitedAtAge:life.age,
  morale:cap(cmd.morale+(accepted?3:-2))};
 const notice={age:life.age,type:'recruit',text};
 return {career:{...career,command,
   missions:accepted?{...career.missions,berys:career.missions.berys-RECRUIT_COST}:career.missions,
   notices:[...career.notices,notice].slice(-25),lastNotice:text},accepted,chance};
}
export function orderAvailability(career,life,order){
 const cmd=career.command;
 if(!life?.alive||!cmd||!Object.hasOwn(ORDERS,order))
  return {enabled:false,reason:'Réservé aux capitaines.'};
 if(order==='repair'&&cmd.hull===100)return {enabled:false,reason:'Navire déjà en parfait état.'};
 if(order==='repair'&&career.missions.berys<REPAIR_COST)
  return {enabled:false,reason:'Réparations : '+REPAIR_COST+' Berrys nécessaires.'};
 if(order==='share'&&career.missions.berys<SHARE_COST)
  return {enabled:false,reason:'Partage : '+SHARE_COST+' Berrys nécessaires.'};
 if(order==='train'&&!cmd.members.length)
  return {enabled:false,reason:'Recrutez au moins un membre.'};
 return {enabled:true,reason:''};
}
export function giveOrder(career,life,order){
 if(!orderAvailability(career,life,order).enabled)return null;
 const cmd=career.command;
 const count=usage(cmd,'order:'+order);
 let morale=cmd.morale,hull=cmd.hull,members=cmd.members,berys=career.missions.berys,text;
 if(order==='train'){
  // Pas de plafond de séances : la fatigue morale et la maîtrise ralentissent les gains.
  const effort=morale>=60?4:morale>=30?2:1;
  members=members.map(m=>({...m,
   skill:cap(m.skill+scaledBenefit(Math.min(effort,Math.max(1,Math.ceil((100-m.skill)/25))),count)),
   loyalty:cap(m.loyalty+(morale>=25?1:-1))}));
  morale=cap(morale-3);
  text='Vous entraînez votre équipage. Le moral baisse légèrement après ces efforts.';
 }else if(order==='repair'){
  berys-=REPAIR_COST;
  hull=cap(hull+scaledBenefit(24+Math.min(8,crewEffects(cmd).hullReduction),count));
  morale=cap(morale+3);
  text='Votre équipage répare le navire.';
 }else{
  berys-=SHARE_COST;
  morale=cap(morale+scaledBenefit(11+crewEffects(cmd).heal,count));
  members=members.map(m=>({...m,loyalty:cap(m.loyalty+scaledBenefit(7,count))}));
  text='Vous partagez le butin avec vos compagnons.';
 }
 const command=used({...cmd,morale,hull,members,orderAtAge:life.age},'order:'+order);
 const notice={age:life.age,type:'order',text};
 return {...career,command,missions:{...career.missions,berys},
  notices:[...career.notices,notice].slice(-25),lastNotice:text};
}
export function ageCommand(career,age,random=Math.random){
 const cmd=career.command;
 if(!cmd)return {career,note:''};
 let hull=cap(cmd.hull-3),morale=cap(cmd.morale-2),members=cmd.members;
 let note='';
 // Une loyauté très basse peut conduire à une désertion, même sans clic du joueur.
 if(members.length && morale<30 && roll(random)<.20){
  const deserter=members.reduce((a,b)=>a.loyalty<=b.loyalty?a:b);
  members=members.filter(m=>m.id!==deserter.id);
  note=deserter.firstName+' déserte votre équipage à cause du mauvais moral.';
 }
 const command=ageShip(resetUsage({...cmd,hull,morale,members}));
 const lived=ageCrewLife({...career,command},age,random);
 return {career:lived.career,note:[note,lived.note].filter(Boolean).join(' ')};
}
