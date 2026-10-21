/** Grand Line Premium : composition des écrans carrière. Moteur et sauvegardes inchangés. */
import {renderCareer} from './career-view.mjs';
import {escapeHtml} from './life-view.mjs';
import {CREWS,RANKS,SPECIALTIES} from '../core/pirate-career.mjs';
import {ISLANDS,SEA_LABELS} from '../core/pirate-navigation.mjs';
import {ENCOUNTER_CHOICES,ENCOUNTER_FACTIONS,encounterAvailability} from '../core/pirate-encounters.mjs';
import {CREW_BONUS_COST} from '../core/pirate-crew-life.mjs';
import {ORDERS,orderAvailability,SHARE_COST,REPAIR_COST} from '../core/pirate-command.mjs';
import {SHIP_MAINTENANCE_COST} from '../core/pirate-ships.mjs';

export const CAREER_PAGES=Object.freeze({
 parcours:{label:'Mon parcours',icon:'award',description:'Poste, rang et évolution'},
 equipage:{label:'Mon équipage',icon:'users',description:'Compagnons et commandement'},
 aventures:{label:'Aventures',icon:'compass',description:'Missions et exploration'},
 navire:{label:'Mon navire',icon:'ship',description:'Entretien et améliorations'},
 finances:{label:'Finances',icon:'coins',description:'Butin et dépenses'},
 influence:{label:'Influence',icon:'flag',description:'Prime et Marine'}
});
const money=n=>n.toLocaleString('fr-FR')+' Berrys';
function fragments(html){
 const entries=[...html.matchAll(/<!-- glp:([a-z]+) -->/g)];
 const parts={};
 entries.forEach((match,i)=>{
  const end=entries[i+1]?.index??html.length;
  parts[match[1]]=html.slice(match.index+match[0].length,end);
 });
 return parts;
}
function routeCard(id,subtitle=''){
 const item=CAREER_PAGES[id];
 return `<button type="button" class="career-dash-card" data-career-page="${id}">
   <span class="career-dash-icon" aria-hidden="true">${{parcours:'◆',equipage:'♟',aventures:'✦',navire:'⚓',finances:'◈',influence:'★'}[id]}</span>
   <span><strong>${item.label}</strong><small>${escapeHtml(subtitle||item.description)}</small></span>
   <span class="career-dash-chevron" aria-hidden="true">›</span>
 </button>`;
}
function subHeader(page,subtitle){
 const item=CAREER_PAGES[page];
 return `<header class="career-section-header">
   <p class="career-eyebrow">GRAND LINE PREMIUM · CARRIÈRE PIRATE</p>
   <h1>${item.label}</h1>
   <p>${escapeHtml(subtitle||item.description)}</p>
 </header>`;
}
function modal(state){
 const {career,abilities,relationships}=state.domainData;
 const cmd=career.command,life=state.activeLife;
 if(!cmd||!life)return '';
 const pending=cmd.encounters.pending;
 const crew=cmd.pending;
 if(!pending&&!crew)return '';
 const conflict=Boolean(state.domainData.story.pending||relationships.pending);
 let heading,eyebrow,description,actions;
 if(pending){
  heading='Rencontre en mer';eyebrow=ENCOUNTER_FACTIONS[pending.faction];
  description=pending.text;
  actions=Object.entries(ENCOUNTER_CHOICES).map(([id,data])=>{
   const access=encounterAvailability(career,life,abilities,id);
   return `<button type="button" data-encounter-choice="${id}"
     ${conflict||!access.enabled?'disabled':''}
     title="${escapeHtml(access.reason??data.description)}">
     <strong>${escapeHtml(data.label)}</strong>
     <small>${access.enabled?'Chance '+access.chance+' %':escapeHtml(access.reason)}</small>
   </button>`;
  }).join('');
 }else{
  heading='Décision de l’équipage';eyebrow='CONSEIL DU CAPITAINE';
  description=crew.text;
  actions=`<button type="button" data-crew-answer="accept"
    ${conflict||(crew.kind==='pay'&&career.missions.berys<CREW_BONUS_COST)?'disabled':''}>
    <strong>Accepter</strong><small>${crew.kind==='pay'?money(CREW_BONUS_COST):'Répondre favorablement'}</small>
   </button>
   <button type="button" data-crew-answer="refuse" ${conflict?'disabled':''}>
    <strong>Refuser</strong><small>Assumer les conséquences</small>
   </button>`;
 }
 return `<div class="career-decision-overlay" data-career-modal>
   <section class="career-decision-dialog" role="dialog" aria-modal="true"
     aria-labelledby="career-decision-title" aria-describedby="career-decision-text" tabindex="-1">
     <div class="career-decision-art" aria-hidden="true">✦</div>
     <p class="career-eyebrow">${escapeHtml(eyebrow)}</p>
     <h2 id="career-decision-title">${escapeHtml(heading)}</h2>
     <p id="career-decision-text">${escapeHtml(description)}</p>
     ${pending?`<p class="career-decision-risk">Menace ${pending.threat}/100 ·
       ${escapeHtml(ISLANDS[pending.island].name)}</p>`:''}
     <div class="career-decision-actions">${actions}</div>
     <p class="career-decision-footnote">Votre partie ne vieillit pas pendant cette décision.</p>
   </section>
 </div>`;
}
function overview(state,parts){
 const {career,abilities}=state.domainData;
 const life=state.activeLife,p=career.pirate,cmd=career.command;
 const role=cmd?'Capitaine':RANKS[p.rank];
 const place=cmd?ISLANDS[cmd.navigation.location].name:'Au sein de '+CREWS[p.crewId].label;
 const notes=parts.notice??'';
 const urgent=cmd?.encounters.pending||cmd?.pending;
 const label=urgent?'Décision en attente':'Situation actuelle';
 return `<section class="career-page career-dashboard" aria-label="Tableau de bord de carrière pirate">
   ${parts.head??''}
   ${notes}
   <div class="career-dash-status">
     <span class="career-dash-status-label">${escapeHtml(RANKS[p.rank])} · ${escapeHtml(SPECIALTIES[p.specialty].label)}</span>
     <div class="career-dash-status-row">
       <span>Performance professionnelle</span><strong>${p.performance}/100</strong>
     </div>
     <span class="career-meter" role="meter" aria-label="Performance professionnelle"
       aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.performance}">
       <span style="width:${p.performance}%"></span>
     </span>
     <p>${escapeHtml(role)} · ${escapeHtml(place)} · ${life.age} ans</p>
   </div>
   ${urgent?`<button type="button" class="career-dash-priority" data-career-resolve>
     <strong>Une décision nécessite votre attention</strong>
     <span>${escapeHtml(urgent.text)} <b>›</b></span>
   </button>`:`<div class="career-dash-calm" role="status"><strong>${label}</strong>
     <span>Aucune décision de carrière en attente.</span></div>`}
   <h2 class="career-dash-title">Actions rapides</h2>
   <div class="career-dash-quick">
     ${routeCard('aventures',cmd?'Missions et routes maritimes':'Missions pirates')}
     ${routeCard(cmd?'equipage':'parcours',cmd?'Gérer vos compagnons':'Progresser et s’entraîner')}
     ${cmd?routeCard('navire','Réparation et entretien'):routeCard('influence','Votre avis de recherche')}
     ${cmd?routeCard('finances','Butin et partage'):routeCard('parcours','Promotion et spécialité')}
   </div>
   <h2 class="career-dash-title">Toute ma carrière</h2>
   <div class="career-dash-grid">
     ${Object.keys(CAREER_PAGES).filter(id=>cmd||!['navire','finances'].includes(id))
       .map(id=>routeCard(id)).join('')}
   </div>
 </section>${modal(state)}`;
}
function unassigned(state,page){
 const life=state.activeLife,career=state.domainData.career;
 if(page==='parcours')return renderCareer(state);
 return `<section class="career-page career-dashboard">
  <header class="career-heading"><p class="career-eyebrow">CARRIÈRE PIRATE</p>
   <h1>Tracer votre route</h1><p>${life.age} ans · Aucune carrière pirate active</p>
   <div class="career-hero-finances"><span><small>BUTIN</small>
    <strong>${money(career.missions.berys)}</strong></span><span><small>PRIME</small>
    <strong>${money(career.wanted.bounty)}</strong></span></div></header>
  <section class="career-panel"><h2>Choisir votre destinée</h2>
   <p class="career-hint">Rejoignez un équipage ou préparez votre propre navire.</p>
   <button type="button" class="career-primary" data-career-page="parcours">Voir les offres de recrutement</button>
   <button type="button" class="career-secondary" data-go-training>S'entraîner</button>
  </section></section>`;
}
function finance(state){
 const {career}=state.domainData,cmd=career.command;
 const mission=career.missions;
 const share=cmd?orderAvailability(career,state.activeLife,'share'):null;
 return `<section class="career-panel career-finances">
  <div class="career-treasury"><small>TRÉSORERIE PERSONNELLE</small>
    <strong>${money(mission.berys)}</strong><span>Solde réel disponible</span></div>
  <div class="career-mission-wallet">
    <div><small>Missions réussies</small><strong>${mission.completed}</strong></div>
    <div><small>Missions partielles</small><strong>${mission.partial}</strong></div>
    <div><small>Échecs</small><strong>${mission.failed}</strong></div>
    <div><small>Prime (non encaissable)</small><strong>${money(career.wanted.bounty)}</strong></div>
  </div>
  <h2>Dépenses possibles</h2>
  ${cmd?`<p class="career-hint">Partage du butin : ${money(SHARE_COST)} ·
    réparation de coque : ${money(REPAIR_COST)} · entretien : ${money(SHIP_MAINTENANCE_COST)}.</p>
    <div class="career-dash-action-row">
     <button type="button" data-crew-order="share" ${share?.enabled?'':'disabled'}
       title="${escapeHtml(share?.reason??'')}">Partager le butin</button>
     <button type="button" data-career-page="navire">Gérer les dépenses du navire</button>
    </div>`:`<p class="career-hint">Les missions rapportent des Berrys. La prime ne représente pas votre fortune.</p>`}
  <p class="career-hint">Ce bilan reprend les données existantes. Aucun historique comptable artificiel n'est créé.</p>
 </section>`;
}
function companions(state){
 const {career,relationships}=state.domainData;
 const p=career.pirate,crew=CREWS[p.crewId];
 // Une relation de faction (mentor, rival...) n'est pas nécessairement un marin recruté.
 // Chez un employeur, seul le capitaine connu est présenté comme contact d'équipage.
 const known=relationships.people.filter(person=>person.role==='leader'&&!person.deceased);
 return `<section class="career-panel">
  <h2>${escapeHtml(crew.label)}</h2>
  <p class="career-hint">Vous servez sous les ordres de votre capitaine.
   Le commandement de l'équipage deviendra accessible si vous fondez votre propre équipage.</p>
  ${known.length?`<div class="captain-members">${known.map(person=>`
    <div class="captain-member"><div class="crew-member-heading">
      <span class="crew-member-avatar" aria-hidden="true">${escapeHtml(person.firstName.slice(0,1))}</span>
      <span class="crew-member-identity"><strong>${escapeHtml(person.firstName+' '+person.lastName)}</strong>
      <small>${person.role==='leader'?'Capitaine':'Relation de faction'}</small></span>
    </div></div>`).join('')}</div>`:''}
  <button type="button" class="career-secondary" data-nav="relationships">Voir mes relations</button>
 </section>`;
}
export function renderCareerDashboard(state,{page=null,adventureTab='missions'}={}){
 const life=state.activeLife,career=state.domainData.career;
 if(!life)return renderCareer(state);
 if(!career.pirate)return unassigned(state,page);
 const sections=fragments(renderCareer(state));
 if(!Object.hasOwn(CAREER_PAGES,page??''))return overview(state,sections);
 const cmd=career.command;
 let content='';
 switch(page){
 case 'parcours':
   content=(sections.parcours??'')+(cmd?'':sections.encounter??'');
   break;
 case 'equipage':
   content=cmd?(sections.equipage??''):companions(state);
   break;
 case 'aventures':
   content=`<div class="career-adventure-tabs" role="group" aria-label="Choisir une aventure">
    <button type="button" data-adventure-tab="missions"
      aria-pressed="${adventureTab!=='exploration'}" class="${adventureTab!=='exploration'?'is-selected':''}">Missions</button>
    <button type="button" data-adventure-tab="exploration"
      aria-pressed="${adventureTab==='exploration'}" class="${adventureTab==='exploration'?'is-selected':''}">Exploration</button>
   </div>`+(adventureTab==='exploration'?(cmd?
     (sections.navigation??'').replace('<details class="career-panel navigation-panel">',
       '<details class="career-panel navigation-panel" open>'):
       '<section class="career-panel"><h2>Exploration</h2><p>Diriger des traversées nécessite votre propre navire.</p></section>'):
     (sections.missions??''));
   break;
 case 'navire':
   content=cmd?(sections.navire??'').replace('<details class="career-panel ship-panel">',
     '<details class="career-panel ship-panel" open>'):
     '<section class="career-panel"><h2>Aucun navire</h2><p>Devenez capitaine pour gérer un navire.</p></section>';
   if(cmd)content+=`<section class="career-panel"><h2>Réparer la coque</h2>
     <button type="button" class="career-primary" data-crew-order="repair"
       ${orderAvailability(career,life,'repair').enabled?'':'disabled'}>
       Réparer le navire · ${money(REPAIR_COST)}
     </button></section>`;
   break;
 case 'finances':content=finance(state);break;
 case 'influence':content=sections.influence??'';break;
 }
 return `<section class="career-page career-subpage" aria-label="${CAREER_PAGES[page].label}">
    ${subHeader(page,cmd?cmd.name:CREWS[career.pirate.crewId].label)}
    ${content}
   </section>${modal(state)}`;
}
