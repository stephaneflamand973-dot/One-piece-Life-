/**
 * V0.4 : famille, amis et liens persistants.
 * Logique pure, indépendante des écrans. Aucun lien fictif affiché avant la création.
 */
const FIRST = Object.freeze(['Sora','Mika','Nora','Kaito','Lina','Toma','Riku','Aya','Ren','Yuna','Kenji','Robin']);
export const MAX_ACTIONS_PER_YEAR = 2;
export const MAX_FRIENDS = 4;
export const ACTIONS = Object.freeze({
  talk: Object.freeze({label:'Discuter',base:6,note:'Vous avez discuté avec'}),
  spend: Object.freeze({label:'Passer du temps',base:12,note:'Vous avez passé du temps avec'}),
  argue: Object.freeze({label:'Se disputer',base:-16,note:'Vous vous êtes disputé avec'})
});
const clamp = x => Math.min(100,Math.max(0,Math.round(x)));
function draw(random) {
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1) throw new TypeError('Tirage invalide');
  return n;
}
function take(list,random){return list[Math.floor(draw(random)*list.length)];}
function offset(range,random){return range[0]+Math.floor(draw(random)*(range[1]-range[0]+1));}
export function emptyRelations(){
  return {people:[],actionsUsed:0,records:[],recent:''};
}
function person({id,role,firstName,lastName,ageOffset,bond,deathAge,createdAtAge=0,age=0}){
  return {id,role,firstName,lastName,ageOffset,bond,deathAge,
    createdAtAge,lastActionAge:-1,deceased:age+ageOffset>=deathAge};
}
export function createFamily(character,random=Math.random,currentAge=0){
  const mother=person({id:'mother',role:'mother',firstName:take(FIRST,random),
    lastName:character.lastName,ageOffset:offset([24,39],random),
    bond:offset([65,82],random),deathAge:offset([78,98],random),age:currentAge});
  const father=person({id:'father',role:'father',firstName:take(FIRST,random),
    lastName:character.lastName,ageOffset:offset([25,42],random),
    bond:offset([60,80],random),deathAge:offset([78,100],random),age:currentAge});
  const count=offset([0,2],random);
  const siblings=Array.from({length:count},(_,i)=>person({
    id:'sibling-'+(i+1),role:'sibling',firstName:take(FIRST,random),
    lastName:character.lastName,ageOffset:offset([1,7],random),
    bond:offset([47,76],random),deathAge:offset([77,101],random),age:currentAge
  }));
  return {...emptyRelations(),people:[mother,father,...siblings]};
}
export function isValidRelations(relations,age,started){
  if (!relations || typeof relations!=='object' || Array.isArray(relations) ||
      !Array.isArray(relations.people) || !Array.isArray(relations.records) ||
      typeof relations.recent!=='string' || relations.recent.length>180 ||
      !Number.isInteger(relations.actionsUsed) || relations.actionsUsed<0 ||
      relations.actionsUsed>MAX_ACTIONS_PER_YEAR ||
      relations.records.length>30) return false;
  const people=relations.people;
  if (!started) return people.length===0 && relations.actionsUsed===0 &&
    relations.records.length===0 && relations.recent==='';
  if (people.length<2 || people.length>2+2+MAX_FRIENDS) return false;
  const ids=new Set();
  let mother=0,father=0,sibling=0,friend=0;
  for(const p of people){
    if (!p || typeof p.id!=='string' || ids.has(p.id) ||
        !['mother','father','sibling','friend'].includes(p.role) ||
        typeof p.firstName!=='string' || !p.firstName.trim() || p.firstName.length>32 ||
        typeof p.lastName!=='string' || !p.lastName.trim() || p.lastName.length>32 ||
        !Number.isInteger(p.ageOffset) || p.ageOffset< -120 || p.ageOffset>55 ||
        !Number.isInteger(p.bond) || p.bond<0 || p.bond>100 ||
        !Number.isInteger(p.deathAge) || p.deathAge<65 || p.deathAge>105 ||
        !Number.isInteger(p.createdAtAge) || p.createdAtAge<0 || p.createdAtAge>age ||
        !Number.isInteger(p.lastActionAge) || p.lastActionAge< -1 ||
        p.lastActionAge>age || p.deceased !== (age+p.ageOffset>=p.deathAge)) return false;
    if(p.role==='mother'){mother++;if(p.id!=='mother'||p.createdAtAge!==0) return false;}
    if(p.role==='father'){father++;if(p.id!=='father'||p.createdAtAge!==0) return false;}
    if(p.role==='sibling'){sibling++;if(p.id!=='sibling-'+sibling||p.createdAtAge!==0) return false;}
    if(p.role==='friend'){friend++;if(p.id!=='friend-'+friend||p.createdAtAge<6||
      p.createdAtAge+p.ageOffset<3) return false;}
    ids.add(p.id);
  }
  if(mother!==1||father!==1||sibling>2||friend>MAX_FRIENDS) return false;
  if(age<3 && relations.actionsUsed>0) return false;
  for(const rec of relations.records){
    if(!rec||!Number.isInteger(rec.age)||rec.age<0||rec.age>age||
      !ids.has(rec.personId)||!['talk','spend','argue','meet','loss'].includes(rec.action)||
      typeof rec.text!=='string'||!rec.text.trim()||rec.text.length>180) return false;
  }
  return true;
}
export function advanceRelations(relations,newAge){
  const losses=[];
  const people=relations.people.map(p=>{
    const deceased = p.deceased || newAge+p.ageOffset >=p.deathAge;
    if(!p.deceased && deceased) losses.push(p);
    // Sans contact, les amitiés se refroidissent plus vite que les liens familiaux.
    const fade = deceased ? 0 : p.role==='friend' ? 2 : p.role==='sibling' ? 1 : 0;
    return {...p,deceased,bond:clamp(p.bond-fade)};
  });
  const announcements=losses.map(p=>p.firstName+' '+p.lastName+' est décédé(e).');
  const records=[...relations.records,...losses.map(p=>({
    age:newAge,personId:p.id,action:'loss',text:p.firstName+' '+p.lastName+' est décédé(e).'
  }))].slice(-30);
  return { relations: {...relations,people,actionsUsed:0,records,
    recent: announcements.length ? announcements.join(' ') : relations.recent},
    announcements };
}
export function interact(relations,personId,action,age,solidarity=0){
  if(age<3 || relations.actionsUsed>=MAX_ACTIONS_PER_YEAR || !ACTIONS[action]) return null;
  const contact=relations.people.find(p=>p.id===personId);
  if(!contact || contact.deceased || contact.lastActionAge===age) return null;
  const delta=ACTIONS[action].base +
    (action==='argue' ? 0 : Math.min(3,solidarity));
  const changed=clamp(contact.bond+delta);
  const text=ACTIONS[action].note+' '+contact.firstName+'.';
  return {...relations,people:relations.people.map(p=>p.id===personId?
    {...p,bond:changed,lastActionAge:age}:p),
    actionsUsed:relations.actionsUsed+1,
    records:[...relations.records,{age,personId,action,text}].slice(-30),
    recent:text};
}
export function meetFriend(relations,character,age,random=Math.random){
  if(age<6 || relations.actionsUsed>=MAX_ACTIONS_PER_YEAR) return null;
  const current=relations.people.filter(p=>p.role==='friend').length;
  if(current>=MAX_FRIENDS) return null;
  const name=take(FIRST,random);
  const ageDifference=offset(age<18?[-2,2]:[-4,4],random);
  const friend=person({id:'friend-'+(current+1),role:'friend',
    firstName:name,lastName:take(['Sol','Vent','Brume','Dawn','Marin'],random),
    ageOffset:ageDifference,bond:offset([43,59],random),
    deathAge:offset([80,103],random),createdAtAge:age,age});
  const text='Vous faites connaissance avec '+name+' au port.';
  return {...relations,people:[...relations.people,friend],
    actionsUsed:relations.actionsUsed+1,
    records:[...relations.records,{age,personId:friend.id,action:'meet',text}].slice(-30),
    recent:text};
}
export function socialAnnualNote(relations,age){
  if(age<6 || age%5!==0) return '';
  const closest=relations.people.filter(p=>!p.deceased && p.role==='friend')
    .sort((a,b)=>b.bond-a.bond)[0];
  if(!closest) return '';
  if(closest.bond>=75) return 'Votre amitié avec '+closest.firstName+' s’est renforcée au fil des années.';
  if(closest.bond<=24) return 'Vous sentez que votre amitié avec '+closest.firstName+' s’éloigne.';
  return '';
}
export const roleLabel = role =>
  ({mother:'Mère',father:'Père',sibling:'Fratrie',friend:'Amitié'})[role]??'Relation';
