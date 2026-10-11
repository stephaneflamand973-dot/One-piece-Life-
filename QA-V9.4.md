# ONE PIECE LIFE — QA V9.4

## World Intelligence 5.0

Le moteur conserve un monde autonome dont une partie des actions est cachée. La V9.4 ne révèle **jamais** un événement hors écran inconnu ni une rumeur explicitement démentie.

- Tableau des renseignements affiché dans Monde et aperçu dans Vie.
- Hiérarchisation selon urgence, région, échéance et écart de puissance sans modifier les RNG existants.
- Signaux issus des opportunités V5.9 encore ouvertes, des rumeurs connues, des événements autonomes explicitement connus et des pressions régionales visibles.
- Rumeurs non vérifiées clairement distinguées des informations confirmées.
- Filtres « Priorité », « Ma région », « Suivis », « Non lus ».
- Suivi individuel et suivi inactif, marqueurs de lecture, possibilité d'ouvrir directement une opportunité V5.9 existante.
- Le bouton Examiner utilise la décision V5.9, ses probabilités et ses conséquences intactes.
- Sauvegardes compactes : 24 suivis, 90 lus, 35 actions d'historique.
- Compatibilité automatique V9.3 → V9.4.

## Version

- GAME_VERSION : **9.4.0**
- SAVE_VERSION : **940**
- Cache PWA : **one-piece-life-v9-4-0**

## QA

Le script `scripts/qa-v94.mjs` couvre le filtre local, la distinction rumeur/fait, la non-divulgation des événements cachés, les expirations, la stabilité des suivis, les limites de stockage, l'interface et le cache PWA.
