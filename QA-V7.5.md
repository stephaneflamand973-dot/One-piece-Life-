# ONE PIECE LIFE — QA V7.5

V7.5.0 — World & Canon 3.0

## Objectif

La V7.5 ajoute un World Director modulaire afin que les éléments canoniques cessent d’évoluer dans des sous-systèmes isolés.

Le moteur coordonne désormais personnages, équipages, Fruits, régions et événements historiques.

## Actions hors écran

Les personnages majeurs peuvent :
- se déplacer ;
- affronter un adversaire ;
- coopérer ;
- exercer une pression territoriale ;
- rechercher un Fruit libre ;
- se replier pour récupérer.

Les probabilités utilisent la faction, l’importance, la puissance, la santé, la dynamique locale et le contexte régional.

## Cohérence des équipages

Les équipages canoniques :
- suivent leur leader vivant ;
- voient leur puissance évoluer avec lui ;
- perdent de la dynamique lorsqu’il disparaît ;
- peuvent être fracturés ou dissous lorsque leur leader meurt.

## Fruits du Démon

Le moteur :
- relie les détenteurs aux personnages canoniques via des alias explicites ;
- remet un Fruit dans le monde lorsque son détenteur meurt ;
- conserve la région de réapparition ;
- permet à certains personnages sans Fruit d’en rechercher un libre ;
- conserve un historique des transferts.

## Cohérence historique

Des événements majeurs possèdent des ancres supplémentaires.

Exemples :
- Marineford nécessite Ace, Barbe Blanche et son équipage ;
- Dressrosa dépend de Doflamingo et de sa famille ;
- Wano dépend notamment de Kaido, Luffy, des Cent Bêtes et des Chapeaux de Paille.

Les anciennes dépendances entre événements restent actives.

## Hotspots

Chaque région reçoit un score dynamique combinant :
- instabilité ;
- piraterie ;
- Marine ;
- révolution ;
- criminalité ;
- personnages majeurs présents ;
- équipages canoniques actifs.

## QA

`scripts/qa-v75.mjs` vérifie notamment :
- 6 régions ;
- profils de factions ;
- relations inter-factions ;
- contraintes régionales des acteurs ;
- génération déterministe d’action à rolls fixes ;
- conflits et blessures ;
- recherche de Fruit ;
- synchronisation leader/équipage ;
- fracture après mort d’un leader ;
- alias de détenteur de Fruit ;
- remise en circulation après décès ;
- ancres de Marineford ;
- calcul des hotspots ;
- état persistant du World Director ;
- intégration live ;
- migration V7.4 → V7.5 ;
- cache PWA.

La chaîne conserve toutes les QA V6.4 → V7.4.

## Version

- GAME_VERSION : **7.5.0**
- SAVE_VERSION : **750**
- Cache PWA : **one-piece-life-v7-5-0**
