(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

const rarities={
  common:{label:'Commun',tier:0,mult:1,value:1},
  fine:{label:'Soigné',tier:1,mult:1.16,value:1.25},
  rare:{label:'Rare',tier:2,mult:1.38,value:1.7},
  exceptional:{label:'Exceptionnel',tier:3,mult:1.68,value:2.5},
  legendary:{label:'Légendaire',tier:4,mult:2.05,value:4}
};
const slots={
  weapon:{label:'Arme'},
  outfit:{label:'Tenue'},
  accessory:{label:'Accessoire'},
  tool:{label:'Outil'}
};
const templates={
  iron_cutlass:{label:'Sabre de marine usé',slot:'weapon',baseValue:5200,tags:['Sabre','Port','Marine'],effects:{offense:3,sabre:3}},
  pirate_blade:{label:'Lame de corsaire',slot:'weapon',baseValue:7600,tags:['Sabre','Pirates','Criminalité'],effects:{offense:4,sabre:4}},
  long_rifle:{label:'Fusil long',slot:'weapon',baseValue:8400,tags:['Tir','Marine','Chasseurs'],effects:{offense:4,tir:5}},
  flintlock:{label:'Pistolet à silex',slot:'weapon',baseValue:6100,tags:['Tir','Port','Pirates'],effects:{offense:3,tir:3}},
  iron_knuckles:{label:'Poings renforcés',slot:'weapon',baseValue:4700,tags:['Combat','Dojo','Criminalité'],effects:{offense:3,combat:4}},
  combat_staff:{label:'Bâton de combat',slot:'weapon',baseValue:4300,tags:['Combat','Dojo','Village'],effects:{offense:2,combat:3,defense:1}},
  reinforced_coat:{label:'Manteau renforcé',slot:'outfit',baseValue:6700,tags:['Port','Ville','Commerce'],effects:{defense:4,mission:1}},
  marine_vest:{label:'Gilet tactique',slot:'outfit',baseValue:9100,tags:['Marine','Gouvernement'],effects:{defense:5,mission:2}},
  traveler_cloak:{label:'Cape de voyage',slot:'outfit',baseValue:6400,tags:['Exploration','Nature','Voyage'],effects:{defense:2,stealth:3,navigation:2}},
  pirate_leathers:{label:'Cuirs de pont',slot:'outfit',baseValue:7200,tags:['Pirates','Port','Mer'],effects:{defense:3,offense:1,mission:1}},
  brass_compass:{label:'Compas de précision',slot:'accessory',baseValue:5800,tags:['Navigation','Port','Grand Line'],effects:{navigation:4,exploration:2}},
  observation_goggles:{label:'Lunettes d’observation',slot:'accessory',baseValue:7900,tags:['Science','Exploration','Gouvernement'],effects:{stealth:2,navigation:2,mission:2}},
  lucky_charm:{label:'Talisman de marin',slot:'accessory',baseValue:4100,tags:['Mer','Village','Pirates'],effects:{mission:2,exploration:1}},
  den_den_mushi:{label:'Den Den Mushi portable',slot:'accessory',baseValue:9800,tags:['Ville','Marine','Gouvernement','Commerce'],effects:{mission:3,command:3}},
  medical_kit:{label:'Trousse médicale',slot:'tool',baseValue:7300,tags:['Médecine','Ville','Royaume'],effects:{medicine:5,mission:1}},
  field_toolkit:{label:'Kit d’atelier',slot:'tool',baseValue:7600,tags:['Navires','Science','Charpentiers'],effects:{science:4,mission:2}},
  lockpick_set:{label:'Outils d’infiltration',slot:'tool',baseValue:6900,tags:['Criminalité','Contrebande','Gouvernement'],effects:{stealth:5,mission:1}},
  field_maps:{label:'Cartes de terrain',slot:'tool',baseValue:6200,tags:['Navigation','Exploration','Savoir'],effects:{navigation:3,exploration:4}},
  legacy_protection:{label:'Équipement renforcé hérité',slot:'outfit',baseValue:12000,tags:['Legacy'],effects:{defense:5,mission:2}},
  bandage:{label:'Bandages de terrain',slot:null,consumable:true,baseValue:900,tags:['Médecine','Ville'],use:{health:14}},
  ration:{label:'Rations compactes',slot:null,consumable:true,baseValue:700,tags:['Port','Voyage','Commerce'],use:{energy:16}},
  smoke_bomb:{label:'Fumigène',slot:null,consumable:true,baseValue:1500,tags:['Criminalité','Gouvernement','Contrebande'],use:{heat:-5,energy:4}}
};

registry.register('equipmentDataV89',{version:'8.9.0',rarities,slots,templates});
})(window);
