(function(global){
'use strict';
const r=global.OPL_MODULES;if(!r)throw Error('Module registry missing');
const assets={
 dojo:{label:'Salle d’entraînement',base:16000,max:2,category:'equipment',description:'Améliore les gains des séances manuelles (+9 % par niveau).'},
 clinic:{label:'Matériel médical',base:24000,max:2,category:'equipment',description:'Améliore la récupération volontaire (+18 % par niveau).'},
 navigation:{label:'Bureau de navigation',base:34000,max:2,category:'equipment',description:'Réduit le coût énergétique des traversées manuelles (2 points par niveau).'},
 shop:{label:'Commerce insulaire',base:28000,max:3,category:'business',operatingCost:1200,revenue:4200,description:'Exploiter ce commerce rapporte des Berry seulement lorsque tu le gères.'},
 shipyard:{label:'Atelier naval',base:46000,max:3,category:'business',operatingCost:2200,revenue:7000,description:'Entreprise plus coûteuse, rentable avec une gestion active.'},
 rentals:{label:'Location de logements',base:78000,max:3,category:'business',operatingCost:2900,revenue:9600,description:'Patrimoine locatif. Il faut demander l’encaissement de chaque période.'}
};
r.register('economyDataV105',{version:'10.5.0',assets,buyLimit:2,operateLimit:3});
})(window);
