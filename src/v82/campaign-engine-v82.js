(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('campaignDataV82');if(!data)throw new Error('Campaign data V8.2 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function normalizeCampaign(c={}){
    return {
      id:c.id||null,region:c.region||'Grand Line',archetype:c.archetype||'territory',title:c.title||'Saga régionale',
      incumbent:c.incumbent||'Marine',challenger:c.challenger||'Pirates',
      incumbentStart:clamp(num(c.incumbentStart)||50,0,100),challengerStart:clamp(num(c.challengerStart)||40,0,100),
      balance:clamp(Number.isFinite(Number(c.balance))?Number(c.balance):42,0,100),
      stakes:clamp(Number.isFinite(Number(c.stakes))?Number(c.stakes):20,0,100),
      threat:clamp(Number.isFinite(Number(c.threat))?Number(c.threat):50,0,100),
      phaseIndex:clamp(Math.floor(num(c.phaseIndex)),0,data.phases.length-1),
      startedYear:Math.floor(num(c.startedYear)),lastTickYear:Number.isFinite(Number(c.lastTickYear))?Number(c.lastTickYear):-99,
      targetYears:clamp(Math.floor(num(c.targetYears)||3),2,5),
      playerSide:['incumbent','challenger','independent'].includes(c.playerSide)?c.playerSide:null,
      playerContribution:+num(c.playerContribution).toFixed(2),playerSetbacks:+num(c.playerSetbacks).toFixed(2),
      lastDecisionPhase:Number.isFinite(Number(c.lastDecisionPhase))?Number(c.lastDecisionPhase):-1,
      pendingDecisionPhase:Number.isFinite(Number(c.pendingDecisionPhase))?Number(c.pendingDecisionPhase):0,
      boss:c.boss?clone(c.boss):null,localFigure:c.localFigure?clone(c.localFigure):null,
      lastSwing:+num(c.lastSwing).toFixed(2),status:c.status||'active',winner:c.winner||null,loser:c.loser||null,
      resolution:c.resolution||null,history:Array.isArray(c.history)?clone(c.history).slice(0,24):[]
    }
  }

  function normalizeState(state={},regions=[]){
    const out={version:1,regions:{},totalStarted:Math.max(0,Math.floor(num(state.totalStarted))),totalResolved:Math.max(0,Math.floor(num(state.totalResolved))),totalPlayerDecisions:Math.max(0,Math.floor(num(state.totalPlayerDecisions))),lastAnnualYear:Number.isFinite(Number(state.lastAnnualYear))?Number(state.lastAnnualYear):-99};
    for(const r of regions){
      const prev=state.regions?.[r]||{};
      out.regions[r]={
        active:prev.active?normalizeCampaign(prev.active):null,
        history:Array.isArray(prev.history)?clone(prev.history).slice(0,12):[],
        cooldownUntil:Number.isFinite(Number(prev.cooldownUntil))?Number(prev.cooldownUntil):-99,
        totalStarted:Math.max(0,Math.floor(num(prev.totalStarted))),
        totalResolved:Math.max(0,Math.floor(num(prev.totalResolved)))
      }
    }
    return out
  }

  function archetypeFor(incumbent,challenger){
    const pair=new Set([incumbent,challenger]);
    if(pair.has('Pirates')&&(pair.has('Marine')||pair.has('Gouvernement')))return incumbent==='Pirates'?'crackdown':'pirate_front';
    if(pair.has('Révolutionnaires')&&(pair.has('Marine')||pair.has('Gouvernement')))return 'uprising';
    if(pair.has('Chasseurs de primes')|| (incumbent==='Pirates'&&challenger==='Pirates'))return 'hunt';
    if(pair.has('Gouvernement')&&pair.has('Marine'))return 'shadow_conflict';
    return 'territory'
  }

  function startChance(ctx={}){
    const crisis=clamp(num(ctx.crisis),0,100),contest=clamp(num(ctx.contest),0,100),projects=Math.max(0,num(ctx.projects)),crews=Math.max(0,num(ctx.crews));
    return +clamp(.04+Math.max(0,crisis-38)/180+contest/520+Math.min(.08,(projects+crews)*.012),.04,.42).toFixed(3)
  }

  function shouldStart(regionState={},ctx={},year=0,roll=.5){
    if(regionState.active||year<num(regionState.cooldownUntil))return false;
    if(num(ctx.crisis)<34&&num(ctx.contest)<58)return false;
    return Number(roll)<startChance(ctx)
  }

  function chooseFrom(arr=[],roll=.5){return arr.length?arr[Math.min(arr.length-1,Math.floor(clamp(Number(roll),0,.999999)*arr.length))]:null}

  function figureFor(region,faction,kind,roll=.5,power=50){
    const flavor=data.regionFlavor[region]||data.regionFlavor['Grand Line'];
    const pool=kind==='boss'?flavor.bosses:flavor.figures;
    const role=chooseFrom(pool,roll)|| (kind==='boss'?'Chef adverse':'Figure locale');
    return {id:(kind==='boss'?'boss_':'figure_')+region.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+Math.floor(Number(roll)*9999),name:role,faction,role,power:clamp(Math.round(num(power)),12,100)}
  }

  function startCampaign(ctx={},year=0,rolls={}){
    const incumbent=ctx.leader||'Marine',challenger=ctx.second||'Pirates';
    const archetype=archetypeFor(incumbent,challenger),a=data.archetypes[archetype]||data.archetypes.territory;
    const region=ctx.region||'Grand Line',flavor=data.regionFlavor[region]||data.regionFlavor['Grand Line'];
    const gap=num(ctx.leaderInfluence)-num(ctx.secondInfluence);
    const balance=clamp(44-gap*.7+(Number(rolls.balance??.5)-.5)*8,24,58);
    const threat=clamp(num(ctx.crisis)*.62+num(ctx.contest)*.28+Math.max(num(ctx.leaderInfluence),num(ctx.secondInfluence))*.18,30,96);
    const targetYears=clamp(2+Math.floor(threat/28)+(Number(rolls.duration??.5)>.68?1:0),2,5);
    const bossFaction=challenger;
    const localFaction=incumbent;
    const boss=figureFor(region,bossFaction,'boss',rolls.boss??.5,40+threat*.55);
    const localFigure=figureFor(region,localFaction,'figure',rolls.figure??.5,30+num(ctx.leaderInfluence)*.42);
    return normalizeCampaign({
      id:'campaign_'+region.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+year,
      region,archetype,title:a.label+' • '+region,incumbent,challenger,
      incumbentStart:num(ctx.leaderInfluence),challengerStart:num(ctx.secondInfluence),balance,stakes:clamp(22+num(ctx.crisis)*.22,18,48),threat,
      phaseIndex:0,startedYear:year,lastTickYear:year-1,targetYears,playerSide:null,playerContribution:0,playerSetbacks:0,
      lastDecisionPhase:-1,pendingDecisionPhase:0,boss,localFigure,status:'active',
      history:[{kind:'start',year,label:a.label,desc:'La lutte pour '+flavor.stakes+' devient une campagne durable.'}]
    })
  }

  function phase(campaign={}){return data.phases[clamp(Math.floor(num(campaign.phaseIndex)),0,data.phases.length-1)]}

  function desiredPhase(campaign={}){
    const stakes=num(campaign.stakes);
    let idx=0;for(let i=0;i<data.phases.length;i++)if(stakes>=data.phases[i].threshold)idx=i;
    return idx
  }

  function resolveCampaign(campaign={},winner,year=0,reason='balance'){
    const c=normalizeCampaign(campaign);c.status='resolved';c.winner=winner;c.loser=winner===c.incumbent?c.challenger:c.incumbent;
    const margin=Math.abs(c.balance-50),quality=margin>=28?'decisive':margin>=16?'clear':'narrow';
    c.resolution={year,reason,quality,margin:+margin.toFixed(1),winner:c.winner,loser:c.loser};
    c.history.unshift({kind:'resolution',year,label:'Campagne résolue',winner:c.winner,quality});
    c.history=c.history.slice(0,24);return c
  }

  function annualTick(campaign={},ctx={},year=0,roll=.5){
    let c=normalizeCampaign(campaign);if(c.status!=='active'||c.lastTickYear===year)return {campaign:c,changed:false,phaseChanged:false,resolved:false};
    const elapsed=Math.max(1,year-c.startedYear+1);
    const influencePush=(num(ctx.challengerInfluence)-num(ctx.incumbentInfluence))*.13;
    const crisisPush=(num(ctx.crisis)-55)*.035;
    const noise=(Number(roll)-.5)*(8+num(ctx.contest)*.045);
    const fatigue=elapsed>c.targetYears?((elapsed-c.targetYears)*1.8):0;
    const swing=clamp(influencePush+crisisPush+noise+(c.balance>=50?fatigue:-fatigue),-13,13);
    c.balance=clamp(c.balance+swing,0,100);c.lastSwing=+swing.toFixed(2);
    c.stakes=clamp(c.stakes+7+num(ctx.crisis)*.055+num(ctx.contest)*.035+Math.abs(swing)*.18,0,100);
    const oldPhase=c.phaseIndex,newPhase=Math.max(oldPhase,desiredPhase(c));c.phaseIndex=newPhase;
    const phaseChanged=newPhase>oldPhase;if(phaseChanged)c.pendingDecisionPhase=newPhase;
    c.lastTickYear=year;c.history.unshift({kind:'tick',year,balance:+c.balance.toFixed(1),stakes:+c.stakes.toFixed(1),phase:newPhase,swing:c.lastSwing});c.history=c.history.slice(0,24);
    let resolved=false;
    if(c.balance<=16){c=resolveCampaign(c,c.incumbent,year,'collapse_challenger');resolved=true}
    else if(c.balance>=84){c=resolveCampaign(c,c.challenger,year,'collapse_incumbent');resolved=true}
    else if(elapsed>=c.targetYears&&c.phaseIndex>=3){c=resolveCampaign(c,c.balance>=50?c.challenger:c.incumbent,year,'campaign_end');resolved=true}
    return {campaign:c,changed:true,phaseChanged,resolved}
  }

  function decisionCandidate(campaign={},ctx={}){
    const c=normalizeCampaign(campaign);if(c.status!=='active'||ctx.region!==c.region||num(ctx.age)<15)return null;
    if(c.pendingDecisionPhase<=c.lastDecisionPhase)return null;
    const p=phase(c),bossPhase=c.phaseIndex>=2;
    const importance=clamp(p.importance+c.threat*.18+c.stakes*.16+(bossPhase?7:0),48,96);
    const severity=clamp(35+c.threat*.42+c.stakes*.20+(bossPhase?8:0),35,96);
    return {id:c.id+'_phase_'+c.phaseIndex,campaignId:c.id,phaseIndex:c.phaseIndex,importance:+importance.toFixed(1),severity:+severity.toFixed(1),mandatory:c.phaseIndex>=2&&c.stakes>=86,bossPhase};
  }

  function decision(campaign={},ctx={}){
    const c=normalizeCampaign(campaign),p=phase(c),a=data.archetypes[c.archetype]||data.archetypes.territory;
    let ids;
    if(!c.playerSide)ids=['incumbent','challenger','independent'];
    else ids=c.phaseIndex>=2?['direct','coordinate','covert','preserve','withdraw']:['direct','coordinate','covert','withdraw'];
    const title=c.title+' • '+p.label;
    const bossText=c.phaseIndex>=2&&c.boss?' '+c.boss.name+' devient l’un des points de fixation du conflit.':'';
    const text=a.desc+' Rapport de force : '+c.incumbent+' '+Math.round(100-c.balance)+' / '+c.challenger+' '+Math.round(c.balance)+'.'+bossText;
    return {title,text,choices:ids.map(id=>({id,...data.tactics[id]}))}
  }

  function abilityScore(tactic={},ctx={}){
    const skill=num(ctx.skills?.[tactic.skill]),stat=num(ctx.stats?.[tactic.skill]);
    const primary=Math.max(skill,stat);
    return primary*.58+num(ctx.power)*.22+num(ctx.authority)*.10+num(ctx.organization)*.06+num(ctx.worldRep)*.04
  }

  function resolveDecision(campaign={},choiceId,ctx={},roll=.5){
    let c=normalizeCampaign(campaign);const tactic=data.tactics[choiceId];if(!tactic)return {campaign:c,error:'unknown_choice'};
    const p=phase(c);
    if(!c.playerSide&&tactic.side)c.playerSide=tactic.side;
    const side=c.playerSide||tactic.side||'independent';
    const bossBonus=c.phaseIndex>=2?num(c.boss?.power)*.16:0;
    const difficulty=clamp(p.baseDifficulty+c.threat*.15+bossBonus-(side==='independent'?5:0),42,92);
    const ability=abilityScore(tactic,ctx),chance=choiceId==='withdraw'?1:clamp(.46+(ability-difficulty)/105,.08,.93),success=Number(roll)<chance;
    const baseImpact=num(tactic.impact)||(tactic.side?5:0),impact=choiceId==='withdraw'?0:baseImpact*(success?1:-.48);
    const direction=side==='challenger'?1:side==='incumbent'?-1:0;
    if(direction)c.balance=clamp(c.balance+direction*impact,0,100);
    if(side==='independent')c.stakes=clamp(c.stakes-(success?(num(tactic.stability)||4):0),0,100);
    else c.stakes=clamp(c.stakes+(success?1.5:3.5),0,100);
    if(success)c.playerContribution=+(c.playerContribution+Math.abs(impact)).toFixed(2);else c.playerSetbacks=+(c.playerSetbacks+Math.abs(impact)).toFixed(2);
    c.lastDecisionPhase=c.phaseIndex;c.pendingDecisionPhase=c.phaseIndex;
    c.history.unshift({kind:'player',year:num(ctx.year),phase:c.phaseIndex,choice:choiceId,side,success,impact:+impact.toFixed(2)});c.history=c.history.slice(0,24);
    return {campaign:c,tactic,side,success,chance:+chance.toFixed(3),ability:+ability.toFixed(1),difficulty:+difficulty.toFixed(1),impact:+impact.toFixed(2)}
  }

  function missionCandidate(campaign={},ctx={}){
    const c=normalizeCampaign(campaign);if(c.status!=='active'||ctx.region!==c.region)return null;
    const a=data.archetypes[c.archetype]||data.archetypes.territory,p=phase(c);
    let side=c.playerSide;
    if(!side){
      if(ctx.playerFaction===c.incumbent)side='incumbent';
      else if(ctx.playerFaction===c.challenger)side='challenger';
      else side='independent'
    }
    const type=a.types[Math.min(a.types.length-1,c.phaseIndex%a.types.length)]||'combat';
    const danger=c.phaseIndex>=2||c.threat>=72?'high':c.threat>=48?'medium':'low';
    const verb=a.verbs[side]||a.verbs.independent;
    const title=(c.phaseIndex>=2?'Opération décisive : ':'Campagne : ')+verb;
    const desc='La saga « '+c.title+' » entre dans sa phase '+p.label.toLowerCase()+'. Cette mission peut modifier durablement son rapport de force.';
    const enemyName=side==='incumbent'?(c.boss?.name||c.challenger):side==='challenger'?(c.localFigure?.name||c.incumbent):(c.boss?.name||'forces en présence');
    return {title,desc,danger,type,sourceType:'campaign',sourceId:c.id,campaignId:c.id,campaignSide:side,targetFaction:side==='incumbent'?c.challenger:side==='challenger'?c.incumbent:null,causalMode:'campaign',cause:c.title+' • '+p.label+' • équilibre '+Math.round(c.balance)+'/100',enemyName,importance:Math.round(clamp(p.importance+c.threat*.18,45,96))}
  }

  function missionImpact(campaign={},ctx={}){
    let c=normalizeCampaign(campaign);if(c.status!=='active')return {campaign:c,swing:0};
    const side=ctx.side||c.playerSide||'independent',outcome=String(ctx.outcome||'failure'),danger=String(ctx.danger||'medium');
    const scale=danger==='high'?1.35:danger==='medium'?1:.72;
    const base=outcome==='success'?7:outcome==='partial'?3:outcome==='retreat'?-2:-5;
    const swing=base*scale;
    if(side==='incumbent')c.balance=clamp(c.balance-swing,0,100);
    else if(side==='challenger')c.balance=clamp(c.balance+swing,0,100);
    else c.stakes=clamp(c.stakes-(outcome==='success'?4:outcome==='partial'?1:-2)*scale,0,100);
    if(outcome==='success'||outcome==='partial')c.playerContribution=+(c.playerContribution+Math.max(0,swing)).toFixed(2);
    else c.playerSetbacks=+(c.playerSetbacks+Math.abs(swing)).toFixed(2);
    c.history.unshift({kind:'mission',year:num(ctx.year),side,outcome,swing:+swing.toFixed(2)});c.history=c.history.slice(0,24);
    return {campaign:c,swing:+swing.toFixed(2),side}
  }

  function summary(campaign={}){
    const c=normalizeCampaign(campaign),p=phase(c);
    return {id:c.id,region:c.region,title:c.title,phase:p.label,phaseIndex:c.phaseIndex,balance:+c.balance.toFixed(1),stakes:+c.stakes.toFixed(1),threat:+c.threat.toFixed(1),incumbent:c.incumbent,challenger:c.challenger,playerSide:c.playerSide,playerContribution:+c.playerContribution.toFixed(1),boss:c.boss,localFigure:c.localFigure,status:c.status,winner:c.winner,resolution:c.resolution}
  }

  registry.register('campaignEngineV82',{version:'8.2.0',normalizeCampaign,normalizeState,archetypeFor,startChance,shouldStart,startCampaign,phase,desiredPhase,annualTick,decisionCandidate,decision,resolveDecision,missionCandidate,missionImpact,summary,resolveCampaign});
})(window);
