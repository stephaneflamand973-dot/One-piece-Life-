(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('factionIdentityDataV81');if(!data)throw new Error('Faction identity data V8.1 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function canonicalFaction(faction){
    const f=String(faction||'Civil');
    return data.aliases[f]||f;
  }
  function profile(faction){return data.factions[canonicalFaction(faction)]||data.factions.Civil}

  function normalizeState(state={},ctx={}){
    const faction=canonicalFaction(ctx.faction||state.currentFaction||'Civil');
    const changed=state.currentFaction&&canonicalFaction(state.currentFaction)!==faction;
    const p=profile(faction);
    const trust=clamp(num(ctx.trust)||50,0,100),discipline=clamp(num(ctx.discipline)||50,0,100);
    const defaultLoyalty=clamp(28+trust*.38+discipline*.18,18,72);
    const defaultAutonomy=faction==='Pirates'||faction==='Civil'||faction==='Chasseurs de primes'?64:faction==='Révolutionnaires'?52:40;
    const next={
      version:1,currentFaction:faction,
      identity:clamp(Number.isFinite(Number(state.identity))?Number(state.identity):42,0,100),
      loyalty:clamp(Number.isFinite(Number(state.loyalty))?Number(state.loyalty):defaultLoyalty,0,100),
      autonomy:clamp(Number.isFinite(Number(state.autonomy))?Number(state.autonomy):defaultAutonomy,0,100),
      pressure:clamp(Number.isFinite(Number(state.pressure))?Number(state.pressure):p.pressureBase,0,100),
      friction:clamp(Number.isFinite(Number(state.friction))?Number(state.friction):12,0,100),
      standingPeak:clamp(num(state.standingPeak),0,100),
      dutiesCompleted:Math.max(0,Math.floor(num(state.dutiesCompleted))),
      dutiesIgnored:Math.max(0,Math.floor(num(state.dutiesIgnored))),
      opportunitiesTaken:Math.max(0,Math.floor(num(state.opportunitiesTaken))),
      defections:Math.max(0,Math.floor(num(state.defections))),
      lastAnnualYear:Number.isFinite(Number(state.lastAnnualYear))?Number(state.lastAnnualYear):-99,
      lastDecisionYear:Number.isFinite(Number(state.lastDecisionYear))?Number(state.lastDecisionYear):-99,
      lastEventCheckYear:Number.isFinite(Number(state.lastEventCheckYear))?Number(state.lastEventCheckYear):-99,
      lastFactionChangeMonth:Number.isFinite(Number(state.lastFactionChangeMonth))?Number(state.lastFactionChangeMonth):-99,
      lastMissionMonth:Number.isFinite(Number(state.lastMissionMonth))?Number(state.lastMissionMonth):-99,
      history:Array.isArray(state.history)?clone(state.history).slice(0,24):[]
    };
    if(changed){
      next.defections++;
      next.history.unshift({kind:'faction_change',from:canonicalFaction(state.currentFaction),to:faction,month:num(ctx.month),year:num(ctx.year)});
      next.history=next.history.slice(0,24);
      next.currentFaction=faction;
      next.loyalty=clamp(defaultLoyalty-8,10,70);
      next.autonomy=clamp(defaultAutonomy+8,0,100);
      next.pressure=clamp(p.pressureBase+10,0,100);
      next.friction=clamp(Math.max(18,next.friction+8),0,100);
      next.lastFactionChangeMonth=num(ctx.month);
      next.lastDecisionYear=-99;
      next.lastEventCheckYear=-99;
    }
    return next
  }

  function status(state={},ctx={}){
    const s=normalizeState(state,ctx),p=profile(s.currentFaction);
    const standing=clamp(num(ctx.standing),0,100),trust=clamp(num(ctx.trust),0,100),discipline=clamp(num(ctx.discipline),0,100);
    const rankRatio=clamp(num(ctx.rankRatio),0,1),sanctions=Math.max(0,num(ctx.sanctions));
    const coherence=clamp((s.loyalty*.34+s.autonomy*.14+standing*.18+trust*.16+discipline*.12)-s.friction*.22-sanctions*3.5,0,100);
    const identity=clamp(coherence*.58+s.identity*.42,0,100);
    const pressure=clamp(s.pressure+p.pressureBase*.18+rankRatio*17+sanctions*8+Math.max(0,50-trust)*.16,0,100);
    const label=identity>=76?'Figure de la faction':identity>=58?'Membre affirmé':identity>=40?'Position stable':identity>=24?'Lien fragile':'Rupture possible';
    return {faction:s.currentFaction,profile:p,coherence:+coherence.toFixed(1),identity:+identity.toFixed(1),pressure:+pressure.toFixed(1),label};
  }

  function annualTick(state={},ctx={}){
    const s=normalizeState(state,ctx),year=num(ctx.year);
    if(s.lastAnnualYear===year)return {state:s,status:status(s,ctx),changed:false};
    const st=status(s,ctx),next=clone(s);
    const active=ctx.careerActive!==false;
    if(active){
      next.identity=clamp(next.identity+(st.coherence-50)*.035,0,100);
      next.pressure=clamp(next.pressure+profile(next.currentFaction).pressureBase*.04+num(ctx.rankRatio)*2.4-Math.max(0,next.friction-55)*.025,0,100);
      next.friction=clamp(next.friction+(next.pressure>72?1.6:next.loyalty<28?1.4:-.8),0,100);
      next.loyalty=clamp(next.loyalty+(num(ctx.trust)-50)*.025,0,100);
      next.standingPeak=Math.max(next.standingPeak,clamp(num(ctx.standing),0,100));
    }else{
      next.pressure=clamp(next.pressure-4,0,100);
      next.friction=clamp(next.friction-2,0,100);
    }
    next.lastAnnualYear=year;
    return {state:next,status:status(next,ctx),changed:true};
  }

  function eventWeights(state={},ctx={}){
    const s=normalizeState(state,ctx),st=status(s,ctx),p=profile(s.currentFaction);
    return (p.events||[]).map(e=>{
      let w=num(e.weight)||1;
      if(e.type==='duty')w*=.65+st.pressure/70;
      if(e.type==='friction')w*=.45+s.friction/45+Math.max(0,42-s.loyalty)/35;
      if(e.type==='opportunity')w*=.75+Math.max(0,num(ctx.standing)-30)/85+num(ctx.rankRatio)*.35;
      return {event:e,weight:Math.max(.05,w)};
    });
  }

  function chooseWeighted(items,roll=.5){
    const total=items.reduce((n,x)=>n+x.weight,0);if(total<=0)return items[0]?.event||null;
    let r=clamp(Number(roll)||0,0,.999999)*total;
    for(const x of items){r-=x.weight;if(r<=0)return x.event}
    return items[items.length-1]?.event||null
  }

  function eventCandidate(state={},ctx={},gateRoll=.5,pickRoll=.5){
    const s=normalizeState(state,ctx),year=num(ctx.year),age=num(ctx.age);
    if(ctx.careerActive===false||age<15||s.lastDecisionYear===year)return null;
    const st=status(s,ctx);
    const chance=clamp(.08+st.pressure/430+s.friction/650+num(ctx.rankRatio)*.07+(st.pressure>=82?.10:0),.10,.48);
    if(Number(gateRoll)>=chance&&st.pressure<90)return null;
    const event=chooseWeighted(eventWeights(s,ctx),pickRoll);if(!event)return null;
    const severity=clamp(event.type==='friction'?46+s.friction*.45:event.type==='duty'?40+st.pressure*.42:30+st.pressure*.24,20,92);
    const importance=clamp(46+st.pressure*.24+num(ctx.rankRatio)*14+(event.type==='friction'?s.friction*.12:0),42,92);
    return {id:event.id,type:event.type,event,importance:+importance.toFixed(1),severity:+severity.toFixed(1),mandatory:event.type==='duty'&&st.pressure>=88,status:st}
  }

  function choices(candidate){return candidate?.event?.choices||{}}

  function resolve(state={},candidate={},choiceId,ctx={}){
    const s=normalizeState(state,ctx),event=candidate.event||profile(s.currentFaction).events.find(e=>e.id===candidate.id);
    const choice=event?.choices?.[choiceId];if(!event||!choice)return {state:s,error:'unknown_choice'};
    const e=choice.effects||{},next=clone(s);
    for(const k of ['loyalty','autonomy','pressure','friction','identity'])next[k]=clamp(num(next[k])+num(e[k]),0,100);
    next.identity=clamp(next.identity+num(e.standing)*.18+num(e.trust)*.16+num(e.discipline)*.12+num(e.loyalty)*.22-num(e.sanctions)*2.5,0,100);
    next.dutiesCompleted+=Math.max(0,Math.floor(num(e.duty)));
    next.dutiesIgnored+=Math.max(0,Math.floor(num(e.ignored)));
    next.opportunitiesTaken+=Math.max(0,Math.floor(num(e.opportunity)));
    next.lastDecisionYear=num(ctx.year);
    next.history.unshift({kind:'decision',faction:next.currentFaction,event:event.id,eventType:event.type,choice:choiceId,year:num(ctx.year),month:num(ctx.month)});
    next.history=next.history.slice(0,24);
    const factionDelta={standing:num(e.standing),trust:num(e.trust),discipline:num(e.discipline),influence:num(e.influence),sanctions:num(e.sanctions),commendations:num(e.commendations)};
    return {state:next,event,choice,factionDelta,xp:Math.max(0,num(e.xp)),status:status(next,{...ctx,standing:num(ctx.standing)+num(e.standing),trust:num(ctx.trust)+num(e.trust),discipline:num(ctx.discipline)+num(e.discipline),sanctions:num(ctx.sanctions)+num(e.sanctions)})}
  }

  function missionImpact(state={},ctx={}){
    const s=normalizeState(state,ctx),next=clone(s),outcome=String(ctx.outcome||'failure');
    const aligned=ctx.aligned!==false,danger=String(ctx.danger||'medium');
    const scale=danger==='high'?1.45:danger==='medium'?1.08:.8;
    if(outcome==='success'){
      next.loyalty=clamp(next.loyalty+(aligned?2.8:1.3)*scale,0,100);
      next.identity=clamp(next.identity+(aligned?2.2:1)*scale,0,100);
      next.pressure=clamp(next.pressure-(aligned?2.5:1)*scale,0,100);
      next.friction=clamp(next.friction-(aligned?1.5:.5)*scale,0,100);
    }else if(outcome==='partial'){
      next.loyalty=clamp(next.loyalty+.6*scale,0,100);
      next.pressure=clamp(next.pressure+1.2*scale,0,100);
    }else if(outcome==='retreat'){
      next.pressure=clamp(next.pressure+2.2*scale,0,100);
      next.friction=clamp(next.friction+(aligned?1.4:.6)*scale,0,100);
    }else{
      next.loyalty=clamp(next.loyalty-1.8*scale,0,100);
      next.identity=clamp(next.identity-1.4*scale,0,100);
      next.pressure=clamp(next.pressure+4*scale,0,100);
      next.friction=clamp(next.friction+2.6*scale,0,100);
    }
    next.lastMissionMonth=num(ctx.month);
    next.history.unshift({kind:'mission',faction:next.currentFaction,outcome,aligned,month:num(ctx.month),year:num(ctx.year)});
    next.history=next.history.slice(0,24);
    return {state:next,status:status(next,ctx)}
  }

  function factionChange(state={},from,to,ctx={}){
    return normalizeState({...state,currentFaction:canonicalFaction(from||state.currentFaction)}, {...ctx,faction:canonicalFaction(to)} )
  }

  registry.register('factionIdentityEngineV81',{
    version:'8.1.0',canonicalFaction,profile,normalizeState,status,annualTick,eventWeights,eventCandidate,choices,resolve,missionImpact,factionChange
  });
})(window);
