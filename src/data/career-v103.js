(function(global){
'use strict';
const r=global.OPL_MODULES;if(!r)throw Error('OPL module registry missing');
const profiles={
 Marine:{label:'Marine',basePay:1480,rankPay:350,bonus:1.0,specialty:'Service, patrouille et opérations'},
 Pirates:{label:'Pirates',basePay:950,rankPay:410,bonus:1.18,specialty:'Butin, réputation et commandement'},
 'Chasseurs de primes':{label:'Chasseurs de primes',basePay:1150,rankPay:360,bonus:1.22,specialty:'Contrats et traques'},
 Révolutionnaires:{label:'Révolutionnaires',basePay:1090,rankPay:300,bonus:.9,specialty:'Opérations clandestines et réseau'},
 Gouvernement:{label:'Gouvernement Mondial',basePay:1650,rankPay:430,bonus:1.08,specialty:'Renseignement et administration'},
 Civil:{label:'Métiers civils',basePay:1250,rankPay:315,bonus:1,specialty:'Savoir-faire, commerce et services'}
};
const modes={
 steady:{label:'Travail régulier',description:'Rémunération et expérience équilibrées.',cost:12,pay:1,xp:1,performance:7,delta:{standing:1.4,trust:1.2,discipline:.8}},
 intensive:{label:'Travail intensif',description:'Plus de salaire et d’expérience, mais davantage de fatigue.',cost:18,pay:1.22,xp:1.5,performance:9,delta:{standing:2.1,trust:.6,discipline:1.5}},
 strategic:{label:'Travail stratégique',description:'Développe confiance et influence avec une rémunération moindre.',cost:14,pay:.86,xp:.92,performance:6,delta:{standing:1.2,trust:2.7,influence:2.2,discipline:.6}}
};
const actions={
 career_support:{label:'Aider ton équipe',description:'Renforce les liens au travail et ta fiabilité.',cost:8,limit:2,delta:{standing:1.6,trust:3.5,discipline:1.7},performance:5,xp:2},
 career_initiative:{label:'Prendre une initiative',description:'Renforce l’influence et le dossier professionnel.',cost:11,limit:2,delta:{standing:3.6,trust:.8,influence:3.2},performance:9,xp:5},
 career_bonus:{label:'Demander une prime',description:'Négocie une récompense sur la base de tes résultats.',cost:3,limit:1,delta:{standing:.4},performance:0,xp:0}
};
r.register('careerDataV103',{version:'10.3.0',profiles,modes,actions});
})(window);
