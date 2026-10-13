import { validBirthplace } from './places.mjs';
import { MAX_AGE, createCharacter, birthEntry, advanceLife, ageEntry } from './life.mjs';
import {
  QUALITY_KEYS, emptyStory, sceneForAge, optionFor,
  annualNarrative, qualityAfterChoice
} from './events.mjs';
import {
  emptyRelations, createFamily, isValidRelations, advanceRelations,
  interact, meetFriend, socialAnnualNote
} from './relationships.mjs';
import { initiativeForAge, resolveInitiative, INITIATIVE_AGES } from './initiatives.mjs';
import { familyBirth, gatherCircle, recordFriendshipMilestones } from './social-evolution.mjs';
import { meetPartner, actRomance } from './romance.mjs';
import { joinFaction, takeWorldAction, advanceWorld, worldActionAvailability } from './world-relations.mjs';
import { emptyAbilities, createAbilities, validAbilities, trainSkill, ageAbilities, restAbilities, trainingAvailability } from './abilities.mjs';
import { emptyCareer, isValidCareer, applyForCrew, workHard, ageCareer, requestPromotion, SPECIALTIES } from './pirate-career.mjs';
import { performMission } from './pirate-missions.mjs';
import { missionWanted, annualPursuit, hideFromMarine } from './pirate-notoriety.mjs';
import { foundOwnCrew, leaveOwnEmployer, recruitToCrew, giveOrder } from './pirate-command.mjs';
export { MAX_AGE } from './life.mjs';

export const SCHEMA_VERSION = 14;
const VALID_HISTORY_TYPES = new Set(['birth','year','event','decision','end','npc-event','npc-decision']);

export function createEmptyState() {
  return { schemaVersion: SCHEMA_VERSION, activeLife: null,
    history: [], domainData: { story: emptyStory(), relationships: emptyRelations(),
      abilities:emptyAbilities(),career:emptyCareer() } };
}
export function isEmptyState(state) {
  return isValidState(state) && state.activeLife === null;
}
function validStory(story, history, age) {
  if (!story || typeof story !== 'object' ||
      !story.qualities || typeof story.qualities !== 'object' ||
      !Array.isArray(story.decisions) || story.decisions.length > 8) return false;
  if (Object.keys(story.qualities).length !== QUALITY_KEYS.length ||
      !QUALITY_KEYS.every(key => Number.isInteger(story.qualities[key]) &&
        story.qualities[key] >= 0 && story.qualities[key] <= 5)) return false;
  const expected = { audace: 0, curiosite: 0, solidarite: 0 };
  let prevAge = -1;
  for (const decision of story.decisions) {
    if (!decision || !Number.isInteger(decision.age) || decision.age <= prevAge ||
        decision.age > age || typeof decision.option !== 'string' ||
        history[decision.age]?.type !== 'decision') return false;
    const scene = sceneForAge(decision.age);
    if (!scene || decision.eventId !== scene.id) return false;
    const option = optionFor(scene, decision.option);
    if (!option) return false;
    expected[option.quality] = Math.min(5, expected[option.quality] + 1);
    prevAge = decision.age;
  }
  if (!QUALITY_KEYS.every(key => story.qualities[key] === expected[key])) return false;
  const unresolved = story.pending;
  if (unresolved === null) return !history.some(entry => entry.type === 'event') &&
    history.filter(entry => entry.type === 'decision').length === story.decisions.length;
  if (!unresolved || !Number.isInteger(unresolved.age) || unresolved.age !== age ||
      !sceneForAge(age) || unresolved.eventId !== sceneForAge(age).id ||
      history[age]?.type !== 'event') return false;
  return history.filter(entry => entry.type === 'event').length === 1 &&
    history.filter(entry => entry.type === 'decision').length === story.decisions.length;
}
export function isValidState(state) {
  if (!state || typeof state !== 'object' || state.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(state.history) || !state.domainData ||
      typeof state.domainData !== 'object' || Array.isArray(state.domainData) ||
      Object.keys(state.domainData).length !== 4 ||
      !['story','relationships','abilities','career'].every(key=>
        Object.hasOwn(state.domainData,key))) return false;

  if (state.activeLife === null)
    return state.history.length === 0 &&
      validStory(state.domainData.story, state.history, 0) &&
      state.domainData.story.pending === null &&
      state.domainData.story.decisions.length === 0 &&
      isValidRelations(state.domainData.relationships,0,false) &&
      validAbilities(state.domainData.abilities,0,false) &&
      isValidCareer(state.domainData.career,null,state.domainData.relationships,
        state.domainData.abilities);
  const c = state.activeLife;
  if (!c || typeof c !== 'object' || Array.isArray(c) ||
      typeof c.firstName !== 'string' || !c.firstName.trim() || c.firstName.length > 32 ||
      typeof c.lastName !== 'string' || !c.lastName.trim() || c.lastName.length > 32 ||
      !['M','F'].includes(c.gender) ||
      !c.origin || !validBirthplace(c.origin.sea, c.origin.place) ||
      !Number.isInteger(c.age) || c.age < 0 || c.age > MAX_AGE ||
      c.alive !== (c.age < MAX_AGE) ||
      state.history.length !== c.age + 1) return false;

  for (let i = 0; i < state.history.length; i++) {
    const item = state.history[i];
    if (!item || item.age !== i || !VALID_HISTORY_TYPES.has(item.type) ||
        typeof item.text !== 'string' || item.text.length === 0 || item.text.length > 300 ||
        (i === 0 && item.type !== 'birth') ||
        (i === MAX_AGE && item.type !== 'end') ||
        (i > 0 && i < MAX_AGE && (item.type === 'birth' || item.type === 'end')) ||
        (item.type === 'event' && i !== c.age) ||
        (item.type === 'decision' && !sceneForAge(i)) ||
        (item.type === 'npc-event' && i !== c.age) ||
        (item.type === 'npc-decision' && !INITIATIVE_AGES.includes(i))) return false;
  }
  return validStory(state.domainData.story, state.history, c.age) &&
    isValidRelations(state.domainData.relationships,c.age,true,state.history) &&
    validAbilities(state.domainData.abilities,c.age,true) &&
    isValidCareer(state.domainData.career,c,state.domainData.relationships,
      state.domainData.abilities) &&
    !(state.domainData.story.pending && state.domainData.relationships.pending);
}
export function beginLife(state, options = {}, random = Math.random) {
  if (!isEmptyState(state)) throw new Error('Partie non vierge ou invalide');
  const life = createCharacter(options, random);
  return { ...state, activeLife: life, history: [birthEntry(life)],
    domainData:{...state.domainData,relationships:createFamily(life,random),
      abilities:createAbilities(life)} };
}
export function advanceOneYear(state,random=null) {
  if (!isValidState(state) || !state.activeLife ||
      (state.domainData.story.pending !== null ||
       state.domainData.relationships.pending !== null)) return null;
  const life = advanceLife(state.activeLife);
  if (!life) return null;
  let abilities=ageAbilities(state.domainData.abilities,life.age);
  const update = advanceRelations(state.domainData.relationships,life.age);
  const careerUpdate=ageCareer(state.domainData.career,abilities,life,
    update.relations,random);
  let career=careerUpdate.career;
  const birth=familyBirth(update.relations,life.age,life,random);
  const worldChange=career.command?{relations:birth.relations,announcements:[]}:
    advanceWorld(birth.relations,life.age,random);
  let relations = worldChange.relations;
  const pursuit=annualPursuit(career,abilities,relations,life,random??Math.random);
  career=pursuit.career;
  abilities=pursuit.abilities;
  if (!life.alive) {
    return { ...state, activeLife:life, history:[...state.history,ageEntry(life)],
      domainData:{...state.domainData,relationships:relations,abilities,career} };
  }
  const scene = sceneForAge(life.age);
  const story = state.domainData.story;
  const socialNote = socialAnnualNote(relations,life.age);
  const addition = [...update.announcements,...birth.announcements,
    ...worldChange.announcements,careerUpdate.note,pursuit.note,socialNote].filter(Boolean).join(' ');
  const intro = scene ? scene.text : annualNarrative(life,story);
  // Une initiative n'apparaît pas pendant un jalon narratif classique.
  // Une année = un seul emplacement dans l'historique.
  const npc=scene || typeof random!=='function' ? null :
    initiativeForAge(relations,life.age,random);
  if(npc)relations={...relations,pending:npc};
  const entry = { age:life.age,type:scene?'event':npc?'npc-event':'year',
    text:(addition ? intro+' '+addition : intro).slice(0,300) };
  const nextStory = scene ? {...story,pending:{age:life.age,eventId:scene.id}} : story;
  return {...state,activeLife:life,history:[...state.history,entry],
    domainData:{...state.domainData,story:nextStory,relationships:relations,
      abilities,career} };
}
export function resolveDecision(state, optionId) {
  if (!isValidState(state) || !state.activeLife) return null;
  const story = state.domainData.story;
  if (!story.pending) return null;
  const scene = sceneForAge(story.pending.age);
  const option = optionFor(scene, optionId);
  if (!option) return null;
  const newStory = {
    qualities: qualityAfterChoice(story.qualities, option),
    decisions: [...story.decisions, { age: scene.age, eventId: scene.id, option: option.id }],
    pending: null
  };
  const newHistory = [...state.history];
  const birthNote=state.domainData.relationships.records.findLast(r=>
    r.age===scene.age && r.action==='birth')?.text;
  newHistory[newHistory.length - 1] = { age: scene.age, type: 'decision',
    text:(option.result+(birthNote?' '+birthNote:'')).slice(0,300) };
  const relations = state.domainData.relationships;
  // Une attitude solidaire renforce aussi le lien avec l'entourage familial.
  const relative = relations.people.find(p=>p.role==='mother'&&!p.deceased) ??
    relations.people.find(p=>p.role==='father'&&!p.deceased);
  const updatedRelations = option.quality==='solidarite' && relative
    ? {...relations,people:relations.people.map(p=>p.id===relative.id
      ? {...p,bond:Math.min(100,p.bond+3)}:p)}
    : relations;
  return {...state,domainData:{...state.domainData,story:newStory,relationships:updatedRelations},
    history:newHistory};
}

/** Actions sociales : elles n'avancent pas le temps et ne créent pas d'année supplémentaire. */
export function socialize(state,personId,action,random=Math.random){
  if(!isValidState(state) || !state.activeLife?.alive ||
    state.domainData.story.pending || state.domainData.relationships.pending) return null;
  const relations=interact(state.domainData.relationships,personId,action,
    state.activeLife.age,state.domainData.story.qualities.solidarite,random);
  return relations ? {...state,domainData:{...state.domainData,relationships:relations}} : null;
}
export function makeFriend(state,random=Math.random){
  if(!isValidState(state) || !state.activeLife?.alive ||
    state.domainData.story.pending || state.domainData.relationships.pending) return null;
  const relations=meetFriend(state.domainData.relationships,state.activeLife,
    state.activeLife.age,random);
  return relations ? {...state,domainData:{...state.domainData,relationships:relations}} : null;
}

/** Réponse à une initiative de PNJ, sans saut d'année supplémentaire. */
export function answerInitiative(state,optionId){
  if(!isValidState(state) || !state.activeLife?.alive ||
    state.domainData.story.pending) return null;
  const resolved=resolveInitiative(
    state.domainData.relationships,optionId,state.activeLife.age);
  if(!resolved)return null;
  const {result,...data}=resolved;
  const relationships=recordFriendshipMilestones(data,state.activeLife.age);
  const history=[...state.history];
  const birthNote=relationships.records.findLast(r=>r.age===state.activeLife.age&&r.action==='birth')?.text;
  history[history.length-1]={age:state.activeLife.age,type:'npc-decision',
    text:(result+(birthNote?' '+birthNote:'')).slice(0,300)};
  return {...state,history,domainData:{...state.domainData,relationships}};
}

/** Activité du cercle d'amis : une action de groupe, sans changer d'année. */
export function socializeGroup(state,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive ||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const rel=gatherCircle(state.domainData.relationships,state.activeLife.age,random);
  return rel ? {...state,domainData:{...state.domainData,relationships:rel}} : null;
}

/** Les jalons familiaux enrichissent l'année actuelle au lieu de créer un second événement. */
function romanceUpdate(state,relations,important){
  const history=[...state.history];
  if(important){
    const latest=history.at(-1);
    const text=relations.recent;
    // On donne la priorité au jalon récent en conservant un extrait du contexte annuel.
    const prefix=latest.text.slice(0,Math.max(0,299-text.length-1)).trim();
    history[history.length-1]={...latest,text:(prefix ? prefix+' '+text : text).slice(0,300)};
  }
  return {...state,history,domainData:{...state.domainData,relationships:relations}};
}
/** Actions relationnelles de V0.4.4, sans progression du temps. */
export function startRomance(state,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const next=meetPartner(state.domainData.relationships,state.activeLife,random);
  return next?romanceUpdate(state,next,true):null;
}
export function doRomance(state,action,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const next=actRomance(state.domainData.relationships,action,state.activeLife,random);
  return next?romanceUpdate(state,next,action!=='date'):null;
}

/** Choix d'une affiliation et action auprès d'un contact, sans passer d'année. */
export function chooseFaction(state,faction,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const next=joinFaction(state.domainData.relationships,state.activeLife,faction,random);
  return next?romanceUpdate(state,next,true):null;
}
export function actInFaction(state,action,random=Math.random){
  if(action==='mission'&&state?.domainData?.career?.pirate)
    return doPirateMission(state,'escort',random);
  if(action==='train'){
    const p=state?.domainData?.career?.pirate;
    const skill=p?SPECIALTIES[p.specialty].skill:'technique';
    return practiceWithMentor(state,skill,random);
  }
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const next=takeWorldAction(state.domainData.relationships,action,state.activeLife.age,random);
  return next?{...state,domainData:{...state.domainData,relationships:next}}:null;
}

/** Le mentor est un vrai PNJ partagé avec Relations. La séance utilise le même quota
 * d'entraînement et une action sociale, sans créer une année supplémentaire. */
export function practiceWithMentor(state,skill,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const rel=state.domainData.relationships;
  const access=worldActionAvailability(rel,'train',state.activeLife.age);
  if(!access.enabled||!trainingAvailability(state.domainData.abilities,
    state.activeLife,skill).enabled)return null;
  const mentorBonus=access.target.trust>=65&&access.target.respect>=55?2:1;
  const abilities=trainSkill(state.domainData.abilities,state.activeLife,
    skill,random,mentorBonus);
  if(!abilities)return null;
  const relationships=takeWorldAction(rel,'train',state.activeLife.age,random);
  if(!relationships)return null;
  return {...state,domainData:{...state.domainData,abilities,relationships}};
}
export function recoverFromTraining(state){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const abilities=restAbilities(state.domainData.abilities,state.activeLife);
  return abilities?{...state,domainData:{...state.domainData,abilities}}:null;
}
export function askPiratePromotion(state,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const outcome=requestPromotion(state.domainData.career,
    state.domainData.relationships,state.domainData.abilities,state.activeLife,random);
  if(!outcome)return null;
  const rel=state.domainData.relationships;
  const trustDelta=outcome.success?3:-2;
  const relationships={...rel,people:rel.people.map(p=>p.id==='world-leader'?
    {...p,trust:Math.min(100,Math.max(0,p.trust+trustDelta))}:p)};
  return {...state,domainData:{...state.domainData,
    career:outcome.career,relationships}};
}

/** S'entraîner appartient à la vie du personnage, y compris hors d'un emploi. */
export function practiceSkill(state,skill,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const abilities=trainSkill(state.domainData.abilities,state.activeLife,skill,random);
  return abilities?{...state,domainData:{...state.domainData,abilities}}:null;
}
/** Candidature unique par année ; échec conservé comme un vrai événement de carrière. */
export function applyPirate(state,crewId,specialty,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const outcome=applyForCrew(state.domainData.career,state.domainData.relationships,
    state.domainData.abilities,state.activeLife,crewId,specialty,random);
  if(!outcome)return null;
  const history=[...state.history];
  const item=history.at(-1);
  const note=outcome.career.lastNotice;
  const prefix=item.text.slice(0,Math.max(0,299-note.length-1)).trim();
  history[history.length-1]={...item,text:(prefix?prefix+' '+note:note).slice(0,300)};
  return {...state,history,domainData:{...state.domainData,
    career:outcome.career,relationships:outcome.relationships}};
}
export function workPirate(state){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const career=workHard(state.domainData.career,state.activeLife,state.domainData.abilities);
  if(!career)return null;
  const rel=state.domainData.relationships;
  const captain=career.command?null:rel.people.find(p=>p.id==='world-leader'&&!p.deceased);
  const relationships=captain?{...rel,people:rel.people.map(p=>
    p.id===captain.id?{...p,trust:Math.min(100,p.trust+2)}:p)}:rel;
  const abilities={...state.domainData.abilities,
    fatigue:Math.min(100,state.domainData.abilities.fatigue+10)};
  return {...state,domainData:{...state.domainData,career,relationships,abilities}};
}

/** Mission pirate jouée dans l'année actuelle. Sauvegarde atomique, aucun âge supplémentaire. */
export function doPirateMission(state,id,random=Math.random){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const outcome=performMission(state.domainData.career,state.domainData.abilities,
    state.domainData.relationships,state.activeLife,id,random);
  if(!outcome)return null;
  const history=[...state.history],entry=history.at(-1);
  const prior=state.domainData.career.wanted;
  const wanted=missionWanted(prior,outcome.entry,state.activeLife.age);
  const gained=wanted.bounty-prior.bounty;
  const summary=outcome.entry.text+(gained>0?
    ' Nouvelle prime : '+wanted.bounty.toLocaleString('fr-FR')+' Berrys.':'');
  const remaining=299-summary.length-1;
  const prefix=entry.text.slice(0,Math.max(0,remaining)).trim();
  history[history.length-1]={...entry,
    text:(prefix?prefix+' '+summary:summary).slice(0,300)};
  return {...state,history,domainData:{...state.domainData,
    career:{...outcome.career,wanted},abilities:outcome.abilities,
    relationships:outcome.relationships}};
}
/** Une action discrète réduit les poursuites, pas la prime déjà publiée. */
export function hidePirate(state){
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const career=hideFromMarine(state.domainData.career,state.activeLife);
  return career?{...state,domainData:{...state.domainData,career}}:null;
}

/** Transitions professionnelles : aucune ne fait progresser l'âge. */
function careerChangeState(state,career,relationships=state.domainData.relationships){
  const history=[...state.history];
  const item=history.at(-1),note=career.lastNotice;
  const prefix=item.text.slice(0,Math.max(0,299-note.length-1)).trim();
  history[history.length-1]={...item,text:(prefix?prefix+' '+note:note).slice(0,300)};
  return {...state,history,domainData:{...state.domainData,career,relationships}};
}
function canManageCareer(state){
  return isValidState(state)&&state.activeLife?.alive&&
    !state.domainData.story.pending&&!state.domainData.relationships.pending;
}
export function resignPirate(state){
  if(!canManageCareer(state))return null;
  const next=leaveOwnEmployer(state.domainData.career,state.activeLife,
    state.domainData.relationships);
  return next?careerChangeState(state,next.career):null;
}
export function foundPirateCrew(state){
  if(!canManageCareer(state))return null;
  const next=foundOwnCrew(state.domainData.career,state.activeLife,
    state.domainData.relationships);
  return next?careerChangeState(state,next.career,next.relationships):null;
}
export function recruitPirateMember(state,specialty,random=Math.random){
  if(!canManageCareer(state))return null;
  const next=recruitToCrew(state.domainData.career,state.activeLife,specialty,random);
  return next?careerChangeState(state,next.career):null;
}
export function orderPirateCrew(state,order){
  if(!canManageCareer(state))return null;
  const career=giveOrder(state.domainData.career,state.activeLife,order);
  return career?careerChangeState(state,career):null;
}
