/**
 * V0.4.5 : affiliations et contacts propres à l'univers One Piece.
 * Mécaniques indépendantes des écrans et des narrations canoniques.
 */
import { clamp, draw, createProfile } from './personality.mjs';
import {scaledBenefit,scaledChance,nextCount} from './diminishing.mjs';

export const FACTIONS=Object.freeze({
  pirate:{label:'Pirates',unit:'Équipage des Alizés',leader:'Capitaine'},
  marine:{label:'Marine',unit:'Base de la Mouette',leader:'Commandant'},
  revolutionary:{label:'Révolutionnaires',unit:'Cellule du Vent',leader:'Responsable'}
});
export const WORLD_ROLES=Object.freeze(['leader','mentor','ally','rival']);
export const WORLD_ACTIONS=Object.freeze({
  train:{label:"S'entraîner avec le mentor",role:'mentor',base:83},
  mission:{label:"Participer à une mission",role:'leader',base:74},
  protect:{label:"Soutenir un allié",role:'ally',base:80},
  challenge:{label:"Défier un rival",role:'rival',base:58}
});
export const WORLD_YEARS=Object.freeze([20,26,34,47,60,77]);
const FIRST=Object.freeze(['Akari','Kaito','Sora','Tora','Mika','Haru','Ren','Aya','Niko','Iro']);
const LAST=Object.freeze(['du Vent','de l’Aube','Corail','du Phare','des Brumes']);
const pick=(list,random)=>list[Math.floor(draw(random)*list.length)];
const cap=x=>clamp(x);
export function emptyWorld(){return {
  faction:'independent',reputation:0,loyalty:0,
  standings:{pirate:40,marine:40,revolutionary:40},
  joinedAtAge:null,lastActionAge:-1,log:[]
};}
export function worldContacts(rel){
  return rel.people.filter(person=>WORLD_ROLES.includes(person.role));
}
export function joinFaction(rel,life,faction,random=Math.random,unitOverride=null){
  if(!Object.hasOwn(FACTIONS,faction)||rel.world.faction!=='independent'||
    life.age<16||life.age>65)return null;
  const age=life.age;
  const contacts=WORLD_ROLES.map((role,index)=>{
    const id='world-'+role;
    const worldAge=role==='leader'?40+Math.floor(draw(random)*16):
      role==='mentor'?35+Math.floor(draw(random)*15):
      20+Math.floor(draw(random)*17);
    const offset=worldAge-age;
    return createProfile({id,role,firstName:pick(FIRST,random),
      lastName:pick(LAST,random),worldFaction:faction,
      ageOffset:offset,bond:role==='rival'?28:role==='leader'?57:64,
      deathAge:85+Math.floor(draw(random)*18),
      createdAtAge:age,lastActionAge:-1,deceased:false},random);
  });
  const standings={...rel.world.standings,[faction]:55};
  if(faction==='pirate')standings.marine=25;
  if(faction==='marine')standings.pirate=25;
  const unit=unitOverride??FACTIONS[faction].unit;
  const text="Vous rejoignez "+unit+".";
  const world={...rel.world,faction,reputation:8,loyalty:48,standings,
    joinedAtAge:age,unit,
    log:[{age,action:'join',personId:'world-leader',text}]};
  return {...rel,people:[...rel.people,...contacts],world,
    actionsUsed:nextCount(rel.actionsUsed),recent:text,
    records:[...rel.records,{age,personId:'world-leader',action:'world',text}].slice(-30)};
}
export function worldActionAvailability(rel,action,age){
  const entry=WORLD_ACTIONS[action],world=rel.world;
  if(!entry||world.faction==='independent')
    return {enabled:false,reason:"Rejoignez d'abord une faction."};
  const target=rel.people.find(p=>p.role===entry.role);
  if(!target||target.deceased)return {enabled:false,reason:'Ce contact n’est plus disponible.'};
  const chance=scaledChance(cap(entry.base+
    (target.trust-50)/7+(target.bond-50)/6+
    (world.loyalty-50)/8+(world.reputation-50)/12-
    (action==='challenge'?target.rivalry/9:0)),rel.actionsUsed);
  return {enabled:true,chance,target};
}
export function takeWorldAction(rel,action,age,random=Math.random){
  const available=worldActionAvailability(rel,action,age);
  if(!available.enabled)return null;
  const target=available.target;
  const positive=draw(random)<available.chance/100;
  const adjust=n=>n>0?scaledBenefit(n,rel.actionsUsed):n;
  const score=action==='challenge'?(positive?adjust(12):-7):positive?adjust(7):-5;
  const loyaltyDelta=action==='mission'?(positive?adjust(9):-7):
    action==='protect'?(positive?adjust(5):-4):
    action==='train'?(positive?adjust(3):-2):
    positive?adjust(2):-3;
  const bondDelta=action==='challenge'?(positive?-3:-8):(positive?adjust(8):-6);
  const text={
    train:positive?'Votre mentor reconnaît vos progrès.':'Votre entraînement se passe difficilement.',
    mission:positive?'Votre mission renforce la réputation de votre groupe.':
      'Votre mission échoue et votre réputation recule.',
    protect:positive?'Votre soutien consolide votre alliance.':
      'Votre allié vous reproche une aide maladroite.',
    challenge:positive?'Votre rival reconnaît votre détermination.':
      'Votre rival prend le dessus lors de votre confrontation.'
  }[action];
  const person={...target,bond:cap(target.bond+bondDelta),
    trust:cap(target.trust+(positive?adjust(6):-5)),
    respect:cap(target.respect+(positive?adjust(8):-4)),
    rivalry:cap(target.rivalry+(action==='challenge'?(positive?-8:11):positive?-2:3)),
    lastActionAge:age};
  const world={...rel.world,reputation:cap(rel.world.reputation+score),
    loyalty:cap(rel.world.loyalty+loyaltyDelta),
    standings:{...rel.world.standings,
      [rel.world.faction]:cap(rel.world.standings[rel.world.faction]+(positive?3:-4))},
    lastActionAge:age,
    log:[rel.world.log[0],...rel.world.log.slice(1).slice(-23),{age,action,personId:target.id,
      outcome:positive?'positive':'negative',chance:available.chance,text}].slice(-25)};
  return {...rel,people:rel.people.map(p=>p.id===target.id?person:p),
    world,actionsUsed:rel.actionsUsed+1,recent:text,
    records:[...rel.records,{age,personId:target.id,action:'world',text}].slice(-30)};
}
export function advanceWorld(rel,age,random=null){
  if(rel.world.faction==='independent'||!WORLD_YEARS.includes(age)||
    age<=rel.world.joinedAtAge||typeof random!=='function')
    return {relations:rel,announcements:[]};
  const world=rel.world;
  const leader=rel.people.find(p=>p.role==='leader');
  const ally=rel.people.find(p=>p.role==='ally');
  const target=leader&&!leader.deceased?leader:ally&&!ally.deceased?ally:null;
  if(!target)return {relations:rel,announcements:[]};
  const chance=cap(35+world.loyalty/3+world.reputation/4+
    world.standings[world.faction]/7);
  if(draw(random)>=Math.min(90,chance)/100)return {relations:rel,announcements:[]};
  const success=world.loyalty>=35&&world.reputation>=20;
  const text=success?
    'Votre groupe vous confie davantage de responsabilités grâce à votre loyauté.':
    'Votre position dans votre faction est fragilisée par un manque de confiance.';
  const rep=cap(world.reputation+(success?6:-5));
  const loyalty=cap(world.loyalty+(success?3:-4));
  const updated={...world,reputation:rep,loyalty,
    standings:{...world.standings,
      [world.faction]:cap(world.standings[world.faction]+(success?2:-3))},
    log:[world.log[0],...world.log.slice(1).slice(-23),{age,action:'annual',personId:target.id,
      outcome:success?'positive':'negative',text}].slice(-25)};
  return {relations:{...rel,world:updated,recent:text},announcements:[text]};
}
export function isValidWorld(rel,age,started){
  const world=rel.world;
  if(!world||typeof world!=='object'||Array.isArray(world)||
    !['independent',...Object.keys(FACTIONS)].includes(world.faction)||
    !Number.isInteger(world.reputation)||world.reputation<0||world.reputation>100||
    !Number.isInteger(world.loyalty)||world.loyalty<0||world.loyalty>100||
    !world.standings||typeof world.standings!=='object'||
    Object.keys(world.standings).length!==3||
    !Object.keys(FACTIONS).every(f=>Number.isInteger(world.standings[f])&&
      world.standings[f]>=0&&world.standings[f]<=100)||
    !Number.isInteger(world.lastActionAge)||world.lastActionAge< -1||
    world.lastActionAge>age||!Array.isArray(world.log)||world.log.length>25)return false;
  if(world.unit!==undefined && (typeof world.unit!=='string'||
    world.unit.length<3||world.unit.length>65))return false;
  const members=worldContacts(rel);
  if(!started||world.faction==='independent'){
    return members.length===0&&world.faction==='independent'&&
      world.reputation===0&&world.loyalty===0&&
      world.joinedAtAge===null&&world.lastActionAge===-1&&
      world.log.length===0&&
      Object.keys(FACTIONS).every(f=>world.standings[f]===40);
  }
  if(!Number.isInteger(world.joinedAtAge)||world.joinedAtAge<16||
    world.joinedAtAge>65||world.joinedAtAge>age||
    members.length!==WORLD_ROLES.length)return false;
  for(const role of WORLD_ROLES){
    const p=members.find(p=>p.role===role);
    if(!p||p.id!=='world-'+role||p.createdAtAge!==world.joinedAtAge||
      p.worldFaction!==world.faction||
      p.createdAtAge+p.ageOffset<18)return false;
  }
  if(!world.log.length||world.log[0].action!=='join'||
    world.log[0].age!==world.joinedAtAge)return false;
  for(const entry of world.log){
    if(!entry||!Number.isInteger(entry.age)||entry.age<world.joinedAtAge||
      entry.age>age||!['join','train','mission','protect','challenge','annual'].includes(entry.action)||
      !members.some(p=>p.id===entry.personId)||
      typeof entry.text!=='string'||!entry.text.trim()||entry.text.length>180||
      (entry.chance!==undefined && (!Number.isInteger(entry.chance)||
        entry.chance<0||entry.chance>100))||
      (entry.outcome!==undefined&&!['positive','negative'].includes(entry.outcome)))
      return false;
  }
  return true;
}
export const worldRoleLabel=(role,faction)=>{
  if(role==='leader')return FACTIONS[faction]?.leader??'Chef';
  return {mentor:'Mentor',ally:'Allié',rival:'Rival'}[role]??'Contact';
};
