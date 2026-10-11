(function(g){'use strict';const r=g.OPL_MODULES;
const encounters={
 Marine:{label:'Patrouille de la Marine',actor:'Un officier de la Marine',text:'Une patrouille surveille un échange inhabituel. Ton groupe attire son attention.'},
 Pirates:{label:'Équipage pirate',actor:'Un capitaine rival',text:'Des pirates suivent la même piste que toi et convoitent ce qui se cache sur cette île.'},
 Révolutionnaires:{label:'Réseau clandestin',actor:'Une agente révolutionnaire',text:'Des messages codés circulent. Une opération secrète semble se préparer.'},
 Gouvernement:{label:'Opération gouvernementale',actor:'Un agent gouvernemental',text:'Une cargaison secrète vient de débarquer sous forte surveillance.'},
 Civil:{label:'Rencontre insulaire',actor:'Une voyageuse locale',text:'Une piste mène vers une découverte convoitée par plusieurs habitants.'}};
const stages=[
{title:'Premiers indices',choices:{
 observe:{label:'Observer discrètement',skill:'Navigation',bonus:.14,risk:.5,relation:0,power:0},
 talk:{label:'Engager la conversation',skill:'Commandement',bonus:.07,risk:.75,relation:2,power:0},
 sneak:{label:'Infiltrer le secteur',skill:'Discrétion',bonus:.02,risk:1.15,relation:-1,power:0},
 attack:{label:'Intervenir par la force',skill:'Combat',bonus:-.16,risk:1.7,relation:-3,power:2},
 withdraw:{label:'Faire demi-tour',retreat:true}}},
{title:'Le face-à-face',choices:{
 bargain:{label:'Négocier un passage',skill:'Commandement',bonus:.04,risk:.85,relation:2,power:0},
 help:{label:'Prêter assistance',skill:'Médecine',bonus:.09,risk:.8,relation:4,power:0},
 search:{label:'Fouiller les lieux',skill:'Discrétion',bonus:-.035,risk:1.25,relation:0,power:1},
 fight:{label:'Affronter les adversaires',skill:'Combat',bonus:-.13,risk:1.8,relation:-4,power:3},
 withdraw:{label:'Se replier',retreat:true}}},
{title:'Le choix décisif',choices:{
 secure:{label:'Récupérer le butin',skill:'Discrétion',bonus:-.07,risk:1.35,relation:-1,power:1},
 share:{label:'Partager avec les habitants',skill:'Commandement',bonus:.09,risk:.70,relation:5,power:0},
 map:{label:'Cartographier la découverte',skill:'Navigation',bonus:.13,risk:.75,relation:1,power:0},
 withdraw:{label:'Quitter le secteur',retreat:true}}}];
r.register('encounterDataV107',{version:'10.7.0',encounters,stages});
})(window);