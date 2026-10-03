# ONE PIECE LIFE — QA V7.6

V7.6.0 — UI & Game Feel 3.0

## Objectif

La V7.6 réduit la charge visuelle du jeu sans supprimer sa profondeur.

Le joueur doit comprendre immédiatement :
- ce qui mérite son attention ;
- ce qui vient de changer ;
- où se trouvent les informations détaillées ;
- où il était lorsqu’il revient dans un onglet.

## Dashboard Focus

L’écran Vie possède un résumé compact avec :
- priorité actuelle ;
- puissance ;
- santé ;
- énergie ;
- réputation ;
- changements du dernier bilan annuel.

Les priorités sont hiérarchisées. Une décision en attente ou une santé critique passe avant une recommandation ordinaire de progression.

## Densité adaptative

Deux modes existent :

### Vue Focus
Les sections secondaires se replient par défaut.

### Tout afficher
Toutes les sections configurées sont déployées.

Chaque section peut ensuite être contrôlée individuellement.

L’état est persistant dans `game.meta.uiV76`.

## Navigation

La V7.6 conserve :
- l’onglet actif ;
- la position de défilement par onglet.

Des badges apparaissent uniquement pour :
- décision / année interrompue ;
- mission ou promotion ;
- relations à haut risque ;
- menaces mondiales importantes.

## Feedback

Le moteur compare deux snapshots d’interface successifs.

Il peut mettre en évidence :
- Berry ;
- santé ;
- énergie ;
- puissance ;
- réputation ;
- rang ;
- localisation.

## Accessibilité et mobile

- amélioration des zones tactiles ;
- transitions courtes ;
- styles mobiles dédiés ;
- désactivation des animations via `prefers-reduced-motion` ;
- aucun défilement forcé vers le haut lors d’un simple changement d’onglet.

## Architecture

Nouveaux fichiers :

```
src/
  data/
    ui-layout-v76.js
  v76/
    ui-components-v76.js
    ui-v76.css
```

Le module logique reste pur :
- normalisation de l’état UI ;
- priorité ;
- badges ;
- deltas annuels ;
- snapshots ;
- différences de snapshots ;
- règles de repli.

Le bridge live conserve les opérations DOM.

## QA

`scripts/qa-v76.mjs` vérifie notamment :
- cinq onglets principaux ;
- plus de vingt définitions de sections ;
- migration de densité et d’onglet ;
- comportement Vue Focus / Tout afficher ;
- hiérarchie des priorités ;
- badges de navigation ;
- deltas annuels ;
- feedback entre snapshots ;
- quatre indicateurs essentiels du dashboard ;
- CSS mobile ;
- reduced motion ;
- dashboard live ;
- migration V7.5 → V7.6 ;
- absence de régression `$().forEach` ;
- cache PWA V7.6.

La chaîne conserve toutes les QA V6.4 → V7.5.

## Version

- GAME_VERSION : **7.6.0**
- SAVE_VERSION : **760**
- Cache PWA : **one-piece-life-v7-6-0**
