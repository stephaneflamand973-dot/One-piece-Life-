# ONE PIECE LIFE — V10.6 : Expéditions et aventures actives

## Philosophie
V10.6 prolonge V10.0–V10.5 : passer à l’année suivante renouvelle les actions, fait vieillir le personnage et laisse évoluer le monde, sans attribuer d'expérience de carrière, promotion, revenus, compétences ou découvertes gratuites au joueur.

## Quatre nouvelles actions explicites
Toutes sont partagées avec le registre d’actions V10.2, accessibles dans le Centre d’actions et dans Monde > Expéditions et commandement. Une action rejetée ne dépense aucun quota.

| Action | Quota annuel | Énergie | Berry | Utilité |
| --- | ---: | ---: | ---: | --- |
| Préparer une expédition | 2 | 5 | 400 | Renforcer la préparation de l’île en cours, plafond 80 |
| Explorer l’île | 3 | 10 | 0 | Reconnaissance à réussite variable ; une réussite exécute l’exploration V8.5 existante |
| Préparer la mission | 2 | 6 | 300 | Soutien tactique de la mission acceptée (bonus plafonné à 14) |
| Mobiliser l’équipage | 2 | 8 | 250 | Coordination de l’équipage (bonus plafonné à 12) |

Les rendements diminuent au fil des répétitions annuelles : 100 % puis 72 % pour les préparations, 100 %/84 %/65 % pour les reconnaissances, 100 % puis 70 % pour les préparations de mission et le commandement.

## Risque et conséquences
Trois méthodes d’exploration : équilibrée, prudente ou audacieuse. Compétences Navigation/Discrétion, équipage, danger local, préparation, approche et jet probabiliste pèsent sur les résultats. Un échec peut réduire la santé ; aucune découverte n’est garantie. Une reconnaissance réussie appelle le moteur V8.5 d’exploration et peut déclencher ses découvertes normales, sans créer une seconde récompense artificielle.

## Intégration & sauvegardes
- Le nouvel état player.adventureV106 est initialisé et normalisé à l’ouverture, sans changer le format commun des sauvegardes (SAVE_VERSION=1000).
- Préparation locale remise à zéro lorsqu’on change d’île ; les historiques persistent.
- Le bonus tactique est lié à l’ID de mission, transféré au calcul de soutien collectif de la V6.5/V8.4 et consommé à la résolution, succès ou échec.
- Les décisions en attente, traversées, énergie ou argent insuffisants et personnage décédé bloquent les actions. Les expéditions exigent au moins 12 ans ; les actions d’équipe un équipage ; le plan tactique une mission acceptée.
- GAME_VERSION=10.6.0, cache PWA one-piece-life-v10-6-0 ; les trois fichiers V10.6 sont disponibles hors ligne.

## QA
- scripts/qa-v106.mjs teste les actions, les restrictions, les risques, les pertes possibles, la persistance, la compatibilité avec le quota V10.2 et le cache PWA.
- scripts/qa-v100-runtime.mjs couvre la boucle de jeu réelle et les versions V10.0–V10.5.
- Vérifications automatiques avec les workflows GitHub Actions qa.yml et validate.yml.

## Limites actuelles
- Les expéditions sont un système de décisions locales et de préparation ; elles ne constituent pas encore une campagne scénarisée complète de plusieurs étapes.
- La préparation de mission renforce la probabilité pour les missions utilisant le soutien du groupe ; elle ne remplace pas le moteur de combat V7.2.
- Les visites d’île et découvertes V8.5 demeurent le registre géographique de référence.
