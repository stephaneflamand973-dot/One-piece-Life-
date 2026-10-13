/** V0.5.8 : navigation continue entre îles de One Piece, sans quota annuel. */
import {shipStats,wearShip} from './pirate-ships.mjs';
import {crewEffects} from './pirate-crew-life.mjs';
import {rollEncounter} from './pirate-encounters.mjs';

export const SEA_LABELS=Object.freeze({east:'East Blue',grand:'Grand Line',new:'Nouveau Monde'});
export const ISLANDS=Object.freeze({
 fuchsia:{name:'Village de Fuchsia',sea:'east',hazard:8,links:['shells'],description:'Port natal et premières aventures.'},
 shells:{name:'Shells Town',sea:'east',hazard:12,links:['fuchsia','orange'],description:'Une petite base de la Marine surveille le port.'},
 orange:{name:'Orange Town',sea:'east',hazard:14,links:['shells','syrup'],description:'Commerces et pirates locaux.'},
 syrup:{name:'Village de Sirop',sea:'east',hazard:12,links:['orange','baratie'],description:'Village côtier au calme apparent.'},
 baratie:{name:'Baratie',sea:'east',hazard:16,links:['syrup','cocoyasi'],description:'Restaurant flottant et marins de passage.'},
 cocoyasi:{name:'Village de Cocoyasi',sea:'east',hazard:19,links:['baratie','loguetown'],description:'Eaux disputées et pêcheurs.'},
 loguetown:{name:'Loguetown',sea:'east',hazard:24,links:['cocoyasi','whiskey'],description:'Dernière escale avant Grand Line.'},
 whiskey:{name:'Whiskey Peak',sea:'grand',hazard:31,links:['loguetown','little-garden'],description:'Première traversée de Grand Line.'},
 'little-garden':{name:'Little Garden',sea:'grand',hazard:39,links:['whiskey','drum'],description:'Île préhistorique très dangereuse.'},
 drum:{name:'Île de Drum',sea:'grand',hazard:39,links:['little-garden','alabasta'],description:'Montagnes enneigées et soins rares.'},
 alabasta:{name:'Alabasta',sea:'grand',hazard:37,links:['drum','jaya'],description:'Royaume désertique et commerce.'},
 jaya:{name:'Jaya',sea:'grand',hazard:46,links:['alabasta','skypiea','water-seven'],description:'Repaire de pirates et rumeurs d’île céleste.'},
 skypiea:{name:'Skypiea',sea:'grand',hazard:61,links:['jaya'],description:'Route aérienne exceptionnellement risquée.'},
 'water-seven':{name:'Water Seven',sea:'grand',hazard:38,links:['jaya','sabaody'],description:'Chantiers navals réputés.'},
 sabaody:{name:'Archipel Sabaody',sea:'grand',hazard:52,links:['water-seven','fishman'],description:'Passage périlleux vers le Nouveau Monde.'},
 fishman:{name:'Île des Hommes-Poissons',sea:'new',hazard:65,links:['sabaody','punk-hazard'],description:'Route sous-marine difficile.'},
 'punk-hazard':{name:'Punk Hazard',sea:'new',hazard:69,links:['fishman','dressrosa'],description:'Environnement extrême.'},
 dressrosa:{name:'Dressrosa',sea:'new',hazard:67,links:['punk-hazard','zou'],description:'Royaume très convoité.'},
 zou:{name:'Zou',sea:'new',hazard:72,links:['dressrosa','wano'],description:'Destination difficile à localiser.'},
 wano:{name:'Pays des Wa',sea:'new',hazard:84,links:['zou','egghead'],description:'Mer hostile, guerriers et traditions.'},
 egghead:{name:'Egghead',sea:'new',hazard:85,links:['wano'],description:'Île du futur sous haute surveillance.'}
});
export const START_ISLAND='fuchsia';
const IDS=Object.keys(ISLANDS);
const clamp=(n,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Math.round(n)));
const roll=random=>{
 const n=random();
 if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Tirage maritime invalide');
 return n;
};
export function createNavigation(){
 return {location:START_ISLAND,visited:[START_ISLAND],explored:{},journeys:0,
  explorations:0,log:[]};
}
export function upgradeNavigationSave(command){
 if(!command)return null;
 return {...command,navigation:createNavigation()};
}
export function validNavigation(nav,command,age){
 if(!nav||typeof nav!=='object'||Array.isArray(nav)||
  Object.keys(nav).sort().join(',')!=='explorations,explored,journeys,location,log,visited'||
  !Object.hasOwn(ISLANDS,nav.location)||
  !Array.isArray(nav.visited)||nav.visited.length<1||nav.visited.length>IDS.length||
  nav.visited[0]!==START_ISLAND||new Set(nav.visited).size!==nav.visited.length||
  nav.visited.some(id=>!Object.hasOwn(ISLANDS,id))||
  !nav.visited.includes(nav.location)||
  !Number.isSafeInteger(nav.journeys)||nav.journeys<0||
  nav.journeys<nav.visited.length-1||
  !Number.isSafeInteger(nav.explorations)||nav.explorations<0||
  !nav.explored||Array.isArray(nav.explored)||typeof nav.explored!=='object'||
  Object.keys(nav.explored).some(id=>!nav.visited.includes(id)||
   !Number.isSafeInteger(nav.explored[id])||nav.explored[id]<1)||
  Object.values(nav.explored).reduce((a,b)=>a+b,0)!==nav.explorations||
  !Array.isArray(nav.log)||nav.log.length>16||
  nav.log.some(e=>!e||!Number.isInteger(e.age)||e.age<command.foundedAtAge||e.age>age||
   !['travel','explore'].includes(e.kind)||!Object.hasOwn(ISLANDS,e.island)||
   typeof e.text!=='string'||!e.text.trim()||e.text.length>155||
   !Number.isInteger(e.berys)||e.berys<0||e.berys>50000||
   !Number.isInteger(e.damage)||e.damage<0||e.damage>40||
   !['pirate','marine','revolutionnaire','marchand','civil'].includes(e.faction)))return false;
 return true;
}
const neighbors=(id)=>ISLANDS[id].links;
const navigator=(cmd)=>cmd.members.filter(m=>m.role==='navigateur')
 .reduce((s,m)=>Math.max(s,m.skill),0);
const stamp=(career,age,text,kind)=>({
 ...career,lastNotice:text,
 notices:[...career.notices,{age,type:kind,text}].slice(-25)
});
function travelCost(island){return island.sea==='new'?4000:island.sea==='grand'?2500:1000;}
function progression(cmd,skills,to){
 const site=ISLANDS[to],nav=navigator(cmd),own=skills.navigation??0;
 if(site.sea==='grand'&&ISLANDS[cmd.navigation.location].sea==='east'){
  if(cmd.members.length<1||Math.max(nav,own)<20)
   return 'Grand Line exige un compagnon et une navigation de 20 minimum.';
  if(cmd.hull<35)return 'Renforcez votre coque avant Grand Line (35 minimum).';
 }
 if(site.sea==='new'&&ISLANDS[cmd.navigation.location].sea==='grand'){
  if(cmd.members.length<2||cmd.ship.model==='sloop'||Math.max(nav,own)<45||
   cmd.hull<60)
   return 'Le Nouveau Monde demande un brick ou une frégate, deux compagnons, navigation 45 et coque 60.';
 }
 if(to==='skypiea'&&(cmd.hull<50||Math.max(nav,own)<35))
  return 'Skypiea demande une coque 50 et une navigation 35.';
 return '';
}
export function voyageAvailability(career,life,abilities,id){
 const cmd=career.command;
 if(!life?.alive||!cmd||cmd.pending||cmd.encounters.pending||!Object.hasOwn(ISLANDS,id))
  return {enabled:false,reason:'Réservé au capitaine disponible.'};
 if(!neighbors(cmd.navigation.location).includes(id))
  return {enabled:false,reason:'Cette île ne se trouve pas sur une route directe.'};
 if(cmd.hull<=0||cmd.ship.parts.sails<=0||cmd.ship.parts.rudder<=0)
  return {enabled:false,reason:'Réparez le navire avant de reprendre la mer.'};
 const reason=progression(cmd,abilities.skills,id);
 if(reason)return {enabled:false,reason};
 const cost=travelCost(ISLANDS[id]);
 if(career.missions.berys<cost)
  return {enabled:false,reason:'Voyage : '+cost.toLocaleString('fr-FR')+' Berrys nécessaires.',cost};
 const stats=shipStats(cmd);
 const lead=navigator(cmd);
 const chance=clamp(87-(ISLANDS[id].hazard*.48)+(stats.speed-60)*.16+
   lead*.11+(cmd.cohesion-50)*.045+(cmd.ship.maintenance-50)*.08,28,95);
 return {enabled:true,cost,chance};
}
function encounterFaction(site,random,heat=0){
 const n=roll(random);
 if(n<Math.min(.55,.12+heat/250))return 'marine';
 if(n<.43)return 'pirate';
 if(n<.58)return 'marchand';
 if(n<.74)return 'revolutionnaire';
 return 'civil';
}
const FACTIONS=Object.freeze({pirate:'un équipage pirate',marine:'une patrouille de la Marine',
 revolutionnaire:'des révolutionnaires',marchand:'des marchands',civil:'des habitants'});
function logged(nav,entry){
 return {...nav,log:[...nav.log,entry].slice(-16)};
}
export function sailToIsland(career,life,abilities,id,random=Math.random){
 const access=voyageAvailability(career,life,abilities,id);
 if(!access.enabled)return null;
 const cmd=career.command,site=ISLANDS[id],storm=roll(random)>=access.chance/100;
 const faction=encounterFaction(site,random,career.wanted?.heat??0);
 const first=!cmd.navigation.visited.includes(id);
 const reduction=crewEffects(cmd).hullReduction;
 const damage=storm?Math.max(2,Math.round(site.hazard/5)-reduction):1;
 const vessel=wearShip({...cmd,hull:clamp(cmd.hull-damage)},storm?'failure':'success',
  'explore');
 const text=(storm?'Traversée agitée vers ':'Vous accostez à ')+site.name+
  (storm?', malgré les dégâts.':'.')+' En mer, vous croisez '+FACTIONS[faction]+'.';
 const entry={age:life.age,kind:'travel',island:id,text,damage,berys:0,faction};
 const navigation=logged({...cmd.navigation,location:id,
  visited:first?[...cmd.navigation.visited,id]:cmd.navigation.visited,
  journeys:cmd.navigation.journeys+1},entry);
 const command=rollEncounter({...vessel,navigation,
  morale:clamp(vessel.morale+(storm?-3:1))},life.age,faction,site.hazard,
  random,career.wanted?.heat??0);
 return stamp({...career,command,missions:{...career.missions,
  berys:career.missions.berys-access.cost}},life.age,text,'voyage');
}
export function exploreAvailability(career,life){
 const cmd=career.command;
 if(!life?.alive||!cmd||cmd.pending||cmd.encounters.pending)
  return {enabled:false,reason:'Résolvez la rencontre ou la décision en cours.'};
 return {enabled:true};
}
export function exploreIsland(career,life,abilities,random=Math.random){
 if(!exploreAvailability(career,life).enabled)return null;
 const cmd=career.command,nav=cmd.navigation,id=nav.location,site=ISLANDS[id];
 const tries=nav.explored[id]??0;
 const chance=clamp(72-site.hazard*.38+(abilities.skills.navigation??0)*.12+
  cmd.members.length*2+(cmd.cohesion-50)*.08-tries*9,8,88);
 const success=roll(random)<chance/100;
 const faction=encounterFaction(site,random,career.wanted?.heat??0);
 const base=site.sea==='new'?15000:site.sea==='grand'?9000:4000;
 const gain=success?Math.max(0,Math.round(base*Math.max(0,1-tries*.25))):0;
 const damage=success?0:Math.max(0,Math.round(site.hazard/18)-1);
 const text=success?
  'Exploration de '+site.name+' : découverte de '+gain.toLocaleString('fr-FR')+
  ' Berrys et rencontre avec '+FACTIONS[faction]+'.':
  'Exploration difficile à '+site.name+' : vous rencontrez '+FACTIONS[faction]+
  (damage?' et le navire subit des dégâts.':'.');
 const entry={age:life.age,kind:'explore',island:id,text,damage,berys:gain,faction};
 const navigation=logged({...nav,explored:{...nav.explored,[id]:tries+1},
  explorations:nav.explorations+1},entry);
 const command={...cmd,navigation,hull:clamp(cmd.hull-damage),
  morale:clamp(cmd.morale+(success?1:-2))};
 return stamp({...career,command,
  missions:{...career.missions,berys:Math.min(999999999,career.missions.berys+gain)}},
  life.age,text,'exploration');
}
