# ONE PIECE LIFE — V11.0 : Sagas personnelles

## Fonctionnalités

- Les contrats liés à une rencontre peuvent engendrer une **saga personnelle en trois chapitres**.
- Trois arcs : alliance décisive, opération clandestine, saga de rivalité, selon le contrat déclencheur.
- Le joueur doit **sélectionner la saga**, puis utiliser **une action annuelle** pour démarrer chaque chapitre. Trois actions maximum par an.
- Chaque chapitre propose quatre réponses, dont la retraite volontaire. Négociation, discrétion et affrontement modifient les chances de réussite et les blessures.
- Un échec ne saute pas automatiquement au chapitre suivant ; cinq échecs compromettent définitivement l'arc.
- La récompense en Berry est remise **seulement après les trois réussites**, une fois. Santé, confiance, rivalité, réputation et monde causal suivent les actions réalisées.
- Les sagas et décisions en cours survivent au rechargement et aux anciennes sauvegardes ; le passage annuel ne crée aucun chapitre automatiquement.

## Flux joueur

**Expédition** → rencontre → **contrat V10.9** → exécution manuelle du contrat → **saga V11.0** → choisir la saga → jouer les chapitres.

Les sagas sont dans *Monde > Mes sagas personnelles* et accessibles depuis le Centre d'actions.

## Sécurité et équilibrage

- Maximum 3 sagas simultanément actives ; historique borné, données re-normalisées au chargement.
- Une décision ouverte bloque les actions annuelles et l'avancement de l'année.
- Le système de quotas commun V10.2 empêche de répéter la même action indéfiniment.
- **GAME_VERSION 11.0.0 ; SAVE_VERSION 1000** ; cache PWA `one-piece-life-v11-0-0`.

## Vérifications

- Test de moteur, probabilité, retraite, fin et échec définitif, limites, sauvegarde et version : `scripts/qa-v110.mjs`.
- Vérification intégrée d'une partie complète : `scripts/qa-v100-runtime.mjs`.
- Régressions historiques exécutées dans les workflows GitHub.
