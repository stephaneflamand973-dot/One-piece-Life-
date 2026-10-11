# ONE PIECE LIFE — V10.5 : Économie et patrimoine 2.0

## Fonctionnalités
La V10.5 conserve les moteurs de logement (V7.8), de patrimoine organisationnel (V6.9) et de marchés (V8.8), et ajoute un portefeuille d'entreprises **activement géré**.

### Quatre activités
| Actif | Acquisition de base | Avantage permanent tant que possédé |
| --- | ---: | --- |
| Atelier maritime | 16 000 B | Expertise commerciale locale de +0,04 par niveau (plafonnée au moteur des marchés) |
| Commerce insulaire | 22 000 B | Rémunération des actions « travailler » +3 %/niveau (maximum +9 %) |
| Réseau de contacts | 27 500 B | Bonus de mission +0,85/niveau |
| Service de transport | 35 000 B | Cargaison +6 unités/niveau |

Ces prix sont modulés par l'indice économique régional. Chaque actif peut atteindre **trois niveaux** à un coût croissant.

### Actions réelles
- **Investir / améliorer** : 2 actions annuelles, 6 énergie, paiement immédiat en Berry.
- **Exploiter** : 4 actions annuelles, 10 énergie ; 2 opérations maximum par actif et par an. Revenus dépendant de la prospérité régionale et du résultat aléatoire, avec possibilité de perte nette. Frais opérationnels prélevés à chaque action.
- **Revendre** : 2 actions annuelles, 3 énergie ; la valeur de revente représente 56 % de l'investissement théorique aux prix locaux actuels, pas un rendement garanti.
- Les opérations sont reliées au moteur d'actions V10.2 ; action invalidée = **aucun paiement ni quota perdu**.
- L'âge ne crédite pas automatiquement d'exploitation ou de chiffre d'affaires. Vieillir renouvelle les compteurs mais ne gère aucune entreprise à la place du joueur.

### Compatibilité
- `GAME_VERSION='10.5.0'`, `SAVE_VERSION=1000`, `one-piece-life-v10-5-0`.
- Sauvegarde du portefeuille dans `game.player.economyV105` créée à la demande.
- Les anciens actifs V6.9, les logements V7.8 et la cargaison V8.8 ne sont ni écrasés ni comptés deux fois dans la valeur des entreprises V10.5.
- La richesse affichée représente les Berry liquides et la valeur de revente des **entreprises V10.5 uniquement**, pas une estimation exhaustive des logements et autres actifs historiques.
- L'historique borné enregistre jusqu'à 30 opérations de portefeuille.

### QA
- `scripts/qa-v105.mjs` : prix, achat, exploitation réussie/ratée, charges, quotas, revente, progression, bonus et données corrompues.
- `scripts/qa-v100-runtime.mjs` : intégration réelle dans le jeu, actions du Hub, achat et exploitation, bonus transport, revente et sauvegarde.
- Régressions historiques V6–V10.4 exécutées en CI.

### Limites
- Cette livraison ne propose pas encore de marché financier coté, d'emprunts, d'employés individuels ou de transfert de propriétés entre personnages.
- Le modèle de risque est volontairement simplifié et n'est pas une modélisation économique réelle.
- La validation automatisée sur environnement simulé ne remplace pas l'audit tactile manuel sur iPhone.
