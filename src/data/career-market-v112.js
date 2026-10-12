(function(global){
'use strict';
const r=global.OPL_MODULES;if(!r)throw Error('OPL registry unavailable');
const ordinary=[
['docker','Docker','Mer et transport',15,680,'Survie',0],
['fisher','Pêcheur','Mer et transport',15,720,'Navigation',0],
['sailor','Matelot marchand','Mer et transport',16,960,'Navigation',0],
['navigator','Navigateur marchand','Mer et transport',18,1680,'Navigation',26],
['captainMerchant','Capitaine marchand','Mer et transport',24,3100,'Navigation',50],
['shipwrightAid','Apprenti charpentier naval','Artisanat',15,750,'Artisanat',0],
['shipwright','Charpentier naval','Artisanat',17,1480,'Artisanat',22],
['blacksmith','Forgeron','Artisanat',16,1350,'Artisanat',14],
['gunsmith','Armurier','Artisanat',19,1980,'Tir',30],
['tailor','Tailleur','Artisanat',15,930,'Artisanat',0],
['jeweler','Joaillier','Artisanat',19,2000,'Artisanat',35],
['cook','Cuisinier','Hôtellerie et services',15,960,'Cuisine',0],
['server','Serveur','Hôtellerie et services',15,730,'Commerce',0],
['innkeeper','Aubergiste','Hôtellerie et services',18,1600,'Commerce',18],
['bartender','Barman','Hôtellerie et services',18,1130,'Commerce',12],
['housekeeper','Employé d’entretien','Hôtellerie et services',15,660,'Artisanat',0],
['merchantAid','Vendeur de marché','Commerce',15,860,'Commerce',0],
['merchant','Marchand','Commerce',17,1430,'Commerce',18],
['trader','Négociant maritime','Commerce',19,2360,'Commerce',34],
['accountant','Comptable','Commerce',18,1760,'Commerce',30],
['broker','Courtier commercial','Commerce',21,2600,'Commerce',44],
['farmhand','Ouvrier agricole','Nature et ressources',15,680,'Survie',0],
['farmer','Agriculteur','Nature et ressources',17,1100,'Survie',10],
['herbalist','Herboriste','Nature et ressources',17,1490,'Médecine',22],
['miner','Mineur','Nature et ressources',16,1250,'Survie',14],
['logger','Bûcheron','Nature et ressources',16,1130,'Survie',8],
['nurseAid','Aide-soignant','Santé et sciences',17,1150,'Médecine',12],
['nurse','Infirmier','Santé et sciences',19,1980,'Médecine',36],
['doctor','Médecin','Santé et sciences',23,3650,'Médecine',65],
['labAid','Assistant de laboratoire','Santé et sciences',17,1350,'Science',22],
['scientist','Chercheur scientifique','Santé et sciences',23,3380,'Science',65],
['archivist','Archiviste','Éducation et administration',16,1130,'Science',10],
['teacherAid','Assistant d’enseignement','Éducation et administration',17,1260,'Commandement',20],
['teacher','Enseignant','Éducation et administration',21,2210,'Commandement',48],
['cartographer','Cartographe','Éducation et administration',19,1880,'Navigation',30],
['postman','Facteur','Éducation et administration',16,970,'Survie',0],
['journalist','Journaliste','Éducation et administration',18,1750,'Commerce',28],
['musician','Musicien','Arts et spectacles',15,890,'Arts',0],
['performer','Artiste de scène','Arts et spectacles',16,1290,'Arts',18],
['photographer','Photographe','Arts et spectacles',17,1300,'Arts',15],
['bodyguard','Garde du corps','Sécurité civile',18,1720,'Combat',28],
['guard','Agent de sécurité','Sécurité civile',17,1320,'Combat',14],
].map(([id,label,sector,minAge,pay,skill,skillMin])=>({id,label,sector,minAge,pay,skill,skillMin,kind:'ordinary'}));
const special=[
{id:'pirate_join',label:'Rejoindre un équipage pirate',faction:'Pirates',career:'Pirate',rank:'Mousse',minAge:15,skill:'Combat',skillMin:0,description:'Embarque avec un capitaine existant. Fais tes preuves et construis des liens.'},
{id:'pirate_found',label:'Créer ton équipage pirate',faction:'Pirates',career:'Pirate',rank:'Capitaine',minAge:18,skill:'Commandement',skillMin:12,money:1800,description:'Achète un premier sloop, choisis ton pavillon et dirige ton propre équipage.'},
{id:'marine',label:'S’engager dans la Marine',faction:'Marine',career:'Marine',rank:'Recrue',minAge:16,skill:'Discipline',skillMin:0,description:'Recrutement, missions, grades et mutations au sein de la Marine.'},
{id:'government',label:'Rejoindre le Gouvernement Mondial',faction:'Gouvernement',career:'Agent du Gouvernement',rank:'Recrue',minAge:18,skill:'Discipline',skillMin:16,description:'Service administratif, renseignement et possible ascension vers le Cipher Pol.'},
{id:'hunter',label:'Devenir chasseur de primes',faction:'Chasseurs de primes',career:'Chasseur de primes',rank:'Débutant',minAge:17,skill:'Combat',skillMin:10,description:'Traque des cibles, contrats dangereux et réputation indépendante.'},
{id:'revolution',label:'Intégrer les Révolutionnaires',faction:'Révolutionnaires',career:'Révolutionnaire',rank:'Sympathisant',minAge:17,skill:'Discrétion',skillMin:10,description:'Cellules clandestines, opérations secrètes et ascension dans le réseau.'}
].map(x=>({...x,kind:'special'}));
// Distinct special careers. These are operations, not civilian jobs.
const specialOperations=[
 ['pirate_raid','Pirates','Attaquer un navire marchand','Butin, prime et blessures possibles.',18,'Combat',12,0.54,1300,18,900,12,2],
 ['pirate_loyalty','Pirates','Faire mes preuves auprès du capitaine','Gagner sa confiance avant de prétendre commander.',10,'Discipline',0,0.84,0,12,0,0,2,'subordinate'],
 ['pirate_recruit','Pirates','Recruter pour mon équipage','Agrandir son équipage et sa réputation de capitaine.',12,'Charisme',0,0.68,0,13,260,5,1,'captain'],
 ['pirate_challenge','Pirates','Revendiquer le capitanat','Si tu es bras droit, tente de prendre la tête de ton équipage. Une défaite abîme fortement la confiance.',24,'Commandement',28,0.34,0,28,340,16,1,'heir'],
 ['marine_patrol','Marine','Effectuer une patrouille','Protéger les civils, obtenir une citation de service.',11,'Discipline',0,0.80,190,10,0,3,2],
 ['marine_arrest','Marine','Arrêter un criminel','Mener une intervention dangereuse, récompensée au mérite.',17,'Combat',16,0.51,510,20,0,13,1],
 ['marine_report','Marine','Rédiger un rapport au commandement','Accumuler des preuves pour les promotions.',9,'Intelligence',0,0.79,0,13,0,0,2],
 ['government_intel','Gouvernement','Recueillir du renseignement','Développer un réseau de sources et des dossiers secrets.',12,'Intelligence',0,0.70,250,14,0,4,2],
 ['government_infiltrate','Gouvernement','Infiltrer un réseau hostile','Mission confidentielle avec risque de découverte.',19,'Discrétion',18,0.47,680,22,0,16,1],
 ['government_cipher','Gouvernement','Opération Cipher Pol','Affaire classifiée réservée aux agents de haut rang.',20,'Combat',25,0.51,1100,26,0,19,1,'elite'],
 ['hunter_track','Chasseurs de primes','Enquêter sur une cible','Identifier une prime exploitable et préparer une capture.',9,'Intelligence',0,0.86,0,10,0,0,2],
 ['hunter_capture','Chasseurs de primes','Capturer une cible recherchée','Gagner des Berry en livrant une cible à la justice.',18,'Combat',13,0.57,1450,20,0,16,2],
 ['hunter_elite','Chasseurs de primes','Traquer une prime majeure','Affronter une cible de premier plan pour une grosse récompense.',25,'Combat',35,0.43,3600,32,0,26,1],
 ['revolution_network','Révolutionnaires','Développer mon réseau clandestin','Obtenir le soutien des habitants et renforcer la cellule.',11,'Charisme',0,0.79,0,13,0,3,2],
 ['revolution_rescue','Révolutionnaires','Libérer des prisonniers','Organiser un sauvetage risqué contre le pouvoir en place.',20,'Discrétion',15,0.52,250,24,380,17,1],
 ['revolution_sabotage','Révolutionnaires','Saboter une installation militaire','Affaiblir le Gouvernement sans exposer toute la cellule.',22,'Combat',25,0.45,450,27,900,22,1]
].map(([id,faction,label,description,cost,skill,skillMin,chance,pay,xp,bounty,injury,limit,role])=>
 ({id,faction,label,description,cost,skill,skillMin,chance,pay,xp,bounty,injury,limit,role:role||null}));
// Civilian workplace tasks depend on the employed sector and never appear in special careers.
const ordinaryTasks=[
 ['sea_delivery','Mer et transport','Assurer une livraison maritime','Une traversée professionnelle exige précision et sang-froid.',12,'Navigation',0,.72,.22,12,7],
 ['craft_order','Artisanat','Honorer une commande exigeante','Confectionner une pièce de qualité pour un client.',12,'Artisanat',0,.73,.19,12,2],
 ['service_guest','Hôtellerie et services','Satisfaire une clientèle exigeante','Transformer une journée difficile en excellente réputation.',10,'Commerce',0,.76,.16,10,1],
 ['trade_deal','Commerce','Conclure une vente importante','Négocier un contrat et gagner la confiance des clients.',11,'Commerce',0,.66,.27,13,1],
 ['harvest_work','Nature et ressources','Organiser une récolte difficile','Gérer la production malgré les contraintes du terrain.',13,'Survie',0,.72,.20,12,5],
 ['medical_case','Santé et sciences','Résoudre un dossier complexe','Mobiliser ton savoir-faire sur une affaire délicate.',15,'Médecine',10,.64,.22,15,0],
 ['school_project','Éducation et administration','Mener un projet collectif','Faire aboutir une initiative utile à la communauté.',12,'Science',0,.78,.14,12,0],
 ['art_show','Arts et spectacles','Préparer une grande représentation','Faire briller ton talent devant un public exigeant.',12,'Arts',0,.67,.24,11,1],
 ['protect_client','Sécurité civile','Assurer une mission de protection','Protéger un client et préserver ta réputation.',16,'Combat',0,.62,.28,15,10]
].map(([id,sector,label,description,cost,skill,skillMin,chance,bonusRate,xp,injury])=>
 ({id,sector,label,description,cost,skill,skillMin,chance,bonusRate,xp,injury,limit:2}));
// Every faction has a resource earned by its own preparatory activities.
// Unlike civilian jobs, high-risk special operations need a built-up case, crew or network.
const specialPreparation={
 Pirates:{label:'Cohésion d’équipage',plural:'points de cohésion',hint:'Gagne des points en aidant le capitaine ou en recrutant. Prépare ensuite les raids et les prises de commandement.',capacity:6},
 Marine:{label:'Dossiers d’intervention',plural:'dossiers',hint:'Effectue une patrouille ou rédige un rapport pour préparer les arrestations.',capacity:6},
 Gouvernement:{label:'Renseignement exploitable',plural:'renseignements',hint:'Recueille des informations avant d’infiltrer un réseau ou de lancer une opération Cipher Pol.',capacity:6},
 'Chasseurs de primes':{label:'Pistes confirmées',plural:'pistes',hint:'Enquête sur des cibles avant de les capturer. Les grandes primes exigent plusieurs pistes.',capacity:6},
 Révolutionnaires:{label:'Soutiens clandestins',plural:'soutiens',hint:'Consolide ton réseau avant les sauvetages et les sabotages.',capacity:6}
};
const operationPreparation={
 pirate_loyalty:{gain:1},pirate_recruit:{gain:1},pirate_raid:{cost:1},pirate_challenge:{cost:2},
 marine_patrol:{gain:1},marine_report:{gain:1},marine_arrest:{cost:1},
 government_intel:{gain:1},government_infiltrate:{cost:1},government_cipher:{cost:2},
 hunter_track:{gain:1},hunter_capture:{cost:1},hunter_elite:{cost:2},
 revolution_network:{gain:1},revolution_rescue:{cost:1},revolution_sabotage:{cost:2}
};
// Practical skills are the only qualifying attributes for a profession. No certificates or degrees.
const careerSkills=[
 {id:'Combat',label:'Combat'},{id:'Sabre',label:'Sabre'},{id:'Tir',label:'Tir'},
 {id:'Navigation',label:'Navigation'},{id:'Médecine',label:'Médecine'},
 {id:'Commandement',label:'Commandement'},{id:'Discrétion',label:'Discrétion'},
 {id:'Science',label:'Sciences'},{id:'Artisanat',label:'Artisanat'},
 {id:'Cuisine',label:'Cuisine'},{id:'Commerce',label:'Commerce'},
 {id:'Survie',label:'Survie'},{id:'Arts',label:'Arts et spectacles'}
];
// V12: five genuinely distinct career dossiers, never mixed with civilian work.
const specialRanks={
 Pirates:['Mousse','Membre','Combattant','Officier','Bras droit','Capitaine'],
 Marine:['Recrue','Matelot','Caporal','Sergent','Adjudant','Lieutenant','Commandant','Capitaine de vaisseau','Commodore','Contre-Amiral','Vice-Amiral'],
 Gouvernement:['Recrue','Agent','Agent confirmé','Agent spécial','Cipher Pol'],
 'Chasseurs de primes':['Débutant','Chasseur confirmé','Pisteur réputé','Chasseur d’élite'],
 Révolutionnaires:['Sympathisant','Agent de cellule','Opérateur','Cadre régional','Commandant']
};
const specialPaths={
 Pirates:[
  {id:'boarding',label:'Abordage',skill:'Combat',description:'Les raids et affrontements donnent de meilleures chances de réussite.'},
  {id:'crew',label:'Vie d’équipage',skill:'Discipline',description:'Tu progresses plus efficacement en gagnant la confiance des compagnons.'},
  {id:'command',label:'Commandement pirate',skill:'Commandement',description:'Privilégie les opérations de leadership et les responsabilités de capitaine.'}],
 Marine:[
  {id:'patrol',label:'Patrouille',skill:'Discipline',description:'Spécialise-toi dans le maintien de l’ordre et les patrouilles.'},
  {id:'justice',label:'Arrestations',skill:'Combat',description:'Renforce tes interventions et les captures de criminels.'},
  {id:'reports',label:'État-major',skill:'Intelligence',description:'Développe ton dossier grâce aux enquêtes et aux rapports.'}],
 Gouvernement:[
  {id:'intelligence',label:'Renseignement',skill:'Intelligence',description:'Fais progresser ton réseau d’informations confidentielles.'},
  {id:'covert',label:'Infiltration',skill:'Discrétion',description:'Augmente les chances de réussite des opérations clandestines.'},
  {id:'cipher',label:'Service spécial',skill:'Combat',description:'Prépare une carrière de terrain vers le Cipher Pol.'}],
 'Chasseurs de primes':[
  {id:'tracking',label:'Pistage',skill:'Intelligence',description:'Améliore les investigations et la recherche de cibles.'},
  {id:'capture',label:'Capture',skill:'Combat',description:'Optimise les captures difficiles et les gros contrats.'},
  {id:'hunter_network',label:'Réseau d’informateurs',skill:'Charisme',description:'Mise sur la réputation et les renseignements du milieu.'}],
 Révolutionnaires:[
  {id:'network',label:'Réseau clandestin',skill:'Charisme',description:'Consolide le soutien populaire et le recrutement.'},
  {id:'rescue',label:'Sauvetage',skill:'Discrétion',description:'Prépare les extractions de prisonniers et les actions discrètes.'},
  {id:'direct',label:'Action directe',skill:'Combat',description:'Développe ton efficacité lors des sabotages et affrontements.'}]
};
const specialProgression={
 Pirates:{meritStep:17,successStep:1,trust:22,baseChance:.38,promotion:'Reconnaissance de l’équipage'},
 Marine:{meritStep:16,successStep:1,trust:28,baseChance:.43,promotion:'Examen du commandement'},
 Gouvernement:{meritStep:22,successStep:1,trust:40,baseChance:.34,promotion:'Validation de la hiérarchie'},
 'Chasseurs de primes':{meritStep:15,successStep:1,trust:0,baseChance:.52,promotion:'Reconnaissance des contrats'},
 Révolutionnaires:{meritStep:19,successStep:1,trust:30,baseChance:.39,promotion:'Vote de la cellule'}
};

// BitLife-like choices in each SPECIAL career: voluntary events, never civilian tasks.
// Deltas affect real faction merit, investigation reserves, trust, injuries and Berry.
// No diploma, school rank or automatic yearly reward is involved.
const specialIncidents={
 Pirates:[
  {id:'spoils',title:'Dispute autour du butin',description:'Deux compagnons contestent la répartition du dernier butin.',choices:[
   {id:'share',label:'Négocier un partage',detail:'Apaise les tensions et renforce la cohésion.',skill:'Charisme',chance:.75,cost:5,win:{trust:7,prep:1,merit:4,xp:3,morale:7},fail:{trust:-5,merit:1,morale:-5}},
   {id:'command',label:'Imposer mon autorité',detail:'Plus de mérite en cas de réussite, mais une mutinerie menace.',skill:'Commandement',chance:.58,cost:8,win:{merit:12,trust:-2,xp:7,morale:-2},fail:{health:-9,trust:-12,morale:-12}},
   {id:'trade',label:'Faire commerce du butin',detail:'Gagne des Berry, au risque de mécontenter l’équipage.',skill:'Commerce',chance:.63,cost:6,win:{money:620,merit:3,trust:-2},fail:{money:-130,trust:-7,morale:-6}}]},
  {id:'storm',title:'Tempête et navire endommagé',description:'Le navire prend l’eau. Ton équipage attend tes instructions.',choices:[
   {id:'repair',label:'Diriger les réparations',detail:'La survie et la cohésion passent avant le butin.',skill:'Artisanat',chance:.72,cost:9,win:{prep:2,merit:7,trust:5,morale:5},fail:{health:-8,trust:-3,morale:-5}},
   {id:'steer',label:'Prendre la barre',detail:'Une manœuvre décisive qui peut sauver la traversée.',skill:'Navigation',chance:.59,cost:8,win:{merit:11,prep:1,xp:8},fail:{health:-11,trust:-6,morale:-7}}]}
 ],
 Marine:[
  {id:'civilians',title:'Un ordre face à des civils en danger',description:'Tes supérieurs veulent poursuivre un fugitif, tandis que des civils demandent secours.',choices:[
   {id:'rescue',label:'Porter secours aux civils',detail:'Prioriser la population, quitte à ralentir l’enquête.',skill:'Endurance',chance:.73,cost:9,win:{trust:7,merit:7,xp:6},fail:{health:-7,merit:2,standing:-2}},
   {id:'pursuit',label:'Poursuivre le fugitif',detail:'Satisfaire la hiérarchie, mais prendre des risques.',skill:'Combat',chance:.57,cost:9,win:{merit:12,prep:1,standing:5,xp:8},fail:{health:-10,trust:-5,standing:-4}},
   {id:'coordinate',label:'Coordonner les deux groupes',detail:'Une opération difficile qui demande du commandement.',skill:'Commandement',chance:.49,cost:12,win:{merit:14,trust:7,prep:2,xp:10},fail:{health:-5,standing:-6,trust:-4}}]},
  {id:'corruption',title:'Soupçons dans la garnison',description:'Tu découvres des irrégularités dans les rapports de ton supérieur.',choices:[
   {id:'investigate',label:'Réunir des preuves',detail:'Construire un dossier avant de dénoncer.',skill:'Intelligence',chance:.68,cost:7,win:{prep:2,merit:9,standing:3},fail:{trust:-4,merit:1}},
   {id:'report',label:'Alerter l’état-major',detail:'Faire appliquer la discipline au risque de représailles.',skill:'Discipline',chance:.54,cost:6,win:{merit:12,trust:4,xp:6},fail:{trust:-9,standing:-5}}]}
 ],
 Gouvernement:[
  {id:'leak',title:'Fuite de renseignements',description:'Un document secret a disparu. Chaque décision risque de dévoiler ton réseau.',choices:[
   {id:'trace',label:'Remonter la filière',detail:'Accumuler des preuves discrètement.',skill:'Discrétion',chance:.68,cost:8,win:{prep:2,merit:9,trust:5,xp:5},fail:{trust:-8,standing:-4}},
   {id:'interrogate',label:'Interroger les suspects',detail:'Obtenir une réponse rapide, mais risquée.',skill:'Charisme',chance:.56,cost:7,win:{merit:11,standing:4},fail:{trust:-7,health:-5}},
   {id:'conceal',label:'Étouffer provisoirement l’affaire',detail:'Protéger une source, mais sacrifier ta réputation interne.',skill:'Intelligence',chance:.79,cost:5,win:{prep:1,trust:-3,merit:3},fail:{standing:-8,merit:0}}]},
  {id:'cipher',title:'Dossier confidentiel',description:'On te confie un dossier potentiellement compromettant pour l’organisation.',choices:[
   {id:'verify',label:'Vérifier chaque détail',detail:'Une enquête longue mais plus sûre.',skill:'Intelligence',chance:.76,cost:8,win:{prep:2,merit:8,xp:6},fail:{trust:-3}},
   {id:'infiltrate',label:'Infiltrer les commanditaires',detail:'Tenter une opération audacieuse.',skill:'Discrétion',chance:.51,cost:12,win:{merit:16,trust:7,xp:11},fail:{health:-12,standing:-9}}]}
 ],
 'Chasseurs de primes':[
  {id:'rival',title:'Un rival convoite ta cible',description:'Un autre chasseur prétend avoir repéré la même prime que toi.',choices:[
   {id:'partner',label:'Proposer une capture à deux',detail:'Moins de Berry, mais un risque mieux partagé.',skill:'Charisme',chance:.80,cost:7,win:{money:420,prep:1,merit:5,xp:4},fail:{money:-80,merit:1}},
   {id:'ambush',label:'Capturer la cible en premier',detail:'Tenter seul une grosse récompense.',skill:'Combat',chance:.51,cost:12,win:{money:1150,merit:13,xp:10},fail:{health:-12,prep:-1}},
   {id:'investigate',label:'Enquêter avant de chasser',detail:'Assurer une meilleure piste pour plus tard.',skill:'Intelligence',chance:.78,cost:6,win:{prep:2,merit:5},fail:{prep:0,merit:1}}]},
  {id:'wanted',title:'Prime sous un faux nom',description:'Une piste mène à un criminel dont l’identité semble falsifiée.',choices:[
   {id:'verify',label:'Vérifier l’identité',detail:'Protéger ta réputation et préparer une vraie capture.',skill:'Intelligence',chance:.74,cost:7,win:{prep:2,merit:7,xp:4},fail:{money:-100}},
   {id:'capture',label:'Tenter la capture immédiate',detail:'Un gros gain possible, mais une erreur coûte cher.',skill:'Combat',chance:.48,cost:13,win:{money:1430,merit:14,xp:9},fail:{health:-14,merit:0}}]}
 ],
 Révolutionnaires:[
  {id:'informant',title:'Une cellule a été dénoncée',description:'Un informateur a peut-être livré la position de tes alliés.',choices:[
   {id:'evacuate',label:'Évacuer la cellule',detail:'Protéger tes compagnons avant toute contre-attaque.',skill:'Discrétion',chance:.72,cost:10,win:{prep:2,trust:7,merit:7,xp:6},fail:{health:-6,trust:-5}},
   {id:'counter',label:'Tendre un piège aux agents',detail:'Frapper les poursuivants au risque d’exposer davantage la cellule.',skill:'Combat',chance:.51,cost:13,win:{merit:15,standing:6,xp:11},fail:{health:-13,trust:-9,prep:-1}},
   {id:'recruit',label:'Mobiliser des soutiens',detail:'Renforcer le réseau sans affrontement direct.',skill:'Charisme',chance:.76,cost:6,win:{prep:2,trust:5,merit:5},fail:{trust:-3}}]},
  {id:'supply',title:'Pénurie dans un village allié',description:'Une communauté qui soutient la Révolution manque de vivres.',choices:[
   {id:'supply',label:'Organiser le ravitaillement',detail:'Soutenir la population en coordonnant les ressources.',skill:'Survie',chance:.74,cost:9,win:{prep:2,trust:7,merit:8},fail:{trust:-4}},
   {id:'raid',label:'Intercepter un convoi ennemi',detail:'Approvisionnement rapide mais risque de blessure.',skill:'Combat',chance:.51,cost:12,win:{prep:3,merit:13,xp:8},fail:{health:-10,standing:-4}}]}
 ]
};
r.register('careerMarketDataV112',{version:'12.0.0',ordinary,special,specialOperations,ordinaryTasks,careerSkills,specialRanks,specialPaths,specialProgression,specialPreparation,operationPreparation,specialIncidents,maxOrdinaryApplications:3,maxSpecialApplications:2});
})(window);
