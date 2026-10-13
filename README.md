# One Piece Life V0.4.4 · Amour, couple et enfants

## Nouveautés jouables
- **Rencontres amoureuses** à partir de 18 ans : partenaires générés avec personnalité, âge, affinité, confiance et respect.
- **Rendez-vous** aux résultats probabilistes, faisant évoluer les liens du couple.
- **Mariage** : relation d’au moins un an, confiance et affinité suffisantes, demande susceptible d'être refusée.
- **Séparations** : action volontaire, et possible séparation annuelle en cas de tensions durables.
- **Enfants** : projet familial possible entre 20 et 52 ans pour les deux partenaires, après deux ans de relation stable, avec une chance de réussite. Chaque enfant devient un PNJ unique avec un lien parental, un âge et une personnalité propres.
- Les enfants vieillissent, atteignent 18 ans puis poursuivent leur existence au sein de l’histoire familiale.
- Maximum quatre partenaires historiques et quatre enfants pour garder les relations lisibles.
- L’historique des anciens partenaires et la filiation des enfants restent consultables.
- Rencontres, mariages, naissances et séparations enrichissent le journal de l’année **sans créer d’année supplémentaire**.
- Les actions de couple consomment les mêmes trois actions sociales annuelles ; pas d'exploitation infinie.
- Les quatre groupes existants restent dans l’onglet Relations ; **aucun nouvel onglet**.

## Sauvegardes
La version utilise la clé `opl:foundation:life-v044` et `SCHEMA_VERSION=8`. Import des parties V0.4.3 à V0.2 sans écraser les sauvegardes originales. Les parties existantes gardent leur famille, les amis, les groupes, les événements de PNJ et leur progression.

## Structure
- `core/romance.mjs` : validation des unions, rencontres, mariages, séparations et enfants.
- `core/relationships.mjs` : validation et vieillissement des nouveaux membres de la famille.
- `core/state.mjs` : transitions immuables et respect des règles de sauvegarde.
- `ui/relations-view.mjs` : affichage du couple et des enfants dans l'onglet existant.
- `test/romance.test.mjs` : âge, confiance, mariage, enfants, séparation, 120 ans, migrations et erreurs de stockage.
- `test/browser/mobile.mjs` : parcours amoureux, création de famille et rechargement sur Chromium mobile et WebKit iPhone simulé.

Ce module ne gère pas encore la vie sentimentale autonome des enfants adultes ni les petits-enfants. Ils pourront venir dans une future mise à jour avec un modèle de filiation plus avancé.
