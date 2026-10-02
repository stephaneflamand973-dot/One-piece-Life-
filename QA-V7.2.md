# ONE PIECE LIFE — QA V7.2

V7.2.0 — Combat & Powers 3.0

## Objectif

La V7.2 corrige l'une des principales limites restantes de V7.1 : les combats reposaient encore surtout sur trois probabilités génériques — ouverture, échange et endurance — alors que le personnage pouvait déjà posséder un style, plusieurs Hakis et un Fruit du Démon.

V7.2 conserve la stabilité du moteur V6.5, mais lui ajoute une couche de combat modulaire qui transforme réellement ces capacités en choix techniques et en matchups.

---

## Techniques de combat

Le moteur contient désormais au moins 16 techniques génériques et spécialisées.

Exemples :
- Fondamentaux ;
- Ruée offensive ;
- Contre précis ;
- Coupe éclair ;
- Pression au sabre ;
- Tir de précision ;
- Tir mobile ;
- Lecture par Observation ;
- Renforcement par Armement ;
- Pression du Conquérant ;
- Application du Paramecia ;
- Assaut Zoan ;
- Déphasage Logia ;
- Technique de maîtrise du Fruit ;
- Poussée d’éveil.

Les techniques ne sont pas toutes accessibles immédiatement. Elles peuvent dépendre :
- du style de combat ;
- d'une compétence ;
- d'un attribut ;
- d'un Haki précis ;
- d'un type de Fruit ;
- de la maîtrise du Fruit.

L'éveil n'est donc pas une décoration obtenue parce que le scénario le trouve sympathique : la maîtrise requise doit réellement être atteinte.

---

## Matchups de styles

Les styles possèdent désormais des interactions directes :
- Corps-à-corps ;
- Sabreur ;
- Tireur ;
- Mobile / esquive ;
- Équilibré.

Le moteur n'utilise pas un classement absolu. Le bonus dépend du style adverse.

Un même personnage peut donc être plus confortable contre un adversaire et moins contre un autre à puissance générale comparable.

---

## Haki différencié

### Observation

Améliore notamment :
- lecture de l'adversaire ;
- ouverture ;
- techniques de contre ;
- précision.

Une Observation nettement supérieure crée une interaction visible.

### Armement

Devient particulièrement important face aux Logia.

Un combattant sans Armement suffisant peut subir une pénalité majeure pour toucher un Logia, tandis qu'un utilisateur compétent peut neutraliser une partie de cet avantage.

### Conquérant

N'est plus un simple coefficient de puissance.

Une maîtrise suffisante peut exercer une pression supplémentaire lorsque la volonté adverse est inférieure.

---

## Fruits du Démon différenciés

### Paramecia

Accent sur :
- contrôle ;
- polyvalence ;
- applications techniques.

### Zoan

Accent sur :
- endurance ;
- pression au contact ;
- capacité à finir un combat.

### Logia

Accent sur :
- mobilité ;
- déphasage ;
- intangibilité contre les adversaires insuffisamment équipés en Armement.

### Haute maîtrise

À partir de seuils élevés, le moteur déverrouille des techniques supplémentaires.

La Poussée d’éveil exige actuellement une maîtrise de Fruit très élevée.

---

## Doctrines

Le joueur peut maintenant choisir sa doctrine depuis l'écran Capacités :

- Équilibrée ;
- Agressive ;
- Prudente ;
- Précision ;
- Domination.

La doctrine modifie le compromis entre :
- attaque ;
- garde ;
- risque.

Elle ne remplace pas le style de combat choisi à la création. Elle représente la manière dont le personnage décide d'utiliser ce style dans ses affrontements actuels.

---

## Technique signature

Le moteur conserve l'usage des techniques dans la sauvegarde V7.2.

Lorsqu'une technique devient suffisamment récurrente, elle peut devenir la technique signature du personnage.

Cela crée une première continuité entre les combats successifs au lieu de traiter chaque affrontement comme une scène totalement isolée.

---

## Compatibilité V6.5

V7.2 ne supprime pas le moteur de combat historique.

Le flux est désormais :

1. V6.5 calcule sa lecture de base du combat ;
2. V7.2 analyse styles, techniques, Haki, Fruits et doctrine ;
3. V7.2 ajuste les probabilités des trois phases ;
4. la résolution historique conserve dégâts, blessures, retraites, létalité et progression ;
5. l'historique affiche les techniques réellement utilisées.

Si le module V7.2 n'est pas disponible, le calcul V6.5 reste utilisable comme fallback.

---

## Architecture

Nouvelle structure :

```
src/
  data/
    combat-techniques-v72.js
  v72/
    combat-engine-v72.js
```

### combat-techniques-v72.js

Contient uniquement :
- catalogue de techniques ;
- conditions d'accès ;
- matrice de matchups ;
- doctrines.

### combat-engine-v72.js

Contient uniquement la logique pure :
- techniques accessibles ;
- interactions de pouvoirs ;
- matchups ;
- scoring ;
- sélection de technique ;
- génération d'un profil adverse compatible ;
- amélioration du calcul V6.5 ;
- résolution déterministe à partir de jets fournis.

Le module ne lit pas directement le DOM ni la sauvegarde.

Le pont legacy reste dans `index.html`.

---

## Sauvegardes

Nouvel état joueur :

```js
combatV72: {
  doctrine: 'balanced',
  usage: {},
  signature: null,
  lastTechnique: null
}
```

Les sauvegardes V7.1 reçoivent automatiquement cet état lors de la migration.

---

## PWA

Le cache devient :

**one-piece-life-v7-2-0**

Nouveaux fichiers mis en cache :
- `src/data/combat-techniques-v72.js` ;
- `src/v72/combat-engine-v72.js`.

---

## QA V7.2

Le test `scripts/qa-v72.mjs` vérifie notamment :

- enregistrement des deux modules ;
- minimum de 16 techniques ;
- cinq doctrines ;
- techniques spécialisées accessibles uniquement avec les prérequis ;
- Armement réellement avantageux contre Logia ;
- pénalité sans Armement contre Logia ;
- intangibilité Logia ;
- supériorité d'Observation ;
- pression du Conquérant ;
- identité Zoan ;
- identité Paramecia ;
- éveil impossible avec faible maîtrise ;
- éveil disponible à haute maîtrise ;
- déterminisme du moteur pur ;
- résolution victoire/défaite ;
- chargement des modules dans le jeu live ;
- migration V7.1 → V7.2 ;
- stockage de l'usage des techniques ;
- contrôles de doctrine ;
- cache PWA V7.2 ;
- absence de régression `$().forEach()`.

La chaîne conserve également les QA V6.4 → V7.1.

---

## Version

- GAME_VERSION : **7.2.0**
- SAVE_VERSION : **720**
- Cache PWA : **one-piece-life-v7-2-0**
