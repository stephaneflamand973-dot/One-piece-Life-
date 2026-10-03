(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('dailyLifeDataV86');if(!data)throw new Error('Daily life data V8.6 missing');
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function normalizeTrack(track={}){
    return {months:Math.max(0,num(track.months)),mastery:clamp(num(track.mastery),0,100),bestStreak:Math.max(0,Math.floor(num(track.bestStreak))),
      successes:Math.max(0,Math.floor(num(track.successes))),events:Math.max(0,Math.floor(num(track.events)))}
  }
  function normalizeState(state={}){
    const tracks={};for(const [k,v] of Object.entries(state.tracks||{}))tracks[k]=normalizeTrack(v);
    return {version:1,activeType:state.activeType||null,streak:Math.max(0,Math.floor(num(state.streak))),switches:Math.max(0,Math.floor(num(state.switches))),
      routineFatigue:clamp(num(state.routineFatigue),0,100),tracks,opportunities:Array.isArray(state.opportunities)?clone(state.opportunities).filter(x=>x&&x.status==='open').slice(0,4):[],
      history:Array.isArray(state.history)?clone(state.history).slice(0,40):[],totalOpportunities:Math.max(0,Math.floor(num(state.totalOpportunities))),
      accepted:Math.max(0,Math.floor(num(state.accepted))),succeeded:Math.max(0,Math.floor(num(state.succeeded))),microEvents:Math.max(0,Math.floor(num(state.microEvents))),
      lastOfferMonth:Number.isFinite(Number(state.lastOfferMonth))?Number(state.lastOfferMonth):-99,lastMicroMonth:Number.isFinite(Number(state.lastMicroMonth))?Number(state.lastMicroMonth):-99}
  }
  function profile(type){return data.profiles[type]||data.profiles.general}
  function activitySnapshot(state,type){
    const s=normalizeState(state),t=normalizeTrack(s.tracks[type]||{}),p=profile(type);
    const consistency=clamp(1+Math.min(.24,s.streak*.012),1,1.24),masteryBonus=clamp(t.mastery/500,0,.2),fatigue=clamp(s.routineFatigue/180,0,.42);
    return {type,label:p.label,family:p.family,months:t.months,mastery:t.mastery,streak:s.activeType===type?s.streak:0,consistency:+consistency.toFixed(3),masteryBonus:+masteryBonus.toFixed(3),routinePenalty:+fatigue.toFixed(3),
      efficiency:+clamp(consistency+masteryBonus-fatigue,.62,1.38).toFixed(3)}
  }
  function expire(state,month){
    const s=normalizeState(state),expired=[];
    for(const o of s.opportunities)if(o.status==='open'&&num(o.expiresMonth)<=num(month)){o.status='expired';expired.push(o)}
    s.opportunities=s.opportunities.filter(o=>o.status==='open');return {state:s,expired}
  }
  function pick(arr,roll=.5){if(!arr?.length)return null;return arr[Math.min(arr.length-1,Math.floor(clamp(Number(roll),0,.999999)*arr.length))]}
  function createOpportunity(s,p,ctx={},rolls={}){
    if(!p.opportunities?.length)return null;
    const id=pick(p.opportunities,rolls.type??.5),base=data.opportunities[id];if(!base)return null;
    const danger=clamp(num(ctx.regionDanger),0,100),mastery=normalizeTrack(s.tracks[ctx.activityType]||{}).mastery;
    const difficulty=clamp(base.baseDifficulty+danger*.13+Number(rolls.difficulty??.5)*14-mastery*.08,18,88);
    const rewardMult=clamp(.75+difficulty/95+num(ctx.worldRep)/250,.75,2.25);
    return {id:'daily_'+Math.floor(Number(rolls.id??.5)*9999999)+'_'+num(ctx.month),type:id,label:base.label,desc:base.desc,skill:base.skill,difficulty:+difficulty.toFixed(1),
      risk:clamp(base.risk+danger*.08,2,85),reward:base.reward,money:Math.round(base.money*rewardMult),rep:base.rep,createdMonth:num(ctx.month),expiresMonth:num(ctx.month)+6,status:'open',activityType:ctx.activityType}
  }
  function microEvent(state,p,ctx={},rolls={}){
    const s=normalizeState(state),mastery=normalizeTrack(s.tracks[ctx.activityType]||{}).mastery,energy=num(ctx.energy),types=['breakthrough','praise','windfall','bond','insight'];
    if(energy<38||s.routineFatigue>58)types.push('fatigue','fatigue');
    const id=pick(types,rolls.microType??.5),base=data.microEvents[id];if(!base)return null;
    const scale=clamp(.8+mastery/180+Number(rolls.microScale??.5)*.6,.7,1.8);
    const event={id,label:base.label,kind:base.kind,scale:+scale.toFixed(2),activityType:ctx.activityType};
    if(base.kind==='skill')event.skill=pick(p.skills||['Combat'],rolls.skill??.5)||'Combat';
    if(base.kind==='money')event.money=Math.round((500+num(ctx.regionDanger)*24)*scale);
    if(base.kind==='reputation')event.rep=Math.max(1,Math.round(1.5*scale));
    if(base.kind==='energy')event.energy=-Math.max(2,Math.round(4*scale));
    if(base.kind==='relation')event.relation=Math.max(1,Math.round(2*scale));
    return event
  }
  function tickMonth(state,ctx={},rolls={}){
    let s=normalizeState(state);const type=ctx.activityType||'general',p=profile(type),month=num(ctx.month);
    const expiredResult=expire(s,month);s=expiredResult.state;
    if(s.activeType===type)s.streak++;else{if(s.activeType)s.switches++;s.activeType=type;s.streak=1;s.routineFatigue=clamp(s.routineFatigue-9,0,100)}
    const t=normalizeTrack(s.tracks[type]||{});t.months++;t.bestStreak=Math.max(t.bestStreak,s.streak);
    const streakGain=Math.min(.35,s.streak*.012),novelty=s.streak<=6?.18:s.streak<=18?.06:-.04;
    const gain=clamp((.65+p.mastery*.55+streakGain+novelty)*(1-s.routineFatigue/180),.22,2.2);
    t.mastery=clamp(t.mastery+gain,0,100);s.tracks[type]=t;
    if(s.streak>18)s.routineFatigue=clamp(s.routineFatigue+(s.streak>36?1.8:.7),0,100);else s.routineFatigue=clamp(s.routineFatigue-.7,0,100);
    const snap=activitySnapshot(s,type),effects={energy:+(p.energy*snap.efficiency).toFixed(2),health:+(p.health*snap.efficiency).toFixed(2),skillGain:+(.10*snap.efficiency).toFixed(3),masteryGain:+gain.toFixed(2)};
    let micro=null,opportunity=null;
    const microChance=clamp(.08+novelty*.12+snap.masteryBonus*.2-s.routineFatigue/800,.035,.18);
    if(month-s.lastMicroMonth>=2&&Number(rolls.micro??1)<microChance){micro=microEvent(s,p,{...ctx,activityType:type},rolls);if(micro){s.microEvents++;s.lastMicroMonth=month;t.events++;s.history.unshift({month,type:'micro',event:micro.id,activityType:type})}}
    const offerChance=clamp(.075+(p.family==='adventure'||p.family==='risk'?.035:0)+num(ctx.localOpportunity)/700+num(ctx.worldRep)/1400-s.opportunities.length*.035,.03,.20);
    if(s.opportunities.length<3&&month-s.lastOfferMonth>=3&&Number(rolls.offer??1)<offerChance){
      opportunity=createOpportunity(s,p,{...ctx,activityType:type},rolls);if(opportunity){s.opportunities.push(opportunity);s.totalOpportunities++;s.lastOfferMonth=month}
    }
    s.history=s.history.slice(0,40);return {state:s,track:t,snapshot:snap,effects,micro,opportunity,expired:expiredResult.expired}
  }
  function opportunityChance(op,ctx={}){
    const skill=clamp(num(ctx.skill),0,100),power=clamp(num(ctx.power),0,120),mastery=clamp(num(ctx.mastery),0,100),energy=clamp(num(ctx.energy),0,100),rep=clamp(num(ctx.worldRep),0,100);
    const score=skill*.54+power*.14+mastery*.18+energy*.07+rep*.07;
    return +clamp(.30+(score-num(op.difficulty))/115,.12,.94).toFixed(3)
  }
  function resolveOpportunity(state,id,ctx={},roll=.5){
    const s=normalizeState(state),i=s.opportunities.findIndex(x=>x.id===id&&x.status==='open');if(i<0)return {state:s,error:'missing'};
    const op=s.opportunities[i],mastery=normalizeTrack(s.tracks[op.activityType]||{}).mastery,chance=opportunityChance(op,{...ctx,mastery}),r=Number(roll),success=r<chance*.74,partial=!success&&r<chance;
    const outcome=success?'success':partial?'partial':'failure',factor=success?1:partial?.48:-.18;
    const effects={money:Math.round(num(op.money)*factor),rep:Math.round(num(op.rep)*(success?1:partial?.5:-.5)),energy:-Math.max(1,Math.round(num(op.risk)/18)),
      health:outcome==='failure'?-Math.round(num(op.risk)/14):0,skillGain:success?1.4:partial?.7:.25,reward:op.reward,lead:op.reward==='lead'&&success,relation:op.reward==='relation'?(success?4:partial?2:0):0,
      discovery:op.reward==='discovery'&&outcome!=='failure'};
    op.status='resolved';op.outcome=outcome;op.resolvedMonth=num(ctx.month);s.accepted++;if(success)s.succeeded++;
    const track=normalizeTrack(s.tracks[op.activityType]||{});if(success)track.successes++;track.mastery=clamp(track.mastery+(success?2.4:partial?1.1:.35),0,100);s.tracks[op.activityType]=track;
    s.history.unshift({month:num(ctx.month),type:'opportunity',opportunity:op.type,outcome});s.history=s.history.slice(0,40);s.opportunities=s.opportunities.filter(x=>x.status==='open');
    return {state:s,opportunity:op,outcome,chance,effects}
  }
  function dismissOpportunity(state,id,month=0){
    const s=normalizeState(state),i=s.opportunities.findIndex(x=>x.id===id);if(i<0)return {state:s,error:'missing'};const op=s.opportunities[i];op.status='dismissed';
    s.history.unshift({month:num(month),type:'dismissed',opportunity:op.type});s.opportunities=s.opportunities.filter(x=>x.status==='open');return {state:s,opportunity:op}
  }
  function summary(state,type='general'){
    const s=normalizeState(state),snap=activitySnapshot(s,type),tracks=Object.entries(s.tracks).map(([id,t])=>({id,...normalizeTrack(t),label:profile(id).label})).sort((a,b)=>b.months-a.months);
    return {activeType:s.activeType,streak:s.streak,routineFatigue:s.routineFatigue,current:snap,tracks,opportunities:s.opportunities,totalOpportunities:s.totalOpportunities,accepted:s.accepted,succeeded:s.succeeded,microEvents:s.microEvents,switches:s.switches}
  }

  registry.register('dailyLifeEngineV86',{version:'8.6.0',normalizeTrack,normalizeState,profile,activitySnapshot,tickMonth,opportunityChance,resolveOpportunity,dismissOpportunity,summary});
})(window);
