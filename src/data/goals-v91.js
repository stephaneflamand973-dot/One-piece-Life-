(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

const ambitions={
  survive:{label:'Survivre',headline:'Construire une vie durable',desc:'Rester en vie, préserver ses réserves et traverser les années sans sacrifier toute stabilité.',recommendedIntents:['recovery','balanced']},
  power:{label:'Devenir puissant',headline:'Atteindre le très haut niveau',desc:'Faire progresser ta puissance réelle jusqu’à pouvoir peser face aux grandes menaces du monde.',recommendedIntents:['mastery','career']},
  explore:{label:'Explorer le monde',headline:'Voir ce que les autres ne voient jamais',desc:'Découvrir des îles, franchir les mers et atteindre progressivement les régions les plus dangereuses.',recommendedIntents:['adventure','balanced']},
  wealth:{label:'Faire fortune',headline:'Bâtir une fortune durable',desc:'Accumuler des Berry, développer le commerce et transformer les opportunités en patrimoine.',recommendedIntents:['wealth','career']},
  legacy:{label:'Entrer dans l’histoire',headline:'Laisser une trace mondiale',desc:'Construire une réputation et un héritage qui dépassent ta simple carrière.',recommendedIntents:['career','mastery']},
  protect:{label:'Protéger les autres',headline:'Devenir un pilier pour les tiens',desc:'Développer des liens solides, une réputation positive et la capacité réelle d’aider les autres.',recommendedIntents:['bonds','career']}
};

const intents={
  balanced:{label:'Équilibre',desc:'Ne force aucune direction. Laisse ton plan annuel actuel s’exprimer.',planPatch:{}},
  career:{label:'Ascension',desc:'Priorité à la carrière et aux responsabilités.',planPatch:{career:'hard'}},
  mastery:{label:'Maîtrise',desc:'Priorité à l’entraînement et au développement personnel.',planPatch:{training:'hard'}},
  adventure:{label:'Aventure',desc:'Priorité aux voyages, découvertes et occasions d’exploration.',planPatch:{adventure:'explore'}},
  wealth:{label:'Fortune',desc:'Priorité aux revenus et opportunités matérielles.',planPatch:{resources:'extra'}},
  bonds:{label:'Liens',desc:'Priorité aux relations importantes et au réseau.',planPatch:{relations:'invest'}},
  recovery:{label:'Récupération',desc:'Réduire volontairement la charge pour restaurer santé et énergie.',planPatch:{training:'recover',adventure:'cautious',mission:'cautious'}}
};

const mediumTemplates={
  power_growth:{label:'Franchir un palier de puissance',desc:'Augmenter ta puissance globale de 10 points.',kind:'delta',metric:'power',delta:10,ambitions:['power','legacy'],weight:10},
  career_rank:{label:'Atteindre le rang suivant',desc:'Faire progresser ta carrière jusqu’au prochain rang.',kind:'rank',ambitions:['legacy','protect','power'],weight:9},
  explore_islands:{label:'Découvrir trois nouvelles îles',desc:'Élargir réellement ta carte du monde.',kind:'delta',metric:'visited',delta:3,ambitions:['explore','legacy'],weight:10},
  reach_region:{label:'Atteindre une nouvelle mer',desc:'Changer de grande région et repousser ta frontière personnelle.',kind:'region',ambitions:['explore'],weight:9},
  wealth_reserve:{label:'Construire une nouvelle réserve',desc:'Augmenter significativement tes Berry disponibles.',kind:'wealth',ambitions:['wealth','legacy'],weight:10},
  world_reputation:{label:'Gagner une reconnaissance mondiale',desc:'Faire progresser ta réputation mondiale de 12 points.',kind:'delta',metric:'worldRep',delta:12,ambitions:['legacy','protect'],weight:9},
  build_bonds:{label:'Renforcer ton cercle proche',desc:'Créer deux relations solides supplémentaires.',kind:'delta',metric:'strongRelations',delta:2,ambitions:['protect','survive'],weight:9},
  mission_record:{label:'Construire un dossier solide',desc:'Réussir trois missions supplémentaires.',kind:'delta',metric:'missionWins',delta:3,ambitions:['legacy','protect','power'],weight:8},
  trade_growth:{label:'Faire fructifier ton commerce',desc:'Réaliser 30 000 B de bénéfice commercial supplémentaire.',kind:'delta',metric:'tradeProfit',delta:30000,ambitions:['wealth'],weight:9},
  crew_growth:{label:'Renforcer ton équipage',desc:'Ajouter deux membres actifs à ton équipage.',kind:'delta',metric:'crewSize',delta:2,ambitions:['legacy','protect'],weight:7},
  stabilize:{label:'Retrouver une base solide',desc:'Atteindre au moins 80% de santé et 70% d’énergie.',kind:'pair',metrics:{health:80,energy:70},ambitions:['survive','protect'],weight:10}
};

const shortTemplates={
  recover_now:{label:'Récupérer',desc:'Revenir à 75% de santé et 60% d’énergie.',kind:'pair',metrics:{health:75,energy:60},weight:10},
  repair_gear:{label:'Réparer ton équipement',desc:'Ne plus avoir d’objet cassé équipé ou stocké.',kind:'zero',metric:'brokenEquipment',weight:10},
  visit_one:{label:'Découvrir une nouvelle île',desc:'Ajouter une nouvelle destination à ton parcours.',kind:'delta',metric:'visited',delta:1,weight:8},
  gain_power:{label:'Progresser au combat',desc:'Gagner 3 points de puissance globale.',kind:'delta',metric:'power',delta:3,weight:8},
  earn_money:{label:'Constituer une réserve',desc:'Gagner 10 000 B nets par rapport au début de l’objectif.',kind:'delta',metric:'money',delta:10000,weight:7},
  one_mission:{label:'Réussir une mission',desc:'Ajouter une mission réussie à ton parcours.',kind:'delta',metric:'missionWins',delta:1,weight:8},
  one_bond:{label:'Créer un lien fort',desc:'Ajouter une relation solide à ton cercle.',kind:'delta',metric:'strongRelations',delta:1,weight:7},
  full_loadout:{label:'Compléter ton équipement',desc:'Équiper les quatre slots actifs.',kind:'threshold',metric:'equippedCount',target:4,weight:6}
};

registry.register('goalsDataV91',{version:'9.1.0',ambitions,intents,mediumTemplates,shortTemplates});
})(window);
