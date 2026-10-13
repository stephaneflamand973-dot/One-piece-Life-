import { escapeHtml } from './life-view.mjs';
import { CREWS, SPECIALTIES, RANKS, promotionAvailability } from '../core/pirate-career.mjs';
import { SKILLS, MAX_TRAININGS } from '../core/abilities.mjs';
import { MISSIONS, MAX_MISSIONS, missionAvailability } from '../core/pirate-missions.mjs';
const bar=(value,label)=>`<span class="career-meter" role="meter" aria-label="${escapeHtml(label)}"
  aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
  <span style="width:${value}%"></span></span>`;
export function renderCareer(state){
  const life=state.activeLife;
  if(!life)return '<section class="empty-section"><h1>Carrière</h1><p>Créez votre personnage pour commencer.</p></section>';
  const {career,relationships,abilities}=state.domainData;
  const pirate=career.pirate;
  const blocked=Boolean(state.domainData.story.pending||relationships.pending||!life.alive);
  const crew=pirate?CREWS[pirate.crewId]:null;
  const role=pirate?SPECIALTIES[pirate.specialty]:null;
  const leader=relationships.people.find(p=>p.id==='world-leader');
  const latest=career.notices.at(-1);
  const promotion=pirate?promotionAvailability(career,relationships,abilities,life):null;
  const missions=career.missions;
  const lastMission=missions.log.at(-1);
  if(!pirate){
    const canApply=life.age>=16&&life.age<=65&&!blocked&&
      ['independent','pirate'].includes(relationships.world.faction);
    const preassigned=relationships.world.faction==='pirate';
    const available=Object.entries(CREWS).filter(([id,c])=>
      !preassigned||(relationships.world.unit??CREWS.alizes.label)===c.label);
    return `<section class="career-page" aria-label="Carrière pirate">
      <div class="career-heading"><h1>Carrière pirate</h1>
        <p>Rejoignez un équipage, choisissez votre spécialité et faites vos preuves.</p></div>
      ${latest?`<p class="career-notice" role="status">${escapeHtml(latest.text)}</p>`:''}
      <div class="career-panel">
        <h2>Offres de recrutement</h2>
        <p class="career-muted">Un équipage peut refuser votre candidature. Une seule demande par année.</p>
        <form data-career-apply class="career-form">
          <label for="crew-offer">Équipage</label>
          <select id="crew-offer" name="crew" ${!canApply?'disabled':''}>
            ${available.map(([id,item])=>`<option value="${id}">${escapeHtml(item.label)}</option>`).join('')}
          </select>
          <label for="pirate-job">Spécialité</label>
          <select id="pirate-job" name="specialty" ${!canApply?'disabled':''}>
            ${Object.entries(SPECIALTIES).map(([id,item])=>`<option value="${id}">
              ${escapeHtml(item.label)} · ${escapeHtml(SKILLS[item.skill].label)} ${item.min?item.min+' min.':''}
            </option>`).join('')}
          </select>
          <button type="submit" class="career-primary" ${!canApply||career.appliedAtAge===life.age?'disabled':''}>Postuler</button>
        </form>
        ${life.age<16?'<p class="career-hint">Le recrutement commence à 16 ans.</p>':''}
        ${life.age>65?'<p class="career-hint">Le recrutement n’est plus proposé après 65 ans.</p>':''}
        ${blocked?'<p class="career-hint">Résolvez la décision en cours dans Vie.</p>':''}
        ${!['independent','pirate'].includes(relationships.world.faction)?
          '<p class="career-hint">Vous appartenez déjà à une autre faction.</p>':''}
      </div>
      <button type="button" data-go-training class="career-secondary">S'entraîner et développer ses capacités</button>
    </section>`;
  }
  return `<section class="career-page" aria-label="Carrière pirate">
    <div class="career-heading"><p class="career-eyebrow">CARRIÈRE ACTUELLE</p>
      <h1>Pirate</h1><p>${escapeHtml(crew.label)}</p></div>
    ${latest?`<p class="career-notice" role="status">${escapeHtml(latest.text)}</p>`:''}
    <div class="career-panel">
      <div class="career-facts">
        <div><span>Poste</span><strong>${escapeHtml(role.label)}</strong></div>
        <div><span>Rang</span><strong>${escapeHtml(RANKS[pirate.rank])}</strong></div>
        <div><span>Ancienneté</span><strong>${pirate.tenure} an${pirate.tenure>1?'s':''}</strong></div>
        <div><span>Capitaine</span><strong>${leader?escapeHtml(leader.firstName):'Inconnu'}</strong></div>
        <div><span>Fatigue</span><strong>${abilities.fatigue}/100</strong></div>
        <div><span>État</span><strong>${abilities.injury.level===2?'Blessure sérieuse':
          abilities.injury.level===1?'Blessure légère':'Disponible'}</strong></div>
      </div>
      <div class="career-progress"><div class="career-progress-head"><span>Performance professionnelle</span>
        <strong>${pirate.performance}/100</strong></div>
        ${bar(pirate.performance,'Performance professionnelle')}</div>
      <div class="career-progress"><div class="career-progress-head"><span>${escapeHtml(SKILLS[role.skill].label)}</span>
        <strong>${abilities.skills[role.skill]}/100</strong></div>
        ${bar(abilities.skills[role.skill],SKILLS[role.skill].label)}</div>
    </div>
    <div class="career-buttons">
      <button type="button" data-work-pirate ${blocked||pirate.workUsed>=1||
        abilities.injury.level===2||abilities.fatigue>=90?'disabled':''}>
        Travailler davantage <span>+ performance</span>
      </button>
      <button type="button" data-go-training ${!life.alive?'disabled':''}>
        S'entraîner <span>${MAX_TRAININGS-abilities.trainingUsed} séance${MAX_TRAININGS-abilities.trainingUsed>1?'s':''} disponible${MAX_TRAININGS-abilities.trainingUsed>1?'s':''}</span>
      </button>
      <button type="button" class="career-promotion" data-ask-promotion
        ${blocked||!promotion?.enabled?'disabled':''}>
        Demander une promotion
        <span>${promotion?.enabled?'Chance : '+promotion.chance+'%':escapeHtml(promotion?.reason??'')}</span>
      </button>
    </div>
    <section class="career-panel pirate-mission-panel" aria-label="Missions pirates">
      <div class="career-mission-top">
        <h2>Missions pirates</h2><span>${missions.used}/${MAX_MISSIONS} cette année</span>
      </div>
      <div class="career-mission-wallet">
        <div><small>Butin personnel cumulé</small><strong>${missions.berys.toLocaleString('fr-FR')} Berrys</strong></div>
        <div><small>Réussies</small><strong>${missions.completed}</strong></div>
        <div><small>Partielles</small><strong>${missions.partial}</strong></div>
        <div><small>Échecs</small><strong>${missions.failed}</strong></div>
      </div>
      ${lastMission?`<p class="career-mission-result" role="status">
        <strong>${escapeHtml(lastMission.text)}</strong>
        <span>${lastMission.reward?'+ '+lastMission.reward.toLocaleString('fr-FR')+' Berrys':'Aucun butin'} ·
        ${lastMission.performanceDelta>=0?'+':''}${lastMission.performanceDelta} performance
        ${lastMission.injury?' · Blessure':''}</span></p>`:''}
      <div class="pirate-missions">
        ${Object.entries(MISSIONS).map(([id,mission])=>{
          const access=missionAvailability(career,abilities,relationships,life,id);
          const disabled=blocked||!access.enabled;
          return `<div class="pirate-mission">
            <div class="pirate-mission-description"><strong>${escapeHtml(mission.label)}</strong>
              <small>Risque ${escapeHtml(mission.risk)} · Jusqu'à ${mission.reward.toLocaleString('fr-FR')} Berrys</small></div>
            <button type="button" data-pirate-mission="${id}" ${disabled?'disabled':''}
              title="${escapeHtml(disabled?(blocked?'Résolvez votre décision en cours.':access.reason):'Lancer la mission')}">
              ${access.enabled?'Chance '+access.chance+' %':'Indisponible'}
            </button>
          </div>`;
        }).join('')}
      </div>
      <p class="career-hint">Les résultats dépendent de vos capacités, de votre équipe et de votre état.
        Les missions ratées peuvent vous blesser ou diminuer votre réputation. La prime n'est pas votre argent.</p>
    </section>
    <p class="career-hint">Les compétences appartiennent au personnage. Les missions enrichissent l'année en cours, sans faire avancer l'âge.</p>
  </section>`;
}
