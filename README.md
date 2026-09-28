# ONE PIECE LIFE — V0.5 World Expansion

Prototype mobile-first d’un life simulator procédural dans un monde pirate vivant.

## V0.5 — World Expansion

Cette version transforme l’exploration en système persistant plutôt qu’en téléportation entre menus.

- réseau de routes maritimes entre les lieux ;
- voyages qui consomment réellement du temps ;
- incidents possibles pendant une traversée ;
- 6 grandes régions simulées séparément ;
- pressions régionales distinctes : piraterie, Marine, criminalité, révolution, prospérité et instabilité ;
- davantage de lieux de Grand Line et du Nouveau Monde ;
- carte de progression géographique ;
- acteurs canoniques dotés d’une région dynamique ;
- équipages procéduraux régionaux ;
- vue des principales puissances mondiales ;
- nouvelles fenêtres d’événements canoniques ;
- carrières Révolutionnaires et Gouvernement / Cipher Pol ;
- missions propres à ces deux nouvelles voies ;
- migration automatique des sauvegardes V0.4 vers V0.5 ;
- compatibilité iPhone/PWA conservée ;
- déploiement GitHub Pages automatisé.

## Tester avec GitHub Pages

Le dépôt contient un workflow `.github/workflows/pages.yml`.

Après publication sur GitHub :

1. ouvrir **Settings → Pages** ;
2. dans **Build and deployment**, choisir **GitHub Actions** ;
3. pousser sur la branche `main` ;
4. l’action publie automatiquement le site ;
5. ouvrir l’URL GitHub Pages dans Safari sur iPhone ;
6. **Partager → Sur l’écran d’accueil → Ouvrir comme app web**.

Aucun build npm n’est nécessaire. Le projet est un site statique HTML/CSS/JavaScript.

## Lancement local

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Sauvegardes

Trois emplacements locaux sont disponibles. IndexedDB est utilisé en priorité, avec repli vers `localStorage`. Les sauvegardes peuvent également être exportées et réimportées sous forme de texte portable.

## Note fan project

Ce prototype n’embarque pas d’images, musiques ou autres assets officiels de l’œuvre. L’interface et les éléments graphiques sont originaux. Les noms et références d’univers servent uniquement au prototype de simulation fan-made.
