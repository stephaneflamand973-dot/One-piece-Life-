(function(global){
  'use strict';
  const registry=global.OPL_MODULES;
  if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('arcDefinitionsV71');
  if(!data)throw new Error('Arc definitions V7.1 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function definition(eventId){return data.arcs[eventId]||null}

  function participation(eventId,ctx={}){
    const def=definition(eventId);
    if(!def)return {eligible:false,score:0,role:'Spectateur'};
    const related=Math.max(0,...(def.related||[]).map(id=>Number(ctx.relations?.[id])||0));
    const factionRole=def.roles?.[ctx.faction];
    const regionBonus=ctx.region===def.region?10:ctx.region==='Global'?4:0;
    const factionBonus=factionRole?10:0;
    const score=clamp(
      (Number(ctx.worldRep)||0)*.20+
      (Number(ctx.authority)||0)*.22+
      (Number(ctx.power)||0)*.22+
      related*.18+
      regionBonus+factionBonus+
      Math.max(0,(Number(ctx.eventImportance)||0)-80)*.32,
      0,100
    );
    return {eligible:score>=def.minScore,score:+score.toFixed(1),role:factionRole||'Intervenant indépendant',definition:def}
  }

  function availableChoices(stage,ctx={}){
    return (stage?.choices||[]).filter(c=>!c.factions||c.factions.includes(ctx.faction));
  }

  function createArc(eventId,ctx={},intendedStatus='completed'){
    const p=participation(eventId,ctx);
    if(!p.eligible)return null;
    return {
      id:'arc_'+eventId+'_'+String(ctx.worldYear||0),
      eventId,
      title:p.definition.title,
      role:p.role,
      intendedStatus,
      stageIndex:0,
      startedYear:Number(ctx.worldYear)||0,
      score:p.score,
      impact:0,
      risk:0,
      successes:0,
      failures:0,
      choices:[],
      alignment:null,
      critical:null,
      status:'active'
    };
  }

  function decision(arc,ctx={}){
    const def=definition(arc.eventId);
    const stage=def?.stages?.[arc.stageIndex];
    if(!stage)return null;
    const choices=availableChoices(stage,ctx);
    return {
      title:def.title+' • '+stage.title,
      text:stage.text+'\n\nRôle : '+arc.role+' • contribution '+arc.impact.toFixed(1)+' • exposition '+arc.risk.toFixed(1),
      choices:choices.map(c=>({
        id:c.id,
        label:c.label,
        hint:c.hint,
        action:'v71arc:'+encodeURIComponent(arc.id)+':'+arc.stageIndex+':'+encodeURIComponent(c.id)
      }))
    };
  }

  function abilityScore(choice,ctx={}){
    const skill=Number(ctx.skills?.[choice.skill])||Number(ctx.stats?.[choice.skill])||0;
    const secondary=choice.secondary?(Number(ctx.skills?.[choice.secondary])||Number(ctx.stats?.[choice.secondary])||0):skill;
    const haki=(Number(ctx.hakiObservation)||0)+(Number(ctx.hakiArmament)||0)*.55+(Number(ctx.hakiConqueror)||0)*.25;
    const org=Number(ctx.organization)||0;
    return skill*.54+secondary*.20+(Number(ctx.power)||0)*.13+haki*.07+org*.06;
  }

  function resolveChoice(arc,choiceId,ctx={},roll=.5){
    const def=definition(arc.eventId);
    const stage=def?.stages?.[arc.stageIndex];
    const choice=availableChoices(stage,ctx).find(c=>c.id===choiceId);
    if(!choice)return {error:'choice_missing'};
    if(choice.withdraw){
      return {choice,success:true,withdraw:true,finished:true,chance:1,impact:0,risk:0,nextStage:arc.stageIndex};
    }
    const ability=abilityScore(choice,ctx);
    const difficulty=Number(choice.difficulty)||60;
    const chance=clamp(.47+(ability-difficulty)/105+(Number(ctx.relationSupport)||0)/250,.08,.94);
    const success=roll<chance;
    const impact=(Number(choice.impact)||1)*(success?1:-.42);
    const risk=(Number(choice.risk)||1)*(success?.70:1.18);
    const nextStage=arc.stageIndex+1;
    return {
      choice,success,chance:+chance.toFixed(3),ability:+ability.toFixed(1),impact:+impact.toFixed(2),risk:+risk.toFixed(2),
      withdraw:false,finished:nextStage>=def.stages.length,nextStage
    };
  }

  function summary(arc){
    const def=definition(arc.eventId);
    const quality=arc.withdrawn?'withdrawn':arc.impact>=6&&arc.successes>=2?'legendary':arc.impact>=3?'major':arc.impact>=1?'limited':'failed';
    return {
      quality,
      title:def?.title||arc.title,
      contribution:+Number(arc.impact||0).toFixed(1),
      exposure:+Number(arc.risk||0).toFixed(1),
      successes:Number(arc.successes)||0,
      failures:Number(arc.failures)||0,
      alignment:arc.alignment||'independent',
      critical:arc.critical||null
    };
  }

  registry.register('arcDirector',{version:'7.1.0',definition,participation,createArc,decision,resolveChoice,summary,availableChoices});
})(window);
