# One Piece Life · application iOS native (Capacitor)

Ce dossier emballe le jeu de `jeu/` dans une vraie application iOS. **Rien à faire tant qu'il n'y a pas de compte Apple Developer** : sans lui, Apple ne permet pas d'installer l'app sur un iPhone.

## Ce qui est prêt

- `capacitor.config.json` : identité de l'app (`io.github.stephaneflamand973.onepiecelife`).
- `npm run ios` : copie le jeu dans `www/`, crée le projet iOS et le synchronise.
- `.github/workflows/ios.yml` : compilation sur un Mac de GitHub, lancée à la main (onglet Actions → « iOS (Capacitor) » → Run workflow). Elle produit une app **non signée** : elle prouve que tout compile, mais ne s'installe pas.

## Le jour où le compte Apple Developer existe

1. Dans App Store Connect, créer l'app avec l'identifiant ci-dessus.
2. Créer une clé d'API App Store Connect, et l'ajouter aux secrets du dépôt GitHub (`APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY`).
3. Ajouter au workflow l'étape de signature et d'envoi vers TestFlight.
4. Installer TestFlight sur l'iPhone et accepter l'invitation.
