# Modular Architecture — depuis V7.1

## Pourquoi modulariser maintenant

Le moteur live historique reste principalement contenu dans `index.html`. Cette approche a permis des itérations très rapides, mais elle augmente progressivement :

- le risque de régression ;
- la difficulté de tester une fonction isolée ;
- les remplacements de chaîne dangereux ;
- le coût d'ajout de contenu ;
- la dépendance entre UI, données et simulation.

V7.1 adopte une migration incrémentale plutôt qu'une réécriture complète.

## Règle d'architecture

Toute nouvelle fonctionnalité importante doit privilégier :

1. **données séparées** dans `src/data/` ;
2. **logique pure** dans un module `src/<version ou domaine>/` ;
3. **pont minimal** dans le moteur legacy ;
4. **QA directe du module** plus QA d'intégration live.

## Registre de modules

`src/core/module-registry.js` fournit le contrat commun.

Un module s'enregistre avec :

```js
OPL_MODULES.register('nomDuModule', {
  version: 'x.y.z',
  // API
});
```

Le moteur peut ensuite utiliser :

```js
OPL_MODULES.get('nomDuModule')
```

## Première extraction

V7.1 extrait :

- les définitions de grands arcs ;
- le calcul d'éligibilité ;
- la résolution des choix ;
- la classification finale ;
- les styles Arc Director.

Le moteur legacy garde uniquement les opérations nécessitant l'état complet du jeu.

## Plan de migration recommandé

### Étape A
Arc Director — V7.1.

### Étape B — réalisée en V7.2
Combat / Powers 3.0 :
- données de techniques dans `src/data/combat-techniques-v72.js` ;
- matchups de styles ;
- interactions Haki / Fruits ;
- résolution pure dans `src/v72/combat-engine-v72.js` ;
- pont legacy limité à l'orchestration, la sauvegarde et l'UI.

### Étape C
Relations / Persona :
- personnalités canoniques ;
- arcs sociaux ;
- réseau relationnel.

### Étape D
World / Canon :
- personnages ;
- groupes ;
- Fruits ;
- lieux ;
- événements.

### Étape E
UI :
- rendre les panneaux comme composants indépendants.

Le but n'est pas de supprimer immédiatement le moteur legacy, mais de réduire progressivement son rôle jusqu'à ce qu'il devienne essentiellement un orchestrateur.

## Interdictions

Pour limiter une nouvelle accumulation de dette :

- ne pas créer un deuxième fichier monolithique ;
- ne pas mélanger données de contenu et DOM dans les nouveaux modules ;
- ne pas importer directement la sauvegarde dans un module de calcul pur ;
- ne pas réécrire l'intégralité du jeu en une seule migration ;
- chaque extraction doit conserver les anciennes sauvegardes et les QA précédentes.
