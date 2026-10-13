/**
 * V0.4.3 - Vie familiale et cercle social.
 * Transitions pures; aucun onglet supplémentaire, aucune romance anticipée.
 */
import { clamp, createProfile, draw } from './personality.mjs';

export const FAMILY_BIRTH_YEARS=Object.freeze([4,8,12]);
export const MAX_SIBLINGS=3;
export const GROUP_ID='harbor-circle';
export const GROUP_NAME='Cercle du port';
const NAMES=Object.freeze(['Aiko','Nami','Kaito','Sora','Luna','Ren','Mika','Haru']);

export function emptySocialData(){return {groups:[],milestones:[]};}
export function syncCircle(rel,age){
  const friends=rel.people.filter(p=>p.role==='friend');
  if(friends.length<2)return rel;
  const members=friends.map(p=>p.id);
  const existing=rel.groups[0];
  const group=existing ? {...existing,members} :
    {id:GROUP_ID,name:GROUP_NAME,members,cohesion:55,createdAtAge:age,lastGatherAge:-1};
  return {...rel,groups:[group]};
}
export function recordFriendshipMilestones(rel,age){
  const members=rel.people.filter(p=>p.role==='friend' && p.bond>=80 && p.trust>=65);
  const previous=new Set(rel.milestones.map(m=>m.personId));
  const additions=members.filter(p=>!previous.has(p.id)).map(p=>({
    age,personId:p.id,type:'close-friend'
  }));
  if(!additions.length)return rel;
  const nameList=additions.map(m=>rel.people.find(p=>p.id===m.personId).firstName).join(', ');
  return {...rel,milestones:[...rel.milestones,...additions],
    recent:'Vous avez construit une amitié profonde avec '+nameList+'.'};
}
export function familyBirth(rel,age,character,random){
  if(typeof random!=='function'||!FAMILY_BIRTH_YEARS.includes(age))return {relations:rel,announcements:[]};
  const mother=rel.people.find(p=>p.role==='mother');
  const father=rel.people.find(p=>p.role==='father');
  const siblings=rel.people.filter(p=>p.role==='sibling');
  if(!mother||!father||mother.deceased||father.deceased||
    age+mother.ageOffset>45||siblings.length>=MAX_SIBLINGS)
    return {relations:rel,announcements:[]};
  const chance=Math.min(.45,.20+(mother.bond+father.bond)/800);
  if(draw(random)>=chance)return {relations:rel,announcements:[]};
  const firstName=NAMES[Math.floor(draw(random)*NAMES.length)];
  const next= createProfile({
    id:'sibling-'+(siblings.length+1),role:'sibling',firstName,
    lastName:character.lastName,ageOffset:-age,
    bond:57+Math.floor(draw(random)*19),deathAge:79+Math.floor(draw(random)*24),
    createdAtAge:age,lastActionAge:-1,deceased:false
  },random);
  const text='Votre famille accueille '+firstName+', votre nouveau frère ou votre nouvelle sœur.';
  const born={...rel,people:[...rel.people,next],recent:text,
    records:[...rel.records,{age,personId:next.id,action:'birth',text}].slice(-30)};
  return {relations:born,announcements:[text]};
}
export function gatherCircle(rel,age,random=Math.random){
  const group=rel.groups[0];
  if(!group||age<8||rel.actionsUsed>=3||group.lastGatherAge===age)return null;
  const friends=rel.people.filter(p=>group.members.includes(p.id)&&
    !p.deceased&&age+p.ageOffset>=3);
  if(friends.length<2)return null;
  const avg=friends.reduce((n,p)=>n+p.bond,0)/friends.length;
  const chance=clamp(63+(avg-50)/4+(group.cohesion-50)/3-rel.actionsUsed*5);
  const success=draw(random)<chance/100;
  const delta=success?5:-4;
  const updatedPeople=rel.people.map(p=>friends.some(friend=>friend.id===p.id)?
    {...p,bond:clamp(p.bond+delta),trust:clamp(p.trust+(success?2:-3))}:p);
  const text=success?'Vous passez un excellent moment avec votre cercle d’amis.':
    'Votre sortie entre amis crée quelques tensions.';
  const updated={...rel,people:updatedPeople,
    groups:[{...group,cohesion:clamp(group.cohesion+(success?8:-10)),lastGatherAge:age}],
    actionsUsed:rel.actionsUsed+1,recent:text,
    records:[...rel.records,{age,personId:friends[0].id,action:'group',
      outcome:success?'positive':'negative',chance,delta,text}].slice(-30)};
  return recordFriendshipMilestones(updated,age);
}
export function ageCircle(rel,newAge){
  if(!rel.groups.length)return rel;
  const group=rel.groups[0];
  const living=rel.people.filter(p=>group.members.includes(p.id)&&!p.deceased).length;
  const decay=group.lastGatherAge===newAge-1?0:living>=2?1:2;
  return {...rel,groups:[{...group,cohesion:clamp(group.cohesion-decay)}]};
}
export function isValidSocial(rel,age,started){
  if(!Array.isArray(rel.groups)||rel.groups.length>1||!Array.isArray(rel.milestones)||
    rel.milestones.length>4)return false;
  if(!started)return rel.groups.length===0&&rel.milestones.length===0;
  const friends=rel.people.filter(p=>p.role==='friend');
  if(rel.groups.length){
    const g=rel.groups[0];
    if(!g||g.id!==GROUP_ID||g.name!==GROUP_NAME||
      friends.length<2||!Array.isArray(g.members)||
      g.members.length!==friends.length||
      !g.members.every((id,i)=>id===friends[i].id)||
      !Number.isInteger(g.cohesion)||g.cohesion<0||g.cohesion>100||
      !Number.isInteger(g.createdAtAge)||g.createdAtAge<6||g.createdAtAge>age||
      !Number.isInteger(g.lastGatherAge)||g.lastGatherAge>age||
      (g.lastGatherAge!==-1&&g.lastGatherAge<8))return false;
  } else if(friends.length>=2) return false;
  const seen=new Set();
  for(const m of rel.milestones){
    const person=friends.find(p=>p.id===m?.personId);
    if(!person||m.type!=='close-friend'||seen.has(m.personId)||
      !Number.isInteger(m.age)||m.age<person.createdAtAge||m.age>age)return false;
    seen.add(m.personId);
  }
  return true;
}
