# ONE PIECE LIFE — QA V9.2

V9.2.0 — NPC Living Lives

## Objectif

V9.2 donne aux relations non canoniques une trajectoire persistante hors écran. Elles ne restent plus figées entre deux interactions du joueur.

## Vies procédurales

Chaque relation importante peut désormais posséder :
- une faction et une profession ;
- un rang de carrière ;
- de l'expérience professionnelle ;
- une puissance et un potentiel ;
- une condition physique ;
- une fortune personnelle ;
- une région actuelle ;
- un objectif autonome ;
- un historique d'actions ;
- des promotions, déplacements, revers et changements de voie.

Les décisions autonomes sont influencées par l'ambition, la faction, l'âge, la condition et la trajectoire accumulée.

## Actions autonomes

Les PNJ peuvent :
- travailler ;
- s'entraîner ;
- voyager ;
- développer leur réseau ;
- prendre des risques ;
- récupérer ;
- soutenir leur entourage.

Une action n'est simulée qu'à intervalles raisonnables pour éviter un bruit mensuel artificiel.

## Carrières

- 7 familles de carrière.
- Promotions fondées sur l'XP réellement accumulée.
- Changements de voie rares et contextuels.
- Retraite possible avec l'âge.
- Les personnages canoniques ne changent jamais arbitrairement de faction ou carrière : leur trajectoire reste sous l'autorité du World Director.

## Monde & relations

- Les déplacements des relations deviennent indépendants de la position du joueur.
- Les jalons importants deviennent des souvenirs V7.4.
- Les événements majeurs des personnages canoniques passent par l'information imparfaite du monde.
- L'onglet Relations indique profession, rang, région, puissance et dernière activité.
- Un tableau V9.2 résume les vies suivies et leurs jalons.

## Persistance

- État centralisé dans `game.world.npcLivesV92`.
- Historiques bornés.
- Pas de duplication des systèmes V8.3 Némésis ou V7.5 World Director.
- Migration automatique depuis V9.1.x.

## Version

- GAME_VERSION : **9.2.0**
- SAVE_VERSION : **920**
- Cache PWA : **one-piece-life-v9-2-0**
