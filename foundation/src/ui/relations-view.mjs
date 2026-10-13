import { escapeHtml } from './life-view.mjs';
import {
  ACTIONS, MAX_ACTIONS_PER_YEAR, MAX_FRIENDS, roleLabel
} from '../core/relationships.mjs';
import { availability, TRAIT_LABELS } from '../core/personality.mjs';

const degree=bond=>bond>=80?'Très proche':bond>=60?'Bon lien':bond>=35?'Lien fragile':'Relation distante';
const labels={sociability:'Sociable',empathy:'Empathique',pride:'Fier',
  temper:'Impulsif',loyalty:'Loyal'};
function card(person,age,selected){
  const displayAge=age+person.ageOffset;
  const active=person.id===selected;
  return `<button type="button" class="relation-card ${active?'is-selected':''}"
    data-person="${escapeHtml(person.id)}" aria-pressed="${active}">
    <span class="relation-avatar" aria-hidden="true">${escapeHtml(person.firstName.slice(0,1))}</span>
    <span class="relation-info">
      <strong>${escapeHtml(person.firstName)} ${escapeHtml(person.lastName)}</strong>
      <small>${roleLabel(person.role)} · ${person.deceased?'Décédé(e)':displayAge+' ans'}</small>
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
  const why=p.deceased?'Cette personne est décédée.':
    blocked?'Terminez d’abord la décision en cours.':
    !state.activeLife.alive?'Cette vie est terminée.':
    rel.actionsUsed>=MAX_ACTIONS_PER_YEAR?'Vos trois interactions de l’année ont été utilisées.':
    p.lastActionAge===age?'Vous avez déjà interagi avec cette personne cette année.':'';
  const traits=Object.entries(p.traits).sort((a,b)=>b[1]-a[1]).slice(0,2);
  const metrics=[['Confiance',p.trust],['Respect',p.respect],['Rivalité',p.rivalry]];
  return `<section class="relation-detail" aria-label="Interactions avec ${escapeHtml(p.firstName)}">
    <h3>${escapeHtml(p.firstName)} <span>${degree(p.bond)}</span></h3>
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
  const family=rel.people.filter(p=>p.role!=='friend');
  const friends=rel.people.filter(p=>p.role==='friend');
  const blocked=Boolean(state.domainData.story.pending);
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
    ${friends.length?`<div class="relation-list">${friends.map(p=>card(p,age,selectedId)+(p.id===selectedId?detail(p,state,blocked):'')).join('')}</div>`:
      `<p class="relation-empty">Vous n'avez pas encore d'amis.</p>`}
    <button type="button" class="relation-meet" data-meet ${canMeet?'':'disabled'}>
      Faire une rencontre <span aria-hidden="true">+</span>
    </button>
    ${why?`<p class="relation-hint">${escapeHtml(why)}</p>`:''}
    ${rel.records.length?`<div class="relation-activity"><h2>Interactions récentes</h2>
      ${rel.records.slice(-3).reverse().map(item=>`<p><strong>${item.age} ans</strong> · ${escapeHtml(item.text)}</p>`).join('')}
      </div>`:''}
  </section>`;
}
