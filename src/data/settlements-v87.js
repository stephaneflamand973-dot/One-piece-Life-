(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

const services={
  market:{label:'Marché',desc:'Acheter, vendre et trouver des ressources locales.',tags:['Commerce','Port','Ville','Royaume'],cost:1200,effect:'resources'},
  clinic:{label:'Clinique',desc:'Soins, récupération et traitement des blessures légères.',tags:['Médecine','Ville','Royaume'],cost:1800,effect:'health'},
  shipyard:{label:'Chantier naval',desc:'Réparer le navire et améliorer la logistique maritime.',tags:['Port','Mer','Commerce','Grand Line'],cost:2600,effect:'ship'},
  tavern:{label:'Taverne & réseau',desc:'Rumeurs, contacts et réputation locale.',tags:['Port','Ville','Pirates','Rencontres'],cost:900,effect:'intel'},
  dojo:{label:'Dojo',desc:'Entraînement local et perfectionnement martial.',tags:['Dojo','Sabre','Conflit'],cost:1400,effect:'training'},
  archive:{label:'Archives',desc:'Savoir, histoire et compréhension des lieux.',tags:['Savoir','Histoire','Royaume','Politique'],cost:1100,effect:'knowledge'},
  underworld:{label:'Réseau clandestin',desc:'Marché gris, pistes et informations à risque.',tags:['Criminalité','Contrebande','Chasseurs','Piraterie locale'],cost:1700,effect:'underworld'},
  authority:{label:'Administration',desc:'Permis, contrats et accès institutionnels.',tags:['Marine','Royaume','Politique','Noblesse'],cost:1000,effect:'authority'}
};

const districtTemplates={
  port:{label:'Quartier portuaire',tags:['Port','Mer','Commerce'],services:['market','shipyard','tavern']},
  civic:{label:'Centre civil',tags:['Ville','Royaume','Marine','Politique'],services:['market','clinic','authority']},
  old:{label:'Vieux quartier',tags:['Histoire','Savoir','Dojo'],services:['archive','dojo','tavern']},
  frontier:{label:'Périphérie',tags:['Nature','Conflit','Instabilité'],services:['clinic','dojo','underworld']},
  shadow:{label:'Bas-fonds',tags:['Criminalité','Contrebande','Pirates'],services:['underworld','tavern','market']}
};

const standingLabels=[
  {min:-100,label:'Recherché'},
  {min:-40,label:'Mal vu'},
  {min:-10,label:'Méfiance'},
  {min:10,label:'Inconnu'},
  {min:30,label:'Connu'},
  {min:55,label:'Apprécié'},
  {min:80,label:'Figure locale'}
];

registry.register('settlementDataV87',{version:'8.7.0',services,districtTemplates,standingLabels});
})(window);
