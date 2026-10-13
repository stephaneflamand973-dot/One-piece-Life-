
import { SPECIALTIES } from './pirate-career.mjs';
export const MAX_MISSIONS=2;
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
   !Number.isInteger(m.used)||m.used<0||m.used>MAX_MISSIONS||
   !Number.isInteger(m.berys)||m.berys<0||m.berys>999999999||
   !['completed','partial','failed'].every(k=>Number.isInteger(m[k])&&m[k]>=0&&m[k]<=500)||
   !Array.isArray(m.log)||m.log.length>20||
   m.used>(career.pirate?MAX_MISSIONS:0))return false;
 if(!career.pirate&&(m.berys||m.completed||m.partial||m.failed||m.log.length))return false;
 if(age===null)return m.used===0&&m.log.length===0&&m.berys===0;
 if(m.log.filter(e=>e.age===age).length!==m.used)return false;
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
 if(career.missions.used>=MAX_MISSIONS)return {enabled:false,reason:'Deux missions déjà effectuées cette année.'};
 if(a.injury.level===2)return {enabled:false,reason:'Blessure sérieuse : récupération nécessaire.'};
 if(a.fatigue>=85)return {enabled:false,reason:'Fatigue excessive : reposez-vous.'};
 const captain=rel.people.find(x=>x.id==='world-leader'&&!x.deceased);
 const ally=rel.people.find(x=>x.id==='world-ally'&&!x.deceased);
 const lead=captain?(captain.trust+captain.respect)/2:35;
 const aptitude=a.skills[data.skills[0]]*.42+a.skills[data.skills[1]]*.28+
   a.skills[SPECIALTIES[p.specialty].skill]*.30;
 const chance=cap(74-data.difficulty*.66+aptitude*.38+p.performance*.14+
   (lead-50)*.09+((ally?.bond??25)-50)*.06+
   (rel.world.loyalty-50)*.05-a.fatigue*.22-(a.injury.level===1?10:0));
 return {enabled:true,chance:Math.max(8,Math.min(92,chance))};
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
 const reward=outcome==='success'?data.reward:outcome==='partial'?Math.round(data.reward*.35):0;
 const risk=outcome==='failure'?(data.difficulty>=60?.30:.14):
   outcome==='partial'?(data.difficulty>=60?.09:.035):.008;
 const injured=secondary>1-risk?(data.difficulty>=60&&secondary>1-risk*.25?2:1):0;
 const level=Math.max(a.injury.level,injured);
 const injury=injured?{level,recoverAtAge:Math.max(a.injury.recoverAtAge??0,life.age+level)}:a.injury;
 const performanceDelta=outcome==='success'?Math.max(3,Math.round(data.difficulty/10)):
   outcome==='partial'?1:-Math.max(3,Math.round(data.difficulty/12));
 const repDelta=outcome==='success'?Math.max(2,Math.round(data.difficulty/14)):outcome==='partial'?1:-3;
 const text=data.label+(outcome==='success?' : réussite.':outcome==='partial'?' : succès partiel.':' : échec.');
 const entry={age:life.age,id,outcome,chance:available.chance,reward,performanceDelta,injury:injured,text};
 const old=career.missions;
 const missions={...old,used:old.used+1,berys:Math.min(999999999,old.berys+reward),
   completed:old.completed+(outcome==='success'?1:0),
   partial:old.partial+(outcome==='partial'?1:0),
   failed:old.failed+(outcome==='failure'?1:0),
   log:[...old.log,entry].slice(-20)};
 const updatedCareer={...career,missions,pirate:{...career.pirate,
   performance:cap(career.pirate.performance+performanceDelta)}};
 const world=rel.world;
 const updatedWorld={...world,reputation:cap(world.reputation+repDelta),
   loyalty:cap(world.loyalty+(outcome==='success'?4:outcome==='partial'?1:-4)),
   standings:{...world.standings,pirate:cap(world.standings.pirate+
     (outcome==='success'?2:outcome==='failure'?-2:0))}};
 const captain=rel.people.find(p=>p.id==='world-leader'&&!p.deceased);
 const people=captain?rel.people.map(p=>p.id===captain.id?
   {...p,trust:cap(p.trust+(outcome==='success'?3:outcome==='partial'?1:-4))}:p):rel.people;
 return {career:updatedCareer,
   abilities:{...a,fatigue:cap(a.fatigue+(data.difficulty>=60?28:data.difficulty>=40?22:15)),injury},
   relationships:{...rel,world:updatedWorld,people,recent:text},entry};
}
export function ageMissions(career){return {...career,missions:{...career.missions,used:0}};}
