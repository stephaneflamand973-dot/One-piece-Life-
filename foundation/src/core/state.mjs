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
export { MAX_AGE } from './life.mjs';

export const SCHEMA_VERSION = 6;
const VALID_HISTORY_TYPES = new Set(['birth','year','event','decision','end','npc-event','npc-decision']);

export function createEmptyState() {
  return { schemaVersion: SCHEMA_VERSION, activeLife: null,
    history: [], domainData: { story: emptyStory(), relationships: emptyRelations() } };
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
      Object.keys(state.domainData).length !== 2 ||
      !Object.prototype.hasOwnProperty.call(state.domainData, 'story') ||
      !Object.prototype.hasOwnProperty.call(state.domainData, 'relationships')) return false;

  if (state.activeLife === null)
    return state.history.length === 0 &&
      validStory(state.domainData.story, state.history, 0) &&
      state.domainData.story.pending === null &&
      state.domainData.story.decisions.length === 0 &&
      isValidRelations(state.domainData.relationships,0,false);
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
    !(state.domainData.story.pending && state.domainData.relationships.pending);
}
export function beginLife(state, options = {}, random = Math.random) {
  if (!isEmptyState(state)) throw new Error('Partie non vierge ou invalide');
  const life = createCharacter(options, random);
  return { ...state, activeLife: life, history: [birthEntry(life)],
    domainData: {...state.domainData,relationships:createFamily(life,random)} };
}
export function advanceOneYear(state,random=null) {
  if (!isValidState(state) || !state.activeLife ||
      (state.domainData.story.pending !== null ||
       state.domainData.relationships.pending !== null)) return null;
  const life = advanceLife(state.activeLife);
  if (!life) return null;
  const update = advanceRelations(state.domainData.relationships,life.age);
  let relations = update.relations;
  if (!life.alive) {
    return { ...state, activeLife:life, history:[...state.history,ageEntry(life)],
      domainData:{...state.domainData,relationships:relations} };
  }
  const scene = sceneForAge(life.age);
  const story = state.domainData.story;
  const socialNote = socialAnnualNote(relations,life.age);
  const addition = [...update.announcements,socialNote].filter(Boolean).join(' ');
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
    domainData:{story:nextStory,relationships:relations} };
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
  newHistory[newHistory.length - 1] = { age: scene.age, type: 'decision', text: option.result };
  const relations = state.domainData.relationships;
  // Une attitude solidaire renforce aussi le lien avec l'entourage familial.
  const relative = relations.people.find(p=>p.role==='mother'&&!p.deceased) ??
    relations.people.find(p=>p.role==='father'&&!p.deceased);
  const updatedRelations = option.quality==='solidarite' && relative
    ? {...relations,people:relations.people.map(p=>p.id===relative.id
      ? {...p,bond:Math.min(100,p.bond+3)}:p)}
    : relations;
  return {...state,domainData:{story:newStory,relationships:updatedRelations},
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
  const {result,...relationships}=resolved;
  const history=[...state.history];
  history[history.length-1]={age:state.activeLife.age,type:'npc-decision',text:result};
  return {...state,history,domainData:{...state.domainData,relationships}};
}
