(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

const bondTiers=[
  {id:'fractured',label:'Lien fracturé',min:-999,max:24},
  {id:'fragile',label:'Lien fragile',min:25,max:44},
  {id:'stable',label:'Lien stable',min:45,max:59},
  {id:'trusted',label:'Lien de confiance',min:60,max:73},
  {id:'bonded',label:'Lien profond',min:74,max:86},
  {id:'oathbound',label:'Lien indéfectible',min:87,max:999}
];

const eventBeats={
  promotion:{label:'Une promotion qui compte',text:'La trajectoire de cette personne vient de franchir un cap. Ce que tu fais maintenant peut devenir un souvenir durable.',choices:['celebrate','ask_favor','stay_distant'],priority:64},
  move:{label:'La distance s’installe',text:'Cette personne change de région. Votre lien survivra-t-il à la distance ou deviendra-t-il un souvenir parmi d’autres ?',choices:['keep_contact','let_drift'],priority:58},
  setback:{label:'Un proche traverse un revers',text:'Cette personne traverse une période difficile. Tu peux te rendre présent, prendre tes distances ou exploiter sa faiblesse.',choices:['support','give_space','exploit'],priority:74},
  career:{label:'Une nouvelle voie',text:'Cette personne change de trajectoire. Tu peux soutenir ce choix, le contester ou rester en retrait.',choices:['encourage','challenge','stay_distant'],priority:62},
  career_change:{label:'Une nouvelle voie',text:'Cette personne change de trajectoire. Tu peux soutenir ce choix, le contester ou rester en retrait.',choices:['encourage','challenge','stay_distant'],priority:68},
  objective:{label:'Un objectif accompli',text:'Une personne importante pour toi atteint quelque chose qu’elle poursuivait depuis longtemps.',choices:['celebrate','ask_favor','stay_distant'],priority:55},
  retirement:{label:'La fin d’un chapitre',text:'Cette personne quitte progressivement la vie active. Ce moment peut refermer une époque ou resserrer votre lien.',choices:['honor','keep_contact','stay_distant'],priority:68},
  phase:{label:'Une trajectoire change',text:'Cette personne prend une nouvelle dimension dans le monde. Votre relation doit maintenant s’adapter à ce qu’elle devient.',choices:['celebrate','challenge','stay_distant'],priority:52}
};

const choices={
  celebrate:{label:'Célébrer avec elle',hint:'Renforce affection, respect et mémoire commune.',delta:{trust:3,affection:5,respect:4,familiarity:2},bond:8,npcOwes:0,playerOwes:0,grudge:-2,energy:-2,memory:'Tu as célébré une étape importante à ses côtés.',valence:6},
  support:{label:'Être présent concrètement',hint:'Coûte un peu d’énergie, mais crée une dette positive et beaucoup de confiance.',delta:{trust:8,affection:5,loyalty:5,familiarity:3},bond:11,npcOwes:1,playerOwes:0,grudge:-5,energy:-4,memory:'Tu as répondu présent lorsqu’elle traversait une période difficile.',valence:8},
  give_space:{label:'Lui laisser de l’espace',hint:'Peu de changement. Le lien reste ouvert sans pression.',delta:{trust:1,affection:0,familiarity:1},bond:1,npcOwes:0,playerOwes:0,grudge:-1,energy:0,memory:'Tu lui as laissé de l’espace sans couper le lien.',valence:1},
  exploit:{label:'Profiter de sa faiblesse',hint:'Peut créer un avantage, mais détruit la confiance et nourrit une rancune durable.',delta:{trust:-10,affection:-6,respect:-4,rivalry:9},bond:-12,npcOwes:0,playerOwes:-1,grudge:14,energy:0,memory:'Tu as profité de son moment de faiblesse.',valence:-9},
  keep_contact:{label:'Entretenir le lien malgré la distance',hint:'Préserve confiance et familiarité.',delta:{trust:4,affection:2,familiarity:4,loyalty:2},bond:6,npcOwes:0,playerOwes:0,grudge:-2,energy:-2,memory:'Vous avez choisi de maintenir le lien malgré la distance.',valence:5},
  let_drift:{label:'Laisser la distance faire son œuvre',hint:'Le lien se refroidit lentement.',delta:{trust:-2,affection:-3,familiarity:-2},bond:-5,npcOwes:0,playerOwes:0,grudge:1,energy:0,memory:'Tu as laissé la distance affaiblir votre relation.',valence:-3},
  encourage:{label:'Soutenir sa nouvelle voie',hint:'Renforce respect et loyauté.',delta:{trust:4,affection:2,respect:6,loyalty:3},bond:7,npcOwes:0,playerOwes:0,grudge:-2,energy:-1,memory:'Tu as soutenu sa nouvelle trajectoire.',valence:5},
  challenge:{label:'Remettre son choix en question',hint:'Peut nourrir le respect ou la rivalité.',delta:{trust:-1,respect:5,rivalry:5},bond:1,npcOwes:0,playerOwes:0,grudge:4,energy:-2,memory:'Tu as frontalement remis son choix en question.',valence:-1},
  ask_favor:{label:'Lui demander de te rendre un service',hint:'Utilise une dette si elle t’en doit une. Sinon, la demande peut être mal reçue.',delta:{trust:-1,respect:-1},bond:-1,npcOwes:-1,playerOwes:0,grudge:1,energy:0,memory:'Tu as profité de ce moment pour demander un service.',valence:-1,needsDebt:true},
  stay_distant:{label:'Rester en retrait',hint:'Aucun coût immédiat, mais le lien perd un peu de chaleur.',delta:{affection:-2,familiarity:-1},bond:-2,npcOwes:0,playerOwes:0,grudge:0,energy:0,memory:'Tu es resté en retrait pendant un moment important.',valence:-1},
  honor:{label:'Honorer son parcours',hint:'Un geste fort pour une relation de longue durée.',delta:{trust:5,affection:5,respect:8,loyalty:4},bond:10,npcOwes:0,playerOwes:0,grudge:-4,energy:-2,memory:'Tu as pris le temps d’honorer tout ce qu’elle a accompli.',valence:8},
  forgive:{label:'Laisser le passé derrière vous',hint:'Réduit fortement la rancune et la rivalité.',delta:{trust:5,affection:2,rivalry:-8},bond:6,npcOwes:0,playerOwes:0,grudge:-14,energy:0,memory:'Vous avez décidé de laisser une partie du passé derrière vous.',valence:6},
  sever:{label:'Rompre définitivement le lien',hint:'Ferme la relation mais peut figer une rivalité durable.',delta:{trust:-15,affection:-12,rivalry:8,status:'distant'},bond:-18,npcOwes:0,playerOwes:0,grudge:18,energy:0,memory:'Tu as choisi de rompre le lien.',valence:-10}
};

const interactionEffects={
  time:{bond:3,grudge:-1},
  train:{bond:2,grudge:0},
  help:{bond:6,npcOwes:1,grudge:-2},
  confide:{bond:5,grudge:-1},
  challenge:{bond:0,grudge:2},
  mentor:{bond:5,grudge:-1}
};

registry.register('relationshipsDataV93',{version:'9.3.0',bondTiers,eventBeats,choices,interactionEffects});
})(window);
