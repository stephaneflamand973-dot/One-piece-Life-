(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw Error('OPL registry missing');
const actions={
 time:{label:'Passer du temps',cost:4,money:0,delta:{affection:5,trust:3,familiarity:5},bond:3,grudge:-1,minAge:0},
 train:{label:'S’entraîner ensemble',cost:8,money:0,delta:{trust:2,respect:3,familiarity:2},bond:2,grudge:0,minAge:10},
 help:{label:'Apporter son aide',cost:3,money:1500,delta:{trust:6,loyalty:5,affection:3},bond:6,grudge:-2,minAge:12},
 confide:{label:'Se confier',cost:3,money:0,delta:{trust:5,affection:3,familiarity:3},bond:5,grudge:-1,minAge:12,minTrust:30,minFamiliarity:20},
 challenge:{label:'Confronter',cost:4,money:0,delta:{respect:3,rivalry:5,trust:-2},bond:-1,grudge:3,minAge:12,minFamiliarity:20},
 reconcile:{label:'Se réconcilier',cost:3,money:0,delta:{trust:4,affection:3,rivalry:-8},bond:5,grudge:-9,minAge:12,minRivalry:15},
 flirt:{label:'Flirter',cost:4,money:0,delta:{affection:6,familiarity:2,trust:1},bond:4,grudge:0,minAge:18,adult:true},
 date:{label:'Proposer un rendez-vous',cost:7,money:800,delta:{affection:9,trust:6,familiarity:4},bond:9,grudge:-1,minAge:18,adult:true,minTrust:35,minAffection:40,minFamiliarity:20},
 commit:{label:'Proposer une vie commune',cost:6,money:2200,delta:{trust:7,affection:7,loyalty:5},bond:10,grudge:-1,minAge:20,adult:true,minTrust:65,minAffection:65}
};
const limits={perRelation:3,global:12};
registry.register('socialDataV104',{version:'10.4.0',actions,limits});
})(window);
