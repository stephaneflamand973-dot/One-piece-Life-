# ONE PIECE LIFE — V1.5.1 Stability & Balance

Simulateur mobile-first de vie, carrière, aventure et héritage dans un monde One Piece vivant.

## V1.5.1 — Stability & Balance

La V1.5.1 est une mise à jour de consolidation basée sur un banc QA professionnel.

### Correctifs critiques

- correction de `organizationPower()`, qui pouvait provoquer `ReferenceError: avg is not defined` dès qu’une organisation existait ;
- initialisation du RNG avant les premiers tirages Destiny, afin qu’une seed reproduise réellement toute la naissance ;
- conservation du schéma de sauvegarde interne V15, aucune réinitialisation nécessaire.

### Rééquilibrage

- courbe de danger des combats plus lisible ;
- campagnes stratégiques moins biaisées en faveur du défenseur ;
- soutien des coalitions et logistique du joueur intégrés aux batailles de guerre ;
- écarts régionaux de prix atténués ;
- achats et ventes en volume soumis au slippage ;
- pénuries moins fréquentes mais persistantes plusieurs mois ;
- risque qualitatif affiché sur les missions.

### Mobile

- textes secondaires importants agrandis ;
- boutons de marché remontés à 44 px minimum ;
- meilleure lisibilité des guerres, domaines et marchés sur petit écran.

### QA

La CI exécute désormais le validateur statique, le validateur de contenu et le banc QA de 23 scénarios fonctionnels, avec gardes de régression sur le combat, les guerres, les pénuries et les marges commerciales.

## V1.5 — Economy, Trade & Black Market

La V1.5 ajoute une économie mondiale persistante reliée aux voyages, guerres, domaines, organisations et systèmes judiciaires.

### Marchés locaux

Chaque lieu possède désormais son propre marché avec :

- stock ;
- demande ;
- activité commerciale ;
- prix locaux ;
- éventuelle pénurie ;
- éventuel blocus.

Les prix ne sont pas globaux.

Ils dépendent notamment :

- de la région ;
- de l'offre et de la demande ;
- de la stabilité du territoire ;
- de la prospérité ;
- de l'instabilité ;
- de la criminalité ;
- des conflits ;
- des guerres et blocus.

### Marchandises

Le système initial contient :

- provisions ;
- médicaments ;
- matériaux ;
- produits de luxe ;
- armes ;
- Dials ;
- Kairouseki.

Les Dials sont des biens exotiques mais légaux.

Les armes et le Kairouseki passent par les circuits clandestins dans le système de jeu.

### Spécialisation régionale

Chaque région dispose de profils économiques différents.

Exemples :

- certaines Blues produisent plus facilement nourriture ou matériaux ;
- Grand Line bénéficie d'un meilleur accès aux Dials ;
- le Nouveau Monde dispose d'un meilleur accès au Kairouseki ;
- les zones dangereuses et instables paient généralement plus cher les biens essentiels.

Skypiea reçoit un bonus structurel de production de Dials.

Wano reçoit un bonus structurel de disponibilité du Kairouseki.

### Cargaison

Le personnage possède maintenant une cargaison persistante.

Chaque marchandise conserve :

- quantité ;
- coût moyen d'achat ;
- poids ;
- valeur comptable.

La capacité dépend :

- du personnage ;
- de la Navigation ;
- surtout du navire de l'organisation lorsqu'il existe.

Un navire chargé ralentit légèrement les voyages.

### Commerce

Le joueur peut acheter et vendre directement dans les ports.

Le moteur suit :

- volume échangé ;
- nombre de transactions ;
- profit commercial cumulé ;
- meilleur profit ;
- cargaison actuelle.

Les personnages civils gagnent également un peu de progression de carrière lors des opérations commerciales réellement rentables.

### Routes commerciales

Les routes maritimes voisines affichent les écarts commerciaux les plus intéressants.

Le moteur compare les prix actuels entre les ports connectés.

Les flux autonomes transportent également des marchandises entre marchés lorsqu'un écart de prix devient important.

Ces échanges tendent progressivement à réduire les écarts.

### Blocus

Un conflit intense ou une guerre visant directement une île peut provoquer un blocus économique.

Conséquences :

- hausse immédiate des prix ;
- baisse des stocks ;
- augmentation de la demande de biens essentiels ;
- interruption des flux commerciaux autonomes ;
- réduction des revenus territoriaux.

Les guerres V1.4 ont donc maintenant une conséquence économique concrète.

### Pénuries et chocs

Chaque mois, les marchés évoluent.

Des événements rares peuvent créer :

- pénurie ;
- arrivage exceptionnel.

Ils apparaissent dans les actualités du monde.

L'interface affiche également :

- indice des prix local ;
- indice mondial ;
- nombre de pénuries ;
- prospérité régionale ;
- activité commerciale.

### Logistique des organisations

Le bouton de ravitaillement V1.1 n'utilise plus un tarif fixe arbitraire.

Le coût dépend désormais du véritable prix des provisions dans le port actuel.

Il faut également que le marché local dispose réellement du stock nécessaire.

Une organisation en guerre dans une région en pénurie peut donc rencontrer de vrais problèmes logistiques.

### Entreprises et domaines

Les revenus d'une activité commerciale personnelle dépendent maintenant de la prospérité locale et peuvent chuter sous blocus.

Les revenus des domaines V1.3 utilisent également :

- stabilité ;
- activité commerciale locale ;
- état de blocus.

Un territoire riche et connecté vaut donc davantage qu'une île ruinée par une guerre.

### Marché noir

Le marché noir peut devenir accessible selon :

- faction ;
- Discrétion ;
- niveau de criminalité régional.

Les transactions clandestines comportent un risque d'identification.

Une opération découverte utilise directement le système judiciaire V1.2.

### Contrebande maritime

Transporter une cargaison interdite entre deux ports crée maintenant un véritable risque douanier.

À l'arrivée, le contrôle dépend notamment :

- de la présence Marine ;
- du contrôleur du territoire ;
- de la chaleur judiciaire ;
- de la Discrétion du personnage.

Une interception peut entraîner :

- saisie de la cargaison ;
- amende ;
- crime enregistré ;
- hausse de chaleur ;
- nouvelle prime.

Un passage réussi améliore légèrement la Discrétion et alimente les statistiques de contrebande.

### Achievements V1.5

Deux nouveaux achievements :

- **Marchand des mers** : cumuler 100 000 B de profit commercial ;
- **Sous le nez de la Marine** : réussir trois passages de contrebande.

## Systèmes conservés

V1.4 : guerres, fronts, coalitions, trêves et campagnes.

V1.3 : influence, titres, domaines et réseaux affiliés.

V1.2 : primes, poursuites, prison, évasion et chasse aux primes.

V1.1 : organisations, équipages, membres, navires et commandement.

V1.0 : canon causal, content pack et Fruits persistants.

V0.9 : relations, famille, économie personnelle et héritage.

## Sauvegardes

Les sauvegardes V0.5 à V1.4 sont migrées automatiquement vers V1.5.

La migration interne passe à la version 15.

## Validation

Chaque push vérifie notamment :

- syntaxe du moteur ;
- interface ;
- migration V1.5 ;
- marchés mondiaux ;
- cargaison ;
- commerce ;
- marché noir ;
- contrebande ;
- sélecteurs dynamiques ;
- content pack canonique.

## iPhone / PWA

GitHub Pages publie automatiquement la branche `main`.

Sur iPhone :

Safari → Partager → **Sur l'écran d'accueil** → **Ouvrir comme app web**.
