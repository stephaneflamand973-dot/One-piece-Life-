import { SKILLS, MAX_TRAININGS, trainingAvailability, talentLabel } from '../core/abilities.mjs';
import {diminishingFactor} from '../core/diminishing.mjs';
import { worldActionAvailability } from '../core/world-relations.mjs';
import { escapeHtml } from './life-view.mjs';
export function renderActivities(state){
  const life=state.activeLife;
  if(!life)return '<section class="empty-section"><h1>Activités</h1><p>Créez une vie pour développer vos capacités.</p></section>';
  const abilities=state.domainData.abilities;
  const blocked=Boolean(state.domainData.story.pending||
    state.domainData.relationships.pending||!life.alive);
  const last=abilities.log.at(-1);
  const families=[...new Set(Object.values(SKILLS).map(skill=>skill.family))];
  const mentor=state.domainData.relationships.people.find(p=>p.role==='mentor'&&!p.deceased);
  const world=worldActionAvailability(state.domainData.relationships,'train',life.age);
  const canMentor=Boolean(mentor&&world.enabled&&!blocked);
  const injury=abilities.injury;
  const injuryName=injury.level===2?'Blessure sérieuse':injury.level===1?'Blessure légère':null;
  return `<section class="training-page" aria-label="Entraînement et capacités">
    <div class="career-heading">
      <p class="premium-eyebrow">DÉVELOPPEMENT DU PERSONNAGE</p>
      <h1>Entraînement</h1>
      <p>Développez vos capacités, même avant de commencer votre carrière.</p>
      <div class="training-hero-counters" aria-label="État de l'entraînement">
        <span><strong>${abilities.trainingUsed}</strong><small>Séances utilisées</small></span>
        <span><strong>${abilities.fatigue}/100</strong><small>Fatigue</small></span>
      </div>
    </div>
    <div class="training-summary"><span>Séances : <strong>${abilities.trainingUsed}</strong></span>
      <span>Fatigue : <strong>${abilities.fatigue}/100</strong></span></div>
    ${injuryName?`<p class="training-injury" role="status">${injuryName} · récupération prévue à ${injury.recoverAtAge} ans.</p>`:''}
    <button type="button" class="training-rest" data-rest
      ${blocked?'disabled':''}>Se reposer
      <small>Récupération décroissante au fil des repos dans l’année</small>
    </button>
    ${mentor?`<p class="career-hint">Mentor disponible : ${escapeHtml(mentor.firstName)}
      (confiance ${mentor.trust}/100). Une séance encadrée utilise aussi une action sociale.</p>`:''}
    ${last?`<p class="career-notice" role="status">${escapeHtml(SKILLS[last.skill].label)} :
      +${last.gain} points (${last.after}/100) à ${last.age} ans
      ${last.mentor?' · Mentor':''}${last.injured?' · Blessure pendant la séance':''}.</p>`:''}
    ${families.map(family=>`<section class="career-panel training-group"><h2>${escapeHtml(family)}</h2>
      <div class="training-list">${Object.entries(SKILLS)
        .filter(([,skill])=>skill.family===family).map(([id,skill])=>{
          const access=trainingAvailability(abilities,life,id);
          const disabled=blocked||!access.enabled;
          return `<div class="training-skill">
            <div class="training-skill-info"><span>${escapeHtml(skill.label)}
              <small>Talent : ${talentLabel(abilities.talents[id])}</small></span>
              <strong>${abilities.skills[id]}/100</strong></div>
            <span class="career-meter" role="meter" aria-label="${escapeHtml(skill.label)}"
              aria-valuemin="0" aria-valuemax="100" aria-valuenow="${abilities.skills[id]}">
              <span style="width:${abilities.skills[id]}%"></span></span>
            <div class="training-skill-actions">
              <button type="button" data-train="${id}" ${disabled?'disabled':''}
                title="${escapeHtml(disabled?(blocked?'Résolvez la décision en cours.':access.reason):'Entraîner cette capacité')}">+ Entraîner</button>
              ${mentor?`<button type="button" data-mentor-train="${id}"
                ${disabled||!canMentor?'disabled':''}
                title="Séance encadrée, consomme une action sociale">Avec mentor</button>`:''}
            </div>
          </div>`;
        }).join('')}</div></section>`).join('')}
    <p class="career-hint">Entraînements et repos sans limite annuelle. Rendement estimé : ${Math.round(diminishingFactor(abilities.trainingUsed)*100)} %. La fatigue, le talent et la maîtrise continuent d'influencer chaque séance.</p>
  </section>`;
}
