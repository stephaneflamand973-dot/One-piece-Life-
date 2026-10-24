import {nextCount} from './diminishing.mjs';
/** Historique annuel compact. Les sauvegardes antérieures n'ont pas cette propriété. */
const KEY=/^(order|ship|crew|navigation):[a-z0-9-]{1,40}$/;
export function usage(command,key){return command?.actionUsage?.[key]??0;}
export function used(command,key){
 if(!KEY.test(key))throw new TypeError('Action invalide');
 return {...command,actionUsage:{...command.actionUsage,[key]:nextCount(usage(command,key))}};
}
export function validUsage(command){
 if(command.actionUsage===undefined)return true;
 const o=command.actionUsage;
 return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length<=110&&
  Object.entries(o).every(([k,v])=>KEY.test(k)&&Number.isSafeInteger(v)&&v>=0);
}
export function resetUsage(command){return {...command,actionUsage:{}};}
