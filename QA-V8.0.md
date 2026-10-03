# ONE PIECE LIFE — QA V8.0

V8.0.0 — Simulation Core & Life Director 4.0

## Objectif

V8.0 consolide les systèmes V7.x afin de produire moins de bruit, davantage de continuité narrative et une interface plus légère.

## Priority Director

Le moteur compare les candidats issus de :
- conséquences V7.7 ;
- jeunesse V7.9 ;
- vie personnelle V7.8 ;
- décisions générales du moteur.

Le score tient compte :
- importance ;
- gravité ;
- urgence ;
- causalité ;
- caractère personnel ;
- étape d’âge critique ;
- retard ;
- répétition récente.

Une catégorie répétée plusieurs fois en peu de temps reçoit une pénalité.

## Life Director 4.0

À la fin de chaque année :
- tous les événements sont classés ;
- un événement principal est retenu ;
- deux événements secondaires au maximum sont conservés ;
- le reste est compressé dans le bilan.

Un chapitre n’est créé qu’à partir d’une année significative.

Des événements successifs du même thème renforcent le chapitre existant.

## Legacy Ledger

Les preuves permanentes sont classées en :
- exploit ;
- impact mondial ;
- maîtrise ;
- leadership ;
- héritage ;
- liens historiques ;
- exploration.

La liste détaillée est limitée à 80 entrées, mais les totaux par catégorie restent permanents.

Le score d’héritage final utilise le maximum entre :
- situation actuelle ;
- preuves durables ;
- meilleur score historique.

## Lazy Render

`render()` ne reconstruit plus :
Vie + Personnage + Capacités + Relations + Monde

à chaque modification.

Il rend :
- l’interface globale ;
- uniquement l’onglet actif.

Un changement d’onglet déclenche un rendu frais de ce panneau.

## QA

`scripts/qa-v80.mjs` vérifie notamment :
- priorité des conséquences sévères ;
- pénalité de répétition ;
- sélection narrative annuelle ;
- compression du bruit ;
- fusion de chapitres ;
- archivage uniquement de chapitres significatifs ;
- déduplication du Legacy Ledger ;
- conservation des totaux après rotation des 80 détails ;
- non-régression du meilleur score d’héritage ;
- routage d’un seul panneau lourd ;
- branchements live ;
- migration ;
- cache PWA ;
- disparition de l’ancien rendu eager.

La chaîne conserve les QA V6.4 → V7.9.

## Version

- GAME_VERSION : **8.0.0**
- SAVE_VERSION : **800**
- Cache PWA : **one-piece-life-v8-0-0**
