# ONE PIECE LIFE — V10.5 : Économie et patrimoine 2.0

## Version et sauvegardes
- `GAME_VERSION=10.5.0`, `SAVE_VERSION=1000`, cache PWA `one-piece-life-v10-5-0`.
- Stockage `player.economyV105` ajouté par migration paresseuse. Pas de modification aux investissements V6.9, logements V7.8 ni cargaisons V8.8.

## Investir pour obtenir des avantages réels
Chaque investissement peut être amélioré par action expresse et coûte des Berry.

| Actif | Coût initial | Maximum | Utilité |
| --- | ---: | ---: | --- |
| Salle d'entraînement | 16 000 B | Niveau 2 | +9 % de rendement sur les séances d'entraînement par niveau |
| Matériel médical | 24 000 B | Niveau 2 | +18 % sur récupération volontaire par niveau |
| Bureau de navigation | 34 000 B | Niveau 2 | Économise 2 énergie par niveau lors de l'action Traversée |
| Commerce insulaire | 28 000 B | Niveau 3 | Exploitation active et petit avantage de négociation |
| Atelier naval | 46 000 B | Niveau 3 | Revenus par exploitation active et soutien supplémentaire aux missions |
| Location de logements | 78 000 B | Niveau 3 | Exploitation active de patrimoine locatif |

Les améliorations coûtent de plus en plus cher (facteur 1,75 avant inflation locale). Les actifs récemment acquis sont aussi comptabilisés comme valeur patrimoniale estimée à 72 % de leur prix de référence. Les anciens biens ne sont pas comptés deux fois dans cette nouvelle estimation.

## Actions de la V10.5
- **Acheter / améliorer un actif : 2 actions par an**, coût énergétique 2.
- **Exploiter une entreprise : 3 actions par an**, coût énergétique 7.
- Sélection du type d'actif et de l'entreprise exploitée par liste déroulante dans l'unique panneau `Patrimoine et entreprises`. Les boutons sont aussi visibles dans le Centre d'actions.
- Une exploitation déclenche des recettes selon son niveau, la prospérité locale, le prix local, les compétences et un jet de réussite borné. Un échec entraîne une perte égale aux frais d'exploitation, et non une rente garantie.
- Rendements annuels décroissants des exploitations : 100 %, 82 %, 65 %.
- Contrôles d'âge (18 ans), argent, énergie, traversée, décision en attente et plafonds annuels.
- Aucune recette, gain de compétences ou promotion n'est accordée automatiquement lors du passage à l'année suivante.

## Compatibilité
- Réutilise Action Engine V10.2 pour les quotas et la synchronisation avec le Centre d'actions V9.5.
- Les investissements V6.9 et l'habitat V7.8 restent des fonctionnalités distinctes ; les six nouveaux actifs ont des effets complémentaires sans les remplacer.
- Les activités marchandes V8.8 bénéficient des investissements dans un commerce.
- Les salles et soins modifient uniquement la prochaine action volontaire correspondante, sans progression gratuite.

## Validation
- `scripts/qa-v105.mjs` : prix, majoration des améliorations, achat, plafond, rentabilité ou déficit, probabilité, état persistent, bornage, compatibilité PWA et absence d'automatisme d'âge.
- `scripts/qa-v100-runtime.mjs` : achat et exploitation dans le vrai état de jeu, consommation de Berry et d'énergie, effets vérifiés, Centre d'actions cohérent, sauvegarde et limite annuelle.
- Tous les tests historiques V6.4–V10.4 restent inclus dans les workflows.

## Limites
- La valeur patrimoniale affichée est une estimation du **nouveau portefeuille V10.5** et non une valorisation de tous les anciens actifs V6.9 ni des propriétés V7.8.
- Les entreprises existantes V6.9 restent suivies par leur ancien système. Leur économie structurelle n'est pas versée pendant le passage d'un an dans le mode manuel V10.5.
- Pas encore de simulation individualisée des locataires, fournisseurs ou salariés.
