(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const techniques=[
    {id:'fundamentals',name:'Fondamentaux',phases:['opening','pressure','finish'],styles:['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],skill:'Combat',stat:'Réflexes',base:0,risk:0,tags:['neutral']},
    {id:'rush',name:'Ruée offensive',phases:['opening','pressure'],styles:['Corps-à-corps','Équilibré'],skill:'Combat',stat:'Force',base:4,risk:2,tags:['close','pressure'],requires:{skill:18}},
    {id:'counter',name:'Contre précis',phases:['opening','pressure'],styles:['Mobile / esquive','Équilibré'],skill:'Combat',stat:'Réflexes',base:5,risk:1,tags:['counter','mobile'],requires:{stat:22}},
    {id:'endure',name:'Garde d’endurance',phases:['pressure','finish'],styles:['Corps-à-corps','Équilibré'],skill:'Combat',stat:'Résistance',base:3,risk:-1,tags:['guard'],requires:{stat:20}},
    {id:'draw_slash',name:'Coupe éclair',phases:['opening'],styles:['Sabreur'],skill:'Sabre',stat:'Vitesse',base:7,risk:1,tags:['blade','burst'],requires:{skill:22}},
    {id:'sword_pressure',name:'Pression au sabre',phases:['pressure','finish'],styles:['Sabreur'],skill:'Sabre',stat:'Force',base:6,risk:2,tags:['blade','pressure'],requires:{skill:30}},
    {id:'precision_shot',name:'Tir de précision',phases:['opening','pressure'],styles:['Tireur'],skill:'Tir',stat:'Réflexes',base:7,risk:0,tags:['ranged','precision'],requires:{skill:22}},
    {id:'mobile_volley',name:'Tir mobile',phases:['pressure','finish'],styles:['Tireur','Mobile / esquive'],skill:'Tir',stat:'Agilité',base:5,risk:1,tags:['ranged','mobile'],requires:{skill:28,stat:24}},
    {id:'observation_read',name:'Lecture par Observation',phases:['opening','pressure'],styles:['Équilibré','Mobile / esquive','Sabreur','Tireur','Corps-à-corps'],skill:'Combat',stat:'Réflexes',base:5,risk:-1,tags:['haki','observation','counter'],requires:{haki:'Observation',mastery:18}},
    {id:'armament_coat',name:'Renforcement par Armement',phases:['pressure','finish'],styles:['Équilibré','Corps-à-corps','Sabreur'],skill:'Combat',stat:'Force',base:7,risk:1,tags:['haki','armament','contact'],requires:{haki:'Armement',mastery:20}},
    {id:'conqueror_pressure',name:'Pression du Conquérant',phases:['opening','pressure'],styles:['Équilibré','Corps-à-corps','Sabreur'],skill:'Combat',stat:'Volonté',base:8,risk:1,tags:['haki','conqueror','pressure'],requires:{haki:'Conquérant',mastery:28}},
    {id:'paramecia_control',name:'Application du Paramecia',phases:['opening','pressure','finish'],styles:['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],skill:'Combat',stat:'Volonté',base:6,risk:1,tags:['fruit','paramecia','control'],requires:{fruit:'Paramecia',mastery:18}},
    {id:'zoan_assault',name:'Assaut Zoan',phases:['pressure','finish'],styles:['Corps-à-corps','Équilibré'],skill:'Combat',stat:'Endurance',base:8,risk:2,tags:['fruit','zoan','close'],requires:{fruit:'Zoan',mastery:18}},
    {id:'logia_shift',name:'Déphasage Logia',phases:['opening','pressure'],styles:['Équilibré','Mobile / esquive'],skill:'Combat',stat:'Réflexes',base:9,risk:0,tags:['fruit','logia','evasion'],requires:{fruit:'Logia',mastery:18}},
    {id:'fruit_mastery',name:'Technique de maîtrise du Fruit',phases:['pressure','finish'],styles:['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],skill:'Combat',stat:'Volonté',base:10,risk:2,tags:['fruit','mastery'],requires:{fruitAny:true,mastery:55}},
    {id:'awakening_push',name:'Poussée d’éveil',phases:['finish'],styles:['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],skill:'Combat',stat:'Volonté',base:15,risk:4,tags:['fruit','awakening','finisher'],requires:{fruitAny:true,mastery:82}}
  ];
  const styleMatchups={
    'Corps-à-corps':{'Tireur':3,'Sabreur':-2,'Mobile / esquive':-4,'Corps-à-corps':0,'Équilibré':1},
    'Sabreur':{'Corps-à-corps':3,'Tireur':-1,'Mobile / esquive':-2,'Sabreur':0,'Équilibré':1},
    'Tireur':{'Corps-à-corps':-3,'Sabreur':2,'Mobile / esquive':1,'Tireur':0,'Équilibré':0},
    'Mobile / esquive':{'Corps-à-corps':4,'Sabreur':2,'Tireur':-1,'Mobile / esquive':0,'Équilibré':1},
    'Équilibré':{'Corps-à-corps':0,'Sabreur':0,'Tireur':0,'Mobile / esquive':0,'Équilibré':0}
  };
  const doctrines={
    balanced:{label:'Équilibrée',attack:0,guard:0,risk:0},
    aggressive:{label:'Agressive',attack:4,guard:-2,risk:2},
    defensive:{label:'Prudente',attack:-1,guard:4,risk:-2},
    precision:{label:'Précision',attack:2,guard:1,risk:-1},
    overwhelm:{label:'Domination',attack:5,guard:-3,risk:3}
  };
  registry.register('combatTechniquesV72',{version:'7.2.0',techniques,styleMatchups,doctrines});
})(window);
