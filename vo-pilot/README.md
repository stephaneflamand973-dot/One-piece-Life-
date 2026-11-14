# VO PILOT

Centre de commandement personnel pour commercial véhicules d’occasion : prospects, relances, devis, ventes, préparations, livraisons, commissions.
Application web installable (PWA), en français, euro, fuseau America/Martinique. Elle vit dans ce dossier `vo-pilot/`, indépendamment du jeu présent à la racine du dépôt.

## Lancer

```bash
cd vo-pilot
npm install
npm run dev        # développement, http://localhost:5173
npm run build      # vérifie les types puis produit dist/
npm run preview    # sert dist/ (http://localhost:4173)
npm test           # tests unitaires et parcours métier (Vitest)
npm run e2e        # parcours dans Chromium format iPhone (préalable : build + preview sur le port 4173)
```

## Utiliser sur iPhone

Une PWA doit être servie en **HTTPS**. Le workflow `.github/workflows/pages.yml` construit l’application et la publie avec GitHub Pages
à l’adresse `https://<compte>.github.io/One-piece-Life-/vo-pilot/` **une fois la branche fusionnée dans `main`** (non vérifié tant que ce n’est pas fusionné).

1. Ouvrir l’adresse dans **Safari**.
2. Partager → **Sur l’écran d’accueil**.
3. Ouvrir VO PILOT depuis l’icône : plein écran, utilisable hors connexion après la première ouverture.

Le code publié est public, mais **aucune donnée n’y figure** : tout ce que vous saisissez reste dans le navigateur de l’appareil.

## Données

- Stockage : IndexedDB du navigateur (Dexie). Les données survivent à l’actualisation et à la fermeture.
- **Pas de synchronisation** entre iPhone et ordinateur. Chaque appareil a sa propre base.
- Sauvegarde : Paramètres → Données → *Exporter tout (JSON)* ; restauration contrôlée du même fichier sur un autre appareil.
- iOS peut purger les données d’un site resté longtemps inutilisé : installez l’application sur l’écran d’accueil et exportez régulièrement.

## Architecture

```
src/lib        types (modèle de données), db (Dexie/IndexedDB), dates (fuseau), valeurs par défaut
src/services   logique métier sans interface :
               logic (calculs, correspondances, priorités, stats)  actions (écritures + journal d’audit)
               automations (moteur de règles idempotent)  assistant (réponses déterministes)
               csv, backup, whatsapp, ics, search, demo
src/ui         composants réutilisables, fournisseur de données, dialogues de saisie rapide
src/pages      un fichier par écran
tests          Vitest (logique + parcours sur IndexedDB en mémoire)
e2e            Playwright (31 parcours, format iPhone)
```

## Ce qui n’existe pas (volontairement ou pas encore)

Aucune connexion à UpYourLeads, au stock Renault, à WhatsApp Business ou à Outlook ; pas de cloud ; pas d’IA externe ;
pas de notification en arrière-plan ; pas de chiffrement de la base locale. Détail et suite prévue : `SUIVI.md`.
