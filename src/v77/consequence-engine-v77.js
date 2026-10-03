(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('consequenceDataV77');if(!data)throw new Error('V7.7 consequence data missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function normalizeState(state={}){
    return {
      version:1,
      active:Array.isArray(state.active)?state.active.filter(Boolean).slice(0,24):[],
      history:Array.isArray(state.history)?state.history.filter(Boolean).slice(0,60):[],
      totalCreated:Math.max(0,Math.floor(num(state.totalCreated))),
      totalResolved:Math.max(0,Math.floor(num(state.totalResolved))),
      totalEscalated:Math.max(0,Math.floor(num(state.totalEscalated))),
      lastTickMonth:Number.isFinite(Number(state.lastTickMonth))?Number(state.lastTickMonth):-99
    }
  }

  function severityLabel(value){
    const v=clamp(num(value),0,100);
    return data.severityLabels.find(x=>v>=x.min)?.label||'Faible'
  }

  function triggerTypes(trigger={},ctx={}){
    const domain=trigger.domain||'decision';
    const map=data.triggerMap[domain]||{};
    const key=trigger.key||trigger.outcome||'default';
    let types=map[key]||map.default||[];
    if(domain==='decision'&&trigger.actionRoot)types=map[trigger.actionRoot]||map.default||types;
    if(trigger.relationTone==='positive')types=data.triggerMap.social.positive;
    if(trigger.relationTone==='negative')types=data.triggerMap.social.negative;
    if(ctx.hasFruit&&domain==='decision'&&trigger.actionRoot==='fruit')types=['fruit_heat','reputation_echo'];
    return [...new Set(types)].filter(t=>data.consequenceTypes[t])
  }

  function triggerScore(trigger={},ctx={}){
    let score=32+num(trigger.importance)*.34+num(trigger.risk)*.28+num(trigger.severity)*.22;
    if(trigger.major)score+=12;
    if(trigger.outcome==='failure'||trigger.outcome==='defeat')score+=9;
    if(trigger.outcome==='success'||trigger.outcome==='decisive')score+=4;
    if(trigger.actionRoot==='fruit')score+=10;
    if(trigger.actionRoot==='captain'||trigger.actionRoot==='command')score+=7;
    if(num(ctx.reputation)>=50)score+=6;
    if(num(ctx.worldDivergence)>=40)score+=5;
    return +clamp(score,0,100).toFixed(1)
  }

  function create(trigger={},ctx={},rolls={}){
    const types=triggerTypes(trigger,ctx);if(!types.length)return null;
    const score=triggerScore(trigger,ctx);
    const gate=clamp(.18+score/170+(trigger.major?.06:0),.16,.78);
    if(Number(rolls.gate??.5)>=gate)return null;
    const idx=Math.min(types.length-1,Math.floor(clamp(Number(rolls.type??.5),0,.999999)*types.length));
    const type=types[idx],def=data.consequenceTypes[type];
    const delayMin=def.delay?.[0]??4,delayMax=def.delay?.[1]??12;
    const delay=Math.round(delayMin+(delayMax-delayMin)*clamp(Number(rolls.delay??.5),0,1));
    const severity=clamp(Math.round(def.severity+(score-50)*.32+(Number(rolls.severity??.5)-.5)*16),18,92);
    return {
      id:'c77_'+String(ctx.nowMonth||0)+'_'+String(trigger.sourceId||trigger.actionRoot||trigger.domain||'event')+'_'+type,
      type,
      status:'pending',
      title:def.label,
      desc:def.desc,
      tone:def.tone,
      sourceDomain:trigger.domain||'decision',
      sourceId:trigger.sourceId||null,
      sourceLabel:trigger.sourceLabel||null,
      region:ctx.region||null,
      faction:ctx.faction||null,
      relationId:trigger.relationId||null,
      createdMonth:num(ctx.nowMonth),
      dueMonth:num(ctx.nowMonth)+delay,
      severity,
      chainDepth:Math.max(0,Math.floor(num(trigger.chainDepth))),
      meta:clone(trigger.meta||{})
    }
  }

  function due(state={},nowMonth=0){
    return normalizeState(state).active
      .filter(c=>c.status==='pending'&&num(c.dueMonth)<=num(nowMonth))
      .sort((a,b)=>num(b.severity)-num(a.severity)||num(a.dueMonth)-num(b.dueMonth))
  }

  function approachScore(approach='none',ctx={}){
    const stats=ctx.stats||{},skills=ctx.skills||{};
    const map={
      combat:Math.max(num(skills.Combat),num(skills.Sabre),num(skills.Tir),num(ctx.power)),
      social:Math.max(num(skills.Commandement),num(ctx.reputation),num(ctx.relationStrength)),
      command:Math.max(num(skills.Commandement),num(stats.Volonté),num(ctx.authority)),
      discipline:Math.max(num(stats.Discipline),num(skills.Commandement),num(ctx.standing)),
      stealth:Math.max(num(skills.Discrétion),num(stats.Réflexes),num(ctx.observation)),
      endurance:Math.max(num(stats.Endurance),num(stats.Résistance),num(ctx.health)),
      navigation:Math.max(num(skills.Navigation),num(stats.Réflexes),num(ctx.worldKnowledge)),
      money:num(ctx.money)>=10000?72:num(ctx.money)>=5000?58:num(ctx.money)>=2500?42:24,
      none:50
    };
    return clamp(num(map[approach]??50),0,100)
  }

  function choices(consequence={},ctx={}){
    const def=data.consequenceTypes[consequence.type];if(!def?.interactive)return[];
    return Object.entries(def.choices||{}).map(([id,c])=>{
      const skill=approachScore(c.approach,ctx),sev=num(consequence.severity);
      const chance=clamp(num(c.base)+((skill-50)/180)-((sev-50)/260),.08,.97);
      return {id,label:c.label,approach:c.approach,chance:+chance.toFixed(3),success:c.success||{},fail:c.fail||{},spawn:c.spawn||null}
    })
  }

  function resolve(consequence={},choiceId,ctx={},roll=.5){
    const def=data.consequenceTypes[consequence.type];if(!def)return {error:'unknown_consequence'};
    if(!def.interactive){
      const success=Number(roll)<.62;
      return {success,chance:.62,effects:clone(success?def.auto?.success||{}:def.auto?.failure||{}),spawn:null}
    }
    const option=choices(consequence,ctx).find(x=>x.id===choiceId);if(!option)return {error:'invalid_choice'};
    const success=Number(roll)<option.chance;
    return {
      success,
      chance:option.chance,
      option,
      effects:clone(success?option.success:option.fail),
      spawn:success?null:option.spawn||null
    }
  }

  function spawnFrom(parent={},type,ctx={},roll=.5){
    const def=data.consequenceTypes[type];if(!def||num(parent.chainDepth)>=3)return null;
    const d0=def.delay?.[0]??4,d1=def.delay?.[1]??12;
    const delay=Math.round(d0+(d1-d0)*clamp(Number(roll),0,1));
    return {
      id:'c77_'+String(ctx.nowMonth||0)+'_'+String(parent.id||'chain')+'_'+type,
      type,status:'pending',title:def.label,desc:def.desc,tone:def.tone,
      sourceDomain:'chain',sourceId:parent.id||null,sourceLabel:parent.title||null,
      region:parent.region||ctx.region||null,faction:parent.faction||ctx.faction||null,
      relationId:parent.relationId||null,createdMonth:num(ctx.nowMonth),dueMonth:num(ctx.nowMonth)+delay,
      severity:clamp(Math.round(num(parent.severity)+4+(Number(roll)-.5)*8),24,95),
      chainDepth:num(parent.chainDepth)+1,meta:{parentType:parent.type}
    }
  }

  function preview(consequence={},ctx={}){
    const def=data.consequenceTypes[consequence.type]||{};
    const cs=choices(consequence,ctx);
    return {
      label:def.label||consequence.title||'Conséquence',
      desc:def.desc||consequence.desc||'',
      tone:def.tone||consequence.tone||'mixed',
      severity:num(consequence.severity),
      severityLabel:severityLabel(consequence.severity),
      choices:cs,
      interactive:!!def.interactive
    }
  }

  function activeSummary(state={},nowMonth=0){
    const s=normalizeState(state),active=s.active.filter(x=>x.status==='pending');
    const overdue=active.filter(x=>num(x.dueMonth)<=num(nowMonth)).length;
    const next=active.slice().sort((a,b)=>num(a.dueMonth)-num(b.dueMonth))[0]||null;
    const high=active.filter(x=>num(x.severity)>=58).length;
    return {active:active.length,overdue,high,next}
  }

  registry.register('consequenceEngineV77',{
    version:'7.7.0',normalizeState,severityLabel,triggerTypes,triggerScore,create,due,
    approachScore,choices,resolve,spawnFrom,preview,activeSummary
  });
})(window);
