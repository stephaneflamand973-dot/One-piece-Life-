(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const archetypes={
    strategist:{label:'Stratège',desc:'Préfère gagner avant le combat, en déplaçant alliances, ressources et objectifs.',growth:.92,survival:.16,heat:.7,actionWeights:{scheme:5,recruit:3,train:1,hunt:2}},
    juggernaut:{label:'Force implacable',desc:'Transforme chaque revers en prétexte pour devenir plus dangereux et revenir plus fort.',growth:1.18,survival:.10,heat:1.08,actionWeights:{scheme:1,recruit:2,train:5,hunt:4}},
    hunter:{label:'Chasseur',desc:'Se fixe sur une cible, apprend ses habitudes et revient lorsque le rapport de force lui paraît favorable.',growth:1.04,survival:.14,heat:1.15,actionWeights:{scheme:2,recruit:1,train:3,hunt:5}},
    zealot:{label:'Fanatique',desc:'Sa cause compte plus que sa propre sécurité. Les défaites augmentent souvent son obsession.',growth:1.03,survival:.05,heat:1.25,actionWeights:{scheme:2,recruit:3,train:2,hunt:5}},
    opportunist:{label:'Opportuniste',desc:'Change de rythme, d’alliés et parfois de région dès qu’une meilleure ouverture apparaît.',growth:.98,survival:.22,heat:.82,actionWeights:{scheme:4,recruit:2,train:2,hunt:3}},
    commander:{label:'Commandant',desc:'Sa vraie puissance vient de son organisation, de ses lieutenants et de la fidélité de ses forces.',growth:1.00,survival:.12,heat:.9,actionWeights:{scheme:3,recruit:5,train:2,hunt:2}},
    survivor:{label:'Survivant',desc:'Difficile à finir définitivement. Il recule, apprend et transforme la défaite en future revanche.',growth:1.08,survival:.28,heat:.96,actionWeights:{scheme:3,recruit:2,train:4,hunt:3}}
  };

  const factionArchetypes={
    Marine:['commander','strategist','hunter'],
    Pirates:['juggernaut','opportunist','survivor','commander'],
    Révolutionnaires:['strategist','zealot','survivor'],
    Gouvernement:['strategist','hunter','commander'],
    'Chasseurs de primes':['hunter','opportunist','survivor'],
    Civil:['opportunist','survivor']
  };

  const motivations={
    Marine:['Rétablir l’ordre','Écraser une menace pirate','Monter en grade','Protéger son unité'],
    Pirates:['Imposer son pavillon','Devenir une légende','Prendre un territoire','Vaincre tous ses rivaux'],
    Révolutionnaires:['Faire tomber une autorité','Libérer une région','Protéger un réseau','Prouver la cause'],
    Gouvernement:['Neutraliser une anomalie','Protéger un secret','Préserver le contrôle','Achever une opération'],
    'Chasseurs de primes':['Capturer une cible majeure','Dominer le marché des primes','Bâtir sa réputation','Régler une vieille dette'],
    Civil:['Protéger ses intérêts','Conserver son indépendance','Contrôler une route','Survivre au conflit']
  };

  const temperaments=['Froid','Calculateur','Orgueilleux','Patient','Impulsif','Méthodique','Charismatique','Inflexible','Prudent','Provocateur'];

  const lieutenantRoles={
    strategist:['Chef du renseignement','Négociateur','Saboteur'],
    juggernaut:['Bras droit','Combattant d’élite','Briseur de ligne'],
    hunter:['Pisteur','Tireur d’élite','Éclaireur'],
    zealot:['Fidèle absolu','Agitateur','Exécuteur'],
    opportunist:['Courtier','Mercenaire','Éclaireur'],
    commander:['Second','Chef d’unité','Officier tactique'],
    survivor:['Vétéran','Médecin de terrain','Éclaireur']
  };

  const firstNames=['Arden','Mira','Kael','Neris','Soren','Lyra','Renn','Iria','Toma','Mara','Dorian','Vera','Joren','Sila','Bram','Kira'];
  const lastNames=['Voss','Calder','Vale','Orlan','Kells','Morn','Holt','Venn','Sorel','Drake','Rusk','Aster','Kane','Drey','Nox','Varo'];

  const actions={
    scheme:{label:'Manœuvre stratégique',desc:'Déplace des ressources et force l’adversaire à réagir.',balance:3.4,stakes:2.0,heat:2},
    recruit:{label:'Recrutement',desc:'Renforce l’organisation et peut faire émerger un nouveau lieutenant.',balance:2.3,stakes:1.2,heat:1},
    train:{label:'Montée en puissance',desc:'Travaille directement sa puissance et celle de son cercle rapproché.',balance:1.5,stakes:1.0,heat:1},
    hunt:{label:'Traque personnelle',desc:'Cherche à atteindre le joueur ou un symbole adverse.',balance:2.6,stakes:3.0,heat:5}
  };

  const encounterChoices={
    direct:{label:'L’affronter',skill:'Combat',risk:4,impact:8,hint:'Un duel ou affrontement direct. Risque physique élevé, mais résultat clair.'},
    outmaneuver:{label:'Le déjouer',skill:'Discrétion',risk:2,impact:7,hint:'Renseignement, feinte et terrain. Tu cherches à gagner sans lui offrir le combat qu’il veut.'},
    command:{label:'Mobiliser ton réseau',skill:'Commandement',risk:2,impact:6,hint:'Tu opposes ton organisation, tes alliés et ta réputation à sa pression.'},
    avoid:{label:'Refuser l’affrontement',skill:'Navigation',risk:0,impact:0,hint:'Tu coupes le contact. La rivalité reste ouverte et son obsession peut monter.'}
  };

  const v80=registry.get('simulationCoreDataV80');
  if(v80&&!v80.interruptionKinds.nemesis)v80.interruptionKinds.nemesis={label:'Némésis',base:66,novelty:14};
  if(v80?.narrativeDomains?.relations?.patterns&&!v80.narrativeDomains.relations.patterns.includes('némésis'))v80.narrativeDomains.relations.patterns.push('némésis');
  if(v80?.narrativeDomains?.world?.patterns&&!v80.narrativeDomains.world.patterns.includes('antagoniste'))v80.narrativeDomains.world.patterns.push('antagoniste');
  if(v80?.legacyCategories?.rivalry?.patterns&&!v80.legacyCategories.rivalry.patterns.includes('némésis'))v80.legacyCategories.rivalry.patterns.push('némésis');

  registry.register('antagonistDataV83',{version:'8.3.0',archetypes,factionArchetypes,motivations,temperaments,lieutenantRoles,firstNames,lastNames,actions,encounterChoices});
})(window);
