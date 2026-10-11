(function(global){
'use strict';
const r=global.OPL_MODULES;
if(!r)throw new Error('OPL registry unavailable');
const actions={
  work:{label:'Travailler',limit:4,cost:12,yields:[1,.78,.58,.42],requires:['career','land']},
  training:{label:'S’entraîner',limit:5,cost:12,yields:[1,.82,.65,.50,.38],requires:['land']},
  mission:{label:'Accomplir la mission',limit:3,cost:0,yields:[1,1,1],requires:['mission']},
  promotion:{label:'Demander une promotion',limit:1,cost:3,yields:[1],requires:['career','promotion']},
  rest:{label:'Se reposer',limit:4,cost:0,yields:[1,.86,.70,.60],requires:['recovery']},
  navigation:{label:'Effectuer la traversée',limit:4,cost:8,yields:[1,1,1,1],requires:['travel']},
  career_support:{label:'Aider ton équipe',limit:2,cost:8,yields:[1,.85],requires:['career','land']},
  career_initiative:{label:'Prendre une initiative',limit:2,cost:11,yields:[1,.8],requires:['career','land']},
  career_bonus:{label:'Demander une prime',limit:1,cost:3,yields:[1],requires:['career','land']},
  invest:{label:'Acheter / développer un actif',limit:2,cost:6,yields:[1,1],requires:['land']},
  operate:{label:'Exploiter un actif',limit:4,cost:10,yields:[1,1,1,1],requires:['land']},
  divest:{label:'Revendre un actif',limit:2,cost:3,yields:[1,1],requires:['land']}
};
const trainingFocus={
  physical:{label:'Condition physique',activity:'physical'},
  combat:{label:'Combat et technique',activity:'combat'},
  haki:{label:'Haki et maîtrise',activity:'intense'},
  discipline:{label:'Discipline et étude',activity:'study'}
};
r.register('actionDataV102',{version:'10.2.0',actions,trainingFocus});
})(window);
