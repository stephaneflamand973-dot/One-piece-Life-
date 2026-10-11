# ONE PIECE LIFE — V10.8 : Dialogues, affrontements et mémoire

## 1. Dialogues contextuels
- Les options sociales de chaque rencontre ouvrent un dialogue avec trois attitudes : sincérité, alliance, bluff.
- Les réponses évoquent la faction concernée. Les chances tiennent compte du Commandement ou de la Discrétion, des souvenirs, de la confiance et de la rivalité.
- Une réponse influence effectivement le choix original : aucune deuxième action annuelle n'est facturée.

## 2. Combats à quatre tours maximum
- Attaque directe : choix entre garde, feinte, frappe, assaut décisif et retraite.
- Dégâts, blessures et énergie sont appliqués tour par tour, avec riposte adverse et santé restante affichée.
- Le combat peut se terminer par victoire, défaite ou retraite. Reprendre une sauvegarde restaure le tour en attente.
- Aucun bonus d'expérience, prime ou découverte lors du passage d'un an.

## 3. Relations persistantes et opportunités
- Historique des 24 contacts mémorisés : nombre de rencontres, dernière issue, confiance, rivalité, dernière réplique.
- Le moteur V10.7 consulte désormais confiance et rivalité pour calculer les chances suivantes.
- Partager ou cartographier une découverte réussie crée une piste ciblée, à activer manuellement dans Monde.
- Utiliser une piste oriente la prochaine rencontre vers la faction concernée et améliore la préparation ; elle n'est utilisable qu'une seule fois.
- Les pistes n'apparaissent pas automatiquement au passage d'un an.

## Intégrité et compatibilité
- Etat V10.8 stocké dans player.encounterDepthV108, migration à la lecture des anciennes sauvegardes.
- Quota des expéditions V10.6 conservé à trois actions annuelles, sans nouvelle dépense pour les choix successifs.
- GAME_VERSION=10.8.0, SAVE_VERSION=1000, cache PWA one-piece-life-v10-8-0.
- Contrôle statique, moteur et dynamique avec scripts/qa-v108.mjs et scripts/qa-v100-runtime.mjs.

## Limites
- Combat simplifié en quatre tours maximum, sans affrontements de groupes synchronisés.
- Répliques contextuelles prédéfinies, et non génération libre par personnage.
