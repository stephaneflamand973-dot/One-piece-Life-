(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const regions=['East Blue','North Blue','West Blue','South Blue','Grand Line','New World'];

  const regionLinks={
    'East Blue':['Grand Line','South Blue','North Blue'],
    'North Blue':['Grand Line','East Blue','West Blue'],
    'West Blue':['Grand Line','North Blue','South Blue'],
    'South Blue':['Grand Line','West Blue','East Blue'],
    'Grand Line':['East Blue','North Blue','West Blue','South Blue','New World'],
    'New World':['Grand Line']
  };

  const factionProfiles={
    Pirates:{mobility:1.15,conflict:1.18,cooperate:.70,influence:1.10,fruit:1.18,recover:.72},
    Marine:{mobility:.90,conflict:1.06,cooperate:.88,influence:1.22,fruit:.35,recover:.84},
    Révolutionnaires:{mobility:1.02,conflict:.72,cooperate:1.05,influence:1.30,fruit:.48,recover:.86},
    Gouvernement:{mobility:.82,conflict:.82,cooperate:.74,influence:1.36,fruit:.58,recover:.90},
    'Chasseurs de primes':{mobility:1.08,conflict:1.14,cooperate:.52,influence:.62,fruit:.72,recover:.78},
    Civil:{mobility:.80,conflict:.28,cooperate:1.08,influence:.76,fruit:.30,recover:1.02}
  };

  const factionRelations={
    Marine:{Pirates:-80,Révolutionnaires:-65,Gouvernement:65,'Chasseurs de primes':20,Civil:35,Marine:55},
    Pirates:{Marine:-80,Révolutionnaires:5,Gouvernement:-75,'Chasseurs de primes':-55,Civil:-5,Pirates:-12},
    Révolutionnaires:{Marine:-65,Pirates:5,Gouvernement:-90,'Chasseurs de primes':-10,Civil:30,Révolutionnaires:60},
    Gouvernement:{Marine:65,Pirates:-75,Révolutionnaires:-90,'Chasseurs de primes':15,Civil:20,Gouvernement:55},
    'Chasseurs de primes':{Marine:20,Pirates:-55,Révolutionnaires:-10,Gouvernement:15,Civil:8,'Chasseurs de primes':0},
    Civil:{Marine:35,Pirates:-5,Révolutionnaires:30,Gouvernement:20,'Chasseurs de primes':8,Civil:35}
  };

  const actionLabels={
    move:'Déplacement stratégique',
    clash:'Affrontement hors écran',
    cooperate:'Coopération',
    influence:'Pression territoriale',
    fruit:'Recherche de Fruit',
    recover:'Repli et récupération'
  };

  const eventAnchors={
    alabasta_crisis:{characters:['crocodile'],crews:[]},
    water7_government:{characters:['robin'],crews:['straw_hat']},
    enies_lobby_clash:{characters:['robin','lucci'],crews:['straw_hat']},
    ace_capture:{characters:['ace'],crews:['whitebeard_crew']},
    marineford_war:{characters:['ace','whitebeard'],crews:['whitebeard_crew']},
    sabaody_collision:{characters:['luffy'],crews:['straw_hat']},
    dressrosa_upheaval:{characters:['doflamingo'],crews:['donquixote_family']},
    yonko_conflict:{characters:['luffy'],crews:['straw_hat']},
    wano_war:{characters:['kaido','luffy'],crews:['beasts','straw_hat']},
    cross_guild_rise:{characters:[],crews:['cross_guild']},
    egghead_incident:{characters:['luffy'],crews:['straw_hat']}
  };

  const fruitReleaseRules={
    deadHolder:'release',
    dissolvedCrew:'release',
    defaultRegion:'Global'
  };

  registry.register('worldCanonDataV75',{
    version:'7.5.0',regions,regionLinks,factionProfiles,factionRelations,actionLabels,eventAnchors,fruitReleaseRules
  });
})(window);
