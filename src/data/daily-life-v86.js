(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const profiles={
    general:{label:'Vie quotidienne',family:'balanced',skills:['Commandement'],energy:0,health:.15,mastery:.75,opportunities:['social','work','discovery']},
    explore:{label:'Exploration locale',family:'adventure',skills:['Navigation','Discrétion'],energy:-.25,health:0,mastery:1.0,opportunities:['discovery','treasure','rescue','rumor']},
    physical:{label:'Condition physique',family:'training',skills:['Combat'],energy:-.45,health:.08,mastery:1.05,opportunities:['challenge','spar','rescue']},
    combat:{label:'Combat',family:'training',skills:['Combat'],energy:-.50,health:0,mastery:1.1,opportunities:['spar','challenge','bounty']},
    navigation:{label:'Navigation',family:'adventure',skills:['Navigation'],energy:-.20,health:0,mastery:1.05,opportunities:['discovery','merchant','rescue','rumor']},
    social:{label:'Vie sociale',family:'social',skills:['Commandement'],energy:.05,health:.05,mastery:.8,opportunities:['social','contact','work']},
    study:{label:'Études & recherche',family:'knowledge',skills:['Science','Médecine','Discrétion'],energy:-.10,health:0,mastery:1.0,opportunities:['research','rumor','contact']},
    marine:{label:'Service Marine',family:'duty',skills:['Combat','Commandement'],energy:-.28,health:0,mastery:1.0,opportunities:['patrol','rescue','bounty']},
    patrol:{label:'Patrouille & chasse',family:'duty',skills:['Combat','Discrétion'],energy:-.35,health:0,mastery:1.05,opportunities:['bounty','rescue','rumor']},
    rest:{label:'Récupération',family:'recovery',skills:[],energy:.85,health:.55,mastery:.55,opportunities:['social','contact']},
    crew:{label:'Vie d’équipage',family:'social',skills:['Commandement','Navigation'],energy:.05,health:.02,mastery:.9,opportunities:['social','merchant','spar','contact']},
    intense:{label:'Entraînement intense',family:'training',skills:['Combat'],energy:-.85,health:-.05,mastery:1.25,opportunities:['challenge','spar']},
    crime:{label:'Raid & criminalité',family:'risk',skills:['Combat','Discrétion'],energy:-.40,health:-.03,mastery:1.05,opportunities:['crime','treasure','merchant']},
    covert:{label:'Clandestinité',family:'risk',skills:['Discrétion','Commandement'],energy:-.25,health:0,mastery:1.05,opportunities:['rumor','contact','rescue']},
    government:{label:'Service gouvernemental',family:'duty',skills:['Discrétion','Combat'],energy:-.30,health:0,mastery:1.0,opportunities:['research','rumor','patrol']},
    work:{label:'Travail',family:'work',skills:['Commandement','Science'],energy:-.20,health:0,mastery:.95,opportunities:['work','merchant','contact']},
    mission:{label:'Mission',family:'duty',skills:['Combat','Commandement'],energy:-.45,health:-.02,mastery:1.0,opportunities:[]},
    travel:{label:'Voyage',family:'adventure',skills:['Navigation'],energy:-.20,health:0,mastery:.9,opportunities:[]}
  };

  const opportunities={
    challenge:{label:'Défi local',desc:'Une figure locale te propose une épreuve courte mais visible.',skill:'Combat',baseDifficulty:42,risk:30,reward:'skill',money:0,rep:2},
    spar:{label:'Partenaire d’entraînement',desc:'Un combattant disponible cherche quelqu’un pour une séance sérieuse.',skill:'Combat',baseDifficulty:36,risk:18,reward:'skill',money:0,rep:1},
    bounty:{label:'Petite cible repérée',desc:'Une cible secondaire apparaît à portée avant de disparaître.',skill:'Combat',baseDifficulty:50,risk:45,reward:'money',money:5200,rep:2},
    rescue:{label:'Incident à proximité',desc:'Quelqu’un a besoin d’aide rapidement. Intervenir coûtera de l’énergie.',skill:'Commandement',baseDifficulty:38,risk:26,reward:'reputation',money:800,rep:4},
    discovery:{label:'Piste locale',desc:'Une information banale pourrait mener à quelque chose de moins banal.',skill:'Navigation',baseDifficulty:35,risk:16,reward:'discovery',money:1200,rep:1},
    treasure:{label:'Rumeur de butin',desc:'Une piste courte évoque une cache ou une cargaison oubliée.',skill:'Navigation',baseDifficulty:48,risk:34,reward:'money',money:7600,rep:1},
    rumor:{label:'Information sensible',desc:'Un bruit circule. Le vérifier pourrait ouvrir une piste plus importante.',skill:'Discrétion',baseDifficulty:44,risk:22,reward:'lead',money:1000,rep:1},
    research:{label:'Problème à résoudre',desc:'Une tâche technique ou médicale réclame quelqu’un de compétent.',skill:'Science',baseDifficulty:40,risk:12,reward:'skill',money:2600,rep:2},
    contact:{label:'Contact intéressant',desc:'Une rencontre sans enjeu apparent pourrait enrichir ton réseau.',skill:'Commandement',baseDifficulty:32,risk:8,reward:'relation',money:0,rep:2},
    merchant:{label:'Affaire rapide',desc:'Un marchand propose une transaction limitée dans le temps.',skill:'Commandement',baseDifficulty:34,risk:12,reward:'money',money:3600,rep:1},
    work:{label:'Contrat ponctuel',desc:'Un travail court peut rapporter de l’argent et de l’expérience.',skill:'Commandement',baseDifficulty:30,risk:8,reward:'money',money:3000,rep:1},
    social:{label:'Invitation locale',desc:'Une occasion de sortir de la routine et de consolider tes liens.',skill:'Commandement',baseDifficulty:24,risk:4,reward:'relation',money:0,rep:1},
    patrol:{label:'Anomalie repérée',desc:'Une situation inhabituelle mérite une vérification rapide.',skill:'Discrétion',baseDifficulty:46,risk:30,reward:'reputation',money:1800,rep:3},
    crime:{label:'Coup opportuniste',desc:'Une cible vulnérable apparaît, mais l’échec attirera l’attention.',skill:'Discrétion',baseDifficulty:52,risk:52,reward:'money',money:9000,rep:-1}
  };

  const microEvents={
    breakthrough:{label:'Petit déclic',kind:'skill'},
    praise:{label:'Travail remarqué',kind:'reputation'},
    windfall:{label:'Bonne surprise',kind:'money'},
    fatigue:{label:'Routine fatigante',kind:'energy'},
    bond:{label:'Moment partagé',kind:'relation'},
    insight:{label:'Observation utile',kind:'skill'}
  };

  registry.register('dailyLifeDataV86',{version:'8.6.0',profiles,opportunities,microEvents});
})(window);
