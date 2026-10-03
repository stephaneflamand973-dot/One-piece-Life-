(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('voyageDataV85');if(!data)throw new Error('Voyage data V8.5 missing');
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function normalizeState(state={}){
    const s={...state};
    s.version=1;s.poseLevel=clamp(Math.floor(num(s.poseLevel)),0,2);s.seaExperience=clamp(num(s.seaExperience),0,100);
    s.voyages=Math.max(0,Math.floor(num(s.voyages)));s.successfulVoyages=Math.max(0,Math.floor(num(s.successfulVoyages)));
    s.monthsAtSea=Math.max(0,num(s.monthsAtSea));s.totalDiscoveries=Math.max(0,Math.floor(num(s.totalDiscoveries)));
    s.treasures=Math.max(0,Math.floor(num(s.treasures)));s.stormsSurvived=Math.max(0,Math.floor(num(s.stormsSurvived)));
    s.routeKnowledge=s.routeKnowledge&&typeof s.routeKnowledge==='object'?clone(s.routeKnowledge):{};
    s.islands=s.islands&&typeof s.islands==='object'?clone(s.islands):{};
    s.weatherHistory=Array.isArray(s.weatherHistory)?clone(s.weatherHistory).slice(0,24):[];
    return s
  }
  function routeKey(from,to){return [String(from||''),String(to||'')].sort().join('::')}
  function routeRecord(state,from,to){
    const s=normalizeState(state),key=routeKey(from,to),r=s.routeKnowledge[key]||{};
    return {key,trips:Math.max(0,Math.floor(num(r.trips))),mastery:clamp(num(r.mastery),0,100),lastYear:Number.isFinite(Number(r.lastYear))?Number(r.lastYear):-99}
  }
  function islandRecord(state,island){
    const s=normalizeState(state),r=s.islands[island]||{};
    return {visits:Math.max(0,Math.floor(num(r.visits))),exploration:clamp(num(r.exploration),0,100),discoveries:Array.isArray(r.discoveries)?clone(r.discoveries):[],lastYear:Number.isFinite(Number(r.lastYear))?Number(r.lastYear):-99}
  }
  function poseLevelFor(region,nav,current=0){
    if(region==='New World'||num(nav)>=58)return Math.max(current,2);
    if(region==='Grand Line'||num(nav)>=28)return Math.max(current,1);
    return current
  }
  function weighted(entries,roll=.5){
    const total=entries.reduce((s,x)=>s+Math.max(0,num(x[1])),0);if(total<=0)return entries[0]?.[0]||null;
    let r=clamp(Number(roll),0,.999999)*total;
    for(const x of entries){r-=Math.max(0,num(x[1]));if(r<=0)return x[0]}
    return entries[entries.length-1]?.[0]||null
  }
  function weatherFor(region,roll=.5){const id=weighted(data.regionWeather[region]||data.regionWeather['East Blue'],roll);return {id,...data.weather[id]}}
  function routeProfile(state,spec={}){
    const s=normalizeState(state),mode=data.modes[spec.mode]||data.modes.standard,record=routeRecord(s,spec.from,spec.to);
    const nav=clamp(num(spec.navigation),0,100),crewTravel=clamp(num(spec.crewTravel),0,100),ship=clamp(Number.isFinite(Number(spec.shipCondition))?Number(spec.shipCondition):70,10,100);
    const base=Math.max(.12,num(spec.baseDuration)||.5),danger=clamp((num(spec.fromDanger)+num(spec.toDanger))/2+num(spec.causalRisk),0,100);
    const familiarity=clamp(record.mastery*.32+Math.min(18,record.trips*3),0,42);
    const poseNeed=spec.toRegion==='New World'?2:spec.toRegion==='Grand Line'||spec.fromRegion==='Grand Line'?1:0;
    const poseGap=Math.max(0,poseNeed-s.poseLevel),navBenefit=clamp(nav*.0035+crewTravel*.0021+familiarity*.0024,0,.52);
    const shipPenalty=ship<45?(45-ship)/95:0,posePenalty=poseGap*.23;
    const duration=clamp(base*(1-navBenefit+shipPenalty+posePenalty)*mode.duration,.12,4.5);
    const riskBase=clamp(.05+danger/180+poseGap*.12+(70-ship)/260-nav/500-crewTravel/620-familiarity/650,.035,.82);
    const risk=clamp(riskBase*mode.risk,.025,.88),discovery=clamp((.035+(100-familiarity)/900+danger/1200)*mode.discovery,.02,.34);
    const wear=clamp((.8+danger/55)*(1+(70-ship)/180)*mode.wear,.35,3.2);
    return {from:spec.from,to:spec.to,fromRegion:spec.fromRegion,toRegion:spec.toRegion,mode:spec.mode||'standard',modeLabel:mode.label,
      baseDuration:base,duration:+duration.toFixed(2),danger:+danger.toFixed(1),risk:+risk.toFixed(3),riskPct:Math.round(risk*100),discovery:+discovery.toFixed(3),
      wear:+wear.toFixed(2),familiarity:+familiarity.toFixed(1),routeMastery:record.mastery,trips:record.trips,poseNeed,poseGap,
      preparedness:+clamp(nav*.42+crewTravel*.30+ship*.18+familiarity*.10-poseGap*14,0,100).toFixed(1)}
  }
  function startVoyage(state,profile,ctx={}){
    const s=normalizeState(state);s.voyages++;
    return {state:s,voyage:{version:1,from:profile.from,destination:profile.to,targetRegion:profile.toRegion,total:profile.duration,remaining:profile.duration,
      danger:Math.round(profile.danger),mode:profile.mode,modeLabel:profile.modeLabel,risk:profile.risk,wear:profile.wear,discoveryChance:profile.discovery,
      routeMastery:profile.routeMastery,familiarity:profile.familiarity,poseNeed:profile.poseNeed,departYear:num(ctx.year),incidents:0,discoveries:0,
      weather:'variable',lastEvent:null,progress:0}}
  }
  function hazardWeights(region,weatherId){
    const out=Object.entries(data.hazards).map(([id,h])=>[id,h.weight]);
    if(region==='New World'){for(const x of out)if(['seaKing','storm','current'].includes(x[0]))x[1]*=1.35}
    if(region==='Grand Line'){for(const x of out)if(['storm','current'].includes(x[0]))x[1]*=1.18}
    if(weatherId==='storm'||weatherId==='cyclone'){for(const x of out)if(['storm','reef','current'].includes(x[0]))x[1]*=1.45}
    return out
  }
  function tickVoyage(state,voyage,ctx={},months=1,rolls={}){
    const s=normalizeState(state),v=clone(voyage),weather=weatherFor(v.targetRegion||ctx.region,rolls.weather??.5);
    const ship=clamp(Number.isFinite(Number(ctx.shipCondition))?Number(ctx.shipCondition):70,10,100),crewTravel=clamp(num(ctx.crewTravel),0,100),nav=clamp(num(ctx.navigation),0,100);
    const resilience=clamp(nav*.35+crewTravel*.35+ship*.30,0,100),mode=data.modes[v.mode]||data.modes.standard;
    const effectiveRisk=clamp(num(v.risk)*weather.risk*(1-resilience/420),.015,.92);
    const progress=Math.max(.03,months*weather.progress*(.88+resilience/420));
    v.remaining=Math.max(0,num(v.remaining)-progress);v.progress=clamp(num(v.progress)+progress,0,num(v.total)||progress);v.weather=weather.id;
    s.monthsAtSea+=months;s.seaExperience=clamp(s.seaExperience+months*(.35+num(v.danger)/210),0,100);
    let event=null;
    if(Number(rolls.event??1)<effectiveRisk){
      const id=weighted(hazardWeights(v.targetRegion||ctx.region,weather.id),rolls.hazard??.5),h=data.hazards[id],sev=clamp(h.severity+num(v.danger)*.22-weather.risk*4-resilience*.16,8,95);
      event={id,label:h.label,kind:h.kind,severity:+sev.toFixed(1),energyLoss:0,shipWear:0,delay:0,moneyDelta:0,powerBonus:0};
      if(id==='storm'){event.energyLoss=Math.round(3+sev*.08);event.shipWear=+(2+sev*.09).toFixed(1);event.delay=+(sev/180).toFixed(2);s.stormsSurvived++}
      if(id==='reef'){event.shipWear=+(3+sev*.10).toFixed(1);event.delay=+(sev/240).toFixed(2)}
      if(id==='current'){event.energyLoss=Math.round(2+sev*.04);event.delay=+(sev/210).toFixed(2)}
      if(id==='pirates'){event.powerBonus=Math.round(4+sev*.18)}
      if(id==='seaKing'){event.powerBonus=Math.round(10+sev*.24)}
      if(id==='marine'){event.powerBonus=Math.round(2+sev*.12)}
      if(id==='merchant')event.moneyDelta=Math.round(500+sev*85);
      event.shipWear=+(event.shipWear*mode.wear).toFixed(1);v.remaining+=event.delay;v.incidents=(v.incidents||0)+1;v.lastEvent=id
    }
    let discovery=null;
    const discoveryChance=clamp(num(v.discoveryChance)*mode.discovery*(weather.id==='calm'||weather.id==='fair'?1.18:.92),.01,.55);
    if(Number(rolls.discovery??1)<discoveryChance){
      const ids=Object.keys(data.discoveries),id=ids[Math.floor(clamp(Number(rolls.discoveryType??.5),0,.999999)*ids.length)]||'chart';
      discovery={id,...data.discoveries[id]};v.discoveries=(v.discoveries||0)+1;s.totalDiscoveries++
    }
    s.weatherHistory.unshift({year:num(ctx.year),region:v.targetRegion||ctx.region,weather:weather.id,event:event?.id||null});s.weatherHistory=s.weatherHistory.slice(0,24);
    return {state:s,voyage:v,weather,event,discovery,effectiveRisk:+effectiveRisk.toFixed(3),progress:+progress.toFixed(2)}
  }
  function arrive(state,voyage,island,ctx={},rolls={}){
    const s=normalizeState(state),v=clone(voyage),key=routeKey(v.from,v.destination),route=routeRecord(s,v.from,v.destination);
    const clean=(v.incidents||0)===0,masteryGain=clamp(7+num(ctx.navigation)/18+(clean?4:0)+Number(rolls.mastery??.5)*6,5,18);
    route.trips++;route.mastery=clamp(route.mastery+masteryGain,0,100);route.lastYear=num(ctx.year);s.routeKnowledge[key]=route;s.successfulVoyages++;
    const ir=islandRecord(s,island),first=ir.visits===0;ir.visits++;const exploreGain=clamp((first?14:5)+num(ctx.navigation)/28+Number(rolls.exploration??.5)*8,4,24);
    ir.exploration=clamp(ir.exploration+exploreGain,0,100);ir.lastYear=num(ctx.year);s.islands[island]=ir;
    const oldPose=s.poseLevel;s.poseLevel=poseLevelFor(ctx.region,num(ctx.navigation),s.poseLevel);
    return {state:s,route,firstVisit:first,masteryGain:+masteryGain.toFixed(1),explorationGain:+exploreGain.toFixed(1),poseUpgrade:s.poseLevel>oldPose?{from:oldPose,to:s.poseLevel}:null}
  }
  function exploreIsland(state,island,ctx={},rolls={}){
    const s=normalizeState(state),ir=islandRecord(s,island),mode=ctx.mode||'explore',skill=clamp(num(ctx.navigation)*.35+num(ctx.stealth)*.25+num(ctx.knowledge)*.20+num(ctx.crewSupport)*.20,0,100);
    const remaining=100-ir.exploration,gain=clamp((mode==='hunt'?8:10)+remaining*.08+skill*.06+Number(rolls.progress??.5)*8,3,24);
    const before=ir.exploration;ir.exploration=clamp(ir.exploration+gain,0,100);ir.lastYear=num(ctx.year);
    const thresholdCross=[25,50,75,100].find(t=>before<t&&ir.exploration>=t);
    const chance=clamp((mode==='hunt'?.22:.15)+(100-before)/420+skill/500+(thresholdCross?.22:0),.08,.72);
    let discovery=null;
    if(Number(rolls.discovery??1)<chance){
      const ids=Object.keys(data.discoveries).filter(id=>!ir.discoveries.includes(id)||id==='treasure'||id==='resource'||id==='lead');
      const id=ids[Math.floor(clamp(Number(rolls.type??.5),0,.999999)*ids.length)]||'chart';discovery={id,...data.discoveries[id],threshold:thresholdCross||null};
      ir.discoveries.push(id);ir.discoveries=ir.discoveries.slice(-16);s.totalDiscoveries++;if(id==='treasure')s.treasures++
    }
    s.islands[island]=ir;return {state:s,island:ir,gain:+gain.toFixed(1),discovery,threshold:thresholdCross||null,chance:+chance.toFixed(3)}
  }
  function summary(state,currentIsland){
    const s=normalizeState(state),island=islandRecord(s,currentIsland),routes=Object.values(s.routeKnowledge);
    const mastered=routes.filter(r=>num(r.mastery)>=70).length;
    return {poseLevel:s.poseLevel,poseLabel:data.poseTiers[s.poseLevel]?.label||'Navigation',seaExperience:s.seaExperience,voyages:s.voyages,successfulVoyages:s.successfulVoyages,
      monthsAtSea:s.monthsAtSea,totalDiscoveries:s.totalDiscoveries,treasures:s.treasures,stormsSurvived:s.stormsSurvived,currentIsland:island,knownRoutes:routes.length,masteredRoutes:mastered}
  }

  registry.register('voyageEngineV85',{version:'8.5.0',normalizeState,routeKey,routeRecord,islandRecord,poseLevelFor,weatherFor,routeProfile,startVoyage,tickVoyage,arrive,exploreIsland,summary});
})(window);
