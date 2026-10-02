(function(global){
  'use strict';
  const registry=global.OPL_MODULES;
  if(!registry)throw new Error('OPL module registry must load before arc definitions');

  const arcs={
    enies_lobby_clash:{
      title:"Crise d’Enies Lobby",
      subtitle:"Une opération gouvernementale devient un affrontement dont l’issue peut marquer durablement les relations entre pirates et Gouvernement.",
      region:"Grand Line",minScore:44,related:["robin","lucci","kaku"],
      roles:{Marine:"Force d’intervention",Gouvernement:"Agent opérationnel",Pirates:"Intervenant pirate",Révolutionnaires:"Saboteur opportuniste",Civil:"Témoin impliqué","Chasseurs de primes":"Contractuel indépendant"},
      stages:[
        {id:"approach",title:"La forteresse se ferme",text:"Les accès se verrouillent pendant que plusieurs groupes convergent vers le même objectif.",choices:[
          {id:"breach",label:"Forcer le passage",hint:"Combat et audace. Rapide, visible, dangereux.",skill:"Combat",difficulty:62,risk:3,impact:2,alignment:"freedom",factions:["Pirates","Révolutionnaires"],relations:{robin:{trust:5,respect:4},lucci:{rivalry:5}}},
          {id:"contain",label:"Sécuriser les accès",hint:"Commandement et discipline au service de l’ordre.",skill:"Commandement",difficulty:58,risk:2,impact:2,alignment:"order",factions:["Marine","Gouvernement"],relations:{lucci:{respect:3},robin:{trust:-4}}},
          {id:"infiltrate",label:"Chercher une voie discrète",hint:"Discrétion. Moins frontal mais pas sans risque.",skill:"Discrétion",difficulty:55,risk:1,impact:1.5,alignment:"freedom"},
          {id:"withdraw",label:"Rester en marge",hint:"Tu laisses l’événement suivre sa logique sans t’y exposer.",withdraw:true,impact:0,risk:0}
        ]},
        {id:"confrontation",title:"Le point de rupture",text:"L’opération entre dans sa phase critique. Chaque camp doit maintenant choisir ce qu’il protège réellement.",choices:[
          {id:"protect",label:"Protéger la cible centrale",hint:"Résistance et Combat pour empêcher une capture décisive.",skill:"Combat",secondary:"Résistance",difficulty:68,risk:4,impact:2.4,alignment:"freedom",relations:{robin:{trust:8,respect:5},lucci:{rivalry:6}}},
          {id:"capture",label:"Achever l’opération",hint:"Commandement et Combat pour imposer l’objectif gouvernemental.",skill:"Commandement",secondary:"Combat",difficulty:66,risk:3,impact:2.4,alignment:"order",factions:["Marine","Gouvernement"],relations:{lucci:{respect:5},robin:{trust:-6}}},
          {id:"extract",label:"Créer une sortie",hint:"Navigation et Discrétion. Priorité à l’extraction.",skill:"Discrétion",secondary:"Navigation",difficulty:61,risk:2,impact:1.8,alignment:"freedom"}
        ]},
        {id:"escape",title:"La sortie d’Enies Lobby",text:"La bataille se disperse. Le dernier choix concerne ce que tu emportes avec toi : une victoire, des survivants ou seulement ta propre peau.",choices:[
          {id:"pursue",label:"Poursuivre jusqu’au bout",hint:"Plus d’impact, plus d’exposition.",skill:"Combat",difficulty:72,risk:4,impact:2.5},
          {id:"evacuate",label:"Organiser l’évacuation",hint:"Commandement. Sauver les forces encore récupérables.",skill:"Commandement",difficulty:57,risk:2,impact:1.8},
          {id:"disappear",label:"Rompre le contact",hint:"Discrétion. Limite les pertes et l’exposition.",skill:"Discrétion",difficulty:50,risk:1,impact:1}
        ]}
      ]
    },

    sabaody_collision:{
      title:"Collision des puissances à Sabaody",
      subtitle:"Supernovae, Marine et forces supérieures se retrouvent dans le même espace. Une mauvaise décision peut transformer une escale en catastrophe.",
      region:"Grand Line",minScore:42,related:["luffy","law","kid","kizaru"],
      roles:{Marine:"Force de réponse",Gouvernement:"Appui gouvernemental",Pirates:"Supernova ou allié",Révolutionnaires:"Observateur clandestin",Civil:"Présence civile","Chasseurs de primes":"Chasseur opportuniste"},
      stages:[
        {id:"collision",title:"Les puissances convergent",text:"L’archipel cesse d’être une simple escale. Les mouvements de la Marine et des pirates se répondent immédiatement.",choices:[
          {id:"challenge",label:"Rester au centre de l’affrontement",hint:"Combat. Fort potentiel de réputation et de blessures.",skill:"Combat",difficulty:70,risk:4,impact:2.2,alignment:"pirate",factions:["Pirates","Chasseurs de primes"]},
          {id:"enforce",label:"Fermer l’archipel",hint:"Commandement. Tenter de contenir la nouvelle génération.",skill:"Commandement",difficulty:66,risk:3,impact:2,alignment:"order",factions:["Marine","Gouvernement"]},
          {id:"observe",label:"Exploiter le chaos discrètement",hint:"Discrétion. Renseignement et positionnement.",skill:"Discrétion",difficulty:54,risk:1,impact:1.3,alignment:"shadow"},
          {id:"withdraw",label:"Quitter Sabaody",hint:"Tu refuses de devenir une pièce de cette collision.",withdraw:true,impact:0,risk:0}
        ]},
        {id:"overwhelmed",title:"Une force écrasante intervient",text:"Le rapport de force bascule brutalement. Continuer n’a plus le même sens qu’au début.",choices:[
          {id:"hold",label:"Tenir malgré tout",hint:"Résistance et volonté. Très dangereux.",skill:"Combat",secondary:"Résistance",difficulty:80,risk:5,impact:2.8},
          {id:"save",label:"Couvrir le repli des alliés",hint:"Commandement. Impact relationnel élevé.",skill:"Commandement",difficulty:66,risk:3,impact:2.2,relations:{luffy:{trust:5},law:{respect:4},kid:{respect:3}}},
          {id:"escape",label:"Trouver une sortie",hint:"Navigation et Réflexes. L’objectif devient la survie.",skill:"Navigation",secondary:"Réflexes",difficulty:58,risk:2,impact:1}
        ]}
      ]
    },

    marineford_war:{
      title:"Guerre de Marineford",
      subtitle:"Marine, pirates et grandes figures convergent autour d’une exécution capable de modifier l’équilibre mondial.",
      region:"Grand Line",minScore:48,related:["ace","whitebeard","garp","sakazuki","koby"],
      roles:{Marine:"Mobilisé de Marineford",Gouvernement:"Opérations spéciales",Pirates:"Intervenant pirate",Révolutionnaires:"Intervenant clandestin",Civil:"Volontaire exceptionnel","Chasseurs de primes":"Contractuel de guerre"},
      stages:[
        {id:"mobilization",title:"La mobilisation",text:"Marineford devient le centre du monde. Ton rang, tes alliances et ta réputation déterminent pourquoi tu te trouves ici, mais pas ce que tu vas choisir d’y faire.",choices:[
          {id:"rescue_line",label:"Te placer du côté du sauvetage",hint:"Tu fais de la survie d’Ace une priorité personnelle.",skill:"Combat",difficulty:72,risk:4,impact:2,alignment:"rescue",factions:["Pirates","Révolutionnaires","Civil"],relations:{ace:{trust:7,respect:5},whitebeard:{respect:4},sakazuki:{rivalry:5}}},
          {id:"marine_line",label:"Tenir la ligne de la Marine",hint:"Commandement et discipline. Tu soutiens l’objectif officiel.",skill:"Commandement",difficulty:67,risk:3,impact:2,alignment:"order",factions:["Marine","Gouvernement","Chasseurs de primes"],relations:{sakazuki:{respect:4},garp:{respect:2},ace:{trust:-5}}},
          {id:"independent",label:"Poursuivre ton propre objectif",hint:"Discrétion. Profiter du chaos sans te soumettre à un camp.",skill:"Discrétion",difficulty:60,risk:2,impact:1.2,alignment:"independent"},
          {id:"withdraw",label:"Refuser la guerre",hint:"Tu laisses Marineford se résoudre sans toi.",withdraw:true,impact:0,risk:0}
        ]},
        {id:"battlefield",title:"Le champ de bataille s’effondre",text:"La guerre devient illisible. Les plans initiaux ne survivent plus au contact des grandes puissances.",choices:[
          {id:"breakthrough",label:"Ouvrir une brèche vers Ace",hint:"Combat pur. Un succès peut peser sur le résultat final.",skill:"Combat",secondary:"Vitesse",difficulty:79,risk:5,impact:2.8,alignment:"rescue",relations:{ace:{trust:8},whitebeard:{respect:6}}},
          {id:"block",label:"Briser l’avancée pirate",hint:"Combat et Commandement pour maintenir le dispositif.",skill:"Commandement",secondary:"Combat",difficulty:75,risk:4,impact:2.6,alignment:"order",relations:{sakazuki:{respect:6},garp:{respect:3}}},
          {id:"extract",label:"Évacuer des alliés du chaos",hint:"Commandement et Réflexes. Moins spectaculaire, souvent plus intelligent.",skill:"Commandement",secondary:"Réflexes",difficulty:63,risk:3,impact:1.8,alignment:"rescue"}
        ]},
        {id:"turning_point",title:"Le point de non-retour",text:"Une fenêtre minuscule apparaît. À ce niveau de chaos, une seule action peut créer une divergence que le monde entier remarquera.",choices:[
          {id:"save_ace",label:"Tout risquer pour sauver Ace",hint:"Difficulté extrême. Réservé aux trajectoires réellement capables de peser sur l’histoire.",skill:"Combat",secondary:"Commandement",difficulty:88,risk:6,impact:3.4,alignment:"rescue",critical:"save_ace",relations:{ace:{trust:10,respect:8},whitebeard:{respect:7},sakazuki:{rivalry:8}}},
          {id:"secure_execution",label:"Garantir l’issue officielle",hint:"Commandement et Combat. Tu refuses que le dispositif s’effondre.",skill:"Commandement",secondary:"Combat",difficulty:82,risk:5,impact:3,alignment:"order",critical:"secure_execution",relations:{sakazuki:{respect:7},ace:{trust:-8}}},
          {id:"stop_slaughter",label:"Freiner l’escalade",hint:"Commandement et volonté. Cherche à limiter les morts plutôt qu’à gagner un camp.",skill:"Commandement",secondary:"Discipline",difficulty:76,risk:4,impact:2.6,alignment:"mercy",critical:"reduce_slaughter",relations:{koby:{trust:8,respect:7},garp:{respect:4}}}
        ]}
      ]
    },

    dressrosa_upheaval:{
      title:"Chute d’un réseau majeur à Dressrosa",
      subtitle:"Un royaume, un réseau criminel et plusieurs ambitions convergent. La chute d’un seul acteur peut redistribuer tout le Nouveau Monde.",
      region:"New World",minScore:45,related:["doflamingo","law","luffy"],
      roles:{Marine:"Observateur militaire",Gouvernement:"Agent de contrôle",Pirates:"Alliance pirate",Révolutionnaires:"Opérateur révolutionnaire",Civil:"Résistant local","Chasseurs de primes":"Intervenant indépendant"},
      stages:[
        {id:"network",title:"Le réseau se fissure",text:"Avant la bataille ouverte, informations, alliances et trafics déterminent qui comprendra réellement ce qui se passe.",choices:[
          {id:"expose",label:"Exposer le réseau",hint:"Discrétion et Commandement.",skill:"Discrétion",secondary:"Commandement",difficulty:61,risk:2,impact:2,alignment:"liberation",relations:{law:{respect:5},doflamingo:{rivalry:5}}},
          {id:"protect_network",label:"Protéger les intérêts établis",hint:"Commandement. Choix dangereux politiquement.",skill:"Commandement",difficulty:64,risk:3,impact:2,alignment:"control",relations:{doflamingo:{respect:4},law:{trust:-5}}},
          {id:"withdraw",label:"Ne pas t’impliquer",hint:"Dressrosa suivra sa trajectoire sans toi.",withdraw:true,impact:0,risk:0}
        ]},
        {id:"collapse",title:"Le royaume bascule",text:"Les structures de contrôle deviennent visibles. Il faut maintenant choisir entre les détruire, les saisir ou simplement survivre.",choices:[
          {id:"fight",label:"Affronter le cœur du pouvoir",hint:"Combat. Risque élevé.",skill:"Combat",difficulty:78,risk:5,impact:2.8,alignment:"liberation"},
          {id:"coordinate",label:"Coordonner les forces alliées",hint:"Commandement. Plus sûr mais exigeant.",skill:"Commandement",difficulty:67,risk:3,impact:2.4,alignment:"liberation"},
          {id:"seize",label:"Récupérer une partie du réseau",hint:"Discrétion. Opportuniste.",skill:"Discrétion",difficulty:68,risk:3,impact:1.8,alignment:"control"}
        ]},
        {id:"aftermath",title:"Qui hérite de Dressrosa ?",text:"La bataille se termine, mais les réseaux, informations et territoires ne disparaissent pas avec elle.",choices:[
          {id:"stabilize",label:"Aider à stabiliser le royaume",hint:"Commandement et réputation.",skill:"Commandement",difficulty:58,risk:1,impact:2},
          {id:"hunt",label:"Traquer les survivants du réseau",hint:"Discrétion et Combat.",skill:"Discrétion",secondary:"Combat",difficulty:64,risk:2,impact:1.8},
          {id:"leave",label:"Partir avant le partage",hint:"Tu refuses de rester pour l’après.",skill:"Navigation",difficulty:45,risk:1,impact:.8}
        ]}
      ]
    },

    wano_war:{
      title:"Guerre de Wano",
      subtitle:"Une guerre de territoire et d’Empereurs concentre puissance militaire, alliances et ambitions dans un espace fermé.",
      region:"New World",minScore:50,related:["kaido","bigmom","luffy","law","kid","yamato"],
      roles:{Marine:"Observateur non autorisé",Gouvernement:"Mission d’intérêt mondial",Pirates:"Membre d’une coalition",Révolutionnaires:"Intervenant clandestin",Civil:"Résistant exceptionnel","Chasseurs de primes":"Opportuniste de guerre"},
      stages:[
        {id:"alliance",title:"Choisir une coalition",text:"À Wano, rester neutre devient difficile. Chaque alliance implique des ennemis que tu ne peux plus ignorer.",choices:[
          {id:"rebellion",label:"Soutenir la rébellion",hint:"Commandement. Prépare l’assaut contre les puissances impériales.",skill:"Commandement",difficulty:66,risk:3,impact:2.2,alignment:"rebellion",relations:{luffy:{trust:4},law:{respect:4},kid:{respect:3},kaido:{rivalry:6}}},
          {id:"imperial",label:"Soutenir l’ordre de Kaido",hint:"Combat et intimidation.",skill:"Combat",difficulty:70,risk:4,impact:2.2,alignment:"imperial",relations:{kaido:{respect:5},luffy:{trust:-5}}},
          {id:"infiltrate",label:"Rester infiltré",hint:"Discrétion. Collecte d’informations avant de choisir.",skill:"Discrétion",difficulty:57,risk:2,impact:1.4},
          {id:"withdraw",label:"Quitter Wano",hint:"Tu refuses de participer à la guerre.",withdraw:true,impact:0,risk:0}
        ]},
        {id:"raid",title:"Le raid commence",text:"La guerre cesse d’être théorique. Les équipages, samouraïs et commandants s’engagent simultanément.",choices:[
          {id:"commander",label:"Commander un front",hint:"Commandement. Ta valeur dépend de ceux qui te suivent.",skill:"Commandement",difficulty:73,risk:4,impact:2.6},
          {id:"duel",label:"Chercher un commandant ennemi",hint:"Combat. Haute exposition.",skill:"Combat",difficulty:80,risk:5,impact:2.8},
          {id:"support",label:"Protéger la logistique",hint:"Médecine ou Navigation. Moins glorieux, très utile.",skill:"Navigation",secondary:"Médecine",difficulty:61,risk:2,impact:1.9}
        ]},
        {id:"climax",title:"Le contrôle de Wano se décide",text:"La chute ou la survie des puissances impériales se joue maintenant.",choices:[
          {id:"fall_emperor",label:"Contribuer à la chute de l’Empereur",hint:"Combat extrême.",skill:"Combat",secondary:"Commandement",difficulty:87,risk:6,impact:3.3,alignment:"rebellion",critical:"fall_kaido"},
          {id:"hold_empire",label:"Maintenir le pouvoir impérial",hint:"Commandement et Combat.",skill:"Commandement",secondary:"Combat",difficulty:84,risk:5,impact:3.1,alignment:"imperial",critical:"save_beasts"},
          {id:"protect_people",label:"Prioriser les civils",hint:"Commandement et Résistance. Réduit surtout les dégâts humains.",skill:"Commandement",secondary:"Résistance",difficulty:70,risk:3,impact:2.4,alignment:"mercy"}
        ]}
      ]
    },

    cross_guild_rise:{
      title:"Émergence de Cross Guild",
      subtitle:"Une nouvelle structure pirate transforme les chasseurs en cibles et brouille la frontière entre ordre officiel et marché criminel.",
      region:"Grand Line",minScore:43,related:["buggy","mihawk","crocodile"],
      roles:{Marine:"Cible institutionnelle",Gouvernement:"Analyste de menace",Pirates:"Partenaire ou rival",Révolutionnaires:"Observateur",Civil:"Acteur économique","Chasseurs de primes":"Intermédiaire du marché"},
      stages:[
        {id:"offer",title:"Un nouveau marché apparaît",text:"Les primes ne circulent plus dans un seul sens. Des réseaux cherchent immédiatement à exploiter la situation.",choices:[
          {id:"oppose",label:"Combattre le réseau",hint:"Commandement et Discrétion.",skill:"Commandement",secondary:"Discrétion",difficulty:65,risk:3,impact:2,alignment:"order"},
          {id:"deal",label:"Négocier avec le réseau",hint:"Commandement. Très rentable, politiquement sale.",skill:"Commandement",difficulty:62,risk:2,impact:1.8,alignment:"guild"},
          {id:"hunt",label:"Profiter du chaos des primes",hint:"Discrétion et Combat.",skill:"Discrétion",secondary:"Combat",difficulty:60,risk:2,impact:1.6,alignment:"independent"},
          {id:"withdraw",label:"Refuser ce marché",hint:"Tu ne t’impliques pas dans la nouvelle économie de chasse.",withdraw:true,impact:0,risk:0}
        ]},
        {id:"balance",title:"Le rapport de force se fixe",text:"Cross Guild n’est plus une rumeur. Tes choix déterminent si tu deviens adversaire, partenaire ou bénéficiaire indirect.",choices:[
          {id:"strike",label:"Frapper une infrastructure du réseau",hint:"Combat. Impact élevé.",skill:"Combat",difficulty:74,risk:4,impact:2.6},
          {id:"embed",label:"Infiltrer durablement le réseau",hint:"Discrétion. Rendement futur potentiel.",skill:"Discrétion",difficulty:68,risk:3,impact:2.2},
          {id:"broker",label:"Devenir intermédiaire",hint:"Commandement et réputation.",skill:"Commandement",difficulty:60,risk:2,impact:1.8}
        ]}
      ]
    },

    egghead_incident:{
      title:"Incident d’Egghead",
      subtitle:"Science, Gouvernement et grandes puissances convergent sur une île où l’information vaut parfois plus qu’une flotte.",
      region:"New World",minScore:48,related:["kizaru","stussy","lucci"],
      roles:{Marine:"Force d’encerclement",Gouvernement:"Agent de l’opération",Pirates:"Force extérieure",Révolutionnaires:"Récupérateur d’informations",Civil:"Scientifique ou témoin","Chasseurs de primes":"Intervenant indépendant"},
      stages:[
        {id:"intelligence",title:"L’île devient une cible",text:"Avant le siège, les données et les loyautés déterminent qui sait réellement ce qui est en jeu.",choices:[
          {id:"extract_data",label:"Récupérer les données",hint:"Science et Discrétion.",skill:"Science",secondary:"Discrétion",difficulty:68,risk:2,impact:2,alignment:"knowledge"},
          {id:"secure",label:"Sécuriser l’opération",hint:"Commandement. Réduire les fuites et contrôler les accès.",skill:"Commandement",difficulty:66,risk:2,impact:2,alignment:"order",factions:["Marine","Gouvernement"]},
          {id:"infiltrate",label:"T’infiltrer avant le verrouillage",hint:"Discrétion.",skill:"Discrétion",difficulty:63,risk:2,impact:1.7},
          {id:"withdraw",label:"Éviter Egghead",hint:"Tu ne participes pas à l’incident.",withdraw:true,impact:0,risk:0}
        ]},
        {id:"siege",title:"Le siège technologique",text:"L’île n’est plus un laboratoire mais un champ de bataille saturé de technologies et d’ordres contradictoires.",choices:[
          {id:"frontline",label:"Affronter les forces présentes",hint:"Combat contre des adversaires de très haut niveau.",skill:"Combat",difficulty:82,risk:5,impact:2.8},
          {id:"systems",label:"Manipuler les systèmes de l’île",hint:"Science. Peut modifier l’environnement plutôt que les ennemis.",skill:"Science",difficulty:75,risk:3,impact:2.5},
          {id:"evac",label:"Créer une voie d’évacuation",hint:"Navigation et Commandement.",skill:"Navigation",secondary:"Commandement",difficulty:67,risk:3,impact:2.1}
        ]},
        {id:"escape",title:"Qui repart avec quoi ?",text:"Quand l’incident se termine, la question n’est plus seulement qui a gagné mais quelles informations et quelles personnes ont survécu.",choices:[
          {id:"preserve_knowledge",label:"Sauver les connaissances",hint:"Science et volonté.",skill:"Science",difficulty:78,risk:4,impact:2.8,alignment:"knowledge"},
          {id:"erase",label:"Empêcher la diffusion des données",hint:"Discrétion et Commandement.",skill:"Discrétion",secondary:"Commandement",difficulty:75,risk:4,impact:2.7,alignment:"order"},
          {id:"survive",label:"Prioriser la sortie",hint:"Navigation et Réflexes.",skill:"Navigation",secondary:"Réflexes",difficulty:62,risk:2,impact:1.3}
        ]}
      ]
    }
  };

  registry.register('arcDefinitionsV71',{version:'7.1.0',arcs});
})(window);
