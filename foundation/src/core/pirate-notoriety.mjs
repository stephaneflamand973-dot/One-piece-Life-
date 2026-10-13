/** V0.5.3 : prime (menace perçue), notoriété et pression de la Marine.
 * Jamais de conversion directe du butin en prime.
 */
export const MAX_BOUNTY=2000000000;
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
export function emptyWanted(){
  return {bounty:0,notoriety:0,heat:0,incidents:0,hideAtAge:-1,
    lastPursuitAge:-1,events:[]};
}
const validAge=(a,age)=>Number.isInteger(a)&&a>=-1&&a<=(age??0);
export function validWanted(w,life,career){
  if(!w||typeof w!=='object'||Array.isArray(w)||
    Object.keys(w).length!==7||
    !Number.isInteger(w.bounty)||w.bounty<0||w.bounty>MAX_BOUNTY||
    !Number.isInteger(w.notoriety)||w.notoriety<0||w.notoriety>100||
    !Number.isInteger(w.heat)||w.heat<0||w.heat>100||
    !Number.isInteger(w.incidents)||w.incidents<0||w.incidents>500||
    !validAge(w.hideAtAge,life?.age)||!validAge(w.lastPursuitAge,life?.age)||
    !Array.isArray(w.events)||w.events.length>20||
    !w.events.every(e=>e&&Number.isInteger(e.age)&&e.age>=16&&
      e.age<=(life?.age??0)&&['bounty','pursuit','hide'].includes(e.type)&&
      typeof e.text==='string'&&e.text.length>0&&e.text.length<=160))
      return false;
  if(!career.pirate)return w.bounty===0&&w.notoriety===0&&w.heat===0&&
    w.incidents===0&&w.hideAtAge===-1&&w.lastPursuitAge===-1&&w.events.length===0;
  return true;
}
const event=(w,age,type,text)=>({...w,events:
  [...w.events,{age,type,text}].slice(-20)});
export function wantedLevel(w){
  if(w.bounty>=100000000)return 'Menace majeure';
  if(w.bounty>=15000000)return 'Pirate redouté';
  if(w.bounty>=1000000)return 'Pirate recherché';
  if(w.bounty>0)return 'Avis de recherche local';
  return 'Sans prime';
}
export function missionWanted(w,mission,age){
  if(!mission||!Number.isInteger(age))return w;
  const {id,outcome}=mission;
  const success=outcome==='success',partial=outcome==='partial';
  const publicAction=id==='marine'||id==='raid';
  const fame=success?({escort:1,explore:3,treasure:5,raid:11,marine:15}[id]??1):
    partial?({escort:0,explore:1,treasure:2,raid:5,marine:7}[id]??0):1;
  const notoriety=clamp(w.notoriety+fame);
  const heat=clamp(w.heat+(publicAction?(success?17:partial?9:6):
    success&&id==='treasure'?7:outcome==='failure'?5:success?2:1));
  let growth=0;
  if(publicAction&&(success||partial)){
    growth=id==='marine'?(success?12000000:5000000):
      (success?3500000:1000000);
  }else if(id==='treasure'&&success&&notoriety>=8){
    // Seule une découverte assez médiatisée peut susciter un premier avis local.
    growth=250000;
  }
  const bounty=Math.min(MAX_BOUNTY,w.bounty+growth);
  const gained=bounty-w.bounty;
  let next={...w,bounty,notoriety,heat,incidents:w.incidents+(gained>0?1:0)};
  if(gained>0)next=event(next,age,'bounty',
    'Avis de recherche : '+bounty.toLocaleString('fr-FR')+
    ' Berrys (+ '+gained.toLocaleString('fr-FR')+').');
  return next;
}
export function pursuitChance(w){
  if(w.bounty===0||w.heat<15)return 0;
  return Math.min(70,Math.max(3,Math.round(4+w.heat*.40+
    w.notoriety*.14+Math.min(16,w.bounty/20000000))));
}
export function hideAvailability(career,life){
  const w=career.wanted;
  if(!life?.alive||!career.pirate||w.bounty===0||w.heat<10)
    return {enabled:false,reason:'Vous n’êtes pas suffisamment recherché.'};
  if(w.hideAtAge===life.age)
    return {enabled:false,reason:'Discrétion déjà tentée cette année.'};
  return {enabled:true,reason:''};
}
export function hideFromMarine(career,life){
  const available=hideAvailability(career,life);
  if(!available.enabled)return null;
  const w=career.wanted;
  const heat=clamp(w.heat-22);
  const newWanted=event({...w,heat,hideAtAge:life.age},life.age,'hide',
    'Vous faites profil bas : la surveillance de la Marine diminue.');
  return {...career,wanted:newWanted,pirate:{...career.pirate,
    performance:clamp(career.pirate.performance-2)}};
}
export function annualPursuit(career,abilities,relations,life,random=Math.random){
  const w=career.wanted;
  if(!career.pirate||!life.alive)return {career,abilities,note:''};
  let wanted={...w,heat:clamp(w.heat-5)};
  const chance=pursuitChance(wanted);
  const primary=abilities.skills.navigation*.40+
    abilities.skills.vitesse*.30+abilities.skills.technique*.30;
  if(!chance||random()*100>=chance)
    return {career:{...career,wanted},abilities,note:''};
  const captain=relations.people.find(p=>p.id==='world-leader'&&!p.deceased);
  const escapeChance=Math.min(89,Math.max(12,Math.round(34+primary*.43+
    (captain?.trust??40)*.12+career.pirate.performance*.11-
    wanted.heat*.25-abilities.fatigue*.13)));
  const escaped=random()*100<escapeChance;
  let note,updatedCareer,updatedAbilities;
  if(escaped){
    note='Vous échappez à une patrouille de la Marine.';
    wanted={...wanted,heat:clamp(wanted.heat-7),
      notoriety:clamp(wanted.notoriety+2),lastPursuitAge:life.age};
    updatedCareer={...career,wanted,pirate:{...career.pirate,
      performance:clamp(career.pirate.performance+1)}};
    updatedAbilities={...abilities,fatigue:clamp(abilities.fatigue+9)};
  }else{
    // Une interception n'est PAS une arrestation durable : la prison nécessite son propre module.
    const losses=Math.min(career.missions.berys,Math.max(2000,
      Math.round(career.missions.berys*.08)));
    note='La Marine intercepte votre équipage : '+losses.toLocaleString('fr-FR')+
      ' Berrys de butin saisis.';
    wanted={...wanted,heat:clamp(wanted.heat+8),lastPursuitAge:life.age};
    updatedCareer={...career,wanted,missions:{...career.missions,
      berys:career.missions.berys-losses},pirate:{...career.pirate,
      performance:clamp(career.pirate.performance-4)}};
    const injury=abilities.injury.level===2?abilities.injury:
      {level:1,recoverAtAge:life.age+1};
    updatedAbilities={...abilities,fatigue:clamp(abilities.fatigue+18),injury};
  }
  wanted=event(updatedCareer.wanted,life.age,'pursuit',note);
  return {career:{...updatedCareer,wanted},abilities:updatedAbilities,note};
}
