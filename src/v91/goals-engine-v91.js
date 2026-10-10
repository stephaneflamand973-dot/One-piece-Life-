(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('goalsDataV91');if(!data)throw new Error('Goals data V9.1 missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=v=>Number(v)||0,clone=o=>JSON.parse(JSON.stringify(o));
const regionTier=r=>({'East Blue':0,'West Blue':0,'North Blue':0,'South Blue':0,'Grand Line':1,'Calm Belt':2,'New World':3}[r]??0);

function normalizeGoal(g){
  if(!g||!g.templateId)return null;
  return {uid:String(g.uid||g.templateId),templateId:String(g.templateId),level:g.level==='short'?'short':'medium',startedYear:num(g.startedYear),start:clone(g.start||{}),target:clone(g.target||{}),progress:clamp(num(g.progress),0,100),status:g.status==='completed'?'completed':'active',completedYear:g.completedYear==null?null:num(g.completedYear)};
}
function normalizeState(state={}){
  return {
    version:1,ambitionType:String(state.ambitionType||'survive'),
    annualIntent:data.intents[state.annualIntent]?state.annualIntent:'balanced',
    intentYear:Number.isFinite(Number(state.intentYear))?Number(state.intentYear):-99,
    intentBasePlan:state.intentBasePlan&&typeof state.intentBasePlan==='object'?clone(state.intentBasePlan):null,
    lastAmbitionChangeYear:Number.isFinite(Number(state.lastAmbitionChangeYear))?Number(state.lastAmbitionChangeYear):-99,
    activeMedium:(Array.isArray(state.activeMedium)?state.activeMedium:[]).map(normalizeGoal).filter(Boolean).slice(0,2),
    activeShort:(Array.isArray(state.activeShort)?state.activeShort:[]).map(normalizeGoal).filter(Boolean).slice(0,3),
    completed:(Array.isArray(state.completed)?state.completed:[]).map(normalizeGoal).filter(Boolean).slice(0,30),
    ambitionMilestones:Array.isArray(state.ambitionMilestones)?state.ambitionMilestones.map(Number).filter(x=>[25,50,75,100].includes(x)):[],
    lastRefreshYear:Number.isFinite(Number(state.lastRefreshYear))?Number(state.lastRefreshYear):-99,
    lastAmbitionChangeYear:Number.isFinite(Number(state.lastAmbitionChangeYear))?Number(state.lastAmbitionChangeYear):-99,
    intentBasePlan:state.intentBasePlan&&typeof state.intentBasePlan==='object'?clone(state.intentBasePlan):null,
    sequence:Math.max(0,Math.floor(num(state.sequence)))
  };
}
function metric(ctx,key){return num(ctx[key])}
function longProgress(ambition,ctx={}){
  if(ambition==='survive')return clamp((num(ctx.ageYears)/60)*78+num(ctx.health)*.12+num(ctx.energy)*.10,0,100);
  if(ambition==='power')return clamp(num(ctx.power)/85*100,0,100);
  if(ambition==='explore')return clamp(num(ctx.visited)/15*72+regionTier(ctx.region)/3*28,0,100);
  if(ambition==='wealth'){
    const wealth=Math.max(0,num(ctx.money)+Math.max(0,num(ctx.tradeProfit))*.5);
    return clamp(Math.sqrt(wealth/5000000)*100,0,100);
  }
  if(ambition==='legacy')return clamp(num(ctx.worldRep)*.58+num(ctx.legacyScore)*.42,0,100);
  if(ambition==='protect')return clamp(num(ctx.worldRep)*.48+clamp(num(ctx.localRep),0,100)*.20+Math.min(32,num(ctx.strongRelations)*8),0,100);
  return 0;
}
function eligibleTemplate(id,t,ctx,level){
  if(id==='career_rank'&&(ctx.career==='Aucune'||!(num(ctx.rankIndex)>=0)||num(ctx.rankIndex)>=num(ctx.rankCount)-1))return false;
  if(id==='mission_record'&&ctx.career==='Aucune')return false;
  if(id==='reach_region'&&regionTier(ctx.region)>=3)return false;
  if(id==='trade_growth'&&ctx.tradeAvailable===false)return false;
  if(id==='crew_growth'&&!ctx.hasCrew)return false;
  if(id==='stabilize'&&num(ctx.health)>=80&&num(ctx.energy)>=70)return false;
  if(id==='recover_now'&&num(ctx.health)>=75&&num(ctx.energy)>=60)return false;
  if(id==='repair_gear'&&num(ctx.brokenEquipment)<=0)return false;
  if(id==='full_loadout'&&num(ctx.equippedCount)>=4)return false;
  if(level==='short'&&id==='one_mission'&&ctx.career==='Aucune')return false;
  return true;
}
function makeGoal(id,t,level,ctx,state){
  const start={year:num(ctx.year),rank:String(ctx.rank||''),rankIndex:num(ctx.rankIndex),region:String(ctx.region||''),faction:String(ctx.faction||''),career:String(ctx.career||'')};
  if(t.metric)start[t.metric]=metric(ctx,t.metric);
  if(t.metrics)for(const k of Object.keys(t.metrics))start[k]=metric(ctx,k);
  if(t.kind==='wealth')start.money=metric(ctx,'money');
  const target={};
  if(t.kind==='delta')target.value=metric(ctx,t.metric)+num(t.delta);
  if(t.kind==='threshold')target.value=num(t.target);
  if(t.kind==='zero')target.value=0;
  if(t.kind==='pair')for(const [k,v] of Object.entries(t.metrics||{}))target[k]=num(v);
  if(t.kind==='rank')target.value=Math.min(num(ctx.rankCount)-1,num(ctx.rankIndex)+1);
  if(t.kind==='region')target.value=Math.min(3,regionTier(ctx.region)+1);
  if(t.kind==='wealth')target.value=Math.max(75000,num(ctx.money)+50000,num(ctx.money)*1.5);
  state.sequence++;
  return {uid:id+'_'+num(ctx.year)+'_'+state.sequence,templateId:id,level,startedYear:num(ctx.year),start,target,progress:0,status:'active',completedYear:null};
}
function goalProgress(goal,ctx={}){
  const t=(goal.level==='short'?data.shortTemplates:data.mediumTemplates)[goal.templateId];if(!t)return 0;
  if(t.kind==='delta'){
    const s=num(goal.start[t.metric]),target=num(goal.target.value),now=metric(ctx,t.metric);return clamp((now-s)/Math.max(.0001,target-s)*100,0,100);
  }
  if(t.kind==='threshold')return clamp(metric(ctx,t.metric)/Math.max(1,num(goal.target.value))*100,0,100);
  if(t.kind==='zero')return metric(ctx,t.metric)<=0?100:0;
  if(t.kind==='pair'){
    const vals=Object.entries(goal.target).map(([k,v])=>clamp(metric(ctx,k)/Math.max(1,num(v))*100,0,100));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
  }
  if(t.kind==='rank'){
    const start=num(ctx.rankIndex)<0?0:num(goal.start.rankIndex??0),target=num(goal.target.value),now=num(ctx.rankIndex);return clamp((now-start)/Math.max(1,target-start)*100,0,100);
  }
  if(t.kind==='region')return clamp((regionTier(ctx.region)-regionTier(goal.start.region))/Math.max(1,num(goal.target.value)-regionTier(goal.start.region))*100,0,100);
  if(t.kind==='wealth'){
    const start=num(goal.start.money),target=num(goal.target.value),now=num(ctx.money);return clamp((now-start)/Math.max(1,target-start)*100,0,100);
  }
  return 0;
}
function recentCompleted(state,id,years=3,nowYear=0){return state.completed.some(g=>g.templateId===id&&num(g.completedYear)>=nowYear-years)}
function pickTemplates(pool,level,ambition,ctx,state,count){
  const activeIds=new Set([...(state.activeMedium||[]),...(state.activeShort||[])].map(x=>x.templateId));
  return Object.entries(pool).filter(([id,t])=>!activeIds.has(id)&&!recentCompleted(state,id,level==='short'?2:4,num(ctx.year))&&eligibleTemplate(id,t,ctx,level))
    .map(([id,t])=>({id,t,score:num(t.weight)+(Array.isArray(t.ambitions)&&t.ambitions.includes(ambition)?8:0)+(id==='stabilize'&&num(ctx.health)<55?8:0)+(id==='recover_now'&&num(ctx.energy)<45?8:0)+(id==='repair_gear'&&num(ctx.brokenEquipment)>0?9:0)}))
    .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,count);
}
function staleGoal(goal,ctx={}){
  if(!goal)return true;
  if(goal.templateId==='career_rank'&&(ctx.career==='Aucune'||(goal.start?.faction&&String(goal.start.faction)!==String(ctx.faction||''))))return true;
  if(goal.templateId==='mission_record'&&ctx.career==='Aucune')return true;
  if(goal.templateId==='crew_growth'&&!ctx.hasCrew)return true;
  if(goal.templateId==='trade_growth'&&ctx.tradeAvailable===false)return true;
  const age=Math.max(0,num(ctx.year)-num(goal.startedYear)),progress=clamp(num(goal.progress),0,100);
  if(goal.level==='short'&&age>=4&&progress<80)return true;
  if(goal.level==='medium'&&age>=10&&progress<75)return true;
  return false
}
function refresh(state,ctx={}){
  const s=normalizeState(state),amb=data.ambitions[ctx.ambitionType]?ctx.ambitionType:s.ambitionType;s.ambitionType=amb;
  s.activeMedium=s.activeMedium.filter(g=>!staleGoal(g,ctx));
  s.activeShort=s.activeShort.filter(g=>!staleGoal(g,ctx));
  if(s.activeMedium.length<2)for(const x of pickTemplates(data.mediumTemplates,'medium',amb,ctx,s,2-s.activeMedium.length))s.activeMedium.push(makeGoal(x.id,x.t,'medium',ctx,s));
  if(s.activeShort.length<3)for(const x of pickTemplates(data.shortTemplates,'short',amb,ctx,s,3-s.activeShort.length))s.activeShort.push(makeGoal(x.id,x.t,'short',ctx,s));
  s.lastRefreshYear=num(ctx.year);return s;
}
function tick(state,ctx={}){
  let s=refresh(state,ctx),completed=[];
  for(const key of ['activeMedium','activeShort']){
    const keep=[];
    for(const g of s[key]){g.progress=goalProgress(g,ctx);if(g.progress>=99.999){g.progress=100;g.status='completed';g.completedYear=num(ctx.year);completed.push(clone(g));s.completed.unshift(clone(g))}else keep.push(g)}
    s[key]=keep;
  }
  s.completed=s.completed.slice(0,30);
  const lp=longProgress(s.ambitionType,ctx),milestones=[];
  for(const m of [25,50,75,100])if(lp>=m&&!s.ambitionMilestones.includes(m)){s.ambitionMilestones.push(m);milestones.push(m)}
  s=refresh(s,ctx);
  return {state:s,completed,milestones,longProgress:lp};
}
function setAmbition(state,ambitionType,ctx={}){
  let s=normalizeState(state);if(!data.ambitions[ambitionType])return {state:s,error:'invalid_ambition'};
  if(s.ambitionType!==ambitionType){s.ambitionType=ambitionType;s.activeMedium=[];s.activeShort=[];s.ambitionMilestones=[]}
  s=refresh(s,{...ctx,ambitionType});return {state:s};
}
function setIntent(state,id,year=0){
  const s=normalizeState(state);if(!data.intents[id])return {state:s,error:'invalid_intent'};
  s.annualIntent=id;s.intentYear=num(year);return {state:s,patch:clone(data.intents[id].planPatch||{})};
}
function summary(state,ctx={}){
  const s=refresh(state,ctx),amb=data.ambitions[s.ambitionType]||data.ambitions.survive;
  const decorate=g=>{const t=(g.level==='short'?data.shortTemplates:data.mediumTemplates)[g.templateId]||{};return {...g,label:t.label||g.templateId,desc:t.desc||'',progress:goalProgress(g,ctx)}};
  return {state:s,ambition:{id:s.ambitionType,...amb,progress:longProgress(s.ambitionType,ctx)},intent:{id:s.annualIntent,...(data.intents[s.annualIntent]||data.intents.balanced)},medium:s.activeMedium.map(decorate),short:s.activeShort.map(decorate),completed:s.completed.slice(0,6).map(decorate)};
}
registry.register('goalsEngineV91',{version:'9.1.0',normalizeState,longProgress,goalProgress,refresh,tick,setAmbition,setIntent,summary,regionTier,staleGoal});
})(window);
