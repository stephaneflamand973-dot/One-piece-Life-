(function(global){
'use strict';
const r=global.OPL_MODULES;if(!r)throw Error('OPL registry missing');
const approaches={
 balanced:{label:'Équilibrée',description:'Préparation et prise de risque raisonnables.',success:0,risk:1,discovery:1},
 cautious:{label:'Prudente',description:'Moins de blessures, découverte un peu plus lente.',success:.07,risk:.62,discovery:.88},
 daring:{label:'Audacieuse',description:'Fouille ambitieuse, plus de danger et d’échecs.',success:-.045,risk:1.6,discovery:1.18}
};
const actions={
 expedition_prepare:{label:'Préparer une expédition',description:'Investir dans les vivres, cartes et matériel avant de partir.',money:400},
 expedition_scout:{label:'Explorer l’île',description:'Une reconnaissance active avec chance de découverte et risque réel.',money:0},
 expedition_coordinate:{label:'Préparer la mission',description:'Élaborer un plan pour la mission actuellement acceptée.',money:300},
 expedition_command:{label:'Mobiliser l’équipage',description:'Renforcer la coordination des membres pour les prochaines actions.',money:250}
};
r.register('adventureDataV106',{version:'10.6.0',approaches,actions});
})(window);
