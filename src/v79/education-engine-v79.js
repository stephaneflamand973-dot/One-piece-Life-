(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('educationDataV79');if(!data)throw new Error('Education data V7.9 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));
  const TALENT_INDEX={Faible:0,Ordinaire:1,Correct:2,Prometteur:3,Excellent:4,Exceptionnel:5,Prodige:6};

  function stage(age){
    const a=num(age);
    if(a<5)return {id:'early',label:'Petite enfance'};
    if(a<8)return {id:'foundation',label:'Premiers apprentissages'};
    if(a<10)return {id:'basics',label:'Bases structurées'};
    if(a<13)return {id:'formation',label:'Formation locale'};
    if(a<15)return {id:'orientation',label:'Orientation'};
    if(a<18)return {id:'transition',label:'Transition vers la vie adulte'};
    return {id:'adult',label:'Formation de jeunesse terminée'}
  }

  function normalizeState(state={},ctx={}){
    const age=num(ctx.age),st=stage(age);
    const track=data.tracks[state.track]?state.track:'general';
    const focus=data.focuses[state.focus]?state.focus:'balanced';
    return {
      version:1,
      track,focus,
      knowledge:clamp(Number.isFinite(Number(state.knowledge))?Number(state.knowledge):(age>=5?8:0),0,100),
      practical:clamp(Number.isFinite(Number(state.practical))?Number(state.practical):(age>=5?7:0),0,100),
      discipline:clamp(Number.isFinite(Number(state.discipline))?Number(state.discipline):(age>=5?45:35),0,100),
      confidence:clamp(Number.isFinite(Number(state.confidence))?Number(state.confidence):(age>=5?42:35),0,100),
      network:clamp(Number.isFinite(Number(state.network))?Number(state.network):5,0,100),
      mentor:!!state.mentor,
      sponsor:!!state.sponsor,
      stage:st.id,
      exams:Array.isArray(state.exams)?state.exams.slice(0,12):[],
      credentials:Array.isArray(state.credentials)?[...new Set(state.credentials)].slice(0,12):[],
      trackHistory:Array.isArray(state.trackHistory)?state.trackHistory.slice(0,12):[],
      monthsTrained:Math.max(0,Math.floor(num(state.monthsTrained))),
      lastActionYear:Number.isFinite(Number(state.lastActionYear))?Number(state.lastActionYear):-99,
      lastEventYear:Number.isFinite(Number(state.lastEventYear))?Number(state.lastEventYear):-99,
      lastEventCheckYear:Number.isFinite(Number(state.lastEventCheckYear))?Number(state.lastEventCheckYear):-99,
      careerPreparationApplied:!!state.careerPreparationApplied
    }
  }

  function talentFactor(label='Correct'){
    const i=TALENT_INDEX[label]??2;
    return +(0.78+i*.095).toFixed(3)
  }

  function weightedKey(weights={},roll=.5){
    const entries=Object.entries(weights).filter(([,w])=>num(w)>0);
    if(!entries.length)return null;
    const total=entries.reduce((n,[,w])=>n+num(w),0);
    let target=clamp(Number(roll),0,.999999)*total;
    for(const [k,w] of entries){target-=num(w);if(target<=0)return k}
    return entries[entries.length-1][0]
  }

  function monthProgress(state={},ctx={},rolls={}){
    const s=normalizeState(state,ctx),age=num(ctx.age);
    if(age<5||age>=16)return {state:s,skill:null,stat:null,skillGain:0,statGain:0,deltas:{}};
    const track=data.tracks[s.track]||data.tracks.general,focus=data.focuses[s.focus]||data.focuses.balanced;
    const learning=talentFactor(ctx.learningTalent),family=clamp(num(ctx.familyStability||55),0,100);
    const stress=clamp(num(ctx.householdStress||20),0,100);
    const energy=clamp(num(ctx.energy||70),0,100);
    const environment=clamp(.72+family/260-stress/340+(energy-50)/420,.48,1.25);
    const ageMult=age<8?.72:age<10?.86:age<13?1:1.08;
    const mentor=s.mentor?1.08:1,sponsor=s.sponsor?1.04:1;
    const base=(.34+clamp(Number(rolls.growth??.5),0,1)*.34)*learning*environment*ageMult*mentor*sponsor;
    const knowledgeGain=base*focus.knowledge*(.78+num(ctx.activityStudy)*.18);
    const practicalGain=base*focus.practical*(.82+num(ctx.activityPractical)*.18);
    const disciplineGain=base*.33*focus.discipline;
    const confidenceGain=base*.28*focus.confidence;
    s.knowledge=clamp(s.knowledge+knowledgeGain,0,100);
    s.practical=clamp(s.practical+practicalGain,0,100);
    s.discipline=clamp(s.discipline+disciplineGain,0,100);
    s.confidence=clamp(s.confidence+confidenceGain,0,100);
    s.monthsTrained++;
    const skill=weightedKey(track.skills,rolls.skill??.5);
    const stat=weightedKey(track.stats,rolls.stat??.5);
    const skillGain=skill?clamp(base*.28*(.72+track.skills[skill]),.03,.42):0;
    const statGain=stat?clamp(base*.18*(.72+track.stats[stat]),.02,.30):0;
    return {
      state:s,skill,stat,
      skillGain:+skillGain.toFixed(3),statGain:+statGain.toFixed(3),
      deltas:{knowledge:+knowledgeGain.toFixed(2),practical:+practicalGain.toFixed(2),discipline:+disciplineGain.toFixed(2),confidence:+confidenceGain.toFixed(2)}
    }
  }

  function focusAction(state={},focusId,ctx={}){
    const s=normalizeState(state,ctx),focus=data.focuses[focusId];if(!focus)return {error:'invalid_focus'};
    s.focus=focusId;s.lastActionYear=num(ctx.year);
    return {state:s,focus}
  }

  function switchTrack(state={},trackId,ctx={}){
    const s=normalizeState(state,ctx),track=data.tracks[trackId];if(!track)return {error:'invalid_track'};
    if(num(ctx.age)<10||num(ctx.age)>=16)return {error:'age_locked'};
    const previous=s.track;s.track=trackId;s.lastActionYear=num(ctx.year);
    if(previous!==trackId){
      s.discipline=clamp(s.discipline-2,0,100);
      s.trackHistory.push({year:num(ctx.year),from:previous,to:trackId});
      s.trackHistory=s.trackHistory.slice(-12)
    }
    return {state:s,track,previous}
  }

  function milestoneScore(state={},milestoneId,ctx={}){
    const s=normalizeState(state,ctx),m=data.milestones[milestoneId];if(!m)return null;
    const w=m.weight;
    const raw=s.knowledge*w.knowledge+s.practical*w.practical+s.discipline*w.discipline+s.confidence*w.confidence;
    const talent=(TALENT_INDEX[ctx.learningTalent]??2)*2.1;
    const stability=(num(ctx.familyStability||55)-50)*.08;
    const stress=(num(ctx.householdStress||20)-30)*.10;
    const mentor=s.mentor?3:0,sponsor=s.sponsor?1.5:0;
    return +clamp(raw+talent+stability-stress+mentor+sponsor,0,120).toFixed(1)
  }

  function milestoneChance(state={},milestoneId,ctx={}){
    const m=data.milestones[milestoneId],score=milestoneScore(state,milestoneId,ctx);if(!m||score==null)return 0;
    return +clamp(.35+(score-m.difficulty)/95,.08,.98).toFixed(3)
  }

  function resolveMilestone(state={},milestoneId,ctx={},roll=.5){
    const s=normalizeState(state,ctx),m=data.milestones[milestoneId];if(!m)return {error:'invalid_milestone'};
    if(s.exams.some(x=>x.id===milestoneId))return {error:'already_completed'};
    const score=milestoneScore(s,milestoneId,ctx),chance=milestoneChance(s,milestoneId,ctx),success=Number(roll)<chance;
    let result='fail';
    if(success){
      const margin=score-m.difficulty;
      result=margin>=24&&Number(roll)<chance*.72?'distinction':margin>=4?'pass':'partial'
    }else if(score>=m.difficulty-8)result='partial';
    const credential=result==='distinction'?m.label+' • distinction':result==='pass'?m.label:result==='partial'?m.label+' • validation partielle':null;
    const exam={id:milestoneId,age:m.age,label:m.label,score,chance,result,credential};
    s.exams.push(exam);if(credential)s.credentials.push(credential);
    if(result==='distinction'){s.confidence=clamp(s.confidence+5,0,100);s.discipline=clamp(s.discipline+2,0,100)}
    if(result==='pass'){s.confidence=clamp(s.confidence+3,0,100)}
    if(result==='partial'){s.confidence=clamp(s.confidence+1,0,100)}
    if(result==='fail'){s.confidence=clamp(s.confidence-4,0,100);s.discipline=clamp(s.discipline+1,0,100)}
    return {state:s,exam}
  }

  function nextMilestone(state={},age=0){
    const done=new Set((state.exams||[]).map(x=>x.id));
    return Object.entries(data.milestones).map(([id,m])=>({id,...m})).filter(m=>!done.has(m.id)&&num(age)>=m.age).sort((a,b)=>a.age-b.age)[0]||null
  }

  function careerReadiness(state={},careerId,ctx={}){
    const s=normalizeState(state,ctx),track=data.tracks[s.track]||data.tracks.general;
    const affinity=num(track.careers[careerId]??.4);
    const exams=s.exams||[];
    const passed=exams.filter(x=>['distinction','pass'].includes(x.result)).length;
    const partial=exams.filter(x=>x.result==='partial').length;
    const distinction=exams.filter(x=>x.result==='distinction').length;
    const competence=s.knowledge*.22+s.practical*.28+s.discipline*.23+s.confidence*.12+s.network*.05;
    const score=clamp(competence+affinity*24+passed*3.4+partial*1.4+distinction*2.2+(s.mentor?2:0),0,100);
    const label=score>=78?'Très préparé':score>=64?'Bien préparé':score>=50?'Préparation correcte':score>=36?'Peu préparé':'Voie très éloignée';
    return {score:+score.toFixed(1),label,affinity:+affinity.toFixed(2),track:s.track}
  }

  function careerBonus(state={},careerId,ctx={}){
    const ready=careerReadiness(state,careerId,ctx),s=normalizeState(state,ctx);
    const xp=Math.round(clamp((ready.score-35)/7,0,8));
    const rep=Math.round(clamp((ready.score-52)/15,0,3));
    const standing=Math.round(clamp((ready.score-58)/16,0,3));
    const track=data.tracks[s.track]||data.tracks.general;
    const topSkill=Object.entries(track.skills).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
    const topStat=Object.entries(track.stats).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
    return {readiness:ready,xp,rep,standing,topSkill,topStat,skillGain:ready.score>=64?2:ready.score>=50?1:0,statGain:ready.score>=72?1.2:ready.score>=55?.6:0}
  }

  function eventCandidates(state={},ctx={}){
    const s=normalizeState(state,ctx),age=num(ctx.age),out=[];
    if(age<7||age>=16)return out;
    const add=(id,weight)=>{const e=data.events[id];if(e&&age>=e.minAge)out.push({id,event:e,weight})};
    add('discovery',2.2+(100-s.knowledge)/70);
    if(age>=8&&!s.mentor)add('mentor',1.1+s.discipline/75);
    if(age>=9)add('rivalry',1.4+s.confidence/80);
    if(age>=10)add('field',1.5+s.practical/65);
    if(age>=8&&num(ctx.householdStress)>=42)add('setback',1.8+num(ctx.householdStress)/65);
    if(age>=11&&!s.sponsor&&s.knowledge+s.practical>=80)add('sponsor',.8+(s.knowledge+s.practical)/150);
    return out
  }

  function weightedPick(items=[],roll=.5){
    if(!items.length)return null;const total=items.reduce((n,x)=>n+Math.max(0,num(x.weight)),0);if(total<=0)return items[0];
    let t=clamp(Number(roll),0,.999999)*total;
    for(const x of items){t-=Math.max(0,num(x.weight));if(t<=0)return x}
    return items[items.length-1]
  }

  function chooseEvent(state={},ctx={},roll=.5){return weightedPick(eventCandidates(state,ctx),roll)}

  function resolveEvent(state={},eventId,choiceId,ctx={}){
    const s=normalizeState(state,ctx),event=data.events[eventId],choice=event?.choices?.[choiceId];if(!event||!choice)return {error:'invalid_choice'};
    const e=choice.effects||{};
    s.knowledge=clamp(s.knowledge+num(e.knowledge),0,100);
    s.practical=clamp(s.practical+num(e.practical),0,100);
    s.discipline=clamp(s.discipline+num(e.discipline),0,100);
    s.confidence=clamp(s.confidence+num(e.confidence),0,100);
    s.network=clamp(s.network+num(e.network),0,100);
    if(e.mentor)s.mentor=true;if(e.sponsor)s.sponsor=true;
    s.lastEventYear=num(ctx.year);
    return {state:s,event,choice,effects:clone(e)}
  }

  function summary(state={},ctx={}){
    const s=normalizeState(state,ctx),track=data.tracks[s.track],st=stage(ctx.age);
    const next=Object.entries(data.milestones).map(([id,m])=>({id,...m})).find(m=>!(s.exams||[]).some(x=>x.id===m.id)&&m.age>=num(ctx.age))||null;
    const career=Object.keys(data.careerLabels).map(id=>({id,label:data.careerLabels[id],...careerReadiness(s,id,ctx)})).sort((a,b)=>b.score-a.score);
    return {
      stage:st.label,track:track.label,trackId:s.track,focus:data.focuses[s.focus]?.label||'Équilibrer',
      knowledge:Math.round(s.knowledge),practical:Math.round(s.practical),discipline:Math.round(s.discipline),confidence:Math.round(s.confidence),
      mentor:s.mentor,sponsor:s.sponsor,exams:s.exams.length,credentials:s.credentials.length,nextMilestone:next,career
    }
  }

  registry.register('educationEngineV79',{
    version:'7.9.0',stage,normalizeState,talentFactor,weightedKey,monthProgress,focusAction,switchTrack,
    milestoneScore,milestoneChance,resolveMilestone,nextMilestone,careerReadiness,careerBonus,eventCandidates,
    weightedPick,chooseEvent,resolveEvent,summary
  });
})(window);
