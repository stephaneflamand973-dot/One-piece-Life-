# ONE PIECE LIFE V10.9 : Contrats persistants et conséquences

## Fonctionnement
- Une rencontre terminée peut engendrer un contrat lié au contact rencontré, sans attribuer directement Berry ou progression.
- La proposition tient compte du **type de relation** : coopération si confiance élevée, médiation pour relations neutres, règlement de comptes en cas de rivalité ou affrontement.
- La récompense varie avec le danger local, mais le joueur doit **sélectionner et accomplir** le contrat. Le succès n'est jamais garanti et un échec peut engendrer une perte d'argent, de réputation, voire une blessure.
- Les compétences, puissance, soutien collectif, confiance, rivalité et difficulté modifient les chances de réussite. La deuxième action annuelle rapporte moins.

## Action BitLife
- Nouvelle action `contact_contract`, deux utilisations par an, coût 12 énergie + frais de contrat.
- Accessible dans le Centre d'actions et le panneau Monde > Contrats et contacts.
- Les décisions en attente et les traversées verrouillent les contrats. Les contrats sont locaux à leur région.
- Les contrats résolus ne peuvent pas être exécutés deux fois. Maximum six offres ouvertes ; historique borné à 28 résultats.

## État et migration
- État `player.contractsV109` normalisé à la lecture, sans conversion intrusive des anciennes parties.
- `GAME_VERSION=10.9.0`, `SAVE_VERSION=1000`, cache PWA `one-piece-life-v10-9-0`.
- La fin de contrat modifie directement santé, Berry, réputation et contacts V10.7/V10.8, sans progression automatique d'une année.

## QA
- Tests de moteur, restrictions, probabilités, vieillissement neutre, limite de quotas et sauvegarde : `scripts/qa-v109.mjs`.
- Parcours intégré avec génération, sélection et résolution réelle : `scripts/qa-v100-runtime.mjs`.
- Workflows `.github/workflows/qa.yml` et `.github/workflows/validate.yml`.
