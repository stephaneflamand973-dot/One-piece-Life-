(function(g){'use strict';const r=g.OPL_MODULES;if(!r)throw Error('Registry unavailable');
const kinds={
 alliance:{label:'Coopération ciblée',description:'Monter une opération commune avec un contact fiable.',cost:180,energy:9,baseReward:1750,skill:'Commandement',trust:4,rivalry:-3,healthRisk:.25},
 diplomacy:{label:'Mission de médiation',description:'Négocier un accord ou apaiser une tension locale.',cost:100,energy:7,baseReward:950,skill:'Commandement',trust:8,rivalry:-7,healthRisk:.12},
 challenge:{label:'Règlement de comptes',description:'Affronter un rival dangereux et imposer ton autorité.',cost:80,energy:12,baseReward:2200,skill:'Combat',trust:-2,rivalry:9,healthRisk:1}
};
r.register('contractDataV109',{version:'10.9.0',kinds});
})(window);