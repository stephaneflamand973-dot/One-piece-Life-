(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const organizations={
    Marine:{
      label:'Marine',
      branches:[
        {id:'frontline',label:'Ligne de front',desc:'Interventions, arrestations et présence militaire.',skills:['Combat','Commandement'],stats:['Discipline','Résistance'],missions:['combat','patrol','escort']},
        {id:'command',label:'Commandement',desc:'Encadrement d’unités, discipline et opérations coordonnées.',skills:['Commandement','Combat'],stats:['Discipline','Volonté'],missions:['escort','patrol','work']},
        {id:'intelligence',label:'Renseignement',desc:'Enquête, surveillance et opérations discrètes.',skills:['Discrétion','Commandement'],stats:['Réflexes','Discipline'],missions:['covert','patrol','work']}
      ]
    },
    Pirates:{
      label:'Équipage pirate',
      branches:[
        {id:'vanguard',label:'Avant-garde',desc:'Combattre, protéger l’équipage et imposer le pavillon.',skills:['Combat','Commandement'],stats:['Force','Résistance'],missions:['combat','crime']},
        {id:'exploration',label:'Exploration',desc:'Navigation, routes risquées et recherche d’opportunités.',skills:['Navigation','Discrétion'],stats:['Réflexes','Agilité'],missions:['explore','navigation','crime']},
        {id:'crew_command',label:'Commandement d’équipage',desc:'Leadership, cohésion et décisions collectives.',skills:['Commandement','Navigation'],stats:['Volonté','Discipline'],missions:['escort','work','combat']}
      ]
    },
    'Chasseurs de primes':{
      label:'Réseau de chasseurs',
      branches:[
        {id:'tracker',label:'Traque',desc:'Localisation, approche et capture méthodique des cibles.',skills:['Discrétion','Combat'],stats:['Réflexes','Discipline'],missions:['combat','patrol','covert']},
        {id:'duelist',label:'Duel',desc:'Neutraliser les cibles dangereuses par supériorité martiale.',skills:['Combat','Sabre','Tir'],stats:['Vitesse','Résistance'],missions:['combat']},
        {id:'broker',label:'Réseau de contrats',desc:'Informations, négociation et sélection des meilleures primes.',skills:['Commandement','Discrétion'],stats:['Discipline','Volonté'],missions:['work','covert','patrol']}
      ]
    },
    Révolutionnaires:{
      label:'Armée révolutionnaire',
      branches:[
        {id:'operations',label:'Opérations',desc:'Sabotage, extraction et actions de terrain.',skills:['Discrétion','Combat'],stats:['Volonté','Réflexes'],missions:['covert','combat','escort']},
        {id:'intelligence',label:'Renseignement',desc:'Réseaux clandestins, informations et infiltration.',skills:['Discrétion','Commandement'],stats:['Discipline','Réflexes'],missions:['covert','work']},
        {id:'organization',label:'Organisation',desc:'Former des cellules, coordonner les alliés et étendre le réseau.',skills:['Commandement','Discrétion'],stats:['Volonté','Discipline'],missions:['escort','work','covert']}
      ]
    },
    Gouvernement:{
      label:'Gouvernement Mondial',
      branches:[
        {id:'cipher',label:'Opérations Cipher',desc:'Infiltration, neutralisation et missions spéciales.',skills:['Discrétion','Combat'],stats:['Discipline','Réflexes'],missions:['covert','combat']},
        {id:'intelligence',label:'Renseignement',desc:'Surveillance, analyse et récupération d’informations.',skills:['Discrétion','Science'],stats:['Discipline','Volonté'],missions:['covert','work']},
        {id:'administration',label:'Administration stratégique',desc:'Coordination, logistique et contrôle des opérations.',skills:['Commandement','Science'],stats:['Discipline','Volonté'],missions:['work','escort']}
      ]
    },
    Civil:{
      label:'Réseau professionnel',
      branches:[
        {id:'expertise',label:'Expertise',desc:'Approfondir la maîtrise de son métier et sa réputation technique.',skills:['Science','Médecine'],stats:['Discipline','Volonté'],missions:['medicine','work']},
        {id:'commerce',label:'Commerce & réseau',desc:'Développer les contrats, les contacts et les ressources.',skills:['Commandement','Navigation'],stats:['Discipline','Volonté'],missions:['work','navigation']},
        {id:'exploration',label:'Exploration',desc:'Voyages, navigation et opportunités hors des circuits habituels.',skills:['Navigation','Discrétion'],stats:['Réflexes','Agilité'],missions:['explore','navigation']}
      ]
    }
  };

  const responsibilities=[
    {id:'member',label:'Membre opérationnel',minAuthority:0,minStanding:0,missionBonus:0,delegation:0},
    {id:'specialist',label:'Spécialiste reconnu',minAuthority:28,minStanding:38,missionBonus:1.5,delegation:0},
    {id:'team_lead',label:'Chef d’équipe',minAuthority:43,minStanding:48,missionBonus:3,delegation:1},
    {id:'unit_lead',label:'Responsable d’unité',minAuthority:58,minStanding:60,missionBonus:4.5,delegation:2},
    {id:'strategic',label:'Cadre stratégique',minAuthority:74,minStanding:72,missionBonus:6,delegation:3}
  ];

  const internalActions={
    field:{label:'Faire tes preuves sur le terrain',desc:'Standing en hausse si ta carrière repose sur les résultats.',standing:5,trust:2,influence:0,discipline:1,xp:3,risk:2},
    network:{label:'Développer ton réseau interne',desc:'Influence et confiance augmentent, avec moins de progression brute.',standing:2,trust:4,influence:5,discipline:0,xp:1,risk:0},
    discipline:{label:'Miser sur la fiabilité',desc:'Discipline et confiance, utile pour les organisations hiérarchiques.',standing:2,trust:5,influence:1,discipline:5,xp:1,risk:0},
    ambition:{label:'Revendiquer plus de responsabilités',desc:'Influence rapide mais peut coûter en confiance si le dossier est faible.',standing:3,trust:-2,influence:7,discipline:0,xp:2,risk:3}
  };

  registry.register('careerOrganizationsV73',{version:'7.3.0',organizations,responsibilities,internalActions});
})(window);
