(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const aliases={
    'Chasseur de primes':'Chasseurs de primes',
    'Chasseurs de primes':'Chasseurs de primes',
    'Gouvernement Mondial':'Gouvernement'
  };

  const factions={
    Civil:{
      label:'Civil',identity:'Indépendance & réputation',icon:'◈',
      desc:'Ta place se construit par les compétences, les contrats et la confiance locale, sans hiérarchie unique pour te protéger.',
      values:['Autonomie','Fiabilité','Ancrage local'],pressureBase:16,
      events:[
        {id:'civil_duty',type:'duty',label:'Une responsabilité locale te rattrape',text:'Ton activité te rend assez visible pour que des habitants ou partenaires comptent désormais sur toi.',weight:1.0,choices:{
          commit:{label:'Prendre la responsabilité',hint:'Renforce ton ancrage et ta réputation, au prix de liberté.',effects:{loyalty:3,autonomy:-2,pressure:-7,friction:-2,standing:3,trust:4,discipline:2,xp:2,duty:1}},
          negotiate:{label:'Négocier ton implication',hint:'Préserve ton autonomie tout en restant fiable.',effects:{loyalty:1,autonomy:3,pressure:-4,friction:-1,standing:2,trust:2,influence:2,xp:1,duty:1}},
          refuse:{label:'Rester indépendant',hint:'Tu gardes ta liberté, mais certains retiendront ton absence.',effects:{loyalty:-2,autonomy:6,pressure:2,friction:4,standing:-2,trust:-3,ignored:1}}
        }},
        {id:'civil_opportunity',type:'opportunity',label:'Une ouverture commerciale ou professionnelle',text:'Ton réseau t’offre une occasion de consolider une activité, un atelier, une route ou une clientèle.',weight:.9,choices:{
          commit:{label:'Investir dans l’occasion',hint:'Plus de reconnaissance et d’expérience.',effects:{loyalty:2,autonomy:1,pressure:2,friction:-1,standing:4,influence:3,xp:4,opportunity:1}},
          negotiate:{label:'Grandir sans te lier',hint:'Gain plus modéré, autonomie préservée.',effects:{loyalty:1,autonomy:4,pressure:0,friction:0,standing:2,influence:2,xp:2,opportunity:1}},
          refuse:{label:'Passer ton tour',hint:'Peu de risque, mais l’occasion disparaît.',effects:{autonomy:2,pressure:-2,standing:-1}}
        }},
        {id:'civil_friction',type:'friction',label:'Indépendance contre stabilité',text:'La liberté de choisir tes contrats entre en conflit avec le besoin de stabilité de ton activité.',weight:.65,choices:{
          commit:{label:'Choisir la stabilité',hint:'Fiabilité en hausse, liberté réduite.',effects:{loyalty:3,autonomy:-4,pressure:-6,friction:-6,trust:4,discipline:3,duty:1}},
          negotiate:{label:'Trouver un compromis',hint:'Résout une partie de la tension sans sacrifier ton modèle.',effects:{loyalty:2,autonomy:2,pressure:-4,friction:-5,standing:2,influence:2}},
          refuse:{label:'Assumer l’instabilité',hint:'Tu restes libre, mais la tension structurelle augmente.',effects:{autonomy:5,pressure:3,friction:5,trust:-2}}
        }}
      ]
    },
    Marine:{
      label:'Marine',identity:'Justice, service & hiérarchie',icon:'⚓',
      desc:'Tes résultats comptent, mais aussi ta discipline, ta capacité à protéger et la confiance de la chaîne de commandement.',
      values:['Service','Discipline','Intégrité'],pressureBase:34,
      events:[
        {id:'marine_duty',type:'duty',label:'Ordre prioritaire de la Marine',text:'La hiérarchie réclame ton concours sur une opération que ton grade ne te permet plus d’ignorer.',weight:1.15,choices:{
          commit:{label:'Exécuter l’ordre',hint:'Loyauté, confiance et dossier interne progressent.',effects:{loyalty:5,autonomy:-3,pressure:-9,friction:-2,standing:4,trust:5,discipline:4,xp:3,duty:1}},
          negotiate:{label:'Adapter l’ordre au terrain',hint:'Plus d’autonomie, avec un léger coût politique.',effects:{loyalty:2,autonomy:4,pressure:-5,friction:1,standing:3,trust:1,influence:3,xp:2,duty:1}},
          refuse:{label:'Refuser l’ordre',hint:'Ta conscience reste libre, ton dossier beaucoup moins.',effects:{loyalty:-7,autonomy:7,pressure:7,friction:9,standing:-5,trust:-7,discipline:-5,sanctions:1,ignored:1}}
        }},
        {id:'marine_opportunity',type:'opportunity',label:'Commandement temporaire',text:'Une opération laisse une place de responsabilité. Tes supérieurs évaluent qui peut la prendre.',weight:.85,choices:{
          commit:{label:'Prendre le commandement',hint:'Influence et standing en hausse, pression accrue.',effects:{loyalty:3,autonomy:1,pressure:5,friction:-1,standing:5,trust:3,influence:5,xp:4,opportunity:1}},
          negotiate:{label:'Servir comme adjoint',hint:'Progression sûre avec moins d’exposition.',effects:{loyalty:3,autonomy:1,pressure:1,standing:3,trust:4,discipline:2,xp:2,opportunity:1}},
          refuse:{label:'Laisser la place',hint:'La pression baisse, mais ton ambition interne paraît moindre.',effects:{autonomy:2,pressure:-4,standing:-2,influence:-1}}
        }},
        {id:'marine_friction',type:'friction',label:'Ordre et jugement personnel',text:'Une directive réglementaire semble mal adaptée à la réalité du terrain.',weight:.8,choices:{
          commit:{label:'Appliquer strictement la directive',hint:'Discipline reconnue, autonomie réduite.',effects:{loyalty:4,autonomy:-4,pressure:-5,friction:-2,trust:4,discipline:5,duty:1}},
          negotiate:{label:'Protéger l’objectif, changer la méthode',hint:'Le meilleur compromis si ton influence suffit.',effects:{loyalty:2,autonomy:4,pressure:-4,friction:-6,standing:2,trust:1,influence:3}},
          refuse:{label:'Désobéir ouvertement',hint:'Forte autonomie, forte friction hiérarchique.',effects:{loyalty:-6,autonomy:7,pressure:6,friction:10,standing:-4,trust:-6,sanctions:1,ignored:1}}
        }}
      ]
    },
    Pirates:{
      label:'Pirates',identity:'Liberté, équipage & réputation',icon:'☠',
      desc:'Ta liberté n’existe que si ton équipage te suit. La loyauté, la réputation et le partage des risques valent autant que le rang.',
      values:['Liberté','Loyauté d’équipage','Audace'],pressureBase:28,
      events:[
        {id:'pirate_duty',type:'duty',label:'L’équipage attend que tu répondes présent',text:'Un problème touche directement le pavillon. Ton absence serait remarquée par tout l’équipage.',weight:1.1,choices:{
          commit:{label:'Te ranger avec l’équipage',hint:'Loyauté et standing gagnés, risque assumé.',effects:{loyalty:6,autonomy:-2,pressure:-8,friction:-4,standing:4,trust:5,xp:3,duty:1}},
          negotiate:{label:'Proposer ton propre plan',hint:'Préserve la liberté tout en soutenant le pavillon.',effects:{loyalty:4,autonomy:4,pressure:-5,friction:-3,standing:3,influence:4,xp:2,duty:1}},
          refuse:{label:'Prioriser ta route personnelle',hint:'Autonomie maximale, cohésion en baisse.',effects:{loyalty:-8,autonomy:8,pressure:5,friction:9,standing:-5,trust:-6,ignored:1}}
        }},
        {id:'pirate_opportunity',type:'opportunity',label:'Un coup peut faire grandir le pavillon',text:'Une cible, une route ou un rival offre une occasion de gagner richesse et réputation.',weight:1.0,choices:{
          commit:{label:'Mener le coup',hint:'Réputation interne et influence progressent.',effects:{loyalty:4,autonomy:2,pressure:5,friction:-2,standing:5,influence:5,xp:4,opportunity:1}},
          negotiate:{label:'Partager le risque',hint:'Moins spectaculaire, plus cohésif.',effects:{loyalty:5,autonomy:2,pressure:1,friction:-3,standing:3,trust:3,xp:2,opportunity:1}},
          refuse:{label:'Ne pas forcer le destin',hint:'La pression retombe, la réputation n’avance pas.',effects:{autonomy:2,pressure:-5,standing:-2}}
        }},
        {id:'pirate_friction',type:'friction',label:'Ta liberté heurte celle de l’équipage',text:'Ton projet personnel et les intérêts immédiats du groupe ne pointent plus dans la même direction.',weight:.85,choices:{
          commit:{label:'Faire passer l’équipage d’abord',hint:'Cohésion forte, autonomie sacrifiée.',effects:{loyalty:6,autonomy:-5,pressure:-5,friction:-7,trust:5,duty:1}},
          negotiate:{label:'Convaincre et partager la décision',hint:'Demande de l’influence mais apaise durablement.',effects:{loyalty:3,autonomy:4,pressure:-4,friction:-7,influence:4,standing:2}},
          refuse:{label:'Imposer ta volonté',hint:'Autorité possible, ressentiment probable.',effects:{loyalty:-4,autonomy:7,pressure:4,friction:8,standing:1,trust:-5,influence:2}}
        }}
      ]
    },
    'Chasseurs de primes':{
      label:'Chasseurs de primes',identity:'Contrats, code & indépendance',icon:'◎',
      desc:'Ta crédibilité vient de cibles livrées, d’informations fiables et d’un code personnel que les donneurs d’ordre apprennent à connaître.',
      values:['Fiabilité','Précision','Indépendance'],pressureBase:24,
      events:[
        {id:'hunter_duty',type:'duty',label:'Un contrat engage ta réputation',text:'Une cible que tu as acceptée devient plus difficile que prévu. Abandonner serait visible dans le réseau.',weight:1.05,choices:{
          commit:{label:'Aller au bout du contrat',hint:'Fiabilité et standing progressent.',effects:{loyalty:4,autonomy:-2,pressure:-8,friction:-3,standing:5,trust:4,discipline:3,xp:3,duty:1}},
          negotiate:{label:'Renégocier le contrat',hint:'Préserve ton intérêt sans rompre ta parole.',effects:{loyalty:2,autonomy:4,pressure:-5,friction:-2,standing:3,influence:3,xp:2,duty:1}},
          refuse:{label:'Rompre le contrat',hint:'Liberté immédiate, fiabilité en baisse.',effects:{loyalty:-5,autonomy:8,pressure:3,friction:7,standing:-5,trust:-6,ignored:1}}
        }},
        {id:'hunter_opportunity',type:'opportunity',label:'Une cible exclusive circule dans le réseau',text:'Une prime particulièrement rentable est proposée à peu de chasseurs.',weight:.95,choices:{
          commit:{label:'Prendre l’exclusivité',hint:'Gros potentiel de standing et de pression.',effects:{loyalty:2,autonomy:2,pressure:6,standing:5,influence:4,xp:4,opportunity:1}},
          negotiate:{label:'Monter une coopération',hint:'Moins de gloire, plus de fiabilité.',effects:{loyalty:3,autonomy:1,pressure:2,friction:-2,standing:3,trust:4,xp:2,opportunity:1}},
          refuse:{label:'Laisser passer',hint:'Aucun risque supplémentaire.',effects:{autonomy:2,pressure:-4,standing:-1}}
        }},
        {id:'hunter_friction',type:'friction',label:'Le contrat est rentable, mais douteux',text:'Le réseau paierait bien, mais la cible ou les conditions heurtent ton code personnel.',weight:.75,choices:{
          commit:{label:'Honorer le contrat',hint:'Réputation professionnelle en hausse, friction personnelle aussi.',effects:{loyalty:4,autonomy:-3,pressure:-4,friction:3,standing:4,trust:3,duty:1}},
          negotiate:{label:'Changer les conditions',hint:'Tu défends ton code sans brûler le réseau.',effects:{loyalty:2,autonomy:5,pressure:-3,friction:-6,influence:4,standing:2}},
          refuse:{label:'Refuser la cible',hint:'Ton code gagne en cohérence, certains contacts te jugent moins fiable.',effects:{loyalty:-2,autonomy:7,pressure:-2,friction:-4,standing:-2,trust:-2}}
        }}
      ]
    },
    Révolutionnaires:{
      label:'Révolutionnaires',identity:'Cause, réseau & clandestinité',icon:'✦',
      desc:'La confiance se gagne par la discrétion et la capacité à protéger le réseau. Une erreur peut exposer bien plus que ta propre carrière.',
      values:['Conviction','Discrétion','Solidarité'],pressureBase:35,
      events:[
        {id:'revolution_duty',type:'duty',label:'Une cellule demande ton intervention',text:'Un réseau allié a besoin d’aide. Répondre renforce la cause, mais augmente ton exposition.',weight:1.15,choices:{
          commit:{label:'Répondre à l’appel',hint:'Loyauté et confiance du réseau progressent.',effects:{loyalty:6,autonomy:-2,pressure:-7,friction:-3,standing:4,trust:5,discipline:2,xp:3,duty:1}},
          negotiate:{label:'Aider par une voie indirecte',hint:'Discrétion et autonomie mieux préservées.',effects:{loyalty:4,autonomy:4,pressure:-5,friction:-4,standing:3,influence:4,xp:2,duty:1}},
          refuse:{label:'Ne pas exposer ta couverture',hint:'Risque réduit maintenant, confiance du réseau en baisse.',effects:{loyalty:-5,autonomy:6,pressure:2,friction:6,standing:-4,trust:-5,ignored:1}}
        }},
        {id:'revolution_opportunity',type:'opportunity',label:'Une cellule peut être étendue',text:'Une fenêtre rare permet de renforcer durablement le réseau local.',weight:.95,choices:{
          commit:{label:'Porter l’expansion',hint:'Influence et responsabilité augmentent.',effects:{loyalty:4,autonomy:0,pressure:6,standing:5,trust:3,influence:5,xp:4,opportunity:1}},
          negotiate:{label:'Former des relais',hint:'Croissance plus lente, réseau plus résilient.',effects:{loyalty:4,autonomy:3,pressure:2,friction:-2,standing:3,trust:4,influence:3,xp:2,opportunity:1}},
          refuse:{label:'Conserver le réseau actuel',hint:'La pression baisse mais l’occasion disparaît.',effects:{autonomy:2,pressure:-4,standing:-1}}
        }},
        {id:'revolution_friction',type:'friction',label:'La cause réclame un coût personnel',text:'Une opération importante exige un sacrifice qui pèse directement sur ta vie ou tes proches.',weight:.85,choices:{
          commit:{label:'Accepter le sacrifice',hint:'Loyauté forte, tension personnelle accrue.',effects:{loyalty:6,autonomy:-5,pressure:-4,friction:2,standing:4,trust:4,duty:1}},
          negotiate:{label:'Chercher une autre voie',hint:'Plus d’autonomie et moins de friction si tu as du poids interne.',effects:{loyalty:3,autonomy:5,pressure:-3,friction:-6,influence:4,standing:2}},
          refuse:{label:'Tracer une limite',hint:'Protège ta vie personnelle, crée un doute interne.',effects:{loyalty:-5,autonomy:8,pressure:3,friction:6,standing:-3,trust:-4,ignored:1}}
        }}
      ]
    },
    Gouvernement:{
      label:'Gouvernement',identity:'Secret, efficacité & obéissance',icon:'◇',
      desc:'La confiance institutionnelle dépend de l’exécution, du secret et de ta capacité à gérer des ordres dont tu ne connais pas toujours toutes les raisons.',
      values:['Secret','Efficacité','Loyauté institutionnelle'],pressureBase:39,
      events:[
        {id:'government_duty',type:'duty',label:'Directive classifiée',text:'Une mission sensible arrive par la chaîne interne. Le besoin de discrétion est absolu.',weight:1.2,choices:{
          commit:{label:'Exécuter la directive',hint:'Confiance et discipline fortement renforcées.',effects:{loyalty:6,autonomy:-4,pressure:-9,friction:-2,standing:4,trust:6,discipline:5,xp:3,duty:1}},
          negotiate:{label:'Demander une marge opérationnelle',hint:'Plus d’autonomie, mais ta fiabilité sera observée.',effects:{loyalty:3,autonomy:4,pressure:-5,friction:1,standing:3,trust:1,influence:4,xp:2,duty:1}},
          refuse:{label:'Refuser la directive',hint:'Très forte friction institutionnelle.',effects:{loyalty:-8,autonomy:8,pressure:8,friction:10,standing:-6,trust:-8,discipline:-5,sanctions:1,ignored:1}}
        }},
        {id:'government_opportunity',type:'opportunity',label:'Accès à un dossier supérieur',text:'Ton nom est proposé pour un niveau d’information et de responsabilité plus élevé.',weight:.9,choices:{
          commit:{label:'Accepter l’accès',hint:'Influence en hausse, obligations supplémentaires.',effects:{loyalty:4,autonomy:-1,pressure:6,friction:0,standing:5,trust:4,influence:5,xp:4,opportunity:1}},
          negotiate:{label:'Accepter avec limites',hint:'Moins de progression, plus de contrôle personnel.',effects:{loyalty:2,autonomy:4,pressure:2,standing:3,trust:2,influence:3,xp:2,opportunity:1}},
          refuse:{label:'Rester à ton niveau actuel',hint:'Pression réduite, influence stagnante.',effects:{autonomy:2,pressure:-5,standing:-2,influence:-1}}
        }},
        {id:'government_friction',type:'friction',label:'Le secret pèse sur ton jugement',text:'Ce que tu sais et ce que tu peux dire commencent à entrer en conflit avec tes propres décisions.',weight:.9,choices:{
          commit:{label:'Respecter le secret',hint:'Loyauté institutionnelle renforcée.',effects:{loyalty:5,autonomy:-4,pressure:-4,friction:1,trust:5,discipline:4,duty:1}},
          negotiate:{label:'Limiter les dégâts sans rompre le secret',hint:'Demande de l’influence mais réduit la friction.',effects:{loyalty:3,autonomy:4,pressure:-3,friction:-6,standing:2,influence:4}},
          refuse:{label:'Rompre avec la consigne',hint:'Autonomie forte, sanction très probable.',effects:{loyalty:-7,autonomy:8,pressure:7,friction:10,standing:-5,trust:-7,sanctions:1,ignored:1}}
        }}
      ]
    }
  };

  const v80=registry.get('simulationCoreDataV80');
  if(v80&&!v80.interruptionKinds.faction)v80.interruptionKinds.faction={label:'Faction',base:54,novelty:9};

  registry.register('factionIdentityDataV81',{version:'8.1.0',aliases,factions});
})(window);
