(function(global){
  'use strict';
  const entries=new Map();
  const api={
    version:'1.0.0',
    register(name,module){
      if(!name||typeof name!=='string')throw new Error('Module name required');
      if(!module||typeof module!=='object')throw new Error('Module object required for '+name);
      entries.set(name,Object.freeze(module));
      return entries.get(name);
    },
    get(name){return entries.get(name)||null},
    has(name){return entries.has(name)},
    list(){return [...entries.entries()].map(([name,module])=>({name,version:module.version||'0.0.0'}))}
  };
  global.OPL_MODULES=api;
})(window);
