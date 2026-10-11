# ONE PIECE LIFE — V10.4 Relations et vie personnelle 2.0

## Périmètre intégré
La V10.4 conserve les moteurs sociaux V7.4, V7.8 et V9.3 et y ajoute un registre d'interactions volontaires, un calendrier annuel, des souvenirs persistants et un accès depuis le Centre d'actions V9.5.

### Interactions avec les personnes
- Passer du temps, s'entraîner ensemble, aider, se confier, confronter, se réconcilier, flirter, proposer un rendez-vous et proposer une vie commune.
- **12 interactions sociales globales par année**, dont **3 maximum par personne**. Rendements sur la relation successifs 100 %, 82 %, 65 %.
- Contrôles d'énergie, d'argent, de confiance, d'affection, de familiarité et de rivalité. Les actions refusées par le moteur ne consomment pas les quotas. Une invitation à un rendez-vous qui reçoit une réponse négative compte en revanche comme une véritable tentative.
- Les réponses aux avances, propositions de rendez-vous, réconciliations et propositions de vie commune varient selon compatibilité, confiance, affection et rivalité.
- Un personnage doit être **explicitement identifié comme adulte** pour les actions amoureuses, et le joueur doit avoir l'âge requis.
- L'intégration avec V7.8 inscrit les couples acceptés dans le foyer, sans contourner les obligations déjà présentes pour les dépenses ou les enfants.
- Intégration avec V7.4 (mémoires relationnelles) et V9.3 (historique des liens, rancunes, némésis).

### Interface
- En-tête « Actions et souvenirs » dans Relations avec compteurs et derniers souvenirs.
- Boutons supplémentaires sur les fiches de relations, avec raisons d'indisponibilité.
- Centre d'actions : les mêmes conditions réelles d'accès sont vérifiées. Les actions bloquées ne sont pas enregistrées comme réussies.

### Progression
L'âge avance exactement par l'action volontaire « Avancer d'un an ». Cette mise à jour ne génère ni XP de carrière ni promotion ni argent passif lorsque le personnage vieillit. Les quotas sociaux se réinitialisent au changement d'année. L'historique et les effets sur les personnages demeurent.

### Sauvegardes et technique
- `GAME_VERSION='10.4.0'`, `SAVE_VERSION=1000`.
- Nouveaux modules `src/data/social-v104.js` et `src/v104/social-engine-v104.js`.
- Stockage `player.socialV104` créé à la demande : anciennes parties compatibles.
- Historique borné à 40 interactions, sans données personnelles réelles.
- Transaction sur copie de sécurité : retour arrière lors d'une erreur d'exécution.

### Limites connues
- La famille de V7.8 reste organisée autour de ses événements et décisions préexistants, sans arbre généalogique complet.
- Les personnages PNJ dont l'âge adulte n'est pas explicitement établi ne sont pas proposés comme partenaires potentiels.
- Les réactions des PNJ évoluent en fonction de leurs métriques et de la compatibilité, mais toutes les personnalités n'ont pas encore des comportements conversationnels propres.
- Le Centre d'actions présente jusqu'aux dix premières relations actives ; les fiches individuelles de l'onglet Relations restent accessibles pour les autres.

### Tests
- `node scripts/qa-v104.mjs` vérifie limites, coûts, réponses mutuelles, règles d'âge, passage des ans et résilience des sauvegardes.
- `node scripts/qa-v100-runtime.mjs` vérifie les interactions dans le moteur intégré et les ponts V7.4, V7.8, V9.3.
- Les tests historiques restent exécutés.
