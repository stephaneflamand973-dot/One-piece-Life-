import { isValidState, createEmptyState, SCHEMA_VERSION } from './state.mjs';
import { createFamily } from './relationships.mjs';
import { legacyProfile } from './personality.mjs';

export const SAVE_KEY='opl:foundation:life-v042';
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
/** V0.4.1 -> V0.4.2 : conserver la famille et ajouter uniquement le carnet PNJ. */
export function migrateV05(data){
  if(!data||data.schemaVersion!==5||!Array.isArray(data.history)||
    !data.domainData||Object.keys(data.domainData).length!==2||
    !Object.hasOwn(data.domainData,'story')||
    !Object.hasOwn(data.domainData,'relationships'))return null;
  const rel=data.domainData.relationships;
  if(!rel||!Array.isArray(rel.people)||!Array.isArray(rel.records)||
    Object.hasOwn(rel,'pending')||Object.hasOwn(rel,'initiatives'))return null;
  const candidate={...data,schemaVersion:SCHEMA_VERSION,domainData:{
    story:data.domainData.story,relationships:{...rel,pending:null,initiatives:[]}
  }};
  return isValidState(candidate)?candidate:null;
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
  const candidate={...data,schemaVersion:SCHEMA_VERSION,
    domainData:{story:data.domainData.story,relationships}};
  return isValidState(candidate)?candidate:null;
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
