/**
 * Relations amoureuses et générations (V0.4.4).
 * Toutes les transitions sont pures; seules des personnes majeures peuvent
 * se rencontrer en couple, se marier ou envisager un enfant.
 */
import { clamp, createProfile, draw } from './personality.mjs';

export const MAX_PARTNERS=4;
export const MAX_CHILDREN=4;
const NAMES=Object.freeze(['Rin','Noa','Yuna','Sora','Mika','Haru','Aiko','Ren','Kaito','Luna']);
const SURNAMES=Object.freeze(['Marin','Vent','Dawn','Brume','Sol']);
const ACTIVE=Object.freeze(['dating','married']);
export const isPartnerActive=p=>p?.role==='partner'&&ACTIVE.includes(p.status)&&!p.deceased;
export const activePartner=rel=>rel.people.find(isPartnerActive)??null;
const count=(rel,role)=>rel.people.filter(p=>p.role===role).length;
const choose=(items,random)=>items[Math.floor(draw(random)*items.length)];
const record=(rel,age,personId,action,text,extra={})=>({
  ...rel,recent:text,
  records:[...rel.records,{age,personId,action,text,...extra}].slice(-30)
});
const person=(attrs,random)=>createProfile({
  ...attrs,lastActionAge:-1,deceased:attrs.age+attrs.ageOffset>=attrs.deathAge
},random);

export function meetPartner(rel,life,random=Math.random){
  const age=life.age;
  if(age<18||age>75||rel.actionsUsed>=3||activePartner(rel)||count(rel,'partner')>=MAX_PARTNERS)return null;
  const offset=Math.max(18-age,-4)+Math.floor(draw(random)*(Math.min(4,120-age)-Math.max(18-age,-4)+1));
  const id='partner-'+(count(rel,'partner')+1);
  const name=choose(NAMES,random);
  const partner=person({id,role:'partner',firstName:name,lastName:choose(SURNAMES,random),
    ageOffset:offset,age,createdAtAge:age,bond:55+Math.floor(draw(random)*17),
    deathAge:82+Math.floor(draw(random)*20),status:'dating',marriedAtAge:null,
    endedAtAge:null},random);
  const text='Vous faites une rencontre amoureuse avec '+name+'.';
  return record({...rel,people:[...rel.people,partner],actionsUsed:rel.actionsUsed+1},
    age,id,'romance-meet',text);
}
export function romanceAvailability(rel,action,age){
  const partner=activePartner(rel);
  if(!partner)return {enabled:false,reason:'Aucun partenaire actuel.'};
  if(age<18||age+partner.ageOffset<18)return {enabled:false,reason:'Réservé aux adultes.'};
  if(rel.actionsUsed>=3)return {enabled:false,reason:'Trois actions déjà utilisées cette année.'};
  if(partner.lastActionAge===age)return {enabled:false,reason:'Une action de couple déjà effectuée cette année.'};
  if(action==='date')return {enabled:true,reason:''};
  if(action==='separate')return {enabled:true,reason:''};
  if(action==='marry'){
    if(partner.status!=='dating')return {enabled:false,reason:'Vous êtes déjà mariés.'};
    if(age-partner.createdAtAge<1)return {enabled:false,reason:'Attendez au moins un an de relation.'};
    if(partner.bond<60||partner.trust<50)
      return {enabled:false,reason:'Lien ou confiance insuffisants (60/50).'};
    return {enabled:true,reason:''};
  }
  if(action==='child'){
    if(age<20||age>52||age+partner.ageOffset<20||age+partner.ageOffset>52)
      return {enabled:false,reason:'Projet familial disponible entre 20 et 52 ans pour les deux partenaires.'};
    if(age-partner.createdAtAge<2)
      return {enabled:false,reason:'Deux ans de vie commune sont nécessaires.'};
    if(partner.bond<65||partner.trust<55)
      return {enabled:false,reason:'Votre couple manque de stabilité (65/55).'};
    if(count(rel,'child')>=MAX_CHILDREN)
      return {enabled:false,reason:'Quatre enfants maximum.'};
    return {enabled:true,reason:''};
  }
  return {enabled:false,reason:'Action inconnue.'};
}
export function actRomance(rel,action,life,random=Math.random){
  const age=life.age,access=romanceAvailability(rel,action,age);
  if(!access.enabled)return null;
  const partner=activePartner(rel);
  const positive=action==='date'
    ?draw(random)<Math.min(.95,Math.max(.20,(68+partner.traits.empathy/6+
      (partner.bond-50)/5-partner.rivalry/12)/100))
    :action==='marry'?draw(random)<Math.min(.95,Math.max(.3,
      (60+partner.trust/5+partner.bond/7-partner.traits.pride/12)/100))
    :action==='child'?draw(random)<.68:true;
  let newPartner={...partner,lastActionAge:age};
  let newChild=null,kind='',text='';
  if(action==='date'){
    newPartner={...newPartner,bond:clamp(partner.bond+(positive?9:-5)),
      trust:clamp(partner.trust+(positive?5:-3)),
      rivalry:clamp(partner.rivalry+(positive?-3:5))};
    kind='romance-date';
    text=positive?'Votre rendez-vous avec '+partner.firstName+' vous rapproche.':
      'Votre rendez-vous avec '+partner.firstName+' se passe mal.';
  } else if(action==='marry'){
    newPartner=positive?{...newPartner,status:'married',marriedAtAge:age,
      bond:clamp(partner.bond+8),trust:clamp(partner.trust+7)}:
      {...newPartner,bond:clamp(partner.bond-7),trust:clamp(partner.trust-5)};
    kind='romance-marriage';
    text=positive?'Vous épousez '+partner.firstName+'.':
      partner.firstName+' refuse votre demande en mariage.';
  } else if(action==='separate'){
    newPartner={...newPartner,status:'separated',endedAtAge:age,
      bond:clamp(partner.bond-17),trust:clamp(partner.trust-13)};
    kind='romance-separation';
    text='Votre relation avec '+partner.firstName+' prend fin.';
  } else if(action==='child'){
    kind='romance-child';
    if(positive){
      const name=choose(NAMES,random);
      const id='child-'+(count(rel,'child')+1);
      newChild=person({id,role:'child',firstName:name,lastName:life.lastName,
        ageOffset:-age,age,createdAtAge:age,bond:65+Math.floor(draw(random)*15),
        deathAge:80+Math.floor(draw(random)*24),parentId:partner.id},random);
      newPartner={...newPartner,bond:clamp(partner.bond+5),trust:clamp(partner.trust+3)};
      text='Vous accueillez '+name+', votre enfant, avec '+partner.firstName+'.';
    }else text='Votre projet d’accueillir un enfant avec '+partner.firstName+' ne se concrétise pas cette année.';
  }
  const people=rel.people.map(p=>p.id===partner.id?newPartner:p);
  if(newChild)people.push(newChild);
  return record({...rel,people,actionsUsed:rel.actionsUsed+1},
    age,newChild?.id??partner.id,kind,text,
    action==='date'||action==='marry'||action==='child'?
      {outcome:positive?'positive':'negative',chance:action==='child'?68:
        action==='date'?Math.round(68+partner.traits.empathy/6+
          (partner.bond-50)/5-partner.rivalry/12):
          Math.round(60+partner.trust/5+partner.bond/7-partner.traits.pride/12),delta:newPartner.bond-partner.bond}: {});
}
export function advanceRomance(rel,age){
  const notes=[];
  const people=rel.people.map(p=>{
    if(p.role==='child'&&!p.deceased&&age+p.ageOffset===18)
      notes.push(p.firstName+' atteint sa majorité.');
    if(p.role!=='partner'||!ACTIVE.includes(p.status))return p;
    if(p.deceased){
      notes.push('Vous perdez votre partenaire '+p.firstName+'.');
      return {...p,status:'widowed',endedAtAge:age};
    }
    if(age>p.createdAtAge+1 && p.bond<=15 && p.rivalry>=70){
      notes.push('Votre couple avec '+p.firstName+' se sépare après des tensions durables.');
      return {...p,status:'separated',endedAtAge:age};
    }
    return p;
  });
  return {relations:{...rel,people},announcements:notes};
}
export function validRomance(rel,age,started){
  if(!started)return rel.people.every(p=>p.role!=='partner'&&p.role!=='child');
  const partners=rel.people.filter(p=>p.role==='partner');
  const children=rel.people.filter(p=>p.role==='child');
  if(partners.length>MAX_PARTNERS||children.length>MAX_CHILDREN||
    partners.filter(p=>ACTIVE.includes(p.status)).length>1)return false;
  for(const [index,p] of partners.entries()){
    if(p.id!=='partner-'+(index+1)||p.createdAtAge<18||
      p.createdAtAge+p.ageOffset<18||
      !['dating','married','separated','widowed'].includes(p.status)||
      !(p.marriedAtAge===null||
        (Number.isInteger(p.marriedAtAge)&&p.marriedAtAge>=p.createdAtAge+1&&
          p.marriedAtAge<=age))||
      !(p.endedAtAge===null||
        (Number.isInteger(p.endedAtAge)&&p.endedAtAge>=p.createdAtAge&&p.endedAtAge<=age))||
      (ACTIVE.includes(p.status)&&(p.deceased||p.endedAtAge!==null))||
      (p.status==='married'&&p.marriedAtAge===null)||
      (p.status==='dating'&&p.marriedAtAge!==null)||
      (p.status==='widowed'&&(!p.deceased||p.endedAtAge===null))||
      (p.status==='separated'&&p.endedAtAge===null))return false;
  }
  for(const [index,p] of children.entries()){
    const parent=partners.find(partner=>partner.id===p.parentId);
    if(!parent||p.id!=='child-'+(index+1)||p.createdAtAge<20||
      p.ageOffset!==-p.createdAtAge||p.createdAtAge<parent.createdAtAge+2||
      p.createdAtAge>52||p.createdAtAge+parent.ageOffset<20||
      p.createdAtAge+parent.ageOffset>52)return false;
  }
  return true;
}
