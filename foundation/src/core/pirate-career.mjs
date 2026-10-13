/**
 * Carrière de membre d'équipage V0.5.0.
 * Rang, emploi et performance ne sont pas des compétences personnelles.
 */
import { joinFaction } from './world-relations.mjs';
export const CREWS=Object.freeze({
  alizes:{label:'Équipage des Alizés',baseChance:82},
  aurore:{label:"Équipage de l'Aurore",baseChance:67}
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
export const RANKS=Object.freeze(['Recrue','Membre confirmé']);
const cap=value=>Math.min(100,Math.max(0,Math.round(value)));
const stamp=(career,age,type,text)=>({...career,
  notices:[...career.notices,{age,type,text}].slice(-25),lastNotice:text});
export function emptyCareer(){
  return {pirate:null,appliedAtAge:-1,notices:[],lastNotice:''};
}
export function isValidCareer(career,life,relationships,abilities){
  if(!career||typeof career!=='object'||Array.isArray(career)||
    !Number.isInteger(career.appliedAtAge)||career.appliedAtAge< -1||
    career.appliedAtAge>(life?.age??0)||
    !Array.isArray(career.notices)||career.notices.length>25||
    typeof career.lastNotice!=='string'||career.lastNotice.length>180)
    return false;
  for(const item of career.notices){
    if(!item||!Number.isInteger(item.age)||item.age<16||item.age>(life?.age??0)||
      !['application','hire','work','promotion'].includes(item.type)||
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
    !Number.isInteger(p.rank)||p.rank<0||p.rank>1||
    !Number.isInteger(p.workUsed)||p.workUsed<0||p.workUsed>1||
    !relationships||relationships.world.faction!=='pirate'||
    (relationships.world.unit??CREWS.alizes.label)!==CREWS[p.crewId].label||
    !abilities||abilities.skills[SPECIALTIES[p.specialty].skill]<0)return false;
  if(p.rank===1 && p.tenure<2)return false;
  return career.notices.some(n=>n.type==='hire'&&n.age===p.joinedAtAge);
}
export function hiringAvailability(career,relations,abilities,life,crewId,specialty){
  if(!life?.alive||life.age<16||life.age>65)
    return {enabled:false,reason:'Recrutement disponible entre 16 et 65 ans.'};
  if(career.pirate)return {enabled:false,reason:'Vous appartenez déjà à un équipage.'};
  if(career.appliedAtAge===life.age)
    return {enabled:false,reason:'Vous avez déjà postulé cette année.'};
  if(!Object.hasOwn(CREWS,crewId)||!Object.hasOwn(SPECIALTIES,specialty))
    return {enabled:false,reason:'Poste ou équipage inconnu.'};
  if(!['independent','pirate'].includes(relations.world.faction))
    return {enabled:false,reason:'Vous êtes engagé dans une autre faction.'};
  if(relations.world.faction==='pirate'&&
    (relations.world.unit??CREWS.alizes.label)!==CREWS[crewId].label)
    return {enabled:false,reason:'Votre affiliation actuelle correspond à un autre équipage.'};
  if(relations.world.faction==='independent'&&relations.actionsUsed>=3)
    return {enabled:false,reason:'Plus d’actions sociales cette année.'};
  if(abilities.skills[SPECIALTIES[specialty].skill]<SPECIALTIES[specialty].min)
    return {enabled:false,reason:'Compétence insuffisante : entraînez-vous avant de postuler.'};
  const chance=Math.min(95,Math.max(20,CREWS[crewId].baseChance+
    Math.floor(abilities.skills[SPECIALTIES[specialty].skill]/5)+
    Math.floor(relations.world.reputation/12)));
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
    rank:0,performance:starting,workUsed:0};
  const text='Vous rejoignez '+CREWS[crewId].label+
    ' comme '+SPECIALTIES[specialty].label+'.';
  return {career:stamp({...career,pirate,appliedAtAge:age},age,'hire',text),
    relationships:nextRel,accepted:true};
}
export function workHard(career,life){
  const pirate=career.pirate;
  if(!life?.alive||!pirate||pirate.workUsed>=1)return null;
  const updated={...pirate,workUsed:1,
    performance:cap(pirate.performance+5)};
  return stamp({...career,pirate:updated},life.age,'work',
    'Vous redoublez d’efforts au sein de votre équipage.');
}
export function ageCareer(career,abilities,life){
  const pirate=career.pirate;
  if(!pirate)return {career,note:''};
  const skill=abilities.skills[SPECIALTIES[pirate.specialty].skill];
  const delta=Math.round(skill/20)-2;
  const performance=cap(pirate.performance+delta);
  const tenure=life.age-pirate.joinedAtAge;
  const promote=pirate.rank===0&&tenure>=2&&performance>=52;
  const next={...pirate,tenure,workUsed:0,
    performance:cap(performance+(promote?3:0)),
    rank:promote?1:pirate.rank};
  const note=promote?'Votre capitaine vous promeut membre confirmé.':'';
  return {career:promote?stamp({...career,pirate:next},life.age,'promotion',note):
    {...career,pirate:next},note};
}
