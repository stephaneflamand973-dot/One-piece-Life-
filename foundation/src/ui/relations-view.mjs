import { escapeHtml } from './life-view.mjs';
import {
  ACTIONS, MAX_ACTIONS_PER_YEAR, MAX_FRIENDS, roleLabel
} from '../core/relationships.mjs';
import { availability, TRAIT_LABELS } from '../core/personality.mjs';
import { trainingAvailability } from '../core/abilities.mjs';
import { missionAvailability } from '../core/pirate-missions.mjs';
import { activePartner, romanceAvailability, MAX_PARTNERS, MAX_CHILDREN } from '../core/romance.mjs';
import { FACTIONS, WORLD_ROLES, WORLD_ACTIONS,
  worldActionAvailability,worldRoleLabel } from '../core/world-relations.mjs';

const degree=bond=>bond>=80?'Très proche':bond>=60?'Bon lien':bond>=35?'Lien fragile':'Relation distante';
const labels={sociability:'Sociable',empathy:'Empathique',pride:'Fier',
  temper:'Impulsif',loyalty:'Loyal'};
const romanceName=p=>({
  dating:'En couple',married:'Marié(e)',separated:'Séparé(e)',widowed:'Partenaire décédé(e)'
})[p.status]??'';
function card(person,age,selected,close=false,oldCaptain=false){
  const displayAge=age+person.ageOffset;
  const active=person.id===selected;
  return `<button type="button" class="relation-card ${active?'is-selected':''}"
    data-person="${escapeHtml(person.id)}" aria-pressed="${active}">
    <span class="relation-avatar" aria-hidden="true">${escapeHtml(person.firstName.slice(0,1))}</span>
    <span class="relation-info">
      <strong>${escapeHtml(person.firstName)} ${escapeHtml(person.lastName)}</strong>
      <small>${roleLabel(person.role)}${person.role==='partner'?' · '+romanceName(person):''}${WORLD_ROLES.includes(person.role)?' · '+(person.role==='leader'&&oldCaptain?'Ancien capitaine':worldRoleLabel(person.role,person.worldFaction)):''} · ${person.deceased?'Décédé(e)':displayAge+' ans'}</small>
      ${close?'<small class="friend-memory">Amitié marquante</small>':''}
      <span class="relation-progress" role="meter" aria-label="Lien avec ${escapeHtml(person.firstName)}"
        aria-valuemin="0" aria-valuemax="100" aria-valuenow="${person.bond}">
        <span style="width:${person.bond}%"></span>
      </span>
    </span>
    <span class="relation-score">${person.bond}%</span>
  </button>`;
}
function detail(p,state,blocked){
  const age=state.activeLife.age;
  const rel=state.domainData.relationships;
  const unavailable=blocked||!state.activeLife.alive;
  const coParent=p.role==='child'?rel.people.find(person=>person.id===p.parentId):null;
  const why=p.deceased?'Cette personne est décédée.':
    blocked?'Terminez d’abord la décision en cours.':
    !state.activeLife.alive?'Cette vie est terminée.':
    rel.actionsUsed>=MAX_ACTIONS_PER_YEAR?'Vos trois interactions de l’année ont été utilisées.':
    p.lastActionAge===age?'Vous avez déjà interagi avec cette personne cette année.':'';
  const traits=Object.entries(p.traits).sort((a,b)=>b[1]-a[1]).slice(0,2);
  const metrics=[['Confiance',p.trust],['Respect',p.respect],['Rivalité',p.rivalry]];
  return `<section class="relation-detail" aria-label="Interactions avec ${escapeHtml(p.firstName)}">
    <h3>${escapeHtml(p.firstName)} <span>${degree(p.bond)}</span></h3>
    ${coParent?`<p class="relation-hint">Autre parent : ${escapeHtml(coParent.firstName)} ${escapeHtml(coParent.lastName)}</p>`:''}
    <div class="relation-tags">${traits.map(([key,value])=>
      `<span title="${escapeHtml(TRAIT_LABELS[key])} : ${value}/100">${labels[key]}</span>`).join('')}</div>
    <div class="relation-metrics">${metrics.map(([label,value])=>
      `<div><span>${label}</span><strong>${value}/100</strong></div>`).join('')}</div>
    <h4>Interagir</h4>
    <div class="relation-actions">${Object.entries(ACTIONS).map(([action,item])=>{
      const access=availability(rel,p,action,age);
      const disabled=unavailable||!access.enabled;
      return `<button type="button" data-interact="${action}" data-person-id="${escapeHtml(p.id)}"
        ${disabled?'disabled':''}
        title="${escapeHtml(disabled&&unavailable?'Décision ou vie en cours non disponible':access.reason??'')}"
        aria-label="${escapeHtml(item.label)}${!disabled?' (chance '+access.chance+' pour cent)':''}">
        <span>${escapeHtml(item.label)}</span>
        <small>${disabled?'Indisponible':(action==='argue'?'Risque ':'Chance ')+access.chance+'%'}</small>
      </button>`;
    }).join('')}</div>
    ${why?`<p class="relation-hint">${escapeHtml(why)}</p>`:''}
  </section>`;
}
export function renderRelationships(state,{selectedId=null}={}){
  if(!state.activeLife)return `<section class="empty-section">
    <h1>Relations</h1><p>Commencez une vie pour découvrir votre famille.</p></section>`;
  const age=state.activeLife.age;
  const rel=state.domainData.relationships;
  const family=rel.people.filter(p=>['mother','father','sibling'].includes(p.role));
  const world=rel.world;
  const worldPeople=rel.people.filter(p=>WORLD_ROLES.includes(p.role));
  const canJoin=age>=16&&age<=65&&state.activeLife.alive&&
    !state.domainData.story.pending&&!rel.pending&&
    rel.actionsUsed<MAX_ACTIONS_PER_YEAR&&world.faction==='independent';
  const partners=rel.people.filter(p=>p.role==='partner');
  const children=rel.people.filter(p=>p.role==='child');
  const partner=activePartner(rel);
  const canRomance=age>=18&&state.activeLife.alive&&!state.domainData.story.pending&&
    !rel.pending&&rel.actionsUsed<MAX_ACTIONS_PER_YEAR;
  const friends=rel.people.filter(p=>p.role==='friend');
  const blocked=Boolean(state.domainData.story.pending || rel.pending);
  const marked=new Set(rel.milestones.map(entry=>entry.personId));
  const group=rel.groups[0];
  const groupFriends=group?friends.filter(person=>group.members.includes(person.id)&&!person.deceased):[];
  const canGather=Boolean(group)&&age>=8&&state.activeLife.alive&&!blocked&&
    groupFriends.length>=2&&rel.actionsUsed<MAX_ACTIONS_PER_YEAR&&
    group.lastGatherAge!==age;
  const canMeet=age>=6&&state.activeLife.alive&&!blocked&&
    friends.length<MAX_FRIENDS&&rel.actionsUsed<MAX_ACTIONS_PER_YEAR;
  const why=age<6?'Disponible à partir de 6 ans.':
    blocked?'Terminez votre décision sur l’écran Vie.':
    !state.activeLife.alive?'Cette vie est terminée.':
    friends.length>=MAX_FRIENDS?'Votre cercle de quatre amis est complet.':
    rel.actionsUsed>=MAX_ACTIONS_PER_YEAR?'Interactions épuisées pour cette année.':'';
  return `<section class="relationships-page" aria-label="Famille et relations">
    <div class="relations-heading"><h1>Relations</h1>
      <p>${age} an${age>1?'s':''} · ${MAX_ACTIONS_PER_YEAR-rel.actionsUsed} action${MAX_ACTIONS_PER_YEAR-rel.actionsUsed>1?'s':''} disponible${MAX_ACTIONS_PER_YEAR-rel.actionsUsed>1?'s':''} cette année</p></div>
    ${rel.recent?`<p class="relation-news" role="status">${escapeHtml(rel.recent)}</p>`:''}
    <div class="relation-section-title"><h2>Famille</h2><span>${family.length}</span></div>
    <div class="relation-list">${family.map(p=>card(p,age,selectedId)+(p.id===selectedId?detail(p,state,blocked):'')).join('')}</div>
    <div class="relation-section-title"><h2>Amis</h2><span>${friends.length}</span></div>
    ${friends.length?`<div class="relation-list">${friends.map(p=>card(p,age,selectedId,marked.has(p.id))+(p.id===selectedId?detail(p,state,blocked):'')).join('')}</div>`:
      `<p class="relation-empty">Vous n'avez pas encore d'amis.</p>`}
    <button type="button" class="relation-meet" data-meet ${canMeet?'':'disabled'}>
      Faire une rencontre <span aria-hidden="true">+</span>
    </button>
    ${why?`<p class="relation-hint">${escapeHtml(why)}</p>`:''}
    ${group?`<section class="social-circle" aria-label="Groupe social">
      <div class="relation-section-title"><h2>Groupe social</h2><span>${group.members.length} amis</span></div>
      <div class="social-circle-body">
        <strong>${escapeHtml(group.name)}</strong>
        <span>Cohésion : ${group.cohesion}/100 · ${groupFriends.length} membre${groupFriends.length>1?'s':''} disponible${groupFriends.length>1?'s':''}</span>
        <div class="relation-progress" role="meter" aria-label="Cohésion du groupe"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="${group.cohesion}">
          <span style="width:${group.cohesion}%"></span>
        </div>
        <button type="button" data-gather ${canGather?'':'disabled'}>Organiser une sortie du groupe</button>
        ${canGather?'':`<small>${blocked?'Terminez votre décision sur Vie.':
          age<8?'Disponible à partir de 8 ans.':
          group.lastGatherAge===age?'Vous avez déjà réuni votre groupe cette année.':
          groupFriends.length<2?'Au moins deux amis doivent être disponibles.':
          'Plus d’actions disponibles cette année.'}</small>`}
      </div>
    </section>`:''}
    <section class="romance-section" aria-label="Amour et générations">
      <div class="relation-section-title"><h2>Amour et couple</h2><span>${partner?'En couple':'Célibataire'}</span></div>
      ${partners.length?`<div class="relation-list">${partners.map(p=>card(p,age,selectedId)+
        (p.id===selectedId?detail(p,state,blocked):'')).join('')}</div>`:
        '<p class="relation-empty">Aucune relation amoureuse pour le moment.</p>'}
      <button type="button" class="relation-meet" data-romance-meet
        ${canRomance&&age<=75&&!partner&&partners.length<MAX_PARTNERS?'':'disabled'}>
        Faire une rencontre amoureuse <span aria-hidden="true">+</span>
      </button>
      ${partner?`<div class="romance-actions">
        ${[['date','Organiser un rendez-vous'],['marry','Demander en mariage'],
          ['child','Avoir un enfant'],['separate','Se séparer']].map(([action,label])=>{
          const info=romanceAvailability(rel,action,age);
          const disabled=!canRomance||!info.enabled;
          return `<button type="button" data-romance="${action}"
            ${disabled?'disabled':''} title="${escapeHtml(disabled&&!canRomance?
              'Terminez la décision ou attendez l’année suivante.':info.reason)}">${label}</button>`;
        }).join('')}
      </div>`:''}
      ${age<18?'<p class="relation-hint">Les rencontres amoureuses se débloquent à 18 ans.</p>':''}
      ${age>75&&!partner?'<p class="relation-hint">Les nouvelles rencontres ne sont plus proposées après 75 ans.</p>':''}
      ${!partner&&partners.length>=MAX_PARTNERS?
        '<p class="relation-hint">Vous avez atteint la limite de quatre relations successives.</p>':''}
      <div class="relation-section-title"><h2>Mes enfants</h2><span>${children.length}/${MAX_CHILDREN}</span></div>
      ${children.length?`<div class="relation-list">${children.map(p=>card(p,age,selectedId)+
        (p.id===selectedId?detail(p,state,blocked):'')).join('')}</div>`:
        '<p class="relation-empty">Vous n’avez pas encore d’enfants.</p>'}
    </section>
    <section class="world-section" aria-label="Factions de One Piece">
      <div class="relation-section-title"><h2>Factions et équipages</h2>
        <span>${world.faction==='independent'?'Sans affiliation':FACTIONS[world.faction].label}</span></div>
      ${world.faction==='independent'?
        `<p class="relation-empty">Pirates, Marine ou Révolutionnaires : votre choix influence votre réputation et vos relations.</p>
          <div class="world-join-actions">
          ${Object.entries(FACTIONS).map(([key,info])=>
            `<button type="button" data-join-faction="${key}" ${canJoin?'':'disabled'}>
              Rejoindre ${escapeHtml(info.label)}
            </button>`).join('')}</div>
          ${age<16?'<p class="relation-hint">Disponible dès 16 ans.</p>':''}`:
        `<div class="world-summary">
          <strong>${escapeHtml(world.unit??FACTIONS[world.faction].unit)}</strong>
          <div class="world-score-grid">
            <span>Réputation <b>${world.reputation}/100</b></span>
            <span>Loyauté <b>${world.loyalty}/100</b></span>
            <span>Influence ${escapeHtml(FACTIONS[world.faction].label)} <b>${world.standings[world.faction]}/100</b></span>
          </div>
          <div class="world-standings">${Object.entries(FACTIONS).map(([id,info])=>
            `<span>${escapeHtml(info.label)} : ${world.standings[id]}/100</span>`).join('')}</div>
        </div>
        <div class="relation-list">${worldPeople.map(p=>card(p,age,selectedId,false,Boolean(state.domainData.career.command))+
          (selectedId===p.id?detail(p,state,blocked):'')).join('')}</div>
        <div class="relation-actions world-actions">${Object.entries(WORLD_ACTIONS).map(([id,action])=>{
          const enabled=id==='mission'&&state.domainData.career.pirate?
            missionAvailability(state.domainData.career,state.domainData.abilities,
              rel,state.activeLife,'escort'):worldActionAvailability(rel,id,age);
          const skill=state.domainData.career.pirate?.specialty;
          const primary=skill?({combattant:'technique',sabreur:'armes',navigateur:'navigation',
            tireur:'precision',medecin:'medecine',cuisinier:'cuisine',charpentier:'charpenterie'}[skill]):'technique';
          const mentorReady=id!=='train'||trainingAvailability(
            state.domainData.abilities,state.activeLife,primary).enabled;
          return `<button type="button" data-world-action="${id}"
            ${!blocked&&state.activeLife.alive&&enabled.enabled&&mentorReady?'':'disabled'}
            title="${escapeHtml(enabled.reason??'')}" aria-label="${escapeHtml(action.label)}">
            <span>${escapeHtml(action.label)}</span>
            <small>${enabled.enabled?'Chance '+enabled.chance+'%':enabled.reason}</small>
          </button>`;
        }).join('')}</div>
        ${world.log.length?`<p class="relation-hint">Dernière activité : ${escapeHtml(world.log.at(-1).text)}</p>`:''}`}
    </section>
    ${rel.records.length?`<div class="relation-activity"><h2>Interactions récentes</h2>
      ${rel.records.slice(-3).reverse().map(item=>`<p><strong>${item.age} ans</strong> · ${escapeHtml(item.text)}</p>`).join('')}
      </div>`:''}
  </section>`;
}
