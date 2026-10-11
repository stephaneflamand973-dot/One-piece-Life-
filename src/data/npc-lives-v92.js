(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

const phases={
  recovering:{label:'En récupération',tone:'fragile'},
  rising:{label:'Figure montante',tone:'rising'},
  established:{label:'Figure établie',tone:'steady'},
  major:{label:'Figure majeure',tone:'major'},
  veteran:{label:'Vétéran influent',tone:'veteran'},
  legend:{label:'Légende',tone:'legend'},
  retired:{label:'Retraité',tone:'retired'},
  fallen:{label:'Trajectoire interrompue',tone:'fallen'}
};

const objectives={
  protect_routes:{label:'Sécuriser les routes',tags:['work','protect'],factions:['Marine']},
  hunt_threats:{label:'Neutraliser des menaces',tags:['risk','combat'],factions:['Marine','Chasseurs de primes']},
  command_growth:{label:'Prendre plus de responsabilités',tags:['work','network'],factions:['Marine','Gouvernement']},
  train_next:{label:'Former la relève',tags:['network','legacy'],factions:['Marine']},
  build_power:{label:'Renforcer sa puissance',tags:['train','risk'],factions:['Pirates','Indépendant']},
  grow_reputation:{label:'Accroître sa réputation',tags:['risk','network'],factions:['Pirates','Indépendant','Chasseurs de primes']},
  seek_advantage:{label:'Trouver un avantage stratégique',tags:['travel','risk'],factions:['Pirates','Gouvernement']},
  expand_influence:{label:'Élargir son influence',tags:['travel','network'],factions:['Pirates','Révolutionnaires','Gouvernement']},
  build_network:{label:'Développer un réseau',tags:['network','work'],factions:['Révolutionnaires']},
  protect_cell:{label:'Protéger une cellule',tags:['work','protect'],factions:['Révolutionnaires']},
  weaken_government:{label:'Affaiblir le Gouvernement',tags:['risk','network'],factions:['Révolutionnaires']},
  prepare_operation:{label:'Préparer une opération',tags:['work','network'],factions:['Révolutionnaires','Gouvernement']},
  gather_intel:{label:'Collecter du renseignement',tags:['work','travel'],factions:['Gouvernement']},
  protect_secret:{label:'Protéger un secret',tags:['work','protect'],factions:['Gouvernement']},
  mastery:{label:'Se perfectionner',tags:['train'],factions:['Indépendant','Civil']},
  explore:{label:'Explorer',tags:['travel'],factions:['Indépendant','Civil']},
  pursue_rival:{label:'Poursuivre un rival',tags:['risk','combat'],factions:['Indépendant','Pirates','Chasseurs de primes']},
  prosperity:{label:'Construire sa réussite',tags:['work','network'],factions:['Civil']},
  recover:{label:'Se reconstruire',tags:['recover'],factions:['*']}
};

const factionFallback={
  Marine:['protect_routes','hunt_threats','command_growth','train_next'],
  Pirates:['build_power','grow_reputation','seek_advantage','expand_influence'],
  Révolutionnaires:['build_network','protect_cell','weaken_government','prepare_operation'],
  Gouvernement:['gather_intel','protect_secret','prepare_operation','command_growth'],
  'Chasseurs de primes':['hunt_threats','pursue_rival','grow_reputation'],
  Civil:['prosperity','mastery','explore'],
  Indépendant:['mastery','explore','pursue_rival','build_power']
};

const careers={
  Marine:{profession:'Marine',ranks:['Recrue','Matelot','Caporal','Sergent','Lieutenant','Commandant','Vice-Amiral']},
  Pirates:{profession:'Pirate',ranks:['Moussaillon','Membre','Vétéran','Officier','Bras droit','Capitaine']},
  Révolutionnaires:{profession:'Révolutionnaire',ranks:['Recrue','Agent','Responsable','Commandant','Cadre majeur']},
  Gouvernement:{profession:'Agent du Gouvernement',ranks:['Agent','Superviseur','Officier','Directeur','Haut responsable']},
  'Chasseurs de primes':{profession:'Chasseur de primes',ranks:['Débutant','Chasseur','Vétéran','Expert','Légende']},
  Civil:{profession:'Professionnel',ranks:['Débutant','Confirmé','Expert','Référence','Maître']},
  Indépendant:{profession:'Indépendant',ranks:['Débutant','Confirmé','Expert','Référence','Maître']}
};

const regions=['East Blue','North Blue','West Blue','South Blue','Grand Line','New World'];
const regionRoutes={
  'East Blue':['Grand Line','South Blue'],
  'North Blue':['Grand Line','West Blue'],
  'West Blue':['Grand Line','North Blue'],
  'South Blue':['Grand Line','East Blue'],
  'Grand Line':['East Blue','North Blue','West Blue','South Blue','New World'],
  'New World':['Grand Line']
};

const actionEffects={
  work:{momentum:3,renown:1.2,objective:9,careerXP:[8,15],wealth:[1200,5200]},
  train:{momentum:4,renown:.7,objective:11,power:[.4,1.7],careerXP:[2,6]},
  travel:{momentum:2,renown:.5,objective:10,careerXP:[1,4]},
  network:{momentum:3,renown:1.5,objective:10,careerXP:[4,9],wealth:[400,2200]},
  risk:{momentum:0,renown:2.4,objective:13,careerXP:[4,11],wealth:[-800,5000]},
  recover:{momentum:2,renown:0,objective:8,condition:[7,16]},
  support:{momentum:3,renown:1.1,objective:11,careerXP:[3,8]}
};

const ambitionWeights={
  Maîtrise:{train:5,work:2,travel:1,network:1,risk:2,recover:1,support:1},
  Influence:{network:5,work:4,travel:2,risk:2,train:1,recover:1,support:2},
  Fortune:{work:5,network:3,travel:2,risk:2,train:1,recover:1,support:1},
  Aventure:{travel:5,risk:4,train:2,network:2,work:1,recover:1,support:1},
  Liberté:{travel:5,risk:3,train:2,network:1,work:1,recover:1,support:1},
  Loyauté:{support:5,network:4,work:2,train:2,travel:1,risk:1,recover:1},
  power:{train:5,risk:4,work:2,travel:2,network:1,recover:1,support:1},
  wealth:{work:5,network:4,travel:2,risk:2,train:1,recover:1,support:1},
  protect:{support:5,work:3,train:2,network:3,risk:2,travel:1,recover:1},
  explore:{travel:5,risk:2,network:2,train:1,work:1,recover:1,support:1},
  legacy:{work:4,network:4,risk:3,train:2,travel:2,recover:1,support:2}
};

registry.register('npcLivesDataV92',{
  version:'9.2.0',phases,objectives,factionFallback,careers,regions,regionRoutes,actionEffects,ambitionWeights
});
})(window);
