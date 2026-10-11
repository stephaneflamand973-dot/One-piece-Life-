# V11.0.1 — Gestion des sauvegardes de l'accueil

## Comportement
- Trois emplacements : un bouton **Supprimer** apparaît uniquement sur les sauvegardes existantes.
- Une fenêtre de confirmation cite le personnage et l'emplacement.
- **Annuler** ferme la fenêtre sans supprimer ni modifier la sauvegarde.
- **Supprimer définitivement** efface le slot dans IndexedDB et dans localStorage, puis vérifie qu'il ne peut plus être chargé.
- Si l'effacement n'est pas confirmé, afficher un avertissement plutôt qu'un faux succès.
- Le menu est rechargé, l'emplacement supprimé devient disponible pour une nouvelle vie, et les autres parties restent intactes.
- Suppression impossible sur un numéro d'emplacement invalide ou pendant une autre suppression.

## Compatibilité
- Anciennes sauvegardes conservées, pas de migration invasive.
- Navigation et bouton Reprendre inchangés.
- Interface à grande zone tactile sur iPhone et Android.
- GAME_VERSION 11.0.1, SAVE_VERSION 1000, cache PWA one-piece-life-v11-0-1.

## Tests
- scripts/qa-v1101.mjs : vérification statique de l'interface et de la version.
- scripts/qa-v100-runtime.mjs : annulation, suppression individuelle, persistance au rechargement, double effacement IndexedDB/localStorage, et échec contrôlé de la transaction.
- Régression globale historique : workflows GitHub.

## Hotfix 4 — Gestion permanente et protection des données

- Un bouton visible en permanence sur l’accueil ouvre **Gérer / supprimer mes sauvegardes**, indépendamment de la détection initiale des slots.
- Écran dédié avec l’identité de chaque personnage et la possibilité de supprimer chaque partie existante après confirmation.
- Lecture des sauvegardes locales immédiate, puis synchronisation IndexedDB sans supprimer ni modifier les données.
- Protection supplémentaire : la copie locale n’est effacée **qu’après** une transaction IndexedDB de suppression réussie.
- Cache PWA hotfix4 renouvelé ; compatibilité V11.0.1 / données SAVE_VERSION 1000 inchangée.
- Tests statiques et tests intégrés renforcés ; vérifier le déploiement dans les GitHub Actions.
