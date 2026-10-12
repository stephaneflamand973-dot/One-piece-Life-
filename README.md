# ONE PIECE LIFE · Fondation V0.2

La base vierge accueille **une première mécanique réelle**, isolée de la navigation.

## Ce qui est jouable
- Créer une vie à **0 an**, avec prénom, nom, genre, mer et lieu de naissance, au choix ou aléatoires.
- Choisir un lieu parmi un petit catalogue de départ ; le catalogue est dans `src/core/places.mjs`, prêt à être étendu.
- Faire progresser le personnage d’**exactement une année par pression** sur le bouton central « + Âge ».
- Afficher l'historique chronologique des années et conserver la partie automatiquement en local.
- Reprendre sa partie après fermeture/rechargement.
- Recommencer une vie avec confirmation. **Les sauvegardes de l'ancien jeu restent intactes.**
- Parcourir les cinq rubriques stables ; seul le domaine `Vie` a un véritable module.
- Sur un autre onglet, le bouton central retourne à la rubrique Vie **sans faire vieillir**.

## Ce qui n'est pas encore présent
Aucun événement aléatoire de scénario, relation, statistiques, carrière, monnaie, inventaire, combat ou progression du monde. Les autres rubriques restent vides intentionnellement.

## Architecture

```
foundation/src/core/
  engine.mjs       contrôleur et transitions avec sauvegarde atomique
  state.mjs        état sérialisable, création et âge
  life.mjs         règles pures de naissance et vieillissement
  places.mjs       catalogue autonome des lieux de départ
  storage.mjs      persistance versionnée sous clé distincte
  modules.mjs      registre de modules
  navigation.mjs   routes et retour
foundation/src/ui/
  app.mjs          navigation, délégation des événements
  life-view.mjs    écran de création et journal de vie
```

La première sauvegarde porte la clé `opl:foundation:life-v02`. Aucun import des sauvegardes historiques ; aucun effacement des anciennes clés.

## Test
```sh
npm test
python3 -m http.server 8000
```
Puis ouvrir `http://localhost:8000/foundation/`.

Tests couverts : démarrage à zéro, un an par pression, progression à 120 ans, arrêt après fin de vie, reprise locale, refus des sauvegardes invalides, échec de stockage sans perte silencieuse, routes et modules.

## Suite
Ajouter les interactions et événements annuels depuis un moteur d'événements **indépendant**, puis les relations.
