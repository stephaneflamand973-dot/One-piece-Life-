/**
 * V0.4.2 : initiatives autonomes des proches.
 * Le tirage n'a lieu qu'au passage d'une année. Le résultat et la décision
 * sont stockés : recharger une partie ne relance jamais une rencontre.
 */
import { clamp, draw } from './personality.mjs';

export const INITIATIVE_AGES=Object.freeze([9,14,23,31,42,58,74]);
export const INITIATIVE_TYPES=Object.freeze({
  help:Object.freeze({
    title:"Un proche a besoin de vous",
    prompt:name=>name+" vous demande de l'aider à régler un problème au port.",
    choices:Object.freeze([
      Object.freeze({id:'accept',label:"Proposer votre aide",delta:[9,7,4,-3],
        result:name=>"Vous aidez "+name+" qui vous remercie sincèrement."}),
      Object.freeze({id:'refuse',label:"Refuser poliment",delta:[-7,-8,-2,3],
        result:name=>name+" est déçu(e) par votre refus."})
    ])
  }),
  invite:Object.freeze({
    title:"Une invitation inattendue",
    prompt:name=>name+" vous invite à passer la journée ensemble.",
    choices:Object.freeze([
      Object.freeze({id:'accept',label:"Accepter l'invitation",delta:[10,5,2,-4],
        result:name=>"Vous partagez une excellente journée avec "+name+"."}),
      Object.freeze({id:'refuse',label:"Décliner l'invitation",delta:[-4,-3,0,2],
        result:name=>"Vous déclinez l'invitation de "+name+"."})
    ])
  }),
  confide:Object.freeze({
    title:"Une confidence",
    prompt:name=>name+" se confie à vous et vous demande de garder son secret.",
    choices:Object.freeze([
      Object.freeze({id:'accept',label:"L'écouter et garder le secret",delta:[6,12,3,-4],
        result:name=>name+" se sent en sécurité après votre échange."}),
      Object.freeze({id:'refuse',label:"Éviter la conversation",delta:[-8,-11,-1,6],
        result:name=>name+" regrette de ne pas avoir pu compter sur vous."
      })
    ])
  }),
  conflict:Object.freeze({
    title:"Des tensions éclatent",
    prompt:name=>name+" vous reproche un différend qui traîne depuis quelque temps.",
    choices:Object.freeze([
      Object.freeze({id:'accept',label:"Désamorcer le conflit",delta:[5,7,4,-13],
        result:name=>"Vous apaisez la tension avec "+name+"."}),
      Object.freeze({id:'refuse',label:"Répondre vivement",delta:[-11,-9,-4,16],
        result:name=>"La dispute avec "+name+" aggrave votre rivalité."})
    ])
  })
});

export function initiativeForAge(rel,age,random=Math.random){
  if(!INITIATIVE_AGES.includes(age))return null;
  const available=rel.people.filter(p=>!p.deceased&&age+p.ageOffset>=6);
  if(!available.length)return null;
  // Traits, proximité et solitude influencent la probabilité d'une initiative.
  const average=available.reduce((sum,p)=>sum+p.bond,0)/available.length;
  const outgoing=available.reduce((sum,p)=>sum+p.traits.sociability,0)/available.length;
  const chance=clamp(25+Math.round(average/5)+Math.round(outgoing/7));
  if(draw(random)>=Math.min(75,chance)/100)return null;
  const person=available[Math.floor(draw(random)*available.length)];
  const tension=person.rivalry>64||person.traits.temper>78;
  const drawType=draw(random);
  const eventId=tension && drawType<0.55?'conflict':
    drawType<0.28?'help':
    drawType<0.57?'invite':
    age>=12 && drawType<0.82?'confide':'conflict';
  return {age,personId:person.id,eventId};
}
export function initiativeScene(rel,pending){
  if(!pending)return null;
  const person=rel.people.find(p=>p.id===pending.personId);
  const type=INITIATIVE_TYPES[pending.eventId];
  if(!person||!type)return null;
  return {title:type.title,text:type.prompt(person.firstName),person,
    options:type.choices.map(c=>({id:c.id,label:c.label}))};
}
export function resolveInitiative(rel,choiceId,age){
  const pending=rel.pending;
  if(!pending||pending.age!==age)return null;
  const scene=initiativeScene(rel,pending);
  const choice=INITIATIVE_TYPES[pending.eventId]?.choices.find(c=>c.id===choiceId);
  if(!scene||!choice)return null;
  const person=scene.person;
  const impact=choice.delta;
  // La personnalité colore la conséquence sans annuler la volonté du joueur.
  const bonus=choiceId==='accept'?Math.round((person.traits.empathy-50)/25):0;
  const updated={...person,bond:clamp(person.bond+impact[0]+bonus),
    trust:clamp(person.trust+impact[1]+bonus),respect:clamp(person.respect+impact[2]),
    rivalry:clamp(person.rivalry+impact[3])};
  const text=choice.result(person.firstName);
  const decision={age,personId:person.id,eventId:pending.eventId,option:choiceId};
  return {...rel,pending:null,
    people:rel.people.map(p=>p.id===person.id?updated:p),
    initiatives:[...rel.initiatives,decision],
    recent:text,
    records:[...rel.records,{age,personId:person.id,action:'initiative',text}].slice(-30),
    result:text};
}
