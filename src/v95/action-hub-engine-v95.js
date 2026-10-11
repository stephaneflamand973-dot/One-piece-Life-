(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('actionHubDataV95');if(!data)throw new Error('Action Hub V9.5 data missing');
const norm=v=>String(v==null?'':v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const validCategory=id=>data.categories.some(c=>c.id===id)?id:'all';
const list=(a,n)=>[...new Set((Array.isArray(a)?a:[]).filter(x=>typeof x==='string'&&x.length>0&&x.length<140))].slice(0,n);
function normalizeState(state={}){
 return {
  version:1,category:validCategory(state.category),
  favorites:list(state.favorites,data.maxFavorites),
  recent:list(state.recent,data.maxRecent),
  lastOpenYear:Number.isFinite(Number(state.lastOpenYear))?Number(state.lastOpenYear):-1,
  totalActions:Math.max(0,Math.floor(Number(state.totalActions)||0))
 };
}
function toggleFavorite(state,id){
 const s=normalizeState(state),key=String(id||'');if(!key)return {state:s,changed:false};
 if(s.favorites.includes(key)){s.favorites=s.favorites.filter(x=>x!==key);return {state:s,changed:true,starred:false}}
 if(s.favorites.length>=data.maxFavorites)return {state:s,changed:false,full:true,starred:false};
 s.favorites=[key,...s.favorites];return {state:s,changed:true,starred:true}
}
function recordAction(state,id){
 const s=normalizeState(state),key=String(id||'');if(!key)return s;
 s.recent=list([key,...s.recent],data.maxRecent);s.totalActions++;return s
}
function rank(action,state={}){
 const s=normalizeState(state);
 return (Number(action.score)||0)+(s.favorites.includes(action.id)?22:0)+(s.recent.includes(action.id)?7:0)+(action.urgent?25:0);
}
function select(actions=[],state={},query=''){
 const s=normalizeState(state),q=norm(query);
 return actions.filter(x=>x&&typeof x.id==='string'&&x.title&&x.category)
  .filter(x=>s.category==='all'||(s.category==='favorites'?s.favorites.includes(x.id):x.category===s.category))
  .filter(x=>!q||norm([x.title,x.detail,x.category,x.tags||''].join(' ')).includes(q))
  .sort((a,b)=>(b.available?1:0)-(a.available?1:0)||rank(b,s)-rank(a,s)||a.title.localeCompare(b.title))
  .slice(0,data.maxActions);
}
function featured(actions=[],state={},count=3){
 return actions.filter(x=>x.available&&!x.hideFromFeatured)
  .sort((a,b)=>rank(b,state)-rank(a,state)||a.title.localeCompare(b.title)).slice(0,count)
}
function summary(actions=[]){
 return {total:actions.length,available:actions.filter(x=>x.available).length,
  locked:actions.filter(x=>!x.available).length,urgent:actions.filter(x=>x.available&&x.urgent).length}
}
registry.register('actionHubEngineV95',{version:'9.5.0',normalizeState,toggleFavorite,recordAction,rank,select,featured,summary,normalizeSearch:norm});
})(window);
