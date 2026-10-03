# ONE PIECE LIFE — QA V7.8

V7.8.0 — Personal Life & Household 3.0

## Objectif

La V7.8 transforme la famille de naissance, jusque-là presque décorative, en véritable système de vie personnelle.

## Logement

Six niveaux de logement :
- foyer familial ;
- logement de faction ;
- chambre / petit logement ;
- maison modeste ;
- maison confortable ;
- grande propriété.

Les logements possèdent :
- coût d’achat ;
- entretien annuel ;
- stabilité ;
- état ;
- âge minimal ;
- propriété ou mise à disposition.

## Foyer

Le moteur suit :
- lien familial ;
- indépendance ;
- partenaire ;
- état du couple ;
- enfants accueillis ;
- personnes à charge ;
- réserve ;
- stabilité ;
- stress ;
- coûts cumulés ;
- logements possédés.

## Vie personnelle

Neuf familles d’événements sont disponibles :
- indépendance ;
- demande familiale ;
- retrouvailles ;
- réparation du logement ;
- rencontre personnelle ;
- engagement ;
- agrandissement du foyer ;
- responsabilité familiale ;
- transmission familiale.

Les rencontres de couple générées par ce système sont explicitement adultes et ne réutilisent pas arbitrairement un personnage canonique.

## Économie

Les dépenses annuelles dépendent du logement, des enfants, des personnes à charge et de l’économie régionale.

Une impossibilité de payer :
- augmente stress et instabilité ;
- peut générer une conséquence V7.7.

## QA

`scripts/qa-v78.mjs` vérifie :
- catalogue de logements ;
- actions de foyer ;
- événements personnels ;
- conservation du lien familial de naissance ;
- migration adulte ;
- logement de faction ;
- verrouillage financier ;
- coûts enfants / personnes à charge ;
- stabilité ;
- indépendance ;
- entretien ;
- engagement ;
- agrandissement du foyer ;
- options conditionnelles ;
- déménagement ;
- contact adulte déterministe ;
- vieillissement des enfants ;
- coût annuel unique ;
- intégration live ;
- migration ;
- cache PWA.

La chaîne conserve toutes les QA V6.4 → V7.7.

## Version

- GAME_VERSION : **7.8.0**
- SAVE_VERSION : **780**
- Cache PWA : **one-piece-life-v7-8-0**
