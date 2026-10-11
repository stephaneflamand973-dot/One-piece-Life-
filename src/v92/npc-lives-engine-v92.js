(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('npcLivesDataV92');if(!data)throw new Error('NPC lives data V9.2 missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=v=>Number(v)||0,clone=o=>JSON.parse(JSON.stringify(o));

function objectivePool(actor={}){
  const faction=String(actor.faction||'Indépendant');
  return (data.factionFallback[faction]||data.factionFallback.Indépendant).filter(id=>data.objectives[id]);
}
function initialRenown(actor={}){
  return clamp(num(actor.importance)*.58+num(actor.power)*.28+Math.min(12,num(actor.experience)*.05),5,100)
}
function phaseFor(life={},actor={}){
  if(actor.status&&actor.status!=='alive')return'fallen';
  const health=Number(actor.health);
  if(num(actor.injuryMonths)>0||(Number.isFinite(health)&&health<48))return'recovering';
  const renown=num(life.renown),experience=num(actor.experience),power=num(actor.power);
  if(renown>=88||num(actor.importance)>=96&&power>=90)return'legend';
  if(experience>=125&&renown>=66)return'veteran';
  if(renown>=72||power>=86)return'major';
  if(renown>=48||power>=62)return'established';
  return'rising'
}
function chooseObjective(actor={},life={},roll=.5){
  if(num(actor.injuryMonths)>0||num(actor.health)<55)return'recover';
  const pool=objectivePool(actor);
  if(!pool.length)return'mastery';
  const current=life.objectiveId;
  const options=pool.filter(x=>x!==current);
  const src=options.length?options:pool;
  return src[Math.min(src.length-1,Math.floor(clamp(num(roll),0,.999999)*src.length))]
}
function normalizeActor(life={},actor={}){
  const objectiveId=data.objectives[life.objectiveId]?life.objectiveId:chooseObjective(actor,life,.37);
  const out={
    actorId:String(actor.id||life.actorId||'unknown'),
    phase:String(life.phase||'rising'),
    momentum:clamp(Number.isFinite(Number(life.momentum))?Number(life.momentum):50,0,100),
    renown:clamp(Number.isFinite(Number(life.renown))?Number(life.renown):initialRenown(actor),0,100),
    objectiveId,
    objectiveProgress:clamp(num(life.objectiveProgress),0,100),
    wins:Math.max(0,Math.floor(num(life.wins))),
    losses:Math.max(0,Math.floor(num(life.losses))),
    moves:Math.max(0,Math.floor(num(life.moves))),
    alliances:Math.max(0,Math.floor(num(life.alliances))),
    setbacks:Math.max(0,Math.floor(num(life.setbacks))),
    completedObjectives:Math.max(0,Math.floor(num(life.completedObjectives))),
    lastRegion:String(life.lastRegion||actor.currentRegion||actor.region||'Inconnu'),
    lastPower:Number.isFinite(Number(life.lastPower))?Number(life.lastPower):num(actor.power),
    lastHealth:Number.isFinite(Number(life.lastHealth))?Number(life.lastHealth):num(actor.health||100),
    lastGoal:String(life.lastGoal||actor.goal||''),
    lastMonth:Number.isFinite(Number(life.lastMonth))?Number(life.lastMonth):-99,
    milestones:Array.isArray(life.milestones)?clone(life.milestones).slice(0,8):[],
    history:Array.isArray(life.history)?clone(life.history).slice(0,6):[]
  };
  const hasSnapshot=Number.isFinite(Number(actor.power))||Number.isFinite(Number(actor.health))||Number.isFinite(Number(actor.experience))||!!actor.faction;
  if(hasSnapshot)out.phase=phaseFor(out,actor);else if(!data.phases[out.phase])out.phase='rising';
  return out
}
function normalizeState(state={}){
  const actors={};
  for(const [id,life] of Object.entries(state.actors&&typeof state.actors==='object'?state.actors:{}))actors[id]=normalizeActor(life,{id,status:life.phase==='fallen'?'dead':'alive'});
  return {
    version:1,actors,
    lastTickMonth:Number.isFinite(Number(state.lastTickMonth))?Number(state.lastTickMonth):-99,
    totalTransitions:Math.max(0,Math.floor(num(state.totalTransitions))),
    totalMilestones:Math.max(0,Math.floor(num(state.totalMilestones))),
    totalObjectives:Math.max(0,Math.floor(num(state.totalObjectives))),
    globalHistory:Array.isArray(state.globalHistory)?clone(state.globalHistory).slice(0,40):[]
  }
}
function historyPush(life,entry){
  life.history=[entry,...life.history].slice(0,6)
}
function milestone(state,life,actor,type,title,desc,month,importance=50){
  const entry={id:String(actor.id)+'_'+type+'_'+month,actorId:String(actor.id),actorName:String(actor.name||actor.id),type,title,desc,month:num(month),region:String(actor.currentRegion||actor.region||life.lastRegion||''),importance:clamp(num(importance),0,100)};
  life.milestones=[entry,...life.milestones.filter(x=>x.id!==entry.id)].slice(0,8);
  state.globalHistory=[{...entry},...state.globalHistory.filter(x=>x.id!==entry.id)].slice(0,40);
  state.totalMilestones++;return entry
}
function ensureActor(state,actor,ctx={}){
  const s=normalizeState(state),id=String(actor.id);if(!s.actors[id])s.actors[id]=normalizeActor({},actor);
  const life=normalizeActor(s.actors[id],actor);life.lastMonth=Math.max(life.lastMonth,num(ctx.month));s.actors[id]=life;return {state:s,life}
}
function recordAction(state,actor,actionType,meta={},ctx={}){
  let {state:s,life}=ensureActor(state,actor,ctx),events=[];
  const fx=data.actionEffects[actionType]||{momentum:0,renown:0,progress:5,kind:'career'};
  life.momentum=clamp(life.momentum+num(fx.momentum),0,100);life.renown=clamp(life.renown+num(fx.renown),0,100);life.objectiveProgress=clamp(life.objectiveProgress+num(fx.progress),0,100);
  if(actionType==='clash_win')life.wins++;
  if(actionType==='clash_loss'){life.losses++;life.setbacks++}
  if(actionType==='move')life.moves++;
  if(actionType==='cooperate')life.alliances++;
  historyPush(life,{month:num(ctx.month),type:actionType,label:String(meta.label||fx.kind||actionType),targetId:meta.targetId||null,region:String(meta.region||actor.currentRegion||actor.region||'')});
  const oldPhase=life.phase;life.phase=phaseFor(life,actor);
  if(oldPhase!==life.phase){
    s.totalTransitions++;
    events.push(milestone(s,life,actor,'phase',String(actor.name||actor.id)+' devient '+data.phases[life.phase].label.toLowerCase(),'Sa trajectoire change après une accumulation d’expérience, de réputation et de résultats.',ctx.month,num(actor.importance)))
  }
  if(life.objectiveProgress>=100){
    const old=data.objectives[life.objectiveId];life.completedObjectives++;s.totalObjectives++;life.renown=clamp(life.renown+2.5,0,100);life.momentum=clamp(life.momentum+5,0,100);
    events.push(milestone(s,life,actor,'objective','Objectif accompli • '+String(actor.name||actor.id),(old?.label||'Un objectif personnel')+' arrive à son terme et ouvre une nouvelle phase de sa trajectoire.',ctx.month,Math.max(45,num(actor.importance)-12)));
    life.objectiveId=chooseObjective(actor,life,Number(meta.nextObjectiveRoll??.51));life.objectiveProgress=0
  }
  life.lastRegion=String(actor.currentRegion||actor.region||life.lastRegion);life.lastPower=num(actor.power);life.lastHealth=num(actor.health||100);life.lastGoal=String(actor.goal||life.lastGoal);life.lastMonth=num(ctx.month);s.actors[String(actor.id)]=life;
  return {state:s,life,events}
}
function tickActor(state,actor,ctx={},rolls={}){
  let {state:s,life}=ensureActor(state,actor,ctx),events=[];
  const months=Math.max(0,num(ctx.months)||1),powerDelta=num(actor.power)-num(life.lastPower),healthDelta=num(actor.health||100)-num(life.lastHealth);
  const region=String(actor.currentRegion||actor.region||life.lastRegion),goal=String(actor.goal||'');
  life.momentum=clamp(life.momentum+(powerDelta>0?Math.min(3,powerDelta*.45):0)+(healthDelta<-10?-3:0)+(months*.04*(Number(rolls.drift??.5)-.45)),0,100);
  life.renown=clamp(life.renown+Math.max(0,powerDelta)*.32+months*(num(actor.importance)/100)*.035,0,100);
  life.objectiveProgress=clamp(life.objectiveProgress+months*(1.35+num(actor.power)/120+life.momentum/180),0,100);
  if(region!==life.lastRegion){life.moves++;life.objectiveProgress=clamp(life.objectiveProgress+7,0,100);historyPush(life,{month:num(ctx.month),type:'move',label:'Déplacement',region});}
  if(healthDelta<=-18){life.setbacks++;life.momentum=clamp(life.momentum-6,0,100);historyPush(life,{month:num(ctx.month),type:'setback',label:'Revers physique',region});}
  if(goal&&goal!==life.lastGoal){life.objectiveProgress=clamp(life.objectiveProgress+5,0,100);historyPush(life,{month:num(ctx.month),type:'goal_change',label:'Nouvelle priorité',region});}
  const oldPhase=life.phase;life.phase=phaseFor(life,actor);
  if(oldPhase!==life.phase){
    s.totalTransitions++;
    events.push(milestone(s,life,actor,'phase',String(actor.name||actor.id)+' devient '+data.phases[life.phase].label.toLowerCase(),'Son parcours hors écran franchit un nouveau palier.',ctx.month,num(actor.importance)))
  }
  if(life.objectiveProgress>=100){
    const old=data.objectives[life.objectiveId];life.completedObjectives++;s.totalObjectives++;
    events.push(milestone(s,life,actor,'objective','Objectif accompli • '+String(actor.name||actor.id),(old?.label||'Un objectif')+' est atteint après plusieurs mois d’efforts autonomes.',ctx.month,Math.max(42,num(actor.importance)-15)));
    life.renown=clamp(life.renown+2.5,0,100);life.momentum=clamp(life.momentum+4,0,100);life.objectiveId=chooseObjective(actor,life,Number(rolls.objective??.5));life.objectiveProgress=0
  }
  life.lastRegion=region;life.lastPower=num(actor.power);life.lastHealth=num(actor.health||100);life.lastGoal=goal;life.lastMonth=num(ctx.month);s.actors[String(actor.id)]=life;s.lastTickMonth=Math.max(s.lastTickMonth,num(ctx.month));
  return {state:s,life,events}
}
function summary(state,actors=[],ctx={}){
  const s=normalizeState(state),rows=[];
  for(const actor of actors){
    const life=normalizeActor(s.actors[String(actor.id)]||{},actor),objective=data.objectives[life.objectiveId]||{};
    rows.push({actorId:String(actor.id),name:String(actor.name||actor.id),faction:String(actor.faction||'Indépendant'),region:String(actor.currentRegion||actor.region||''),power:num(actor.power),importance:num(actor.importance),health:num(actor.health||100),phase:life.phase,phaseLabel:data.phases[life.phase]?.label||life.phase,momentum:life.momentum,renown:life.renown,objectiveId:life.objectiveId,objectiveLabel:objective.label||life.objectiveId,objectiveProgress:life.objectiveProgress,wins:life.wins,losses:life.losses,moves:life.moves,completedObjectives:life.completedObjectives,milestones:life.milestones.slice(0,3)})
  }
  const local=rows.filter(x=>!ctx.region||x.region===ctx.region).sort((a,b)=>b.importance-a.importance||b.renown-a.renown);
  const notable=rows.slice().sort((a,b)=>(b.renown+b.momentum*.22)-(a.renown+a.momentum*.22)).slice(0,8);
  const rising=rows.filter(x=>x.phase==='rising'||x.phase==='established').sort((a,b)=>b.momentum-a.momentum||b.renown-a.renown).slice(0,6);
  return {state:s,local,notable,rising,totalTracked:rows.length,totalTransitions:s.totalTransitions,totalMilestones:s.totalMilestones,totalObjectives:s.totalObjectives,history:s.globalHistory.slice(0,10)}
}
registry.register('npcLivesEngineV92',{version:'9.2.0',normalizeState,normalizeActor,objectivePool,phaseFor,chooseObjective,initialRenown,ensureActor,recordAction,tickActor,summary});
})(window);
