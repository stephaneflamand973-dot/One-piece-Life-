(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const phases=[
    {id:'tension',label:'Tensions',threshold:0,baseDifficulty:48,importance:54},
    {id:'escalation',label:'Escalade',threshold:42,baseDifficulty:58,importance:64},
    {id:'climax',label:'Point de rupture',threshold:68,baseDifficulty:70,importance:78},
    {id:'aftermath',label:'Dénouement',threshold:88,baseDifficulty:62,importance:72}
  ];

  const archetypes={
    pirate_front:{
      label:'Guerre de pavillons',
      desc:'Équipages, autorités et réseaux locaux se disputent les routes, les ports et la réputation régionale.',
      types:['combat','patrol','escort'],
      verbs:{incumbent:'contenir',challenger:'renverser',independent:'survivre au conflit'}
    },
    crackdown:{
      label:'Campagne de répression',
      desc:'Une puissance institutionnelle resserre son contrôle tandis qu’un réseau adverse cherche à préserver son implantation.',
      types:['covert','patrol','combat'],
      verbs:{incumbent:'maintenir le contrôle',challenger:'briser l’étau',independent:'protéger ses intérêts'}
    },
    uprising:{
      label:'Soulèvement régional',
      desc:'Cellules clandestines, autorités et habitants font basculer une tension politique en lutte ouverte pour l’influence.',
      types:['covert','escort','combat'],
      verbs:{incumbent:'préserver l’ordre',challenger:'étendre le soulèvement',independent:'protéger la population'}
    },
    hunt:{
      label:'Grande chasse',
      desc:'Une concentration de primes, de cibles et de chasseurs transforme la région en territoire de traque.',
      types:['combat','patrol','covert'],
      verbs:{incumbent:'tenir le réseau',challenger:'prendre le marché',independent:'sécuriser les routes'}
    },
    shadow_conflict:{
      label:'Guerre de l’ombre',
      desc:'Renseignement, opérations discrètes et luttes d’influence redessinent la région avant même que le public comprenne la crise.',
      types:['covert','work','escort'],
      verbs:{incumbent:'protéger le réseau',challenger:'infiltrer le pouvoir',independent:'rester hors du piège'}
    },
    territory:{
      label:'Conflit territorial',
      desc:'Deux puissances régionales transforment leurs projets concurrents en campagne durable pour le contrôle local.',
      types:['combat','escort','patrol'],
      verbs:{incumbent:'défendre la position',challenger:'gagner du terrain',independent:'limiter les dégâts'}
    }
  };

  const regionFlavor={
    'East Blue':{
      stakes:'ports, villages et routes commerciales',
      figures:['Capitaine de port','Médecin itinérant','Navigatrice locale','Chef de milice'],
      bosses:['Commandant renégat','Capitaine pirate','Courtier criminel','Officier corrompu']
    },
    'North Blue':{
      stakes:'réseaux d’information, industrie et routes froides',
      figures:['Informateur du Nord','Ingénieure locale','Chef de convoi','Ancien soldat'],
      bosses:['Chef de réseau','Commandant de flotte','Scientifique clandestin','Seigneur de guerre']
    },
    'West Blue':{
      stakes:'familles puissantes, marchés et voies maritimes',
      figures:['Négociatrice locale','Protecteur de quartier','Capitaine marchand','Archiviste'],
      bosses:['Parrain régional','Corsaire local','Chef mercenaire','Agent clandestin']
    },
    'South Blue':{
      stakes:'archipels, ressources et communautés isolées',
      figures:['Guide insulaire','Capitaine de pêche','Médecin de terrain','Chef communautaire'],
      bosses:['Pilleur des mers','Commandant brutal','Chef contrebandier','Mercenaire insulaire']
    },
    'Grand Line':{
      stakes:'routes stratégiques, îles majeures et passages vitaux',
      figures:['Navigateur vétéran','Chef de résistance','Officier local','Courtier indépendant'],
      bosses:['Supernova rival','Commandant d’élite','Seigneur criminel','Agent spécial']
    },
    'New World':{
      stakes:'territoires d’Empereurs, alliances et routes extrêmes',
      figures:['Commandant dissident','Chef d’alliance','Capitaine vétéran','Éclaireur du Nouveau Monde'],
      bosses:['Commandant impérial','Capitaine du Nouveau Monde','Bras droit de flotte','Seigneur territorial']
    }
  };

  const tactics={
    incumbent:{label:'Soutenir le camp dominant',skill:'Commandement',hint:'Tu aides le pouvoir actuellement installé à conserver la région.',side:'incumbent'},
    challenger:{label:'Soutenir le challenger',skill:'Combat',hint:'Tu aides la puissance montante à faire basculer le rapport de force.',side:'challenger'},
    independent:{label:'Défendre tes propres intérêts',skill:'Discrétion',hint:'Tu refuses de devenir l’outil d’un camp et cherches surtout à limiter ton exposition.',side:'independent'},
    direct:{label:'Intervenir frontalement',skill:'Combat',hint:'Impact élevé, exposition élevée.',risk:4,impact:9},
    coordinate:{label:'Coordonner les forces',skill:'Commandement',hint:'Moins spectaculaire, mais très efficace si ton autorité suit.',risk:3,impact:8},
    covert:{label:'Saboter et désorganiser',skill:'Discrétion',hint:'Impact indirect avec une exposition plus contrôlée.',risk:2,impact:7},
    preserve:{label:'Protéger les civils et les ressources',skill:'Commandement',hint:'Réduit les dégâts régionaux plutôt que de chercher un vainqueur immédiat.',risk:2,impact:4,stability:8},
    withdraw:{label:'Rester en marge',skill:'Navigation',hint:'Tu refuses d’augmenter ton exposition dans cette phase.',risk:0,impact:0}
  };

  const v80=registry.get('simulationCoreDataV80');
  if(v80&&!v80.interruptionKinds.campaign)v80.interruptionKinds.campaign={label:'Saga régionale',base:60,novelty:10};

  registry.register('campaignDataV82',{version:'8.2.0',phases,archetypes,regionFlavor,tactics});
})(window);
