# ONE PIECE LIFE — QA V6.6

V6.6.0 — Potential Engine 2.0

## Objectif
La V6.6 transforme le potentiel en mécanique réelle. Les personnages n'ont plus seulement une étiquette globale : chaque domaine possède un plafond et une vitesse de progression propres.

## Potential Engine 2.0
- Profil persistant `potentialV66`.
- Score de potentiel global sur 100.
- Growth Rate global.
- Courbe de développement individuelle :
  - Précoce ;
  - Équilibrée ;
  - Tardive ;
  - Durable.
- Potentiel spécifique pour chacun des 8 attributs.
- Potentiel spécifique pour chacune des 8 compétences.
- Potentiel spécifique pour Observation, Armement et Conquérant.
- Affinité personnelle avec la maîtrise d'un Fruit du Démon.
- Potentiel propre à l'expérience du style de combat.

## Progression
- Les attributs restent soumis aux soft caps et breakthroughs, mais leur plafond naturel provient maintenant du potentiel individuel.
- Les compétences ne peuvent plus progresser automatiquement jusqu'à 100 pour tous les personnages.
- La progression ralentit à proximité du plafond personnel.
- Le Growth Rate modifie directement la vitesse de progression.
- La courbe d'âge change le Growth Rate effectif selon la période de la vie.
- Le Haki respecte maintenant ses caps et Growth Rates individuels.
- Correction annexe : le Haki des Rois continue à progresser après le stade Éveillé au lieu de se figer lorsqu'il devient Maîtrisé.
- La maîtrise du Fruit respecte un cap et un Growth Rate propres.
- L'expérience du style de combat possède elle aussi un plafond individuel.

## Migration
La génération V6.6 est déterministe :
- même seed ;
- même personnage ;
- mêmes données héritées ;
- même profil de potentiel.

Une ancienne sauvegarde ne peut jamais perdre une valeur déjà acquise : si une stat existante dépasse le plafond généré, le plafond est relevé au minimum au niveau actuel.

## Interface
L'onglet Capacités affiche :
- valeur actuelle / plafond personnel ;
- multiplicateur de croissance effectif ;
- Growth Rate global ;
- courbe de développement ;
- cinq domaines de potentiel dominants ;
- potentiel Haki, Fruit et style.

## QA live
Test bloquant : `scripts/qa-v66.mjs`.

Il vérifie :
- save version 660 ;
- déterminisme du profil ;
- différence entre faible et prodigieux ;
- caps individuels ;
- Growth Rates individuels ;
- potentiel Haki latent ;
- sécurité de migration ;
- non-dépassement des caps ;
- courbes précoce/tardive ;
- intégration stats, skills, Haki, Fruit et style ;
- présence de l'interface Potential Engine.

Les tests V6.4 et V6.5 restent exécutés comme régressions.

## PWA
Cache : `one-piece-life-v6-6-0`.
