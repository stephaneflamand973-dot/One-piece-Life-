(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('npcLivesDataV92');if(!data)throw new Error('NPC lives data V9.2 missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=v=>Number(v)||0,clone=o=>JSON.parse(JSON.stringify(o));

function objectivePool(actor={}){
  const faction=String(actor.faction||'Indépendant');
  const pool=(data.factionFallback[faction]||data.factionFallback.Indépendant).filter(id=>data.objectives[id]);
  return pool.length?pool:['mastery'];
}
function initialRenown(actor={}){
  return clamp(num(actor.importance)*.55+num(actor.power)*.25+Math.min(12,num(actor.experience)*.05)+num(actor.reputation)*.15,5,100)
}
function initialInfluence(actor={}){
  return clamp(num(actor.importance)*.50+num(actor.power)*.13+Math.min(18,num(actor.experience)*.08)+num(actor.reputation)*.20,4,100)
}
function initialWealth(actor={}){
  if(Number.isFinite(Number(actor.wealth)))return clamp(Number(actor.wealth),0,100);
  const faction=String(actor.faction||'');
  const bias=faction==='Gouvernement'?18:faction==='Marine'?10:faction==='Pirates'?6:faction==='Civil'?9:5;
  return clamp(18+bias+num(actor.importance)*.22+num(actor.power)*.08,5,100)
}
function initialCareerTier(actor={}){
  if(Number.isFinite(Number(actor.careerTier)))return clamp(Math.floor(Number(actor.careerTier)),0,5);
  const score=num(actor.importance)*.48+num(actor.power)*.30+Math.min(20,num(actor.experience)*.06);
  return score>=86?5:score>=72?4:score>=56?3:score>=38?2:score>=22?1:0
}
function phaseFor(life={},actor={}){
  const status=String(actor.status||'alive');
  if(['dead','deceased','fallen'].includes(status))return'fallen';
  const health=Number.isFinite(Number(actor.health))?Number(actor.health):num(life.lastHealth)||100;
  if(num(actor.injuryMonths)>0||health<48||num(life.stress)>82||num(life.energy)<28)return'recovering';
  if(num(life.renown)>=92&&num(life.influence)>=82)return'legend';
  if(num(life.careerTier)>=4&&(num(actor.experience)>=70||num(life.renown)>=72))return'veteran';
  if(num(actor.power)>=80||num(life.renown)>=72||num(life.influence)>=68)return'major';
  if(num(life.careerTier)>=2||num(life.renown)>=44)return'established';
  return'rising'
}
function chooseObjective(actor={},life={},roll=.5){
  if(num(actor.injuryMonths)>0||Number(actor.health)<48||num(life.stress)>78||num(life.energy)<34)return'recover';
  const pool=objectivePool(actor),lowWealth=num(life.wealth)<22,lowInfluence=num(life.influence)<28;
  const options=pool.filter(id=>id!==life.objectiveId);
  let weighted=options.length?options:pool;
  if(lowWealth&&data.objectives.build_resources)weighted=['build_resources',...weighted];
  if(lowInfluence&&data.objectives.deepen_bonds)weighted=['deepen_bonds',...weighted];
  const idx=Math.min(weighted.length-1,Math.floor(clamp(num(roll),0,.999999)*weighted.length));
  return weighted[idx]||pool[0]||'mastery'
}
function normalizeActor(life={},actor={}){
  const snapshot=actor&&typeof actor==='object'&&(actor.name!=null||actor.faction!=null||actor.power!=null||actor.importance!=null||actor.currentRegion!=null);
  const sourceType=String(actor.sourceType||life.sourceType||'world');
  const careerTier=Number.isFinite(Number(life.careerTier))?clamp(Math.floor(Number(life.careerTier)),0,5):initialCareerTier(actor);
  const stress=clamp(Number.isFinite(Number(life.stress))?Number(life.stress):(num(actor.injuryMonths)>0?58:24),0,100);
  const energy=clamp(Number.isFinite(Number(life.energy))?Number(life.energy):100-stress*.45,0,100);
  const draft={
    actorId:String(actor.v92Id||actor.id||life.actorId||'unknown'),
    sourceType,
    phase:String(life.phase||'rising'),
    momentum:clamp(Number.isFinite(Number(life.momentum))?Number(life.momentum):50,0,100),
    renown:clamp(Number.isFinite(Number(life.renown))?Number(life.renown):initialRenown(actor),0,100),
    influence:clamp(Number.isFinite(Number(life.influence))?Number(life.influence):initialInfluence(actor),0,100),
    wealth:clamp(Number.isFinite(Number(life.wealth))?Number(life.wealth):initialWealth(actor),0,100),
    energy,stress,
    careerTier,
    careerProgress:clamp(num(life.careerProgress),0,100),
    objectiveId:String(life.objectiveId||''),
    objectiveProgress:clamp(num(life.objectiveProgress),0,100),
    wins:Math.max(0,Math.floor(num(life.wins))),
    losses:Math.max(0,Math.floor(num(life.losses))),
    moves:Math.max(0,Math.floor(num(life.moves))),
    alliances:Math.max(0,Math.floor(num(life.alliances))),
    setbacks:Math.max(0,Math.floor(num(life.setbacks))),
    completedObjectives:Math.max(0,Math.floor(num(life.completedObjectives))),
    promotions:Math.max(0,Math.floor(num(life.promotions))),
    lastRegion:String(life.lastRegion||actor.currentRegion||actor.region||'Inconnu'),
    lastPower:Number.isFinite(Number(life.lastPower))?Number(life.lastPower):num(actor.power),
    lastHealth:Number.isFinite(Number(life.lastHealth))?Number(life.lastHealth):(Number.isFinite(Number(actor.health))?Number(actor.health):100),
    lastGoal:String(life.lastGoal||actor.goal||actor.ambition||''),
    lastStatus:String(life.lastStatus||actor.status||'alive'),
    lastMonth:Number.isFinite(Number(life.lastMonth))?Number(life.lastMonth):-99,
    milestones:Array.isArray(life.milestones)?clone(life.milestones).slice(0,10):[],
    history:Array.isArray(life.history)?clone(life.history).slice(0,8):[]
  };
  if(!data.objectives[draft.objectiveId])draft.objectiveId=chooseObjective(actor,draft,.37);
  if(snapshot)draft.phase=phaseFor(draft,actor);else if(!data.phases[draft.phase])draft.phase='rising';
  return draft
}
function normalizeState(state={}){
  const actors={};
  for(const [id,life] of Object.entries(state.actors&&typeof state.actors==='object'?state.actors:{}))actors[id]=normalizeActor(life,{id,v92Id:id});
  return {
    version:2,actors,
    lastTickMonth:Number.isFinite(Number(state.lastTickMonth))?Number(state.lastTickMonth):-99,
    totalTransitions:Math.max(0,Math.floor(num(state.totalTransitions))),
    totalMilestones:Math.max(0,Math.floor(num(state.totalMilestones))),
    totalObjectives:Math.max(0,Math.floor(num(state.totalObjectives))),
    totalPromotions:Math.max(0,Math.floor(num(state.totalPromotions))),
    globalHistory:Array.isArray(state.globalHistory)?clone(state.globalHistory).slice(0,50):[]
  }
}
function historyPush(life,entry){life.history=[entry,...life.history].slice(0,8)}
function milestone(state,life,actor,type,title,desc,month,importance=50){
  const entry={id:String(life.actorId)+'_'+type+'_'+month+'_'+state.totalMilestones,actorId:String(life.actorId),actorName:String(actor.name||actor.id||life.actorId),sourceType:life.sourceType,type,title,desc,month:num(month),region:String(actor.currentRegion||actor.region||life.lastRegion||''),importance:clamp(num(importance),0,100),known:false};
  life.milestones=[entry,...life.milestones.filter(x=>x.id!==entry.id)].slice(0,10);
  state.globalHistory=[entry,...state.globalHistory.filter(x=>x.id!==entry.id)].slice(0,50);
  state.totalMilestones++;return entry
}
function ensureActor(state,actor,ctx={}){
  const s=normalizeState(state),id=String(actor.v92Id||actor.id);
  if(!s.actors[id])s.actors[id]=normalizeActor({},actor);
  const life=normalizeActor(s.actors[id],actor);life.lastMonth=Math.max(life.lastMonth,num(ctx.month));s.actors[id]=life;
  return {state:s,life}
}
function maybePromote(state,life,actor,month,events){
  while(life.careerProgress>=100&&life.careerTier<5){
    life.careerProgress-=100;life.careerTier++;life.promotions++;state.totalPromotions++;
    life.influence=clamp(life.influence+4,0,100);life.wealth=clamp(life.wealth+3,0,100);life.renown=clamp(life.renown+2,0,100);life.momentum=clamp(life.momentum+5,0,100);
    const label=data.careerTiers[life.careerTier]?.label||('Palier '+life.careerTier);
    events.push(milestone(state,life,actor,'career','Progression de carrière • '+String(actor.name||actor.id),String(actor.name||actor.id)+' atteint le palier « '+label+' ». Ce palier décrit son poids dans le monde sans remplacer son rang canonique.',month,Math.max(52,num(actor.importance)-5)))
  }
  if(life.careerTier>=5)life.careerProgress=Math.min(life.careerProgress,99)
}
function completeObjective(state,life,actor,month,roll,events){
  if(life.objectiveProgress<100)return;
  const old=data.objectives[life.objectiveId];life.completedObjectives++;state.totalObjectives++;
  life.renown=clamp(life.renown+2.5,0,100);life.momentum=clamp(life.momentum+5,0,100);life.influence=clamp(life.influence+1.5,0,100);
  events.push(milestone(state,life,actor,'objective','Objectif accompli • '+String(actor.name||actor.id),(old?.label||'Un objectif personnel')+' arrive à son terme et ouvre une nouvelle phase de sa trajectoire.',month,Math.max(45,num(actor.importance)-12)));
  life.objectiveId=chooseObjective(actor,life,roll);life.objectiveProgress=0
}
function recordAction(state,actor,actionType,meta={},ctx={}){
  let {state:s,life}=ensureActor(state,actor,ctx),events=[];
  const fx=data.actionEffects[actionType]||{momentum:0,renown:0,progress:5,influence:0,wealth:0,stress:0,career:1,kind:'career'};
  life.momentum=clamp(life.momentum+num(fx.momentum),0,100);
  life.renown=clamp(life.renown+num(fx.renown),0,100);
  life.influence=clamp(life.influence+num(fx.influence),0,100);
  life.wealth=clamp(life.wealth+num(fx.wealth),0,100);
  life.stress=clamp(life.stress+num(fx.stress),0,100);
  life.energy=clamp(life.energy-num(fx.stress)*.35+(actionType==='recover'?10:0),0,100);
  life.careerProgress=clamp(life.careerProgress+num(fx.career),0,220);
  life.objectiveProgress=clamp(life.objectiveProgress+num(fx.progress),0,100);
  if(actionType==='clash_win')life.wins++;
  if(actionType==='clash_loss'){life.losses++;life.setbacks++}
  if(actionType==='move')life.moves++;
  if(actionType==='cooperate')life.alliances++;
  if(actionType==='setback')life.setbacks++;
  historyPush(life,{month:num(ctx.month),type:actionType,label:String(meta.label||fx.kind||actionType),targetId:meta.targetId||null,region:String(meta.region||actor.currentRegion||actor.region||'')});
  maybePromote(s,life,actor,ctx.month,events);
  const oldPhase=life.phase;life.phase=phaseFor(life,actor);
  if(oldPhase!==life.phase){s.totalTransitions++;events.push(milestone(s,life,actor,'phase',String(actor.name||actor.id)+' devient '+(data.phases[life.phase]?.label||life.phase).toLowerCase(),'Sa trajectoire change après une accumulation d’expérience, de réputation et de résultats.',ctx.month,num(actor.importance)))}
  completeObjective(s,life,actor,ctx.month,Number(meta.nextObjectiveRoll??.51),events);
  life.lastRegion=String(actor.currentRegion||actor.region||life.lastRegion);life.lastPower=num(actor.power);life.lastHealth=Number.isFinite(Number(actor.health))?Number(actor.health):life.lastHealth;life.lastGoal=String(actor.goal||actor.ambition||life.lastGoal);life.lastStatus=String(actor.status||life.lastStatus);life.lastMonth=num(ctx.month);s.actors[life.actorId]=life;
  return {state:s,life,events}
}
function tickActor(state,actor,ctx={},rolls={}){
  let {state:s,life}=ensureActor(state,actor,ctx),events=[];
  const months=Math.max(0,num(ctx.months)||1),powerDelta=num(actor.power)-num(life.lastPower),healthNow=Number.isFinite(Number(actor.health))?Number(actor.health):life.lastHealth,healthDelta=healthNow-num(life.lastHealth);
  const region=String(actor.currentRegion||actor.region||life.lastRegion),goal=String(actor.goal||actor.ambition||''),drift=Number(rolls.drift??.5)-.5;
  life.momentum=clamp(life.momentum+(powerDelta>0?Math.min(3,powerDelta*.45):0)+(healthDelta<-10?-3:0)+months*.10*drift,0,100);
  life.renown=clamp(life.renown+Math.max(0,powerDelta)*.32+months*(num(actor.importance)/100)*.035+Math.max(0,life.careerTier-1)*months*.01,0,100);
  life.influence=clamp(life.influence+months*(.015+life.careerTier*.012+life.renown/9000)+drift*.18,0,100);
  life.wealth=clamp(life.wealth+months*(.035+life.careerTier*.026+life.influence/7000)+drift*.30-(num(actor.injuryMonths)>0?.12*months:0),0,100);
  const pressure=(num(actor.injuryMonths)>0?1.6:0)+(healthNow<60?.8:0)+(life.losses>life.wins?.08:0);
  life.stress=clamp(life.stress+months*(pressure-.24)+drift*.45,0,100);
  life.energy=clamp(life.energy+months*(.55-life.stress/220)-(num(actor.injuryMonths)>0?.3:0),0,100);
  const careerSpeed=.62+num(actor.experience)/180+life.momentum/260+life.influence/500;
  life.careerProgress=clamp(life.careerProgress+months*careerSpeed+Math.max(0,powerDelta)*1.4,0,220);
  life.objectiveProgress=clamp(life.objectiveProgress+months*(1.15+num(actor.power)/150+life.momentum/220+life.influence/500),0,100);
  if(region!==life.lastRegion){life.moves++;life.objectiveProgress=clamp(life.objectiveProgress+7,0,100);life.stress=clamp(life.stress+2,0,100);historyPush(life,{month:num(ctx.month),type:'move',label:'Déplacement',region})}
  if(healthDelta<=-18){life.setbacks++;life.momentum=clamp(life.momentum-6,0,100);life.stress=clamp(life.stress+8,0,100);historyPush(life,{month:num(ctx.month),type:'setback',label:'Revers physique',region})}
  if(goal&&goal!==life.lastGoal){life.objectiveProgress=clamp(life.objectiveProgress+5,0,100);historyPush(life,{month:num(ctx.month),type:'goal_change',label:'Nouvelle priorité',region})}
  if(String(actor.status||'alive')!==life.lastStatus&&['dead','deceased','fallen'].includes(String(actor.status||''))){events.push(milestone(s,life,actor,'fall','Trajectoire interrompue • '+String(actor.name||actor.id),'La trajectoire de '+String(actor.name||actor.id)+' s’arrête et laisse désormais une trace durable dans le monde.',ctx.month,Math.max(60,num(actor.importance))))}
  maybePromote(s,life,actor,ctx.month,events);
  const oldPhase=life.phase;life.phase=phaseFor(life,actor);
  if(oldPhase!==life.phase){s.totalTransitions++;events.push(milestone(s,life,actor,'phase',String(actor.name||actor.id)+' devient '+(data.phases[life.phase]?.label||life.phase).toLowerCase(),'Son parcours hors écran franchit un nouveau palier.',ctx.month,num(actor.importance)))}
  completeObjective(s,life,actor,ctx.month,Number(rolls.objective??.5),events);
  life.lastRegion=region;life.lastPower=num(actor.power);life.lastHealth=healthNow;life.lastGoal=goal;life.lastStatus=String(actor.status||life.lastStatus);life.lastMonth=num(ctx.month);s.actors[life.actorId]=life;s.lastTickMonth=Math.max(s.lastTickMonth,num(ctx.month));
  return {state:s,life,events}
}
function supportScore(life={}){
  return +clamp((num(life.influence)-35)/18+(num(life.renown)-40)/28+(num(life.careerTier)-1)*.55-(num(life.stress)-65)/35,0,4).toFixed(2)
}
function summary(state,actors=[],ctx={}){
  const s=normalizeState(state),rows=[];
  for(const actor of actors){
    const id=String(actor.v92Id||actor.id),life=normalizeActor(s.actors[id]||{},actor),objective=data.objectives[life.objectiveId]||{},tier=data.careerTiers[life.careerTier]||data.careerTiers[0];
    rows.push({actorId:id,name:String(actor.name||actor.id),sourceType:life.sourceType,faction:String(actor.faction||'Indépendant'),region:String(actor.currentRegion||actor.region||''),power:num(actor.power),importance:num(actor.importance),health:Number.isFinite(Number(actor.health))?Number(actor.health):100,phase:life.phase,phaseLabel:data.phases[life.phase]?.label||life.phase,momentum:life.momentum,renown:life.renown,influence:life.influence,wealth:life.wealth,energy:life.energy,stress:life.stress,careerTier:life.careerTier,careerLabel:tier.label,careerProgress:life.careerProgress,objectiveId:life.objectiveId,objectiveLabel:objective.label||life.objectiveId,objectiveProgress:life.objectiveProgress,wins:life.wins,losses:life.losses,moves:life.moves,alliances:life.alliances,setbacks:life.setbacks,completedObjectives:life.completedObjectives,promotions:life.promotions,support:supportScore(life),milestones:life.milestones.slice(0,3),history:life.history.slice(0,3)})
  }
  const local=rows.filter(x=>!ctx.region||x.region===ctx.region).sort((a,b)=>b.importance-a.importance||b.renown-a.renown);
  const notable=rows.slice().sort((a,b)=>(b.renown+b.influence*.45+b.momentum*.22)-(a.renown+a.influence*.45+a.momentum*.22)).slice(0,10);
  const rising=rows.filter(x=>['rising','established'].includes(x.phase)).sort((a,b)=>b.momentum-a.momentum||b.renown-a.renown).slice(0,8);
  return {state:s,local,notable,rising,totalTracked:rows.length,totalTransitions:s.totalTransitions,totalMilestones:s.totalMilestones,totalObjectives:s.totalObjectives,totalPromotions:s.totalPromotions,history:s.globalHistory.slice(0,12)}
}
registry.register('npcLivesEngineV92',{version:'9.2.0',normalizeState,normalizeActor,objectivePool,phaseFor,chooseObjective,initialRenown,initialInfluence,initialWealth,initialCareerTier,ensureActor,recordAction,tickActor,supportScore,summary});
})(window);
