# ONE PIECE LIFE — V9.5 Action Hub & UX 6.0

## Objectif

Réduire la dispersion de l'interactivité sans supprimer les mécaniques V6–V9.4.

## Livraison

- 5 onglets de navigation : **Vie, Actions, Profil, Relations, Monde**
- Capacités et Haki conservés dans une sous-navigation du Profil
- Centre d'Actions complet : recherche, catégories, suggestions contextuelles et favoris
- 8 filtres : Tout, Carrière, Combat, Relations, Voyage, Berry, Quotidien, Favoris
- Accès direct aux actions de préparation annuelle, missions, doctrines, relations, voyages, événements V9.4 et services locaux
- Renvoi ciblé vers les écrans avancés pour les interfaces complexes (équipement, gestion de foyer, échanges de marchandises, objectifs)
- Explications d'indisponibilité pendant une année active ou quand une décision attend sa résolution
- Favoris (10) et historique récent (12) persistants, bornés dans la sauvegarde
- Recherche insensible aux accents et rendu mobile
- Actions réelles via les fonctions existantes, sans moteur parallèle, reroll ou altération de probabilités

## Compatibilité

- `GAME_VERSION=9.5.0`
- `SAVE_VERSION=950`
- PWA : `one-piece-life-v9-5-0`
- Migration des sauvegardes de versions antérieures sans réinitialisation des autres sous-systèmes.
- Navigation historique `abilities` conservée pour les sauvegardes l'utilisant.

## Vérifications

Le script `scripts/qa-v95.mjs` teste les catégories, la recherche, la persistance des favoris, les raccourcis, les actions dynamiques, les verrous annuels, la priorité des décisions, les cinq onglets, l'accès aux capacités et la mise en cache PWA. Les tests de régression existants sont toujours exécutés par CI.

## Test d'intégration V9.5

Le script `scripts/qa-v95-runtime.mjs` exécute le moteur réel dans un environnement navigateur simulé, confirme le lancement d'une mission via le Centre d'Actions, la sauvegarde des favoris, le passage Profil → Capacités → Actions et les verrouillages pendant une année en cours ou une décision.
