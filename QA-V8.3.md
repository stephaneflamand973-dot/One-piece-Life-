# ONE PIECE LIFE — QA V8.3

V8.3.0 — Nemesis & Rivalry 4.0

## Objectif

V8.3 transforme les boss de saga et les anciens rivaux V5.9 en antagonistes persistants. Un ennemi important ne disparaît plus simplement parce que la campagne qui l'a créé est terminée.

## Antagonistes persistants

Chaque antagoniste V8.3 conserve :
- identité et faction ;
- région actuelle ;
- archétype comportemental ;
- tempérament ;
- motivation et objectif ;
- puissance et potentiel ;
- croissance ;
- ruse, résolution et charisme ;
- rivalité, respect, obsession et pression ;
- victoires, défaites et rencontres ;
- campagnes vécues et fuites ;
- blessures et délais de retour ;
- lieutenants ;
- mémoire des affrontements.

## Sept archétypes

- Stratège
- Force implacable
- Chasseur
- Fanatique
- Opportuniste
- Commandant
- Survivant

Ces archétypes changent la croissance, les chances de survie, la pression exercée et les actions autonomes privilégiées.

## Lieutenants et organisation

Les antagonistes importants peuvent posséder jusqu'à quatre lieutenants. Leur puissance et leur loyauté augmentent la puissance effective du boss.

Un antagoniste orienté commandement peut recruter de nouveaux lieutenants au fil des années.

## Progression autonome

Chaque année, un antagoniste peut :
- préparer une manœuvre ;
- recruter ;
- s'entraîner ;
- traquer une cible.

Lorsqu'il dirige une campagne V8.2, ces actions modifient directement le rapport de force et les enjeux de la saga.

## Mémoire de la rivalité

Les interventions et missions opposées au boss sont mémorisées.

Une victoire du joueur augmente notamment :
- le respect ;
- la rivalité ;
- l'obsession.

Les revers du joueur nourrissent aussi l'histoire commune. Le score de némésis dépend donc de la relation réellement construite, pas uniquement de la puissance brute.

## Survie et retour

À la chute d'une campagne, un antagoniste procédural peut :
- être définitivement écarté ;
- s'échapper ;
- revenir plus tard.

La probabilité dépend de son archétype, de sa résolution, de sa ruse, de la rivalité accumulée, de la marge de défaite et de la contribution du joueur.

Un personnage canonique n'est jamais supprimé procéduralement par ce système, mais il est correctement détaché de la campagne terminée.

Une ancienne némésis compatible peut ensuite devenir le boss d'une nouvelle saga V8.2.

## Priority Director

Les retours personnels importants passent par le Priority Director V8.0.

Une némésis peut donc refaire surface avec quatre réponses :
- l'affronter ;
- la déjouer ;
- mobiliser son réseau ;
- refuser l'affrontement.

Le jeu évite ainsi de transformer chaque rival en popup mensuelle, un progrès étonnamment nécessaire.

## Compatibilité V5.9

Le système de rivalités V5.9 n'est pas supprimé.

Les anciens rivaux sont migrés vers V8.3 et synchronisés avec le nouveau moteur. Les anciens World Hooks continuent de fonctionner tout en alimentant désormais la mémoire, les scores et la progression de la némésis.

## Interface

L'onglet Monde affiche une nouvelle carte **Antagonistes & rivalités persistantes** avec :
- niveau de némésis ;
- archétype ;
- objectif ;
- puissance réelle et effective ;
- rivalité ;
- respect ;
- obsession ;
- pression ;
- victoires/défaites ;
- fuites ;
- lieutenants ;
- dernier souvenir.

## QA

Le script scripts/qa-v83.mjs vérifie notamment :
- les sept archétypes ;
- la création des lieutenants ;
- la puissance effective ;
- la mémoire d'affrontement ;
- la progression autonome ;
- la survie et la défaite finale ;
- la protection des personnages canoniques ;
- le retour dans une nouvelle saga ;
- les rencontres Priority Director ;
- la migration V5.9 ;
- les hooks V8.2 ;
- la migration de sauvegarde ;
- le cache PWA.

## Version

- GAME_VERSION : **8.3.0**
- SAVE_VERSION : **830**
- Cache PWA : **one-piece-life-v8-3-0**
