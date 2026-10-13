import { createEngine } from '../core/engine.mjs';
import { NAV_ITEMS, SECTIONS, HOME, isHome, resolveHash, makeHash, parentHash } from '../core/navigation.mjs';
import { renderLife, placeOptions, escapeHtml } from './life-view.mjs';
import { renderRelationships } from './relations-view.mjs';
import { renderCareer } from './career-view.mjs';
import { renderActivities } from './activities-view.mjs';

const root = document.getElementById('app');
if (!root) throw new Error('Point de montage absent.');
const engine = createEngine();
const HISTORY_PAGE_SIZE = 8;
let visibleHistoryCount = HISTORY_PAGE_SIZE;
let selectedPersonId = null;
engine.modules.register({
  id: 'life',
  label: 'Vie',
  render: state => renderLife(state, { historyLimit: visibleHistoryCount })
});
engine.modules.register({
  id:'relationships',label:'Relations',
  render:state=>renderRelationships(state,{selectedId:selectedPersonId})
});
engine.modules.register({id:'career',label:'Carrière',render:renderCareer});
engine.modules.register({id:'activities',label:'Activités',render:renderActivities});
function focusPresent() {
  // Pas de scrollIntoView vers la fin du journal : le présent est en tête.
  // Signature numérique largement compatible avec Safari et les PWA iOS.
  window.scrollTo(0, 0);
}

const ICONS = Object.freeze({
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M15 13h6v5h-6a2.5 2.5 0 0 0 0-5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.2a4 4 0 0 1 0 7.6M22 20v-2a4 4 0 0 0-3-3.9"/>',
  dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  back: '<path d="m15 18-6-6 6-6"/>'
});
const icon = name => `<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
let route = resolveHash(window.location.hash, engine.modules);
let lastScreen = null;
let notice = '';

function ageIsAvailable() {
  return isHome(route) && Boolean(engine.getState().activeLife?.alive) && !engine.getState().domainData.story.pending && !engine.getState().domainData.relationships.pending &&
    !engine.getState().domainData.career.command?.pending&&
    !engine.getState().domainData.career.command?.encounters.pending;
}
function navButtons() {
  return NAV_ITEMS.map(({ id, label, icon: iconName }) => {
    const active = route.section === id;
    const selected = active ? 'is-current' : '';
    const aria = active ? 'aria-current="page"' : '';
    if (id === HOME) {
      const ageing = ageIsAvailable();
      const pending = isHome(route) && Boolean(engine.getState().domainData.story.pending || engine.getState().domainData.relationships.pending);
      const crewPending = isHome(route) && Boolean(engine.getState().domainData.career.command?.pending);
      const navalPending = isHome(route) && Boolean(engine.getState().domainData.career.command?.encounters.pending);
      const ended = isHome(route) && engine.getState().activeLife?.alive === false;
      const action = ageing ? 'data-age' : (crewPending||navalPending)&&!pending ? 'data-nav="career"' : 'data-nav="life"';
      const text = ageing ? '+ Âge' : navalPending&&!pending ? 'Rencontre' : crewPending&&!pending ? 'Équipage' : pending ? 'Choisir' : ended ? 'Fin' : 'Vie';
      const disabled = ended || pending ? 'disabled' : '';
      const title = ageing ? 'Avancer d’un an' : navalPending ? 'Résoudre la rencontre en mer dans Carrière' : crewPending ? 'Répondre à votre équipage dans Carrière' : pending ? 'Répondez à la décision en cours' : 'Retour à Vie';
      return `<button type="button" ${action} class="nav-button nav-home ${selected}"
        aria-label="${title}" ${aria} ${disabled}>
        <span class="nav-home-icon">${icon(iconName)}</span><span class="nav-label">${text}</span>
      </button>`;
    }
    return `<button type="button" data-nav="${id}" class="nav-button ${selected}" ${aria}>
      <span class="nav-icon">${icon(iconName)}</span><span class="nav-label">${label}</span>
    </button>`;
  }).join('');
}
function emptyContent() {
  return `<section class="empty-section" aria-label="${SECTIONS[route.section]}">
    <h1>${SECTIONS[route.section]}</h1><p>Cette rubrique est vide.</p>
  </section>`;
}
function currentContent() {
  const module = engine.modules.get(route.section);
  if (!module) return emptyContent();
  const page = route.page ? engine.modules.getPage(route.section, route.page) : null;
  const render = page?.render ?? module.render;
  const output = render(engine.getState(), Object.freeze({
    section: route.section, page: route.page, navigate: go, back
  }));
  return typeof output === 'string' ? output : '';
}
function render() {
  const shipWasOpen=Boolean(root.querySelector('details.ship-panel[open]'));
  const navigationWasOpen=Boolean(root.querySelector('details.navigation-panel[open]'));
  const page = route.page ? engine.modules.getPage(route.section, route.page) : null;
  const title = page?.label ?? SECTIONS[route.section];
  const backButton = isHome(route) ? '' :
    `<button type="button" class="back-button" data-back aria-label="Retour">${icon('back')}</button>`;
  const menu = engine.getState().activeLife ?
    `<button type="button" data-restart class="restart-button" aria-label="Nouvelle vie">Nouvelle vie</button>` : '';
  root.innerHTML = `<div class="app-shell">
    <header class="topbar">
      <div class="topbar-leading">${backButton}
        <button class="brand" data-nav="life" type="button" aria-label="Aller à la vie">
          <span class="brand-mark" aria-hidden="true">OP</span><span>ONE PIECE LIFE</span>
        </button>
      </div>${menu}
    </header>
    <main id="main-content" class="page-content" tabindex="-1" aria-label="${escapeHtml(title)}">
      ${notice ? `<p role="alert" class="notice">${escapeHtml(notice)}</p>` : ''}
      ${route.section==='life'&&engine.getState().domainData.career.command?.pending?
         `<section class="career-panel" role="status" aria-label="Décision d'équipage">
           <h2>Décision de l’équipage</h2>
           <p>${escapeHtml(engine.getState().domainData.career.command.pending.text)}</p>
           <button type="button" data-nav="career" class="career-primary">Répondre dans Carrière</button>
         </section>`:''}
       ${route.section==='life'&&engine.getState().domainData.career.command?.encounters.pending?
         `<section class="career-panel" role="status" aria-label="Rencontre en mer">
           <h2>Rencontre en mer</h2>
           <p>${escapeHtml(engine.getState().domainData.career.command.encounters.pending.text)}</p>
           <button type="button" data-nav="career" class="career-primary">Choisir dans Carrière</button>
         </section>`:''}
       ${currentContent()}
    </main>
    <nav class="bottom-nav" aria-label="Navigation principale">${navButtons()}</nav>
  </div>`;
  if (lastScreen !== route.hash) {
    root.querySelector('.page-content')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  if(shipWasOpen)root.querySelector('details.ship-panel')?.setAttribute('open','');
  if(navigationWasOpen)root.querySelector('details.navigation-panel')?.setAttribute('open','');
  lastScreen = route.hash;
}
function syncFromLocation() {
  const next = resolveHash(window.location.hash, engine.modules);
  if (window.location.hash !== next.hash) window.history.replaceState(null, '', next.hash);
  route = next; notice = ''; render();
}
function go(section, page = null) {
  const hash = makeHash(section, page);
  const normalized = resolveHash(hash, engine.modules);
  if (normalized.hash !== hash) return false;
  if (window.location.hash === hash) { route = normalized; notice = ''; render(); return true; }
  window.location.hash = hash;
  return true;
}
function back() { window.location.hash = parentHash(route); }

root.addEventListener('change', event => {
  if (event.target.id !== 'sea-select') return;
  const select = root.querySelector('#place-select');
  if (select) select.innerHTML = placeOptions(event.target.value);
});
root.addEventListener('submit', event => {
  if(event.target.matches('[data-crew-role]')){
    event.preventDefault();
    if(route.section!=='career')return;
    const form=new FormData(event.target);
    notice=engine.setCrewRole(event.target.dataset.crewRole,form.get('role'))?'':'Poste indisponible ou inchangé.';
    render();return;
  }
  if(event.target.matches('[data-crew-recruit]')){
    event.preventDefault();
    if(route.section!=='career')return;
    const form=new FormData(event.target);
    notice=engine.recruitCrew(form.get('specialty'))?'':
      'Recrutement indisponible : équipage complet, ressources ou décision en cours.';
    render();return;
  }
  if(event.target.matches('[data-career-apply]')){
    event.preventDefault();
    if(route.section!=='career')return;
    const form=new FormData(event.target);
    if(!engine.applyPirate(form.get('crew'),form.get('specialty')))
      notice='Candidature impossible : vérifiez le poste, vos capacités et vos disponibilités.';
    else notice='';
    render();
    return;
  }
  if (!event.target.matches('[data-create-life]')) return;
  event.preventDefault();
  const form = new FormData(event.target);
  const options = Object.fromEntries(['firstName', 'lastName', 'gender', 'sea', 'place'].map(key => [key, form.get(key)]));
  if (!engine.startLife(options)) {
    notice = 'Impossible d’enregistrer la partie. Vérifiez le stockage de votre navigateur.';
  } else {
    notice = '';
  }
  visibleHistoryCount = HISTORY_PAGE_SIZE;
  selectedPersonId = null;
  render();
  if (!notice) focusPresent();
});
root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || !root.contains(button) || button.disabled) return;
  if (button.hasAttribute('data-back')) { back(); return; }
  if(button.hasAttribute('data-go-training')){
    go('activities');return;
  }
  if(button.hasAttribute('data-train')){
    if(route.section!=='activities')return;
    notice=engine.train(button.dataset.train)?'':
      'Entraînement impossible : séance épuisée, fatigue ou décision en cours.';
    render();return;
  }
  if(button.hasAttribute('data-mentor-train')){
    if(route.section!=='activities')return;
    notice=engine.mentorTrain(button.dataset.mentorTrain)?'':
      'Le mentor n’est pas disponible ou vos séances sont épuisées.';
    render();return;
  }
  if(button.hasAttribute('data-rest')){
    if(route.section!=='activities')return;
    notice=engine.rest()?'':'Repos déjà effectué ou décision en cours.';
    render();return;
  }
  if(button.hasAttribute('data-found-crew')){
    if(route.section!=='career')return;
    notice=engine.foundCrew()?'':'Navire indisponible : ressources ou affiliation insuffisantes.';
    render();return;
  }
  if(button.hasAttribute('data-resign-pirate')){
    if(route.section!=='career')return;
    notice=engine.resignPirate()?'':'Impossible de quitter cet équipage actuellement.';
    render();return;
  }
  if(button.hasAttribute('data-crew-answer')){
    if(route.section!=='career')return;
    notice=engine.crewAnswer(button.dataset.crewAnswer)?'':'Impossible de résoudre la demande.';
    render();return;
  }
  if(button.hasAttribute('data-crew-member-action')){
    if(route.section!=='career')return;
    notice=engine.crewInteract(button.dataset.crewMemberId,button.dataset.crewMemberAction)?'':
      'Action indisponible : vérifiez les ressources ou la décision en cours.';
    render();return;
  }
  if(button.hasAttribute('data-encounter-choice')){
    if(route.section!=='career')return;
    notice=engine.encounter(button.dataset.encounterChoice)?'':
      'Décision navale impossible : vérifiez l’état du navire et de l’équipage.';
    render();return;
  }
  if(button.hasAttribute('data-voyage')){
    if(route.section!=='career')return;
    notice=engine.sail(button.dataset.voyage)?'':
      'Voyage impossible : vérifiez l’itinéraire, votre navire et les conditions de passage.';
    render();return;
  }
  if(button.hasAttribute('data-explore-island')){
    if(route.section!=='career')return;
    notice=engine.exploreIsland()?'':'Exploration indisponible : décision en cours.';
    render();return;
  }
  if(button.hasAttribute('data-ship-action')){
    if(route.section!=='career')return;
    notice=engine.shipAction(button.dataset.shipAction,button.dataset.shipValue)?'':
      'Action impossible : vérifiez le modèle, les pièces et les Berrys.';
    render();return;
  }
  if(button.hasAttribute('data-crew-order')){
    if(route.section!=='career')return;
    notice=engine.commandCrew(button.dataset.crewOrder)?'':
      'Ordre indisponible : consultez le moral, les ressources et les décisions en cours.';
    render();return;
  }
  if(button.hasAttribute('data-hide-pirate')){
    if(route.section!=='career')return;
    notice=engine.hidePirate()?'':'Discrétion impossible : pression ou prime insuffisante.';
    render();return;
  }
  if(button.hasAttribute('data-pirate-mission')){
    if(route.section!=='career')return;
    notice=engine.mission(button.dataset.pirateMission)?'':
      'Mission indisponible : vérifiez le rang, les blessures et la fatigue.';
    render();return;
  }
  if(button.hasAttribute('data-ask-promotion')){
    if(route.section!=='career')return;
    notice=engine.askPromotion()?'':'Promotion non disponible pour le moment.';
    render();return;
  }
  if(button.hasAttribute('data-work-pirate')){
    if(route.section!=='career')return;
    notice=engine.workPirate()?'':'Impossible de travailler : vérifiez votre état ou la décision en cours.';
    render();return;
  }
  if (button.hasAttribute('data-person')) {
    selectedPersonId=button.dataset.person===selectedPersonId ? null : button.dataset.person;
    notice='';
    render();
    root.querySelector('.relation-card.is-selected')?.focus({preventScroll:true});
    return;
  }
  if (button.hasAttribute('data-interact')) {
    if(route.section!=='relationships')return;
    if(!engine.interact(button.dataset.personId,button.dataset.interact)){
      notice='Interaction impossible pour cette année.';
    } else notice='';
    render();
    return;
  }
  if (button.hasAttribute('data-join-faction')) {
    if(route.section!=='relationships')return;
    if(!engine.joinFaction(button.dataset.joinFaction)){
      notice='Affiliation impossible pour cette année.';
    } else {
      notice='';
      selectedPersonId=null;
    }
    render(); return;
  }
  if (button.hasAttribute('data-world-action')) {
    if(route.section!=='relationships')return;
    if(!engine.factionAction(button.dataset.worldAction)){
      notice='Cette action de faction est indisponible.';
    } else notice='';
    render(); return;
  }
  if (button.hasAttribute('data-romance-meet')) {
    if(route.section!=='relationships')return;
    if(!engine.meetPartner()){
      notice='Rencontre amoureuse impossible pour le moment.';
    } else {
      notice='';
      selectedPersonId=engine.getState().domainData.relationships.people.at(-1)?.id??null;
    }
    render(); return;
  }
  if (button.hasAttribute('data-romance')) {
    if(route.section!=='relationships')return;
    if(!engine.romance(button.dataset.romance)){
      notice='Cette action de couple n’est pas disponible.';
    } else notice='';
    render(); return;
  }
  if (button.hasAttribute('data-gather')) {
    if(route.section!=='relationships')return;
    if(!engine.gather()){
      notice='Impossible d’organiser cette sortie.';
    } else notice='';
    render();
    return;
  }
  if (button.hasAttribute('data-meet')) {
    if(route.section!=='relationships')return;
    if(!engine.meet()){
      notice='Rencontre impossible pour cette année.';
    } else {
      notice='';
      selectedPersonId=engine.getState().domainData.relationships.people.at(-1)?.id??null;
    }
    render();
    return;
  }
  if (button.hasAttribute('data-show-older')) {
    // Conserver le point de lecture, ainsi que le focus clavier.
    const previousScrollY = window.scrollY;
    visibleHistoryCount += HISTORY_PAGE_SIZE;
    render();
    window.scrollTo(0, previousScrollY);
    const more = root.querySelector('[data-show-older]');
    if (more) more.focus({ preventScroll: true });
    else {
      const lastCard = root.querySelector('.story-list')?.lastElementChild;
      if (lastCard) {
        lastCard.setAttribute('tabindex', '-1');
        lastCard.focus({ preventScroll: true });
      }
    }
    return;
  }
  if (button.hasAttribute('data-age')) {
    if (!ageIsAvailable()) return;
    if (!engine.age()) {
      notice = 'Impossible de sauvegarder la nouvelle année.';
      render(); return;
    }
    notice = '';
    visibleHistoryCount = HISTORY_PAGE_SIZE;
    render();
    focusPresent();
    return;
  }
  if (button.hasAttribute('data-npc-choice')) {
    if (route.section!=='life' || !engine.getState().domainData.relationships.pending) return;
    if (!engine.answerNpc(button.dataset.npcChoice)) {
      notice='Impossible d’enregistrer votre réponse.';
      render(); return;
    }
    notice='';
    visibleHistoryCount=HISTORY_PAGE_SIZE;
    render();
    focusPresent();
    return;
  }
  if (button.hasAttribute('data-choice')) {
    if (route.section !== 'life' || !engine.getState().domainData.story.pending) return;
    if (!engine.choose(button.dataset.choice)) {
      notice = 'Impossible d’enregistrer votre décision.';
      render(); return;
    }
    notice = '';
    visibleHistoryCount = HISTORY_PAGE_SIZE;
    render();
    focusPresent();
    return;
  }
  if (button.hasAttribute('data-restart')) {
    if (!window.confirm('Recommencer une nouvelle vie ? La partie actuelle sera effacée.')) return;
    if (!engine.restart()) {
      notice = 'Impossible de supprimer la partie actuelle.'; render(); return;
    }
    notice = '';
    visibleHistoryCount = HISTORY_PAGE_SIZE;
    selectedPersonId = null;
    if (route.section === 'life') render();
    else go('life');
    focusPresent();
    return;
  }
  if (button.dataset.nav) go(button.dataset.nav);
});
window.addEventListener('hashchange', syncFromLocation);
syncFromLocation();

async function clearLegacyCaches() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const scopes = [new URL('../', window.location.href).href, new URL('./', window.location.href).href];
      await Promise.all(regs.filter(reg => scopes.includes(reg.scope)).map(reg => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('one-piece-life-') || key.startsWith('opl-v')).map(key => caches.delete(key)));
    }
  } catch {}
}
void clearLegacyCaches();
