// V0.4.1 : règles de personnalité et réactions, sans dépendance sur le DOM.
export const TRAITS=Object.freeze(['sociability','empathy','pride','temper','loyalty']);
export const TRAIT_LABELS=Object.freeze({
  sociability:'Sociabilité',empathy:'Empathie',pride:'Fierté',
  temper:'Tempérament',loyalty:'Loyauté'
});
export const ACTIONS=Object.freeze({
  talk:Object.freeze({label:'Discuter',minAge:3,base:85,trait:'sociability',good:[6,3,1,-2],bad:[-3,-2,0,2]}),
  spend:Object.freeze({label:'Passer du temps',minAge:3,base:80,trait:'loyalty',good:[10,5,2,-3],bad:[-3,-2,0,2]}),
  help:Object.freeze({label:'Aider',minAge:6,base:75,trait:'empathy',good:[9,7,5,-5],bad:[-3,-3,0,2]}),
  confide:Object.freeze({label:'Se confier',minAge:12,base:68,trait:'empathy',good:[8,11,1,-4],bad:[-5,-8,-1,4]}),
  gift:Object.freeze({label:'Faire un cadeau',minAge:6,base:76,trait:'sociability',good:[8,2,2,-2],bad:[-4,-2,-2,2]}),
  apologize:Object.freeze({label:"S'excuser",minAge:6,base:65,trait:'empathy',good:[12,9,2,-12],bad:[-4,-3,0,4]}),
  argue:Object.freeze({label:'Se disputer',minAge:3,base:48,trait:'temper',good:[-16,-9,-6,16],bad:[-5,-2,-1,4]})
});
export const clamp=x=>Math.max(0,Math.min(100,Math.round(x)));
export function draw(random){
  const n=random();
  if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Tirage invalide');
  return n;
}
const between=(random,a,b)=>a+Math.floor(draw(random)*(b-a+1));
export function createProfile(person,random=Math.random){
  const traits=Object.fromEntries(TRAITS.map(key=>[key,between(random,18,88)]));
  return {...person,traits,trust:clamp(person.bond+between(random,-12,8)),
    respect:clamp(person.bond+between(random,-8,12)),
    rivalry:clamp(26+between(random,-12,14))};
}
export function legacyProfile(person){
  let seed=2166136261;
  for(const char of [person.id,person.firstName,person.lastName,person.role].join('|'))
    seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  return createProfile(person,random);
}
export function isProfile(person){
  return Boolean(person&&person.traits&&typeof person.traits==='object'&&
    !Array.isArray(person.traits)&&Object.keys(person.traits).length===TRAITS.length&&
    TRAITS.every(key=>Number.isInteger(person.traits[key])&&
      person.traits[key]>=0&&person.traits[key]<=100)&&
    ['trust','respect','rivalry'].every(key=>Number.isInteger(person[key])&&
      person[key]>=0&&person[key]<=100));
}
export function reactionChance(rel,person,action){
  const a=ACTIONS[action];
  if(!a||!isProfile(person))return 0;
  const alignment=action==='apologize'
    ?-Math.round((person.traits.pride-50)/5)
    :action==='argue'?
      Math.round((person.traits.temper-person.traits.empathy)/5)
      :Math.round((person.traits[a.trait]-50)/4);
  const attitude=action==='argue'
    ?Math.round((person.rivalry-40)/6)
    :Math.round((person.bond-50)/5+(person.trust-50)/9);
  return Math.max(12,Math.min(95,Math.round(a.base+alignment+attitude-rel.actionsUsed*5)));
}
export function availability(rel,person,action,age){
  const a=ACTIONS[action];
  if(!a||!person||person.deceased)return {enabled:false,reason:'Relation indisponible.'};
  if(age<a.minAge)return {enabled:false,reason:'Disponible à partir de '+a.minAge+' ans.'};
  if(age+person.ageOffset<3)return {enabled:false,reason:'Ce proche est encore trop jeune.'};
  if(rel.actionsUsed>=3)return {enabled:false,reason:"Actions de l'année épuisées."};
  if(person.lastActionAge===age)return {enabled:false,reason:'Déjà rencontré cette année.'};
  if(action==='confide'&&person.trust<35)
    return {enabled:false,reason:'Confiance insuffisante (35 minimum).'};
  if(action==='apologize'&&person.rivalry<25&&person.bond>=65)
    return {enabled:false,reason:'Aucun conflit à régler.'};
  return {enabled:true,chance:reactionChance(rel,person,action)};
}
export function resolveReaction(rel,person,action,age,solidarity=0,random=Math.random){
  const info=availability(rel,person,action,age);
  if(!info.enabled)return null;
  const positive=draw(random)<info.chance/100;
  const a=ACTIONS[action];
  const [bond,trust,respect,rivalry]=positive?a.good:a.bad;
  const solidarityBonus=positive&&action!=='argue'?Math.min(3,Math.max(0,solidarity)):0;
  const updated={...person,bond:clamp(person.bond+bond+solidarityBonus),
    trust:clamp(person.trust+trust),respect:clamp(person.respect+respect),
    rivalry:clamp(person.rivalry+rivalry),lastActionAge:age};
  const messages={
    talk:positive?'La discussion vous rapproche de ':'La discussion tourne court avec ',
    spend:positive?'Vous passez un excellent moment avec ':'La sortie se passe mal avec ',
    help:positive?'Votre aide touche ':'Votre aide est mal reçue par ',
    confide:positive?'Votre confidence renforce la confiance de ':'Votre confidence gêne ',
    gift:positive?'Votre cadeau plaît à ':'Votre cadeau déplaît à ',
    apologize:positive?'Vos excuses sont acceptées par ':'Vos excuses sont refusées par ',
    argue:positive?'La dispute dégénère avec ':'Une tension passagère vous oppose à '
  };
  const text=messages[action]+person.firstName+'.';
  return {updated,record:{age,personId:person.id,action,text,
    outcome:positive?'positive':'negative',chance:info.chance,
    delta:updated.bond-person.bond}};
}
