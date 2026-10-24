
import { SPECIALTIES } from './pirate-career.mjs';
import {scaledBenefit,scaledChance,nextCount} from './diminishing.mjs';
import { crewEffects } from './pirate-crew-life.mjs';
import {shipMissionEffects,wearShip} from './pirate-ships.mjs';
export const MISSIONS=Object.freeze({
  escort:{label:'Escorter une cargaison',risk:'Faible',difficulty:24,reward:18000,skills:['navigation','endurance'],rank:0},
  explore:{label:'Explorer une île',risk:'Modéré',difficulty:36,reward:38000,skills:['navigation','vitesse'],rank:0},
  treasure:{label:'Rechercher un trésor',risk:'Modéré',difficulty:46,reward:72000,skills:['navigation','technique'],rank:0},
  raid:{label:'Aborder un navire rival',risk:'Élevé',difficulty:62,reward:135000,skills:['technique','armes'],rank:1},
  marine:{label:'Échapper à la Marine',risk:'Très élevé',difficulty:78,reward:240000,skills:['vitesse','volonte'],rank:2}
});
const cap=n=>Math.max(0,Math.min(100,Math.round(n)));
export function emptyMissions(){return {used:0,berys:0,completed:0,partial:0,failed:0,log:[]};}
export function validMissions(m,age,career){
 if(!m||typeof m!=='object'||Object.keys(m).length!==6||
   !Number.isSafeInteger(m.used)||m.used<0||
   !Number.isInteger(m.berys)||m.berys<0||m.berys>999999999||
   !['completed','partial','failed'].every(k=>Number.isSafeInteger(m[k])&&m[k]>=0)||
   !Array.isArray(m.log)||m.log.length>20)return false;
 // Le trésor et le journal appartiennent au personnage, pas à son employeur.
 // Un ancien pirate peut avoir rempli son quota avant de démissionner.

 if(age===null)return m.used===0&&m.log.length===0&&m.berys===0;
 // Le journal conserve seulement les 20 dernières missions, mais le compteur annuel reste exact.
 const currentEntries=m.log.filter(e=>e.age===age).length;
 if(currentEntries!==Math.min(m.used,20))return false;
 if(m.log.length>m.completed+m.partial+m.failed)return false;
 return m.log.every(e=>e&&Number.isInteger(e.age)&&e.age>=16&&e.age<=age&&
   Object.hasOwn(MISSIONS,e.id)&&['success','partial','failure'].includes(e.outcome)&&
   Number.isInteger(e.chance)&&e.chance>=8&&e.chance<=92&&
   Number.isInteger(e.reward)&&e.reward>=0&&e.reward<=MISSIONS[e.id].reward&&
   Number.isInteger(e.performanceDelta)&&e.performanceDelta>=-10&&e.performanceDelta<=12&&
   [0,1,2].includes(e.injury)&&typeof e.text==='string'&&e.text.length>0&&e.text.length<=180);
}
export function missionAvailability(career,a,rel,life,id){
 const data=MISSIONS[id],p=career.pirate;
 if(!data)return {enabled:false,reason:'Mission inconnue.'};
 if(!life?.alive||!p||rel.world.faction!=='pirate')
   return {enabled:false,reason:'Une carrière pirate active est nécessaire.'};
 if(p.rank<data.rank)return {enabled:false,reason:'Rang insuffisant.'};
 if(career.command&&(career.command.hull<=0||career.command.ship.parts.sails<=0||
  career.command.ship.parts.rudder<=0))
  return {enabled:false,reason:'Navire immobilisé : réparez la coque, les voiles ou le gouvernail.'};
 const captain=rel.people.find(x=>x.id==='world-leader'&&!x.deceased);
 const own=career.command;
 const ally=rel.people.find(x=>x.id==='world-ally'&&!x.deceased);
 const lead=own?own.morale:(captain?(captain.trust+captain.respect)/2:35);
 const aptitude=a.skills[data.skills[0]]*.42+a.skills[data.skills[1]]*.28+
   a.skills[SPECIALTIES[p.specialty].skill]*.30;
 if(own&&((id==='raid'||id==='marine')&&own.members.length<2))
   return {enabled:false,reason:'Deux compagnons requis pour cette mission.'};
 const crewBonus=own?(own.members.length*1.5+
   own.members.reduce((total,item)=>total+item.skill,0)/Math.max(1,own.members.length)*.08+
   (own.hull-60)*.13):0;
 const roleImpact=crewEffects(own,id);
 const chance=cap(74-data.difficulty*.66+aptitude*.38+p.performance*.14+crewBonus+
   roleImpact.chance+shipMissionEffects(own,id).chance+
   (lead-50)*.09+((ally?.bond??25)-50)*.06+
   (rel.world.loyalty-50)*.05-a.fatigue*.22-(a.injury.level===1?10:0));
 return {enabled:true,chance:scaledChance(Math.max(8,Math.min(92,chance)),career.missions.used,3,8)};
}
export function performMission(career,a,rel,life,id,random=Math.random){
 const available=missionAvailability(career,a,rel,life,id);
 if(!available.enabled)return null;
 const roll=random(),secondary=random();
 if(![roll,secondary].every(n=>Number.isFinite(n)&&n>=0&&n<1))
   throw new TypeError('Tirage invalide');
 const data=MISSIONS[id];
 const outcome=roll<available.chance/100?'success':
   roll<Math.min(.98,(available.chance+22)/100)?'partial':'failure';
 const reward=scaledBenefit(outcome==='success'?data.reward:outcome==='partial'?Math.round(data.reward*.35):0,
   career.missions.used);
 const baseRisk=outcome==='failure'?(data.difficulty>=60?.30:.14):
   outcome==='partial'?(data.difficulty>=60?.09:.035):.008;
 const roleImpact=crewEffects(career.command,id);
 const risk=baseRisk*roleImpact.injuryMultiplier;
 const injured=secondary>1-risk?(data.difficulty>=60&&secondary>1-risk*.25?2:1):0;
 const level=Math.max(a.injury.level,injured);
 const injury=injured?{level,recoverAtAge:Math.max(a.injury.recoverAtAge??0,life.age+level)}:a.injury;
 const performanceDelta=outcome==='success'?scaledBenefit(Math.max(3,Math.round(data.difficulty/10)),career.missions.used):
   outcome==='partial'?scaledBenefit(1,career.missions.used):-Math.max(3,Math.round(data.difficulty/12));
 const repDelta=outcome==='success'?scaledBenefit(Math.max(2,Math.round(data.difficulty/14)),career.missions.used):outcome==='partial'?scaledBenefit(1,career.missions.used):-3;
 const text=data.label+(outcome==='success'?' : réussite.':outcome==='partial'?' : succès partiel.':' : échec.');
 const entry={age:life.age,id,outcome,chance:available.chance,reward,performanceDelta,injury:injured,text};
 const old=career.missions;
 const missions={...old,used:nextCount(old.used),berys:Math.min(999999999,old.berys+reward),
   completed:old.completed+(outcome==='success'?1:0),
   partial:old.partial+(outcome==='partial'?1:0),
   failed:old.failed+(outcome==='failure'?1:0),
   log:[...old.log,entry].slice(-20)};
 const vessel=career.command?shipMissionEffects(career.command,id):{damageReduction:0};
 const command=career.command?wearShip({...career.command,
   hull:cap(career.command.hull-Math.max(1,(outcome==='failure'?13:
     outcome==='partial'?7:3)-roleImpact.hullReduction-vessel.damageReduction)),
   morale:cap(career.command.morale+(outcome==='success'?5:
     outcome==='partial'?1:-8)+roleImpact.heal),
   cohesion:cap(career.command.cohesion+(outcome==='success'?3:
     outcome==='failure'?-6:-1)),
   members:career.command.members.map(member=>({...member,
     loyalty:cap(member.loyalty+(outcome==='success'?2:
       outcome==='failure'?-3:0)),
     bond:cap(member.bond+(outcome==='success'?2:
       outcome==='failure'?-3:0)),
     rivalry:cap(member.rivalry+(outcome==='failure'?3:-1))}))},outcome,id):null;
 const updatedCareer={...career,missions,command,pirate:{...career.pirate,
   performance:cap(career.pirate.performance+performanceDelta)}};
 const world=rel.world;
 const updatedWorld={...world,reputation:cap(world.reputation+repDelta),
   loyalty:cap(world.loyalty+(outcome==='success'?4:outcome==='partial'?1:-4)),
   standings:{...world.standings,pirate:cap(world.standings.pirate+
     (outcome==='success'?2:outcome==='failure'?-2:0))}};
 const captain=rel.people.find(p=>p.id==='world-leader'&&!p.deceased);
 const people=career.command?rel.people:captain?rel.people.map(p=>p.id===captain.id?
   {...p,trust:cap(p.trust+(outcome==='success'?3:outcome==='partial'?1:-4))}:p):rel.people;
 return {career:updatedCareer,
   abilities:{...a,fatigue:cap(a.fatigue+(data.difficulty>=60?28:data.difficulty>=40?22:15)),injury},
   relationships:{...rel,world:updatedWorld,people,recent:text},entry};
}
export function ageMissions(career){return {...career,missions:{...career.missions,used:0}};}
