# One Piece Life V0.5.3 · Avis de recherche et Marine

La V0.5.3 ajoute dans **Carrière** une fiche d'avis de recherche, une **prime en Berrys**, une **notoriété mondiale** et la **pression de la Marine**. Les trois valeurs sont indépendantes du butin et de la réputation interne de l'équipage. Une prime constitue une récompense offerte aux chasseurs de primes, jamais de l'argent possédé.

## Conséquences
- Les missions font évoluer la notoriété et l'attention de la Marine, mais **ne produisent pas toutes une augmentation de prime**.
- Les actes publics graves, notamment les abordages et confrontations avec la Marine, déclenchent des hausses de prime. Une découverte de trésor suffisamment médiatisée peut produire un premier avis local.
- Le montant dépend de l'importance de l'événement, pas directement des points de puissance ou du butin.
- L'attention de la Marine diminue progressivement avec le temps. À partir d'un avis de recherche et d'une pression suffisante, une **poursuite annuelle probabiliste** peut intervenir.
- Les qualités de navigation, de vitesse, de combat, la performance et le capitaine influencent les chances de s'échapper.
- En cas d'interception, du butin peut être confisqué, les performances baisser et une blessure légère survenir. Pas d'arrestation définitive simulée sans futur système pénitentiaire.
- Le bouton **Se faire discret** permet une fois par année de réduire la pression Marine au prix d'une légère baisse de performance. Il n'annule pas la prime.
- Les rencontres, récompenses et poursuites s'inscrivent dans l'historique de réputation et le journal annuel, sans ajouter d'années.

## Sauvegardes et compatibilité
- Schéma V13 ; clé `opl:foundation:life-v053` et migration automatique depuis V0.5.2 et versions antérieures.
- Âge, histoire, capacités, relations, équipage, rang et Berrys existants conservés à l'identique.
- Tests Node de notoriété, prime, probabilité de poursuites, évitement/interception, progression jusqu'à 120 ans, migrations et échecs de stockage.
- QA Chromium mobile à 320/390/430 px et WebKit iPhone simulé.

Le système de prison, la chasse aux primes et les confrontations avec des personnages canoniques restent hors périmètre : ils méritent leurs propres mécanismes.
