# ONE PIECE LIFE — V1.4 Wars, Alliances & Grand Strategy

Simulateur mobile-first de vie, carrière, aventure et héritage dans un monde One Piece vivant.

## V1.4 — Wars, Alliances & Grand Strategy

La V1.4 transforme les anciens conflits locaux en véritables campagnes stratégiques persistantes.

### Guerres persistantes

Une guerre possède désormais :

- attaquant principal ;
- défenseur principal ;
- coalition attaquante ;
- coalition défensive ;
- objectif ;
- territoire cible ;
- région principale ;
- durée ;
- score de guerre ;
- fatigue des deux camps ;
- fronts actifs ;
- historique des batailles ;
- résultat final.

Les conflits locaux V0.8 deviennent des fronts à l'intérieur de ces guerres.

### Plusieurs fronts

Une campagne peut générer plusieurs affrontements dans une même région.

Chaque bataille influence :

- score de guerre ;
- fatigue ;
- contrôle territorial ;
- stabilité ;
- tension mondiale.

Une victoire locale ne termine donc plus automatiquement une guerre.

### Score de guerre

Le score varie entre un avantage défensif et un avantage offensif.

Une bataille sur l'objectif principal pèse davantage.

Les guerres peuvent se terminer par :

- victoire de l'attaquant ;
- victoire du défenseur ;
- paix négociée.

### Fatigue de guerre

Les deux camps accumulent progressivement de la fatigue.

Une guerre prolongée devient donc difficile à maintenir, même sans victoire militaire totale.

### Conditions de paix

La fin de guerre peut :

- confirmer une conquête ;
- restaurer un territoire ;
- faire perdre un domaine personnel ;
- réduire la tension mondiale ;
- créer une trêve temporaire.

### Trêves

Une guerre terminée crée automatiquement une période de trêve.

La même paire de factions ne peut pas immédiatement relancer une campagne comme si les soldats avaient simplement oublié qu'ils venaient de combattre pendant huit mois.

### Alliances

La V1.4 introduit des traités persistants.

Le lien Marine ↔ Gouvernement est représenté comme une alliance structurelle.

D'autres alliances peuvent émerger lorsque les relations diplomatiques deviennent suffisamment fortes.

Lorsqu'une guerre commence, les alliés compatibles peuvent rejoindre une coalition.

Le moteur empêche désormais un même allié d'apparaître simultanément dans les deux camps.

### Guerres autonomes

Le monde peut déclencher une guerre sans intervention du joueur lorsque :

- la tension mondiale est élevée ;
- deux factions sont extrêmement hostiles ;
- aucune trêve n'est active ;
- aucune guerre ne les oppose déjà.

### Campagnes du joueur

Un chef d'organisation suffisamment influent peut lancer une guerre territoriale.

Conditions principales :

- adulte ;
- libre ;
- chef de son organisation ;
- influence élevée ;
- organisation puissante ;
- faction capable de mener une guerre ;
- cible hostile dans la région ;
- aucune trêve active.

Une campagne coûte :

- 30 000 B ;
- 12% de provisions ;
- une action stratégique.

### Soutien stratégique

Si ton camp participe à une guerre, tu peux engager des ressources pour influencer son score.

Le soutien coûte de l'argent et des provisions.

La puissance de l'organisation et l'influence du joueur déterminent l'impact.

### Intervention directe

Si un front de guerre existe dans ta région, tu peux rejoindre directement le combat.

Le résultat personnel influence alors le score stratégique du conflit.

### Négociation

Après plusieurs mois de guerre, un personnage très influent peut proposer une paix.

Les chances dépendent notamment :

- fatigue des camps ;
- équilibre du score ;
- influence personnelle.

Une tentative peut être rejetée.

### Pirates et guerres

La faction Pirates reste décentralisée.

Un personnage pirate n'est pas automatiquement considéré comme engagé dans chaque guerre impliquant des pirates ailleurs dans le monde.

Il devient directement impliqué si :

- il a lancé la campagne ;
- son propre domaine est visé.

### Domaines V1.3

Les domaines participent maintenant réellement aux guerres.

Leur défense tient compte de :

- contrôle local ;
- organisation du joueur ;
- forces affiliées présentes dans la région.

Une défaite militaire ou une paix défavorable peut faire perdre un domaine.

### Achievements V1.4

Deux nouveaux achievements :

- **Tambours de guerre** : lancer sa première campagne stratégique ;
- **Stratège des mers** : remporter trois guerres impliquant son camp.

## Correction de stabilité

La V1.4 corrige également une régression de sélecteurs dynamiques apparue lors de la V1.3.

Le validateur bloque désormais :

- l'utilisation de `$().forEach` sur une liste ;
- toute occurrence accidentelle de `$$$()`.

## Systèmes conservés

V1.3 : influence, titres, domaines, revenus territoriaux et réseaux affiliés.

V1.2 : primes, poursuites, prison, évasion et chasse aux primes.

V1.1 : organisations, équipages, membres, navires et commandement.

V1.0 : canon causal, content pack et Fruits persistants.

V0.9 : relations, famille, économie et héritage.

V0.8 : monde autonome, territoires, conflits et diplomatie.

## Sauvegardes

Les sauvegardes V0.5 à V1.3 sont migrées automatiquement vers V1.4.

La migration interne passe à la version 14.

## iPhone / PWA

GitHub Pages publie automatiquement la branche `main`.

Sur iPhone :

Safari → Partager → **Sur l'écran d'accueil** → **Ouvrir comme app web**.
