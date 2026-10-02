# ONE PIECE LIFE — QA V6.5

V6.5.0 — Combat & Mission 2.0

## Objectif
La V6.5 remplace la résolution de combat essentiellement mono-jet par une résolution tactique légère, compatible avec le rythme annuel du jeu. Elle approfondit les missions sans transformer chaque année en micro-management.

## Combat 2.0
- Chaque affrontement est évalué sur trois phases : **ouverture**, **échange** et **endurance**.
- Gagner au moins deux phases remporte le combat.
- La probabilité de chaque phase dépend de la puissance globale, des Réflexes, de l’Endurance, de la Résistance, des compétences de combat, du Haki, de l’état physique et de l’approche de mission.
- La santé et l’énergie modifient réellement l’efficacité.
- L’équipement réduit les dégâts et contribue à la préparation.
- Le soutien d’équipage peut améliorer un affrontement de mission.
- Le renseignement actif améliore la préparation et l’évaluation du combat.
- Une défaite n’est plus automatiquement un jet létal immédiat : la fuite, les Réflexes, l’Agilité et l’Observation réduisent le risque fatal.
- Un combat perdu après une phase remportée peut se terminer par un **repli sous pression**.
- L’approche prudente peut déclencher un **retrait tactique avant l’affrontement** si les conditions sont trop mauvaises.

## Mission 2.0
- La préparation affichée tient maintenant compte de :
  - la compétence réellement pertinente ;
  - la puissance ou spécialité adaptée ;
  - la fatigue ;
  - la santé et l’énergie ;
  - l’équipement ;
  - le renseignement ;
  - le soutien d’équipage.
- L’écran Missions affiche une estimation de réussite et les bonus de préparation utiles.
- **Approche professionnelle** : équilibre résultat / risque.
- **Approche prudente** : meilleure sécurité, retrait plus facile, récompense réduite.
- **Approche audacieuse** : pression offensive et récompense augmentées, dégâts et létalité supérieurs.
- Les missions non combattantes peuvent désormais produire un **succès partiel**.
- Un succès partiel donne une fraction de la récompense et de l’XP au lieu du vieux tout-ou-rien.
- Un échec non combattant peut produire une complication mesurée sur l’énergie ou la santé.
- Le risque annuel consommé par une mission dépend de l’approche : prudent 0,78× ; professionnel 1× ; audacieux 1,18×.

## Compatibilité V6.4
Les systèmes V6.4 restent actifs :
- Risk Director ;
- Adventure 2.0 ;
- Rarity 2.0 ;
- World Hooks à durée réelle ;
- cooldown Fruit de 120 mois.

Le test `scripts/qa-v64.mjs` reste exécuté comme test de régression.

## QA live
Test bloquant : `scripts/qa-v65.mjs`.

Il vérifie notamment :
- version de sauvegarde 650 ;
- moteur live réellement extrait de `index.html` ;
- influence équipement + renseignement + équipage sur la préparation ;
- influence santé/énergie sur le combat ;
- différence tactique entre prudent et audacieux ;
- présence des trois phases de combat ;
- retrait tactique ;
- succès partiel ;
- absence du vieux moteur de combat mono-jet.

## PWA
Cache : `one-piece-life-v6-5-0`.
