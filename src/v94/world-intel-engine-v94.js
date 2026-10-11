(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('worldIntelDataV94');if(!data)throw new Error('World intelligence data V9.4 missing');
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const text=v=>String(v==null?'':v).slice(0,240);
const unique=(arr,max)=>[...new Set((Array.isArray(arr)?arr:[]).filter(x=>typeof x==='string'&&x.length>0&&x.length<180))].slice(0,max);
function normalizeState(s={}){
  return {version:1,tracked:unique(s.tracked,data.maxTracked),read:unique(s.read,data.maxRead),
    history:(Array.isArray(s.history)?s.history:[]).filter(x=>x&&typeof x==='object').slice(0,data.maxHistory).map(x=>({id:text(x.id),action:x.action==='follow'?'follow':'unfollow',month:clamp(x.month,0,10000)}))};
}
function make(id,kind,title,description,region,priority,confidence,actionable,extra={}){
  return {id:text(id),kind,title:text(title),description:text(description),region:text(region),priority:clamp(priority,0,100),
    confidence:clamp(confidence,0,100),actionable:!!actionable,...extra};
}
function collect(world={},player={},month=0){
  const here=text(player.region),now=clamp(month,0,10000),power=clamp(player.power,0,100),map=new Map();
  const push=s=>{if(s.id&&s.title&&!map.has(s.id))map.set(s.id,s)};
  for(const h of (Array.isArray(world.worldHooks)?world.worldHooks:[])){
    if(!h||h.status!=='open'||!(Number(h.expiresAt)>now))continue;
    const region=text(h.region),local=region===here,remaining=Math.max(0,Number(h.expiresAt)-now),difficulty=clamp(h.difficulty,0,100);
    const score=clamp(36+clamp(h.urgency,0,100)*.34+(local?20:0)+(remaining<=4?12:0)+(difficulty>power+20?7:0),0,100);
    push(make('hook:'+text(h.id),'hook',h.title,h.desc,region,score,100,true,{hookId:text(h.id),remaining,difficulty,local}));
  }
  for(const r of (Array.isArray(world.rumors)?world.rumors:[])){
    if(!r||!['unverified','confirmed'].includes(r.status))continue;
    const region=text(r.region),confidence=r.status==='confirmed'?100:clamp(r.confidence,0,99),local=region===here;
    push(make('rumor:'+text(r.id||r.title),'rumor',r.title,r.text,region,20+(local?20:0)+confidence*.30+(r.status==='confirmed'?12:0),confidence,false,{verified:r.status==='confirmed',local}));
  }
  for(const e of (Array.isArray(world.autonomousHistory)?world.autonomousHistory:[]).filter(x=>x&&x.known===true).slice(0,24)){
    const region=text(e.region),local=region===here;
    push(make('event:'+text(e.id||e.title),'event',e.title,e.desc,region,28+(local?20:0)+clamp(e.importance,0,100)*.3,100,false,{local}));
  }
  const regional=world.regionalPressures&&world.regionalPressures[here];
  if(regional&&typeof regional==='object'){
    const instability=clamp(regional.Instabilité,0,100),piracy=clamp(regional.Piraterie,0,100);
    if(instability>=65||piracy>=75){
      push(make('pressure:'+here,'pressure','Tensions dans '+here,
        'Instabilité '+Math.round(instability)+'/100 • piraterie '+Math.round(piracy)+'/100. Ces pressions influencent les risques locaux.',
        here,clamp(25+Math.max(instability,piracy)*.58,0,100),100,false,{local:true}));
    }
  }
  return [...map.values()].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,data.maxSignals);
}
function overview(signals=[],state={},region=''){
  const s=normalizeState(state),ids=new Set(signals.map(x=>x.id));
  return {available:signals.length,local:signals.filter(x=>x.region===region).length,
    actionable:signals.filter(x=>x.actionable).length,unread:signals.filter(x=>!s.read.includes(x.id)).length,
    tracked:s.tracked.length,expired:s.tracked.filter(id=>!ids.has(id)).length};
}
function visible(signals=[],state={},filter='priority'){
  const s=normalizeState(state);
  if(filter==='local')return signals.filter(x=>x.local);
  if(filter==='tracked')return signals.filter(x=>s.tracked.includes(x.id));
  if(filter==='unread')return signals.filter(x=>!s.read.includes(x.id));
  return signals;
}
function follow(state={},id='',month=0){
  const s=normalizeState(state),key=text(id);
  if(!key)return {state:s,changed:false,following:false};
  const following=!s.tracked.includes(key);
  if(following&&s.tracked.length>=data.maxTracked)return {state:s,changed:false,following:false,full:true};
  s.tracked=following?[key,...s.tracked]:s.tracked.filter(x=>x!==key);
  s.history.unshift({id:key,action:following?'follow':'unfollow',month:clamp(month,0,10000)});
  s.history=s.history.slice(0,data.maxHistory);
  return {state:s,changed:true,following};
}
function markRead(state={},ids=[]){
  const s=normalizeState(state);
  s.read=unique([...ids.filter(x=>typeof x==='string'),...s.read],data.maxRead);
  return s;
}
registry.register('worldIntelEngineV94',{version:'9.4.0',normalizeState,collect,overview,visible,follow,markRead});
})(window);
