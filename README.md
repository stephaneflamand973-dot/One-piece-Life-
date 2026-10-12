# One Piece Life

## REBIRTH 0.2 : interface simplifiée

La version 0.1 contenait déjà des sections vides qui donnaient l'impression d'un jeu inachevé et brouillon. Cette version corrige ce problème : **seule la vie du personnage est visible tant que les autres systèmes ne sont pas jouables**.

### Jouable actuellement
- Nouvelle vie et création d'un personnage : genre, nom, mer, lieu.
- Événements annuels et bouton `+ Âge`.
- Statistiques Santé, Bonheur, Intelligence, Apparence.
- Historique de vie complet, depuis la naissance.
- Enregistrement local automatique.
- Nouvelle partie depuis le menu Options (avec confirmation).

### Non exposé volontairement
Activités, Relations, Carrière et Biens seront ajoutés **un à un**, uniquement après réalisation de leurs moteurs et interfaces. L'architecture reste séparée en modules sous `src/core/`. Aucun bouton de fonctionnalité fictive ne doit apparaître.

### Structure
- `src/core/game.mjs` : état et progression annuelle.
- `src/core/events.mjs` : événements.
- `src/core/world.mjs` : mers et lieux.
- `src/core/storage.mjs` : sauvegarde de la version Rebirth.
- `src/ui/app.mjs` : une seule interface utilisateur jouable.
- `styles.css` : style mobile-first.
- `test/*.test.mjs` : régression automatique du moteur et de l'interface.

### Tests et déploiement
```sh
npm test
python3 -m http.server 8000
```
La branche principale est publiée via GitHub Pages.

### Migration depuis les anciennes versions
- Le nouvel identifiant de PWA est identique à celui de l'ancienne app (`./`).
- Le fichier `sw.js` est maintenant un script de migration : il supprime les anciens caches et se désinstalle.
- Les anciennes sauvegardes dans localStorage sont **préservées**. Le nouveau jeu utilise `one-piece-life:rebirth:v1` et ne les importe pas automatiquement.
- En cas de cache persistant dans une PWA installée sur l'écran d'accueil, fermer entièrement puis rouvrir la PWA. Une visite depuis Safari avec rechargement force aussi une nouvelle ressource.

### Principes de développement
Pas d'onglet vide, de métrique factice, de fonction sans effet ou de bouton non opérationnel. Chaque fonctionnalité future exige un moteur testé, une interface mobile et une sauvegarde stable.
