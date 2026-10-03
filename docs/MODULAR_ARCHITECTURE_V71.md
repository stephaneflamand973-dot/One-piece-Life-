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

### Étape C — réalisée en V7.3
Career / Organization 3.0 :
- données de branches et responsabilités dans `src/data/career-organizations-v73.js` ;
- moteur pur de standing, confiance, influence et promotions dans `src/v73/career-organization-engine-v73.js` ;
- missions reliées au dossier de carrière ;
- autorité V6.9 enrichie par l’état organisationnel.

### Étape D — réalisée en V7.4
Relations / Persona 3.0 :
- données de valeurs, interactions et arcs dans `src/data/relation-personas-v74.js` ;
- mémoire relationnelle, compatibilité, classification et résolution d’arcs dans `src/v74/relation-persona-engine-v74.js` ;
- personas canoniques V7.0 reliées aux souvenirs et à la compatibilité ;
- mentorat et soutien en mission enrichis par le lien réel.

### Étape E — réalisée en V7.5
World / Canon 3.0 :
- règles de factions, régions, ancres historiques et circulation des Fruits dans `src/data/world-canon-v75.js` ;
- planification d’actions, conflits, synchronisation des équipages, cohérence des Fruits et calcul des hotspots dans `src/v75/world-canon-engine-v75.js` ;
- World Director relié à V5.8 Autonomous World, V6.8 Causal World et V7.0 Canon ;
- cohérence des événements historiques enrichie par la présence réelle de leurs acteurs.

### Étape F — réalisée en V7.6
UI / Game Feel 3.0 :
- configuration de navigation et de sections dans `src/data/ui-layout-v76.js` ;
- état Focus, priorités, badges, deltas et snapshots dans `src/v76/ui-components-v76.js` ;
- styles mobiles, feedbacks et composants visuels dans `src/v76/ui-v76.css` ;
- le moteur legacy reste fournisseur de contenu, tandis que la couche V7.6 orchestre présentation, densité et navigation.

### Cycle 2 — V7.7
Consequences / Life Events 3.0 :
- catalogue des conséquences dans `src/data/consequences-v77.js` ;
- création, échéances, probabilités dynamiques, résolution et chaînes dans `src/v77/consequence-engine-v77.js` ;
- intégration aux missions, combats, relations, choix et événements mondiaux ;
- présentation compacte dans l’écran Vie et le dashboard Focus.

### Cycle 2 — V7.8
Personal Life / Household 3.0 :
- données de logement et événements personnels dans `src/data/personal-life-v78.js` ;
- coûts annuels, stabilité, foyer, événements, contacts adultes et évolution des enfants dans `src/v78/personal-life-engine-v78.js` ;
- intégration aux relations, à l’économie annuelle et aux conséquences V7.7 ;
- état persistant du foyer et migration des anciennes sauvegardes.

### Cycle 2 — V7.9
Education / Youth 3.0 :
- parcours, rythmes, examens et événements dans `src/data/education-v79.js` ;
- progression mensuelle, chances d’examen, préparation carrière et dossier de jeunesse dans `src/v79/education-engine-v79.js` ;
- intégration aux étapes de vie, activités, foyer V7.8 et choix de carrière ;
- migration synthétique des anciennes vies adultes sans bonus rétroactif.

Le but n'est pas de supprimer immédiatement le moteur legacy, mais de réduire progressivement son rôle jusqu'à ce qu'il devienne essentiellement un orchestrateur.

## Interdictions

Pour limiter une nouvelle accumulation de dette :

- ne pas créer un deuxième fichier monolithique ;
- ne pas mélanger données de contenu et DOM dans les nouveaux modules ;
- ne pas importer directement la sauvegarde dans un module de calcul pur ;
- ne pas réécrire l'intégralité du jeu en une seule migration ;
- chaque extraction doit conserver les anciennes sauvegardes et les QA précédentes.
