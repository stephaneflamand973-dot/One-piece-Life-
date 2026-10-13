# One Piece Life V0.5.6 · Un équipage vivant

Cette version approfondit le commandement pirate **dans la rubrique Carrière existante**. Les règles V0.5.5 restent valables : aucune limite d'ordres ni d'interactions de capitaine par année, et seul « + Âge » fait progresser le temps.

## Compagnons uniques

Chaque compagnon possède désormais :
- Une **spécialité d'origine** conservée.
- Un **poste à bord**, modifiable à tout moment.
- Un **tempérament** (loyal, ambitieux, prudent, rebelle, solidaire), une **ambition**, une **confiance envers le capitaine**, une **rivalité** et une **tension sociale**.
- Sa compétence, sa loyauté et son historique d'arrivée.

Le capitaine peut discuter autant qu'il veut avec un membre, lui donner une récompense contre 2 500 Berrys, le renvoyer ou lui attribuer un nouveau poste. Les discussions insistantes deviennent contre-productives plutôt que d'être interdites arbitrairement. Un unique poste de **bras droit** peut être attribué.

## Les postes servent vraiment

- **Navigateur** : améliore le succès des déplacements et limite les dégâts à la coque.
- **Charpentier** : réduit les dégâts des missions et améliore les réparations.
- **Médecin** : réduit le risque de blessure pendant les missions.
- **Cuisinier** : soutient le moral après les missions.
- **Combattant / Tireur** : renforcent les chances lors des abordages et face à la Marine.
- **Bras droit** : contribue à la réussite collective et au moral.

Le moral, la cohésion, la loyauté, la confiance et les rivalités influencent les évolutions. Une année peut déclencher un **événement autonome** : demande de prime, candidature au poste de bras droit ou conflit. Le joueur répond **Accepter / Refuser**, et le choix modifie durablement les statistiques, les Berrys ou les postes. Une décision d'équipage doit être résolue avant de vieillir à nouveau, sans ligne d'âge supplémentaire.

## Compatibilité

Le schéma passe à la **V15**, clé `opl:foundation:life-v056`. La migration V14 ajoute les nouveaux attributs sans modifier les noms, loyautés, talents, Berrys, relations, histoire ou compétences du joueur. Les sauvegardes antérieures continuent de traverser la chaîne de migrations.

Tests Node supplémentaires pour rôles, traits, événements et restauration ; parcours mobile Chromium et WebKit iPhone.
