# One Piece Life V0.5.7 · Gestion avancée du navire

La carrière pirate propose un **chantier naval repliable** directement dans **Carrière**, inspiré de la navigation simple de BitLife, avec la profondeur du monde de One Piece. Aucun nouvel onglet obligatoire.

## Trois modèles de bateaux

| Modèle | Prix neuf | Places | Particularités |
|---|---:|---:|---|
| Sloop | 50 000 Berrys | 4 | Premier bateau |
| Brick | 140 000 Berrys | 6 | Plus rapide et armé |
| Frégate | 350 000 Berrys | 8 | Très résistant et armé |

Le capitaine peut acheter un autre navire à tout moment. **L'ancien est repris pour 30 % de son prix neuf**, déduit du coût de l'achat ; les compagnons, compétences, prime et richesse restants sont conservés. Le bateau remplacé perd ses améliorations (elles ne sont pas transférables). Il est impossible d'acheter un bateau ayant moins de places que l'équipage présent.

## Réparations et usure

- **Coque** : la commande déjà existante « Réparer le navire » reste disponible ; elle coûte 8 000 Berrys et peut remettre en état un bateau immobilisé.
- **Voiles, gouvernail et canons** : réparables indépendamment pour 6 000 Berrys par intervention.
- **Entretien général** : 9 000 Berrys ; améliore de 36 points l'entretien jusqu'à 100.
- **Améliorations permanentes** : coque, voiles, gouvernail, canons ; maximum trois niveaux par pièce, coûts croissants (20 000 / 34 000 / 48 000 Berrys, +25 % pour la coque).
- Les missions et les années usent les équipements et l'entretien, les missions de combat causent davantage de dégâts ; un charpentier aide à limiter les dommages.
- Lorsque coque, voiles ou gouvernail atteignent zéro, **le navire ne peut plus participer à une mission** tant que la pièce n'est pas réparée. Le personnage et son butin ne sont pas effacés.
- Les caractéristiques de vitesse, armure, puissance et état général influencent les chances de réussite et les dommages.

Toutes les décisions maritimes se font **sans avancer d'une année**. Seul « + Âge » fait progresser l'âge.

## Sauvegardes et tests

Le schéma passe à **16** avec la clé `opl:foundation:life-v057`. La migration depuis la V0.5.6 reconstruit le premier sloop sans toucher aux personnages, Berrys, loyautés, liens, missions ou historique ; les versions plus anciennes passent encore par la chaîne de migrations.

La suite naturelle est la V0.5.8 : îles, itinéraires, dangers maritimes et navigation libre.
