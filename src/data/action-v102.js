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
  economy_buy:{label:'Acheter ou améliorer un actif',limit:2,cost:2,yields:[1,1],requires:['land']},
  economy_operate:{label:'Exploiter une entreprise',limit:3,cost:7,yields:[1,.82,.65],requires:['land']},
  expedition_prepare:{label:'Préparer une expédition',limit:2,cost:5,yields:[1,.72],requires:['land']},
  expedition_scout:{label:'Explorer l’île',limit:3,cost:10,yields:[1,.84,.65],requires:['land']},
  expedition_coordinate:{label:'Préparer une mission',limit:2,cost:6,yields:[1,.70],requires:['mission','land']},
  expedition_command:{label:'Mobiliser l’équipage',limit:2,cost:8,yields:[1,.70],requires:['land']},
  contact_contract:{label:'Accomplir un contrat',limit:2,cost:12,yields:[1,.80],requires:['land']}
};
const trainingFocus={
  physical:{label:'Condition physique',activity:'physical'},
  combat:{label:'Combat et technique',activity:'combat'},
  haki:{label:'Haki et maîtrise',activity:'intense'},
  discipline:{label:'Discipline et étude',activity:'study'}
};
r.register('actionDataV102',{version:'10.2.0',actions,trainingFocus});
})(window);
