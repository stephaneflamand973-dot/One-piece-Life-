
# ONE PIECE LIFE : REBOOT V13 (fondation 1)
## Principes
1. Une année = un clic « Avancer d'un an », avec conséquences et décision éventuelle.
2. Cinq écrans stables : Vie, Activités, Relations, Carrière, Profil. Pas de sous-systèmes cachés.
3. Architecture **data.js → engine.js → ui.js**. Le moteur est pur, sans DOM, ni stockage ; il reçoit son générateur aléatoire pour les tests.
4. Deux voies distinctes : emplois ordinaires avec candidature/salaire/promotion, et carrières spéciales avec engagements, actions, réputation et grades. Une seule voie active à la fois.
5. Sauvegarde isolée dans localStorage : one-piece-life:reboot:v1. Ne pas importer la V12 implicitement ni détruire ses données.
6. Ancien jeu accessible à classic.html. L'historique du dépôt reste préservé.
7. Aucun paywall. Progression et événements déterminés par de vraies règles, sans chiffres inventés par l'interface.

## Périmètre réellement opérationnel
Naissance, cinq mers, âge annuel, dépenses/salaires, jauges et journal, événements à choix, école de 6 à 17 ans, études, sport, détente, quinze emplois, candidature avec sélection, démission, travail, promotion, demande d'augmentation, cinq carrières spéciales, création ou adhésion d'équipage pirate, actions propres à chaque carrière, grade, réputation, recrutement pirate, rencontres, relations sociales, sauvegarde, réinitialisation confirmée, design mobile.

## Hors périmètre de cette fondation
Combat tactique, carte navigable, personnages canons, guerre de factions, fruit du démon, personnages complexes, logement, héritage, économie approfondie, intrigue globale. On n'ajoute que des systèmes testés, module par module.

## Développement
Servir la racine du dépôt en HTTP (pas file://) pour le support des modules ES. Tests : `node scripts/qa-reboot-v13.mjs`. Le moteur ne dépend que de `src/reboot/data.js`. Aucun framework, réseau ni installation requis pour jouer. Styles et expérience originaux, inspirés de l'ergonomie générale des jeux de simulation de vie sans copier leurs ressources.
