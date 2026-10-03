# ONE PIECE LIFE — QA V7.7

V7.7.0 — Consequences & Life Events 3.0

## Objectif

La V7.7 donne une mémoire causale au jeu.

Une action peut produire un résultat immédiat puis une conséquence différée, capable elle-même de créer une nouvelle conséquence.

## Familles de conséquences

- Faveur en retour
- Rancune persistante
- Pression institutionnelle
- Dette à régler
- Opportunité différée
- Séquelles d’un ancien combat
- Retour d’un rival
- Appel à la loyauté
- Attention attirée par un Fruit
- Écho de réputation

## Sources

Les conséquences peuvent naître de :
- missions ;
- combats hors mission ;
- interventions mondiales ;
- arcs relationnels ;
- décisions de commandement ;
- création d’équipage ;
- contacts politiques ;
- Fruits du Démon ;
- conflits d’équipage.

## Probabilités dynamiques

Les choix peuvent exploiter :
- Combat / Sabre / Tir ;
- Commandement ;
- Discrétion ;
- Navigation ;
- Volonté ;
- Discipline ;
- Réflexes ;
- Endurance / Résistance ;
- Haki de l’Observation ;
- réputation ;
- autorité ;
- standing interne ;
- argent ;
- force d’une relation.

La gravité de la conséquence pénalise les chances.

## Chaînes

Un échec peut produire une conséquence secondaire.

Exemples :
- ignorer une rancune → pression institutionnelle ;
- refuser une dette → rancune ;
- exploiter publiquement un Fruit et échouer → rivalité ;
- refuser un appel à la loyauté → rancune.

Les chaînes s’arrêtent au niveau 3.

## Interface

Le panneau Vie présente :
- conséquences actives ;
- source ;
- gravité ;
- délai approximatif ;
- nombre de résolutions ;
- escalades ;
- conséquences à forte gravité.

Le dashboard Focus V7.6 remonte les conséquences importantes.

## QA

`scripts/qa-v77.mjs` vérifie :
- au moins 10 types ;
- mapping des triggers ;
- score causal ;
- création et rejet probabilistes ;
- échéances ;
- chances dynamiques selon le profil ;
- résolution réussite / échec ;
- escalade ;
- plafond de chaîne ;
- effets relationnels ;
- conséquence automatique ;
- résumé actif / en retard / grave ;
- migration ;
- branchements live missions / combats / monde / social ;
- tick annuel ;
- cache PWA.

La chaîne conserve toutes les QA V6.4 → V7.6.

## Version

- GAME_VERSION : **7.7.0**
- SAVE_VERSION : **770**
- Cache PWA : **one-piece-life-v7-7-0**
