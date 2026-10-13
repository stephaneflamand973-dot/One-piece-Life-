# One Piece Life · V0.4.5 : factions, équipages et réputation

## Nouveau module jouable dans Relations
- Dès 16 ans, **rejoindre les Pirates, la Marine ou les Révolutionnaires**, sans créer de nouvel onglet.
- Affiliations fictives intégrées au cadre de One Piece : Équipage des Alizés, Base de la Mouette ou Cellule du Vent. Les personnages sont originaux et ne prétendent pas être des personnages canoniques.
- Quatre contacts persistants à l'adhésion : capitaine/commandant/responsable, mentor, allié et rival, chacun doté de traits, affinité, confiance, respect et rivalité.
- Quatre actions : entraînement avec un mentor, mission de faction, soutien à un allié, défi contre un rival.
- Résultats probabilistes : la confiance, les relations et la réputation influencent la réussite. Une action réussie peut aussi faire évoluer l'influence de la faction.
- **Loyauté (0–100), réputation (0–100) et influence des trois factions (0–100)**, avec historique sauvegardé.
- Aux âges-clés, votre réputation et votre loyauté produisent parfois un événement de reconnaissance ou de défiance, mentionné dans le fil principal.
- Une seule action de faction par an, au sein du quota commun de trois actions sociales.
- Les membres vieillissent et peuvent décéder. Les contacts disparus ne peuvent plus être sollicités.
- Le choix de faction est permanent en V0.4.5 : changement d’allégeance et équipages canoniques sont volontairement réservés à une version ultérieure.

## Continuité BitLife
- Le même onglet **Relations** regroupe famille, amis, couple et factions.
- **Une pression sur + Âge = un an**, sans création d'une nouvelle entrée par les interactions.
- Les événements du monde ne prennent jamais la place d’une décision principale ou d’une initiative déjà en attente.

## Sauvegardes
- `SCHEMA_VERSION=9` et `opl:foundation:life-v045`.
- Migration V0.4.4 → V0.4.5, puis chaîne conservatrice depuis V0.2.
- Aucune suppression des anciennes sauvegardes ; les relations, décisions et années existantes demeurent intactes.

## Architecture et tests
- `foundation/src/core/world-relations.mjs` : création des contacts, probabilité, réputation, loyauté, événements annuels et validation.
- `foundation/src/ui/relations-view.mjs` : affichage compact de la faction et de ses quatre contacts.
- `test/world-relations.test.mjs` : migrations, choix des trois factions, probabilités, actions, vie entière et protection des états.
- QA Chromium mobile 320/390/430 px et WebKit iPhone simulé : adhésion, mission, sauvegarde, reprise et fonctionnement des relations antérieures.

Lancer `npm test` pour vérifier la logique. Aucun service payant nécessaire.
