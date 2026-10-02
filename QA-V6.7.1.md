# ONE PIECE LIFE — QA V6.7.1

V6.7.1 — Stabilization & Unification

## Objectif
La V6.7.1 ne cherche pas à ajouter une nouvelle couche de gameplay. Elle consolide les systèmes V6.4 à V6.7 avant Causal World 2.0 afin qu'une même règle soit appliquée partout.

## Corrections UI
Deux bindings encore hérités utilisaient `$()` (querySelector) puis `.forEach()`, ce qui pouvait casser les boutons correspondants.

Corrigé :
- cartes de missions : `$$('[data-mission]')` ;
- actions de relations : `$$('[data-rel-action]')`.

Le test V6.7.1 exécute réellement les deux fonctions de rendu et vérifie que `querySelectorAll` est appelé.

## Progression unifiée
Nouvelle passerelle : `v671Gain(kind, key, amount, opts)`.

Elle centralise les progressions résiduelles qui contournaient encore le Potential Engine.

Migré vers cette couche :
- talent d'enfance ;
- Discipline des événements ordinaires ;
- Discrétion des Révolutionnaires ;
- Discipline du Gouvernement ;
- Discrétion gagnée via certains World Hooks.

Les compétences respectent :
- potentiel personnel ;
- Growth Rate ;
- rendement décroissant ;
- cap personnel.

Les attributs respectent en plus leur soft cap, sauf lorsqu'un système autorise explicitement un dépassement.

`v63SkillGain()` utilise désormais lui-même la passerelle V6.7.1.

## Crew unifié
L'ancien `simulateCrew()` pouvait encore supprimer directement un équipier de `crew.members`.

Cette voie a été supprimée.

Désormais :
- `simulateCrew()` gère seulement usure du navire et recrutement ;
- les nouveaux membres sont immédiatement enrichis par V6.7 et synchronisés avec Relations ;
- les départs sont exclusivement gérés par `v67CrewTick()` ;
- un départ conserve le personnage comme ancien équipier / relation distante.

Il n'existe donc plus deux autorités concurrentes sur le départ d'un membre.

## Stress carrière live
Le test `scripts/qa-v671.mjs` exécute également une carrière sur le moteur inline réel de `index.html`.

Scénario de référence :
- départ à 15 ans ;
- carrière civile ;
- difficulté Casual ;
- **360 mois simulés** ;
- soit **30 années** ;
- âge final : **45 ans**.

Résultat de la release :
- mois simulés : 360 ;
- décisions générées : 1 ;
- rang final : Maître ;
- taille maximale de sauvegarde : **152,5 Ko** ;
- historique : 240 entrées, plafond respecté ;
- actualités : 60 entrées, plafond respecté ;
- aucune valeur de stat ou compétence hors plafond ;
- aucun NaN détecté.

## Régressions
La chaîne bloquante exécute désormais :
1. V6.4 Risk / Adventure / Rarity ;
2. V6.5 Combat & Mission ;
3. V6.6 Potential Engine ;
4. V6.7 Relationship & Crew ;
5. V6.7.1 Stabilization & Unification.

L'ancien audit `app.js` reste non bloquant et sert uniquement d'indicateur historique.

## Version
- GAME_VERSION : **6.7.1**
- SAVE_VERSION : **671**
- Cache PWA : **one-piece-life-v6-7-1**
