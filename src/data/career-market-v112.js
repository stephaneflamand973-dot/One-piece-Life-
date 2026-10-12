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
r.register('careerMarketDataV112',{version:'11.2.0',ordinary,special,maxOrdinaryApplications:3,maxSpecialApplications:2});
})(window);
