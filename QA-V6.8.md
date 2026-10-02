# ONE PIECE LIFE — QA V6.8

V6.8.0 — Causal World 2.0

## Objectif

La V6.8 transforme le monde autonome en monde causal.

Avant V6.8, les factions, pressions, territoires, projets et équipages pouvaient évoluer sans modifier suffisamment les opportunités quotidiennes du joueur.

La règle V6.8 est désormais :

> Monde → opportunités du joueur → actions du joueur → monde.

## État causal régional

Chaque région expose maintenant un état calculé à partir de :

- piraterie ;
- criminalité ;
- instabilité ;
- prospérité ;
- présence de la Marine ;
- activité révolutionnaire ;
- influence territoriale ;
- niveau de contestation entre factions ;
- projets actifs ;
- équipages procéduraux actifs.

Le moteur en dérive :

- score de crise ;
- score d'opportunité ;
- danger supplémentaire ;
- risque maritime ;
- indice de prix local ;
- multiplicateur de récompense ;
- faction dominante ;
- faction secondaire ;
- niveau de contestation.

## Missions causales

Le tableau de missions peut désormais être alimenté directement par le monde.

Sources actuellement supportées :

- projet de faction actif ;
- équipage pirate procédural local ;
- forte piraterie ;
- forte activité révolutionnaire ;
- territoire disputé.

Le tableau privilégie jusqu'à deux missions causales et conserve au moins une mission de carrière classique lorsque possible.

Une mission causale conserve :

- sa source ;
- son acteur ;
- sa cible ;
- sa cause ;
- son type de conséquence ;
- son importance ;
- sa région.

L'interface affiche désormais explicitement la cause de la mission.

## Monde → difficulté et récompenses

La difficulté d'une mission utilise maintenant aussi le danger causal régional.

Les récompenses sont modulées par :

- crise ;
- contestation ;
- état du monde local.

Une région dangereuse ou disputée peut donc proposer des contrats plus rémunérateurs.

## Monde → économie

Les investissements directs utilisent maintenant un indice de prix local.

L'indice réagit notamment à :

- prospérité ;
- criminalité ;
- instabilité ;
- présence de la Marine.

Une région stable et prospère peut devenir moins coûteuse.

Une région pauvre et instable peut rendre soins, formation, équipement et renseignements beaucoup plus chers.

Le QA de référence obtient :

- région instable : prix ×1,442 ;
- même région stabilisée : prix ×0,825.

## Monde → voyages

Les routes ne reposent plus uniquement sur le danger statique des lieux.

Le risque maritime V6.8 utilise aussi :

- piraterie régionale ;
- instabilité ;
- contestation territoriale ;
- équipages actifs.

Ce risque influence :

- danger affiché ;
- durée estimée de traversée ;
- danger réel pendant le voyage.

QA de référence :

- route en crise : +28 de risque causal ;
- route stabilisée : +13,4.

## Joueur → monde via les missions

Une mission causale réussie peut désormais :

- ralentir ou accélérer un projet de faction ;
- réduire la puissance d'un équipage local ;
- réduire sa notoriété ;
- éventuellement dissoudre un équipage fortement affaibli ;
- modifier une pression régionale ;
- augmenter l'influence de la faction du joueur ;
- diminuer l'influence adverse ;
- réduire ou augmenter l'instabilité.

Un succès partiel produit un impact inférieur.

Un échec ou un retrait laisse également une conséquence au monde.

## Joueur → monde via les World Hooks

La résolution d'un World Hook agit également sur l'état régional.

Selon le type et le résultat :

- instabilité ;
- criminalité ;
- prospérité ;
- influence de faction

peuvent évoluer.

Chaque résolution est enregistrée dans le registre causal.

## Monde autonome → registre causal

Les événements autonomes V5.8 sont maintenant ingérés dans le registre V6.8.

Cela comprend notamment :

- projets de factions ;
- conflits ;
- relations majeures ;
- événements papillon ;
- mouvements autonomes importants.

Le registre conserve au maximum 80 causes récentes.

## Causal Pulse

Une région suffisamment instable, contestée ou saturée de projets peut automatiquement générer un nouveau World Hook causal.

Ainsi :

événement → changement régional → nouvelle opportunité → intervention du joueur → nouvelle conséquence.

## Interface Monde

Nouveau panneau :

### Pourquoi cette région est comme ça

Il affiche :

- faction dominante ;
- deuxième faction ;
- contrôle disputé ou établi ;
- crise ;
- opportunité ;
- nombre de projets ;
- nombre d'équipages locaux ;
- indice de prix ;
- risque maritime.

Le registre causal affiche également les événements récents et distingue les actions du joueur des événements autonomes.

## Compatibilité

Les systèmes suivants restent actifs :

- V6.4 Risk Director / Adventure 2.0 / Rarity 2.0 ;
- V6.5 Combat & Mission 2.0 ;
- V6.6 Potential Engine 2.0 ;
- V6.7 Relationship & Crew 2.0 ;
- V6.7.1 Stabilization & Unification.

V6.8 sait également fonctionner avec des fixtures ou anciennes données mondiales partielles : `v68Ensure()` initialise les structures manquantes de façon sûre.

## QA live

Test bloquant : `scripts/qa-v68.mjs`.

Il vérifie notamment :

- génération de missions depuis un projet hostile ;
- génération de mission depuis un équipage local ;
- génération depuis forte piraterie ;
- conservation des missions classiques ;
- impact du monde sur l'économie ;
- impact du monde sur les routes ;
- modification d'un projet par une mission ;
- modification territoriale par le joueur ;
- impact sur un équipage procédural ;
- conséquence d'un World Hook ;
- ingestion des événements autonomes ;
- limite du registre causal ;
- simulation causale sur 12 ans ;
- absence de métriques non finies.

### Résultats de référence

- crise initiale : 78,6 / 100 ;
- prix en crise : ×1,442 ;
- prix après stabilisation : ×0,825 ;
- risque route en crise : 28 ;
- risque route stabilisée : 13,4 ;
- registre causal après stress : 33 entrées ;
- stress causal : 12 ans ;
- causalité bidirectionnelle : validée.

La QA V6.7.1 conserve également son stress-test de 30 ans.

## Version

- GAME_VERSION : **6.8.0**
- SAVE_VERSION : **680**
- Cache PWA : **one-piece-life-v6-8-0**
