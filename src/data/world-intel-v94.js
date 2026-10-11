(function(global){
'use strict';
const r=global.OPL_MODULES;if(!r)throw new Error('Module registry missing');
r.register('worldIntelDataV94',{
  version:'9.4.0',
  maxTracked:24,maxRead:90,maxHistory:35,maxSignals:45,
  labels:{hook:'Opportunité',rumor:'Rumeur',event:'Événement confirmé',pressure:'Pression régionale'},
  kinds:['hook','rumor','event','pressure']
});
})(window);
