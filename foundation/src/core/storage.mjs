import { isValidState, createEmptyState, SCHEMA_VERSION } from './state.mjs';
import { createFamily } from './relationships.mjs';

export const SAVE_KEY='opl:foundation:life-v04';
export const V03_SAVE_KEY='opl:foundation:life-v03';
// Compatibilité publique avec les tests et les sauvegardes V0.2.
export const PREVIOUS_SAVE_KEY='opl:foundation:life-v02';

function resolveStorage(storage) {
  try { return storage===undefined ? globalThis.localStorage : storage; }
  catch { return null; }
}
function seededCharacterRandom(person) {
  const input=[person.firstName,person.lastName,person.origin?.place,person.origin?.sea].join('|');
  let seed=2166136261;
  for(const c of input) seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
  return ()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
}
// Reconstitue une famille stable pour une vie déjà entamée en V0.3.
export function migrateV03(data) {
  if(!data || data.schemaVersion!==3 || !data.domainData ||
      Object.keys(data.domainData).length!==1 ||
      !Object.prototype.hasOwnProperty.call(data.domainData,'story') ||
      !Array.isArray(data.history)) return null;
  if(data.activeLife===null && data.history.length!==0) return null;
  if(data.activeLife!==null && (!data.activeLife ||
      !Number.isInteger(data.activeLife.age))) return null;
  const relationships=data.activeLife===null
    ? createEmptyState().domainData.relationships
    : createFamily(data.activeLife,seededCharacterRandom(data.activeLife),data.activeLife.age);
  const candidate={...data,schemaVersion:SCHEMA_VERSION,
    domainData:{story:data.domainData.story,relationships}};
  return isValidState(candidate)?candidate:null;
}
export function migrateV02(data) {
  if(!data || data.schemaVersion!==2 || !Array.isArray(data.history) ||
      !data.domainData || Object.keys(data.domainData).length!==0) return null;
  const c=data.activeLife;
  if(c===null) {
    if(data.history.length) return null;
    return createEmptyState();
  }
  if(!c || !Number.isInteger(c.age) || c.age<0 || c.age>120 ||
    c.alive!==(c.age<120) || data.history.length!==c.age+1 ||
    !data.history.every((e,index)=>e && e.age===index &&
      e.type===(index===0?'birth':index===120?'end':'year') &&
      typeof e.text==='string')) return null;
  return migrateV03({schemaVersion:3,activeLife:c,history:data.history,
    domainData:{story:createEmptyState().domainData.story}});
}
export function loadState(storage){
  try{
    const store=resolveStorage(storage);
    if(!store) return null;
    const current=store.getItem(SAVE_KEY);
    // Une partie V0.4, même corrompue, empêche de réanimer un ancien état.
    if(current!==null && current!==undefined){
      const parsed=JSON.parse(current);
      return isValidState(parsed)?parsed:null;
    }
    const third=store.getItem(V03_SAVE_KEY);
    if(third!==null && third!==undefined){
      const migrated=migrateV03(JSON.parse(third));
      return migrated && saveState(migrated,store)?migrated:null;
    }
    const second=store.getItem(PREVIOUS_SAVE_KEY);
    if(second===null||second===undefined) return null;
    const migrated=migrateV02(JSON.parse(second));
    return migrated && saveState(migrated,store)?migrated:null;
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
// Ne jamais supprimer V0.2 ou V0.3. Une partie vide V0.4 bloque une migration répétée.
export function eraseState(storage){
  return saveState(createEmptyState(),storage);
}
