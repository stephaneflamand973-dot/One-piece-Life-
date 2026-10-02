(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const temperamentValues={
    Loyaliste:['loyauté','famille','devoir'],
    Protecteur:['protection','loyauté','honneur'],
    Méthodique:['stratégie','discipline','savoir'],
    Téméraire:['courage','aventure','fierté'],
    Ambitieux:['ambition','influence','puissance'],
    Indépendant:['liberté','autonomie','fierté'],
    Franc:['courage','famille','liberté'],
    Inflexible:['ordre','discipline','devoir'],
    Détaché:['liberté','justice','autonomie'],
    Direct:['justice','indépendance','devoir'],
    Calme:['liberté','loyauté','équilibre'],
    Opportuniste:['ambition','puissance','fortune'],
    Exigeant:['maîtrise','indépendance','fierté'],
    Observateur:['liberté','maîtrise','savoir'],
    Stratège:['liberté','révolution','stratégie'],
    Calculateur:['ambition','fortune','influence'],
    Dominateur:['pouvoir','influence','ambition'],
    Spontané:['liberté','loyauté','aventure'],
    Réservée:['savoir','loyauté','prudence'],
    Explosif:['puissance','fierté','liberté'],
    Déterminé:['liberté','protection','loyauté'],
    Froid:['efficacité','discipline','maîtrise'],
    Fière:['fierté','loyauté','indépendance'],
    Diplomate:['honneur','protection','équilibre'],
    Variable:['liberté','survie']
  };

  const ambitionValues={
    Maîtrise:['maîtrise','discipline'],
    Influence:['influence','ambition'],
    Fortune:['fortune','autonomie'],
    Aventure:['aventure','liberté'],
    Liberté:['liberté','autonomie'],
    Loyauté:['loyauté','famille'],
    power:['puissance','ambition'],
    wealth:['fortune','influence'],
    protect:['protection','loyauté'],
    explore:['aventure','liberté'],
    legacy:['héritage','influence']
  };

  const interactionProfiles={
    time:{label:'Partager du temps',tags:['presence','bond'],trust:3,affection:5,respect:1,familiarity:6,shared:5,memory:'Temps partagé'},
    train:{label:'S’entraîner ensemble',tags:['growth','challenge'],trust:1,affection:1,respect:6,familiarity:3,shared:7,memory:'Entraînement commun'},
    help:{label:'Apporter une aide concrète',tags:['support','loyalty'],trust:7,affection:3,respect:2,loyalty:5,shared:4,memory:'Service rendu'},
    protect:{label:'Prendre un risque pour protéger',tags:['support','sacrifice'],trust:10,affection:6,respect:7,loyalty:8,shared:9,memory:'Protection décisive'},
    confide:{label:'Se confier',tags:['vulnerability','bond'],trust:8,affection:6,respect:1,familiarity:7,shared:6,memory:'Confidence importante'},
    challenge:{label:'Le confronter honnêtement',tags:['challenge','truth'],trust:-1,affection:-1,respect:7,rivalry:3,shared:5,memory:'Confrontation franche'},
    distance:{label:'Prendre ses distances',tags:['distance'],trust:-5,affection:-5,familiarity:-2,rivalry:2,shared:1,memory:'Distance assumée'}
  };

  const socialArcs=[
    {id:'trust_test',label:'Épreuve de confiance',priority:70,minFamiliarity:28,minStrength:42,conditions:{trust:[38,78]},choices:['stand_by','doubt']},
    {id:'rivalry_escalation',label:'Rivalité ouverte',priority:82,minFamiliarity:20,conditions:{rivalry:[58,100],respect:[42,100]},choices:['respect_rival','humiliate']},
    {id:'mentor_breakthrough',label:'Déclic de mentorat',priority:74,minFamiliarity:35,conditions:{mentor:true,trust:[58,100],respect:[60,100]},choices:['learn','resist']},
    {id:'loyalty_choice',label:'Choix de loyauté',priority:78,minFamiliarity:38,conditions:{loyalty:[48,100],trust:[50,100]},choices:['commit','self_first']},
    {id:'fracture',label:'Fracture relationnelle',priority:95,minFamiliarity:20,conditions:{trust:[0,28],rivalry:[45,100]},choices:['repair','cut_ties']},
    {id:'reconciliation',label:'Réconciliation',priority:76,minFamiliarity:32,conditions:{status:'distant',trust:[22,58]},choices:['reconcile','keep_distance']}
  ];

  const arcChoices={
    stand_by:{label:'Lui faire confiance',memory:'Confiance accordée sous pression',delta:{trust:10,affection:4,loyalty:5,rivalry:-2}},
    doubt:{label:'Rester méfiant',memory:'Doute au mauvais moment',delta:{trust:-8,affection:-2,rivalry:4}},
    respect_rival:{label:'Respecter la rivalité',memory:'Rivalité assumée avec respect',delta:{respect:8,trust:2,rivalry:-4}},
    humiliate:{label:'Chercher à l’humilier',memory:'Humiliation dans la rivalité',delta:{respect:-7,trust:-5,rivalry:10}},
    learn:{label:'Accepter son enseignement',memory:'Déclic de mentorat',delta:{trust:6,respect:7,sharedExperience:8}},
    resist:{label:'Refuser de dépendre de lui',memory:'Refus du mentorat',delta:{trust:-3,respect:2,rivalry:2}},
    commit:{label:'Prendre son parti',memory:'Choix de loyauté',delta:{trust:8,affection:5,loyalty:10}},
    self_first:{label:'Privilégier ta trajectoire',memory:'Priorité personnelle',delta:{trust:-6,loyalty:-7,rivalry:3}},
    repair:{label:'Tenter de réparer le lien',memory:'Tentative de réparation',delta:{trust:8,affection:5,rivalry:-7}},
    cut_ties:{label:'Rompre le lien',memory:'Rupture assumée',delta:{trust:-12,affection:-10,rivalry:8,status:'distant'}},
    reconcile:{label:'Rouvrir la porte',memory:'Réconciliation',delta:{trust:9,affection:5,rivalry:-5,status:'active'}},
    keep_distance:{label:'Garder ses distances',memory:'Distance maintenue',delta:{trust:-1,affection:-2,status:'distant'}}
  };

  registry.register('relationPersonaDataV74',{
    version:'7.4.0',temperamentValues,ambitionValues,interactionProfiles,socialArcs,arcChoices
  });
})(window);
