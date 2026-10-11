(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('actionHubDataV95'),engine=registry.get('actionHubEngineV95');
if(!data||!engine)throw new Error('V9.5 action hub prerequisites missing');
const escapeHtml=s=>String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function createRuntime(bridge){
  let query='';
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
      ['navigation','exploration','Effectuer la traversée','Mener le voyage choisi sans avoir besoin de vieillir.',67]
    ];
    for(const [id,cat,title,detail,score] of manual){
      const st=bridge.manualStatus?.(id)||{available:false,reason:'Moteur V10 indisponible'};
      add(a,'manual:'+id,cat,title,detail+' • '+(st.remaining||0)+' fois restante(s) cette année.',{
        available:!!st.available,reason:st.reason||'',score,tags:'action manuelle carrière évolution'});
    }
    if(game.activeMission)add(a,'open:character:missionBoard','career','Mission en cours : '+game.activeMission.title,'Voir la mission active.',{kind:'open',score:82});
    else for(const m of (game.missionBoard||[]).slice(0,7)){
      add(a,'mission:'+m.id,'career','Accepter : '+m.title,(m.desc||'Mission')+' • '+Math.round(m.reward||0).toLocaleString('fr-FR')+' B',{
        available:!locked,reason:why,score:age>=15?73:31,tags:'mission travail carrière'});
    }
    add(a,'open:character:careerProgressCard','career','Progression & promotions','Examiner les critères de promotion.',{kind:'open',score:44});
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
      for(const [key,title,score] of [['time','Passer du temps avec',52],['help','Aider',48],['train','S’entraîner avec',24],['confide','Se confier à',24],['challenge','Confronter',23]]){
        if(key==='confide'&&!(person.trust>=30&&person.familiarity>=20))continue;
        if(key==='challenge'&&!(person.familiarity>=20))continue;
        add(a,'relation:'+encodeURIComponent(person.id)+':'+key,'relations',title+' '+person.name,
          used?'Interaction annuelle déjà utilisée.':'Interaction directe : une action par relation et par année.',{
          available:!locked&&!used,reason:used?'Action sociale déjà utilisée cette année.':why,score,
          tags:'social amitié équipage mentor',hideFromFeatured:key!=='time'});
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
  function execute(id){
    const a=build().find(x=>x.id===id);
    if(!a||!a.available){bridge.toast(a?.reason||'Cette action est indisponible.');return false}
    const ok=bridge.execute(id);
    if(ok!==false){
      const state=getState();
      if(state)bridge.getGame().meta.actionHubV95=engine.recordAction(state,id);
      bridge.save();
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
  function renderResults(){
    const root=node('v95HubResults'),state=getState();
    if(!root||!state)return;
    const all=build(),found=engine.select(all,state,query).slice(0,70);
    const count=node('v95HubCount'),summary=engine.summary(all);
    if(count)count.textContent=summary.available+' / '+summary.total+' disponibles';
    root.innerHTML=found.length?found.map(x=>{
      const fav=state.favorites.includes(x.id);
      return '<article class="v95-item '+(x.available?'':'locked')+'"><div class="v95-item-head"><div class="v95-item-body"><strong>'+escapeHtml(x.title)+'</strong>'+
        '<p>'+escapeHtml(x.detail)+'</p>'+(!x.available?'<small>'+escapeHtml(x.reason||'Conditions non réunies.')+'</small>':'')+'</div>'+
        '<button type="button" class="v95-star '+(fav?'starred':'')+'" aria-label="'+(fav?'Retirer des favoris':'Mettre en favoris')+'" data-v95-star="'+escapeHtml(x.id)+'">'+(fav?'★':'☆')+'</button></div>'+
        '<div class="v95-buttons"><button type="button" class="v95-action" data-v95-run="'+escapeHtml(x.id)+'" '+(x.available?'':'disabled')+'>'+
        (x.kind==='open'?'Afficher les détails':'Effectuer cette action')+'</button></div></article>';
    }).join(''):'<p class="v95-empty">Aucune action pour cette recherche. Change de catégorie ou de mots-clés.</p>';
    root.querySelectorAll?.('[data-v95-run]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Run));
    root.querySelectorAll?.('[data-v95-star]').forEach(b=>b.onclick=()=>star(b.dataset.v95Star));
  }
  function renderHub(){
    const root=node('v95Hub'),state=getState();if(!root||!state)return;
    const recommended=engine.featured(build(),state,3);
    root.innerHTML='<div class="v95-hub-head"><span class="eyebrow">V9.5 • Action Hub</span><h2>Que veux-tu faire ?</h2>'+
      '<p>Toutes les actions importantes, triées selon ta situation. Les menus d’information restent accessibles pour les détails.</p></div>'+
      '<div class="v95-quick">'+recommended.map(x=>'<button type="button" data-v95-quick="'+escapeHtml(x.id)+'"><strong>'+escapeHtml(x.title)+'</strong><span>Action recommandée</span></button>').join('')+'</div>'+
      '<label class="eyebrow" for="v95HubSearch">Rechercher une action</label><input id="v95HubSearch" class="v95-search" type="search" autocomplete="off" value="'+escapeHtml(query)+'" placeholder="Mission, Haki, équipage, commerce…">'+
      '<div id="v95HubCategories" class="v95-categories" role="group" aria-label="Catégories d’actions">'+data.categories.map(x=>'<button type="button" data-v95-category="'+x.id+'" class="v95-category '+(x.id===state.category?'selected':'')+'" aria-pressed="'+(x.id===state.category?'true':'false')+'">'+x.icon+' '+escapeHtml(x.label)+'</button>').join('')+'</div>'+
      '<div class="v95-section-title"><strong>Catalogue d’actions</strong><small id="v95HubCount"></small></div>'+
      '<div id="v95HubResults" class="v95-results"></div>';
    const search=node('v95HubSearch');if(search)search.oninput=e=>{query=e.target.value;renderResults()};
    root.querySelectorAll?.('[data-v95-quick]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Quick));
    root.querySelectorAll?.('[data-v95-category]').forEach(b=>b.onclick=()=>{
      bridge.getGame().meta.actionHubV95.category=b.dataset.v95Category;
      root.querySelectorAll?.('[data-v95-category]').forEach(x=>{const active=x===b;x.classList.toggle('selected',active);x.setAttribute('aria-pressed',String(active))});
      renderResults();bridge.save();
    });
    renderResults();
  }
  function renderLife(){
    const root=node('v95LifeQuick'),state=getState();if(!root||!state)return;
    const top=engine.featured(build(),state,2);
    root.innerHTML='<div class="v95-breadcrumb"><span class="eyebrow">V9.5 • Actions rapides</span><button type="button" id="v95AllActionsBtn">Toutes les actions ›</button></div>'+
      '<div class="v95-quick">'+top.map(x=>'<button type="button" data-v95-life="'+escapeHtml(x.id)+'"><strong>'+escapeHtml(x.title)+'</strong><span>Raccourci</span></button>').join('')+'</div>';
    const all=node('v95AllActionsBtn');if(all)all.onclick=()=>bridge.openTab('actions');
    root.querySelectorAll?.('[data-v95-life]').forEach(b=>b.onclick=()=>execute(b.dataset.v95Life));
  }
  return {ensure:getState,build,execute,star,renderHub,renderLife,renderResults,version:'9.5.0'}
}
registry.register('actionHubRuntimeV95',{version:'9.5.0',createRuntime});
})(window);
