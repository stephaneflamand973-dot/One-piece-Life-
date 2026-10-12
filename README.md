# ONE PIECE LIFE · FONDATION VIERGE 0.0.0

Ce dépôt a été **reconstruit à zéro** : l'ancien jeu, ses anciens moteurs, événements, personnages, statistiques et interfaces ne font plus partie de la branche principale.

**Aucune donnée de jeu n'est préchargée.** Aucun personnage, aucune relation, aucun inventaire, aucune monnaie, aucun événement, aucun métier, aucune carrière, aucune jauge, aucun système de progression.

## Ce qui existe

- `index.html` : entrée qui dirige vers `/foundation/`.
- `foundation/index.html` + `styles.css` : une interface neutre, mobile-first.
- `foundation/src/core/state.mjs` : état minimal vide.
- `foundation/src/core/modules.mjs` : registre extensible et ordonné des cinq domaines futurs inspirés de l'architecture de navigation de BitLife (sans réutiliser ses contenus ou ressources).
- `foundation/src/core/engine.mjs` : moteur vide, sans gameplay caché.
- `foundation/src/ui/app.mjs` : affichage de la base vierge, aucune fonctionnalité fictive.
- `test/base.test.mjs` : tests automatiques de non-régression.
- `sw.js` : neutralisation de l'ancien service worker, sans aucune suppression des anciennes sauvegardes locales.

## Point d'accès propre

`https://stephaneflamand973-dot.github.io/One-piece-Life-/foundation/`

Cette nouvelle route **n'existait pas** dans les versions précédentes et ne peut donc pas être une ancienne page HTML mise en cache. Le nouvel identifiant PWA est distinct de l'ancien.

## Règles pour les prochaines étapes

1. Une fonctionnalité est créée dans un module autonome.
2. Le module définit ses données, actions, rendu et tests.
3. La rubrique n'apparaît que lorsque le module complet est enregistré.
4. On ne crée jamais de personnages, événements, statistiques ni argent factices pour remplir un écran.
5. Une seule fonctionnalité est intégrée à la fois, avec validation mobile.

## Tester

```sh
npm test
python3 -m http.server 8000
```
Ouvrir `http://localhost:8000/foundation/`.

## Anciennes versions

Les anciens fichiers ont disparu du nouvel arbre du dépôt mais **restent consultables dans les anciens commits Git**. Les anciennes sauvegardes du navigateur n'ont pas été effacées, et cette base vierge n'en charge aucune. L'ancienne application installée sur l'écran d'accueil peut conserver son propre cache ; utiliser le lien `/foundation/` pour ouvrir sans ambiguïté la nouvelle base.
