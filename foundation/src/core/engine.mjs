import { createEmptyState, beginLife, advanceOneYear, resolveDecision, socialize, makeFriend, answerInitiative, socializeGroup, startRomance, doRomance, chooseFaction, actInFaction, practiceSkill, applyPirate, workPirate, practiceWithMentor, recoverFromTraining, askPiratePromotion, doPirateMission } from './state.mjs';
import { loadState, saveState, eraseState } from './storage.mjs';
import { createModuleRegistry } from './modules.mjs';

// Chaque action enregistre un état VALIDE avant de changer l'état visible.
export function createEngine({ storage, random = Math.random } = {}) {
  let state = loadState(storage) ?? createEmptyState();
  const registry = createModuleRegistry();
  const commit = next => {
    if (!next || !saveState(next, storage)) return false;
    state = next;
    return true;
  };
  return Object.freeze({
    getState: () => state,
    modules: registry,
    startLife(options) {
      if (state.activeLife) return false;
      return commit(beginLife(state, options, random));
    },
    age() { return commit(advanceOneYear(state,random)); },
    choose(optionId) { return commit(resolveDecision(state, optionId)); },
    answerNpc(optionId) { return commit(answerInitiative(state,optionId)); },
    interact(personId,action) { return commit(socialize(state,personId,action,random)); },
    meet() { return commit(makeFriend(state,random)); },
    gather() { return commit(socializeGroup(state,random)); },
    meetPartner() { return commit(startRomance(state,random)); },
    romance(action) { return commit(doRomance(state,action,random)); },
    joinFaction(faction) { return commit(chooseFaction(state,faction,random)); },
    factionAction(action) { return commit(actInFaction(state,action,random)); },
    train(skill) { return commit(practiceSkill(state,skill,random)); },
    applyPirate(crewId,specialty) { return commit(applyPirate(state,crewId,specialty,random)); },
    workPirate() { return commit(workPirate(state)); },
    mentorTrain(skill) { return commit(practiceWithMentor(state,skill,random)); },
    rest() { return commit(recoverFromTraining(state)); },
    askPromotion() { return commit(askPiratePromotion(state,random)); },
    mission(id) { return commit(doPirateMission(state,id,random)); },
    restart() {
      if (!eraseState(storage)) return false;
      state = createEmptyState();
      return true;
    }
  });
}
