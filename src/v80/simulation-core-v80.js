(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('simulationCoreDataV80');if(!data)throw new Error('V8.0 simulation core data missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const norm=s=>String(s||'').toLowerCase();
  const clone=o=>JSON.parse(JSON.stringify(o));

  function emptyTotals(){
    const out={};for(const k of Object.keys(data.legacyCategories))out[k]={score:0,count:0,peak:0};return out
  }

  function normalizeState(state={}){
    const totals=emptyTotals();
    for(const [k,v] of Object.entries(state.legacy?.totals||{}))if(totals[k]){
      totals[k]={score:Math.max(0,num(v.score)),count:Math.max(0,Math.floor(num(v.count))),peak:Math.max(0,num(v.peak))}
    }
    return {
      version:1,
      director:{
        lastYear:Number.isFinite(Number(state.director?.lastYear))?Number(state.director.lastYear):-99,
        lastNarrative:state.director?.lastNarrative||null,
        currentChapter:state.director?.currentChapter||null,
        chapterHistory:Array.isArray(state.director?.chapterHistory)?state.director.chapterHistory.slice(0,12):[],
        interruptionHistory:Array.isArray(state.director?.interruptionHistory)?state.director.interruptionHistory.slice(0,24):[],
        annualHistory:Array.isArray(state.director?.annualHistory)?state.director.annualHistory.slice(0,16):[],
        totalCompressed:Math.max(0,Math.floor(num(state.director?.totalCompressed)))
      },
      legacy:{
        entries:Array.isArray(state.legacy?.entries)?state.legacy.entries.slice(0,80):[],
        seen:state.legacy?.seen&&typeof state.legacy.seen==='object'?{...state.legacy.seen}:{},
        totals,
        count:Math.max(0,Math.floor(num(state.legacy?.count))),
        scorePeak:Math.max(0,num(state.legacy?.scorePeak)),
        bootstrapDone:!!state.legacy?.bootstrapDone
      },
      render:{
        lastTab:state.render?.lastTab||'life',
        renders:state.render?.renders&&typeof state.render.renders==='object'?{...state.render.renders}:{},
        total:Math.max(0,Math.floor(num(state.render?.total))),
        avoided:Math.max(0,Math.floor(num(state.render?.avoided)))
      }
    }
  }

  function recentKindCount(state={},kind,nowMonth=0,window=18){
    return (state.director?.interruptionHistory||[]).filter(x=>x.kind===kind&&num(nowMonth)-num(x.month)<=window).length
  }

  function scoreInterruption(candidate={},ctx={},state={}){
    const kind=data.interruptionKinds[candidate.kind]||{base:45,novelty:5};
    let score=num(kind.base)+num(candidate.importance)*.36+num(candidate.severity)*.28+num(candidate.urgency)*.22;
    if(candidate.mandatory)score+=18;
    if(candidate.causal)score+=8;
    if(candidate.personal)score+=6;
    const recent=recentKindCount(state,candidate.kind,ctx.nowMonth,18);
    score+=recent===0?num(kind.novelty):0;
    score-=recent*9;
    if(candidate.ageCritical)score+=10;
    if(candidate.overdue)score+=12;
    return +clamp(score,0,100).toFixed(1)
  }

  function rankInterruptions(candidates=[],ctx={},state={}){
    return candidates.map((c,i)=>({...c,score:scoreInterruption(c,ctx,state),_i:i}))
      .sort((a,b)=>b.score-a.score||Number(!!b.mandatory)-Number(!!a.mandatory)||a._i-b._i)
  }

  function classifyNarrativeDomain(event={}){
    const text=norm((event.title||'')+' '+(event.desc||''));
    let best='career',hits=-1;
    for(const [id,d] of Object.entries(data.narrativeDomains)){
      const n=(d.patterns||[]).reduce((a,p)=>a+(text.includes(norm(p))?1:0),0);
      if(n>hits){hits=n;best=id}
    }
    return hits>0?best:(event.type==='canon'?'world':event.type==='danger'?'combat':'career')
  }

  function narrativeEvent(event={},ctx={}){
    const domain=classifyNarrativeDomain(event);
    let score=event.type==='canon'?88:event.type==='danger'?80:event.type==='major'?70:38;
    if(event.delta)score+=4;
    if(norm(event.title).includes('promotion')||norm(event.title).includes('historique'))score+=8;
    if(norm(event.title).includes('mort'))score+=14;
    if(domain==='world'&&num(ctx.worldDivergence)>=40)score+=5;
    return {...clone(event),domain,score:clamp(score,0,100)}
  }

  function annualNarrative(events=[],ctx={}){
    const ranked=events.map(e=>narrativeEvent(e,ctx)).sort((a,b)=>b.score-a.score);
    const chosen=[],domains=new Set(),titles=new Set();
    for(const e of ranked){
      const title=norm(e.title);if(titles.has(title))continue;
      const duplicateDomain=domains.has(e.domain);
      if(chosen.length===0||!duplicateDomain||e.score>=84){
        chosen.push(e);titles.add(title);domains.add(e.domain)
      }
      if(chosen.length>=3)break
    }
    const primary=chosen[0]||null,secondary=chosen.slice(1,3);
    const compressed=Math.max(0,events.length-chosen.length);
    const theme=primary?.domain||'quiet';
    return {
      year:num(ctx.year),primary,secondary,compressed,theme,
      label:primary?(data.narrativeDomains[theme]?.label||'Année marquante'):'Année calme',
      significance:primary?.score||0
    }
  }

  function chapterLabel(theme,primary){
    const base=data.narrativeDomains[theme]?.label||'Trajectoire personnelle';
    return primary?.title?base+' • '+primary.title:base
  }

  function advanceDirector(state={},narrative={},ctx={}){
    const next=normalizeState(state),d=next.director,nowMonth=num(ctx.nowMonth),primary=narrative.primary;
    d.lastYear=num(ctx.year);d.lastNarrative=clone(narrative);d.totalCompressed+=num(narrative.compressed);
    d.annualHistory.unshift({year:num(ctx.year),theme:narrative.theme,significance:narrative.significance,label:narrative.label});
    d.annualHistory=d.annualHistory.slice(0,16);
    if(!primary||narrative.significance<64){
      if(d.currentChapter&&nowMonth-num(d.currentChapter.lastMonth)>=30){
        if(num(d.currentChapter.beats)>=2)d.chapterHistory.unshift({...d.currentChapter,status:'closed',closedMonth:nowMonth});
        d.currentChapter=null
      }
      d.chapterHistory=d.chapterHistory.slice(0,12);return next
    }
    if(d.currentChapter&&d.currentChapter.theme===narrative.theme&&nowMonth-num(d.currentChapter.lastMonth)<=30){
      d.currentChapter.beats=Math.min(12,num(d.currentChapter.beats)+1);
      d.currentChapter.score=Math.max(num(d.currentChapter.score),narrative.significance);
      d.currentChapter.lastMonth=nowMonth;
      d.currentChapter.lastTitle=primary.title;
      return next
    }
    if(d.currentChapter){
      if(num(d.currentChapter.beats)>=2||num(d.currentChapter.score)>=82)d.chapterHistory.unshift({...d.currentChapter,status:'closed',closedMonth:nowMonth});
      d.currentChapter=null
    }
    d.currentChapter={
      id:'chapter_'+String(nowMonth)+'_'+narrative.theme,
      theme:narrative.theme,label:chapterLabel(narrative.theme,primary),startedMonth:nowMonth,lastMonth:nowMonth,
      beats:1,score:narrative.significance,lastTitle:primary.title,status:'active'
    };
    d.chapterHistory=d.chapterHistory.slice(0,12);
    return next
  }

  function recordInterruption(state={},kind,month,score=0){
    const next=normalizeState(state);
    next.director.interruptionHistory.unshift({kind,month:num(month),score:num(score)});
    next.director.interruptionHistory=next.director.interruptionHistory.slice(0,24);
    return next
  }

  function evidenceFromHistory(event={}){
    if(!['major','danger','canon'].includes(event.type))return[];
    const text=norm((event.title||'')+' '+(event.desc||''));
    const base=event.type==='canon'?6:event.type==='danger'?4.5:4;
    const out=[];
    for(const [id,c] of Object.entries(data.legacyCategories)){
      const hits=(c.patterns||[]).reduce((a,p)=>a+(text.includes(norm(p))?1:0),0);
      if(!hits)continue;
      out.push({
        id:id+'_'+String(event.id||event.ageMonths||0)+'_'+String(event.title||'event').slice(0,40),
        category:id,label:event.title||c.label,score:+clamp(base+hits*1.75,2,10).toFixed(1),
        ageMonths:num(event.ageMonths),worldYear:num(event.worldYear),sourceType:event.type
      })
    }
    if(!out.length&&event.type==='canon')out.push({id:'world_'+String(event.id||event.ageMonths||0),category:'world',label:event.title||'Événement historique',score:6,ageMonths:num(event.ageMonths),worldYear:num(event.worldYear),sourceType:event.type});
    return out
  }

  function recordEvidence(state={},evidence={}){
    const next=normalizeState(state),l=next.legacy,cat=data.legacyCategories[evidence.category];if(!cat||!evidence.id)return next;
    if(l.seen[evidence.id])return next;
    l.seen[evidence.id]=1;l.count++;
    const t=l.totals[evidence.category]||{score:0,count:0,peak:0};
    t.score=Math.min(num(cat.cap),num(t.score)+num(evidence.score));
    t.count=Math.max(0,num(t.count)+1);
    t.peak=Math.max(num(t.peak),num(evidence.score));
    l.totals[evidence.category]=t;
    l.entries.unshift(clone(evidence));l.entries=l.entries.slice(0,80);
    return next
  }

  function permanentEvidenceScore(state={}){
    const s=normalizeState(state),vals=Object.entries(s.legacy.totals);
    const total=vals.reduce((n,[id,t])=>n+Math.min(num(data.legacyCategories[id]?.cap),num(t.score)),0);
    const categories=vals.filter(([,t])=>num(t.score)>=4).length;
    const strong=vals.filter(([,t])=>num(t.score)>=10).length;
    return +clamp(total*.72+categories*2.2+strong*1.5,0,100).toFixed(1)
  }

  function legacyScore(state={},ctx={}){
    const evidence=permanentEvidenceScore(state),current=clamp(num(ctx.currentScore),0,100);
    const combined=Math.max(current,clamp(current*.72+evidence*.46,0,100),evidence);
    return +combined.toFixed(1)
  }

  function updateLegacyPeak(state={},score=0){
    const next=normalizeState(state);next.legacy.scorePeak=Math.max(num(next.legacy.scorePeak),num(score));return next
  }

  function renderPlan(activeTab='life',force=false){
    const tab=data.renderDomains[activeTab]?activeTab:'life';
    return {top:true,tabs:[tab],dev:true,force:!!force}
  }

  registry.register('simulationCoreEngineV80',{
    version:'8.0.0',normalizeState,scoreInterruption,rankInterruptions,classifyNarrativeDomain,narrativeEvent,
    annualNarrative,advanceDirector,recordInterruption,evidenceFromHistory,recordEvidence,permanentEvidenceScore,
    legacyScore,updateLegacyPeak,renderPlan
  });
})(window);
