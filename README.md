# One Piece Life V0.5.1 · Mentors, blessures et promotions

## Entraînement plus profond
- Les 11 capacités de V0.5.0 conservent leur progression individuelle de 0 à 100.
- Le **talent naturel** est désormais affiché dans Activités (à développer, modéré, bon, très bon, exceptionnel). Il affecte la vitesse d'apprentissage, sans plafond de progression imposé.
- La fatigue affecte les gains d'entraînement et peut temporairement bloquer les séances.
- Un entraînement trop intense peut provoquer une blessure **légère ou sérieuse** selon un risque progressif lié à la fatigue.
- Une blessure sérieuse bloque les séances et le travail supplémentaire. Les blessures guérissent en vieillissant ; une période de repos aide à récupérer.
- Bouton **Se reposer**, une fois par année, qui réduit la fatigue et peut accélérer la guérison. Aucun saut d'année supplémentaire.

## Mentor relié aux Relations
- Les personnages mentor de l'affiliation One Piece sont les mêmes dans Relations et Activités.
- **Avec mentor** apparaît pour chaque compétence lorsque le mentor est disponible. La confiance et le respect déterminent le bonus d'apprentissage.
- La séance encadrée consomme **une séance d'entraînement et une action sociale** ; une seule interaction de faction de cette catégorie peut avoir lieu chaque année.
- L'action « S'entraîner avec le mentor » des Relations exploite ce même moteur pour entraîner la compétence dominante de la spécialité pirate, ou la technique de combat hors carrière.

## Carrière pirate
- Trois grades : **Recrue → Membre confirmé → Officier**, avec des conditions croissantes d'ancienneté et de performance.
- La promotion automatique devient **probabiliste** et dépend des performances, des compétences, des liens avec le capitaine et du contexte de l'équipage.
- Bouton **Demander une promotion** sous conditions, au maximum une fois par an. Le capitaine peut refuser ; sa confiance évolue selon la réponse.
- Les **avertissements** peuvent survenir après de mauvaises performances prolongées.
- Travailler davantage améliore la performance, mais **augmente la fatigue**. Une blessure sérieuse bloque temporairement cette action.
- Aucun nouveau sous-menu : tout reste dans Carrière, Relations et Activités.

## Continuité et sauvegardes
- Une pression sur **+ Âge** fait toujours avancer exactement **un an**.
- Version de schéma 11, clé de sauvegarde `opl:foundation:life-v051`.
- **Migration V0.5.0 → V0.5.1** : les compétences, talents, performances, grades, âges, proches et historiques restent inchangés ; seuls les nouveaux champs de repos, blessures et demandes de promotion sont initialisés.
- Les anciennes migrations restent actives et leurs sauvegardes originales ne sont pas effacées.
- Tests automatiques de blessures, mentor, fatigue, loyauté, promotions, rejets, simulations longues et récupération, plus QA mobile Chromium/WebKit.

Les missions pirates détaillées et les primes seront étudiées après cette étape.
