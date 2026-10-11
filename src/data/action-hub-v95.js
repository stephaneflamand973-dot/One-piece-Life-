(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
registry.register('actionHubDataV95',{
 version:'9.5.0',maxFavorites:10,maxRecent:12,maxActions:150,
 categories:[
  {id:'all',label:'Tout',icon:'✦'},
  {id:'career',label:'Carrière',icon:'⚓'},
  {id:'training',label:'Combat',icon:'⚔'},
  {id:'relations',label:'Relations',icon:'♟'},
  {id:'exploration',label:'Voyage',icon:'◈'},
  {id:'economy',label:'Berry',icon:'◉'},
  {id:'life',label:'Quotidien',icon:'⌂'},
  {id:'favorites',label:'Favoris',icon:'★'}
 ]
});
})(window);
