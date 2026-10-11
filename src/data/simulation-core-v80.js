(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const interruptionKinds={
    consequence:{label:'Conséquence',base:66,novelty:10},
    education:{label:'Jeunesse',base:48,novelty:8},
    personal:{label:'Vie personnelle',base:52,novelty:9},
    agency:{label:'Décision de vie',base:46,novelty:7}
  };

  const narrativeDomains={
    combat:{label:'Combat & rivalité',patterns:['combat','victoire','défaite','duel','rival','affrontement','blessure']},
    career:{label:'Carrière & autorité',patterns:['promotion','carrière','rang','organisation','commandement','directive','mission','responsabilité']},
    world:{label:'Monde & canon',patterns:['historique','canon','monde','guerre','territoire','saga','faction','crise']},
    relation:{label:'Relations & foyer',patterns:['relation','famille','foyer','mentor','loyauté','partenaire','enfant','retrouvailles']},
    exploration:{label:'Voyage & découverte',patterns:['voyage','traversée','découverte','exploration','île','route','nouveau logement']},
    mastery:{label:'Maîtrise & progression',patterns:['haki','fruit','maîtrise','technique','formation','éducation','entraînement','breakthrough']},
    fortune:{label:'Patrimoine & ressources',patterns:['fortune','berry','actif','patrimoine','économie','logement','dette']}
  };

  const legacyCategories={
    exploit:{label:'Exploit',cap:18,patterns:['victoire','duel','affrontement','mission décisive','exploit','capitaine']},
    world:{label:'Impact mondial',cap:18,patterns:['historique','canon','impact mondial','saga','guerre','territoire','directive stratégique']},
    mastery:{label:'Maîtrise',cap:16,patterns:['haki','fruit','maîtrise','technique','breakthrough','formation','distinction']},
    leadership:{label:'Leadership',cap:16,patterns:['promotion','commandement','organisation','responsabilité','capitaine','directeur','cadre']},
    legacy:{label:'Héritage',cap:18,patterns:['héritage','jalon','fortune','actif durable','organisation durable','foyer agrandi']},
    relation:{label:'Liens historiques',cap:14,patterns:['mentor','relation','loyauté','famille','foyer','rival','partenaire']},
    exploration:{label:'Exploration',cap:14,patterns:['voyage','traversée','découverte','exploration','nouveau lieu','route']}
  };

  const renderDomains={
    life:['life'],
    actions:['actions'],
    character:['character'],
    abilities:['abilities'],
    relations:['relations'],
    world:['world']
  };

  registry.register('simulationCoreDataV80',{
    version:'8.0.0',interruptionKinds,narrativeDomains,legacyCategories,renderDomains
  });
})(window);
