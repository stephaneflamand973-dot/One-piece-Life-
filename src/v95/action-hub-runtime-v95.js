(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('actionHubDataV95'),engine=registry.get('actionHubEngineV95');
if(!data||!engine)throw new Error('V9.5 action hub prerequisites missing');
const escapeHtml=s=>String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function createRuntime(bridge){
  let query='',showAll=false,personFocus=null;
  const document=global.document;
  const node=id=>document?.getElementById?.(id)||document?.querySelector?.('#'+id);
  const getState=()=>{const g=bridge.getGame();if(!g)return null;g.meta=g.meta||{};g.meta.actionHubV95=engine.normalizeState(g.meta.actionHubV95||{});return g.meta.actionHubV95};
  const add=(a,id,category,title,detail,opts={})=>a.push({id,category,title,detail,score:opts.score||20,available:opts.available!==false,reason:opts.reason||'',
    kind:opts.kind||'direct',urgent:!!opts.urgent,hideFromFeatured:!!opts.hideFromFeatured,tags:opts.tags||''});
  function build(){
    const game=bridge.getGame();if(!game||!game.player)return [];
    const a=[],p=game.player,year=Math.floor((game.ageMonths||0)/12),age=game.ageMonths/12;
    const pending=!!game.pendingDecision,annual=!!game.agency?.annualTurn?.active,locked=pending||annual||!game.alive;
    const why=pending?'Résous d’abord la décision en cours.':annual?'Année en cours : les actions se débloquent après le bilan.':!game.alive?'Cette vie est terminée.':'';
    if(pending)add(a,'decision','life','Prendre une décision',game.pendingDecision.title,{score:110,urgent:true});
    else if(game.alive)add(a,'advance','life',annual?'Reprendre l’année':'Avancer d’un an',
      annual?String(game.agency.annualTurn?.monthsSimulated||0)+'/12 mois simulés.':'Renouvelle les actions. Aucun gain automatique de salaire, de compétences ou de grade.',
      {score:annual?110:78,urgent:annual});
    const manual=[
      ['work','career','Travailler','Gagner de l’expérience professionnelle et un salaire seulement en travaillant.',91],
      ['training','training','S’entraîner','Développer tes aptitudes par une séance volontaire.',82],
      ['mission','career','Accomplir la mission acceptée','Résoudre la mission active maintenant, sans attendre une année.',84],
      ['promotion','career','Demander une promotion','Soumettre ton dossier. Aucun avancement automatique.',70],
      ['rest','life','Se reposer','Récupérer de l’énergie et de la santé par un choix volontaire.',47],
      ['navigation','exploration','Effectuer la traversée','Mener le voyage choisi sans avoir besoin de vieillir.',67],
      ['career_support','career','Aider ton équipe','Construire la confiance et la réputation au travail.',64],
      ['career_initiative','career','Prendre une initiative','Améliorer ton dossier et ton influence au sein de l’organisation.',72],
      ['career_bonus','career','Demander une prime','Négocier une prime basée sur tes performances.',63],
      ['economy_buy','life','Acheter un actif','Acheter du matériel ou développer une entreprise choisie dans Patrimoine.',63],
      ['economy_operate','life','Gérer une entreprise','Encaisser les revenus ou pertes en agissant directement.',58],
      ['expedition_prepare','exploration','Préparer une expédition','Réunir vivres et matériel pour renforcer les futures explorations.',77],
      ['expedition_scout','exploration','Explorer l’île','Lancer une rencontre interactive à trois étapes, avec décisions durables.',85],
      ['expedition_coordinate','career','Préparer la mission','Améliorer les chances de réussite de la mission active.',72],
      ['expedition_command','exploration','Mobiliser l’équipage','Renforcer temporairement la synergie des opérations.',65],
      ['contact_contract','exploration','Accomplir un contrat','Mener une mission proposée par un ancien contact, au risque réel.',83],
      ['saga_chapter','exploration','Progresser dans ma saga','Jouer un chapitre de saga personnelle avec un choix tactique.',89]
    ];
    for(const [id,cat,title,detail,score] of manual){
      const st=bridge.manualStatus?.(id)||{available:false,reason:'Moteur V10 indisponible'};
      add(a,'manual:'+id,cat,title,detail+' • '+(st.remaining||0)+'/'+(st.limit||'?')+' restantes • '+(st.cost||0)+' énergie'+(st.efficiency<1?' • rendement '+Math.round(st.efficiency*100)+'%':'')+'.',{
        available:!!st.available,reason:st.reason||'',score,tags:'action manuelle carrière évolution'});
    }
    // Youth choices must be playable from the life screen, not hidden in Profile.
    // The existing education engine remains authoritative for age, energy and yearly limits.
    for(const education of (bridge.educationChoices?.()||[])){
      add(a,'education:'+education.id,'life',education.title,education.detail||'Décision de formation.',{
        available:!locked&&!!education.available,
        reason:locked?why:(education.reason||''),
        score:education.score||98,tags:'école apprentissage études enfance formation jeunesse'});
    }
    if(game.activeMission)add(a,'open:character:missionBoard','career','Mission en cours : '+game.activeMission.title,'Voir la mission active.',{kind:'open',score:82});
    else for(const m of (game.missionBoard||[]).slice(0,7)){
      add(a,'mission:'+m.id,'career','Accepter : '+m.title,(m.desc||'Mission')+' • '+Math.round(m.reward||0).toLocaleString('fr-FR')+' B',{
        available:!locked,reason:why,score:age>=15?73:31,tags:'mission travail carrière'});
    }
    add(a,'open:character:careerProgressCard','career','Progression & promotions','Examiner les critères de promotion.',{kind:'open',score:44});
    add(a,'open:character:v103CareerCard','career','Tableau professionnel','Consulter performance, rémunération et méthode de travail.',{kind:'open',score:55});
    add(a,'open:character:v105EconomyCard','life','Patrimoine et entreprises','Choisir des actifs, préparer un investissement et exploiter ton patrimoine.',{kind:'open',score:59});
    add(a,'open:character:v73OrganizationCard','career','Organisation & hiérarchie','Choisir une branche, une responsabilité ou une décision interne.',{kind:'open',score:36});
    add(a,'open:character:ambitionCard','career','Ambitions personnelles','Orienter la carrière et les objectifs.',{kind:'open',score:43});
    for(const [id,doc] of Object.entries(bridge.doctrines())){
      add(a,'doctrine:'+id,'training','Doctrine : '+doc.label,'Modifier ton style tactique. Pas de changement du moteur de combat.',{
        available:!locked,reason:why,score:25,hideFromFeatured:true,tags:'combat tactique haki'});
    }
    add(a,'open:abilities:trainingAnnualActions','training','Haki, statistiques & entraînement','Accéder au profil complet de capacités et au plan d’entraînement.',{kind:'open',score:48});
    add(a,'open:character:v89EquipmentCard','training','Équipement & objets','Gérer les objets et leurs effets.',{kind:'open',score:37});
    for(const person of (game.relations||[]).filter(x=>x&&x.id&&x.status!=='left').slice(0,10)){
      const used=game.flags?.relationInteractionYear?.[person.id]===year;
      const social=[['time','Passer du temps avec',52],['help','Aider',48],['train','S’entraîner avec',24],
        ['confide','Se confier à',24],['challenge','Confronter',23],['reconcile','Se réconcilier avec',32],
        ['flirt','Flirter avec',28],['date','Inviter à un rendez-vous',38],['commit','Construire un foyer avec',44]];
      for(const [key,title,score] of social){
        if(['flirt','date','commit'].includes(key)&&person.adult!==true)continue;
        const st=bridge.socialStatus?.(person.id,key);
        const available=st?st.available:!used,reason=st?st.reason:(used?'Action sociale déjà utilisée cette année.':'');
        add(a,'relation:'+encodeURIComponent(person.id)+':'+key,'relations',title+' '+person.name,
          st?st.remaining+' interaction(s) possibles • '+st.cost+' énergie'+(st.money?' • '+st.money+' B':''):'Interaction directe.',{
          available:!locked&&available,reason:locked?why:reason,score,
          tags:'social amitié rivalité romance famille',hideFromFeatured:key!=='time'});
      }
    }
    add(a,'open:relations:relationsList','relations','Toutes les relations','Voir les liens, les interactions et les rivalités.',{kind:'open',score:37});
    add(a,'open:relations:v78HouseholdCard','relations','Famille & foyer','Choix familiaux et engagements.',{kind:'open',score:33});
    if(p.travel)add(a,'open:world:v85ExplorationCard','exploration','Traversée vers '+p.travel.destination,'Afficher les détails du voyage en cours.',{kind:'open',score:78});
    else for(const route of bridge.routes().slice(0,14)){
      add(a,'travel:'+encodeURIComponent(route.dest),'exploration','Naviguer vers '+route.dest,
        route.duration+' mois • risque '+route.riskPct+'%'+(!route.ok?' • '+route.req?.label:''),{
        available:!locked&&route.ok,reason:!route.ok?route.req?.label:why,score:route.ok?63:17,tags:'voyage mer navigation'});
    }
    for(const h of bridge.hooks().filter(x=>x.actionable&&x.hookId).slice(0,8)){
      add(a,'hook:'+encodeURIComponent(h.hookId),'exploration','Opportunité : '+h.title,h.region+' • '+Math.round(h.remaining||0)+' mois restants',{
        available:!locked,reason:why,score:70+Math.round(h.priority||0)*.15,tags:'renseignement monde quête'});
    }
    add(a,'open:world:v94IntelCard','exploration','Renseignements & rumeurs','Voir les informations connues du personnage.',{kind:'open',score:38});
    add(a,'open:world:v110SagaCard','exploration','Sagas personnelles','Chapitres, alliés, rivaux, choix et conséquences durables.',{kind:'open',score:75});
    add(a,'open:world:v109ContractCard','exploration','Contrats de contacts','Négociation, coopération et rivalités à résolution manuelle.',{kind:'open',score:69});
    add(a,'open:world:v107EncounterCard','exploration','Rencontres et conséquences','Suivre tes aventures à étapes, contacts et résultats.',{kind:'open',score:67});
    add(a,'open:world:v106AdventureCard','exploration','Expéditions et équipage','Planification, exploration et soutien des missions.',{kind:'open',score:66});
    add(a,'open:world:v85ExplorationCard','exploration','Carte & exploration','Accéder aux routes et découvertes.',{kind:'open',score:36});
    for(const svc of bridge.services()){
      if(svc.id==='market')continue;
      const used=!!svc.used;
      add(a,'service:'+svc.id,'economy','Service local : '+svc.label,'Service sur '+p.island+' • une utilisation majeure par an.',{
        available:!locked&&!used,reason:used?'Service annuel déjà utilisé.':why,score:40,tags:'soins port ravitaillement'});
    }
    add(a,'open:world:v88MarketCard','economy','Commerce & cargaison','Acheter ou vendre des marchandises au marché local.',{
      kind:'open',score:48,available:!p.travel,reason:p.travel?'Marché inaccessible en mer.':''});
    add(a,'open:character:v69AssetsCard','economy','Patrimoine & investissement','Acheter des actifs durables selon tes moyens.',{kind:'open',score:43});
    add(a,'open:character:economyActions','economy','Budget & investissements annuels','Optimiser l’économie de l’année.',{kind:'open',score:32});
    add(a,'open:character:v86DailyCard','life','Vie quotidienne','Choisir ses activités et opportunités locales.',{kind:'open',score:42});
    add(a,'open:character:v79EducationCard','life','Études & formation','Apprentissages et spécialisations.',{kind:'open',score:age<18?67:25});
    add(a,'open:relations:v78HouseholdCard','life','Logement & foyer','Gérer son logement et sa famille.',{kind:'open',score:37});
    add(a,'open:character:storageStatus','life','Sauvegarde portable','Exporter ou importer une vie.',{kind:'open',score:12,hideFromFeatured:true});
    return a;
  }
  const actionSnapshot=()=>{
    const g=bridge.getGame(),p=g?.player;
    return !g||!p?null:{year:Math.floor((g.ageMonths||0)/12),
      money:Number(p.money)||0,health:Number(p.health)||0,energy:Number(p.energy)||0,
      experience:Number(p.careerXP)||0,bounty:Number(p.bounty)||0,
      lastHistoryId:g.history?.[0]?.id||null,
      lastHistoryTitle:String(g.history?.[0]?.title||'')};
  };
  function actionFeedback(withReturn=false){
    const game=bridge.getGame(),feedback=game?.meta?.actionFeedbackV111;
    if(!feedback||feedback.year!==Math.floor((game.ageMonths||0)/12)||game.pendingDecision)return '';
    const actions=build(),prior=actions.find(x=>x.id===feedback.actionId);
    const canRepeat=!!(game.alive&&prior?.available&&prior.kind!=='open'&&feedback.actionId!=='advance'&&feedback.actionId!=='decision');
    const next=engine.featured(actions.filter(x=>x.available&&x.kind!=='open'&&x.id!=='advance'&&x.id!=='decision'&&x.id!==feedback.actionId),getState(),1)[0];
    return '<div class="opl-result-note opl-result-flow" role="status" aria-label="Résultat de la dernière activité">'+
      '<span>Résultat de ton action</span><strong>'+escapeHtml(feedback.title)+'</strong>'+
      '<small>'+escapeHtml(feedback.summary||'Aucun changement immédiat mesurable.')+'</small>'+
      '<div class="opl-result-actions">'+
      (canRepeat?'<button type="button" class="opl-result-primary" data-v95-repeat="'+escapeHtml(feedback.actionId)+'">↻ Refaire cette action</button>':'')+
      (next?'<button type="button" class="opl-result-secondary" data-v95-next="'+escapeHtml(next.id)+'">Ensuite : '+escapeHtml(next.title)+' →</button>':'')+
      (withReturn?'<button type="button" class="opl-feedback-back" data-v95-life-return>Retour à ma vie ›</button>':
        '<button type="button" class="opl-feedback-back" data-v95-see-activities>Toutes les activités ›</button>')+
      '</div></div>';
  }
  function bindFeedback(root){
    root?.querySelectorAll?.('[data-v95-repeat]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Repeat));
    root?.querySelectorAll?.('[data-v95-next]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Next));
    root?.querySelectorAll?.('[data-v95-life-return]').forEach(b=>b.onclick=()=>bridge.openTab('life'));
    root?.querySelectorAll?.('[data-v95-see-activities]').forEach(b=>b.onclick=()=>bridge.openTab('actions'));
  }
  function execute(id){
    const a=build().find(x=>x.id===id);
    if(!a||!a.available){bridge.toast(a?.reason||'Cette action est indisponible.');return false}
    const before=actionSnapshot();
    const ok=bridge.execute(id);
    if(ok!==false){
      const state=getState(),game=bridge.getGame();
      if(state&&game?.meta)game.meta.actionHubV95=engine.recordAction(state,id);
      // Information panels, age-up and dialogs are not presented as finished actions.
      if(game?.meta&&before&&a.kind!=='open'&&!['advance','decision'].includes(id)){
        const after=actionSnapshot();
        if(after&&after.year===before.year){
          const delta=[
            ['Berry',before.money,after.money,0],
            ['Expérience',before.experience,after.experience,0],
            ['Santé',before.health,after.health,0],
            ['Énergie',before.energy,after.energy,0],
            ['Prime',before.bounty,after.bounty,0]
          ].map(([label,x,y])=>{const d=Math.round(y-x);return d!==0?label+' '+(d>0?'+':'')+d.toLocaleString('fr-FR'):null}).filter(Boolean);
          const eventChanged=after.lastHistoryId&&after.lastHistoryId!==before.lastHistoryId;
          const narrative=eventChanged?after.lastHistoryTitle:'';
          // A finished action always replaces the previous result; never show stale effects.
          if(!game.pendingDecision)game.meta.actionFeedbackV111={
            year:after.year,actionId:id,title:a.title,
            summary:[...delta.slice(0,4),...(narrative?[narrative]:[])].join(' • ')||'Aucun changement immédiat mesurable.'
          };
        }
      }
      bridge.save();
      if(game?.meta&&a.kind!=='open'&&!['decision','advance'].includes(id)){
        renderLife();
        // The game may have switched screens or opened a narrative decision.
        if(!game.pendingDecision){
          renderHub();
          // Show the consequence where the player is, without an extra trip through tabs.
          const tab=bridge.activeTab?.()||'life';
          const result=node(tab==='actions'?'v95Hub':'v95LifeQuick')?.querySelector?.('.opl-result-flow');
          if(result)global.requestAnimationFrame?.(()=>result.scrollIntoView?.({block:'start',behavior:'smooth'}));
        }
      }
    }
    return ok
  }
  function star(id){
    if(!build().some(x=>x.id===id))return;
    const state=getState();if(!state)return;
    const r=engine.toggleFavorite(state,id);
    if(r.full){bridge.toast('10 favoris maximum.');return}
    bridge.getGame().meta.actionHubV95=r.state;bridge.save();renderResults()
  }
  function renderDomainSpotlight(category,actions){
    if(!['career','training'].includes(category))return '';
    const game=bridge.getGame(),p=game?.player||{};
    const relevant=category==='career'?'manual:work':'manual:training';
    const a=actions.find(x=>x.id===relevant);
    const st=bridge.manualStatus?.(category==='career'?'work':'training');
    const available=!!a?.available;
    const details=st?Math.max(0,st.remaining||0)+' / '+(st.limit||0)+' actions restantes • '+(st.cost||0)+' énergie':'Aucune session disponible.';
    const title=category==='career'?'Ma carrière':'Mon entraînement';
    let extra='';
    if(category==='career'){
      const rank=p.rank||'Non défini',career=p.career||'Aucune';
      extra='<p class="opl-domain-caption">'+escapeHtml(career)+' • '+escapeHtml(rank)+'</p>'+
        '<small>Expérience professionnelle : '+Math.round(Number(p.careerXP)||0).toLocaleString('fr-FR')+'</small>';
    }else{
      const focus=bridge.trainingConfig?.();
      if(focus?.options?.length){
        extra='<label class="opl-training-focus" for="oplTrainingFocus">Spécialité d’entraînement'+
          '<select id="oplTrainingFocus" '+(game.pendingDecision?'disabled':'')+'>'+
          focus.options.map(o=>'<option value="'+escapeHtml(o.id)+'" '+(focus.current===o.id?'selected':'')+'>'+escapeHtml(o.label)+'</option>').join('')+
          '</select></label><small>Choisir une spécialité ne consomme pas de séance.</small>';
      }
    }
    return '<section class="opl-domain-spotlight" aria-label="'+title+'">'+
      '<span class="eyebrow">'+title+'</span>'+extra+
      '<div class="opl-domain-cta"><div><strong>'+escapeHtml(details)+'</strong>'+
      '<small>'+escapeHtml(available?'Tu peux agir maintenant.':a?.reason||'Action temporairement bloquée.')+'</small></div>'+
      '<button type="button" data-v95-run="'+relevant+'" '+(available?'':'disabled')+'>'+
      (category==='career'?'Travailler →':'S’entraîner →')+'</button></div></section>';
  }
  function renderRelationCards(selected){
    const game=bridge.getGame(),state=getState();
    const people=(game?.relations||[]).filter(p=>p?.id&&p.status!=='left').map((person,index)=>{
      const prefix='relation:'+encodeURIComponent(person.id)+':';
      // Use the actual action catalogue rather than a hand-maintained subset:
      // romance, rivalries and new interactions must never vanish silently.
      const actions=selected.filter(x=>x.id.startsWith(prefix)&&x.kind!=='open');
      const available=actions.filter(x=>x.available).length;
      const favorite=actions.some(x=>state?.favorites.includes(x.id));
      return {person,index,actions,available,favorite};
    }).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||b.available-a.available||a.index-b.index).slice(0,10);
    if(!people.length)return '<p class="v95-empty">Tu n’as pas encore de relations. Continue à explorer et à rencontrer des personnages.</p>';
    return '<div class="opl-people-list">'+people.map(({person:p,actions,available})=>{
      const ordered=[...actions.filter(x=>x.available),...actions.filter(x=>!x.available)].slice(0,2);
      const buttons=ordered.length?ordered.map(x=>'<button type="button" data-v95-run="'+escapeHtml(x.id)+'" '+(x.available?'':'disabled')+'>'+
        '<strong>'+escapeHtml(x.title.replace(p.name||'', '').trim())+'</strong>'+
        '<small>'+escapeHtml(x.available?x.detail:x.reason||'Indisponible')+'</small></button>').join(''):
        '<p class="opl-person-empty">Aucune interaction proposée pour le moment.</p>';
      return '<article class="opl-person-card"><div class="opl-person-head"><strong>'+escapeHtml(p.name||'Relation')+'</strong>'+
        '<small>'+available+' interaction'+(available>1?'s':'')+' possible'+(available>1?'s':'')+' • confiance '+Math.round(Number(p.trust)||0)+'/100</small></div>'+
        '<div class="opl-person-actions">'+buttons+'</div>'+
        (actions.length>2?'<button type="button" class="opl-person-open" data-v95-person="'+escapeHtml(p.id)+'">Toutes les interactions avec '+escapeHtml(p.name||'ce personnage')+' ›</button>':'')+
        '</article>';
    }).join('')+'</div>';
  }
  function renderResults(){
    const root=node('v95HubResults'),state=getState();
    if(!root||!state)return;
    const all=build();
    // Age-up is a single persistent global button, not a competing activity.
    const selected=engine.select(all.filter(x=>x.id!=='advance'),state,query);
    // The spotlight already offers this action; do not repeat the same button immediately below.
    const spotlightId=state.category==='career'?'manual:work':state.category==='training'?'manual:training':null;
    const listed=!showAll&&!query.trim()&&spotlightId?selected.filter(x=>x.id!==spotlightId):selected;
    // Inside Relations, the player chooses a person first, then their interactions.
    // No mixing someone else's actions into the selected person's screen.
    const focused=state.category==='relations'&&personFocus;
    const focusPrefix=focused?'relation:'+encodeURIComponent(personFocus)+':':'';
    const scoped=focused?listed.filter(x=>x.id.startsWith(focusPrefix)):listed;
    const direct=scoped.filter(x=>x.available&&x.kind!=='open');
    const visible=showAll||query.trim()?scoped.slice(0,70):(direct.length?direct:scoped.filter(x=>x.available)).slice(0,7);
    const count=node('v95HubCount');
    if(count){
      const eligible=selected.filter(x=>x.available).length;
      count.textContent=eligible+' possible'+(eligible>1?'s':'')+(showAll?' • autres choix ci-dessous':'');
    }
    // Relationships show people rather than a confusing wall of repeated actions.
    const groupedRelations=state.category==='relations'&&!personFocus&&!showAll&&!query.trim();
    root.innerHTML=groupedRelations?renderRelationCards(selected):visible.length?visible.map(x=>{
      const fav=state.favorites.includes(x.id);
      const isOpen=x.kind==='open';
      return '<article class="v95-item opl-action-card '+(x.available?'':'locked')+'">'+
        '<button type="button" class="v95-action opl-action-entry" data-v95-run="'+escapeHtml(x.id)+'" '+(x.available?'':'disabled')+'>'+
        '<span class="opl-action-copy"><strong>'+escapeHtml(x.title)+'</strong>'+
        '<small>'+escapeHtml(x.available?x.detail:(x.reason||'Conditions non réunies.'))+'</small></span>'+
        '<span class="opl-action-chevron" aria-hidden="true">'+(isOpen?'›':'→')+'</span></button>'+
        (showAll?'<button type="button" class="v95-star '+(fav?'starred':'')+'" aria-label="'+(fav?'Retirer des favoris':'Mettre en favoris')+'" data-v95-star="'+escapeHtml(x.id)+'">'+(fav?'★':'☆')+'</button>':'')+
        '</article>';
    }).join(''):'<p class="v95-empty">Aucune action disponible ici pour le moment. Change de catégorie ou avance d’un an.</p>';
    root.querySelectorAll?.('[data-v95-run]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Run));
    root.querySelectorAll?.('[data-v95-star]').forEach(b=>b.onclick=()=>star(b.dataset.v95Star));
    root.querySelectorAll?.('[data-v95-person]').forEach(b=>b.onclick=()=>focusPerson(b.dataset.v95Person));
    const more=node('oplHubMore');
    if(more){
      // Each person has an explicit detail page, so the full catalogue never
      // replaces the people list with a wall of mixed relationship actions.
      const hasMore=scoped.length>visible.length;
      more.classList.toggle('hidden',groupedRelations||(!hasMore&&!showAll));
      more.textContent=showAll?'Afficher seulement les actions disponibles':
        personFocus&&state.category==='relations'?'Voir toutes les interactions ('+scoped.length+')':
        'Voir toutes les possibilités ('+selected.length+')';
      more.setAttribute('aria-expanded',String(showAll));
    }
  }
  function decisionFocus(screen='actions'){
    const decision=bridge.getGame()?.pendingDecision;
    if(!decision)return '';
    const id=screen==='life'?'oplLifeDecisionBtn':'oplHubDecisionBtn';
    return '<section class="opl-decision-focus" role="status" aria-label="Décision en attente">'+
      '<span class="eyebrow">Ton histoire attend un choix</span>'+
      '<h3>'+escapeHtml(decision.title||'Décision importante')+'</h3>'+
      (decision.text?'<p>'+escapeHtml(decision.text)+'</p>':'')+
      '<button type="button" class="opl-decision-focus-btn" id="'+id+'">Voir les choix →</button>'+
      '<small>Résous cet événement pour reprendre tes activités.</small></section>';
  }
  function focusPerson(id){
    const game=bridge.getGame();
    const person=(game?.relations||[]).find(p=>p?.id===id&&p.status!=='left');
    if(!person)return false;
    personFocus=id;showAll=false;query='';
    const state=getState();state.category='relations';game.meta.actionHubV95=state;
    renderHub();bridge.save();
    return true;
  }
  function renderHub(){
    const root=node('v95Hub'),state=getState();if(!root||!state)return;
    // A story choice owns the screen until it is resolved. Do not suggest
    // forbidden missions or ask the player to advance past a pending choice.
    if(bridge.getGame()?.pendingDecision){
      root.classList?.remove('opl-hub-drilldown');
      root.innerHTML=decisionFocus();
      const decide=node('oplHubDecisionBtn');
      if(decide)decide.onclick=()=>execute('decision');
      return;
    }
    const allActions=build();
    const recommended=engine.featured(allActions.filter(x=>x.id!=='advance'&&x.id!=='decision'&&x.kind!=='open'),state,2);
    const actionable=allActions.filter(x=>x.available&&x.kind!=='open'&&x.id!=='advance'&&x.id!=='decision');
    const categoryCount=id=>id==='all'?actionable.length:id==='favorites'?
      actionable.filter(x=>state.favorites.includes(x.id)).length:actionable.filter(x=>x.category===id).length;
    const chosen=data.categories.find(x=>x.id===state.category);
    const person=state.category==='relations'?(bridge.getGame()?.relations||[]).find(p=>p?.id===personFocus&&p.status!=='left'):null;
    if(personFocus&&!person)personFocus=null;
    root.classList?.toggle('opl-hub-drilldown',state.category!=='all');
    root.innerHTML=actionFeedback(true)+'<div class="v95-hub-head"><span class="eyebrow">Activités</span><h2>'+(person?'Interagir avec '+escapeHtml(person.name):'Que veux-tu faire ?')+'</h2>'+
      '<p>'+(person?'Choisis directement une interaction. Les actions impossibles sont disponibles dans les détails.':'Choisis un domaine, puis touche une action. Les possibilités indisponibles restent rangées dans « Voir toutes les possibilités ».')+'</p></div>'+
      '<div class="v95-quick">'+recommended.map(x=>'<button type="button" data-v95-quick="'+escapeHtml(x.id)+'"><strong>'+escapeHtml(x.title)+'</strong><span>Recommandé pour toi</span></button>').join('')+'</div>'+
      '<button type="button" id="oplHubBack" class="opl-hub-back '+(state.category==='all'?'hidden':'')+'">'+(person?'‹ Toutes les relations':'‹ Tous les domaines')+'</button>'+
      '<div class="opl-hub-categories-heading"><strong>Choisir un domaine</strong><small>Travail, combat, relations, voyages…</small></div>'+
      '<div id="v95HubCategories" class="v95-categories" role="group" aria-label="Catégories d’actions">'+data.categories.map(x=>'<button type="button" data-v95-category="'+x.id+'" class="v95-category '+(x.id===state.category?'selected':'')+'" aria-pressed="'+(x.id===state.category?'true':'false')+'"><span class="v95-category-name">'+x.icon+' '+escapeHtml(x.label)+'</span><small class="v95-category-count" aria-label="'+categoryCount(x.id)+' actions disponibles">'+categoryCount(x.id)+'</small></button>').join('')+'</div>'+
      renderDomainSpotlight(state.category,allActions)+
      '<div class="v95-section-title"><strong>'+(person?'Interactions avec '+escapeHtml(person.name):state.category==='all'?'Actions à faire maintenant':escapeHtml(chosen?.label||'Activités'))+'</strong><small id="v95HubCount"></small></div>'+
      '<div id="v95HubResults" class="v95-results"></div>'+
      '<button id="oplHubMore" type="button" class="opl-hub-more" aria-expanded="'+String(showAll)+'">Voir toutes les possibilités</button>'+
      '<div class="opl-search-shell '+(showAll?'':'hidden')+'" id="oplSearchShell"><label for="v95HubSearch">Rechercher une action</label>'+
      '<input id="v95HubSearch" class="v95-search" type="search" autocomplete="off" value="'+escapeHtml(query)+'" placeholder="Mission, Haki, équipage…"></div>';
    const back=node('oplHubBack');
    if(back)back.onclick=()=>{
      if(personFocus){personFocus=null;showAll=false;query=''}
      else bridge.getGame().meta.actionHubV95.category='all';
      renderHub();bridge.save();
    };
    bindFeedback(root);
    const search=node('v95HubSearch');
    if(search)search.oninput=e=>{query=e.target.value;showAll=true;renderResults()};
    const focus=node('oplTrainingFocus');
    if(focus)focus.onchange=()=>bridge.setTrainingFocus?.(focus.value);
    root.querySelectorAll?.('.opl-domain-cta [data-v95-run]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Run));
    const more=node('oplHubMore');
    if(more)more.onclick=()=>{showAll=!showAll;if(!showAll)query='';const shell=node('oplSearchShell');if(shell)shell.classList.toggle('hidden',!showAll);if(search)search.value=query;renderResults()};
    root.querySelectorAll?.('[data-v95-quick]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Quick));
    root.querySelectorAll?.('[data-v95-category]').forEach(b=>b.onclick=()=>{
      bridge.getGame().meta.actionHubV95.category=b.dataset.v95Category;
      personFocus=null;
      root.querySelectorAll?.('[data-v95-category]').forEach(x=>{const active=x===b;x.classList.toggle('selected',active);x.setAttribute('aria-pressed',String(active))});
      showAll=false;query='';if(search)search.value='';
      node('oplSearchShell')?.classList.add('hidden');
      renderHub();bridge.save();
    });
    renderResults();
  }
  function renderLife(){
    const root=node('v95LifeQuick'),state=getState();if(!root||!state)return;
    if(bridge.getGame()?.pendingDecision){
      root.innerHTML=decisionFocus('life');
      const decide=node('oplLifeDecisionBtn');
      if(decide)decide.onclick=()=>execute('decision');
      return;
    }
    const top=engine.featured(build().filter(x=>x.available&&x.kind!=='open'&&x.id!=='advance'&&x.id!=='decision'),state,2);
    root.innerHTML=actionFeedback()+'<div class="v95-breadcrumb"><div><span class="eyebrow">Cette année</span><h3>À toi de jouer</h3></div><button type="button" id="v95AllActionsBtn">Toutes les actions ›</button></div>'+
      (top.length?'<div class="v95-quick">'+top.map(x=>'<button type="button" data-v95-life="'+escapeHtml(x.id)+'"><strong>'+escapeHtml(x.title)+'</strong><span>Action disponible</span></button>').join('')+'</div>':
        '<p class="v95-empty">Aucune activité immédiate disponible. Avance d’un an pour renouveler tes possibilités.</p>');
    bindFeedback(root);
    const all=node('v95AllActionsBtn');if(all)all.onclick=()=>bridge.openTab('actions');
    root.querySelectorAll?.('[data-v95-life]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Life));
  }
  return {ensure:getState,build,execute,star,focusPerson,renderHub,renderLife,renderResults,version:'9.5.0'}
}
registry.register('actionHubRuntimeV95',{version:'9.5.0',createRuntime});
})(window);
