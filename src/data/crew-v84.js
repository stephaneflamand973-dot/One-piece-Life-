(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const roles={
    fighter:{label:'Combattant',aliases:['combattant','guerrier','brute','bretteur'],mission:['combat','patrol','escort'],combat:1.35,travel:.9,support:.8,command:.9},
    swordsman:{label:'Sabreur',aliases:['sabreur','épéiste'],mission:['combat','patrol'],combat:1.45,travel:.85,support:.75,command:.85},
    sniper:{label:'Tireur',aliases:['tireur','sniper'],mission:['combat','escort','patrol'],combat:1.25,travel:.9,support:.9,command:.85},
    navigator:{label:'Navigateur',aliases:['navigateur','navigation'],mission:['navigation','explore','escort'],combat:.7,travel:1.55,support:1.05,command:.95},
    doctor:{label:'Médecin',aliases:['médecin','medecin','docteur'],mission:['medicine','escort','explore'],combat:.6,travel:.9,support:1.6,command:.85},
    carpenter:{label:'Charpentier',aliases:['charpentier','mécanicien','mecanicien'],mission:['navigation','explore','work'],combat:.8,travel:1.25,support:1.4,command:.9},
    cook:{label:'Cuisinier',aliases:['cuisinier','chef'],mission:['escort','work','explore'],combat:.75,travel:1.05,support:1.45,command:.85},
    scout:{label:'Éclaireur',aliases:['éclaireur','eclaireur','pisteur'],mission:['covert','explore','patrol'],combat:.95,travel:1.3,support:1.0,command:.9},
    musician:{label:'Musicien',aliases:['musicien'],mission:['work','escort'],combat:.65,travel:.9,support:1.25,command:1.05},
    scholar:{label:'Savant',aliases:['savant','scientifique','archéologue','archeologue'],mission:['covert','medicine','explore'],combat:.55,travel:1.0,support:1.35,command:1.05},
    officer:{label:'Officier',aliases:['second','bras droit','officier'],mission:['combat','escort','patrol','covert'],combat:1.05,travel:1.0,support:1.0,command:1.55}
  };

  const doctrines={
    balanced:{label:'Équilibré',desc:'Aucun domaine n’est sacrifié.',combat:1,travel:1,support:1,command:1,morale:1},
    assault:{label:'Offensive',desc:'Favorise l’impact au combat au prix de l’usure.',combat:1.18,travel:.92,support:.93,command:1,morale:.96},
    expedition:{label:'Exploration',desc:'Navigation, reconnaissance et autonomie en mer.',combat:.94,travel:1.2,support:1.03,command:.98,morale:1.02},
    survival:{label:'Survie',desc:'Sécurité, soins, logistique et récupération.',combat:.92,travel:1.02,support:1.22,command:.96,morale:1.05},
    discipline:{label:'Discipline',desc:'Chaîne de commandement et efficacité collective.',combat:1.02,travel:.98,support:.98,command:1.2,morale:.98},
    freedom:{label:'Liberté',desc:'Moral et initiative élevés, coordination plus imprévisible.',combat:1.04,travel:1.05,support:.96,command:.9,morale:1.15}
  };

  const traits={
    prodigy:{label:'Prodige',growth:1.22,loyalty:0,injury:1.04,leadership:1},
    veteran:{label:'Vétéran',growth:.82,loyalty:2,injury:.78,leadership:1.15},
    loyal:{label:'Fidèle',growth:1,loyalty:5,injury:.94,leadership:1.03},
    ambitious:{label:'Ambitieux',growth:1.08,loyalty:-2,injury:1,leadership:1.12},
    cautious:{label:'Prudent',growth:.94,loyalty:1,injury:.76,leadership:.97},
    fearless:{label:'Intrépide',growth:1.05,loyalty:0,injury:1.22,leadership:1.04},
    protector:{label:'Protecteur',growth:.98,loyalty:3,injury:.92,leadership:1.08},
    social:{label:'Sociable',growth:1,loyalty:2,injury:1,leadership:1.1}
  };

  const managementActions={
    drill:{label:'Entraînement collectif',desc:'Améliore maîtrise de rôle et préparation, avec un peu de fatigue.',cost:2500},
    bond:{label:'Renforcer la cohésion',desc:'Travaille moral, confiance et loyauté.',cost:1800},
    logistics:{label:'Logistique & navire',desc:'Répare le navire, consolide les réserves et réduit les risques.',cost:3500},
    scout:{label:'Recruter',desc:'Recherche un profil qui comble les besoins de l’équipage.',cost:2200}
  };

  const missionNeeds={
    combat:['fighter','swordsman','sniper','officer'],
    patrol:['scout','fighter','sniper','officer'],
    escort:['officer','fighter','doctor','navigator'],
    covert:['scout','scholar','officer'],
    medicine:['doctor','scholar','cook'],
    explore:['navigator','scout','carpenter','scholar'],
    navigation:['navigator','carpenter','officer'],
    work:['carpenter','cook','musician','scholar']
  };

  const firstNames=['Aren','Mira','Neris','Sena','Toma','Rook','Veya','Iria','Dalen','Kiro','Bren','Milo','Soren','Kaia','Renn','Lio','Nara','Joren'];
  const surnames=['Vale','Morn','Kells','Voss','Sorel','Drake','Holt','Rusk','Aster','Drey','Kane','Varo','Nox','Calder'];

  const v80=registry.get('simulationCoreDataV80');
  if(v80&&!v80.interruptionKinds.crew)v80.interruptionKinds.crew={label:'Équipage',base:58,novelty:10};
  if(v80?.narrativeDomains?.relation?.patterns&&!v80.narrativeDomains.relation.patterns.includes('équipage'))v80.narrativeDomains.relation.patterns.push('équipage');
  if(v80?.narrativeDomains?.career?.patterns&&!v80.narrativeDomains.career.patterns.includes('second'))v80.narrativeDomains.career.patterns.push('second');
  if(v80?.legacyCategories?.leadership?.patterns&&!v80.legacyCategories.leadership.patterns.includes('équipage'))v80.legacyCategories.leadership.patterns.push('équipage');
  if(v80?.legacyCategories?.relation?.patterns&&!v80.legacyCategories.relation.patterns.includes('équipage'))v80.legacyCategories.relation.patterns.push('équipage');

  registry.register('crewDataV84',{version:'8.4.0',roles,doctrines,traits,managementActions,missionNeeds,firstNames,surnames});
})(window);
