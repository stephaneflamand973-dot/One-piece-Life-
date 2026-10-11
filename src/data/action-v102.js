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
  navigation:{label:'Effectuer la traversée',limit:4,cost:8,yields:[1,1,1,1],requires:['travel']}
};
const trainingFocus={
  physical:{label:'Condition physique',activity:'physical'},
  combat:{label:'Combat et technique',activity:'combat'},
  haki:{label:'Haki et maîtrise',activity:'intense'},
  discipline:{label:'Discipline et étude',activity:'study'}
};
r.register('actionDataV102',{version:'10.2.0',actions,trainingFocus});
})(window);
