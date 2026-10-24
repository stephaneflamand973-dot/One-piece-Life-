/**
 * Carrière de membre d'équipage V0.5.0.
 * Rang, emploi et performance ne sont pas des compétences personnelles.
 */
import { joinFaction } from './world-relations.mjs';
import {scaledBenefit,scaledChance,nextCount} from './diminishing.mjs';
import { emptyMissions, validMissions, ageMissions } from './pirate-missions.mjs';
import { emptyWanted, validWanted } from './pirate-notoriety.mjs';
import { validCommand, ageCommand } from './pirate-command.mjs';
export const CREWS=Object.freeze({
  alizes:{label:'Équipage des Alizés',baseChance:82},
  aurore:{label:"Équipage de l'Aurore",baseChance:67},
  own:{label:'Votre équipage',baseChance:0}
});
export const SPECIALTIES=Object.freeze({
  combattant:{label:'Combattant',skill:'technique',min:0},
  sabreur:{label:'Sabreur',skill:'armes',min:18},
  navigateur:{label:'Navigateur',skill:'navigation',min:18},
  tireur:{label:"Tireur d'élite",skill:'precision',min:18},
  medecin:{label:'Médecin',skill:'medecine',min:18},
  cuisinier:{label:'Cuisinier',skill:'cuisine',min:18},
  charpentier:{label:'Charpentier',skill:'charpenterie',min:18}
});
export const RANKS=Object.freeze(['Recrue','Membre confirmé','Officier','Capitaine']);
const cap=value=>Math.min(100,Math.max(0,Math.round(value)));
const stamp=(career,age,type,text)=>{
  const all=[...career.notices,{age,type,text}];
  const hired=all.find(item=>item.type==='hire');
  const notices=hired?[hired,...all.filter(item=>item!==hired).slice(-24)]:all.slice(-25);
  return {...career,notices,lastNotice:text};
};
export function emptyCareer(){
  return {pirate:null,appliedAtAge:-1,notices:[],lastNotice:'',missions:emptyMissions(),wanted:emptyWanted(),command:null};
}
export function isValidCareer(career,life,relationships,abilities){
  if(!career||typeof career!=='object'||Array.isArray(career)||
    !Number.isInteger(career.appliedAtAge)||career.appliedAtAge< -1||
    career.appliedAtAge>(life?.age??0)||
    !Array.isArray(career.notices)||career.notices.length>25||
    typeof career.lastNotice!=='string'||career.lastNotice.length>180||
    !validMissions(career.missions,life?.age??null,career)||
    !validWanted(career.wanted,life,career)||
    !validCommand(career.command,life,career))
    return false;
  for(const item of career.notices){
    if(!item||!Number.isInteger(item.age)||item.age<16||item.age>(life?.age??0)||
      !['application','hire','work','promotion','rejection','sanction','found','leave','recruit','order','crew','ship','voyage','exploration','encounter'].includes(item.type)||
      typeof item.text!=='string'||!item.text.trim()||item.text.length>180)
      return false;
  }
  if(!life)return career.pirate===null&&career.appliedAtAge===-1&&
    career.notices.length===0&&career.lastNotice==='';
  if(career.pirate===null)return true;
  const p=career.pirate;
  if(!p||typeof p!=='object'||!Object.hasOwn(CREWS,p.crewId)||
    !Object.hasOwn(SPECIALTIES,p.specialty)||
    !Number.isInteger(p.joinedAtAge)||p.joinedAtAge<16||p.joinedAtAge>life.age||
    !Number.isInteger(p.tenure)||p.tenure!==life.age-p.joinedAtAge||
    !Number.isInteger(p.performance)||p.performance<0||p.performance>100||
    !Number.isInteger(p.rank)||p.rank<0||p.rank>=RANKS.length||
    !Number.isInteger(p.askedAtAge)||p.askedAtAge< -1||
    p.askedAtAge>life.age||
    !Number.isSafeInteger(p.workUsed)||p.workUsed<0||
    !relationships||relationships.world.faction!=='pirate'||
    (p.crewId!=='own'&&(relationships.world.unit??CREWS.alizes.label)!==CREWS[p.crewId].label)||
    (p.crewId==='own'&&relationships.world.unit!==career.command?.name)||
    !abilities||abilities.skills[SPECIALTIES[p.specialty].skill]<0)return false;
  if((p.rank===1&&p.tenure<2)||(p.rank===2&&p.tenure<4)||
    (p.rank===3&&p.crewId!=='own')||(p.crewId==='own'&&p.rank!==3))return false;
  // Un très ancien recrutement peut avoir quitté le journal tronqué des V0.5.0.
  return true;
}
export function hiringAvailability(career,relations,abilities,life,crewId,specialty){
  if(!life?.alive||life.age<16||life.age>65)
    return {enabled:false,reason:'Recrutement disponible entre 16 et 65 ans.'};
  if(career.pirate)return {enabled:false,reason:'Vous appartenez déjà à un équipage.'};
  if(!Object.hasOwn(CREWS,crewId)||crewId==='own'||!Object.hasOwn(SPECIALTIES,specialty))
    return {enabled:false,reason:'Poste ou équipage inconnu.'};
  if(!['independent','pirate'].includes(relations.world.faction))
    return {enabled:false,reason:'Vous êtes engagé dans une autre faction.'};
  // Une ancienne affiliation pirate ne bloque pas la mobilité professionnelle.
  // Les contacts de l'ancien équipage restent dans Relations.
  
  if(abilities.skills[SPECIALTIES[specialty].skill]<SPECIALTIES[specialty].min)
    return {enabled:false,reason:'Compétence insuffisante : entraînez-vous avant de postuler.'};
  const retries=career.notices.filter(n=>n.age===life.age&&n.type==='application').length;
  const chance=scaledChance(Math.min(95,Math.max(20,CREWS[crewId].baseChance+
    Math.floor(abilities.skills[SPECIALTIES[specialty].skill]/5)+
    Math.floor(relations.world.reputation/12))),retries);
  return {enabled:true,chance};
}
export function applyForCrew(career,relations,abilities,life,crewId,specialty,random=Math.random){
  const offer=hiringAvailability(career,relations,abilities,life,crewId,specialty);
  if(!offer.enabled)return null;
  const n=random();
  if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Tirage invalide');
  const age=life.age;
  if(n>=offer.chance/100){
    const text='Votre candidature au poste de '+SPECIALTIES[specialty].label+
      ' a été refusée par '+CREWS[crewId].label+'.';
    return {career:stamp({...career,appliedAtAge:age},age,'application',text),
      relationships:relations,accepted:false};
  }
  let nextRel=relations;
  if(relations.world.faction==='independent'){
    nextRel=joinFaction(relations,life,'pirate',random,CREWS[crewId].label);
    if(!nextRel)return null;
  }
  const starting=cap(37+Math.round(abilities.skills[SPECIALTIES[specialty].skill]/4));
  const pirate={crewId,specialty,joinedAtAge:age,tenure:0,
    rank:0,performance:starting,workUsed:0,askedAtAge:-1};
  const text='Vous rejoignez '+CREWS[crewId].label+
    ' comme '+SPECIALTIES[specialty].label+'.';
  nextRel={...nextRel,world:{...nextRel.world,unit:CREWS[crewId].label}};
  return {career:stamp({...career,pirate,appliedAtAge:age},age,'hire',text),
    relationships:nextRel,accepted:true};
}
export function workHard(career,life,abilities){
  const pirate=career.pirate;
  if(!life?.alive||!pirate)return null;
  const updated={...pirate,workUsed:nextCount(pirate.workUsed),
    performance:cap(pirate.performance+scaledBenefit(5,pirate.workUsed))};
  return stamp({...career,pirate:updated},life.age,'work',
    'Vous redoublez d’efforts au sein de votre équipage.');
}
export function promotionAvailability(career,relations,abilities,life){
  const p=career.pirate;
  if(!life?.alive||!p||p.rank>=RANKS.length-2)
    return {enabled:false,reason:'Aucun grade supérieur disponible.'};
  const leader=relations.people.find(person=>person.id==='world-leader'&&!person.deceased);
  if(!leader)return {enabled:false,reason:'Votre capitaine n’est plus disponible.'};
  const tenureMin=p.rank===0?2:4;
  const perfMin=p.rank===0?52:68;
  if(p.tenure<tenureMin)return {enabled:false,reason:'Ancienneté insuffisante.'};
  if(p.performance<perfMin)return {enabled:false,reason:'Performance insuffisante.'};
  if(abilities.injury.level===2)
    return {enabled:false,reason:'Une blessure sérieuse empêche la promotion.'};
  const skill=abilities.skills[SPECIALTIES[p.specialty].skill];
  // Score dynamique : bon travail, compétence, confiance et loyauté.
  const chance=Math.min(90,Math.max(8,Math.round(
    12+(p.performance-50)*.85+skill*.22+
    (leader.trust-45)*.42+(relations.world.loyalty-45)*.16+
    (relations.world.reputation-10)*.09-
    (p.rank===1?12:0)-(abilities.fatigue>65?10:0))));
  return {enabled:true,chance,leader};
}
export function requestPromotion(career,relations,abilities,life,random=Math.random){
  const access=promotionAvailability(career,relations,abilities,life);
  if(!access.enabled)return null;
  const roll=random();
  if(!Number.isFinite(roll)||roll<0||roll>=1)throw new TypeError('Tirage invalide');
  const success=roll<access.chance/100;
  const p=career.pirate;
  const rank=success?p.rank+1:p.rank;
  const text=success?
    'Votre capitaine vous nomme '+RANKS[rank]+'.':
    'Votre capitaine refuse votre demande de promotion.';
  return {career:stamp({...career,pirate:{...p,rank,askedAtAge:life.age,
    performance:cap(p.performance+(success?2:-2))}},life.age,
    success?'promotion':'rejection',text),success};
}
export function ageCareer(career,abilities,life,relations=null,random=null){
  const p=career.pirate;
  if(!p)return {career:ageMissions(career),note:''};
  const skill=abilities.skills[SPECIALTIES[p.specialty].skill];
  const fatiguePenalty=abilities.fatigue>=70?3:abilities.fatigue>=40?1:0;
  const injuryPenalty=abilities.injury.level===2?7:
    abilities.injury.level===1?3:0;
  const delta=Math.round(skill/20)-2-fatiguePenalty-injuryPenalty;
  const performance=cap(p.performance+delta);
  const tenure=life.age-p.joinedAtAge;
  let next={...p,tenure,workUsed:0,performance};
  let result={...career,pirate:next},note='';
  // Possibilité de sanction pour performances faibles et loyauté dégradée.
  if(!career.command && relations && random && performance<=28 && tenure>=2){
    if(random()<Math.min(.65,(35-performance)/70+
      (relations.world.loyalty<30?.15:0))){
      next={...next,performance:cap(performance-4)};
      note='Votre capitaine vous adresse un avertissement pour vos faibles performances.';
      result=stamp({...career,pirate:next},life.age,'sanction',note);
    }
  }
  // Promotion annuelle possible, jamais garantie; la demande manuelle reste distincte.
  if(relations && !note && random){
    const leader=relations.people.find(person=>person.id==='world-leader'&&!person.deceased);
    const eligible=next.rank<RANKS.length-2 &&
      next.tenure>=(next.rank===0?2:4) &&
      next.performance>=(next.rank===0?52:68) &&
      abilities.injury.level!==2 && leader;
    if(eligible){
      const chance=Math.max(.02,Math.min(.34,
        .04+(next.performance-50)/300+
        (leader.trust-50)/750+(skill-15)/800));
      if(random()<chance){
        next={...next,rank:next.rank+1,performance:cap(next.performance+2)};
        note='Votre capitaine vous promeut '+RANKS[next.rank]+'.';
        result=stamp({...career,pirate:next},life.age,'promotion',note);
      }
    }
  }
  const managed=ageCommand(ageMissions(result),life.age,random??Math.random);
  return {career:managed.career,note:[note,managed.note].filter(Boolean).join(' ')};
}
