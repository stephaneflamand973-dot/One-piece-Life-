# ONE PIECE LIFE — V10.1 Manual Actions Stabilization

## Objectif
Fiabiliser la première boucle manuelle V10.0 avant le registre d’actions unifié V10.2.

## Changements
- **Source unique de disponibilité** `v100Status` : le panneau manuel, le Centre d’actions et l’exécution utilisent les mêmes conditions.
- Conditions de travail, entraînement, promotion, mission, repos et navigation centralisées, avec des raisons de blocage explicites.
- Promotions non éligibles, grades maximaux, examens annuels déjà effectués et accès particulier au grade de Capitaine contrôlés avant consommation.
- Repos à 100 % de santé et énergie interdit afin d'éviter de perdre inutilement son action annuelle.
- **Navigation :** l'énergie de 8 points annoncée est réellement déduite avant la résolution.
- **Action Hub :** une action refusée n'entre plus dans l'historique des actions récentes.
- **Avancer d'un an :** les événements majeurs connus alimentent désormais les quatre points du bilan annuel et le Life Director V8.0 retrouve son suivi annuel.
- Texte du bouton « Avancer d'un an » adapté au modèle manuel plutôt qu'à l'ancien plan simulé.
- `GAME_VERSION=10.1.0`, `SAVE_VERSION=1000` (schéma inchangé), cache PWA `one-piece-life-v10-1-0`.

## Limites volontaires
- Les quotas manuels V10 restent inchangés (travail 1, entraînement 2, mission 1, promotion 1, repos 1, navigation 1).
- Les missions et traversées peuvent toujours se conclure en une seule action. Le modèle d'activité longue sera traité dans V10.2/V10.6.
- Les charges de foyer et l'économie pluriannuelle ne sont pas revues dans cette mise à jour.
- Les anciens contrôles de plans annuels restent masqués pour compatibilité.

## Tests
- `scripts/qa-v101.mjs` contrôle la cohérence structurelle.
- `scripts/qa-v100-runtime.mjs` teste le moteur réellement intégré, les statuts partagés, le blocage des actions refusées, les limitations pendant les voyages et le bilan annuel.
- Les anciens tests V6.4–V10.0 restent dans les workflows GitHub.

## Étape suivante
V10.2 : moteur d'actions central, transactions contrôlées et rendements annuels décroissants.
