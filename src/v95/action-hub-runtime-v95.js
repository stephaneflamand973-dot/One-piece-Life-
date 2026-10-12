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
        renderLife();renderRelations();
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
      const cfg=bridge.careerConfig?.();
      extra='<p class="opl-domain-caption">'+escapeHtml(career)+' • '+escapeHtml(rank)+'</p>'+
        '<small>Expérience professionnelle : '+Math.round(Number(p.careerXP)||0).toLocaleString('fr-FR')+
        (cfg?' • Performance '+Math.round(Number(cfg.performance)||0)+'/100':'')+'</small>';
      if(cfg?.options?.length&&career!=='Aucune'){
        extra+='<label class="opl-training-focus" for="oplCareerMode">Méthode de travail'+
          '<select id="oplCareerMode" '+(cfg.editable?'':'disabled')+'>'+
          cfg.options.map(o=>'<option value="'+escapeHtml(o.id)+'" '+(cfg.current===o.id?'selected':'')+'>'+escapeHtml(o.label)+'</option>').join('')+
          '</select></label><small>'+(cfg.options.find(o=>o.id===cfg.current)?.description||'')+'</small>';
      }
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
  function renderSpecialCareerBoard(market){
    const current=market.active,crew=market.crew;
    const faction=current.faction||bridge.getGame()?.player?.faction||'Organisation';
    const isPirate=faction==='Pirates';
    const captain=isPirate&&market.rank==='Capitaine';
    const intro={
      Pirates:'Pavillon, équipage et butin. Chaque expédition peut augmenter ta prime.',
      Marine:'Patrouilles, arrestations et rapports officiels pour gravir les grades.',
      Gouvernement:'Renseignement, infiltration et opérations confidentielles.',
      'Chasseurs de primes':'Enquêtes et captures indépendantes, avec des récompenses risquées.',
      Révolutionnaires:'Soutien populaire, réseau clandestin et opérations de résistance.'
    }[faction]||'Missions et progression propres à cette organisation.';
    const overview='<section class="opl-job-current opl-special-current">'+
      '<div class="opl-job-top"><span class="eyebrow">Carrière spéciale</span><span class="opl-job-type">'+escapeHtml(faction)+'</span></div>'+
      '<h3>'+escapeHtml(current.career||current.label)+'</h3><p>'+escapeHtml(intro)+'</p>'+
      '<div class="opl-special-metrics"><div><small>Grade actuel</small><strong>'+escapeHtml(market.rank||'Recrue')+'</strong></div>'+
      '<div><small>Expérience</small><strong>'+Math.round(Number(market.careerXP)||0)+' XP</strong></div>'+
      '<div><small>Performance</small><strong>'+Math.round(Number(market.performance)||0)+'/100</strong></div></div>'+
      (isPirate&&crew?'<div class="opl-special-crew"><strong>'+escapeHtml(crew.name||'Équipage')+'</strong>'+
        '<span>'+escapeHtml(captain?'Tu commandes cet équipage':('Capitaine : '+(crew.captain?.name||'Inconnu')))+
        ' • '+(crew.members?.length||0)+' compagnons</span></div>':'')+
      (captain?'<label class="opl-training-focus" for="oplCrewName">Nom du pavillon'+
        '<input type="text" id="oplCrewName" maxlength="42" value="'+escapeHtml(crew?.name||'')+'"/></label>'+
        '<button type="button" class="opl-job-more" data-v112-crew-save>Renommer mon équipage</button>':'')+
      '</section>';
    const preparation=market.specialPreparation;
    const preparationCard=preparation?'<section class="opl-special-preparation" aria-label="Préparation des opérations">'+
      '<div class="opl-job-header"><strong>'+escapeHtml(preparation.label)+'</strong>'+
      '<small>'+preparation.amount+' / '+preparation.capacity+'</small></div>'+
      '<div class="opl-special-preparation-track" role="progressbar" aria-label="'+escapeHtml(preparation.label)+'" aria-valuemin="0" aria-valuemax="'+preparation.capacity+
      '" aria-valuenow="'+preparation.amount+'"><span style="width:'+Math.round(100*preparation.amount/Math.max(1,preparation.capacity))+'%"></span></div>'+
      '<p>'+escapeHtml(preparation.hint)+'</p></section>':'';
    const promotion=market.specialPromotion||{};
    const progress='<section class="opl-special-progress" aria-label="Progression propre à la faction">'+
      '<div class="opl-job-header"><strong>Dossier de '+escapeHtml(faction)+'</strong>'+
      '<small>Mérite '+Math.round(Number(market.specialMerit)||0)+' points</small></div>'+
      '<p>'+(promotion.next?'Prochain grade : <strong>'+escapeHtml(promotion.next)+'</strong>':
        'Tu as atteint le dernier grade ou ta progression dépend d’un défi spécial.')+'</p>'+
      '<div class="opl-special-progress-grid">'+
      [['Mérite',promotion.merit,promotion.meritRequired],
       ['Expérience',promotion.xp,promotion.xpRequired],
       ['Opérations réussies',promotion.successes,promotion.successesRequired],
       ['Confiance',promotion.trust,promotion.trustRequired]].map(([label,value,required])=>
       '<div><small>'+label+'</small><strong>'+Math.floor(Number(value)||0)+' / '+Math.floor(Number(required)||0)+'</strong></div>').join('')+'</div>'+
      '<button type="button" class="opl-special-promote" data-v112-special-promotion '+(promotion.available?'':'disabled')+'>'+
      '<strong>'+escapeHtml(promotion.label||'Examen de grade')+' ›</strong>'+
      '<small>'+escapeHtml(promotion.available?
        'Réussite '+Math.round(promotion.chance*100)+' % • '+promotion.cost+' énergie':
        promotion.reason||'Progression indisponible')+'</small></button></section>';
    const paths='<section class="opl-special-paths" aria-label="Spécialisations de cette carrière">'+
      '<div class="opl-job-header"><strong>Ma spécialisation</strong><small>Une modification par an</small></div>'+
      '<p>Choisis une voie propre à ta faction. Les missions adaptées améliorent tes chances, ton expérience et ton mérite.</p>'+
      '<div class="opl-special-path-grid">'+(market.specialPaths||[]).map(path=>{
        const st=path.status||{};
        return '<button type="button" data-v112-special-path="'+escapeHtml(path.id)+'" '+
          (st.available?'':'disabled')+' class="'+(st.current?'selected':'')+'">'+
          '<strong>'+escapeHtml(path.label)+(st.current?' ✓':'')+'</strong>'+
          '<small>'+escapeHtml(path.description)+'</small>'+
          '<span>'+escapeHtml(st.current?'Spécialisation active':st.available?'Choisir • 5 énergie':st.reason||'Inaccessible')+'</span></button>';
      }).join('')+'</div></section>';
    const operations=(market.operations||[]).map(op=>{
      const gate=op.status||{},blocked=!gate.available;
      return '<article class="opl-special-operation'+(blocked?' locked':'')+'">'+
        '<div><strong>'+escapeHtml(op.label)+'</strong><p>'+escapeHtml(op.description)+'</p>'+
        '<small>'+gate.remaining+'/'+gate.limit+' cette année • '+op.cost+' énergie'+
        (gate.preparationCost?' • Utilise '+gate.preparationCost+' '+escapeHtml(gate.preparationLabel):'')+
        (gate.preparationGain?' • Réussite : +'+gate.preparationGain+' '+escapeHtml(gate.preparationLabel):'')+
        (gate.available?' • Réussite '+Math.round(gate.chance*100)+' %':'')+'</small></div>'+
        '<button type="button" data-v112-special="'+escapeHtml(op.id)+'" '+(blocked?'disabled':'')+'>'+
        (gate.available?'Agir ›':'Indisponible')+'</button>'+
        (blocked?'<small class="opl-special-block">'+escapeHtml(gate.reason||'Conditions non réunies')+'</small>':'')+
        '</article>';
    }).join('');
    const manual= (['manual:mission','manual:expedition_coordinate'].map(id=>
      build().find(x=>x.id===id)).filter(Boolean));
    const extras='<section class="opl-special-secondary"><h3>Grades et responsabilités</h3>'+
      '<div class="opl-job-work-actions">'+manual.map(x=>'<button type="button" data-v112-direct="'+escapeHtml(x.id)+'" '+(x.available?'':'disabled')+'>'+
      '<strong>'+escapeHtml(x.title)+'</strong><small>'+escapeHtml(x.available?x.detail:x.reason||'Indisponible')+'</small></button>').join('')+'</div>'+
      (isPirate?'<button type="button" class="opl-job-more" data-v112-crew>Consulter mon équipage et mon navire ›</button>':'')+
      '<button type="button" class="opl-job-more opl-job-resign" data-v112-quit>Quitter cette carrière spéciale</button></section>';
    return '<section class="opl-job-market opl-special-career" aria-label="Parcours de faction indépendant">'+
      overview+preparationCard+paths+'<section class="opl-special-operations"><div class="opl-job-header"><strong>Mes opérations '+escapeHtml(faction)+'</strong>'+
      '<small>Actions propres à cette carrière</small></div>'+operations+'</section>'+progress+extras+'</section>';
  }
  function renderSkillPractice(market){
    const list=market.skillPractices||[];
    if(!list.length)return '';
    const available=list[0].status?.remaining??0;
    return '<section class="opl-skill-practice" aria-label="Entraînement pratique des compétences">'+
      '<div class="opl-job-header"><strong>Mes compétences</strong><small>'+available+
      ' session'+(available>1?'s':'')+' disponible'+(available>1?'s':'')+' cette année</small></div>'+
      '<p>Pas de diplômes : améliore tes aptitudes par la pratique, puis postule aux métiers qui les demandent.</p>'+
      '<details class="opl-skill-details"><summary>S’entraîner à une compétence ›</summary>'+
      '<div class="opl-skill-grid">'+list.map(x=>{
        const st=x.status||{},blocked=!st.available;
        return '<button type="button" data-v112-practice="'+escapeHtml(x.id)+'" '+(blocked?'disabled':'')+'>'+
          '<strong>'+escapeHtml(x.label)+'</strong><span>Niveau '+Math.floor(Number(st.level)||0)+'/100</span>'+
          '<small>'+escapeHtml(blocked?st.reason||'Indisponible':'+'+st.gain+' points • 9 énergie')+'</small></button>';
      }).join('')+'</div></details></section>';
  }
  function renderCareerBoard(){
    const market=bridge.careerMarket?.();
    if(!market)return '';
    // Resolve interviews on their own screen: beginning an application must never strand the player.
    if(market.interview){
      const q=market.interview,job=q.job||{label:'Recrutement'};
      return '<section class="opl-job-interview" aria-label="Entretien de recrutement">'+
        '<span class="eyebrow">Entretien d’embauche</span><h3>'+escapeHtml(job.label)+'</h3>'+
        (job.id==='pirate_join'&&market.selectedCrew?'<p class="opl-crew-interview-target">Capitaine : '+
          escapeHtml(market.selectedCrew.captain)+' • '+escapeHtml(market.selectedCrew.name)+'</p>':'')+
        '<p>Le recruteur veut comprendre pourquoi il devrait te choisir. Comment lui réponds-tu ?</p>'+
        '<div class="opl-job-interview-choices">'+(q.questions||[]).map(x=>
          '<button type="button" data-v112-answer="'+escapeHtml(x.id)+'"><strong>'+escapeHtml(x.label)+
          '</strong><small>'+escapeHtml(x.description||'')+'</small></button>').join('')+'</div>'+
        '<button type="button" class="opl-job-more" data-v112-cancel>Annuler cet entretien</button></section>';
    }
    const active=market.active;
    if(active?.kind==='special')return renderSpecialCareerBoard(market)+renderSkillPractice(market);
    const cfg=active?bridge.careerConfig?.():null;
    const modes=cfg?.options?.length?'<label class="opl-training-focus" for="oplCareerMode">Méthode de travail'+
      '<select id="oplCareerMode" '+(cfg.editable?'':'disabled')+'>'+
      cfg.options.map(o=>'<option value="'+escapeHtml(o.id)+'" '+(cfg.current===o.id?'selected':'')+'>'+escapeHtml(o.label)+'</option>').join('')+
      '</select></label><small>'+escapeHtml(cfg.options.find(o=>o.id===cfg.current)?.description||'')+'</small>':'';
    const type=market.selected,remaining=type==='special'?market.remainingSpecial:market.remainingOrdinary;
    const current=active?'<section class="opl-job-current"><div class="opl-job-top"><span class="eyebrow">Poste actuel</span>'+
      '<span class="opl-job-type">'+(active.kind==='ordinary'?'Emploi ordinaire':'Carrière spéciale')+'</span></div>'+
      '<h3>'+escapeHtml(active.label)+'</h3>'+
      '<p>Grade : '+escapeHtml(market.rank)+' • Expérience : '+Math.round(Number(market.careerXP)||0)+
      ' • Performance : '+Math.round(Number(market.performance)||0)+'/100</p>'+
      (market.income?'<p>Revenu estimé : <strong>'+market.income.perAction.toLocaleString('fr-FR')+
      ' B par travail</strong> • jusqu’à '+market.income.annualMax.toLocaleString('fr-FR')+
      ' B si tu travailles quatre fois.'+(market.income.raisePct?
        ' • Augmentations obtenues : +'+market.income.raisePct+' %.':'')+'</p>':'')+
      modes+
      (market.captainCrew?'<label class="opl-training-focus" for="oplCrewName">Nom de ton équipage'+
        '<input type="text" id="oplCrewName" maxlength="42" value="'+escapeHtml(market.captainCrew)+'" /></label>'+
        '<button type="button" class="opl-job-more" data-v112-crew-save>Enregistrer le nom du pavillon</button>':'')+
      '<div class="opl-job-current-actions">'+
      '<button type="button" data-v95-run="manual:work" '+(bridge.manualStatus?.('work')?.available?'':'disabled')+'>Travailler maintenant ›</button>'+
      '<button type="button" data-v112-view="switch" class="opl-job-more">'+
        (market.jobHunt?'‹ Revenir à mon poste':'Chercher un autre emploi ›')+'</button>'+
      '<button type="button" class="opl-job-resign" data-v112-quit>Quitter mon poste</button>'+
      '</div></section>':
      '<div class="opl-job-intro"><strong>Ton avenir se décide ici.</strong>'+
      '<p>Consulte les offres, postule et passe un recrutement. Aucun diplôme : seules tes compétences acquises dans ce monde font la différence.</p></div>';
    // BitLife-style occupation: once hired, show workplace actions instead
    // of a long wall of vacancies that cannot be applied to.
    if(active&&!market.jobHunt){
      const ids=['manual:career_bonus','manual:career_initiative',
        'manual:career_support','manual:mission','manual:expedition_coordinate'];
      const actions=ids.map(id=>build().find(x=>x.id===id)).filter(Boolean);
      const sectorTasks=(market.ordinaryTasks||[]).map(task=>{
        const gate=task.status||{};
        return '<article class="opl-sector-task"><div><strong>'+escapeHtml(task.label)+'</strong>'+
          '<p>'+escapeHtml(task.description)+'</p>'+
          '<small>'+gate.remaining+'/'+gate.limit+' disponibles cette année • '+task.cost+' énergie'+
          (gate.available?' • '+Math.round(gate.chance*100)+' % de réussite':'')+'</small></div>'+
          '<button type="button" data-v112-ordinary-task="'+escapeHtml(task.id)+'" '+(gate.available?'':'disabled')+'>'+
          (gate.available?'Réaliser ›':'Indisponible')+'</button>'+
          (!gate.available?'<small class="opl-sector-locked">'+escapeHtml(gate.reason||'Action indisponible')+'</small>':'')+
          '</article>';
      }).join('');
      const promotion=market.promotion;
      const promote=promotion?'<button type="button" class="opl-civil-promote" data-v112-civil-promotion '+(promotion.available?'':'disabled')+'>'+
        '<strong>Demander une promotion'+(promotion.next?' vers '+escapeHtml(promotion.next):'')+'</strong>'+
        '<small>'+escapeHtml(promotion.available?
          'Dossier recevable • '+Math.round(promotion.chance*100)+' % de réussite • '+promotion.cost+' énergie':
          promotion.reason||'Promotion indisponible')+'</small></button>':'';
      const promotionProgress=promotion?.next?
        '<div class="opl-civil-progress"><strong>Objectif : '+escapeHtml(promotion.next)+'</strong>'+
        '<small>XP : '+Math.round(promotion.xp)+' / '+promotion.xpRequired+
        ' • Travail : '+Math.round(promotion.sessions)+' / '+promotion.sessionsRequired+
        ' • Performance : '+Math.round(promotion.performance)+' / '+promotion.performanceRequired+'</small></div>':'';
      const workplace='<section class="opl-job-workplace"><h3>Actions professionnelles</h3>'+
        promotionProgress+
        '<div class="opl-job-work-actions">'+promote+actions.map(x=>
          '<button type="button" data-v112-direct="'+escapeHtml(x.id)+'" '+(x.available?'':'disabled')+'>'+
          '<strong>'+escapeHtml(x.title)+'</strong><small>'+escapeHtml(x.available?x.detail:x.reason||'Indisponible')+'</small></button>').join('')+
        (market.raise?'<button type="button" data-v112-raise '+(market.raise.available?'':'disabled')+'>'+
          '<strong>Demander une augmentation</strong><small>'+escapeHtml(market.raise.available?
          'Négocier +8 % de salaire • '+Math.round(market.raise.chance*100)+' % de réussite • 4 énergie':
          market.raise.reason||'Négociation inaccessible')+'</small></button>':'')+'</div>'+
        (bridge.getGame()?.player?.faction==='Pirates'?
          '<button type="button" class="opl-job-more" data-v112-crew>Gérer mon équipage pirate ›</button>':'')+
        '</section>';
      const sector='<section class="opl-sector-tasks" aria-label="Tâches propres au secteur">'+
        '<div class="opl-job-header"><strong>Mon métier au quotidien</strong><small>'+
        escapeHtml(active.sector||'Emploi ordinaire')+'</small></div>'+sectorTasks+'</section>';
      return '<section class="opl-job-market" aria-label="Ma carrière actuelle">'+current+sector+workplace+renderSkillPractice(market)+'</section>';
    }
    const tabs=market.jobHunt?
      '<div class="opl-job-tabs"><button type="button" data-v112-view="switch">‹ Retour à mon métier actuel</button></div>':
      '<div class="opl-job-tabs" role="group" aria-label="Choisir son parcours">'+
      '<button type="button" data-v112-view="ordinary" aria-pressed="'+(type==='ordinary')+'" class="'+(type==='ordinary'?'selected':'')+'">Métiers ordinaires</button>'+
      '<button type="button" data-v112-view="special" aria-pressed="'+(type==='special')+'" class="'+(type==='special'?'selected':'')+'">Carrières spéciales</button></div>';
    const heading='<div class="opl-job-header"><strong>'+(type==='ordinary'?'Offres d’emploi':'Recrutements spéciaux')+'</strong>'+
      '<small>'+remaining+' candidature'+(remaining>1?'s':'')+' restante'+(remaining>1?'s':'')+' cette année</small></div>';
    const cards=market.entries.map(job=>{
      const st=job.status||{},available=!!st.available;
      const joinPirates=job.id==='pirate_join';
      const selectedCrew=market.selectedCrew;
      const crews=joinPirates&&available?'<fieldset class="opl-crew-picker"><legend>Choisis un équipage à rejoindre</legend>'+
        '<p>Le capitaine, la puissance et tes chances de recrutement varient selon ton choix.</p>'+
        '<div class="opl-crew-offers">'+(market.crews||[]).map(crew=>
          '<button type="button" data-v112-crew-select="'+escapeHtml(crew.id)+'" class="'+
          (selectedCrew?.id===crew.id?'selected':'')+'" aria-pressed="'+(selectedCrew?.id===crew.id)+'">'+
          '<strong>'+escapeHtml(crew.name)+'</strong><small>'+escapeHtml(crew.captain)+' • Puissance '+Math.round(Number(crew.power)||0)+
          ' • '+escapeHtml(crew.origin)+'</small></button>').join('')+'</div></fieldset>':'';
      return '<article class="opl-job-card '+(available?'':'opl-job-disabled')+'">'+
        '<div class="opl-job-top"><div><span class="opl-job-sector">'+escapeHtml(job.sector||job.faction)+'</span>'+
        '<h4>'+escapeHtml(job.label)+'</h4></div>'+
        (job.kind==='ordinary'?'<strong class="opl-job-salary">'+Number(job.pay||0).toLocaleString('fr-FR')+' B</strong>':'')+'</div>'+
        '<p>'+escapeHtml(job.description||'Niveau conseillé : '+job.skill+' '+job.skillMin+'/100')+'</p>'+
        '<div class="opl-job-requirements"><span>Âge : '+job.minAge+' ans</span>'+
        '<span>'+escapeHtml(job.skill||'')+' : '+Math.floor(Number(st.skill)||0)+' / '+(job.skillMin||0)+' requis</span>'+
        (job.money?'<span>Coût : '+job.money.toLocaleString('fr-FR')+' B</span>':'')+
        (available?'<span>'+(st.chance>=1?'Accès garanti':'Chance d’embauche : '+Math.round(st.chance*100)+' %')+'</span>':'')+'</div>'+
        crews+
        (available?'<button type="button" data-v112-apply="'+escapeHtml(job.id)+'" '+(joinPirates&&!selectedCrew?'disabled':'')+'>'+
          (joinPirates&&!selectedCrew?'Sélectionne d’abord un équipage':joinPirates?'Postuler chez '+escapeHtml(selectedCrew.name)+' ›':'Postuler ›')+'</button>':
          '<small class="opl-job-block-reason">'+escapeHtml(st.reason||'Conditions non réunies')+'</small>')+'</article>';
    }).join('');
    const more=type==='ordinary'&&!market.allOffers?'<button type="button" class="opl-job-more" data-v112-view="all">Consulter tous les métiers (même sans poste vacant) ›</button>':
      type==='ordinary'?'<button type="button" class="opl-job-more" data-v112-view="all">Voir les offres de cette année</button>':'';
    const history=market.history?.length?'<div class="opl-job-history"><strong>Mon parcours professionnel</strong>'+
      market.history.map(h=>'<p>'+escapeHtml(h.title)+' • '+({hired:'Recruté',switched:'Nouvel emploi',rejected:'Refus',resigned:'Démission',promoted:'Promotion',promotion_refused:'Promotion refusée',raise:'Augmentation',raise_refused:'Augmentation refusée'}[h.kind]||'Activité')+
      ' • '+h.year+' ans</p>').join('')+'</div>':'';
    return '<section class="opl-job-market" aria-label="Marché de l’emploi et carrières spéciales">'+current+renderSkillPractice(market)+tabs+heading+
      '<div class="opl-job-list">'+cards+'</div>'+more+history+'</section>';
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
      const eligible=scoped.filter(x=>x.available).length;
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
    const id=screen==='life'?'oplLifeDecisionBtn':screen==='relations'?'oplRelationsDecisionBtn':'oplHubDecisionBtn';
    return '<section class="opl-decision-focus" role="status" aria-label="Décision en attente">'+
      '<span class="eyebrow">Ton histoire attend un choix</span>'+
      '<h3>'+escapeHtml(decision.title||'Décision importante')+'</h3>'+
      (decision.text?'<p>'+escapeHtml(decision.text)+'</p>':'')+
      '<button type="button" class="opl-decision-focus-btn" id="'+id+'">Voir les choix →</button>'+
      '<small>Résous cet événement pour reprendre tes activités.</small></section>';
  }
  function focusPerson(id){
    const game=bridge.getGame();
    const person=(game?.relations||[]).find(p=>p?.id!=null&&String(p.id)===String(id)&&p.status!=='left');
    if(!person)return false;
    personFocus=id;showAll=false;query='';
    const state=getState();state.category='relations';game.meta.actionHubV95=state;
    renderHub();renderRelations();bridge.save();
    const panel=bridge.activeTab?.()==='relations'?'v95RelationsQuick':'v95Hub';
    node(panel)?.scrollIntoView?.({block:'start',behavior:'smooth'});
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
    const person=state.category==='relations'?(bridge.getGame()?.relations||[]).find(p=>p?.id!=null&&String(p.id)===String(personFocus)&&p.status!=='left'):null;
    if(personFocus&&!person)personFocus=null;
    root.classList?.toggle('opl-hub-drilldown',state.category!=='all');
    root.classList?.toggle('opl-hub-career',state.category==='career');
    root.innerHTML=actionFeedback(true)+'<div class="v95-hub-head"><span class="eyebrow">Activités</span><h2>'+(person?'Interagir avec '+escapeHtml(person.name):'Que veux-tu faire ?')+'</h2>'+
      '<p>'+(person?'Choisis directement une interaction. Les actions impossibles sont disponibles dans les détails.':'Choisis un domaine, puis touche une action. Les possibilités indisponibles restent rangées dans « Voir toutes les possibilités ».')+'</p></div>'+
      '<div class="v95-quick">'+recommended.map(x=>'<button type="button" data-v95-quick="'+escapeHtml(x.id)+'"><strong>'+escapeHtml(x.title)+'</strong><span>Recommandé pour toi</span></button>').join('')+'</div>'+
      '<button type="button" id="oplHubBack" class="opl-hub-back '+(state.category==='all'?'hidden':'')+'">'+(person?'‹ Toutes les relations':'‹ Tous les domaines')+'</button>'+
      '<div class="opl-hub-categories-heading"><strong>Choisir un domaine</strong><small>Travail, combat, relations, voyages…</small></div>'+
      '<div id="v95HubCategories" class="v95-categories" role="group" aria-label="Catégories d’actions">'+data.categories.map(x=>'<button type="button" data-v95-category="'+x.id+'" class="v95-category '+(x.id===state.category?'selected':'')+'" aria-pressed="'+(x.id===state.category?'true':'false')+'"><span class="v95-category-name">'+x.icon+' '+escapeHtml(x.label)+'</span><small class="v95-category-count" aria-label="'+categoryCount(x.id)+' actions disponibles">'+categoryCount(x.id)+'</small></button>').join('')+'</div>'+
      (state.category==='career'?renderCareerBoard():renderDomainSpotlight(state.category,allActions))+
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
    const mode=node('oplCareerMode');
    if(mode)mode.onchange=()=>bridge.setCareerMode?.(mode.value);
    root.querySelectorAll?.('[data-v112-view]').forEach(b=>b.onclick=()=>bridge.careerView?.(b.dataset.v112View));
    root.querySelectorAll?.('[data-v112-crew-select]').forEach(b=>b.onclick=()=>bridge.careerAction?.('crew_select',b.dataset.v112CrewSelect));
    root.querySelectorAll?.('[data-v112-apply]').forEach(b=>b.onclick=()=>bridge.careerAction?.('apply',b.dataset.v112Apply));
    root.querySelectorAll?.('[data-v112-quit]').forEach(b=>b.onclick=()=>bridge.careerAction?.('quit'));
    root.querySelectorAll?.('[data-v112-raise]').forEach(b=>b.onclick=()=>bridge.careerAction?.('raise'));
    root.querySelectorAll?.('[data-v112-civil-promotion]').forEach(b=>b.onclick=()=>bridge.careerAction?.('civil_promotion'));
    root.querySelectorAll?.('[data-v112-ordinary-task]').forEach(b=>b.onclick=()=>bridge.careerAction?.('ordinary_task',b.dataset.v112OrdinaryTask));
    root.querySelectorAll?.('[data-v112-practice]').forEach(b=>b.onclick=()=>bridge.careerAction?.('practice',b.dataset.v112Practice));
    root.querySelectorAll?.('[data-v112-special]').forEach(b=>b.onclick=()=>bridge.careerAction?.('special',b.dataset.v112Special));
    root.querySelectorAll?.('[data-v112-special-path]').forEach(b=>b.onclick=()=>bridge.careerAction?.('special_path',b.dataset.v112SpecialPath));
    root.querySelectorAll?.('[data-v112-special-promotion]').forEach(b=>b.onclick=()=>bridge.careerAction?.('special_promotion'));
    root.querySelectorAll?.('[data-v112-answer]').forEach(b=>b.onclick=()=>bridge.careerAction?.('answer',b.dataset.v112Answer));
    root.querySelectorAll?.('[data-v112-cancel]').forEach(b=>b.onclick=()=>bridge.careerAction?.('cancel'));
    root.querySelectorAll?.('[data-v112-crew-save]').forEach(b=>b.onclick=()=>bridge.careerAction?.('crew_name',node('oplCrewName')?.value||''));

    root.querySelectorAll?.('.opl-job-current [data-v95-run]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Run));
    root.querySelectorAll?.('[data-v112-direct]').forEach(b=>b.onclick=()=>execute(b.dataset.v112Direct));
    root.querySelectorAll?.('[data-v112-crew]').forEach(b=>b.onclick=()=>bridge.execute?.('open:character:crewSection'));
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
  function goCategory(category){
    const state=getState();if(!state)return;
    state.category=category;personFocus=null;query='';showAll=false;
    bridge.getGame().meta.actionHubV95=state;
    bridge.openTab(category==='relations'?'relations':'actions');
    renderHub();renderRelations();bridge.save();
    // Override the previously saved position for intentional shortcuts.
    global.requestAnimationFrame?.(()=>node(category==='relations'?'v95RelationsQuick':'v95Hub')?.scrollIntoView?.({block:'start',behavior:'auto'}));
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
    const game=bridge.getGame(),p=game.player,year=Math.floor((game.ageMonths||0)/12);
    const vital=(label,value)=>'<div class="opl-vital"><div><span>'+label+'</span><strong>'+Math.round(Math.max(0,Math.min(100,Number(value)||0)))+'%</strong></div>'+
      '<div class="opl-vital-track" role="progressbar" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(Math.max(0,Math.min(100,Number(value)||0)))+'"><span style="width:'+Math.round(Math.max(0,Math.min(100,Number(value)||0)))+'%"></span></div></div>';
    const history=(game.history||[]).filter(x=>x&&x.title).slice(0,4);
    const story='<section class="opl-life-story" aria-label="Journal de vie"><div class="opl-life-story-head"><strong>Mon histoire</strong><small>'+year+' ans</small></div>'+
      (history.length?'<div class="opl-life-entries">'+history.map(h=>'<article class="opl-life-entry"><span>'+
      (Number.isFinite(Number(h.ageMonths))?Math.floor(Number(h.ageMonths)/12)+' ans':year+' ans')+'</span>'+
      '<div><strong>'+escapeHtml(h.title)+'</strong>'+(h.desc?'<p>'+escapeHtml(h.desc)+'</p>':'')+'</div></article>').join('')+'</div>':
      '<p>Ton histoire commence. Choisis une activité pour écrire la suite.</p>')+'</section>';
    root.innerHTML=actionFeedback()+
      '<section class="opl-vitals" aria-label="État de ton personnage">'+vital('Santé',p.health)+vital('Énergie',p.energy)+'</section>'+
      '<div class="v95-breadcrumb"><div><span class="eyebrow">Cette année</span><h3>À toi de jouer</h3></div><button type="button" id="v95AllActionsBtn">Toutes les actions ›</button></div>'+
      (top.length?'<div class="v95-quick">'+top.map(x=>'<button type="button" data-v95-life="'+escapeHtml(x.id)+'"><strong>'+escapeHtml(x.title)+'</strong><span>Action disponible</span></button>').join('')+'</div>':
        '<p class="v95-empty">Aucune activité immédiate disponible. Avance d’un an pour renouveler tes possibilités.</p>')+
      '<div class="opl-life-shortcuts" aria-label="Domaines principaux">'+
        '<button type="button" data-v95-shortcut="career">Métier ›</button>'+
        '<button type="button" data-v95-shortcut="training">Entraînement ›</button>'+
        '<button type="button" data-v95-shortcut="relations">Relations ›</button></div>'+story;
    bindFeedback(root);
    const all=node('v95AllActionsBtn');if(all)all.onclick=()=>bridge.openTab('actions');
    root.querySelectorAll?.('[data-v95-life]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Life));
    root.querySelectorAll?.('[data-v95-shortcut]').forEach(b=>b.onclick=()=>goCategory(b.dataset.v95Shortcut));
  }
  function renderRelations(){
    const root=node('v95RelationsQuick'),game=bridge.getGame();if(!root||!game)return;
    const state=getState();
    if(game.pendingDecision){
      root.innerHTML=decisionFocus('relations');
      const decide=node('oplRelationsDecisionBtn');
      if(decide)decide.onclick=()=>execute('decision');
      return;
    }
    const all=build().filter(x=>x.category==='relations');
    const selected=engine.select(all,{...state,category:'relations'},'');
    const person=(game.relations||[]).find(p=>p?.id!=null&&String(p.id)===String(personFocus)&&p.status!=='left');
    if(personFocus&&!person)personFocus=null;
    if(person){
      const prefix='relation:'+encodeURIComponent(person.id)+':';
      const actions=selected.filter(x=>x.id.startsWith(prefix));
      const score=Math.max(0,Math.min(100,Math.round(Number(person.trust)||0)));
      root.innerHTML=actionFeedback()+
        '<button type="button" class="opl-hub-back" id="oplRelationsBack">‹ Toutes les relations</button>'+
        '<div class="opl-person-summary"><span class="eyebrow">Relation</span><h2>'+escapeHtml(person.name)+'</h2>'+
        '<div class="opl-vital"><div><span>Confiance</span><strong>'+score+'%</strong></div>'+
        '<div class="opl-vital-track" role="progressbar" aria-label="Confiance" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+score+'"><span style="width:'+score+'%"></span></div></div>'+
        '</div><div class="opl-person-actions opl-person-actions-expanded">'+actions.map(x=>
          '<button type="button" data-v95-run="'+escapeHtml(x.id)+'" '+(x.available?'':'disabled')+'>'+
          '<strong>'+escapeHtml(x.title)+'</strong><small>'+escapeHtml(x.available?x.detail:x.reason||'Indisponible')+'</small></button>').join('')+'</div>';
      const back=node('oplRelationsBack');if(back)back.onclick=()=>{personFocus=null;renderRelations();renderHub();root.scrollIntoView?.({block:'start',behavior:'auto'})};
    }else{
      root.innerHTML='<div class="opl-relations-intro"><span class="eyebrow">Relations</span><h2>Mes proches et mes rivaux</h2>'+
        '<p>Sélectionne une personne pour choisir ce que tu veux faire avec elle.</p></div>'+renderRelationCards(selected);
      root.querySelectorAll?.('[data-v95-person]').forEach(b=>b.onclick=()=>focusPerson(b.dataset.v95Person));
    }
    root.querySelectorAll?.('[data-v95-run]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Run));
    bindFeedback(root);
  }
  return {ensure:getState,build,execute,star,focusPerson,goCategory,renderHub,renderLife,renderRelations,renderResults,version:'9.5.0'}
}
registry.register('actionHubRuntimeV95',{version:'9.5.0',createRuntime});
})(window);
