# ONE PIECE LIFE — QA V7.9

V7.9.0 — Education & Youth 3.0

## Objectif

La V7.9 transforme les années 5–15 en phase jouable, avec apprentissage, orientation et conséquences sur la carrière.

## Parcours

Huit parcours existent :
- formation générale ;
- dojo & arts martiaux ;
- apprentissage maritime ;
- médecine & soins ;
- sciences & techniques ;
- artisanat & commerce ;
- survie & exploration ;
- préparation au service.

Chaque parcours possède ses propres pondérations de compétences, statistiques et affinités de carrière.

## Progression

Le moteur suit :
- connaissances ;
- pratique ;
- discipline ;
- assurance ;
- réseau ;
- mentor ;
- soutien extérieur ;
- examens ;
- validations ;
- historique d’orientation.

La progression dépend du talent d’apprentissage, de l’énergie et du foyer V7.8.

## Évaluations

Quatre étapes :
- 8 ans : bases ;
- 10 ans : fondation ;
- 13 ans : orientation ;
- 15 ans : bilan de formation.

Les résultats possibles sont :
- distinction ;
- validé ;
- partiel ;
- échec.

## Carrière

Chaque carrière reçoit un score de préparation avant le choix :
- Marine ;
- Pirates ;
- voie civile ;
- chasseurs de primes ;
- Révolutionnaires ;
- Gouvernement.

Aucune carrière n’est interdite par une mauvaise préparation.

La préparation influence seulement le départ : XP, réputation, standing et petites progressions pertinentes.

## QA

`scripts/qa-v79.mjs` vérifie :
- 8 parcours ;
- 5 rythmes ;
- 4 examens ;
- 6 événements ;
- stades d’âge ;
- progression selon talent et environnement ;
- pondération des compétences ;
- changement de parcours ;
- chances dynamiques d’examen ;
- impossibilité de doubler un examen ;
- affinités de carrière ;
- bonus de préparation ;
- événements de jeunesse ;
- déterminisme à rolls fixes ;
- migration ;
- intégration cycle de vie ;
- affichage des scores de préparation ;
- cache PWA.

La chaîne conserve toutes les QA V6.4 → V7.8.

## Version

- GAME_VERSION : **7.9.0**
- SAVE_VERSION : **790**
- Cache PWA : **one-piece-life-v7-9-0**
