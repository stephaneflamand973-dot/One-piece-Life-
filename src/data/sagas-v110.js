(function(g){'use strict';const r=g.OPL_MODULES;if(!r)throw Error('Module registry absent');
const themes={
 alliance:{label:'Alliance décisive',desc:'Transforme une coopération fragile en influence durable.',chapters:['Gagner la confiance','Coordonner les alliés','Sceller le pacte'],reward:4100,rep:5},
 intrigue:{label:'Opération clandestine',desc:'Découvre les intérêts cachés derrière une opération de faction.',chapters:['Identifier la piste','Percer le réseau','Révéler les enjeux'],reward:4700,rep:4},
 rivalry:{label:'Saga de rivalité',desc:'La tension accumulée avec ce personnage exige une résolution.',chapters:['Remonter la trace','Déjouer la riposte','Régler le différend'],reward:5200,rep:6}
};
const tactics={
 negotiate:{label:'Négocier un accord',skill:'Commandement',bonus:.09,risk:.50,trust:4,rivalry:-3,detail:'Privilégier la confiance et les garanties'},
 infiltrate:{label:'Avancer discrètement',skill:'Discrétion',bonus:.05,risk:.75,trust:1,rivalry:0,detail:'Chercher des preuves avant de se dévoiler'},
 confront:{label:'Imposer sa volonté',skill:'Combat',bonus:-.08,risk:1.60,trust:-2,rivalry:5,detail:'Prendre davantage de risques pour forcer l’issue'},
 withdraw:{label:'Se replier et préparer la suite',retreat:true,detail:'Reporter ce chapitre : l’action annuelle est consommée'}
};
r.register('sagaDataV110',{version:'11.0.0',themes,tactics});
})(window);