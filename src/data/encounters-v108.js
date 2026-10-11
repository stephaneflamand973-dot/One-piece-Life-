(function(g){'use strict';const r=g.OPL_MODULES;
const dialogue={
 frank:{label:'Parler franchement',skill:'Commandement',modifier:.07,trust:5,rivalry:0,
  text:{Marine:'Tu exposes clairement tes intentions à la patrouille.',Pirates:'Tu expliques tes intentions au capitaine rival.',Révolutionnaires:'Tu joues cartes sur table avec le réseau clandestin.',Gouvernement:'Tu demandes officiellement les raisons de cette intervention.',Civil:'Tu proposes un échange honnête et sans menace.'}},
 offer:{label:'Proposer une alliance',skill:'Commandement',modifier:.04,trust:7,rivalry:0,
  text:{Marine:'Tu offres ton soutien à la patrouille.',Pirates:'Tu proposes un partage des risques à l’équipage.',Révolutionnaires:'Tu envisages une coopération limitée.',Gouvernement:'Tu proposes un accord encadré.',Civil:'Tu proposes d’unir vos informations.'}},
 bluff:{label:'Bluffer sur tes ressources',skill:'Discrétion',modifier:-.09,trust:-4,rivalry:2,
  text:{Marine:'Tu prétends disposer d’une autorisation officielle.',Pirates:'Tu annonces des renforts qui n’existent peut-être pas.',Révolutionnaires:'Tu fais croire que tu connais leur réseau.',Gouvernement:'Tu prétends avoir des dossiers confidentiels.',Civil:'Tu grossis la valeur des informations en ta possession.'}}
};
const combat={
 guard:{label:'Garder sa position',skill:'Combat',accuracy:.91,damage:9,risk:.33,guard:7,desc:'Protéger ta santé, infliger peu de dégâts'},
 feint:{label:'Feinter et riposter',skill:'Discrétion',accuracy:.79,damage:19,risk:.76,guard:2,desc:'Favoriser la technique et une ouverture'},
 strike:{label:'Frapper avec précision',skill:'Combat',accuracy:.78,damage:25,risk:1,guard:0,desc:'Offensive équilibrée'},
 charge:{label:'Assaut décisif',skill:'Combat',accuracy:.60,damage:36,risk:1.55,guard:0,desc:'Plus de dégâts, plus de risques'},
 retreat:{label:'Rompre le combat',retreat:true,desc:'Quitter l’expédition sans butin supplémentaire'}
};
r.register('encounterDataV108',{version:'10.8.0',dialogue,combat});
})(window);