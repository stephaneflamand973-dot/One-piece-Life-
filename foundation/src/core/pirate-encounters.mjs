/** V0.5.9 : rencontres navales à choix, probabilités dynamiques et conséquences persistantes. */
import {shipStats,wearShip} from './pirate-ships.mjs';
import {crewEffects} from './pirate-crew-life.mjs';
import {MAX_BOUNTY} from './pirate-notoriety.mjs';

export const ENCOUNTER_FACTIONS=Object.freeze({
 pirate:'Pirates rivaux',marine:'Patrouille de la Marine',
 marchand:'Navire marchand',revolutionnaire:'Révolutionnaires'
});
export const ENCOUNTER_CHOICES=Object.freeze({
 fight:{label:'Combattre',description:'Affrontement au canon. Gain de réputation, risques pour la coque.'},
 board:{label:'Aborder',description:'Risque élevé, mais butin potentiel supérieur. Un compagnon requis.'},
 flee:{label:'Fuir',description:'Miser sur la vitesse et la navigation pour éviter le conflit.'},
 negotiate:{label:'Négocier',description:'Chercher un accord ou payer un passage sans combattre.'}
});
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Math.round(n)));
const safeRoll=random=>{
 const n=random();
 if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Tirage de rencontre invalide');
 return n;
};
const factions=Object.keys(ENCOUNTER_FACTIONS);
const choices=Object.keys(ENCOUNTER_CHOICES);
export function emptyEncounters(){
 return {pending:null,resolved:0,victories:0,defeats:0,escapes:0,negotiated:0,log:[]};
}
export function upgradeEncounters(command){
 return command?{...command,encounters:emptyEncounters()}:null;
}
export function validEncounters(e,command,age){
 if(!e||typeof e!=='object'||Array.isArray(e)||
  Object.keys(e).sort().join(',')!=='defeats,escapes,log,negotiated,pending,resolved,victories'||
  !['resolved','victories','defeats','escapes','negotiated'].every(k=>
    Number.isSafeInteger(e[k])&&e[k]>=0)||
  e.victories+e.defeats+e.escapes+e.negotiated!==e.resolved||
  !Array.isArray(e.log)||e.log.length>16||e.log.length>e.resolved||
  e.log.some(x=>!x||!Number.isInteger(x.age)||x.age<command.foundedAtAge||x.age>age||
    !factions.includes(x.faction)||!choices.includes(x.choice)||
    !['success','failure'].includes(x.outcome)||
    typeof x.island!=='string'||!command.navigation.visited.includes(x.island)||
    !Number.isInteger(x.chance)||x.chance<5||x.chance>95||
    !Number.isInteger(x.loot)||x.loot<0||x.loot>200000||
    !Number.isInteger(x.damage)||x.damage<0||x.damage>60||
    !Number.isInteger(x.bountyGain)||x.bountyGain<0||x.bountyGain>20000000||
    typeof x.text!=='string'||!x.text.trim()||x.text.length>160))return false;
 const p=e.pending;
 return p===null||Boolean(p&&typeof p==='object'&&
  Object.keys(p).sort().join(',')==='age,faction,island,text,threat'&&
  Number.isInteger(p.age)&&p.age===age&&
  factions.includes(p.faction)&&p.island===command.navigation.location&&
  Number.isInteger(p.threat)&&p.threat>=8&&p.threat<=95&&
  typeof p.text==='string'&&p.text.length>0&&p.text.length<=150);
}
const factionsText={
 pirate:'Un navire pirate rival bloque votre route.',
 marine:'Une patrouille de la Marine vous ordonne de stopper.',
 marchand:'Un navire marchand vous interpelle sur la route.',
 revolutionnaire:'Un navire révolutionnaire cherche à entrer en contact.'
};
export function rollEncounter(command,age,faction,hazard,random=Math.random,heat=0){
 if(!command||command.encounters.pending||!factions.includes(faction))return command;
 const risk=Math.min(.49,.17+hazard/390+(faction==='marine'?heat/800:0));
 if(safeRoll(random)<1-risk)return command;
 const strength=clamp(20+hazard*.58+(faction==='marine'?heat*.20:
  faction==='pirate'?8:faction==='revolutionnaire'?5:-9),8,95);
 const pending={age,island:command.navigation.location,faction,threat:strength,
  text:factionsText[faction]};
 return {...command,encounters:{...command.encounters,pending}};
}
export function encounterAvailability(career,life,abilities,choice){
 const cmd=career.command,p=cmd?.encounters?.pending;
 if(!life?.alive||!p||!choices.includes(choice))
  return {enabled:false,reason:'Aucune rencontre à résoudre.'};
 if(choice==='board'&&!cmd.members.length)
  return {enabled:false,reason:'Recrutez au moins un compagnon pour aborder.'};
 const vessel=shipStats(cmd),crew=crewEffects(cmd,'raid');
 const skill=abilities.skills;
 const power=skill.technique*.26+skill.armes*.29+skill.force*.13+
   skill.precision*.10+skill.volonte*.08;
 const headcount=cmd.members.length*3;
 const threat=p.threat+(p.faction==='marine'?8:0);
 let chance;
 if(choice==='fight')chance=46+(vessel.firepower-50)*.30+
  (vessel.armor-50)*.12+power*.32+headcount+crew.chance*.55-
  threat*.52-(abilities.fatigue*.13)+(cmd.morale-50)*.07;
 else if(choice==='board')chance=33+power*.43+headcount*1.5+
  crew.chance*.7+cmd.members.reduce((n,m)=>n+(m.skill*.023),0)-
  threat*.61-abilities.fatigue*.16+(cmd.cohesion-50)*.12;
 else if(choice==='flee')chance=56+(vessel.speed-50)*.54+
  skill.navigation*.33+skill.vitesse*.16-
  threat*.33-(cmd.ship.parts.rudder<25?20:0);
 else chance=66+skill.volonte*.20+(cmd.morale-50)*.07+
  (p.faction==='marchand'?12:p.faction==='marine'?-17:0)-
  threat*.31-(career.wanted.heat*.13);
 return {enabled:true,chance:clamp(chance,8,94)};
}
function wantedAfter(w,age,p,choice,success){
 let heat=0,fame=0,growth=0;
 if(['fight','board'].includes(choice)){
  heat=p.faction==='marine'?success?21:16:success?7:5;
  fame=success?choice==='board'?8:6:2;
  growth=success?(p.faction==='marine'?2200000:
   p.faction==='marchand'?800000:choice==='board'?340000:170000):0;
 }else if(choice==='flee'){
  heat=success?-5:7;fame=success?1:0;
 }else{
  heat=success?-4:4;
 }
 const bounty=Math.min(MAX_BOUNTY,w.bounty+growth);
 const gained=bounty-w.bounty;
 const text='Avis de recherche : '+bounty.toLocaleString('fr-FR')+' Berrys.';
 return {wanted:{...w,bounty,heat:clamp(w.heat+heat),
   notoriety:clamp(w.notoriety+fame),
   incidents:Math.min(500,w.incidents+(gained?1:0)),
   events:gained?[...w.events,{age,type:'bounty',text}].slice(-20):w.events},gained};
}
export function resolveEncounter(career,life,abilities,choice,random=Math.random){
 const access=encounterAvailability(career,life,abilities,choice);
 if(!access.enabled)return null;
 const cmd=career.command,p=cmd.encounters.pending;
 const success=safeRoll(random)<access.chance/100;
 const injuryRoll=safeRoll(random);
 const battle=choice==='fight'||choice==='board';
 const rank= p.threat>=60?3:p.threat>=38?2:1;
 const base=rank===3?85000:rank===2?41000:18000;
 const loot=success?
   choice==='board'?Math.round(base*1.7):
   choice==='fight'?base:
   choice==='negotiate'?Math.round(base*.13):0:0;
 const loss=success?0:Math.min(career.missions.berys,
   choice==='negotiate'?Math.round(base*.14):choice==='flee'?Math.round(base*.18):
   Math.round(base*.28));
 const dmg=success?
  battle?Math.max(1,Math.round(p.threat/18)):0:
  battle?Math.max(4,Math.round(p.threat/5)):
  choice==='flee'?Math.max(2,Math.round(p.threat/9)):0;
 const role=crewEffects(cmd,'raid');
 const reduction=role.hullReduction;
 const hullLoss=Math.max(0,dmg-reduction);
 let vessel={...cmd,hull:clamp(cmd.hull-hullLoss),
  morale:clamp(cmd.morale+(success?battle?4:2:-6)),
  cohesion:clamp(cmd.cohesion+(success?2:-3)),
  members:cmd.members.map(m=>({...m,
   loyalty:clamp(m.loyalty+(success?battle?2:1:-3)),
   bond:clamp(m.bond+(success?1:-2))}))};
 if(dmg>0){
  const worn=wearShip(vessel,success?'success':'failure',battle?'raid':'explore');
  vessel={...worn,ship:{...worn.ship,voyages:cmd.ship.voyages}};
 }
 const gain=Math.min(999999999,Math.max(0,career.missions.berys+loot-loss));
 const injured=battle&&!success&&injuryRoll>(1-(p.threat/450)*role.injuryMultiplier);
 const injury=injured?{level:Math.max(1,abilities.injury.level),
  recoverAtAge:Math.max(life.age+1,abilities.injury.recoverAtAge??0)}:abilities.injury;
 const fatigue=clamp(abilities.fatigue+(battle?success?19:29:choice==='flee'?12:4));
 const {wanted,gained}=wantedAfter(career.wanted,life.age,p,choice,success);
 const action=ENCOUNTER_CHOICES[choice].label.toLowerCase();
 const text=(success?'Vous parvenez à ':'Vous échouez à ')+action+
  ' face à '+ENCOUNTER_FACTIONS[p.faction].toLowerCase()+
  (loot?' : +'+loot.toLocaleString('fr-FR')+' Berrys.':
   loss?' : -'+loss.toLocaleString('fr-FR')+' Berrys.':'.');
 const entry={age:life.age,island:p.island,faction:p.faction,choice,
  outcome:success?'success':'failure',chance:access.chance,
  loot,damage:hullLoss,bountyGain:gained,text};
 const old=cmd.encounters;
 const score=battle?(success?'victories':'defeats'):
  success?(choice==='flee'?'escapes':'negotiated'):'defeats';
 const encounters={...old,pending:null,resolved:old.resolved+1,
  [score]:old[score]+1,log:[...old.log,entry].slice(-16)};
 const command={...vessel,encounters};
 const notice={age:life.age,type:'encounter',text};
 return {career:{...career,command,wanted,
  pirate:{...career.pirate,performance:clamp(career.pirate.performance+
    (battle?(success?3:-4):success?1:-1))},
  missions:{...career.missions,berys:gain},
  notices:[...career.notices,notice].slice(-25),lastNotice:text},
  abilities:{...abilities,fatigue,injury},entry};
}
