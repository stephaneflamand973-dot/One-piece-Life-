# ONE PIECE LIFE · Fondation V0.3

Un moteur d'événements annuel minimal, autonome et **lié à des choix dont les conséquences sont conservées**.

## Fonctionnel

- Personnage créé à 0 an, nom/genre/mer et lieu facultatifs.
- À chaque pression sur **+ Âge**, exactement une année de progression et une entrée dans le journal.
- Les années ordinaires génèrent un court événement contextuel selon la tranche d'âge.
- **8 décisions jalons** : 6, 12, 16, 18, 25, 35, 50 et 70 ans.
- Lors d'une décision, le moteur stoppe la progression en attendant la réponse, y compris après rechargement.
- Les choix influencent trois qualités discrètes, **Audace, Curiosité, Solidarité**, plafonnées à 5, et produisent des suites narratives différentes l'année suivante.
- Les qualités apparaissent dans la fiche seulement après qu'elles ont été développées.
- Les décisions sont enregistrées dans le journal, sans ajouter de page.
- Reprise automatique des parties V0.2 (clé `opl:foundation:life-v02`) dans V0.3 (clé `opl:foundation:life-v03`), sans effacer l'original.
- Le bouton **Nouvelle vie** stocke un état vide en V0.3 et empêche la résurrection d'anciennes parties V0.2.
- Les autres rubriques sont toujours des contenants vides.

## Structure

- `foundation/src/core/events.mjs` : scènes jalons, choix, conséquences et événements annuels par âge.
- `foundation/src/core/state.mjs` : transitions pures, validation de l'historique, choix en attente.
- `foundation/src/core/engine.mjs` : transitions commitées uniquement après sauvegarde réussie.
- `foundation/src/core/storage.mjs` : sauvegarde V0.3, migration stricte et conservatrice V0.2.
- `foundation/src/ui/life-view.mjs` : un panneau de décision contextuel, aucun écran superflu.
- `foundation/src/ui/app.mjs` : événements UI, navigation stable V0.1.

## Limites volontaires

Il n'y a pas encore de missions, de combats, de faction, d'argent, de statistiques de santé, de PNJ ou de relations. Les événements n'en prétendent pas le contraire. Les qualités constituent des traces narratives simples, pas un système de progression complet.

## Tester

```sh
npm test
python3 -m http.server 8000
```
Ouvrir `http://localhost:8000/foundation/`. Tester les décisions en attente après rechargement et l'affichage mobile avant de considérer l'ergonomie définitivement validée.
