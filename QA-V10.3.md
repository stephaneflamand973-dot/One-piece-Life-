# ONE PIECE LIFE — V10.3 : Carrières et organisations 2.0

## Statut
Version 10.3.0. Basée sur les actions manuelles V10.2 et les dossiers d'organisation V7.3. `SAVE_VERSION=1000` : sauvegardes conservées.

## Gameplay livré
- **Six profils de carrière** avec salaires nominaux spécifiques : Marine, Pirates, Chasseurs de primes, Révolutionnaires, Gouvernement et métiers civils. Les grades modifient les revenus *seulement lorsque le joueur travaille*.
- **Trois méthodes de travail** : régulier (12 énergie), intensif (18 énergie, +22 % rémunération et +50 % XP nominal avant décroissance annuelle), stratégique (14 énergie, gains de confiance et influence, salaire réduit).
- **Performance professionnelle** de 0 à 100, augmentée uniquement par actions du joueur. Mémoire bornée des douze derniers résultats et total de séances et gains.
- **Actions professionnelles directes** via Action Engine V10.2 : aider l'équipe (2/an), prendre une initiative (2/an), demander une prime (1/an).
- **Demande de prime** ouverte après des résultats suffisants : au moins une séance, performance >=55, standing >=35. Décision probabiliste tenant compte de la performance et de la confiance, pouvant aussi être refusée.
- **Lien réel avec V7.3** : travail, collaboration et initiatives changent standing, confiance, discipline et influence du dossier déjà utilisé par la commission de promotion.
- **Tableau professionnel** : faction, métier, branche, performance, revenus cumulés, travail réalisé, confiance et standing, méthode de travail et boutons d'action directs.
- **Centre d'actions** : ces nouvelles décisions sont accessibles directement et partagent leur état de disponibilité avec le tableau du personnage.
- **Sauvegardes** : première utilisation crée un dossier V10.3 par faction/métier, les anciens V7.3 et V10.2 restent en place. Un changement de profession réinitialise la performance de cette profession sans réutiliser celle de l'ancienne.

## Conditions d'équilibrage
- Le travail conserve ses 4 actions/an avec rendement annuel décroissant V10.2.
- Les actions internes V10.3 ne déclenchent aucune promotion automatique.
- Une tentative de prime consomme sa possibilité annuelle, même si le supérieur la refuse (il s'agit d'une décision réussie dont l'issue est négative).
- Travail stratégique et travail intensif paient des coûts réels d'énergie distincts avant exécution.
- Vieillir renouvelle les compteurs d'actions, mais n'ajoute aucun salaire, XP ni grade.

## Vérification
- `scripts/qa-v103.mjs` : profils, méthodes de travail, coûts, gains, probabilités de prime, refus, statut, protections contre les changements de faction, état sauvegardable.
- `scripts/qa-v100-runtime.mjs` : parcours du joueur dans le vrai moteur du jeu, salaire, performance, double interaction interne, prime, coûts et intégration V7.3.
- Tests historiques V6.4–V10.2 conservés.

## Limites et suite
- Les collègues ne sont pas encore des PNJ individuels à parcours autonome : la confiance interne représente pour l'instant la relation institutionnelle avec le supérieur.
- Les missions restent rattachées au système V7.3 de branches, qui propose déjà des missions spécialisées. Une vraie affectation personnalisée par métier reste à développer.
- Les métiers civils partagent encore le profil économique général, avec un bonus de spécialité pour certaines professions : une grille complète par métier sera possible ultérieurement.
- V10.4 approfondira l'interaction sociale et les PNJ, y compris les relations professionnelles.
