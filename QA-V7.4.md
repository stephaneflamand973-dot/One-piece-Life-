# ONE PIECE LIFE — QA V7.4

V7.4.0 — Relations & Persona 3.0

## Objectif

La V7.4 transforme les relations en systèmes persistants capables de mémoriser ce qui s’est réellement passé entre deux personnages.

V6.7 fournissait déjà confiance, respect, affection, loyauté, rivalité, mentorat et équipage. V7.4 conserve ces données, mais ajoute une couche de persona et de mémoire qui donne du sens à leur évolution.

---

## Valeurs et compatibilité

Chaque relation reçoit une liste de valeurs.

Elles proviennent de :
- son tempérament ;
- son ambition ;
- sa persona canonique V7.0 lorsqu’elle existe.

Le personnage joueur possède lui aussi des valeurs contextuelles dérivées de :
- son ambition ;
- sa faction ;
- son style de combat ;
- son plan annuel.

Le moteur compare ces valeurs et produit une compatibilité dynamique.

Deux relations recevant la même interaction peuvent donc évoluer différemment.

---

## Mémoire relationnelle

Chaque relation peut conserver jusqu’à 16 souvenirs marquants.

Un souvenir contient notamment :
- type ;
- description ;
- valence positive ou négative ;
- importance ;
- date ;
- tags contextuels.

Les souvenirs récents pèsent davantage que les anciens, sans effacer totalement le passé.

Les souvenirs influencent :
- compatibilité ;
- force du lien ;
- fiabilité ;
- tensions non résolues ;
- soutien en mission ;
- risque de fracture.

---

## Événements mémorisés

V7.4 crée notamment des souvenirs lors de :
- rencontres avec un personnage canonique ;
- interactions directes ;
- début ou fin d’un mentorat ;
- refus d’un mentorat ;
- conflit d’équipage ;
- départ d’un équipier ;
- événement relationnel positif ;
- conflit relationnel ;
- résolution d’un arc social.

---

## Interactions 3.0

Les interactions existantes sont conservées :
- Passer du temps ;
- S’entraîner ;
- Aider.

Deux interactions supplémentaires apparaissent :
- Se confier ;
- Confronter.

Leur effet dépend désormais de la compatibilité.

Une confrontation avec une relation respectueuse peut augmenter le respect.

La même confrontation dans un lien déjà toxique peut aggraver la tension.

---

## Arcs sociaux

Six arcs relationnels sont actuellement disponibles :

1. Épreuve de confiance ;
2. Rivalité ouverte ;
3. Déclic de mentorat ;
4. Choix de loyauté ;
5. Fracture relationnelle ;
6. Réconciliation.

Ils ne sont pas tirés arbitrairement.

Chaque arc possède :
- familiarité minimale ;
- force de lien minimale ;
- conditions de confiance, respect, loyauté ou rivalité ;
- délai empêchant la répétition immédiate.

Lorsqu’un arc devient pertinent, il peut interrompre l’année comme une vraie décision.

Le choix devient ensuite un souvenir durable.

---

## Personnages canoniques

Les personas V7.0 sont directement utilisées.

Exemples :
- Shanks : liberté et loyauté ;
- Mihawk : maîtrise et indépendance ;
- Robin : savoir et loyauté ;
- Sakazuki : ordre et discipline ;
- Dragon : liberté, révolution et stratégie.

Une rencontre canonique ajoute désormais une mémoire spécifique et les valeurs du personnage influencent réellement le lien futur.

---

## Soutien et mentorat

Le soutien relationnel en mission utilise désormais :
- force du lien ;
- compatibilité ;
- fiabilité.

Le mentorat utilise maintenant également :
- lien V7.4 ;
- compatibilité ;
- mémoire commune.

Un mentor extrêmement proche et compatible devient donc mécaniquement plus utile qu’un mentor purement « valide » selon les anciens seuils.

---

## Interface

Le panneau Relations affiche désormais :
- taille du réseau ;
- force moyenne ;
- nombre de relations de confiance ;
- rivalités fortes ;
- nombre de souvenirs marquants ;
- état du lien ;
- compatibilité ;
- stabilité / risque de fracture ;
- valeurs principales ;
- souvenir dominant ;
- objectif des personnages canoniques lorsqu’il est connu.

---

## Architecture

Nouveaux fichiers :

```
src/
  data/
    relation-personas-v74.js
  v74/
    relation-persona-engine-v74.js
```

Le moteur pur gère :
- valeurs ;
- normalisation ;
- compatibilité ;
- mémoire ;
- interactions ;
- classification des liens ;
- arcs sociaux ;
- soutien ;
- risque de fracture.

Il ne dépend ni du DOM ni directement de la sauvegarde.

---

## QA V7.4

`scripts/qa-v74.mjs` vérifie notamment :

- catalogue de valeurs ;
- interactions ;
- 6 arcs sociaux ;
- 12 choix d’arc ou plus ;
- compatibilité cohérente ;
- poids décroissant des anciens souvenirs ;
- interaction modulée par compatibilité ;
- effet des souvenirs positifs et négatifs ;
- classification confiance / rivalité ;
- éligibilité des arcs ;
- résolution et mémoire des arcs ;
- rupture explicite ;
- soutien des relations fortes ;
- risque de fracture des relations fragiles ;
- conservation des valeurs explicites à zéro ;
- intégration live ;
- mémoire des rencontres canoniques ;
- nouvelles interactions ;
- migration V7.3 → V7.4 ;
- cache PWA V7.4.

La chaîne conserve toutes les QA V6.4 → V7.3.

---

## Version

- GAME_VERSION : **7.4.0**
- SAVE_VERSION : **740**
- Cache PWA : **one-piece-life-v7-4-0**
