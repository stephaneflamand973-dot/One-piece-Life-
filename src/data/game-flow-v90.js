(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

const presets={
  balanced:{label:'Équilibré',desc:'Avancer partout sans surcharger l’année.',plan:{career:'steady',training:'steady',relations:'steady',adventure:'steady',resources:'steady',mission:'standard'}},
  progression:{label:'Progression',desc:'Développement personnel fort, avec moins d’exposition inutile.',plan:{career:'hard',training:'hard',relations:'steady',adventure:'cautious',resources:'invest',mission:'standard'}},
  career:{label:'Carrière',desc:'Monter en responsabilité et développer son réseau.',plan:{career:'initiative',training:'mastery',relations:'network',adventure:'cautious',resources:'steady',mission:'standard'}},
  adventure:{label:'Aventure',desc:'Voyager, explorer et accepter davantage d’imprévu.',plan:{career:'light',training:'steady',relations:'network',adventure:'explore',resources:'save',mission:'standard'}},
  wealth:{label:'Fortune',desc:'Favoriser revenus et stabilité matérielle.',plan:{career:'hard',training:'steady',relations:'steady',adventure:'cautious',resources:'extra',mission:'standard'}},
  recovery:{label:'Récupération',desc:'Réduire la charge et restaurer les réserves.',plan:{career:'light',training:'recover',relations:'invest',adventure:'cautious',resources:'save',mission:'cautious'}}
};

const priorityTypes={
  decision:{label:'Décision',tab:'life',severity:'critical'},
  survival:{label:'Survie',tab:'life',severity:'critical'},
  mission:{label:'Mission',tab:'character',severity:'high'},
  travel:{label:'Voyage',tab:'world',severity:'high'},
  year:{label:'Année',tab:'life',severity:'normal'},
  consequence:{label:'Conséquence',tab:'life',severity:'high'},
  campaign:{label:'Saga',tab:'world',severity:'normal'},
  nemesis:{label:'Némésis',tab:'world',severity:'normal'},
  equipment:{label:'Équipement',tab:'character',severity:'normal'},
  resources:{label:'Ressources',tab:'character',severity:'normal'},
  world:{label:'Monde',tab:'world',severity:'low'}
};

registry.register('gameFlowDataV90',{version:'9.0.0',presets,priorityTypes});
})(window);
