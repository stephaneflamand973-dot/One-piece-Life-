(function(global){
'use strict';
const r=global.OPL_MODULES;if(!r)throw Error('OPL registry unavailable');
const ordinary=[
['docker','Docker','Mer et transport',15,680,'Physique',0],
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
['server','Serveur','Hôtellerie et services',15,730,'Charisme',0],
['innkeeper','Aubergiste','Hôtellerie et services',18,1600,'Charisme',18],
['bartender','Barman','Hôtellerie et services',18,1130,'Charisme',12],
['housekeeper','Employé d’entretien','Hôtellerie et services',15,660,'Discipline',0],
['merchantAid','Vendeur de marché','Commerce',15,860,'Charisme',0],
['merchant','Marchand','Commerce',17,1430,'Charisme',18],
['trader','Négociant maritime','Commerce',19,2360,'Charisme',34],
['accountant','Comptable','Commerce',18,1760,'Intelligence',30],
['broker','Courtier commercial','Commerce',21,2600,'Charisme',44],
['farmhand','Ouvrier agricole','Nature et ressources',15,680,'Physique',0],
['farmer','Agriculteur','Nature et ressources',17,1100,'Endurance',10],
['herbalist','Herboriste','Nature et ressources',17,1490,'Intelligence',22],
['miner','Mineur','Nature et ressources',16,1250,'Physique',14],
['logger','Bûcheron','Nature et ressources',16,1130,'Endurance',8],
['nurseAid','Aide-soignant','Santé et sciences',17,1150,'Intelligence',12],
['nurse','Infirmier','Santé et sciences',19,1980,'Intelligence',36],
['doctor','Médecin','Santé et sciences',23,3650,'Intelligence',65],
['labAid','Assistant de laboratoire','Santé et sciences',17,1350,'Intelligence',22],
['scientist','Chercheur scientifique','Santé et sciences',23,3380,'Intelligence',65],
['archivist','Archiviste','Éducation et administration',16,1130,'Intelligence',10],
['teacherAid','Assistant d’enseignement','Éducation et administration',17,1260,'Intelligence',20],
['teacher','Enseignant','Éducation et administration',21,2210,'Intelligence',48],
['cartographer','Cartographe','Éducation et administration',19,1880,'Navigation',30],
['postman','Facteur','Éducation et administration',16,970,'Endurance',0],
['journalist','Journaliste','Éducation et administration',18,1750,'Charisme',28],
['musician','Musicien','Arts et spectacles',15,890,'Charisme',0],
['performer','Artiste de scène','Arts et spectacles',16,1290,'Charisme',18],
['photographer','Photographe','Arts et spectacles',17,1300,'Intelligence',15],
['bodyguard','Garde du corps','Sécurité civile',18,1720,'Combat',28],
['guard','Agent de sécurité','Sécurité civile',17,1320,'Combat',14]
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
 ['pirate_recruit','Pirates','Recruter pour mon équipage','Agrandir son équipage et sa réputation de capitaine.',12,'Charisme',10,0.68,0,13,260,5,1,'captain'],
 ['pirate_challenge','Pirates','Revendiquer le capitanat','Si tu es bras droit, tente de prendre la tête de ton équipage. Une défaite abîme fortement la confiance.',24,'Commandement',28,0.34,0,28,340,16,1,'heir'],
 ['marine_patrol','Marine','Effectuer une patrouille','Protéger les civils, obtenir une citation de service.',11,'Discipline',0,0.80,190,10,0,3,2],
 ['marine_arrest','Marine','Arrêter un criminel','Mener une intervention dangereuse, récompensée au mérite.',17,'Combat',16,0.51,510,20,0,13,1],
 ['marine_report','Marine','Rédiger un rapport au commandement','Accumuler des preuves pour les promotions.',9,'Intelligence',0,0.79,0,13,0,0,2],
 ['government_intel','Gouvernement','Recueillir du renseignement','Développer un réseau de sources et des dossiers secrets.',12,'Intelligence',12,0.70,250,14,0,4,2],
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
 ['service_guest','Hôtellerie et services','Satisfaire une clientèle exigeante','Transformer une journée difficile en excellente réputation.',10,'Charisme',0,.76,.16,10,1],
 ['trade_deal','Commerce','Conclure une vente importante','Négocier un contrat et gagner la confiance des clients.',11,'Charisme',0,.66,.27,13,1],
 ['harvest_work','Nature et ressources','Organiser une récolte difficile','Gérer la production malgré les contraintes du terrain.',13,'Endurance',0,.72,.20,12,5],
 ['medical_case','Santé et sciences','Résoudre un dossier complexe','Mobiliser ton savoir-faire sur une affaire délicate.',15,'Intelligence',10,.64,.22,15,0],
 ['school_project','Éducation et administration','Mener un projet collectif','Faire aboutir une initiative utile à la communauté.',12,'Intelligence',0,.78,.14,12,0],
 ['art_show','Arts et spectacles','Préparer une grande représentation','Faire briller ton talent devant un public exigeant.',12,'Charisme',0,.67,.24,11,1],
 ['protect_client','Sécurité civile','Assurer une mission de protection','Protéger un client et préserver ta réputation.',16,'Combat',0,.62,.28,15,10]
].map(([id,sector,label,description,cost,skill,skillMin,chance,bonusRate,xp,injury])=>
 ({id,sector,label,description,cost,skill,skillMin,chance,bonusRate,xp,injury,limit:2}));
r.register('careerMarketDataV112',{version:'11.2.5',ordinary,special,specialOperations,ordinaryTasks,maxOrdinaryApplications:3,maxSpecialApplications:2});
})(window);
