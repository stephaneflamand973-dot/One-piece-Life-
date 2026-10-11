(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('npcLivesDataV92');if(!data)throw new Error('NPC lives data V9.2 missing');

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const num=v=>Number(v)||0;
const clone=o=>JSON.parse(JSON.stringify(o));
const lerp=(a,b,t)=>a+(b-a)*clamp(Number(t)||0,0,1);
const pick=(arr,roll=.5)=>arr?.length?arr[Math.min(arr.length-1,Math.floor(clamp(Number(roll)||0,0,.999999)*arr.length))]:null;

function careerDef(faction='Civil'){return data.careers[faction]||data.careers.Indépendant||data.careers.Civil}
function objectivePool(actor={}){
  const faction=String(actor.faction||'Indépendant');
  return (data.factionFallback[faction]||data.factionFallback.Indépendant).filter(id=>data.objectives[id])
}
function chooseObjective(actor={},life={},roll=.5){
  if(num(life.condition)<45)return'recover';
  const pool=objectivePool(actor);if(!pool.length)return'mastery';
  const current=life.objectiveId,options=pool.filter(x=>x!==current),src=options.length?options:pool;
  return pick(src,roll)||src[0]||'mastery'
}
function initialRenown(actor={}){
  return clamp(num(actor.importance)*.45+num(actor.power)*.32+num(actor.respect)*.12+num(actor.familiarity)*.06,3,100)
}
function phaseFor(life={},actor={}){
  const status=String(life.status||actor.status||'active');
  if(['dead','fallen'].includes(status))return'fallen';
  if(status==='retired')return'retired';
  if(num(life.condition)<45)return'recovering';
  const renown=num(life.renown),power=num(life.power),age=num(life.age);
  if(renown>=90&&power>=88)return'legend';
  if(age>=48&&renown>=62)return'veteran';
  if(renown>=72||power>=82)return'major';
  if(renown>=45||power>=58)return'established';
  return'rising'
}
function promotionThreshold(rankIndex=0){return [0,38,92,165,255,365,500][Math.min(6,Math.max(0,rankIndex+1))]??500}
function inferRankIndex(actor={},career){
  if(Number.isFinite(Number(actor.rankIndex)))return clamp(Math.floor(Number(actor.rankIndex)),0,career.ranks.length-1);
  const i=career.ranks.indexOf(String(actor.rank||''));return i>=0?i:0
}
function normalizeActor(life={},actor={},ctx={}){
  const faction=String(life.faction||actor.faction||'Civil'),career=careerDef(faction);
  const rankIndex=clamp(Number.isFinite(Number(life.rankIndex))?Math.floor(Number(life.rankIndex)):inferRankIndex(actor,career),0,career.ranks.length-1);
  const power=clamp(Number.isFinite(Number(life.power))?Number(life.power):Math.max(8,num(actor.power)||18),1,100);
  const potentialPower=clamp(Math.max(power,Number.isFinite(Number(life.potentialPower))?Number(life.potentialPower):(num(actor.potentialPower)||power+20)),power,100);
  const age=clamp(Number.isFinite(Number(life.age))?Number(life.age):(num(actor.age)||Math.max(13,num(ctx.playerAge)||18)),5,100);
  const condition=clamp(Number.isFinite(Number(life.condition))?Number(life.condition):(Number.isFinite(Number(actor.health))?Number(actor.health):92),0,100);
  const objectiveId=data.objectives[life.objectiveId]?life.objectiveId:chooseObjective({...actor,faction},{...life,condition},.37);
  const out={
    actorId:String(actor.id||life.actorId||'unknown'),
    sourceType:String(life.sourceType||actor.sourceType||'relation'),
    faction,profession:String(life.profession||actor.profession||career.profession),
    rankIndex,rankLabel:String(life.rankLabel||actor.rank||career.ranks[rankIndex]||career.ranks[0]),
    careerXP:Math.max(0,num(life.careerXP)),
    age,region:String(life.region||actor.currentRegion||actor.region||ctx.playerRegion||'East Blue'),
    originRegion:String(life.originRegion||actor.region||actor.currentRegion||ctx.playerRegion||'East Blue'),
    power,potentialPower,condition,
    wealth:Math.max(0,Number.isFinite(Number(life.wealth))?Number(life.wealth):(num(actor.wealth)||Math.max(500,initialRenown(actor)*120))),
    momentum:clamp(Number.isFinite(Number(life.momentum))?Number(life.momentum):50,0,100),
    renown:clamp(Number.isFinite(Number(life.renown))?Number(life.renown):initialRenown({...actor,power}),0,100),
    objectiveId,objectiveProgress:clamp(num(life.objectiveProgress),0,100),
    wins:Math.max(0,Math.floor(num(life.wins))),losses:Math.max(0,Math.floor(num(life.losses))),
    moves:Math.max(0,Math.floor(num(life.moves))),alliances:Math.max(0,Math.floor(num(life.alliances))),
    setbacks:Math.max(0,Math.floor(num(life.setbacks))),completedObjectives:Math.max(0,Math.floor(num(life.completedObjectives))),
    promotions:Math.max(0,Math.floor(num(life.promotions))),careerChanges:Math.max(0,Math.floor(num(life.careerChanges))),
    lastAction:String(life.lastAction||'Poursuit sa trajectoire'),lastActionType:String(life.lastActionType||'idle'),
    lastActionMonth:Number.isFinite(Number(life.lastActionMonth))?Number(life.lastActionMonth):-99,
    lastCareerChangeYear:Number.isFinite(Number(life.lastCareerChangeYear))?Number(life.lastCareerChangeYear):-99,
    lastRegion:String(life.lastRegion||actor.currentRegion||actor.region||ctx.playerRegion||'East Blue'),
    lastPower:Number.isFinite(Number(life.lastPower))?Number(life.lastPower):power,
    lastMonth:Number.isFinite(Number(life.lastMonth))?Number(life.lastMonth):-99,
    status:String(life.status||actor.status||'active'),
    temperament:String(actor.temperament||life.temperament||'Variable'),
    ambition:String(actor.ambition||life.ambition||'Maîtrise'),
    lockedCareer:!!(life.lockedCareer||actor.lockedCareer||actor.sourceType==='canon'),
    phase:String(life.phase||'rising'),
    milestones:Array.isArray(life.milestones)?clone(life.milestones).slice(0,10):[],
    history:Array.isArray(life.history)?clone(life.history).slice(0,12):[]
  };
  out.phase=phaseFor(out,actor);return out
}
function normalizeState(state={}){
  const actors={};
  for(const [id,life] of Object.entries(state.actors&&typeof state.actors==='object'?state.actors:{}))actors[id]=normalizeActor(life,{id,sourceType:life.sourceType||'relation'});
  return {
    version:1,actors,
    lastTickMonth:Number.isFinite(Number(state.lastTickMonth))?Number(state.lastTickMonth):-99,
    totalTracked:Math.max(0,Math.floor(num(state.totalTracked))),
    totalActions:Math.max(0,Math.floor(num(state.totalActions))),
    totalMoves:Math.max(0,Math.floor(num(state.totalMoves))),
    totalPromotions:Math.max(0,Math.floor(num(state.totalPromotions))),
    totalCareerChanges:Math.max(0,Math.floor(num(state.totalCareerChanges))),
    totalMilestones:Math.max(0,Math.floor(num(state.totalMilestones))),
    totalObjectives:Math.max(0,Math.floor(num(state.totalObjectives))),
    globalHistory:Array.isArray(state.globalHistory)?clone(state.globalHistory).slice(0,50):[]
  }
}
function historyPush(life,entry){life.history=[entry,...life.history].slice(0,12)}
function eventPush(state,life,actor,type,title,desc,ctx={},importance=50){
  const month=num(ctx.month),entry={
    id:String(actor.id)+'_'+type+'_'+month+'_'+state.totalMilestones,
    actorId:String(actor.id),actorName:String(actor.name||actor.id),sourceType:life.sourceType,type,title,desc,
    month,region:String(life.region||actor.currentRegion||actor.region||''),importance:clamp(num(importance),0,100),known:life.sourceType==='relation'
  };
  life.milestones=[entry,...life.milestones].slice(0,10);state.globalHistory=[entry,...state.globalHistory].slice(0,50);state.totalMilestones++;return entry
}
function ensureActor(state,actor,ctx={}){
  const s=normalizeState(state),id=String(actor.id),exists=!!s.actors[id];
  const life=normalizeActor(s.actors[id]||{},actor,ctx);s.actors[id]=life;if(!exists)s.totalTracked++;
  return {state:s,life}
}
function actionWeights(actor={},life={}){
  const base={work:2,train:2,travel:1.5,network:1.5,risk:1,recover:.5,support:1};
  const ambition=data.ambitionWeights[String(actor.ambition||life.ambition)]||data.ambitionWeights.Maîtrise;
  for(const [k,v] of Object.entries(ambition||{}))base[k]=(base[k]||0)+num(v);
  if(life.condition<60){base.recover+=7;base.risk*=.35;base.travel*=.6}
  if(life.age>52){base.work*=.8;base.risk*=.55;base.network*=1.35;base.support*=1.25}
  if(life.faction==='Marine'||life.faction==='Gouvernement'){base.work+=2;base.network+=1}
  if(life.faction==='Pirates'){base.risk+=2;base.travel+=1}
  return base
}
function chooseAction(actor={},life={},roll=.5){
  const weights=actionWeights(actor,life),rows=Object.entries(weights).filter(([,w])=>w>0),total=rows.reduce((a,[,w])=>a+w,0);
  let x=clamp(Number(roll)||0,0,.999999)*total;
  for(const [id,w] of rows){x-=w;if(x<=0)return id}
  return rows.at(-1)?.[0]||'work'
}
function actionLabel(type,life={}){
  const labels={
    work:'Travaille à faire avancer sa carrière',train:'S’entraîne et perfectionne ses capacités',
    travel:'Quitte sa région pour chercher de nouvelles opportunités',network:'Développe ses contacts et son influence',
    risk:'Prend part à une opération risquée',recover:'Se met en retrait pour récupérer',support:'Aide son entourage et consolide ses liens'
  };
  return labels[type]||'Poursuit sa trajectoire'
}
function applyRange(life,key,range,roll){
  if(!range)return 0;const d=lerp(range[0],range[1],roll);life[key]=Math.max(0,num(life[key])+d);return d
}
function objectiveBonus(life,action){
  const obj=data.objectives[life.objectiveId];return obj?.tags?.includes(action)?8:obj?.tags?.includes('combat')&&action==='risk'?6:0
}
function maybeCompleteObjective(state,life,actor,ctx={},roll=.5){
  const events=[];if(life.objectiveProgress<100)return events;
  const old=data.objectives[life.objectiveId];life.completedObjectives++;state.totalObjectives++;life.renown=clamp(life.renown+2.5,0,100);life.momentum=clamp(life.momentum+4,0,100);
  events.push(eventPush(state,life,actor,'objective','Objectif accompli • '+String(actor.name||actor.id),(old?.label||'Un objectif personnel')+' arrive à son terme et ouvre une nouvelle direction.',ctx,Math.max(42,num(actor.importance)||life.renown)));
  life.objectiveId=chooseObjective({...actor,faction:life.faction},life,roll);life.objectiveProgress=0;return events
}
function maybePromote(state,life,actor,ctx={}){
  const events=[],career=careerDef(life.faction),threshold=promotionThreshold(life.rankIndex);
  if(life.rankIndex>=career.ranks.length-1||life.careerXP<threshold)return events;
  const old=life.rankLabel;life.rankIndex++;life.rankLabel=career.ranks[life.rankIndex]||life.rankLabel;life.promotions++;state.totalPromotions++;life.renown=clamp(life.renown+3+life.rankIndex*.5,0,100);life.momentum=clamp(life.momentum+6,0,100);
  events.push(eventPush(state,life,actor,'promotion',String(actor.name||actor.id)+' progresse dans sa carrière',old+' → '+life.rankLabel+'. Sa vie avance même hors de ton champ de vision.',ctx,55+life.rankIndex*4));
  return events
}
function careerCandidates(life={}){
  const all=['Marine','Pirates','Révolutionnaires','Gouvernement','Chasseurs de primes','Civil'];
  if(life.ambition==='Liberté'||life.ambition==='Aventure')return ['Pirates','Chasseurs de primes','Civil','Révolutionnaires'].filter(x=>x!==life.faction);
  if(life.ambition==='Loyauté')return ['Marine','Révolutionnaires','Civil'].filter(x=>x!==life.faction);
  if(life.ambition==='Fortune'||life.ambition==='wealth')return ['Chasseurs de primes','Civil','Pirates'].filter(x=>x!==life.faction);
  return all.filter(x=>x!==life.faction)
}
function maybeCareerChange(state,life,actor,ctx={},rolls={}){
  const events=[];if(life.lockedCareer||life.age<17||life.status!=='active')return events;
  const year=Math.floor(num(ctx.month)/12),since=year-life.lastCareerChangeYear;
  if(since<3)return events;
  const chance=clamp(.008+(life.momentum<35?.012:0)+(life.lastActionType==='travel'?.006:0),.006,.03);
  if(Number(rolls.career??1)>=chance)return events;
  const next=pick(careerCandidates(life),rolls.careerTarget);if(!next)return events;
  const oldFaction=life.faction,oldProfession=life.profession;life.faction=next;const career=careerDef(next);life.profession=career.profession;life.rankIndex=0;life.rankLabel=career.ranks[0];life.careerXP=Math.min(life.careerXP*.25,35);life.careerChanges++;life.lastCareerChangeYear=year;life.objectiveId=chooseObjective({...actor,faction:next},life,rolls.objective);life.objectiveProgress=0;state.totalCareerChanges++;life.momentum=clamp(life.momentum+4,0,100);
  events.push(eventPush(state,life,actor,'career_change',String(actor.name||actor.id)+' change de voie',oldProfession+' ('+oldFaction+') → '+life.profession+' ('+next+').',ctx,68));return events
}
function maybeRetire(state,life,actor,ctx={},roll=.5){
  const events=[];if(life.lockedCareer||life.status!=='active'||life.age<58)return events;
  const p=clamp((life.age-57)*.008+(life.condition<45?.05:0),.008,.22);if(Number(roll)>=p)return events;
  life.status='retired';life.phase='retired';life.lastAction='Se retire progressivement de la vie active';life.lastActionType='retire';life.momentum=clamp(life.momentum-8,0,100);
  events.push(eventPush(state,life,actor,'retirement',String(actor.name||actor.id)+' se retire',life.rankLabel+' quitte progressivement la vie active après une longue trajectoire.',ctx,62));return events
}
function stepRelation(state,actor,ctx={},rolls={}){
  let {state:s,life}=ensureActor(state,{...actor,sourceType:'relation'},ctx),events=[];
  const months=Math.max(1,num(ctx.months)||1);life.age=clamp(life.age+months/12,5,100);life.condition=clamp(life.condition+months*.35,0,100);
  if(life.status!=='active'){life.lastMonth=num(ctx.month);s.actors[String(actor.id)]=life;return{state:s,life,events,action:null}}
  if(num(ctx.month)-life.lastActionMonth<6){life.lastMonth=num(ctx.month);s.actors[String(actor.id)]=life;return{state:s,life,events,action:null}}
  const action=chooseAction(actor,life,rolls.action),fx=data.actionEffects[action]||data.actionEffects.work;s.totalActions++;
  life.lastActionType=action;life.lastAction=actionLabel(action,life);life.lastActionMonth=num(ctx.month);
  life.momentum=clamp(life.momentum+num(fx.momentum),0,100);life.renown=clamp(life.renown+num(fx.renown),0,100);life.objectiveProgress=clamp(life.objectiveProgress+num(fx.objective)+objectiveBonus(life,action),0,100);
  applyRange(life,'careerXP',fx.careerXP,rolls.effect);applyRange(life,'wealth',fx.wealth,rolls.effect2);applyRange(life,'condition',fx.condition,rolls.effect2);
  if(fx.power)life.power=clamp(life.power+Math.max(0,lerp(fx.power[0],fx.power[1],rolls.effect))*(1-life.power/Math.max(life.potentialPower,1)),1,life.potentialPower);
  if(action==='travel'){
    const routes=data.regionRoutes[life.region]||data.regions.filter(x=>x!==life.region),next=pick(routes,rolls.travel);
    if(next&&next!==life.region){const from=life.region;life.region=next;life.moves++;s.totalMoves++;events.push(eventPush(s,life,actor,'move',String(actor.name||actor.id)+' change de région',from+' → '+next+'. Son parcours continue hors écran.',ctx,48+life.renown*.2))}
  }
  if(action==='network')life.alliances++;
  if(action==='risk'){
    const chance=clamp(.48+(life.power-45)/180+(life.momentum-50)/240,.18,.84),won=Number(rolls.outcome??.5)<chance;
    if(won){life.wins++;life.momentum=clamp(life.momentum+6,0,100);life.renown=clamp(life.renown+2.5,0,100);life.careerXP+=5;life.wealth=Math.max(0,life.wealth+lerp(500,5500,rolls.effect2));historyPush(life,{month:num(ctx.month),type:'risk_win',label:'Réussite risquée',region:life.region})}
    else{life.losses++;life.setbacks++;life.momentum=clamp(life.momentum-9,0,100);life.condition=clamp(life.condition-lerp(8,24,rolls.effect2),0,100);historyPush(life,{month:num(ctx.month),type:'risk_loss',label:'Revers',region:life.region});if(life.condition<42)events.push(eventPush(s,life,actor,'setback',String(actor.name||actor.id)+' subit un revers','Une opération tourne mal et force '+String(actor.name||actor.id)+' à ralentir.',ctx,52))}
  }
  if(action==='recover')life.condition=clamp(life.condition+5,0,100);
  historyPush(life,{month:num(ctx.month),type:action,label:life.lastAction,region:life.region});
  events.push(...maybePromote(s,life,actor,ctx));
  events.push(...maybeCareerChange(s,life,actor,ctx,rolls));
  events.push(...maybeCompleteObjective(s,life,actor,ctx,rolls.objective));
  events.push(...maybeRetire(s,life,actor,ctx,rolls.retire));
  const oldPhase=life.phase;life.phase=phaseFor(life,actor);if(oldPhase!==life.phase&&!events.some(e=>e.type==='retirement'))events.push(eventPush(s,life,actor,'phase',String(actor.name||actor.id)+' devient '+data.phases[life.phase].label.toLowerCase(),'Sa trajectoire personnelle franchit un nouveau palier.',ctx,50+life.renown*.25));
  life.lastRegion=life.region;life.lastPower=life.power;life.lastMonth=num(ctx.month);s.actors[String(actor.id)]=life;s.lastTickMonth=Math.max(s.lastTickMonth,num(ctx.month));
  return{state:s,life,events,action}
}
function tickCanon(state,actor,ctx={},rolls={}){
  let {state:s,life}=ensureActor(state,{...actor,sourceType:'canon',lockedCareer:true},ctx),events=[];
  const region=String(actor.currentRegion||actor.region||life.region),power=num(actor.power)||life.power,health=Number.isFinite(Number(actor.health))?Number(actor.health):life.condition;
  const powerDelta=power-life.lastPower;if(powerDelta>0){life.power=clamp(power,1,100);life.renown=clamp(life.renown+powerDelta*.25,0,100);life.objectiveProgress=clamp(life.objectiveProgress+Math.min(8,powerDelta*.7),0,100)}
  life.condition=clamp(health,0,100);life.age=clamp(life.age+Math.max(1,num(ctx.months)||1)/12,5,100);
  if(region!==life.region){const from=life.region;life.region=region;life.moves++;s.totalMoves++;events.push(eventPush(s,life,actor,'move',String(actor.name||actor.id)+' apparaît ailleurs',from+' → '+region+'.',ctx,Math.max(45,num(actor.importance))))}
  life.objectiveProgress=clamp(life.objectiveProgress+(Math.max(1,num(ctx.months)||1))*(.7+num(actor.importance)/160),0,100);
  events.push(...maybeCompleteObjective(s,life,actor,ctx,rolls.objective));
  const oldPhase=life.phase;life.phase=phaseFor(life,{...actor,power,health});if(oldPhase!==life.phase)events.push(eventPush(s,life,actor,'phase',String(actor.name||actor.id)+' devient '+data.phases[life.phase].label.toLowerCase(),'Sa trajectoire mondiale atteint un nouveau niveau.',ctx,num(actor.importance)));
  life.lastRegion=region;life.lastPower=power;life.lastMonth=num(ctx.month);life.lastAction=String(actor.lastAction||life.lastAction);s.actors[String(actor.id)]=life;s.lastTickMonth=Math.max(s.lastTickMonth,num(ctx.month));
  return{state:s,life,events}
}
function snapshot(state,actor,ctx={}){
  const s=normalizeState(state),life=normalizeActor(s.actors[String(actor.id)]||{},actor,ctx),obj=data.objectives[life.objectiveId]||{};
  return {...life,phaseLabel:data.phases[life.phase]?.label||life.phase,objectiveLabel:obj.label||life.objectiveId}
}
function summary(state,actors=[],ctx={}){
  const s=normalizeState(state),rows=actors.map(a=>snapshot(s,a,ctx));
  const local=rows.filter(x=>!ctx.region||x.region===ctx.region).sort((a,b)=>b.renown-a.renown||b.power-a.power);
  const notable=rows.slice().sort((a,b)=>(b.renown+b.momentum*.22)-(a.renown+a.momentum*.22)).slice(0,8);
  const recent=s.globalHistory.slice(0,12);
  return{state:s,rows,local,notable,recent,totalTracked:Object.keys(s.actors).length,totalActions:s.totalActions,totalMoves:s.totalMoves,totalPromotions:s.totalPromotions,totalCareerChanges:s.totalCareerChanges,totalMilestones:s.totalMilestones,totalObjectives:s.totalObjectives}
}

registry.register('npcLivesEngineV92',{
  version:'9.2.0',normalizeState,normalizeActor,careerDef,objectivePool,chooseObjective,phaseFor,promotionThreshold,
  actionWeights,chooseAction,ensureActor,stepRelation,tickCanon,snapshot,summary
});
})(window);
