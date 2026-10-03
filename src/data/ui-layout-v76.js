(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const tabs=[
    {id:'life',label:'Vie',icon:'⌁'},
    {id:'character',label:'Personnage',icon:'◉'},
    {id:'abilities',label:'Capacités',icon:'✦'},
    {id:'relations',label:'Relations',icon:'♟'},
    {id:'world',label:'Monde',icon:'◎'}
  ];

  const sections=[
    {key:'life_director',anchor:'v80DirectorBody',label:'Life Director',defaultCollapsed:false},
    {key:'education',anchor:'v79EducationCard',label:'Éducation & jeunesse',defaultCollapsed:false},
    {key:'household',anchor:'v78HouseholdCard',label:'Foyer & famille',defaultCollapsed:false},
    {key:'consequences',anchor:'v77ConsequencesList',label:'Conséquences actives',defaultCollapsed:false},
    {key:'career_progress',anchor:'careerProgressCard',label:'Progression de carrière',defaultCollapsed:false},
    {key:'organization',anchor:'v73OrganizationCard',label:'Organisation',defaultCollapsed:false},
    {key:'endgame',anchor:'v69EndgameCard',label:'Autorité & héritage',defaultCollapsed:true},
    {key:'assets',anchor:'v69AssetsCard',label:'Patrimoine',defaultCollapsed:true},
    {key:'ambition',anchor:'ambitionCard',label:'Ambition',defaultCollapsed:true},
    {key:'missions',anchor:'missionBoard',label:'Missions',defaultCollapsed:false},
    {key:'activity',anchor:'activityOptions',label:'Activité principale',defaultCollapsed:true},
    {key:'resources',anchor:'resourcesAnnualActions',label:'Ressources',defaultCollapsed:true},
    {key:'economy',anchor:'economyActions',label:'Économie',defaultCollapsed:true},
    {key:'crew',anchor:'crewDetails',label:'Équipage',defaultCollapsed:false},
    {key:'equipment',anchor:'equipmentList',label:'Équipement',defaultCollapsed:true},
    {key:'backup',anchor:'storageStatus',label:'Sauvegarde',defaultCollapsed:true},
    {key:'potential',anchor:'potentialProfile',label:'Potentiel',defaultCollapsed:true},
    {key:'training',anchor:'trainingAnnualActions',label:'Entraînement',defaultCollapsed:true},
    {key:'relations_attitude',anchor:'relationsAnnualActions',label:'Attitude sociale',defaultCollapsed:true},
    {key:'world_map',anchor:'regionMap',label:'Carte du monde',defaultCollapsed:true},
    {key:'world_actors',anchor:'localActors',label:'Acteurs régionaux',defaultCollapsed:true},
    {key:'world_factions',anchor:'factionOverview',label:'Puissances',defaultCollapsed:true},
    {key:'world_rivals',anchor:'worldRivals',label:'Rivalités',defaultCollapsed:true},
    {key:'world_autonomy',anchor:'autonomousChronicle',label:'Monde autonome',defaultCollapsed:true},
    {key:'world_projects',anchor:'worldProjects',label:'Projets',defaultCollapsed:true},
    {key:'world_rumors',anchor:'worldRumors',label:'Rumeurs',defaultCollapsed:true},
    {key:'world_territories',anchor:'territoryOverview',label:'Influence',defaultCollapsed:true},
    {key:'world_pressures',anchor:'pressureBars',label:'Pressions',defaultCollapsed:true},
    {key:'world_news',anchor:'worldNews',label:'Actualités',defaultCollapsed:true},
    {key:'world_canon',anchor:'canonList',label:'Canon dynamique',defaultCollapsed:true},
    {key:'world_codex',anchor:'codexList',label:'Codex',defaultCollapsed:true}
  ];

  const severity={
    critical:{rank:5,label:'URGENT'},
    high:{rank:4,label:'IMPORTANT'},
    medium:{rank:3,label:'À SUIVRE'},
    low:{rank:2,label:'PROGRESSION'},
    calm:{rank:1,label:'LIBRE'}
  };

  registry.register('uiLayoutDataV76',{version:'7.6.0',tabs,sections,severity});
})(window);
