# One Piece Life : REBIRTH

Reconstruction **à zéro** d'un simulateur de vie dans l'univers de One Piece, avec une architecture inspirée de la simplicité de navigation de BitLife. Aucun code ou contenu visuel de BitLife n'est repris.

## Version 0.1 : le socle

- Une nouvelle vie commence à l'âge de 0 an.
- Création du personnage, mer et lieu de naissance (choix ou aléatoire).
- Un bouton **+ Âge** : exactement un an et un événement à chaque clic.
- Quatre statistiques bornées de 0 à 100.
- Historique chronologique et sauvegarde locale automatique.
- Navigation stable : **Vie · Activités · Relations · Carrière · Biens**.
- Emplois ordinaires et carrières spéciales conçus comme **domaines séparés**, non encore implémentés.
- Fin de vie à 100 ans, bouton nouvelle vie et confirmation d'effacement.

Les onglets futurs sont volontairement de simples structures vides. L'ancienne version, ses fichiers et ses sauvegardes ne sont pas migrés dans ce socle.

## Architecture

```text
index.html                Point d'entrée de la PWA statique
styles.css                Interface mobile-first
src/ui/app.mjs            Affichage et interactions, sans règles de simulation
src/core/game.mjs         État et transition annuelle pures, sérialisables
src/core/events.mjs       Catalogue d'événements avec effets numériques
src/core/world.mjs        Sources de vérité pour les mers et les lieux
src/core/storage.mjs      Persistance versionnée et validée
test/game.test.mjs        Tests du moteur et de la sauvegarde
```

**Contrat de conception :** les prochaines mécaniques doivent posséder leur propre module avec un état déclaré, une transition testée et une interface reliée à la même source de vérité. Ne jamais rajouter de moteur dans `app.mjs`.

## Tester et exécuter

```sh
npm test
python3 -m http.server 8000
```

Ouvrir `http://localhost:8000`. Le projet n'a ni dépendance npm, ni backend, ni coût d'hébergement obligatoire.

## Sauvegardes

La clé de stockage est `one-piece-life:rebirth:v1`. Elle ne remplace et ne supprime **aucune** ancienne sauvegarde du jeu. Aucun import des anciennes sauvegardes n'est volontairement réalisé.

## Étapes suivantes

1. Relations (famille, amis, jauges de proximité, interactions)
2. Activités quotidiennes et décisions avec conséquences
3. Métiers ordinaires (contrat, salaire, promotions)
4. Carrières spéciales (Pirate, Marine, Gouvernement, Chasseurs de primes), isolées des métiers ordinaires
5. Économie et inventaire
6. Monde vivant, exploration, événements canoniques

Chaque étape doit passer tests de logique, test de sauvegarde et vérification mobile.
