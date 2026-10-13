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
import { joinFaction, takeWorldAction, advanceWorld } from './world-relations.mjs';
import { emptyAbilities, createAbilities, validAbilities, trainSkill, ageAbilities } from './abilities.mjs';
import { emptyCareer, isValidCareer, applyForCrew, workHard, ageCareer } from './pirate-career.mjs';
export { MAX_AGE } from './life.mjs';

export const SCHEMA_VERSION = 10;
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
  const abilities=ageAbilities(state.domainData.abilities);
  const careerUpdate=ageCareer(state.domainData.career,abilities,life);
  const career=careerUpdate.career;
  const update = advanceRelations(state.domainData.relationships,life.age);
  const birth=familyBirth(update.relations,life.age,life,random);
  const worldChange=advanceWorld(birth.relations,life.age,random);
  let relations = worldChange.relations;
  if (!life.alive) {
    return { ...state, activeLife:life, history:[...state.history,ageEntry(life)],
      domainData:{...state.domainData,relationships:relations,abilities,career} };
  }
  const scene = sceneForAge(life.age);
  const story = state.domainData.story;
  const socialNote = socialAnnualNote(relations,life.age);
  const addition = [...update.announcements,...birth.announcements,
    ...worldChange.announcements,careerUpdate.note,socialNote].filter(Boolean).join(' ');
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
  if(!isValidState(state)||!state.activeLife?.alive||
    state.domainData.story.pending||state.domainData.relationships.pending)return null;
  const next=takeWorldAction(state.domainData.relationships,action,state.activeLife.age,random);
  return next?{...state,domainData:{...state.domainData,relationships:next}}:null;
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
  const career=workHard(state.domainData.career,state.activeLife);
  if(!career)return null;
  const captain=state.domainData.relationships.people.find(p=>p.id==='world-leader'&&!p.deceased);
  const rel=state.domainData.relationships;
  const relationships=captain?{...rel,people:rel.people.map(p=>
    p.id===captain.id?{...p,trust:Math.min(100,p.trust+2)}:p)}:rel;
  return {...state,domainData:{...state.domainData,career,relationships}};
}
