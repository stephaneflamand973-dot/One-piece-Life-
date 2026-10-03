# ONE PIECE LIFE — QA V8.2

V8.2.0 — Regional Sagas & Campaigns 4.0

## Objectif

V8.2 transforme les tensions régionales du Causal World en campagnes persistantes capables de durer plusieurs années et de modifier réellement le contrôle territorial.

## Sagas régionales

Les six régions peuvent désormais développer une campagne active :
- East Blue
- North Blue
- West Blue
- South Blue
- Grand Line
- New World

Une campagne apparaît selon la crise, la contestation territoriale, les projets actifs et les forces présentes. Elle ne naît donc pas par simple tirage décoratif.

## Structure d'une campagne

Chaque campagne possède :
- un camp dominant ;
- un challenger ;
- un rapport de force 0–100 ;
- un niveau d'enjeux ;
- une menace ;
- une durée cible de 2 à 5 ans ;
- quatre phases : Tensions, Escalade, Point de rupture, Dénouement ;
- une figure locale ;
- un antagoniste ou boss ;
- une contribution et des revers du joueur ;
- un historique régional persistant.

## Figures et boss

Le moteur génère toujours une figure et un boss de secours, puis les remplace par de vrais acteurs du monde lorsque des personnages canoniques, groupes canoniques ou équipages procéduraux pertinents sont présents dans la région.

## Joueur et Priority Director

Une campagne locale n'interrompt pas automatiquement chaque année. Ses moments critiques sont envoyés au Priority Director V8.0 et entrent en concurrence avec les conséquences, la vie personnelle, la faction, la jeunesse et les autres décisions.

Le joueur choisit d'abord son positionnement :
- camp dominant ;
- challenger ;
- indépendant.

Les phases suivantes proposent des tactiques basées sur Combat, Commandement, Discrétion ou protection des civils.

## Missions de campagne

Une campagne active injecte des missions causales dans le tableau de missions. Leur difficulté augmente avec la menace, la phase et la puissance du boss.

Les résultats de mission déplacent le rapport de force de la saga et restent connectés aux anciens systèmes V6.8, V7.3 et V8.1.

## Résolution et monde persistant

Une campagne se termine lorsqu'un camp s'effondre ou lorsque sa durée et sa phase finale sont atteintes.

La résolution modifie :
- l'influence territoriale du vainqueur et du perdant ;
- les pressions régionales ;
- l'instabilité ;
- les faits mondiaux ;
- la réputation mondiale du joueur s'il a pesé sur l'issue.

La région conserve un historique des campagnes résolues et un délai avant qu'une nouvelle saga structurée puisse recommencer.

## Interface

L'onglet Monde affiche une carte V8.2 dédiée avec :
- phase actuelle ;
- rapport de force ;
- enjeux ;
- menace ;
- durée de campagne ;
- camp du joueur ;
- contribution ;
- figure locale ;
- boss ;
- état des six régions.

## QA

Le script scripts/qa-v82.mjs couvre le moteur autonome, les décisions, les missions, les phases, les résolutions, le raccord au Priority Director, le Life Director, la migration, l'interface et le cache PWA.

## Version

- GAME_VERSION : **8.2.0**
- SAVE_VERSION : **820**
- Cache PWA : **one-piece-life-v8-2-0**
