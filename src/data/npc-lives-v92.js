(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

const phases={
  recovering:{label:'En récupération',tone:'fragile'},
  rising:{label:'Figure montante',tone:'rising'},
  established:{label:'Figure établie',tone:'steady'},
  major:{label:'Puissance majeure',tone:'major'},
  veteran:{label:'Vétéran influent',tone:'veteran'},
  legend:{label:'Légende mondiale',tone:'legend'},
  fallen:{label:'Trajectoire interrompue',tone:'fallen'}
};

const careerTiers=[
  {id:0,label:'Début de trajectoire'},
  {id:1,label:'Acteur local'},
  {id:2,label:'Professionnel reconnu'},
  {id:3,label:'Cadre influent'},
  {id:4,label:'Figure majeure'},
  {id:5,label:'Autorité mondiale'}
];

const objectives={
  protect_routes:{label:'Sécuriser les routes',desc:'Protéger les routes et stabiliser la présence de sa faction.',factions:['Marine'],tags:['protect','influence']},
  hunt_threats:{label:'Neutraliser des menaces',desc:'Traquer des adversaires qui menacent l’équilibre régional.',factions:['Marine','Chasseurs de primes'],tags:['combat','hunt']},
  command_growth:{label:'Prendre plus de responsabilités',desc:'Accumuler l’expérience et l’autorité nécessaires pour peser davantage.',factions:['Marine','Gouvernement'],tags:['career','influence']},
  train_next:{label:'Former la relève',desc:'Transformer son expérience en influence durable auprès des plus jeunes.',factions:['Marine'],tags:['social','legacy']},
  build_power:{label:'Renforcer sa puissance',desc:'Chercher un nouveau palier personnel avant les prochains grands affrontements.',factions:['Pirates','Indépendant'],tags:['combat','mastery']},
  grow_reputation:{label:'Accroître sa réputation',desc:'Faire parler de soi et imposer davantage son nom dans le monde.',factions:['Pirates','Indépendant','Civil'],tags:['influence','legacy']},
  seek_advantage:{label:'Trouver un avantage stratégique',desc:'Chercher un territoire, un objet, une information ou un allié capable de changer la donne.',factions:['Pirates','Gouvernement'],tags:['explore','influence']},
  expand_influence:{label:'Élargir son influence',desc:'Étendre sa présence et son réseau au-delà de sa zone habituelle.',factions:['Pirates','Révolutionnaires','Gouvernement'],tags:['travel','influence']},
  build_network:{label:'Développer un réseau',desc:'Créer des relais capables d’agir même loin de sa position actuelle.',factions:['Révolutionnaires','Civil','Indépendant'],tags:['social','influence']},
  protect_cell:{label:'Protéger une cellule',desc:'Préserver ses alliés et éviter qu’une opération ne détruise le réseau local.',factions:['Révolutionnaires'],tags:['protect','covert']},
  weaken_government:{label:'Affaiblir le Gouvernement',desc:'Transformer les failles régionales en opportunités politiques.',factions:['Révolutionnaires'],tags:['covert','influence']},
  prepare_operation:{label:'Préparer une opération',desc:'Accumuler informations, contacts et positionnement avant une action majeure.',factions:['Révolutionnaires','Gouvernement'],tags:['covert','career']},
  gather_intel:{label:'Collecter du renseignement',desc:'Comprendre les menaces avant d’engager les ressources de l’organisation.',factions:['Gouvernement'],tags:['intel','covert']},
  protect_secret:{label:'Protéger un secret',desc:'Empêcher une information sensible de modifier le rapport de force.',factions:['Gouvernement'],tags:['covert','protect']},
  mastery:{label:'Se perfectionner',desc:'Poursuivre une maîtrise personnelle sans dépendre d’une organisation.',factions:['Indépendant','Civil'],tags:['mastery']},
  explore:{label:'Explorer',desc:'Chercher des lieux, des savoirs et des opportunités hors des routes habituelles.',factions:['Indépendant','Civil'],tags:['travel','explore']},
  pursue_rival:{label:'Poursuivre un rival',desc:'Faire évoluer une rivalité suffisamment importante pour structurer une partie de sa vie.',factions:['Indépendant','Pirates','Chasseurs de primes'],tags:['combat','rivalry']},
  build_resources:{label:'Consolider ses ressources',desc:'Créer une base matérielle suffisamment solide pour soutenir ses prochains choix.',factions:['Civil','Indépendant','Pirates','Chasseurs de primes'],tags:['wealth','career']},
  deepen_bonds:{label:'Renforcer ses alliances',desc:'Transformer quelques relations importantes en véritables appuis durables.',factions:['*'],tags:['social','protect']},
  recover:{label:'Se reconstruire',desc:'Récupérer après une blessure ou une série de revers avant de reprendre l’initiative.',factions:['*'],tags:['recover']}
};

const factionFallback={
  Marine:['protect_routes','hunt_threats','command_growth','train_next'],
  Pirates:['build_power','grow_reputation','seek_advantage','expand_influence','build_resources'],
  Révolutionnaires:['build_network','protect_cell','weaken_government','prepare_operation'],
  Gouvernement:['gather_intel','protect_secret','prepare_operation','command_growth'],
  'Chasseurs de primes':['hunt_threats','pursue_rival','grow_reputation','build_resources'],
  Civil:['mastery','explore','build_resources','build_network'],
  Indépendant:['mastery','explore','pursue_rival','build_power','build_resources']
};

const actionEffects={
  move:{momentum:1,renown:.4,progress:8,influence:.5,wealth:-.3,stress:1,career:1,kind:'travel'},
  clash_win:{momentum:8,renown:4,progress:18,influence:2.5,wealth:1,stress:4,career:8,kind:'combat'},
  clash_loss:{momentum:-10,renown:-1,progress:3,influence:-1,wealth:-1.5,stress:9,career:-2,kind:'setback'},
  cooperate:{momentum:4,renown:1.5,progress:12,influence:3,wealth:.4,stress:-2,career:5,kind:'social'},
  influence:{momentum:5,renown:2.5,progress:15,influence:4,wealth:.8,stress:1,career:6,kind:'influence'},
  fruit:{momentum:7,renown:3,progress:18,influence:1.5,wealth:2,stress:2,career:4,kind:'advantage'},
  recover:{momentum:4,renown:0,progress:14,influence:0,wealth:-.5,stress:-10,career:1,kind:'recover'},
  goal_change:{momentum:1,renown:0,progress:5,influence:.3,wealth:0,stress:0,career:2,kind:'career'},
  career_step:{momentum:6,renown:2,progress:12,influence:3,wealth:2,stress:2,career:15,kind:'career'},
  setback:{momentum:-6,renown:-.5,progress:2,influence:-.5,wealth:-1,stress:8,career:-3,kind:'setback'}
};

const sourceLabels={world:'Monde',relation:'Relation',nemesis:'Némésis',crew:'Équipage'};

registry.register('npcLivesDataV92',{version:'9.2.0',phases,careerTiers,objectives,factionFallback,actionEffects,sourceLabels});
})(window);
