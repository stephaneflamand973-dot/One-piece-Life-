(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('crewDataV84');if(!data)throw new Error('Crew data V8.4 missing');
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));
  const pick=(arr,r=.5)=>arr?.length?arr[Math.min(arr.length-1,Math.floor(clamp(Number(r),0,.999999)*arr.length))]:null;

  function roleKey(role=''){
    const s=String(role).toLowerCase();
    for(const [id,r] of Object.entries(data.roles))if(r.aliases.some(a=>s.includes(a)))return id;
    return 'fighter'
  }
  function normalizeMember(m={},index=0){
    const role=roleKey(m.role),trait=data.traits[m.trait]?m.trait:'loyal';
    return {...m,id:m.id||('crew_'+index+'_'+String(m.name||'member').toLowerCase().replace(/[^a-z0-9]+/g,'_')),role:m.role||data.roles[role].label,roleKey:role,
      trait,position:m.position||'member',roleMastery:clamp(Number.isFinite(Number(m.roleMastery))?Number(m.roleMastery):Math.max(20,num(m.power)+10),0,100),
      power:clamp(num(m.power)||15,1,100),potentialPower:clamp(Math.max(num(m.potentialPower)||num(m.power)+18,num(m.power)||15),1,100),growthRate:clamp(num(m.growthRate)||1,.3,2),
      loyalty:clamp(Number.isFinite(Number(m.loyalty))?Number(m.loyalty):50,0,100),trust:clamp(Number.isFinite(Number(m.trust))?Number(m.trust):45,0,100),rivalry:clamp(num(m.rivalry),0,100),
      experience:clamp(num(m.experience),0,100),injuryMonths:Math.max(0,num(m.injuryMonths)),missions:Math.max(0,Math.floor(num(m.missions))),missionWins:Math.max(0,Math.floor(num(m.missionWins))),
      status:m.status||'active',joinedYear:Number.isFinite(Number(m.joinedYear))?Number(m.joinedYear):0,memories:Array.isArray(m.memories)?clone(m.memories).slice(0,10):[]}
  }
  function normalizeState(state={}){
    return {version:1,doctrine:data.doctrines[state.doctrine]?state.doctrine:'balanced',readiness:clamp(Number.isFinite(Number(state.readiness))?Number(state.readiness):55,0,100),
      supplies:clamp(Number.isFinite(Number(state.supplies))?Number(state.supplies):60,0,100),renown:clamp(num(state.renown),0,100),missions:Math.max(0,Math.floor(num(state.missions))),
      missionWins:Math.max(0,Math.floor(num(state.missionWins))),lastActionYear:Number.isFinite(Number(state.lastActionYear))?Number(state.lastActionYear):-99,
      lastDoctrineYear:Number.isFinite(Number(state.lastDoctrineYear))?Number(state.lastDoctrineYear):-99,lastRecruitYear:Number.isFinite(Number(state.lastRecruitYear))?Number(state.lastRecruitYear):-99,
      firstMateId:state.firstMateId||null,candidate:state.candidate?normalizeMember(state.candidate,99):null,pendingEvent:state.pendingEvent?clone(state.pendingEvent):null,
      totalRecruits:Math.max(0,Math.floor(num(state.totalRecruits))),totalInjuries:Math.max(0,Math.floor(num(state.totalInjuries))),totalPromotions:Math.max(0,Math.floor(num(state.totalPromotions))),
      history:Array.isArray(state.history)?clone(state.history).slice(0,30):[]}
  }
  function activeMembers(members=[]){return members.map(normalizeMember).filter(m=>m.status==='active')}
  function fitForMission(member,type){
    const m=normalizeMember(member),r=data.roles[m.roleKey],match=(r.mission||[]).includes(type)?1.25:.82;
    const injury=m.injuryMonths>0?.28:1,trait=data.traits[m.trait]||data.traits.loyal;
    return +(m.power*.42+m.roleMastery*.36+m.loyalty*.08+m.trust*.07+m.experience*.07)*match*injury*trait.leadership*(m.position==='first_mate'?1.08:1)
  }
  function missionTeam(members=[],type='combat',limit=3){
    return activeMembers(members).sort((a,b)=>fitForMission(b,type)-fitForMission(a,type)).slice(0,limit)
  }
  function coverage(members=[]){
    const active=activeMembers(members),present=new Set(active.map(m=>m.roleKey)),core=['fighter','navigator','doctor','carpenter'];
    const covered=core.filter(x=>present.has(x)).length,unique=present.size;
    return {coreCovered:covered,coreTotal:core.length,uniqueRoles:unique,score:+clamp(covered*16+unique*4+Math.min(12,active.length*1.5),0,100).toFixed(1),missing:core.filter(x=>!present.has(x))}
  }
  function metrics(state={},crew={},ctx={}){
    const s=normalizeState(state),active=activeMembers(crew.members||[]),cov=coverage(active),doctrine=data.doctrines[s.doctrine]||data.doctrines.balanced;
    if(!active.length)return {active:0,combat:0,travel:0,support:0,command:0,power:0,coverage:cov,readiness:s.readiness,supplies:s.supplies,synergy:0};
    let combat=0,travel=0,support=0,command=0,totalPower=0;
    for(const m of active){
      const r=data.roles[m.roleKey],inj=m.injuryMonths>0?.3:1,master=.55+m.roleMastery/220,loyal=.72+m.loyalty/360;
      combat+=m.power*r.combat*master*inj;travel+=m.power*r.travel*master*inj;support+=m.power*r.support*master*inj;command+=m.power*r.command*loyal*inj;totalPower+=m.power*inj
    }
    const morale=clamp(num(crew.morale)||50,0,100),cohesion=clamp(num(ctx.cohesion)||60,0,100),tension=clamp(num(ctx.tension)||15,0,100);
    const synergy=clamp((morale*.28+cohesion*.38+s.readiness*.18+s.supplies*.08+cov.score*.08)-tension*.18,0,100);
    const scale=(.72+synergy/250);
    return {active:active.length,combat:+(combat/Math.max(1,active.length)*scale*doctrine.combat).toFixed(1),travel:+(travel/Math.max(1,active.length)*scale*doctrine.travel).toFixed(1),
      support:+(support/Math.max(1,active.length)*scale*doctrine.support).toFixed(1),command:+(command/Math.max(1,active.length)*scale*doctrine.command).toFixed(1),
      power:+(totalPower*.58+combat*.16+command*.08).toFixed(1),coverage:cov,readiness:s.readiness,supplies:s.supplies,synergy:+synergy.toFixed(1)}
  }
  function missionSupport(state={},crew={},mission={},ctx={}){
    const s=normalizeState(state),team=missionTeam(crew.members||[],mission.type||'combat',3),m=metrics(s,crew,ctx),type=mission.type||'combat';
    const teamScore=team.reduce((sum,x)=>sum+fitForMission(x,type),0)/Math.max(1,team.length);
    const domain=['navigation','explore'].includes(type)?m.travel:['medicine','work'].includes(type)?m.support:type==='covert'?((m.travel+m.command)/2):m.combat;
    const supplyFactor=.75+s.supplies/240,readiness=.78+s.readiness/230;
    const bonus=clamp((teamScore*.07+domain*.035+m.synergy*.025+m.coverage.score*.018)*supplyFactor*readiness,0,18);
    return {bonus:+bonus.toFixed(1),team:team.map(x=>x.id),teamNames:team.map(x=>x.name),domain:+domain.toFixed(1),synergy:m.synergy}
  }
  function campaignSupport(state={},crew={},campaign={},ctx={}){
    const m=metrics(state,crew,ctx),phase=num(campaign.phaseIndex),focus=phase>=2?m.combat:(m.command+m.travel)/2;
    return +clamp(focus*.045+m.synergy*.025+m.coverage.score*.015,0,10).toFixed(1)
  }
  function candidateRole(members=[],roll=.5){
    const cov=coverage(members),missing=cov.missing;if(missing.length)return pick(missing,roll);
    const keys=Object.keys(data.roles).filter(x=>x!=='officer');return pick(keys,roll)
  }
  function recruitCandidate(ctx={},rolls={}){
    const role=candidateRole(ctx.members||[],rolls.role??.5),r=data.roles[role],trait=pick(Object.keys(data.traits),rolls.trait??.5)||'loyal';
    const name=(pick(data.firstNames,rolls.first??.5)||'Aren')+' '+(pick(data.surnames,rolls.last??.5)||'Vale');
    const quality=clamp(24+num(ctx.renown)*.22+num(ctx.worldRep)*.12+Number(rolls.quality??.5)*38,20,82),power=clamp(Math.round(quality*.58+Number(rolls.power??.5)*16),10,76);
    return normalizeMember({id:'recruit_'+Math.floor(Number(rolls.id??.5)*999999),name,role:r.label,roleKey:role,trait,power,potentialPower:clamp(power+12+Number(rolls.potential??.5)*28,power,100),
      growthRate:.72+Number(rolls.growth??.5)*.72,loyalty:42+Number(rolls.loyalty??.5)*32,trust:34+Number(rolls.trust??.5)*28,roleMastery:clamp(quality+Number(rolls.mastery??.5)*12,20,92),joinedYear:num(ctx.year)},99)
  }
  function recruitChance(candidate={},ctx={}){
    const c=normalizeMember(candidate),need=coverage(ctx.members||[]).missing.includes(c.roleKey)?8:0,rep=num(ctx.worldRep),renown=num(ctx.renown),command=num(ctx.command),size=activeMembers(ctx.members||[]).length;
    return +clamp(.38+rep/260+renown/260+command/350+need/100-size*.025,.18,.92).toFixed(3)
  }
  function applyManagement(state={},crew={},actionId,ctx={},roll=.5){
    const s=normalizeState(state),out={state:s,crew:clone(crew),success:true,notes:[]},a=data.managementActions[actionId];if(!a)return {...out,success:false,error:'unknown_action'};
    if(actionId==='drill'){s.readiness=clamp(s.readiness+8+Number(roll)*7,0,100);for(const m of out.crew.members||[])if(m.status==='active'){m.roleMastery=clamp(num(m.roleMastery)+2+Number(roll)*3,0,100);m.experience=clamp(num(m.experience)+2,0,100)}out.notes.push('préparation renforcée')}
    if(actionId==='bond'){out.crew.morale=clamp(num(out.crew.morale)+7+Number(roll)*5,0,100);for(const m of out.crew.members||[])if(m.status==='active'){m.loyalty=clamp(num(m.loyalty)+3+Number(roll)*4,0,100);m.trust=clamp(num(m.trust)+2+Number(roll)*3,0,100)}out.notes.push('cohésion renforcée')}
    if(actionId==='logistics'){s.supplies=clamp(s.supplies+14+Number(roll)*10,0,100);if(out.crew.ship)out.crew.ship.condition=clamp(num(out.crew.ship.condition)+10+Number(roll)*12,0,100);out.notes.push('réserves et navire consolidés')}
    if(actionId==='scout'){out.notes.push('recherche de recrue ouverte')}
    return out
  }
  function monthlyTick(state={},crew={},ctx={},months=1,rolls={}){
    const s=normalizeState(state),out=clone(crew),active=out.members||[];s.readiness=clamp(s.readiness-months*.28,0,100);s.supplies=clamp(s.supplies-months*(.45+active.filter(x=>x.status==='active').length*.035),0,100);
    for(let i=0;i<active.length;i++){
      const m=normalizeMember(active[i],i),trait=data.traits[m.trait]||data.traits.loyal;
      m.injuryMonths=Math.max(0,m.injuryMonths-months);
      const fit=(ctx.training==='hard'||ctx.training==='mastery')?1.15:ctx.training==='recover'?.55:1;
      m.roleMastery=clamp(m.roleMastery+months*.11*fit*trait.growth,0,100);
      if(m.injuryMonths<=0&&Number(rolls['injury'+i]??1)<clamp(.0025*months*trait.injury*(ctx.danger||1),.001,.04)){m.injuryMonths=1+Math.floor(Number(rolls['duration'+i]??.5)*4);s.totalInjuries++;m.memories.unshift({year:num(ctx.year),type:'injury',label:'Blessure en service',outcome:'injured'});}
      active[i]=m
    }
    out.members=active;return {state:s,crew:out}
  }
  function recordMission(state={},crew={},mission={},outcome='failure',ctx={},rolls={}){
    const s=normalizeState(state),out=clone(crew),support=missionSupport(s,out,mission,ctx),ids=new Set(support.team),win=['success','partial'].includes(outcome);s.missions++;if(win)s.missionWins++;
    for(let i=0;i<(out.members||[]).length;i++){
      let m=normalizeMember(out.members[i],i);if(!ids.has(m.id)){out.members[i]=m;continue}
      m.missions++;if(win)m.missionWins++;m.experience=clamp(m.experience+(win?4:2),0,100);m.roleMastery=clamp(m.roleMastery+(win?2.3:1.1),0,100);m.loyalty=clamp(m.loyalty+(win?1.5:-.5),0,100);
      const danger=mission.danger==='high'?1.6:mission.danger==='medium'?1:.55,trait=data.traits[m.trait]||data.traits.loyal;
      if(!win&&Number(rolls['injury'+i]??1)<clamp(.08*danger*trait.injury,.02,.25)){m.injuryMonths=Math.max(m.injuryMonths,1+Math.floor(Number(rolls['duration'+i]??.5)*4));s.totalInjuries++}
      m.memories.unshift({year:num(ctx.year),type:'mission',label:mission.title||'Mission',outcome});m.memories=m.memories.slice(0,10);out.members[i]=m
    }
    s.readiness=clamp(s.readiness+(win?3:-4),0,100);s.supplies=clamp(s.supplies-(mission.danger==='high'?7:mission.danger==='medium'?4:2),0,100);s.renown=clamp(s.renown+(outcome==='success'?3:outcome==='partial'?1:-1),0,100);
    return {state:s,crew:out,support}
  }
  function appointFirstMate(state={},crew={},memberId){
    const s=normalizeState(state),out=clone(crew),target=(out.members||[]).find(m=>m.id===memberId&&m.status==='active');if(!target)return {state:s,crew:out,error:'member_missing'};
    for(const m of out.members||[])if(m.position==='first_mate')m.position='member';target.position='first_mate';target.loyalty=clamp(num(target.loyalty)+4,0,100);target.trust=clamp(num(target.trust)+3,0,100);s.firstMateId=target.id;s.totalPromotions++;
    return {state:s,crew:out,member:normalizeMember(target)}
  }
  function summary(state={},crew={},ctx={}){
    const s=normalizeState(state),m=metrics(s,crew,ctx),active=activeMembers(crew.members||[]),first=active.find(x=>x.id===s.firstMateId)||active.find(x=>x.position==='first_mate')||null;
    return {doctrine:s.doctrine,doctrineLabel:data.doctrines[s.doctrine]?.label||s.doctrine,readiness:s.readiness,supplies:s.supplies,renown:s.renown,missions:s.missions,missionWins:s.missionWins,
      members:active,firstMate:first,metrics:m,coverage:m.coverage,winRate:s.missions?+(s.missionWins/s.missions*100).toFixed(1):0,candidate:s.candidate}
  }

  registry.register('crewEngineV84',{version:'8.4.0',roleKey,normalizeMember,normalizeState,activeMembers,fitForMission,missionTeam,coverage,metrics,missionSupport,campaignSupport,recruitCandidate,recruitChance,applyManagement,monthlyTick,recordMission,appointFirstMate,summary});
})(window);
