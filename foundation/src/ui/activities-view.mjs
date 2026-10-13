import { SKILLS, MAX_TRAININGS, trainingAvailability } from '../core/abilities.mjs';
import { escapeHtml } from './life-view.mjs';
export function renderActivities(state){
  const life=state.activeLife;
  if(!life)return '<section class="empty-section"><h1>Activités</h1><p>Créez une vie pour développer vos capacités.</p></section>';
  const abilities=state.domainData.abilities;
  const blocked=Boolean(state.domainData.story.pending||
    state.domainData.relationships.pending||!life.alive);
  const last=abilities.log.at(-1);
  const families=[...new Set(Object.values(SKILLS).map(skill=>skill.family))];
  return `<section class="training-page" aria-label="Entraînement et capacités">
    <div class="career-heading"><h1>Entraînement</h1>
      <p>Développez vos capacités, même avant de commencer votre carrière.</p></div>
    <div class="training-summary"><span>Séances : <strong>${abilities.trainingUsed}/${MAX_TRAININGS}</strong></span>
      <span>Fatigue : <strong>${abilities.fatigue}/100</strong></span></div>
    ${last?`<p class="career-notice" role="status">${escapeHtml(SKILLS[last.skill].label)} :
      +${last.gain} points (${last.after}/100) à ${last.age} ans.</p>`:''}
    ${families.map(family=>`<section class="career-panel training-group"><h2>${escapeHtml(family)}</h2>
      <div class="training-list">${Object.entries(SKILLS)
        .filter(([,skill])=>skill.family===family).map(([id,skill])=>{
          const access=trainingAvailability(abilities,life,id);
          const disabled=blocked||!access.enabled;
          return `<div class="training-skill">
            <div class="training-skill-info"><span>${escapeHtml(skill.label)}</span>
              <strong>${abilities.skills[id]}/100</strong></div>
            <span class="career-meter" role="meter" aria-label="${escapeHtml(skill.label)}"
              aria-valuemin="0" aria-valuemax="100" aria-valuenow="${abilities.skills[id]}">
              <span style="width:${abilities.skills[id]}%"></span></span>
            <button type="button" data-train="${id}" ${disabled?'disabled':''}
              title="${escapeHtml(disabled?(blocked?'Résolvez la décision en cours.':access.reason):'Entraîner cette capacité')}">+ Entraîner</button>
          </div>`;
        }).join('')}</div></section>`).join('')}
    <p class="career-hint">Trois séances par année. Le talent influe sur la progression. La fatigue et les niveaux élevés la ralentissent.</p>
  </section>`;
}
