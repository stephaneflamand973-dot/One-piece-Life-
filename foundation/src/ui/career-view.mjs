import { escapeHtml } from './life-view.mjs';
import { CREWS, SPECIALTIES, RANKS, promotionAvailability } from '../core/pirate-career.mjs';
import { SKILLS } from '../core/abilities.mjs';
import {diminishingFactor,scaledBenefit} from '../core/diminishing.mjs';
import { MISSIONS, missionAvailability } from '../core/pirate-missions.mjs';
import { wantedLevel, pursuitChance, hideAvailability } from '../core/pirate-notoriety.mjs';
import { SHIP_COST, RECRUIT_COST, RECRUIT_SPECIALTIES, ORDERS,
  foundAvailability, recruitingAvailability, orderAvailability } from '../core/pirate-command.mjs';
import {SHIP_MODELS,SHIP_PARTS,shipStats,crewCapacity,shipActionAvailability,SHIP_MAINTENANCE_COST,PART_REPAIR_COST,MAX_SHIP_UPGRADE} from '../core/pirate-ships.mjs';
import {ISLANDS,SEA_LABELS,voyageAvailability,exploreAvailability} from '../core/pirate-navigation.mjs';
import {ENCOUNTER_CHOICES,ENCOUNTER_FACTIONS,encounterAvailability} from '../core/pirate-encounters.mjs';
import { CREW_ROLES, TEMPERAMENT_LABELS, CREW_BONUS_COST,
  roleAvailability,crewActionAvailability } from '../core/pirate-crew-life.mjs';
const bar=(value,label)=>`<span class="career-meter" role="meter" aria-label="${escapeHtml(label)}"
  aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
  <span style="width:${value}%"></span></span>`;
export function renderCareer(state){
  const life=state.activeLife;
  if(!life)return '<section class="empty-section"><h1>Carrière</h1><p>Créez votre personnage pour commencer.</p></section>';
  const {career,relationships,abilities}=state.domainData;
  const pirate=career.pirate;
  const blocked=Boolean(state.domainData.story.pending||relationships.pending||
    career.command?.pending||career.command?.encounters.pending||!life.alive);
  const crew=pirate?CREWS[pirate.crewId]:null;
  const command=career.command;
  const founding=foundAvailability(career,life,relationships);
  const role=pirate?SPECIALTIES[pirate.specialty]:null;
  const leader=relationships.people.find(p=>p.id==='world-leader');
  const latest=career.notices.at(-1);
  const promotion=pirate?promotionAvailability(career,relationships,abilities,life):null;
  const missions=career.missions;
  const lastMission=missions.log.at(-1);
  const wanted=career.wanted;
  const hiding=hideAvailability(career,life);
  const latestWorldEvent=wanted.events.at(-1);
  if(!pirate){
    const canApply=life.age>=16&&life.age<=65&&!blocked&&
      ['independent','pirate'].includes(relationships.world.faction);
    const preassigned=relationships.world.faction==='pirate';
    const available=Object.entries(CREWS).filter(([id])=>id!=='own');
    return `<section class="career-page" aria-label="Carrière pirate">
      <div class="career-heading"><h1>Carrière pirate</h1>
        <p>Rejoignez un équipage, choisissez votre spécialité et faites vos preuves.</p></div>
      ${latest?`<p class="career-notice" role="status">${escapeHtml(latest.text)}</p>`:''}
      <div class="career-panel">
        <h2>Offres de recrutement</h2>
        <p class="career-muted">Un équipage peut refuser votre candidature. Les demandes ne sont pas limitées par année.</p>
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
          <button type="submit" class="career-primary" ${!canApply?'disabled':''}>Postuler</button>
        </form>
        ${life.age<16?'<p class="career-hint">Le recrutement commence à 16 ans.</p>':''}
        ${life.age>65?'<p class="career-hint">Le recrutement n’est plus proposé après 65 ans.</p>':''}
        ${blocked?'<p class="career-hint">Résolvez la décision en cours dans Vie.</p>':''}
        ${!['independent','pirate'].includes(relationships.world.faction)?
          '<p class="career-hint">Vous appartenez déjà à une autre faction.</p>':''}
      </div>
      <section class="career-panel captain-intro">
        <h2>Devenir capitaine</h2>
        <p class="career-muted">Conservez votre trésor personnel après une démission.
          Pour acheter un navire et fonder votre équipage, il faut ${SHIP_COST.toLocaleString('fr-FR')} Berrys.</p>
        <div class="captain-balance">Butin disponible :
          <strong>${career.missions.berys.toLocaleString('fr-FR')} Berrys</strong></div>
        <button type="button" data-found-crew class="career-primary"
          ${blocked||!founding.enabled?'disabled':''}
          title="${escapeHtml(founding.reason)}">Fonder mon équipage</button>
      </section>
      <button type="button" data-go-training class="career-secondary">S'entraîner et développer ses capacités</button>
    </section>`;
  }
  return `<section class="career-page" aria-label="Carrière pirate">
    <!-- glp:head -->
    <div class="career-heading"><p class="career-eyebrow">CARRIÈRE ACTUELLE</p>
      <h1>${command?'Capitaine':'Pirate'}</h1>
      <p>${escapeHtml(command?command.name:crew.label)}</p>
      <div class="career-hero-finances" aria-label="Ressources de carrière">
        <span><small>BUTIN</small><strong>${career.missions.berys.toLocaleString('fr-FR')} Berrys</strong></span>
        <span><small>PRIME</small><strong>${wanted.bounty.toLocaleString('fr-FR')} Berrys</strong></span>
      </div>
    </div>
    <!-- glp:notice -->
    ${latest?`<p class="career-notice" role="status">${escapeHtml(latest.text)}</p>`:''}
    <!-- glp:parcours -->
    <div class="career-panel">
      <div class="career-facts">
        <div><span>Poste</span><strong>${escapeHtml(role.label)}</strong></div>
        <div><span>Rang</span><strong>${escapeHtml(RANKS[pirate.rank])}</strong></div>
        <div><span>Ancienneté</span><strong>${pirate.tenure} an${pirate.tenure>1?'s':''}</strong></div>
        <div><span>Capitaine</span><strong>${command?escapeHtml(life.firstName):
          leader?escapeHtml(leader.firstName):'Inconnu'}</strong></div>
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
      <button type="button" data-work-pirate ${blocked||
        !life.alive?'disabled':''}>
        Travailler davantage <span>+ performance</span>
      </button>
      <button type="button" data-go-training ${!life.alive?'disabled':''}>
        S'entraîner <span>${abilities.trainingUsed} séance${abilities.trainingUsed>1?'s':''} cette année · rendement décroissant</span>
      </button>
      <button type="button" class="career-promotion" data-ask-promotion
        ${blocked||!promotion?.enabled?'disabled':''}>
        Demander une promotion
        <span>${promotion?.enabled?'Chance : '+promotion.chance+'%':escapeHtml(promotion?.reason??'')}</span>
      </button>
    </div>
    <!-- glp:encounter -->
    ${command?`
      ${command.encounters.pending?`<section class="career-panel encounter-panel"
         aria-label="Rencontre navale à résoudre" role="group">
        <div class="career-mission-top"><h2>Rencontre en mer</h2>
          <span>${escapeHtml(ENCOUNTER_FACTIONS[command.encounters.pending.faction])}</span></div>
        <p>${escapeHtml(command.encounters.pending.text)}</p>
        <p class="career-hint">Danger estimé : ${command.encounters.pending.threat}/100 ·
          ${escapeHtml(ISLANDS[command.encounters.pending.island].name)}</p>
        <p class="career-hint">Choisissez une réponse pour reprendre votre aventure. Aucun choix ne fait vieillir.</p>
        <div class="captain-order-actions">
          ${Object.entries(ENCOUNTER_CHOICES).map(([id,data])=>{
            const access=encounterAvailability(career,life,abilities,id);
            return `<button type="button" data-encounter-choice="${id}"
              ${state.domainData.story.pending||relationships.pending||command.pending||!access.enabled?'disabled':''}
              title="${escapeHtml(access.reason??data.description)}">
              ${escapeHtml(data.label)}
              <small>${access.enabled?'Chance '+access.chance+' %':escapeHtml(access.reason)}</small>
            </button>`;
          }).join('')}
        </div>
      </section>`:''}
      <!-- glp:navigation -->
      <details class="career-panel navigation-panel">
        <summary><strong>Navigation · ${escapeHtml(ISLANDS[command.navigation.location].name)}</strong>
          · ${escapeHtml(SEA_LABELS[ISLANDS[command.navigation.location].sea])}</summary>
        <div class="sea-chart" aria-label="Carte maritime décorative, position actuelle : ${escapeHtml(ISLANDS[command.navigation.location].name)}">
          <svg class="sea-chart-lines" viewBox="0 0 340 98" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 74 Q48 53 89 71 T174 62 T255 69 T340 44" fill="none" stroke="#5e94a4" stroke-width="2" stroke-dasharray="5 7"/>
            <path d="M0 90 Q68 64 128 88 T255 86 T340 75" fill="none" stroke="#fff6cf" stroke-width="1.2" opacity=".34"/>
          </svg>
          <span class="sea-chart-compass" aria-hidden="true">✧</span>
          <div class="sea-chart-position">
            <small>POSITION ACTUELLE</small>
            <strong>${escapeHtml(ISLANDS[command.navigation.location].name)}</strong>
            <span>${escapeHtml(SEA_LABELS[ISLANDS[command.navigation.location].sea])}</span>
          </div>
        </div>
        <p class="career-hint">${escapeHtml(ISLANDS[command.navigation.location].description)}</p>
        <div class="captain-metrics">
          <div><span>Îles visitées</span><strong>${command.navigation.visited.length}/${Object.keys(ISLANDS).length}</strong></div>
          <div><span>Voyages</span><strong>${command.navigation.journeys}</strong></div>
          <div><span>Explorations</span><strong>${command.navigation.explorations}</strong></div>
          <div><span>Expéditions ici</span><strong>${command.navigation.explored[command.navigation.location]??0}</strong></div>
        </div>
        <button type="button" class="career-primary" data-explore-island
          ${blocked||!exploreAvailability(career,life).enabled?'disabled':''}>
          Explorer ${escapeHtml(ISLANDS[command.navigation.location].name)}
        </button>
        <p class="career-hint">Fouilles et rencontres libres, avec trouvailles moins abondantes à force de parcourir la même île.</p>
        <h3>Destinations accessibles</h3>
        <div class="captain-order-actions navigation-routes">
          ${ISLANDS[command.navigation.location].links.map(id=>{
            const island=ISLANDS[id],access=voyageAvailability(career,life,abilities,id);
            return `<button type="button" data-voyage="${id}"
              ${blocked||!access.enabled?'disabled':''}
              title="${escapeHtml(access.reason??'')}">
              ${escapeHtml(island.name)} ${command.navigation.visited.includes(id)?'· Déjà visitée':'· Inconnue'}
              <small>${escapeHtml(SEA_LABELS[island.sea])} ·
                ${access.enabled?'Mer calme '+access.chance+' % · ':escapeHtml(access.reason??'')}
                ${(access.cost??0).toLocaleString('fr-FR')} Berrys</small>
            </button>`;
          }).join('')}
        </div>
        ${command.encounters.log.length?`<h3>Confrontations</h3>
          <div class="navigation-log">${command.encounters.log.slice(-3).reverse().map(e=>`
            <p class="career-hint"><strong>${e.age} ans</strong> · ${escapeHtml(e.text)}</p>`).join('')}</div>`:''}
        ${command.navigation.log.length?`<h3>Journal de bord</h3>
          <div class="navigation-log">${command.navigation.log.slice(-4).reverse().map(e=>`
            <p class="career-hint"><strong>${e.age} ans</strong> · ${escapeHtml(e.text)}
              ${e.berys?'+ '+e.berys.toLocaleString('fr-FR')+' Berrys':''}</p>`).join('')}</div>`:''}
      </details>
      <!-- glp:navire -->
      <details class="career-panel ship-panel">
        <summary><strong>Mon navire : ${escapeHtml(SHIP_MODELS[command.ship.model].label)}</strong>
          · Coque ${command.hull}/100 · État ${shipStats(command).condition}/100</summary>
        <div class="ship-blueprint" aria-hidden="true">
          <svg viewBox="0 0 300 92" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
            <path d="M65 63H249L224 83H103Z" fill="currentColor" fill-opacity=".15"/>
            <path d="M147 12v52M155 22l62 41h-62V22M141 16 96 63h45V16" stroke-width="1.6"/>
            <path d="M91 61H232M54 88c20-10 36-10 56 0s34 10 54 0 36-10 56 0 35 10 54 0" stroke-width="1.8"/>
            <path d="M148 13l23 6-23 6"/>
          </svg>
          <span>${escapeHtml(SHIP_MODELS[command.ship.model].label)}</span>
        </div>
        <p class="career-muted">${escapeHtml(command.ship.name)} · ${crewCapacity(command)} places · ${command.ship.voyages} traversées</p>
        <div class="captain-metrics">
          <div><span>Vitesse</span><strong>${shipStats(command).speed}/100</strong></div>
          <div><span>Armure</span><strong>${shipStats(command).armor}/100</strong></div>
          <div><span>Puissance</span><strong>${shipStats(command).firepower}/100</strong></div>
          <div><span>Entretien</span><strong>${command.ship.maintenance}/100</strong></div>
        </div>
        <h3>État des pièces</h3>
        <div class="captain-metrics">${Object.entries(SHIP_PARTS).map(([id,label])=>`<div>
          <span>${escapeHtml(label)}</span><strong>${id==='hull'?command.hull:command.ship.parts[id]}/100</strong>
        </div>`).join('')}</div>
        <button type="button" class="career-secondary" data-ship-action="maintain"
          ${blocked||!shipActionAvailability(career,life,'maintain').enabled?'disabled':''}>
          Entretenir (${SHIP_MAINTENANCE_COST.toLocaleString('fr-FR')} Berrys)
        </button>
        <h3>Réparer</h3>
        <div class="captain-order-actions">
          ${Object.entries(SHIP_PARTS).filter(([id])=>id!=='hull').map(([id,label])=>`<button
            type="button" data-ship-action="repair" data-ship-value="${id}"
            ${blocked||!shipActionAvailability(career,life,'repair',id).enabled?'disabled':''}>
            ${escapeHtml(label)} <small>${PART_REPAIR_COST.toLocaleString('fr-FR')} Berrys</small>
          </button>`).join('')}
        </div>
        <p class="career-hint">Pour la coque, utilisez « Réparer le navire » dans Décisions du capitaine.</p>
        <h3>Améliorations permanentes</h3>
        <div class="captain-order-actions">
          ${Object.entries(SHIP_PARTS).map(([id,label])=>{
            const level=command.ship.upgrades[id],access=shipActionAvailability(career,life,'upgrade',id);
            return `<button type="button" data-ship-action="upgrade" data-ship-value="${id}"
              ${blocked||!access.enabled?'disabled':''} title="${escapeHtml(access.reason??'')}">
              ${escapeHtml(label)} ${level}/${MAX_SHIP_UPGRADE}
              <small>${level===MAX_SHIP_UPGRADE?'Maximum':(access.cost??0).toLocaleString('fr-FR')+' Berrys'}</small>
            </button>`;
          }).join('')}
        </div>
        <h3>Changer de navire</h3>
        <p class="career-hint">Reprise à 30 % du prix neuf. Vous conservez l'équipage, mais pas les anciennes améliorations.</p>
        <div class="captain-order-actions">
          ${Object.entries(SHIP_MODELS).map(([id,item])=>{
            const access=shipActionAvailability(career,life,'purchase',id);
            return `<button type="button" data-ship-action="purchase" data-ship-value="${id}"
              ${blocked||!access.enabled?'disabled':''} title="${escapeHtml(access.reason??'')}">
              ${escapeHtml(item.label)} · ${item.capacity} places
              <small>${id===command.ship.model?'Actuel':(access.cost??0).toLocaleString('fr-FR')+' Berrys (reprise)'}</small>
            </button>`;
          }).join('')}
        </div>
      </details>
      <!-- glp:equipage -->
      <section class="career-panel captain-panel" aria-label="Commandement de mon équipage">
        <h2>Mon équipage</h2>
        <div class="captain-metrics">
          <div><span>Moral</span><strong>${command.morale}/100</strong></div>
          <div><span>Navire</span><strong>${command.hull}/100</strong></div>
          <div><span>Membres</span><strong>${command.members.length}/${crewCapacity(command)}</strong></div>
          <div><span>Cohésion</span><strong>${command.cohesion}/100</strong></div>
        </div>
        <p class="career-hint">Votre navire s'use avec les années et les missions.
          Maintenez le moral pour conserver vos compagnons.</p>
        ${command.pending?`<section class="career-panel crew-pending" aria-label="Décision d’équipage" role="group">
          <h3>Votre équipage attend une réponse</h3>
          <p>${escapeHtml(command.pending.text)}</p>
          ${command.pending.kind==='pay'?'<p class="career-hint">Accepter coûte '+CREW_BONUS_COST.toLocaleString('fr-FR')+' Berrys.</p>':''}
          <div class="captain-order-actions">
            <button type="button" data-crew-answer="accept"
              ${state.domainData.story.pending||relationships.pending||
                (command.pending.kind==='pay'&&career.missions.berys<CREW_BONUS_COST)?'disabled':''}>Accepter</button>
            <button type="button" data-crew-answer="refuse"
              ${state.domainData.story.pending||relationships.pending?'disabled':''}>Refuser</button>
          </div>
        </section>`:''}
        <div class="captain-members">
          ${command.members.length?command.members.map(person=>`<details class="captain-member" data-member-card="${escapeHtml(person.id)}">
            <summary class="crew-member-heading">
              <span class="crew-member-avatar" aria-hidden="true">${escapeHtml(person.firstName.slice(0,1).toUpperCase())}</span>
              <span class="crew-member-identity">
                <strong>${escapeHtml(person.firstName+' '+person.lastName)}
                  ${person.role==='second'?' · Bras droit':''}</strong>
                <small>${escapeHtml(CREW_ROLES[person.role])} ·
                  Talent ${person.skill}/100 · Loyauté ${person.loyalty}/100</small>
              </span><span class="crew-member-arrow" aria-hidden="true">⌄</span>
            </summary>
            <div class="crew-member-details">
            <small>Tempérament : ${escapeHtml(TEMPERAMENT_LABELS[person.temperament])}
              · Confiance ${person.bond}/100 · Rivalité ${person.rivalry}/100
              · Ambition ${person.ambition}/100</small>
            <form data-crew-role="${escapeHtml(person.id)}" class="career-form">
              <label for="role-${escapeHtml(person.id)}">Poste attribué</label>
              <select id="role-${escapeHtml(person.id)}" name="role" ${blocked?'disabled':''}>
                ${Object.entries(CREW_ROLES).map(([id,label])=>`<option value="${id}"
                 ${person.role===id?'selected':''}
                 ${id==='second'&&!roleAvailability(career,life,person.id,id).enabled&&person.role!=='second'?'disabled':''}>
                 ${escapeHtml(label)}</option>`).join('')}
              </select>
              <button type="submit" class="career-secondary" ${blocked?'disabled':''}>Attribuer ce poste</button>
            </form>
            <div class="captain-order-actions">
              ${[['talk','Discuter'],['reward','Récompenser ('+CREW_BONUS_COST+' Berrys)'],['dismiss','Renvoyer']].map(([id,label])=>`<button type="button"
                data-crew-member-action="${id}" data-crew-member-id="${escapeHtml(person.id)}"
                ${blocked||!crewActionAvailability(career,life,person.id,id).enabled?'disabled':''}>
                ${label}</button>`).join('')}
            </div>
            </div>
          </details>`).join(''):'<p class="career-muted">Aucun compagnon recruté pour le moment.</p>'}
        </div>
        ${command.events.length?`<p class="career-hint">Dernier événement : ${escapeHtml(command.events.at(-1).text)}</p>`:''}
        <form data-crew-recruit class="career-form">
          <label for="recruit-specialty">Recruter un membre</label>
          <select id="recruit-specialty" name="specialty"
            ${blocked||!recruitingAvailability(career,life).enabled?'disabled':''}>
            ${Object.entries(RECRUIT_SPECIALTIES).map(([id,name])=>
              `<option value="${id}">${escapeHtml(name)}</option>`).join('')}
          </select>
          <button type="submit" class="career-primary"
            ${blocked||!recruitingAvailability(career,life).enabled?'disabled':''}>
            Recruter (${RECRUIT_COST.toLocaleString('fr-FR')} Berrys si accepté)
          </button>
        </form>
        <h3>Décisions du capitaine</h3>
        <p class="career-hint">Les ordres répétables peuvent perdre de leur efficacité au fil de l'année, sans jamais imposer une limite de séances.</p>
        <p class="career-hint">Entraîner, réparer et partager le butin autant de fois que souhaité, même pendant la même année. Les coûts restent réels.</p>
        <div class="captain-order-actions">
          ${Object.entries(ORDERS).map(([id,order])=>{
            const access=orderAvailability(career,life,id);
            return `<button type="button" data-crew-order="${id}"
              ${blocked||!access.enabled?'disabled':''}
              title="${escapeHtml(access.reason)}">
              ${escapeHtml(order.label)}<small>${escapeHtml(order.description)}</small>
            </button>`;
          }).join('')}
        </div>
      </section>`:`
      <section class="career-panel captain-intro">
        <h2>Commandement</h2>
        <p class="career-muted">Fonder votre propre équipage coûte
          ${SHIP_COST.toLocaleString('fr-FR')} Berrys. Votre expérience et vos capacités seront conservées.</p>
        <button type="button" class="career-primary" data-found-crew
          ${blocked||!founding.enabled?'disabled':''}
          title="${escapeHtml(founding.reason)}">Acheter un navire et devenir capitaine</button>
        <button type="button" class="career-secondary captain-resign" data-resign-pirate
          ${blocked?'disabled':''}>Quitter cet équipage</button>
      </section>`}
    <!-- glp:influence -->
    <section class="career-panel wanted-panel" aria-label="Prime et recherche">
      <div class="career-mission-top"><h2>Avis de recherche</h2>
        <span>${escapeHtml(wantedLevel(wanted))}</span></div>
      <div class="wanted-bounty">
        <span>PRIME SUR VOTRE TÊTE</span>
        <strong>${wanted.bounty.toLocaleString('fr-FR')} <small>Berrys</small></strong>
        <p>Cette somme est offerte à vos poursuivants, elle ne fait pas partie de votre fortune.</p>
      </div>
      <div class="wanted-metrics">
        <div><span>Notoriété mondiale</span><strong>${wanted.notoriety}/100</strong></div>
        <div><span>Pression de la Marine</span><strong>${wanted.heat}/100</strong></div>
        <div><span>Risque de poursuite annuel</span><strong>${pursuitChance(wanted)} %</strong></div>
      </div>
      ${latestWorldEvent?`<p class="career-hint wanted-last">${escapeHtml(latestWorldEvent.text)}</p>`:''}
      <button type="button" class="career-secondary wanted-hide" data-hide-pirate
        ${blocked||!hiding.enabled?'disabled':''} title="${escapeHtml(hiding.reason)}">
        Se faire discret
        <span>Réduire la pression (-22) · Performance -2</span>
      </button>
    </section>
    <!-- glp:missions -->
    <section class="career-panel pirate-mission-panel" aria-label="Missions pirates">
      <div class="career-mission-top">
        <h2>Missions pirates</h2><span>${missions.used} cette année</span>
      </div>
      <p class="career-hint">Missions répétables : ${Math.round(diminishingFactor(missions.used)*100)} % de rendement potentiel pour la prochaine mission. Le compteur revient à zéro avec + Âge.</p>
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
              <small>Risque ${escapeHtml(mission.risk)} · Jusqu'à ${scaledBenefit(mission.reward,missions.used).toLocaleString('fr-FR')} Berrys actuellement</small></div>
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
    <!-- glp:footer -->
    <p class="career-hint">Les compétences appartiennent au personnage. Les missions enrichissent l'année en cours, sans faire avancer l'âge.</p>
  </section>`;
}
