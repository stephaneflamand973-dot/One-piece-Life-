(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const modes={
    standard:{label:'Route normale',desc:'Équilibre vitesse, prudence et consommation.',duration:1,risk:1,wear:1,discovery:1},
    cautious:{label:'Navigation prudente',desc:'Plus lente, mais réduit nettement les incidents et l’usure.',duration:1.18,risk:.72,wear:.72,discovery:.9},
    fast:{label:'Forcer l’allure',desc:'Arrivée plus rapide, au prix d’un risque et d’une usure supérieurs.',duration:.80,risk:1.28,wear:1.35,discovery:.72},
    explore:{label:'Route d’exploration',desc:'Détours volontaires pour cartographier, chercher des pistes et découvrir la mer.',duration:1.15,risk:1.08,wear:1.08,discovery:1.85}
  };

  const weather={
    calm:{label:'Mer calme',progress:1.10,risk:.72,wear:.70},
    fair:{label:'Vent favorable',progress:1.22,risk:.82,wear:.82},
    variable:{label:'Temps changeant',progress:1,risk:1,wear:1},
    fog:{label:'Brouillard dense',progress:.82,risk:1.18,wear:1.05},
    current:{label:'Courants violents',progress:.90,risk:1.28,wear:1.12},
    storm:{label:'Tempête',progress:.68,risk:1.65,wear:1.55},
    cyclone:{label:'Cyclone',progress:.52,risk:2.10,wear:2.05},
    freezing:{label:'Froid extrême',progress:.82,risk:1.26,wear:1.18},
    heat:{label:'Chaleur écrasante',progress:.88,risk:1.14,wear:1.04}
  };

  const regionWeather={
    'East Blue':[['calm',34],['fair',28],['variable',24],['fog',8],['storm',6]],
    'North Blue':[['variable',24],['fog',22],['freezing',18],['fair',15],['storm',14],['calm',7]],
    'West Blue':[['variable',28],['fair',22],['fog',18],['calm',17],['storm',15]],
    'South Blue':[['fair',28],['calm',22],['heat',20],['variable',18],['storm',12]],
    'Grand Line':[['variable',22],['current',20],['storm',18],['fog',14],['fair',10],['freezing',8],['heat',8]],
    'New World':[['storm',23],['current',20],['variable',18],['cyclone',14],['fog',10],['fair',8],['freezing',4],['heat',3]]
  };

  const hazards={
    storm:{label:'Mer démontée',severity:52,weight:24,kind:'weather'},
    pirates:{label:'Équipage hostile',severity:58,weight:20,kind:'combat'},
    marine:{label:'Patrouille maritime',severity:42,weight:14,kind:'faction'},
    seaKing:{label:'Roi des Mers',severity:72,weight:10,kind:'combat'},
    reef:{label:'Récif dangereux',severity:46,weight:12,kind:'ship'},
    current:{label:'Courant incontrôlable',severity:44,weight:10,kind:'navigation'},
    merchant:{label:'Navire marchand',severity:15,weight:10,kind:'opportunity'}
  };

  const discoveries={
    chart:{label:'Donnée cartographique',reward:'navigation'},
    treasure:{label:'Trésor secondaire',reward:'money'},
    ruin:{label:'Vestige oublié',reward:'lore'},
    resource:{label:'Ressource rare',reward:'money'},
    contact:{label:'Contact local',reward:'reputation'},
    lead:{label:'Piste rare',reward:'lead'},
    technique:{label:'Savoir pratique',reward:'skill'}
  };

  const poseTiers={
    0:{label:'Navigation classique',desc:'Boussole et cartes ordinaires.'},
    1:{label:'Log Pose',desc:'Permet de stabiliser les routes de Grand Line.'},
    2:{label:'Log Pose avancé',desc:'Lecture plus fiable des routes du Nouveau Monde.'}
  };

  registry.register('voyageDataV85',{version:'8.5.0',modes,weather,regionWeather,hazards,discoveries,poseTiers});
})(window);
