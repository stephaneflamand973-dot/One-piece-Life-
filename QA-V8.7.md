# ONE PIECE LIFE — QA V8.7

V8.7.0 — Islands & Settlements 4.0

## Objectif

La V8.7 donne une identité jouable et persistante aux îles. Explorer un lieu, y revenir, y réussir des opportunités ou utiliser ses services construit désormais une relation spécifique avec cette destination.

## Réputation par île

Chaque île suit :
- standing local de -100 à 100 ;
- familiarité 0–100 ;
- chaleur 0–100 ;
- nombre de visites ;
- contacts ;
- services utilisés ;
- dernière visite ;
- dernière action locale majeure.

Les niveaux vont de Recherché à Figure locale.

## Quartiers

Le moteur dérive les quartiers accessibles depuis les tags réels de PLACE_DATA :
- quartier portuaire ;
- centre civil ;
- vieux quartier ;
- périphérie ;
- bas-fonds.

Une destination portuaire et commerciale comme Water 7 n'offre donc pas la même structure qu'une île de savoir ou un repaire pirate.

## Services

Huit familles :
- Marché ;
- Clinique ;
- Chantier naval ;
- Taverne & réseau ;
- Dojo ;
- Archives ;
- Réseau clandestin ;
- Administration.

La disponibilité dépend du lieu, des quartiers et parfois de la réputation/familiarité.

## Prix dynamiques

Le prix combine :
- tarif de base ;
- indice économique régional V6.8 ;
- standing local ;
- familiarité ;
- chaleur.

Une île prospère où le joueur est apprécié coûte moins cher qu'une région instable où il attire l'attention.

## Effets

Les services peuvent :
- restaurer santé et énergie ;
- réparer le navire ;
- renforcer les réserves V8.4 ;
- entraîner Combat, Navigation ou Discrétion ;
- augmenter l'exploration V8.5 ;
- créer des contacts ;
- générer une piste rare V6.4 ;
- modifier standing et chaleur.

## Intégrations

- V8.5 : chaque arrivée augmente la familiarité.
- V8.6 : les opportunités réussies ou ratées affectent la réputation propre à l'île.
- V6.8 : les prix viennent de l'économie régionale réelle.
- V8.4 : chantiers navals et marchés améliorent navire et réserves.
- V6.4 : tavernes, archives ou réseaux clandestins peuvent ouvrir des pistes.

## Version

- GAME_VERSION : **8.7.0**
- SAVE_VERSION : **870**
- Cache PWA : **one-piece-life-v8-7-0**
