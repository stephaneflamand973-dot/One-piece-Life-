(function(global){
'use strict';
const reg=global.OPL_MODULES;if(!reg)throw Error('OPL registry missing');
const assets={
 workshop:{label:'Atelier maritime',cost:16000,upkeep:650,revenue:3200,risk:.12,desc:'Réparations, contrats et maintenance des navires.',perk:'Revenus d’activité et savoir-faire du port'},
 shop:{label:'Commerce insulaire',cost:22000,upkeep:850,revenue:4200,risk:.16,desc:'Boutique indépendante et clientèle locale.',perk:'Bonus plafonné sur la rémunération du travail'},
 network:{label:'Réseau de contacts',cost:27500,upkeep:1050,revenue:4450,risk:.19,desc:'Informations, intermédiaires et opportunités.',perk:'Bonus plafonné sur la préparation des missions'},
 transport:{label:'Service de transport',cost:35000,upkeep:1400,revenue:5600,risk:.24,desc:'Livraisons et fret entre les ports.',perk:'Capacité de chargement supplémentaire'}
};
const actions={invest:'Investir ou améliorer',operate:'Exploiter un actif',divest:'Céder un actif'};
reg.register('economyDataV105',{version:'10.5.0',assets,actions,maxTier:3});
})(window);
