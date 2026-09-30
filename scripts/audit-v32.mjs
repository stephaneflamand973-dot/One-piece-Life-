import fs from 'node:fs';

const base=fs.readFileSync('scripts/qa-v32.mjs','utf8');
// V3.0 career-depth audit: mission outcomes now carry profile-specific mechanical consequences.
const marker="console.log('\\nQA_METRICS '+JSON.stringify(metrics));";
if(!base.includes(marker)) throw new Error('V2.9 audit marker not found in qa-v28.mjs');

const extra=String.raw`
function qaResolveInterruptions(g){
  let guard=0;
  while(guard++<12){
    if(g.pending){
      const c=g.pending.choices&&g.pending.choices[0];
      if(c&&typeof c[2]==='function')c[2]();
      g.pending=null;
      continue;
    }
    const st=q.awaitingStory();
    if(st){
      const cs=q.storyChoices(st);
      if(cs.length)q.storyChoice(st.id,cs[0].id);
      else q.closeStory(st,'Audit','Audit',false,'failed');
      continue;
    }
    break;
  }
}
function qaTuneProfile(p,profile){
  Object.keys(p.stats).forEach(k=>{p.stats[k]=34;p.caps[k]=82;p.absoluteCaps[k]=92});
  Object.keys(p.skills).forEach(k=>{p.skills[k]=32;p.caps[k]=82;p.absoluteCaps[k]=92});
  if(profile==='combat'){
    p.stats.Force=58;p.stats.Résistance=56;p.stats.Réflexes=54;p.stats.Agilité=52;
    p.skills.Combat=58;p.skills.Sabre=48;p.skills.Tir=38;
    p.focus='Combat';
  }else if(profile==='navigation'){
    p.skills.Navigation=66;p.stats.Réflexes=57;p.stats.Agilité=55;p.stats.Discipline=52;
    p.skills.Discrétion=42;p.focus='Équilibre';
  }else if(profile==='science'){
    p.skills.Science=70;p.stats.Intelligence=68;p.stats.Discipline=56;p.stats.Réflexes=46;
    p.skills.Navigation=42;p.skills.Discrétion=44;p.focus='Carrière';
  }else if(profile==='stealth'){
    p.skills.Discrétion=68;p.stats.Agilité=60;p.stats.Réflexes=58;p.stats.Intelligence=50;
    p.focus='Carrière';
  }
  p.health=100;p.energy=100;p.conditions=[];
}
function qaMissionPick(board){
  if(!board.length)return -1;
  const rec=board.findIndex(x=>x.recommended);
  if(rec>=0)return rec;
  let best=0;
  for(let i=1;i<board.length;i++)if((board[i].chance||0)>(board[best].chance||0))best=i;
  return best;
}
function qaLongCareer(seed,faction,spec,profile,years){
  const g=fresh(seed),p=g.player;
  p.ageMonths=216;p.money=250000;p.reputation=25;p.factionRep[faction]=100;
  qaTuneProfile(p,profile);
  q.join(faction);
  if(spec){p.specialization=spec;const rec=q.careerRecord();if(rec)rec.specialization=spec}
  p.activity='Carrière';
  const start=p.ageMonths,target=start+years*12;
  let clicks=0,lastMissionAge=-999,started=0,routine=0,adaptive=0,worldGenerated=0,signature=0;
  const titles=[],guidance={},chances=[];let arcPeak=0;const arcTransitions0=(g.loop.arcHistory||[]).length;
  while(p.ageMonths<target&&clicks<years*18&&g.alive){
    qaResolveInterruptions(g);
    if(!g.mission&&p.ageMonths-lastMissionAge>=10){
      const b=q.board(),ix=qaMissionPick(b);
      if(ix>=0){
        const m=b[ix];titles.push(m.title);started++;if(m.routine)routine++;if(m.adaptive)adaptive++;if(m.worldGenerated)worldGenerated++;if(m.signature)signature++;
        guidance[m.guidance]=(guidance[m.guidance]||0)+1;chances.push(m.chance||0);
        q.startMission(ix);lastMissionAge=p.ageMonths;
      }
    }
    q.advance();clicks++;qaResolveInterruptions(g);
    arcPeak=Math.max(arcPeak,(g.loop.arcs||[]).length);
  }
  const counts={};titles.forEach(t=>counts[t]=(counts[t]||0)+1);
  const repeated=titles.reduce((n,t)=>n+((counts[t]||0)>1?1:0),0);
  const consecutive=titles.reduce((n,t,i)=>n+(i>0&&titles[i-1]===t?1:0),0);
  return {
    faction,spec,profile,alive:g.alive,age:+(p.ageMonths/12).toFixed(1),years:+((p.ageMonths-start)/12).toFixed(1),
    clicks,clicksPerYear:+(clicks/Math.max(.1,(p.ageMonths-start)/12)).toFixed(2),
    missions:started,missionPerYear:+(started/Math.max(.1,(p.ageMonths-start)/12)).toFixed(2),
    uniqueTitles:new Set(titles).size,repeatShare:started?+(repeated/started).toFixed(2):0,consecutiveRepeatShare:started?+(consecutive/started).toFixed(2):0,
    routineShare:started?+(routine/started).toFixed(2):0,adaptiveShare:started?+(adaptive/started).toFixed(2):0,worldShare:started?+(worldGenerated/started).toFixed(2):0,signatureShare:started?+(signature/started).toFixed(2):0,
    avgChance:chances.length?+(chances.reduce((a,b)=>a+b,0)/chances.length).toFixed(2):0,guidance,
    activeArcs:(g.loop.arcs||[]).length,arcHistoryDelta:(g.loop.arcHistory||[]).length-arcTransitions0,arcPeak,
    founding:(g.loop.foundingMemories||[]).length,
    nemeses:g.relations.filter(r=>r.nemesisRecognized&&r.status==='active').length
  };
}
{
  const profiles=[
    ['Civil','Scientifique','science'],
    ['Civil','Navigateur','navigation'],
    ['Marine','Combattant','combat'],
    ['Pirates','Duelliste','combat'],
    ['Révolutionnaires','Infiltration','stealth'],
    ['Gouvernement','Renseignement','stealth']
  ];
  const rows=[];
  profiles.forEach((cfg,pi)=>{for(let s=0;s<8;s++)rows.push(qaLongCareer(19000+pi*100+s,cfg[0],cfg[1],cfg[2],20))});
  const sum=k=>rows.reduce((a,x)=>a+(x[k]||0),0);
  const byProfile={};
  profiles.forEach(cfg=>{
    const key=cfg[0]+' / '+cfg[1],rs=rows.filter(x=>x.faction===cfg[0]&&x.spec===cfg[1]);
    byProfile[key]={
      sample:rs.length,survival:+(rs.filter(x=>x.alive).length/rs.length).toFixed(2),
      missions:+(rs.reduce((a,x)=>a+x.missions,0)/rs.length).toFixed(1),
      repeatShare:+(rs.reduce((a,x)=>a+x.repeatShare,0)/rs.length).toFixed(2),
      consecutiveRepeatShare:+(rs.reduce((a,x)=>a+x.consecutiveRepeatShare,0)/rs.length).toFixed(2),
      routineShare:+(rs.reduce((a,x)=>a+x.routineShare,0)/rs.length).toFixed(2),
      adaptiveShare:+(rs.reduce((a,x)=>a+x.adaptiveShare,0)/rs.length).toFixed(2),
      worldShare:+(rs.reduce((a,x)=>a+x.worldShare,0)/rs.length).toFixed(2),
      clicksPerYear:+(rs.reduce((a,x)=>a+x.clicksPerYear,0)/rs.length).toFixed(2),
      arcHistory:+(rs.reduce((a,x)=>a+x.arcHistoryDelta,0)/rs.length).toFixed(1),
      founding:+(rs.reduce((a,x)=>a+x.founding,0)/rs.length).toFixed(1)
    };
  });
  metrics.v32CareerStress={
    sample:rows.length,yearsTarget:20,survival:+(rows.filter(x=>x.alive).length/rows.length).toFixed(2),
    avgRepeatShare:+(sum('repeatShare')/rows.length).toFixed(2),
    avgConsecutiveRepeatShare:+(sum('consecutiveRepeatShare')/rows.length).toFixed(2),
    avgRoutineShare:+(sum('routineShare')/rows.length).toFixed(2),
    avgAdaptiveShare:+(sum('adaptiveShare')/rows.length).toFixed(2),
    avgWorldShare:+(sum('worldShare')/rows.length).toFixed(2),
    avgClicksPerYear:+(sum('clicksPerYear')/rows.length).toFixed(2),
    avgArcHistory:+(sum('arcHistoryDelta')/rows.length).toFixed(1),
    avgFounding:+(sum('founding')/rows.length).toFixed(1),
    byProfile
  };
}
{
  const rows=[];
  for(let seed=20000;seed<20024;seed++){
    const g=fresh(seed),p=g.player;p.ageMonths=240;qaTuneProfile(p,'combat');
    const r=q.createRelation('rival');r.nemesisRecognized=true;r.rivalry=82;r.respect=52;r.npcPower=52;r.npcPotential=84;r.region=p.region;r.location=p.island;
    const startHist=(g.loop.arcHistory||[]).length;let peak=0,hunts=0;
    for(let m=0;m<120&&g.alive;m++){
      if(!r.npcIntent)q.assignNpcIntent(r);
      if(r.npcIntent==='Poursuivre sa némésis')hunts++;
      q.npcIntentTick(r,1);q.arcTick(1);peak=Math.max(peak,(g.loop.arcs||[]).length);
    }
    const a=(g.loop.arcs||[]).find(x=>x.sourceType==='relation'&&String(x.sourceId)===String(r.id));
    rows.push({hunts,peak,stage:a?a.stage:0,pressure:a?a.pressure:0,history:(g.loop.arcHistory||[]).length-startHist,challenge:!!r.challengeReady});
  }
  metrics.v32NemesisStress={
    sample:rows.length,avgHuntMonths:+(rows.reduce((a,x)=>a+x.hunts,0)/rows.length).toFixed(1),
    challengeReadyShare:+(rows.filter(x=>x.challenge).length/rows.length).toFixed(2),
    avgStage:+(rows.reduce((a,x)=>a+x.stage,0)/rows.length).toFixed(2),
    avgPressure:+(rows.reduce((a,x)=>a+x.pressure,0)/rows.length).toFixed(1),
    avgArcHistory:+(rows.reduce((a,x)=>a+x.history,0)/rows.length).toFixed(1),
    maxActiveArcs:Math.max(...rows.map(x=>x.peak))
  };
}
{
  const factions=['Civil','Marine','Pirates','Chasseur de primes','Révolutionnaires','Gouvernement'],rows=[];
  factions.forEach((faction,fi)=>{
    for(let s=0;s<20;s++){
      const g=fresh(21000+fi*100+s),p=g.player;p.ageMonths=216;p.factionRep[faction]=100;
      Object.keys(p.stats).forEach(k=>{p.stats[k]=18;p.caps[k]=70});
      Object.keys(p.skills).forEach(k=>{p.skills[k]=18;p.caps[k]=70});
      q.join(faction);const b=q.board(),rec=b.find(x=>x.recommended)||null;
      rows.push({faction,hasRoutine:b.some(x=>x.routine),recommendedRoutine:!!(rec&&rec.routine),bestChance:b.length?Math.max(...b.map(x=>x.chance||0)):0});
    }
  });
  const byFaction={};factions.forEach(f=>{const rs=rows.filter(x=>x.faction===f);byFaction[f]={routineBoard:+(rs.filter(x=>x.hasRoutine).length/rs.length).toFixed(2),routineRecommended:+(rs.filter(x=>x.recommendedRoutine).length/rs.length).toFixed(2),avgBestChance:+(rs.reduce((a,x)=>a+x.bestChance,0)/rs.length).toFixed(2)}});
  metrics.v32RoutineFallback={sample:rows.length,byFaction};
}
console.log('V32_LONG_AUDIT '+JSON.stringify({career:metrics.v32CareerStress,nemesis:metrics.v32NemesisStress,routine:metrics.v32RoutineFallback}));
`;

const out=base.replace(marker,extra+'\n'+marker);
fs.writeFileSync('/tmp/qa-v30-runtime.mjs',out,'utf8');
await import('file:///tmp/qa-v30-runtime.mjs');

// V3.1 final trigger: veteran pirate pacing + faction endgame.

// rerun after corrected New World QA fixture

// V3.2 world foundations long-career audit

// trigger final V3.2 world audit

// rerun after validator alignment

// cross-world propagation stress pass

// living world pulse final stress pass

// 40-year autonomous world coherence audit

// evolving ambitions multi-decade pass

// final V3.2 pirate pacing and bounded-memory regression pass

// V3.5 canon dependency and alternate branch regression pass

// V3.5 living canon branch lifecycle stress pass

// V3.5 release candidate full regression pass
