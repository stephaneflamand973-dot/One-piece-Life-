(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

const goods={
  provisions:{label:'Vivres',base:550,size:2,supply:['Commerce','Village','Île','Mer'],demand:['Pirates','Conflit','Grand Line','New World']},
  medicine:{label:'Médicaments',base:1650,size:1,supply:['Médecine','Ville','Royaume'],demand:['Conflit','Pirates','Instabilité']},
  timber:{label:'Bois & matériaux',base:950,size:3,supply:['Nature','Navires','Charpentiers'],demand:['Commerce','Port','Pirates','Gouvernement']},
  tools:{label:'Outils',base:1850,size:2,supply:['Navires','Commerce','Ville','Science'],demand:['Nature','Île','Conflit','Pirates']},
  textiles:{label:'Textiles',base:1150,size:2,supply:['Commerce','Royaume','Ville'],demand:['Village','Île','Pirates']},
  books:{label:'Livres & cartes',base:2300,size:1,supply:['Savoir','Histoire','Science','Royaume'],demand:['Navigation','Gouvernement','Ville','Grand Line']},
  luxury:{label:'Produits de luxe',base:4300,size:1,supply:['Royaume','Noblesse','Commerce'],demand:['Pirates','Port','Ville','New World']},
  salvage:{label:'Pièces & récupération',base:850,size:3,supply:['Pirates','Conflit','Navires','Criminalité'],demand:['Commerce','Ville','Gouvernement','Charpentiers']}
};

registry.register('marketDataV88',{version:'8.8.0',goods});
})(window);
