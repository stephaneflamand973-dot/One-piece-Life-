# ONE PIECE LIFE · V0.4.1 — Relations vivantes

## Réactions et personnalité
- Chaque proche possède cinq traits persistants : sociabilité, empathie, fierté, tempérament et loyauté.
- Chaque relation conserve son affinité initiale (0–100) et trois indicateurs complémentaires : confiance, respect et rivalité.
- Sept actions : discuter, passer du temps, aider, se confier, faire un cadeau symbolique, s'excuser ou se disputer.
- Réactions dynamiques : les probabilités (12–95 %) dépendent des traits, du lien et de la confiance. Une action peut réussir ou mal tourner ; les conflits peuvent s'aggraver ou s'apaiser.
- L'écran Relations reste compact : jauge d'affinité dans la liste, deux traits dominants et indicateurs dans la fiche détaillée, chance affichée sur chaque action.
- Les actions avancées sont conditionnées par l'âge, la confiance ou l'existence d'un conflit.
- Trois interactions sociales par année au total, dont une seule avec la même personne, avec fatigue sociale et amélioration des amitiés entretenues.

## Sauvegardes
- Clé dédiée : `opl:foundation:life-v041`. Import automatique de V0.4, V0.3 et V0.2, avec conservation des anciennes clés.
- Les proches existants gardent le même nom, âge, rôle, affinité, historique d'interactions et limites de l'année. Des traits persistants sont déterminés une fois pour toutes lors de la migration V0.4.
- Le bouton Nouvelle vie conserve le comportement de reset sans faire réapparaître une ancienne partie.

## Portée
Le moteur `personality.mjs` est indépendant de `relationships.mjs`, de la navigation et du DOM. Les règles d'âge, d'une année par pression sur + Âge, les événements V0.3 et le fil mobile ne changent pas.

Les PNJ n'agissent pas encore spontanément ; ce sera la V0.4.2. Romances, mariages et enfants restent ultérieurs.

## Vérification
`npm test` vérifie le moteur. Le workflow de QA mobile parcourt l'application en Chromium (320, 390 et 430 px) et WebKit iPhone simulé.
