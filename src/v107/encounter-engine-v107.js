(function(g){'use strict';
const r=g.OPL_MODULES,d=r?.get('encounterDataV107');if(!d)throw Error('Rencontres V10.7 absentes');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),num=(x,f=0)=>Number.isFinite(Number(x))?Number(x):f;
const int=(x,a=0,b=1e9)=>Math.floor(clamp(num(x),a,b)),factions=Object.keys(d.encounters);
function normalize(raw={}){
 const s=raw&&typeof raw==='object'?raw:{};
 const history=Array.isArray(s.history)?s.history.filter(e=>e&&typeof e==='object').slice(-30).map(e=>({
 id:String(e.id||'').slice(0,75),island:String(e.island||'').slice(0,100),faction:factions.includes(e.faction)?e.faction:'Civil',
 actor:String(e.actor||'').slice(0,110),year:int(e.year,0,9999),outcome:['success','failure','withdraw'].includes(e.outcome)?e.outcome:'failure',
 berry:int(e.berry,0,100000),injuries:int(e.injuries,0,100),choices:Array.isArray(e.choices)?e.choices.slice(0,3).map(x=>String(x).slice(0,32)):[]})):[];
 const contacts=Array.isArray(s.contacts)?s.contacts.filter(x=>x&&typeof x==='object').slice(-24).map(x=>({
 key:String(x.key||'').slice(0,110),name:String(x.name||'').slice(0,110),faction:factions.includes(x.faction)?x.faction:'Civil',
 trust:int(x.trust,0,100),rivalry:int(x.rivalry,0,100),lastYear:int(x.lastYear,0,9999)})):[];
 const a=s.active&&typeof s.active==='object'?s.active:null;
 const active=a&&int(a.stage,0,3)<3&&factions.includes(a.faction)&&String(a.id||'').length>0?{
 id:String(a.id).slice(0,75),year:int(a.year,0,9999),island:String(a.island||'').slice(0,100),region:String(a.region||'').slice(0,80),
 faction:a.faction,actor:String(a.actor||'').slice(0,110),actorId:String(a.actorId||'').slice(0,100),canon:!!a.canon,
 group:String(a.group||'').slice(0,110),stage:int(a.stage,0,2),danger:clamp(num(a.danger,40),0,100),
 preparation:clamp(num(a.preparation),0,80),approach:['balanced','cautious','daring'].includes(a.approach)?a.approach:'balanced',
 wins:int(a.wins,0,3),losses:int(a.losses,0,3),injuries:int(a.injuries,0,100),relation:clamp(num(a.relation),-30,30),
 hostility:int(a.hostility,0,10),choices:Array.isArray(a.choices)?a.choices.slice(0,2).filter(x=>typeof x==='string'&&x.length<32):[]}:null;
 return {version:1,total:int(s.total),won:int(s.won),withdrawn:int(s.withdrawn),wealth:int(s.wealth,0,1e12),active,history,contacts};
}
function choiceOdds(a,id,ctx={}){
 const def=d.stages[a?.stage]?.choices?.[id];if(!a||!def)return null;
 if(def.retreat)return {chance:1,injury:0,skill:'',label:def.label,retreat:true};
 const skill=clamp(num(ctx.skills?.[def.skill]),0,100),crew=clamp(num(ctx.crew),0,100);
 const ap=a.approach==='cautious'?.07:a.approach==='daring'?-.06:0;
 const chance=clamp(.58+def.bonus+skill*.0022+crew*.0007+a.preparation*.0006+(a.wins-a.losses)*.055+
  ap-a.danger*.0032-(a.faction==='Marine'&&ctx.playerFaction==='Pirates'?.055:0),.09,.94);
 const injury=clamp((.07+a.danger*.003)*def.risk*(a.approach==='cautious'?.6:a.approach==='daring'?1.35:1),0,.78);
 return {chance,injury,skill:def.skill,label:def.label,retreat:false};
}
function pickEncounter(ctx={},rolls={}){
 const danger=clamp(num(ctx.danger),0,100),rep=clamp(num(ctx.worldRep),0,100);
 const weights={Civil:Math.max(12,38-danger*.22),Pirates:16+danger*.22,Marine:16+danger*.12,
 Révolutionnaires:12+rep*.06,Gouvernement:10+danger*.08};
 if(ctx.playerFaction==='Pirates')weights.Marine+=8;if(ctx.playerFaction==='Marine')weights.Pirates+=10;
 const total=Object.values(weights).reduce((a,b)=>a+b,0);
 let target=clamp(num(rolls.faction,.5),0,.999999)*total,faction='Civil';
 for(const key of factions){target-=weights[key];if(target<0){faction=key;break}}
 const known=Array.isArray(ctx.actors)?ctx.actors.filter(x=>x&&typeof x==='object'&&x.faction===faction):[];
 const canon=known.filter(x=>x.canon),eligible=canon.length?canon:known;
 const pick=eligible.length?eligible[Math.floor(clamp(num(rolls.actor,.5),0,.999999)*eligible.length)]:null;
 return {faction,actor:String(pick?.name||d.encounters[faction].actor).slice(0,110),actorId:String(pick?.id||'').slice(0,100),
 canon:!!pick?.canon,group:String(pick?.group||d.encounters[faction].label).slice(0,110)};
}
function begin(raw,ctx={},rolls={}){
 const s=normalize(raw);if(s.active)return {ok:false,reason:'Une expédition est déjà en cours.',state:s};
 if(ctx.alive===false||ctx.pending||ctx.travel||num(ctx.age)<12)return {ok:false,reason:'Une expédition est actuellement impossible.',state:s};
 const e=pickEncounter(ctx,rolls);
 const active={id:'exp_'+int(ctx.year,0,9999)+'_'+(s.total+1),year:int(ctx.year,0,9999),
  island:String(ctx.island||'').slice(0,100),region:String(ctx.region||'').slice(0,80),...e,stage:0,
  danger:clamp(num(ctx.danger,40),0,100),preparation:clamp(num(ctx.preparation),0,80),
  approach:['balanced','cautious','daring'].includes(ctx.approach)?ctx.approach:'balanced',
  wins:0,losses:0,injuries:0,relation:0,hostility:0,choices:[]};
 return {ok:true,state:{...s,active},active};
}
function decision(raw,ctx={}){
 const a=normalize(raw).active;if(!a)return null;
 const stage=d.stages[a.stage],enc=d.encounters[a.faction];if(!stage||!enc)return null;
 const choices=Object.entries(stage.choices).map(([id,c])=>{
  const odds=choiceOdds(a,id,ctx);return {label:c.label,
   hint:c.retreat?'Quitter sans récompense supplémentaire':Math.round(odds.chance*100)+' % de réussite • '+Math.round(odds.injury*100)+' % de blessure si échec',
   action:'v107exp:'+a.id+':'+a.stage+':'+id};
 });
 return {id:'v107_'+a.id+'_'+a.stage,title:'Expédition '+(a.stage+1)+'/3 • '+stage.title,
  text:enc.text+' Rencontre : '+a.actor+' ('+a.group+'). '+(a.wins?'Réussites : '+a.wins+'. ':'')+
   (a.losses?'Échecs : '+a.losses+'. ':'')+'Ton choix influence les étapes suivantes.',choices};
}
function finish(s,a,outcome,ctx,step){
 const success=outcome==='success',retreat=outcome==='withdraw',price=clamp(num(ctx.priceIndex,1),.7,2.2);
 const berry=success?Math.round((250+a.danger*17+a.wins*390)*price*
  (a.approach==='daring'?1.28:a.approach==='cautious'?.72:1)*
  (a.choices.includes('secure')?1.4:a.choices.includes('share')?.45:1)):0;
 const reputation=success?(a.choices.includes('share')?6:a.choices.includes('talk')||a.choices.includes('help')?3:1):retreat?0:-1;
 const hostility=a.hostility+(a.choices.includes('attack')||a.choices.includes('fight')?3:0);
 const bounty=success&&a.faction==='Marine'&&hostility>=3&&ctx.playerFaction==='Pirates'?600+Math.round(a.danger*28):0;
 const skill=success?(a.choices.includes('map')?'Navigation':a.choices.includes('share')?'Commandement':'Discrétion'):'';
 const entry={id:a.id,island:a.island,faction:a.faction,actor:a.actor,year:a.year,outcome,berry,injuries:a.injuries,choices:a.choices};
 const key=a.faction+'|'+a.actor,old=s.contacts.find(x=>x.key===key),diff=success?a.relation:retreat?0:Math.min(-2,a.relation);
 const contact={key,name:a.actor,faction:a.faction,trust:clamp((old?.trust??50)+diff,0,100),
  rivalry:clamp((old?.rivalry??0)+hostility*2+(success?0:2),0,100),lastYear:a.year};
 const state={...s,active:null,total:s.total+1,won:s.won+(success?1:0),withdrawn:s.withdrawn+(retreat?1:0),
  wealth:s.wealth+berry,history:[...s.history,entry].slice(-30),
  contacts:[...s.contacts.filter(x=>x.key!==key),contact].slice(-24)};
 return {ok:true,finished:true,state,step,summary:{...entry,reputation,bounty,skill,skillGain:success?.8:0,
  explore:success,exploreBonus:success?a.wins*2+a.preparation*.04:0,contact}};
}
function resolve(raw,id,ctx={},rolls={}){
 const s=normalize(raw),a=s.active;if(!a)return {ok:false,reason:'Aucune expédition en cours.',state:s};
 if(String(ctx.island)!==a.island||int(ctx.year,0,9999)!==a.year)return {ok:false,reason:'Contexte modifié.',state:s};
 const def=d.stages[a.stage]?.choices?.[id],odds=choiceOdds(a,id,ctx);
 if(!def||!odds)return {ok:false,reason:'Choix invalide.',state:s};
 const next={...a,choices:[...a.choices,id]};
 if(def.retreat)return finish(s,next,'withdraw',ctx,{choice:id,success:false,healthLoss:0,chance:1});
 const success=clamp(num(rolls.outcome,.5),0,1)<odds.chance;
 const healthLoss=!success&&clamp(num(rolls.injury,1),0,1)<odds.injury?
  Math.max(1,Math.round((3+a.danger*.09)*def.risk)):0;
 next.wins+=success?1:0;next.losses+=success?0:1;next.injuries+=healthLoss;
 next.relation=clamp(next.relation+(success?def.relation:(def.relation<0?def.relation:0)),-30,30);
 next.hostility=clamp(next.hostility+(success?0:Math.max(0,def.power||0)),0,10);
 const step={choice:id,success,healthLoss,chance:odds.chance,skill:odds.skill,stage:a.stage};
 if(a.stage===2)return finish(s,next,next.wins>=2?'success':'failure',ctx,step);
 next.stage++;return {ok:true,finished:false,state:{...s,active:next},step};
}
r.register('encounterEngineV107',{version:'10.7.0',normalize,pickEncounter,begin,decision,choiceOdds,resolve});
})(window);