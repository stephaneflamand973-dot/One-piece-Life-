import { isValidState, createEmptyState, SCHEMA_VERSION } from './state.mjs';
import { createFamily } from './relationships.mjs';
import { legacyProfile } from './personality.mjs';
import { syncCircle } from './social-evolution.mjs';
import { emptyWorld } from './world-relations.mjs';
import { createAbilities, emptyAbilities } from './abilities.mjs';
import { emptyCareer } from './pirate-career.mjs';
import { emptyMissions } from './pirate-missions.mjs';
import { emptyWanted } from './pirate-notoriety.mjs';
import { upgradeCommand } from './pirate-crew-life.mjs';

export const SAVE_KEY='opl:foundation:life-v056';
export const V14_SAVE_KEY='opl:foundation:life-v054';
export const V13_SAVE_KEY='opl:foundation:life-v053';
export const V12_SAVE_KEY='opl:foundation:life-v052';
export const V11_SAVE_KEY='opl:foundation:life-v051';
export const V10_SAVE_KEY='opl:foundation:life-v050';
export const V09_SAVE_KEY='opl:foundation:life-v045';
export const V08_SAVE_KEY='opl:foundation:life-v044';
export const V07_SAVE_KEY='opl:foundation:life-v043';
export const V06_SAVE_KEY='opl:foundation:life-v042';
export const V05_SAVE_KEY='opl:foundation:life-v041';
export const V04_SAVE_KEY='opl:foundation:life-v04';
export const V03_SAVE_KEY='opl:foundation:life-v03';
export const PREVIOUS_SAVE_KEY='opl:foundation:life-v02';

function resolveStorage(storage){
  try{return storage===undefined?globalThis.localStorage:storage;}
  catch{return null;}
}
function seededCharacterRandom(person){
  const input=[person.firstName,person.lastName,person.origin?.place,person.origin?.sea].join('|');
  let seed=2166136261;
  for(const char of input)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
// Upgrade sans relancer le personnage ni changer ses relations et interactions existantes.
/** V0.5.5 -> V0.5.6 : enrichissement déterministe des compagnons existants. */
export function migrateV14(data){
 if(!data||data.schemaVersion!==14||!data.domainData?.career||
    !Object.hasOwn(data.domainData.career,'command'))return null;
 const career=data.domainData.career;
 const candidate={...data,schemaVersion:SCHEMA_VERSION,
  domainData:{...data.domainData,career:{...career,
   command:upgradeCommand(career.command)}}};
 return isValidState(candidate)?candidate:null;
}

/** V0.5.3 -> V0.5.4 : commandement facultatif, jamais de perte de Berrys. */
export function migrateV13(data){
  if(!data||data.schemaVersion!==13||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==4||
    !['story','relationships','abilities','career'].every(k=>Object.hasOwn(data.domainData,k)))
    return null;
  const career=data.domainData.career;
  if(!career||Object.hasOwn(career,'command')||!Object.hasOwn(career,'wanted'))
    return null;
  const candidate={...data,schemaVersion:SCHEMA_VERSION,
    domainData:{...data.domainData,career:{...career,command:null}}};
  return isValidState(candidate)?candidate:null;
}
/** V0.5.2 -> V0.5.3 : ajout d'une notoriété neutre sans réécriture de l'historique. */
export function migrateV12(data){
  if(!data||data.schemaVersion!==12||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==4||
    !['story','relationships','abilities','career'].every(k=>Object.hasOwn(data.domainData,k)))
    return null;
  const career=data.domainData.career;
  if(!career||Object.hasOwn(career,'wanted')||!Object.hasOwn(career,'missions'))return null;
  return migrateV13({...data,schemaVersion:13,
    domainData:{...data.domainData,career:{...career,wanted:emptyWanted()}}});
}
/** V0.5.1 -> V0.5.2 : missions vierges, sans toucher à l'existant. */
export function migrateV11(data){
  if(!data||data.schemaVersion!==11||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==4||
    !['story','relationships','abilities','career'].every(k=>Object.hasOwn(data.domainData,k)))
    return null;
  const career=data.domainData.career;
  if(!career||Object.hasOwn(career,'missions'))return null;
  return migrateV12({...data,schemaVersion:12,
    domainData:{...data.domainData,career:{...career,missions:emptyMissions()}}});
}
/** V0.5.0 -> V0.5.1 : ajouter blessures, repos et demandes de promotion, sans
 * recalculer les talents ni modifier une seule relation ou année. */
export function migrateV10(data){
  if(!data||data.schemaVersion!==10||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==4||
    !['story','relationships','abilities','career'].every(k=>
      Object.hasOwn(data.domainData,k)))return null;
  const a=data.domainData.abilities,c=data.domainData.career;
  if(!a||!Array.isArray(a.log)||Object.hasOwn(a,'injury')||
    Object.hasOwn(a,'restUsed')||!c||!Object.hasOwn(c,'pirate')||
    (c.pirate!==null&&(!c.pirate||Object.hasOwn(c.pirate,'askedAtAge'))))return null;
  const abilities={...a,injury:{level:0,recoverAtAge:null},restUsed:0};
  const career={...c,pirate:c.pirate?{...c.pirate,askedAtAge:-1}:null};
  return migrateV11({...data,schemaVersion:11,domainData:{
    ...data.domainData,abilities,career
  }});
}
/** V0.4.5 -> V0.5.0. La progression et tous les contacts restent identiques. */
export function migrateV09(data){
  if(!data||data.schemaVersion!==9||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==2||
    !Object.hasOwn(data.domainData,'story')||
    !Object.hasOwn(data.domainData,'relationships'))return null;
  if(data.activeLife && (!data.activeLife.origin ||
    typeof data.activeLife.origin.sea!=='string' ||
    typeof data.activeLife.origin.place!=='string'))return null;
  const modern=data.activeLife?createAbilities(data.activeLife):emptyAbilities();
  const {injury,restUsed,...abilities}=modern;
  return migrateV10({...data,schemaVersion:10,domainData:{
    story:data.domainData.story,relationships:data.domainData.relationships,
    abilities,career:(()=>{const {missions,wanted,command,...legacy}=emptyCareer();return legacy;})()
  }});
}
/** V0.4.4 -> V0.4.5 : aucune personne ni progression n'est régénérée. */
export function migrateV08(data){
  if(!data||data.schemaVersion!==8||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==2||
    !Object.hasOwn(data.domainData,'story')||
    !Object.hasOwn(data.domainData,'relationships'))return null;
  const rel=data.domainData.relationships;
  if(!rel||!Array.isArray(rel.people)||!Array.isArray(rel.records)||
    !Array.isArray(rel.groups)||!Array.isArray(rel.milestones)||
    Object.hasOwn(rel,'world'))return null;
  return migrateV09({...data,schemaVersion:9,domainData:{
    story:data.domainData.story,relationships:{...rel,world:emptyWorld()}
  }});
}
/** Les vies V0.4.3 gardent tous leurs liens inchangés en V0.4.4. */
export function migrateV07(data){
  if(!data||data.schemaVersion!==7||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==2||
    !Object.hasOwn(data.domainData,'story')||
    !Object.hasOwn(data.domainData,'relationships'))return null;
  const rel=data.domainData.relationships;
  if(!rel||!Array.isArray(rel.people)||!Array.isArray(rel.records)||
    !Array.isArray(rel.groups)||!Array.isArray(rel.milestones))return null;
  return migrateV08({...data,schemaVersion:8});
}
/** V0.4.2 -> V0.4.3 : restituer le cercle social des amis existants, sans changer les PNJ. */
export function migrateV06(data){
  if(!data || data.schemaVersion!==6 || !Array.isArray(data.history) ||
    !data.domainData || Object.keys(data.domainData).length!==2 ||
    !Object.hasOwn(data.domainData,'story') ||
    !Object.hasOwn(data.domainData,'relationships'))return null;
  const rel=data.domainData.relationships;
  if(!rel || !Array.isArray(rel.people) || !Array.isArray(rel.records) ||
    !Array.isArray(rel.initiatives) || Object.hasOwn(rel,'groups') ||
    Object.hasOwn(rel,'milestones'))return null;
  const age=data.activeLife?.age??0;
  if(!Number.isInteger(age)||age<0||age>120)return null;
  const social=syncCircle({...rel,groups:[],milestones:[]},age);
  return migrateV07({...data,schemaVersion:7,domainData:{
    story:data.domainData.story,relationships:social
  }});
}
/** V0.4.1 -> V0.4.2 : conserver la famille et ajouter uniquement le carnet PNJ. */
export function migrateV05(data){
  if(!data||data.schemaVersion!==5||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==2||
    !Object.hasOwn(data.domainData,'story')||
    !Object.hasOwn(data.domainData,'relationships'))return null;
  const rel=data.domainData.relationships;
  if(!rel||!Array.isArray(rel.people)||!Array.isArray(rel.records)||
    Object.hasOwn(rel,'pending')||Object.hasOwn(rel,'initiatives'))return null;
  return migrateV06({...data,schemaVersion:6,domainData:{
    story:data.domainData.story,relationships:{...rel,pending:null,initiatives:[]}
  }});
}
export function migrateV04(data){
  if(!data||data.schemaVersion!==4||!Array.isArray(data.history)||
    !data.domainData||typeof data.domainData!=='object'||
    Object.keys(data.domainData).length!==2||
    !Object.prototype.hasOwnProperty.call(data.domainData,'story')||
    !Object.prototype.hasOwnProperty.call(data.domainData,'relationships'))return null;
  const rel=data.domainData.relationships;
  if(!rel||!Array.isArray(rel.people)||!Array.isArray(rel.records))return null;
  if(data.activeLife===null&&(data.history.length!==0||rel.people.length!==0))return null;
  if(data.activeLife!==null&&(!data.activeLife||
    !Number.isInteger(data.activeLife.age)))return null;
  if(!Number.isInteger(rel.actionsUsed)||rel.actionsUsed<0||rel.actionsUsed>2)return null;
  if(rel.people.some(person=>person?.traits!==undefined||
    person?.trust!==undefined||person?.respect!==undefined||person?.rivalry!==undefined))
    return null;
  const upgraded={...rel,people:rel.people.map(person=>person&&
    typeof person==='object'?legacyProfile(person):person)};
  return migrateV05({...data,schemaVersion:5,
    domainData:{story:data.domainData.story,relationships:upgraded}});
}
export function migrateV03(data){
  if(!data||data.schemaVersion!==3||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==1||
    !Object.prototype.hasOwnProperty.call(data.domainData,'story'))return null;
  if(data.activeLife===null&&data.history.length!==0)return null;
  if(data.activeLife!==null&&(!data.activeLife||
    !Number.isInteger(data.activeLife.age)))return null;
  const relationships=data.activeLife===null
    ?createEmptyState().domainData.relationships
    :createFamily(data.activeLife,seededCharacterRandom(data.activeLife),data.activeLife.age);
  return migrateV09({...data,schemaVersion:9,
    domainData:{story:data.domainData.story,relationships}});
}
export function migrateV02(data){
  if(!data||data.schemaVersion!==2||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==0)return null;
  const c=data.activeLife;
  if(c===null){
    if(data.history.length)return null;
    return createEmptyState();
  }
  if(!c||!Number.isInteger(c.age)||c.age<0||c.age>120||
    c.alive!==(c.age<120)||data.history.length!==c.age+1||
    !data.history.every((e,i)=>e&&e.age===i&&
      e.type===(i===0?'birth':i===120?'end':'year')&&
      typeof e.text==='string'))return null;
  return migrateV03({schemaVersion:3,activeLife:c,history:data.history,
    domainData:{story:createEmptyState().domainData.story}});
}
export function loadState(storage){
  try{
    const store=resolveStorage(storage);
    if(!store)return null;
    const raw=store.getItem(SAVE_KEY);
    // Un état plus récent existant ne doit jamais être écrasé par une ancienne version.
    if(raw!==null&&raw!==undefined){
      const candidate=JSON.parse(raw);
      return isValidState(candidate)?candidate:null;
    }
    const versions=[
      [V14_SAVE_KEY,migrateV14],
      [V13_SAVE_KEY,migrateV13],
      [V12_SAVE_KEY,migrateV12],
      [V11_SAVE_KEY,migrateV11],
      [V10_SAVE_KEY,migrateV10],
      [V09_SAVE_KEY,migrateV09],
      [V08_SAVE_KEY,migrateV08],
      [V07_SAVE_KEY,migrateV07],
      [V06_SAVE_KEY,migrateV06],
      [V05_SAVE_KEY,migrateV05],
      [V04_SAVE_KEY,migrateV04],
      [V03_SAVE_KEY,migrateV03],
      [PREVIOUS_SAVE_KEY,migrateV02]
    ];
    for(const [key,migrate] of versions){
      const original=store.getItem(key);
      if(original!==null&&original!==undefined){
        const upgraded=migrate(JSON.parse(original));
        return upgraded&&saveState(upgraded,store)?upgraded:null;
      }
    }
    return null;
  }catch{return null;}
}
export function saveState(state,storage){
  if(!isValidState(state))return false;
  try{
    const store=resolveStorage(storage);
    if(!store)return false;
    store.setItem(SAVE_KEY,JSON.stringify(state));
    return true;
  }catch{return false;}
}
export function eraseState(storage){
  return saveState(createEmptyState(),storage);
}
