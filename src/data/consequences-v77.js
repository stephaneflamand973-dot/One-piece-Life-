(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const consequenceTypes={
    favor:{
      label:'Faveur en retour',tone:'positive',delay:[4,18],severity:38,interactive:true,
      desc:'Quelqu’un se souvient de ce que tu as fait et peut revenir avec une proposition ou une dette morale inversée.',
      choices:{
        accept:{label:'Accepter la faveur',approach:'social',base:.78,success:{money:4500,careerXP:3,repLocal:2},fail:{repLocal:1}},
        bank:{label:'Garder cette faveur pour plus tard',approach:'command',base:.88,success:{favorToken:1,repLocal:1},fail:{favorToken:1}},
        refuse:{label:'Refuser poliment',approach:'social',base:.92,success:{repLocal:1},fail:{}}
      }
    },
    grudge:{
      label:'Rancune persistante',tone:'negative',delay:[3,14],severity:58,interactive:true,
      desc:'Une personne ou un groupe n’a pas oublié l’affront. Le problème revient avec plus de contexte et moins de patience.',
      choices:{
        confront:{label:'Affronter le problème',approach:'combat',base:.48,success:{repWorld:2,careerXP:3},fail:{health:-8,energy:-10,repLocal:-2}},
        deescalate:{label:'Désamorcer la situation',approach:'social',base:.58,success:{repLocal:2,repWorld:1},fail:{repLocal:-3}},
        ignore:{label:'L’ignorer',approach:'none',base:.30,success:{},fail:{repLocal:-4,worldInstability:3},spawn:'scrutiny'}
      }
    },
    scrutiny:{
      label:'Pression institutionnelle',tone:'negative',delay:[5,20],severity:52,interactive:true,
      desc:'Ton nom circule dans les rapports. Une faction ou une organisation veut comprendre si tu es un atout, un risque ou un problème.',
      choices:{
        cooperate:{label:'Jouer la transparence',approach:'discipline',base:.66,success:{standing:3,trust:4,repLocal:1},fail:{standing:-3,trust:-2}},
        deflect:{label:'Détourner l’attention',approach:'stealth',base:.48,success:{repWorld:1},fail:{standing:-5,trust:-4,worldInstability:2}},
        leverage:{label:'Utiliser ton influence',approach:'command',base:.55,success:{standing:4,influence:3},fail:{influence:-2,repLocal:-2}}
      }
    },
    debt:{
      label:'Dette à régler',tone:'negative',delay:[6,22],severity:46,interactive:true,
      desc:'Une dépense, une promesse ou un arrangement ancien arrive à échéance. Le monde a cette manie sordide de tenir une comptabilité.',
      choices:{
        pay:{label:'Payer maintenant',approach:'money',base:.98,success:{money:-7000,repLocal:1},fail:{money:-7000}},
        negotiate:{label:'Négocier un délai',approach:'social',base:.55,success:{money:-2500,repLocal:1},fail:{repLocal:-2},spawn:'debt'},
        refuse:{label:'Refuser de payer',approach:'command',base:.35,success:{repWorld:1},fail:{repLocal:-5,worldInstability:2},spawn:'grudge'}
      }
    },
    opportunity:{
      label:'Opportunité différée',tone:'positive',delay:[5,24],severity:44,interactive:true,
      desc:'Une ancienne décision ouvre une porte qui n’existait pas au moment où tu l’as prise.',
      choices:{
        seize:{label:'Saisir l’occasion',approach:'command',base:.62,success:{money:8000,careerXP:5,repWorld:2},fail:{energy:-8,repLocal:-1}},
        prepare:{label:'Préparer le terrain',approach:'discipline',base:.74,success:{careerXP:4,repLocal:2},fail:{energy:-4}},
        decline:{label:'Passer ton tour',approach:'none',base:.95,success:{},fail:{}}
      }
    },
    injury_echo:{
      label:'Séquelles d’un ancien combat',tone:'negative',delay:[2,10],severity:54,interactive:true,
      desc:'Une blessure mal refermée ou une faiblesse ancienne se rappelle à toi au pire moment possible.',
      choices:{
        rest:{label:'Prendre le temps de récupérer',approach:'discipline',base:.86,success:{health:7,energy:8},fail:{health:2}},
        treat:{label:'Chercher un traitement',approach:'money',base:.82,success:{money:-3500,health:10},fail:{money:-3500,health:3}},
        push:{label:'Continuer malgré tout',approach:'endurance',base:.42,success:{careerXP:3},fail:{health:-10,energy:-12}}
      }
    },
    rival_echo:{
      label:'Un rival revient',tone:'mixed',delay:[5,18],severity:61,interactive:true,
      desc:'Un affrontement passé a créé une trajectoire parallèle. Ton adversaire a progressé lui aussi.',
      choices:{
        duel:{label:'Accepter la confrontation',approach:'combat',base:.52,success:{repWorld:4,careerXP:4},fail:{health:-9,repWorld:-1}},
        outsmart:{label:'Le contourner',approach:'stealth',base:.56,success:{repWorld:2},fail:{repLocal:-2}},
        postpone:{label:'Reporter l’affrontement',approach:'social',base:.64,success:{},fail:{repLocal:-1},spawn:'rival_echo'}
      }
    },
    loyalty_call:{
      label:'Appel à la loyauté',tone:'mixed',delay:[4,16],severity:57,interactive:true,
      desc:'Une relation ou un allié te demande de transformer les mots en action.',
      choices:{
        answer:{label:'Répondre présent',approach:'social',base:.70,success:{repLocal:2,careerXP:2,relationTrust:7,relationLoyalty:8},fail:{energy:-6,relationTrust:2}},
        compromise:{label:'Aider sans tout risquer',approach:'command',base:.66,success:{relationTrust:4,relationLoyalty:3},fail:{relationTrust:-2}},
        refuse:{label:'Refuser',approach:'none',base:.94,success:{relationTrust:-5,relationLoyalty:-6},fail:{relationTrust:-7,relationLoyalty:-8},spawn:'grudge'}
      }
    },
    fruit_heat:{
      label:'Ton Fruit attire l’attention',tone:'negative',delay:[8,30],severity:64,interactive:true,
      desc:'Un pouvoir rare finit par attirer collectionneurs, pirates, agents ou opportunistes.',
      choices:{
        hide:{label:'Rester discret',approach:'stealth',base:.60,success:{repWorld:-1},fail:{worldInstability:2,repWorld:2}},
        exploit:{label:'Assumer publiquement ton pouvoir',approach:'command',base:.46,success:{repWorld:5,careerXP:3},fail:{repWorld:3,worldInstability:4},spawn:'rival_echo'},
        relocate:{label:'Changer temporairement de zone',approach:'navigation',base:.58,success:{energy:-4},fail:{energy:-8,repLocal:-2}}
      }
    },
    reputation_echo:{
      label:'Ta réputation te précède',tone:'mixed',delay:[4,18],severity:49,interactive:false,
      desc:'Un ancien succès ou échec continue de modifier la manière dont le monde réagit à ton nom.',
      auto:{success:{repWorld:2,repLocal:1},failure:{repWorld:-1,repLocal:-2}}
    }
  };

  const triggerMap={
    decision:{
      captain:['opportunity','scrutiny'],
      command:['scrutiny','opportunity'],
      shift:['scrutiny','loyalty_call'],
      fruit:['fruit_heat','reputation_echo'],
      v74arc:['loyalty_call','grudge'],
      v67crew:['loyalty_call','grudge'],
      hook:['reputation_echo','grudge'],
      default:['reputation_echo']
    },
    mission:{
      success:['reputation_echo','opportunity','rival_echo'],
      partial:['scrutiny','reputation_echo'],
      failure:['grudge','scrutiny','debt'],
      retreat:['scrutiny','rival_echo']
    },
    combat:{
      decisive:['rival_echo','reputation_echo'],
      win:['rival_echo'],
      defeat:['injury_echo','rival_echo'],
      retreat:['rival_echo']
    },
    world:{
      success:['opportunity','reputation_echo'],
      failure:['grudge','scrutiny']
    },
    social:{
      positive:['loyalty_call','favor'],
      negative:['grudge','scrutiny']
    }
  };

  const severityLabels=[
    {min:75,label:'Critique'},
    {min:58,label:'Élevée'},
    {min:42,label:'Modérée'},
    {min:0,label:'Faible'}
  ];

  registry.register('consequenceDataV77',{version:'7.7.0',consequenceTypes,triggerMap,severityLabels});
})(window);
