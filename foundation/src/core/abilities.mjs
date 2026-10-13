/**
 * Compétences personnelles V0.5.0, indépendantes de la carrière et des factions.
 * Potentiel = vitesse d'apprentissage (souple), jamais une limite infranchissable.
 */
export const MAX_TRAININGS=3;
export const SKILLS=Object.freeze({
  force:{label:'Force',family:'Physique'},
  vitesse:{label:'Vitesse',family:'Physique'},
  endurance:{label:'Endurance',family:'Physique'},
  technique:{label:'Technique de combat',family:'Combat'},
  armes:{label:'Maîtrise des armes',family:'Combat'},
  volonte:{label:'Volonté',family:'Mental'},
  navigation:{label:'Navigation',family:'Métier'},
  precision:{label:'Précision',family:'Métier'},
  medecine:{label:'Médecine',family:'Métier'},
  cuisine:{label:'Cuisine',family:'Métier'},
  charpenterie:{label:'Charpenterie',family:'Métier'}
});
const KEYS=Object.keys(SKILLS);
const clamp=value=>Math.max(0,Math.min(100,Math.round(value)));
function randomValue(random){
  const n=random();
  if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Tirage invalide');
  return n;
}
function seedFor(life){
  const source=[life.firstName,life.lastName,life.origin.sea,life.origin.place].join('|');
  let seed=2166136261;
  for(const letter of source)seed=Math.imul(seed^letter.charCodeAt(0),16777619)>>>0;
  return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
export function emptyAbilities(){
  return {skills:Object.fromEntries(KEYS.map(key=>[key,0])),
    talents:Object.fromEntries(KEYS.map(key=>[key,0])),
    trainingUsed:0,restUsed:0,fatigue:0,injury:{level:0,recoverAtAge:null},log:[]};
}
export function createAbilities(life){
  const random=seedFor(life);
  return {...emptyAbilities(),
    skills:Object.fromEntries(KEYS.map(key=>[key,8+Math.floor(random()*12)])),
    talents:Object.fromEntries(KEYS.map(key=>[key,35+Math.floor(random()*56)]))};
}
export function validAbilities(abilities,age,started){
  if(!abilities||typeof abilities!=='object'||Array.isArray(abilities)||
    !abilities.skills||!abilities.talents||
    !Number.isInteger(abilities.trainingUsed)||abilities.trainingUsed<0||
    abilities.trainingUsed>MAX_TRAININGS||
    !Number.isInteger(abilities.restUsed)||abilities.restUsed<0||abilities.restUsed>1||
    !abilities.injury||![0,1,2].includes(abilities.injury.level)||
    (abilities.injury.level===0?abilities.injury.recoverAtAge!==null:
      !Number.isInteger(abilities.injury.recoverAtAge)||
      abilities.injury.recoverAtAge<=age)||
    !Number.isInteger(abilities.fatigue)||abilities.fatigue<0||abilities.fatigue>100||
    !Array.isArray(abilities.log)||abilities.log.length>20)return false;
  for(const field of ['skills','talents']){
    const group=abilities[field];
    if(!group||typeof group!=='object'||Array.isArray(group)||
      Object.keys(group).length!==KEYS.length||
      !KEYS.every(key=>Number.isInteger(group[key])&&group[key]>=0&&group[key]<=100))
      return false;
  }
  if(!started)return abilities.trainingUsed===0&&abilities.restUsed===0&&
    abilities.fatigue===0&&abilities.injury.level===0&&
    abilities.log.length===0&&KEYS.every(key=>abilities.skills[key]===0&&
      abilities.talents[key]===0);
  if(age<6&&(abilities.trainingUsed!==0||abilities.log.length!==0))return false;
  for(const item of abilities.log){
    if(!item||!Number.isInteger(item.age)||item.age<6||item.age>age||
      !Object.hasOwn(SKILLS,item.skill)||
      !Number.isInteger(item.gain)||item.gain<0||item.gain>9||
      !Number.isInteger(item.after)||item.after<0||item.after>100||
      (item.mentor!==undefined&&typeof item.mentor!=='boolean')||
      (item.injured!==undefined&&![0,1,2].includes(item.injured)))return false;
  }
  return true;
}
export function trainingAvailability(abilities,life,skill){
  if(!life?.alive||!Object.hasOwn(SKILLS,skill))
    return {enabled:false,reason:'Entraînement indisponible.'};
  if(life.age<6)return {enabled:false,reason:'Entraînement disponible à partir de 6 ans.'};
  if(abilities.trainingUsed>=MAX_TRAININGS)
    return {enabled:false,reason:'Trois séances effectuées cette année.'};
  if(abilities.skills[skill]>=100)
    return {enabled:false,reason:'Capacité déjà maîtrisée au maximum.'};
  if(abilities.injury.level===2)
    return {enabled:false,reason:'Blessure sérieuse : reposez-vous avant de reprendre.'};
  if(abilities.fatigue>=85)
    return {enabled:false,reason:'Fatigue trop élevée. Reposez-vous.'};
  return {enabled:true,reason:''};
}
export function trainSkill(abilities,life,skill,random=Math.random,mentorBonus=0){
  if(!trainingAvailability(abilities,life,skill).enabled)return null;
  const base=2+Math.floor(randomValue(random)*6);
  const talentBonus=abilities.talents[skill]>=75?1:abilities.talents[skill]<45?-1:0;
  const masteryPenalty=abilities.skills[skill]>=85?2:
    abilities.skills[skill]>=65?1:0;
  const fatiguePenalty=abilities.fatigue>=48?2:
    abilities.fatigue>=24?1:0;
  const injuryPenalty=abilities.injury.level===1?1:0;
  const gain=Math.max(1,Math.min(9,base+talentBonus+
    Math.min(2,Math.max(0,mentorBonus))-masteryPenalty-fatiguePenalty-injuryPenalty));
  const after=Math.min(100,abilities.skills[skill]+gain);
  const actual=after-abilities.skills[skill];
  // Une blessure est rare à faible fatigue, plus probable en forçant.
  // Ne jamais créer de blessure irréversible ni tuer le personnage ici.
  const risk=Math.min(.26,.015+abilities.fatigue/480+
    (abilities.injury.level===1?.04:0));
  const injured=randomValue(random)>1-risk;
  const severity=injured?(randomValue(random)>.80?2:1):0;
  const injury=severity?{level:severity,recoverAtAge:life.age+severity}:
    abilities.injury;
  const item={age:life.age,skill,gain:actual,after,
    mentor:mentorBonus>0,injured:severity};
  return {...abilities,
    skills:{...abilities.skills,[skill]:after},
    trainingUsed:abilities.trainingUsed+1,
    fatigue:clamp(abilities.fatigue+18+abilities.trainingUsed*7),
    injury,
    log:[...abilities.log,item].slice(-20)};
}
export function restAbilities(abilities,life){
  if(!life?.alive||abilities.restUsed||life.age<6)return null;
  const injury=abilities.injury.level===2?
    {level:1,recoverAtAge:Math.min(abilities.injury.recoverAtAge,life.age+1)}:
    abilities.injury.level===1?{level:0,recoverAtAge:null}:abilities.injury;
  return {...abilities,restUsed:1,fatigue:Math.max(0,abilities.fatigue-38),
    injury};
}
export function ageAbilities(abilities,lifeAge){
  const injury=abilities.injury.level>0&&abilities.injury.recoverAtAge>lifeAge?
    abilities.injury:{level:0,recoverAtAge:null};
  return {...abilities,trainingUsed:0,restUsed:0,
    fatigue:Math.max(0,abilities.fatigue-45),injury};
}
export function talentLabel(score){
  return score>=85?'Exceptionnel':score>=70?'Très bon':
    score>=55?'Bon':score>=40?'Modéré':'À développer';
}

