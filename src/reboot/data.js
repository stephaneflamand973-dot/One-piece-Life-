
export const ORIGINS=['East Blue','West Blue','North Blue','South Blue','Grand Line'];
export const FIRST_NAMES=['Lina','Kael','Nora','Ryu','Milo','Iris','Sora','Namiya','Tao','Alma','Enzo','Mira'];
export const LAST_NAMES=['Marin','Vega','Dorian','Akira','Bell','Orion','Kazan','Mori','Vale','Rio'];
export const JOBS=[
 {id:'dock',name:'Manutentionnaire du port',pay:3200,age:16,intellect:0,fitness:25},
 {id:'waiter',name:'Serveur',pay:3400,age:16,intellect:10,fitness:0},
 {id:'farmer',name:'Cultivateur',pay:3600,age:16,intellect:0,fitness:25},
 {id:'fish',name:'Pêcheur',pay:4100,age:16,intellect:0,fitness:35},
 {id:'shop',name:'Employé de boutique',pay:4200,age:16,intellect:15,fitness:0},
 {id:'cook',name:'Cuisinier',pay:4650,age:16,intellect:25,fitness:0},
 {id:'inn',name:'Aubergiste',pay:4700,age:18,intellect:30,fitness:0},
 {id:'smith',name:'Forgeron',pay:5200,age:18,intellect:25,fitness:35},
 {id:'seller',name:'Commerçant',pay:5600,age:18,intellect:35,fitness:0},
 {id:'carpenter',name:'Charpentier naval',pay:6300,age:18,intellect:35,fitness:35},
 {id:'medic',name:'Assistant médical',pay:6800,age:18,intellect:65,fitness:0},
 {id:'navigator',name:'Navigateur civil',pay:7400,age:18,intellect:60,fitness:30},
 {id:'scholar',name:'Archiviste',pay:7600,age:18,intellect:70,fitness:0},
 {id:'doctor',name:'Médecin',pay:11000,age:22,intellect:85,fitness:0},
 {id:'engineer',name:'Ingénieur naval',pay:12500,age:22,intellect:88,fitness:0}
];
export const SPECIAL=[
 {id:'pirate',name:'Pirate',subtitle:'Créer ou rejoindre un équipage',age:18,fitness:25,intellect:0,actions:[{id:'raid',label:'Partir en expédition',cost:18},{id:'recruit',label:'Recruter un membre',cost:8}]},
 {id:'marine',name:'Marine',subtitle:'Engagement, patrouilles et grades',age:16,fitness:35,intellect:0,actions:[{id:'patrol',label:'Effectuer une patrouille',cost:14},{id:'train',label:'S’entraîner au service',cost:10}]},
 {id:'government',name:'Gouvernement mondial',subtitle:'Renseignements et influence',age:18,fitness:0,intellect:65,actions:[{id:'intel',label:'Collecter du renseignement',cost:12},{id:'influence',label:'Développer son réseau',cost:8}]},
 {id:'hunter',name:'Chasseur de primes',subtitle:'Licence et contrats de capture',age:18,fitness:45,intellect:0,actions:[{id:'contract',label:'Accepter un contrat',cost:16},{id:'scout',label:'Rechercher une cible',cost:8}]},
 {id:'revolution',name:'Révolutionnaire',subtitle:'Réseau clandestin et opérations',age:18,fitness:25,intellect:35,actions:[{id:'mission',label:'Participer à une opération',cost:16},{id:'network',label:'Développer un contact',cost:9}]}
];
export const EVENTS=[
 {id:'storm',title:'Une tempête approche',text:'Les habitants demandent de l’aide pour sécuriser le port.',choices:[
  {id:'help',label:'Aider au port',text:'Tu as porté secours à tes voisins.',delta:{happiness:5,health:-4,fitness:2}},
  {id:'shelter',label:'Rester à l’abri',text:'Tu es resté en sécurité pendant la tempête.',delta:{health:2,happiness:-1}}]},
 {id:'book',title:'Une découverte fascinante',text:'Un voyageur te propose un ouvrage rare sur Grand Line.',choices:[
  {id:'read',label:'Lire le livre',text:'Tu as enrichi tes connaissances.',delta:{intellect:5,happiness:2}},
  {id:'pass',label:'Décliner',text:'Tu as préféré consacrer ton temps à autre chose.',delta:{happiness:1}}]},
 {id:'festival',title:'Fête sur ton île',text:'Une grande fête anime le village et attire de nombreux visiteurs.',choices:[
  {id:'go',label:'Participer',text:'Une belle journée à rencontrer les habitants.',delta:{happiness:7},money:-150},
  {id:'stay',label:'Rester chez toi',text:'Une soirée reposante, loin de la foule.',delta:{health:3}}]},
 {id:'stranger',title:'Un inconnu en difficulté',text:'Un marin te demande une aide urgente.',choices:[
  {id:'help',label:'L’aider',text:'Il te remercie chaleureusement.',delta:{happiness:4},money:-100},
  {id:'ignore',label:'Continuer ton chemin',text:'Tu poursuis ton chemin.',delta:{happiness:-2}}]}
];
