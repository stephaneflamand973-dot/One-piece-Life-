/**
 * V0.4 : famille, amis et liens persistants.
 * Logique pure, indépendante des écrans. Aucun lien fictif affiché avant la création.
 */
import { ACTIONS, clamp, createProfile, isProfile, resolveReaction } from './personality.mjs';
import { INITIATIVE_TYPES, INITIATIVE_AGES } from './initiatives.mjs';
import { validRomance, MAX_PARTNERS, MAX_CHILDREN, advanceRomance } from './romance.mjs';
import { emptyWorld, isValidWorld, WORLD_ROLES } from './world-relations.mjs';
import { emptySocialData, syncCircle, recordFriendshipMilestones,
  ageCircle, isValidSocial, MAX_SIBLINGS, FAMILY_BIRTH_YEARS } from './social-evolution.mjs';
export { ACTIONS, TRAITS, TRAIT_LABELS, reactionChance, availability } from './personality.mjs';
const FIRST = Object.freeze(['Sora','Mika','Nora','Kaito','Lina','Toma','Riku','Aya','Ren','Yuna','Kenji','Robin']);
import {nextCount} from './diminishing.mjs';
/** Interactions au rendement ordinaire, sans plafond annuel. */
export const MAX_ACTIONS_PER_YEAR = 3;
export const MAX_FRIENDS = 4;
function draw(random) {
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1) throw new TypeError('Tirage invalide');
  return n;
}
function take(list,random){return list[Math.floor(draw(random)*list.length)];}
function offset(range,random){return range[0]+Math.floor(draw(random)*(range[1]-range[0]+1));}
export function emptyRelations(){
  return {people:[],actionsUsed:0,records:[],recent:'',pending:null,initiatives:[],...emptySocialData(),world:emptyWorld()};
}
function person({id,role,firstName,lastName,ageOffset,bond,deathAge,createdAtAge=0,age=0},random){
  return createProfile({id,role,firstName,lastName,ageOffset,bond,deathAge,
    createdAtAge,lastActionAge:-1,deceased:age+ageOffset>=deathAge},random);
}
export function createFamily(character,random=Math.random,currentAge=0){
  const mother=person({id:'mother',role:'mother',firstName:take(FIRST,random),
    lastName:character.lastName,ageOffset:offset([24,39],random),
    bond:offset([65,82],random),deathAge:offset([78,98],random),age:currentAge},random);
  const father=person({id:'father',role:'father',firstName:take(FIRST,random),
    lastName:character.lastName,ageOffset:offset([25,42],random),
    bond:offset([60,80],random),deathAge:offset([78,100],random),age:currentAge},random);
  const count=offset([0,2],random);
  const siblings=Array.from({length:count},(_,i)=>person({
    id:'sibling-'+(i+1),role:'sibling',firstName:take(FIRST,random),
    lastName:character.lastName,ageOffset:offset([1,7],random),
    bond:offset([47,76],random),deathAge:offset([77,101],random),age:currentAge
  },random));
  return {...emptyRelations(),people:[mother,father,...siblings]};
}
export function isValidRelations(relations,age,started,history=null){
  if (!relations || typeof relations!=='object' || Array.isArray(relations) ||
      !Array.isArray(relations.people) || !Array.isArray(relations.records) ||
      !Array.isArray(relations.initiatives) || relations.initiatives.length>INITIATIVE_AGES.length ||
      typeof relations.recent!=='string' || relations.recent.length>180 ||
      !Number.isInteger(relations.actionsUsed) || relations.actionsUsed<0 ||
      !Number.isSafeInteger(relations.actionsUsed) ||
      relations.records.length>30) return false;
  const people=relations.people;
  if (!started) return people.length===0 && relations.actionsUsed===0 &&
    relations.records.length===0 && relations.recent==='' &&
    relations.pending===null && relations.initiatives.length===0 &&
    isValidSocial(relations,age,false) && validRomance(relations,age,false) && isValidWorld(relations,age,false);
  if (people.length<2 || people.length>2+MAX_SIBLINGS+MAX_FRIENDS+MAX_PARTNERS+MAX_CHILDREN+WORLD_ROLES.length) return false;
  const ids=new Set();
  let mother=0,father=0,sibling=0,friend=0;
  for(const p of people){
    if (!p || typeof p.id!=='string' || ids.has(p.id) ||
        !['mother','father','sibling','friend','partner','child',...WORLD_ROLES].includes(p.role) ||
        typeof p.firstName!=='string' || !p.firstName.trim() || p.firstName.length>32 ||
        typeof p.lastName!=='string' || !p.lastName.trim() || p.lastName.length>32 ||
        !Number.isInteger(p.ageOffset) || p.ageOffset< -120 || p.ageOffset>55 ||
        !Number.isInteger(p.bond) || p.bond<0 || p.bond>100 ||
        !Number.isInteger(p.deathAge) || p.deathAge<65 || p.deathAge>105 ||
        !Number.isInteger(p.createdAtAge) || p.createdAtAge<0 || p.createdAtAge>age ||
        !Number.isInteger(p.lastActionAge) || p.lastActionAge< -1 ||
        p.lastActionAge>age || p.deceased !== (age+p.ageOffset>=p.deathAge) ||
        !isProfile(p)) return false;
    if(p.role==='mother'){mother++;if(p.id!=='mother'||p.createdAtAge!==0) return false;}
    if(p.role==='father'){father++;if(p.id!=='father'||p.createdAtAge!==0) return false;}
    if(p.role==='sibling'){sibling++;if(p.id!=='sibling-'+sibling ||
      !(p.createdAtAge===0 ||
        (FAMILY_BIRTH_YEARS.includes(p.createdAtAge) &&
         p.ageOffset===-p.createdAtAge))) return false;}
    if(p.role==='friend'){friend++;if(p.id!=='friend-'+friend||p.createdAtAge<6||
      p.createdAtAge+p.ageOffset<3) return false;}
    ids.add(p.id);
  }
  if(mother!==1||father!==1||sibling>MAX_SIBLINGS||friend>MAX_FRIENDS) return false;
  if(age<3 && relations.actionsUsed>0) return false;
  for(const rec of relations.records){
    if(!rec||!Number.isInteger(rec.age)||rec.age<0||rec.age>age||
      !ids.has(rec.personId)||!['talk','spend','argue','gift','help','confide','apologize','meet','loss','initiative','birth','group','romance-meet','romance-date','romance-marriage','romance-separation','romance-child','world'].includes(rec.action)||
      typeof rec.text!=='string'||!rec.text.trim()||rec.text.length>180 ||
      (rec.outcome!==undefined &&
        (!['positive','negative'].includes(rec.outcome) ||
         !Number.isInteger(rec.chance)||rec.chance<0||rec.chance>100 ||
         !Number.isInteger(rec.delta)||rec.delta< -100||rec.delta>100))) return false;
  }
  const observed=new Set();
  for(const event of relations.initiatives){
    if(!event || !Number.isInteger(event.age) || !INITIATIVE_AGES.includes(event.age) ||
      event.age>age || observed.has(event.age) || !ids.has(event.personId) ||
      !Object.hasOwn(INITIATIVE_TYPES,event.eventId) ||
      !['accept','refuse'].includes(event.option) ||
      (history && history[event.age]?.type!=='npc-decision')) return false;
    observed.add(event.age);
  }
  const pending=relations.pending;
  if(pending!==null){
    if(!pending || !Number.isInteger(pending.age) || pending.age!==age ||
      !INITIATIVE_AGES.includes(pending.age) || observed.has(pending.age) ||
      !ids.has(pending.personId) || !Object.hasOwn(INITIATIVE_TYPES,pending.eventId) ||
      (history && history[age]?.type!=='npc-event')) return false;
  }
  if(history && (history.filter(entry=>entry.type==='npc-decision').length!==relations.initiatives.length ||
    history.filter(entry=>entry.type==='npc-event').length!==(pending?1:0)))return false;
  return isValidSocial(relations,age,true) && validRomance(relations,age,true) && isValidWorld(relations,age,true);
}
export function advanceRelations(relations,newAge){
  const losses=[];
  const people=relations.people.map(p=>{
    const deceased = p.deceased || newAge+p.ageOffset >=p.deathAge;
    if(!p.deceased && deceased) losses.push(p);
    // Sans contact, les amitiés se refroidissent plus vite que les liens familiaux.
    const activeLastYear = p.lastActionAge===newAge-1;
    const fade = deceased || activeLastYear ? 0 :
      p.role==='friend' ? Math.max(0,3-Math.floor(p.traits.loyalty/40)) :
      p.role==='sibling' && p.traits.loyalty<45 ? 1 : 0;
    return {...p,deceased,bond:clamp(p.bond-fade)};
  });
  const announcements=losses.map(p=>p.firstName+' '+p.lastName+' est décédé(e).');
  const records=[...relations.records,...losses.map(p=>({
    age:newAge,personId:p.id,action:'loss',text:p.firstName+' '+p.lastName+' est décédé(e).'
  }))].slice(-30);
  const aged=ageCircle({...relations,people,actionsUsed:0,records,
    recent: announcements.length ? announcements.join(' ') : relations.recent},newAge);
  const romance=advanceRomance(aged,newAge);
  return {relations:romance.relations,
    announcements:[...announcements,...romance.announcements]};
}
export function interact(relations,personId,action,age,solidarity=0,random=Math.random){
  if(age<3 || !ACTIONS[action]) return null;
  const contact=relations.people.find(p=>p.id===personId);
  if(!contact) return null;
  const reaction=resolveReaction(relations,contact,action,age,solidarity,random);
  if(!reaction) return null;
  return recordFriendshipMilestones({...relations,
    people:relations.people.map(p=>p.id===personId?reaction.updated:p),
    actionsUsed:nextCount(relations.actionsUsed),
    records:[...relations.records,reaction.record].slice(-30),
    recent:reaction.record.text},age);
}
export function meetFriend(relations,character,age,random=Math.random){
  if(age<6) return null;
  const current=relations.people.filter(p=>p.role==='friend').length;
  if(current>=MAX_FRIENDS) return null;
  const name=take(FIRST,random);
  const ageDifference=offset(age<18?[-2,2]:[-4,4],random);
  const friend=person({id:'friend-'+(current+1),role:'friend',
    firstName:name,lastName:take(['Sol','Vent','Brume','Dawn','Marin'],random),
    ageOffset:ageDifference,bond:offset([43,59],random),
    deathAge:offset([80,103],random),createdAtAge:age,age},random);
  const text='Vous faites connaissance avec '+name+' au port.';
  return syncCircle({...relations,people:[...relations.people,friend],
    actionsUsed:nextCount(relations.actionsUsed),
    records:[...relations.records,{age,personId:friend.id,action:'meet',text}].slice(-30),
    recent:text},age);
}
export function socialAnnualNote(relations,age){
  if(age<6 || age%5!==0) return '';
  const closest=relations.people.filter(p=>!p.deceased && p.role==='friend')
    .sort((a,b)=>b.bond-a.bond)[0];
  if(!closest){
    const partner=relations.people.find(p=>p.role==='partner'&&
      (p.status==='dating'||p.status==='married')&&!p.deceased);
    if(partner&&partner.bond>=70)
      return 'Votre relation avec '+partner.firstName+' reste une source de soutien.';
    return '';
  }
  if(closest.bond>=75 && closest.trust>=60) return 'Votre confiance mutuelle entretient votre amitié avec '+closest.firstName+'.';
  if(closest.rivalry>=70) return 'Votre rivalité avec '+closest.firstName+' pèse sur votre amitié.';
  if(closest.bond<=24) return 'Vous sentez que votre amitié avec '+closest.firstName+' s’éloigne.';
  return '';
}
export const roleLabel = role =>
  ({mother:'Mère',father:'Père',sibling:'Fratrie',friend:'Amitié',partner:'Couple',child:'Enfant',leader:'Chef',mentor:'Mentor',ally:'Allié',rival:'Rival'})[role]??'Relation';
