# ONE PIECE LIFE — QA V6.4

V6.4.0 — Risk Director • Adventure 2.0 • Rarity 2.0

## Validations
- Save version 640 et migration depuis V6.3.
- Risk Director annuel : budget d’exposition, amortissement progressif du danger ambiant, des voyages et des menaces répétées.
- Les missions conservent leur propre danger mais consomment l’exposition annuelle, ce qui réduit les empilements de dangers indépendants ensuite.
- Adventure 2.0 : Explorer activement / Chasser les opportunités déclenche un choix réel de destination ou d’expédition locale.
- Arriver sur un nouveau lieu donne une récompense d’exploration et peut créer une piste rare.
- Les expéditions locales peuvent produire compétence, Berry, réputation ou piste rare.
- Rarity 2.0 : poids Fruit adulte réduit à 0.12 avant modificateurs ; estimation simplifiée d’une vie adulte standard ≈ 11,8 % sans piste rare.
- Les plans Explorer et Chasser augmentent la rareté sans garantir de Fruit.
- Cooldown Fruit de 120 mois après une découverte.
- Les World Hooks n’allongent plus automatiquement leur expiration à chaque vérification.
- TTL des hooks respecté jusqu’à 4 mois minimum pour les événements urgents.
- JavaScript standalone validé syntaxiquement.


## Hotfix QA — Risk Director / live engine
- La QA runtime vise désormais le moteur réellement déployé dans `index.html`, et non l’ancien moteur de référence `app.js`.
- Nouveau test bloquant : `scripts/qa-v64.mjs`.
- Budgets de risque validés : Civil prudent/standard, Marine, Pirates exploration, Chasseur de primes chasse aux opportunités.
- Saturation validée : danger ambiant 24 %, World Hooks 48 %, voyage 52 %.
- Les interventions sur World Hooks consomment désormais le budget annuel de risque selon difficulté et approche.
- La probabilité de reproposer un World Hook pendant la même année dépend désormais à la fois du plan Aventure et de l’exposition déjà accumulée.
- Correction d’un palier mort : le plancher ambiant à 24 % est désormais réellement atteignable.
- Adventure 2.0 validé en runtime : un plan Explorer produit une décision avec routes réelles + expédition locale.
- Rarity 2.0 validé en runtime : prudent 0,42× ; normal 1× ; exploration 1,55× ; chasse 2,45× ; piste rare plafonnée à 4,2× ; cooldown Fruit = 0×.
- L’expiration immuable des World Hooks reste protégée par régression.
- Cache PWA final : `one-piece-life-v6-4-2`.
- Le stress-test historique `audit-v32.mjs` reste conservé comme indicateur non bloquant pour l’ancien moteur ; il n’est plus confondu avec la validation de la V6.4 live.
