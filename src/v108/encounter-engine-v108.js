(function(g){'use strict';const r=g.OPL_MODULES,d=r?.get('encounterDataV108');if(!d)throw Error('V10.8 missing data');
const bound=(x,a,b)=>Math.min(b,Math.max(a,x)),num=(x,f=0)=>Number.isFinite(Number(x))?Number(x):f;
const integer=(x,a=0,b=1e9)=>Math.floor(bound(num(x),a,b));
const safe=(s,n=100)=>String(s||'').slice(0,n);
function normalize(raw={}){
 const a=raw&&typeof raw==='object'?raw:{};
 const combat=a.combat&&typeof a.combat==='object'?a.combat:null;
 const talk=a.dialogue&&typeof a.dialogue==='object'?a.dialogue:null;
 const dialogue=talk?{id:safe(talk.id,75),tone:safe(talk.tone,32),trust:bound(num(talk.trust),-20,20),rivalry:bound(num(talk.rivalry),0,20),success:!!talk.success}:null;
 const duel=combat&&combat.id&&integer(combat.turn,0,5)<4?{
  id:safe(combat.id,75),stage:integer(combat.stage,0,2),turn:integer(combat.turn,0,3),hp:bound(num(combat.hp,40),0,100),
  maxHp:bound(num(combat.maxHp,40),1,100),guard:bound(num(combat.guard),0,20),
  momentum:bound(num(combat.momentum),-5,10),totalDamage:integer(combat.totalDamage,0,200),incoming:integer(combat.incoming,0,100)}:null;
 const memory=Array.isArray(a.memory)?a.memory.filter(x=>x&&typeof x==='object').slice(-24).map(x=>({
  key:safe(x.key,180),name:safe(x.name),faction:safe(x.faction,50),
  encounters:integer(x.encounters,0,999),lastYear:integer(x.lastYear,0,9999),
  lastOutcome:['success','failure','withdraw'].includes(x.lastOutcome)?x.lastOutcome:'failure',
  lastChoice:safe(x.lastChoice,32),tone:safe(x.tone,100),lastId:safe(x.lastId,75),
  trust:integer(x.trust,0,100),rivalry:integer(x.rivalry,0,100)
 })):[];
 const leads=Array.isArray(a.leads)?a.leads.filter(x=>x&&typeof x==='object').slice(-10).map(x=>({
  id:safe(x.id,80),region:safe(x.region,80),island:safe(x.island,100),
  faction:safe(x.faction,55),actor:safe(x.actor,110),title:safe(x.title,150),
  boost:bound(num(x.boost,18),0,30),used:!!x.used,year:integer(x.year,0,9999)
 })):[];
 return {version:1,combat:duel,dialogue,memory,leads,selected:safe(a.selected,80),
  dialogues:integer(a.dialogues),battles:integer(a.battles),victories:integer(a.victories)};
}
function decorate(raw,encounter,decision,ctx={}){
 const s=normalize(raw);
 if(s.combat&&s.combat.id===encounter?.id)return combatDecision(s,encounter,ctx);
 if(!decision||!encounter)return decision;
 const seen=s.memory.find(x=>x.key===encounter.faction+'|'+encounter.actor);
 const reintro=seen?' '+encounter.actor+' se souvient de votre dernier échange ('+
  (seen.lastOutcome==='success'?'réussi':seen.lastOutcome==='withdraw'?'interrompu':'difficile')+
  ', confiance '+seen.trust+'/100, rivalité '+seen.rivalry+'/100).':'';
 const choices=decision.choices.map(x=>{
  const base=x.action.split(':').at(-1);
  if(['talk','bargain','help'].includes(base))return {...x,
   label:'Dialoguer avec '+encounter.actor, hint:'Choisir une réplique adaptée à la faction et aux souvenirs',
   action:'v108talk:'+encounter.id+':'+encounter.stage+':'+base};
  if(['attack','fight'].includes(base))return {...x,
   label:'Engager un affrontement',hint:'Combat tactique : jusqu’à 4 tours, retraite possible',
   action:'v108fight:'+encounter.id+':'+encounter.stage+':'+base};
  return x
 });
 return {...decision,text:decision.text+reintro,choices};
}
function dialogueDecision(encounter,base,ctx={}){
 const choices=Object.entries(d.dialogue).map(([id,x])=>{
  const odds=dialogueOdds(encounter,id,ctx);
  return {label:x.label,hint:x.text[encounter.faction]+' • '+Math.round(odds.chance*100)+' % de convaincre',
    action:'v108say:'+encounter.id+':'+encounter.stage+':'+base+':'+id}
 });
 choices.push({label:'Revenir aux options',hint:'Aucune action ni énergie consommée',
  action:'v108back:'+encounter.id+':'+encounter.stage});
 return {id:'v108talk_'+encounter.id+'_'+encounter.stage,
  title:'Dialogue • '+encounter.actor,text:'Choisis les mots à utiliser. La faction et les souvenirs de votre relation influencent la réaction.',
  choices};
}
function dialogueOdds(encounter,id,ctx={}){
 const x=d.dialogue[id];if(!x)return null;
 const skill=bound(num(ctx.skills?.[x.skill]),0,100),trust=bound(num(ctx.contactTrust,50),0,100),
  rivalry=bound(num(ctx.contactRivalry),0,100);
 return {chance:bound(.53+x.modifier+skill*.0025+(trust-50)*.002-rivalry*.0016-
  bound(num(ctx.danger),0,100)*.0011,.1,.94)};
}
function resolveDialogue(raw,encounter,base,id,ctx={},roll=.5){
 const x=d.dialogue[id],odds=dialogueOdds(encounter,id,ctx);if(!x||!odds)return {ok:false};
 const success=bound(num(roll,.5),0,1)<odds.chance;
 const result={ok:true,success,boost:success?x.modifier+.10:-.11,trust:success?x.trust:-Math.max(2,Math.abs(x.trust)),
  rivalry:success?x.rivalry:x.rivalry+2,
  text:x.text[encounter.faction]||'Tu engages le dialogue.',base,
  tone:id};
 const s=normalize(raw);
 return {...result,state:{...s,dialogues:s.dialogues+1,dialogue:{id:encounter.id,tone:id,trust:result.trust,rivalry:result.rivalry,success}}};
}
function combatOdds(duel,id,ctx={}){
 const x=d.combat[id];if(!x)return null;if(x.retreat)return {chance:1};
 const skill=bound(num(ctx.skills?.[x.skill]),0,100),power=bound(num(ctx.power),0,200);
 return {chance:bound(x.accuracy+skill*.0012+power*.0005+duel.momentum*.018-
  bound(num(ctx.danger),0,100)*.0018,.20,.96)};
}
function startCombat(raw,encounter,ctx={}){
 const s=normalize(raw);if(s.combat||!encounter)return {ok:false,state:s};
 const maxHp=integer(bound(34+bound(num(ctx.danger),0,100)*.35-bound(num(ctx.power),0,200)*.10,28,72));
 const combat={id:encounter.id,stage:encounter.stage,turn:0,hp:maxHp,maxHp,guard:0,momentum:0,totalDamage:0,incoming:0};
 return {ok:true,state:{...s,combat},combat};
}
function combatDecision(raw,encounter,ctx={}){
 const s=normalize(raw),c=s.combat;if(!c||!encounter||c.id!==encounter.id)return null;
 const choices=Object.entries(d.combat).filter(([,x])=>x.retreat||num(ctx.energy,100)>=2).map(([id,x])=>{
  const chance=combatOdds(c,id,ctx).chance;
  return {label:x.label,hint:x.desc+(x.retreat?'':' • '+Math.round(chance*100)+' % de toucher'),
    action:'v108round:'+c.id+':'+c.stage+':'+c.turn+':'+id};
 });
 return {id:'v108combat_'+c.id+'_'+c.stage+'_'+c.turn,
  title:'Duel • Tour '+(c.turn+1)+'/4',
  text:encounter.actor+' • Endurance adverse '+Math.ceil(c.hp)+'/'+Math.ceil(c.maxHp)+
   ' • Garde '+Math.round(c.guard)+' • Ton énergie et ta santé sont engagées à chaque tour.',choices};
}
function combatTurn(raw,id,ctx={},rolls={}){
 const s=normalize(raw),c=s.combat,x=d.combat[id];if(!c||!x)return {ok:false,state:s};
 if(!x.retreat&&num(ctx.energy,100)<2)return {ok:false,state:s,reason:'Énergie insuffisante. Choisis de rompre le combat.'};
 if(x.retreat)return {ok:true,finished:true,outcome:'withdraw',healthLoss:0,energyLoss:0,damage:0,
  state:{...s,combat:null,battles:s.battles+1},turn:c.turn};
 const odds=combatOdds(c,id,ctx),hit=bound(num(rolls.hit,.5),0,1)<odds.chance;
 const rawDamage=hit?Math.max(1,Math.round(x.damage*(.75+bound(num(ctx.power),0,140)*.004)+
  (c.momentum>0?c.momentum*1.7:0))):0;
 const damage=integer(rawDamage,0,90),hp=Math.max(0,c.hp-damage);
 const enemyAttack=bound(num(rolls.enemy,.5),0,1)<bound(.69+bound(num(ctx.danger),0,100)*.001,0,.91);
 const incoming=enemyAttack?Math.max(0,Math.round((3+bound(num(ctx.danger),0,100)*.11)*x.risk-
  x.guard*.60-c.guard*.20)):0;
 const guard=x.guard;const momentum=bound(c.momentum+(hit&&id==='feint'?2:hit?1:-1),-5,10);
 const next={...c,turn:c.turn+1,hp,guard,momentum,totalDamage:c.totalDamage+damage,incoming:c.incoming+incoming};
 const victory=hp<=0,finished=victory||next.turn>=4;
 const state={...s,combat:finished?null:next,
  battles:s.battles+(finished?1:0),victories:s.victories+(victory?1:0)};
 return {ok:true,finished,outcome:victory?'victory':finished?'defeat':null,
  hit,damage,healthLoss:incoming,energyLoss:2,turn:next.turn,state,
  description:hit?'Attaque réussie':'Attaque esquivée'};
}
function selectLead(raw,id,ctx={}){
 const s=normalize(raw),lead=s.leads.find(x=>x.id===id&&!x.used&&x.region===ctx.region);
 if(!lead)return {ok:false,state:s};
 return {ok:true,state:{...s,selected:s.selected===id?'':id},lead};
}
function currentLead(raw,ctx={}){
 const s=normalize(raw);
 return s.leads.find(x=>x.id===s.selected&&!x.used&&x.region===ctx.region)||null;
}
function consumeLead(raw,id){
 const s=normalize(raw),lead=s.leads.find(x=>x.id===id&&!x.used);
 if(!lead)return s;
 return {...s,selected:'',leads:s.leads.map(x=>x.id===id?{...x,used:true}:x)};
}
function complete(raw,summary,ctx={}){
 const s=normalize(raw);if(!summary||s.memory.some(x=>x.lastId===summary.id))return {state:s,lead:null};
 const key=summary.faction+'|'+summary.actor;
 const old=s.memory.find(x=>x.key===key);
 const entry={key,name:summary.actor,faction:summary.faction,encounters:(old?.encounters||0)+1,
  lastYear:integer(summary.year,0,9999),lastOutcome:summary.outcome,lastChoice:summary.choices?.at(-1)||'',
  tone:summary.dialogueTone||summary.choices?.join(' / ')||'',trust:integer(summary.contact?.trust,0,100),
  rivalry:integer(summary.contact?.rivalry,0,100),lastId:summary.id};
 // Only a meaningful success unlocks a clue. Subsequent clues require further manual exploration.
 const qualifies=summary.outcome==='success'&&
  (summary.choices?.includes('map')||summary.choices?.includes('share')||summary.choices?.includes('talk')||summary.choices?.includes('bargain'));
 const lead=qualifies&&s.leads.filter(x=>!x.used).length<3?{
  id:'lead_'+safe(summary.id,70),year:integer(summary.year,0,9999),
  region:safe(ctx.region,80),island:safe(summary.island,100),faction:safe(summary.faction,55),
  actor:safe(summary.actor,110),
  title:'Piste liée à '+safe(summary.actor,70),boost:18,used:false}:null;
 const leads=lead?[...s.leads,lead].slice(-10):s.leads;
 return {state:{...s,dialogue:null,memory:[...s.memory.filter(x=>x.key!==key),entry].slice(-24),leads},lead};
}
r.register('encounterEngineV108',{version:'10.8.0',normalize,decorate,dialogueDecision,dialogueOdds,resolveDialogue,
 combatOdds,startCombat,combatDecision,combatTurn,selectLead,currentLead,consumeLead,complete});
})(window);