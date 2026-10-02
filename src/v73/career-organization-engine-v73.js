(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('careerOrganizationsV73');if(!data)throw new Error('Career organization data V7.3 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function organization(faction){return data.organizations[faction]||data.organizations.Civil}

  function normalizeState(state={},faction='Civil'){
    const s={
      version:1,
      branch:state.branch||null,
      standing:clamp(num(state.standing)||30,0,100),
      trust:clamp(num(state.trust)||50,0,100),
      discipline:clamp(num(state.discipline)||50,0,100),
      influence:clamp(num(state.influence)||0,0,100),
      responsibility:state.responsibility||'member',
      commendations:Math.max(0,Math.floor(num(state.commendations))),
      sanctions:Math.max(0,Math.floor(num(state.sanctions))),
      missionRecord:{
        success:Math.max(0,Math.floor(num(state.missionRecord?.success))),
        partial:Math.max(0,Math.floor(num(state.missionRecord?.partial))),
        failure:Math.max(0,Math.floor(num(state.missionRecord?.failure))),
        retreat:Math.max(0,Math.floor(num(state.missionRecord?.retreat)))
      },
      lastReviewYear:Number.isFinite(Number(state.lastReviewYear))?Number(state.lastReviewYear):-99,
      lastReview:state.lastReview||null,
      lastActionYear:Number.isFinite(Number(state.lastActionYear))?Number(state.lastActionYear):-99,
      lastPoliticsYear:Number.isFinite(Number(state.lastPoliticsYear))?Number(state.lastPoliticsYear):-99,
      branchHistory:Array.isArray(state.branchHistory)?clone(state.branchHistory):[]
    };
    const org=organization(faction);
    if(s.branch&&!org.branches.some(b=>b.id===s.branch))s.branch=null;
    return s
  }

  function branchScore(branch,profile={}){
    const skills=profile.skills||{},stats=profile.stats||{};
    const skillValues=(branch.skills||[]).map(k=>num(skills[k]));
    const statValues=(branch.stats||[]).map(k=>num(stats[k]));
    const skillAvg=skillValues.length?skillValues.reduce((a,b)=>a+b,0)/skillValues.length:0;
    const statAvg=statValues.length?statValues.reduce((a,b)=>a+b,0)/statValues.length:0;
    let score=skillAvg*.62+statAvg*.38;
    const spec=String(profile.specialization||'').toLowerCase();
    const text=(branch.id+' '+branch.label+' '+branch.desc).toLowerCase();
    if(spec&&text.includes(spec))score+=8;
    const style=String(profile.combatStyle?.primary||'').toLowerCase();
    if(style.includes('sabreur')&&branch.skills?.includes('Combat'))score+=2;
    if(style.includes('tireur')&&branch.skills?.includes('Combat'))score+=1;
    return +score.toFixed(2)
  }

  function defaultBranch(faction,profile={}){
    const org=organization(faction);
    return org.branches
      .map(b=>({branch:b,score:branchScore(b,profile)}))
      .sort((a,b)=>b.score-a.score||a.branch.id.localeCompare(b.branch.id))[0]?.branch||org.branches[0]
  }

  function branchById(faction,id){return organization(faction).branches.find(b=>b.id===id)||null}

  function branchFit(faction,id,profile={}){
    const b=branchById(faction,id)||defaultBranch(faction,profile);
    return {branch:b,score:branchScore(b,profile)}
  }

  function missionAlignment(faction,branchId,mission={}){
    const b=branchById(faction,branchId);if(!b)return {aligned:false,bonus:0};
    const aligned=(b.missions||[]).includes(mission.type);
    return {aligned,bonus:aligned?3:0,branch:b}
  }

  function missionImpact(state,ctx={}){
    const s=normalizeState(state,ctx.faction);
    const outcome=String(ctx.outcome||'failure');
    const danger=String(ctx.danger||'medium');
    const dangerMult=danger==='high'?1.55:danger==='medium'?1.15:.8;
    const aligned=!!ctx.aligned;
    const d={standing:0,trust:0,discipline:0,influence:0,commendations:0,sanctions:0};
    if(outcome==='success'){
      d.standing=3.6*dangerMult+(aligned?1.2:0);
      d.trust=2.2*dangerMult;
      d.discipline=1.2;
      d.influence=(danger==='high'?2.2:1)+(aligned?.8:0);
      if(danger==='high')d.commendations=1;
    }else if(outcome==='partial'){
      d.standing=1.2*dangerMult;
      d.trust=.4;
      d.discipline=.4;
      d.influence=.4;
    }else if(outcome==='retreat'){
      d.standing=-1.1*dangerMult;
      d.trust=-.6;
      d.discipline=ctx.approach==='cautious'?1:-.4;
    }else{
      d.standing=-2.8*dangerMult;
      d.trust=-2*dangerMult;
      d.discipline=-1.2;
      if(danger==='high')d.sanctions=1;
    }
    return Object.fromEntries(Object.entries(d).map(([k,v])=>[k,+Number(v).toFixed(2)]))
  }

  function applyDelta(state,delta={},faction='Civil'){
    const s=normalizeState(state,faction),next=clone(s);
    for(const k of ['standing','trust','discipline','influence'])next[k]=clamp(num(next[k])+num(delta[k]),0,100);
    next.commendations=Math.max(0,Math.floor(num(next.commendations)+num(delta.commendations)));
    next.sanctions=Math.max(0,Math.floor(num(next.sanctions)+num(delta.sanctions)));
    return next
  }

  function recordMission(state,ctx={}){
    let next=normalizeState(state,ctx.faction);
    const outcome=['success','partial','failure','retreat'].includes(ctx.outcome)?ctx.outcome:'failure';
    next.missionRecord[outcome]++;
    next=applyDelta(next,missionImpact(next,ctx),ctx.faction);
    return next
  }

  function responsibilityFor(state,ctx={}){
    const s=normalizeState(state,ctx.faction),authority=num(ctx.authority),rankRatio=clamp(num(ctx.rankRatio),0,1);
    let best=data.responsibilities[0];
    for(const r of data.responsibilities){
      const rankGate=r.id==='strategic'?.72:r.id==='unit_lead'?.52:r.id==='team_lead'?.34:r.id==='specialist'?.16:0;
      if(authority>=r.minAuthority&&s.standing>=r.minStanding&&rankRatio>=rankGate)best=r
    }
    return best
  }

  function missionBonus(state,ctx={}){
    const s=normalizeState(state,ctx.faction),r=responsibilityFor(s,ctx),alignment=missionAlignment(ctx.faction,s.branch,ctx.mission||{});
    const trustBonus=Math.max(0,(s.trust-50)/30),standingBonus=Math.max(0,(s.standing-50)/35);
    return +(r.missionBonus+alignment.bonus+trustBonus+standingBonus).toFixed(2)
  }

  function recordTotals(record={}){
    const success=num(record.success),partial=num(record.partial),failure=num(record.failure),retreat=num(record.retreat);
    const total=success+partial+failure+retreat;
    const quality=total?(success+partial*.45+retreat*.18)/total:.5;
    return {total,quality:+quality.toFixed(3),success,partial,failure,retreat}
  }

  function promotionReview(state,ctx={}){
    const s=normalizeState(state,ctx.faction),rankIndex=Math.max(0,Math.floor(num(ctx.rankIndex))),rankCount=Math.max(2,Math.floor(num(ctx.rankCount)||2));
    const xp=num(ctx.xp),xpNeed=Math.max(1,num(ctx.xpNeed)),skill=num(ctx.skillScore),skillNeed=Math.max(1,num(ctx.skillNeed));
    const standingNeed=clamp(26+rankIndex*4.2,26,72);
    const trustNeed=clamp(30+rankIndex*3.3,30,68);
    const influenceNeed=rankIndex>=Math.ceil(rankCount*.62)?clamp(8+(rankIndex-rankCount*.55)*7,8,42):0;
    const rec=recordTotals(s.missionRecord);
    const sanctionsPenalty=Math.min(22,s.sanctions*5);
    const dossier=clamp(
      Math.min(1.2,xp/xpNeed)*24+
      Math.min(1.2,skill/skillNeed)*24+
      s.standing*.20+s.trust*.12+s.discipline*.08+s.influence*.07+
      rec.quality*12+s.commendations*1.8-sanctionsPenalty,
      0,120
    );
    const gates={
      xp:xp>=xpNeed,
      skill:skill>skillNeed,
      standing:s.standing>=standingNeed,
      trust:s.trust>=trustNeed,
      influence:s.influence>=influenceNeed,
      sanctions:s.sanctions<=Math.max(1,Math.floor(rankIndex/3)+1)
    };
    const eligible=Object.values(gates).every(Boolean);
    const approvalChance=clamp(.36+(dossier-62)/95+(s.commendations-s.sanctions)*.025,.08,.97);
    const missing=[];
    if(!gates.xp)missing.push('expérience');
    if(!gates.skill)missing.push('compétences');
    if(!gates.standing)missing.push('standing interne');
    if(!gates.trust)missing.push('confiance');
    if(!gates.influence)missing.push('influence');
    if(!gates.sanctions)missing.push('sanctions');
    return {eligible,gates,missing,dossier:+dossier.toFixed(1),approvalChance:+approvalChance.toFixed(3),standingNeed:+standingNeed.toFixed(1),trustNeed:+trustNeed.toFixed(1),influenceNeed:+influenceNeed.toFixed(1),record:rec}
  }

  function resolvePromotion(review,roll=.5){
    if(!review?.eligible)return {approved:false,reason:'ineligible'};
    return {approved:Number(roll)<num(review.approvalChance),reason:Number(roll)<num(review.approvalChance)?'approved':'deferred'}
  }

  function internalAction(state,id,ctx={}){
    const s=normalizeState(state,ctx.faction),a=data.internalActions[id];if(!a)return {state:s,error:'unknown_action'};
    const standing=s.standing+num(a.standing),influence=s.influence+num(a.influence);
    let trust=num(a.trust),discipline=num(a.discipline);
    if(id==='ambition'&&s.standing<45)trust-=3;
    if(id==='field'&&num(ctx.energy)<35)trust-=1.5;
    const next=applyDelta(s,{standing:a.standing,trust,discipline,influence:a.influence},ctx.faction);
    return {state:next,action:a,xp:num(a.xp),risk:num(a.risk)}
  }

  function politicsEvent(state,ctx={},roll=.5){
    const s=normalizeState(state,ctx.faction);
    const pressure=clamp((100-s.trust)*.34+s.influence*.22+s.sanctions*8+Math.max(0,s.standing-65)*.12,0,100);
    if(Number(roll)>.14+pressure/220)return null;
    if(s.sanctions>=2||s.trust<32)return {id:'scrutiny',title:'Examen interne',desc:'Tes supérieurs ou partenaires réévaluent ta fiabilité.',delta:{standing:-3,trust:-4,influence:-1}};
    if(s.influence>=55&&s.standing>=58)return {id:'backing',title:'Soutien interne',desc:'Ton réseau commence à défendre activement tes décisions.',delta:{standing:3,trust:2,influence:2}};
    if(s.influence>=35&&s.trust<48)return {id:'rivalry',title:'Rivalité interne',desc:'Ta montée en influence crée une opposition dans l’organisation.',delta:{standing:-1,trust:-2,influence:1}};
    return {id:'opportunity',title:'Responsabilité imprévue',desc:'Une place se libère et ton nom circule parmi les candidats.',delta:{standing:2,trust:2,influence:2}}
  }

  registry.register('careerOrganizationEngineV73',{
    version:'7.3.0',organization,normalizeState,branchScore,defaultBranch,branchById,branchFit,
    missionAlignment,missionImpact,applyDelta,recordMission,responsibilityFor,missionBonus,
    recordTotals,promotionReview,resolvePromotion,internalAction,politicsEvent
  });
})(window);
