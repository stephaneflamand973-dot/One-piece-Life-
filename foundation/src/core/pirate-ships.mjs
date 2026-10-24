/** V0.5.7 : navires persistants, dégâts localisés et économie maritime. */
import {crewEffects} from './pirate-crew-life.mjs';
export const SHIP_MODELS=Object.freeze({
 sloop:{label:'Sloop',price:50000,capacity:4,speed:2,armor:0,firepower:0},
 brig:{label:'Brick',price:140000,capacity:6,speed:5,armor:3,firepower:3},
 frigate:{label:'Frégate',price:350000,capacity:8,speed:6,armor:8,firepower:8}
});
export const SHIP_PARTS=Object.freeze({
 hull:'Coque',sails:'Voiles',rudder:'Gouvernail',cannons:'Canons'
});
import {scaledBenefit} from './diminishing.mjs';
import {usage,used} from './action-usage.mjs';
export const MAX_SHIP_UPGRADE=3;
export const SHIP_MAINTENANCE_COST=9000;
export const PART_REPAIR_COST=6000;
const cap=v=>Math.max(0,Math.min(100,Math.round(v)));
const isScore=v=>Number.isInteger(v)&&v>=0&&v<=100;
const clampedInt=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function newShip(model='sloop',name='Mon navire'){
 if(!Object.hasOwn(SHIP_MODELS,model))return null;
 return {model,name:name.slice(0,65),maintenance:80,
  parts:{sails:78,rudder:80,cannons:76},
  upgrades:{hull:0,sails:0,rudder:0,cannons:0},
  voyages:0};
}
export function upgradeShipSave(command){
 if(!command)return null;
 return {...command,ship:newShip('sloop','Navire de '+command.name.slice(0,48))};
}
export function validShip(ship,command){
 if(!ship||typeof ship!=='object'||Array.isArray(ship)||
    Object.keys(ship).sort().join(',')!=='maintenance,model,name,parts,upgrades,voyages'||
    !Object.hasOwn(SHIP_MODELS,ship.model)||
    typeof ship.name!=='string'||ship.name.trim().length<3||ship.name.length>65||
    !isScore(ship.maintenance)||!Number.isSafeInteger(ship.voyages)||ship.voyages<0||
    !ship.parts||Object.keys(ship.parts).sort().join(',')!=='cannons,rudder,sails'||
    !['sails','rudder','cannons'].every(k=>isScore(ship.parts[k]))||
    !ship.upgrades||Object.keys(ship.upgrades).sort().join(',')!=='cannons,hull,rudder,sails'||
    !Object.keys(SHIP_PARTS).every(k=>clampedInt(ship.upgrades[k],0,MAX_SHIP_UPGRADE)))
    return false;
 return command.members.length<=SHIP_MODELS[ship.model].capacity;
}
export function crewCapacity(command){
 return command?.ship?SHIP_MODELS[command.ship.model].capacity:4;
}
const partCondition=(command,part)=>part==='hull'?command.hull:command.ship.parts[part];
const upgradePrice=(command,part)=>Math.round((20000+command.ship.upgrades[part]*14000)*
  (part==='hull'?1.25:1));
export function shipStats(command){
 if(!command?.ship)return {speed:0,armor:0,firepower:0,condition:0};
 const s=command.ship,m=SHIP_MODELS[s.model],u=s.upgrades,p=s.parts;
 return {speed:cap(20+m.speed*5+p.sails*.28+p.rudder*.18+s.maintenance*.10+
    u.sails*6+u.rudder*5),
  armor:cap(25+m.armor*4+command.hull*.40+s.maintenance*.12+u.hull*8),
  firepower:cap(20+m.firepower*5+p.cannons*.43+u.cannons*9),
  condition:cap((command.hull+p.sails+p.rudder+p.cannons+s.maintenance)/5)};
}
export function shipMissionEffects(command,mission){
 if(!command?.ship)return {chance:0,damageReduction:0};
 const s=command.ship,m=SHIP_MODELS[s.model],stats=shipStats(command);
 return {chance:Math.round((stats.speed-60)*.12+(s.maintenance-65)*.045+
   (['raid','marine'].includes(mission)?(stats.firepower-55)*.11:0)),
   damageReduction:Math.min(8,Math.floor(m.armor*.55+s.upgrades.hull*1.8))};
}
export function shipActionAvailability(career,life,action,partOrModel){
 const cmd=career.command;
 if(!life?.alive||!cmd||cmd.pending||!cmd.ship)
  return {enabled:false,reason:'Réservé au capitaine sans décision en cours.'};
 const wallet=career.missions.berys,s=cmd.ship;
 if(action==='maintain'){
  if(s.maintenance===100)return {enabled:false,reason:'Entretien déjà optimal.'};
  if(wallet<SHIP_MAINTENANCE_COST)return {enabled:false,reason:'Berrys insuffisants.'};
  return {enabled:true,cost:SHIP_MAINTENANCE_COST};
 }
 if(action==='repair'){
  if(!['sails','rudder','cannons'].includes(partOrModel))
   return {enabled:false,reason:'Pièce inconnue.'};
  if(partCondition(cmd,partOrModel)===100)
   return {enabled:false,reason:'Pièce déjà réparée.'};
  if(wallet<PART_REPAIR_COST)return {enabled:false,reason:'Berrys insuffisants.'};
  return {enabled:true,cost:PART_REPAIR_COST};
 }
 if(action==='upgrade'){
  if(!Object.hasOwn(SHIP_PARTS,partOrModel))
   return {enabled:false,reason:'Amélioration inconnue.'};
  if(s.upgrades[partOrModel]>=MAX_SHIP_UPGRADE)
   return {enabled:false,reason:'Amélioration maximale.'};
  const cost=upgradePrice(cmd,partOrModel);
  if(wallet<cost)return {enabled:false,reason:'Berrys insuffisants.',cost};
  return {enabled:true,cost};
 }
 if(action==='purchase'){
  if(!Object.hasOwn(SHIP_MODELS,partOrModel)||s.model===partOrModel)
   return {enabled:false,reason:'Modèle indisponible ou déjà possédé.'};
  if(SHIP_MODELS[partOrModel].capacity<cmd.members.length)
   return {enabled:false,reason:'Capacité trop faible pour cet équipage.'};
  const resale=Math.floor(SHIP_MODELS[s.model].price*.30);
  const cost=Math.max(0,SHIP_MODELS[partOrModel].price-resale);
  if(wallet<cost)return {enabled:false,reason:'Berrys insuffisants.',cost};
  return {enabled:true,cost};
 }
 return {enabled:false,reason:'Action inconnue.'};
}
export function manageShip(career,life,action,value){
 const access=shipActionAvailability(career,life,action,value);
 if(!access.enabled)return null;
 const cmd=career.command,s=cmd.ship;
 const repeatKey='ship:'+(action==='repair'?'repair-'+value:action);
 const count=usage(cmd,repeatKey);
 let ship=s,hull=cmd.hull,text='';
 const mechanic=crewEffects(cmd).hullReduction;
 if(action==='maintain'){
  ship={...s,maintenance:cap(s.maintenance+scaledBenefit(36,count))};
  text='Vous entretenez le navire et améliorez sa fiabilité.';
 }else if(action==='repair'){
  ship={...s,parts:{...s.parts,[value]:cap(s.parts[value]+scaledBenefit(28+mechanic,count))}};
  text='Vous réparez les '+SHIP_PARTS[value].toLowerCase()+' du navire.';
 }else if(action==='upgrade'){
  const levels={...s.upgrades,[value]:s.upgrades[value]+1};
  ship={...s,upgrades:levels};
  text='Amélioration '+SHIP_PARTS[value].toLowerCase()+' niveau '+levels[value]+'/'+MAX_SHIP_UPGRADE+'.';
 }else{
  ship=newShip(value,'Navire de '+life.firstName);
  hull=100;
  ship={...ship,maintenance:100,parts:{sails:100,rudder:100,cannons:100}};
  text='Vous achetez un '+SHIP_MODELS[value].label+'. Ancien navire repris.';
 }
 const next=used({...cmd,ship,hull},repeatKey);
 const notice={age:life.age,type:'ship',text};
 return {...career,command:next,missions:{...career.missions,berys:career.missions.berys-access.cost},
  notices:[...career.notices,notice].slice(-25),lastNotice:text};
}
export function ageShip(command){
 if(!command?.ship)return command;
 const s=command.ship,weak=s.maintenance<30;
 const decay=weak?6:3;
 return {...command,
  ship:{...s,maintenance:cap(s.maintenance-7),
   parts:{sails:cap(s.parts.sails-decay),rudder:cap(s.parts.rudder-(weak?4:2)),
    cannons:cap(s.parts.cannons-2)}}};
}
export function wearShip(command,outcome,mission){
 if(!command?.ship)return command;
 const s=command.ship,hard=['raid','marine'].includes(mission);
 const loss=outcome==='failure'?(hard?12:7):outcome==='partial'?5:2;
 const armor=shipMissionEffects(command,mission).damageReduction;
 const target=hard?'cannons':mission==='escort'?'rudder':'sails';
 return {...command,ship:{...s,voyages:s.voyages+1,
   maintenance:cap(s.maintenance-(hard?6:3)),
   parts:{...s.parts,[target]:cap(s.parts[target]-Math.max(1,loss-Math.floor(armor/2)))}}};
}
