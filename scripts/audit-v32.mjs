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
  const titles=[],guidance={},chances=[],heatSamples=[];const planCounts={};let arcPeak=0;const arcTransitions0=(g.loop.arcHistory||[]).length;
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
    const plan=q.advancePlan(),planKey=plan.label||plan.key;planCounts[planKey]=(planCounts[planKey]||0)+1;heatSamples.push((p.justice&&p.justice.regionalHeat&&p.justice.regionalHeat[p.region])||0);
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
    nemeses:g.relations.filter(r=>r.nemesisRecognized&&r.status==='active').length,
    deathCause:g.death&&g.death.cause||null,
    avgHeat:heatSamples.length?+(heatSamples.reduce((a,b)=>a+b,0)/heatSamples.length).toFixed(1):0,planCounts,
    recognition:q.playerWorldRecognition(),
    endgame:q.endgameStage(),
    finalRank:p.rank||'',
    finalPower:+q.power().toFixed(1),
    netWorth:Math.round(q.netWorth()),
    relationsActive:g.relations.filter(r=>r.status==='active').length,
    strongRelations:g.relations.filter(r=>r.status==='active'&&((r.trust||0)>=70||(r.affection||0)>=70||(r.respect||0)>=80)).length,
    canonicalRelations:g.relations.filter(r=>r.status==='active'&&r.canonical).length,
    mentors:g.relations.filter(r=>r.status==='active'&&r.role==='mentor').length,
    rivals:g.relations.filter(r=>r.status==='active'&&(r.role==='rival'||r.nemesisRecognized)).length,
    relationshipStatus:p.life&&p.life.relationshipStatus||'Célibataire',
    children:(p.children||[]).filter(x=>x.status==='active').length,
    achievements:Object.keys(g.achievements&&g.achievements.unlocked||{}).length,
    visited:(p.visited||[]).length,
    signatureMoments:(g.loop.signatureMoments||[]).length,
    consequenceHistory:(g.loop.consequenceHistory||[]).length,
    storyHistory:(g.story&&g.story.history||[]).length,
    careerHistory:(p.careerHistory||[]).length,
    organizationMembers:p.organization&&Array.isArray(p.organization.members)?p.organization.members.filter(x=>x.status!=='inactive').length:0,
    organizationLeader:!!(p.organization&&p.organization.authority==='leader'),
    directorJourneys:p.lifeDirector&&p.lifeDirector.acceptedMoves||0,
    directorJourneyOffers:p.lifeDirector&&p.lifeDirector.journeyOffers||0,
    directorRomanceOffers:p.lifeDirector&&p.lifeDirector.romanceOffers||0,
    directorFamilyOffers:p.lifeDirector&&p.lifeDirector.familyOffers||0,
    directorCareerTurns:p.lifeDirector&&p.lifeDirector.careerTurns||0,
    finalSpecialization:p.specialization||null,
    saveBytes:JSON.stringify(g).length,
    storageParts:{
      player:JSON.stringify(g.player||{}).length,
      relations:JSON.stringify(g.relations||[]).length,
      timeline:JSON.stringify(g.timeline||[]).length,
      world:JSON.stringify(g.world||{}).length,
      loop:JSON.stringify(g.loop||{}).length,
      story:JSON.stringify(g.story||{}).length,
      codex:JSON.stringify(g.codex||{}).length,
      achievements:JSON.stringify(g.achievements||{}).length,
      dynasty:JSON.stringify(g.dynasty||{}).length
    },
    worldStorageParts:Object.keys(g.world||{}).reduce((a,k)=>{a[k]=JSON.stringify(g.world[k]||null).length;return a},{}),
    careerMomentum:+((q.careerRecord&&q.careerRecord().momentum)||0).toFixed(2),
    careerSuccessRate:(q.careerRecord&&((q.careerRecord().successes||0)+(q.careerRecord().failures||0)))?+((q.careerRecord().successes||0)/((q.careerRecord().successes||0)+(q.careerRecord().failures||0))).toFixed(2):0,
    careerDistinctions:q.careerRecord?(q.careerRecord().distinctions||0):0,
    recentMissionRate:q.careerRecord&&q.careerRecord().recentResults&&q.careerRecord().recentResults.length?+(q.careerRecord().recentResults.reduce((a,b)=>a+b,0)/q.careerRecord().recentResults.length).toFixed(2):0,
    personalChapters:p.lifeDirector&&p.lifeDirector.chapterHistory?p.lifeDirector.chapterHistory.length:0,
    activePersonalChapters:p.lifeDirector&&p.lifeDirector.activeChapters?p.lifeDirector.activeChapters.length:0
  };
}
let postCareerRows=[],postCareerProfiles=[];
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
      founding:+(rs.reduce((a,x)=>a+x.founding,0)/rs.length).toFixed(1),
      planCounts:rs.reduce((a,x)=>{Object.entries(x.planCounts||{}).forEach(([k,v])=>a[k]=(a[k]||0)+v);return a},{}),
      avgRecognition:+(rs.reduce((a,x)=>a+(x.recognition&&x.recognition.score||0),0)/rs.length).toFixed(1),
      organicEndgameShare:+(rs.filter(x=>x.endgame&&x.endgame.organic).length/rs.length).toFixed(2),
      avgMissionSuccessRate:+(rs.reduce((a,x)=>a+(x.careerSuccessRate||0),0)/rs.length).toFixed(2),
      minMissionSuccessRate:+Math.min(...rs.map(x=>x.careerSuccessRate||0)).toFixed(2),
      maxMissionSuccessRate:+Math.max(...rs.map(x=>x.careerSuccessRate||0)).toFixed(2),
      avgVisitedPlaces:+(rs.reduce((a,x)=>a+(x.visited||0),0)/rs.length).toFixed(1),
      partneredShare:+(rs.filter(x=>x.relationshipStatus!=='Célibataire').length/rs.length).toFixed(2),
      parentShare:+(rs.filter(x=>x.children>0).length/rs.length).toFixed(2),
      avgAcceptedMoves:+(rs.reduce((a,x)=>a+(x.directorJourneys||0),0)/rs.length).toFixed(1),
      deathCauses:rs.filter(x=>!x.alive).reduce((a,x)=>{const k=x.deathCause||'unknown';a[k]=(a[k]||0)+1;return a},{})
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
  postCareerRows=rows;postCareerProfiles=profiles;
}
{
    const rows=postCareerRows,profiles=postCareerProfiles;
    const avg=k=>+(rows.reduce((a,x)=>a+(x[k]||0),0)/rows.length).toFixed(1);
    const ordered=k=>rows.map(x=>x[k]||0).sort((a,b)=>a-b);
    const median=k=>{const a=ordered(k);return a.length?+a[Math.floor(a.length/2)].toFixed(1):0};
    const rankSpread={};profiles.forEach(cfg=>{const key=cfg[0]+' / '+cfg[1],rs=rows.filter(x=>x.faction===cfg[0]&&x.spec===cfg[1]);rankSpread[key]=rs.reduce((a,x)=>{a[x.finalRank]=(a[x.finalRank]||0)+1;return a},{})});
    metrics.v40PostReleaseAudit={
      sample:rows.length,yearsTarget:20,
      career:{
        avgPower:avg('finalPower'),medianPower:median('finalPower'),
        avgRecognition:+(rows.reduce((a,x)=>a+(x.recognition&&x.recognition.score||0),0)/rows.length).toFixed(1),
        organicLegendShare:+(rows.filter(x=>x.endgame&&x.endgame.organic).length/rows.length).toFixed(2),
        avgCareerHistory:avg('careerHistory'),
        avgRankVariety:+(profiles.reduce((a,cfg)=>{const key=cfg[0]+' / '+cfg[1];return a+Object.keys(rankSpread[key]||{}).length},0)/profiles.length).toFixed(2),
        avgFinalMomentum:avg('careerMomentum'),
        avgMissionSuccessRate:+(rows.reduce((a,x)=>a+(x.careerSuccessRate||0),0)/rows.length).toFixed(2),
        avgRecentMissionRate:+(rows.reduce((a,x)=>a+(x.recentMissionRate||0),0)/rows.length).toFixed(2),
        avgDistinctions:avg('careerDistinctions'),
        avgCareerTurns:avg('directorCareerTurns'),
        careerTurnShare:+(rows.filter(x=>x.directorCareerTurns>0).length/rows.length).toFixed(2),
        specializationSpread:profiles.reduce((a,cfg)=>{const key=cfg[0]+' / '+cfg[1],rs=rows.filter(x=>x.faction===cfg[0]&&x.spec===cfg[1]);a[key]=rs.reduce((m,x)=>{const sp=x.finalSpecialization||'Aucune';m[sp]=(m[sp]||0)+1;return m},{});return a},{}),
        finalRanks:rankSpread
      },
      personalLife:{
        avgActiveRelations:avg('relationsActive'),
        avgStrongRelations:avg('strongRelations'),
        avgCanonicalRelations:avg('canonicalRelations'),
        mentorShare:+(rows.filter(x=>x.mentors>0).length/rows.length).toFixed(2),
        rivalShare:+(rows.filter(x=>x.rivals>0).length/rows.length).toFixed(2),
        partneredShare:+(rows.filter(x=>x.relationshipStatus!=='Célibataire').length/rows.length).toFixed(2),
        marriedShare:+(rows.filter(x=>x.relationshipStatus==='Marié').length/rows.length).toFixed(2),
        parentShare:+(rows.filter(x=>x.children>0).length/rows.length).toFixed(2),
        avgChildren:avg('children')
      },
      narrative:{
        avgSignatureMoments:avg('signatureMoments'),
        avgConsequencesResolved:avg('consequenceHistory'),
        avgStoryHistory:avg('storyHistory'),
        avgFoundingMemories:avg('founding'),
        avgArcResolutions:avg('arcHistoryDelta'),
        avgPersonalChapters:avg('personalChapters'),
        avgActivePersonalChapters:avg('activePersonalChapters')
      },
      breadth:{
        avgVisitedPlaces:avg('visited'),
        avgAchievements:avg('achievements'),
        organizationLeaderShare:+(rows.filter(x=>x.organizationLeader).length/rows.length).toFixed(2),
        avgOrganizationMembers:avg('organizationMembers')
      },
      economy:{
        avgNetWorth:Math.round(rows.reduce((a,x)=>a+x.netWorth,0)/rows.length),
        medianNetWorth:Math.round(median('netWorth')),
        maxNetWorth:Math.max(...rows.map(x=>x.netWorth))
      },
      flow:{
        avgClicksPerYear:+(rows.reduce((a,x)=>a+x.clicksPerYear,0)/rows.length).toFixed(2),
        avgMissionsPerYear:+(rows.reduce((a,x)=>a+x.missionPerYear,0)/rows.length).toFixed(2),
        survival:+(rows.filter(x=>x.alive).length/rows.length).toFixed(2)
      },
      storage:{
        avgSaveKB:+(rows.reduce((a,x)=>a+(x.saveBytes||0),0)/rows.length/1024).toFixed(1),
        maxSaveKB:+(Math.max(...rows.map(x=>x.saveBytes||0))/1024).toFixed(1),
        avgPartsKB:['player','relations','timeline','world','loop','story','codex','achievements','dynasty'].reduce((a,k)=>{a[k]=+(rows.reduce((s,x)=>s+((x.storageParts&&x.storageParts[k])||0),0)/rows.length/1024).toFixed(1);return a},{}),
        avgWorldPartsKB:Array.from(new Set(rows.flatMap(x=>Object.keys(x.worldStorageParts||{})))).reduce((a,k)=>{a[k]=+(rows.reduce((s,x)=>s+((x.worldStorageParts&&x.worldStorageParts[k])||0),0)/rows.length/1024).toFixed(1);return a},{})
      },
      lifeDirector:{
        avgAcceptedMoves:avg('directorJourneys'),
        avgJourneyOffers:avg('directorJourneyOffers'),
        mobilityAcceptanceRate:+(rows.reduce((a,x)=>a+(x.directorJourneyOffers?Math.min(1,x.directorJourneys/x.directorJourneyOffers):0),0)/rows.length).toFixed(2),
        avgRomanceOffers:avg('directorRomanceOffers'),
        romanceOpportunityShare:+(rows.filter(x=>x.directorRomanceOffers>0).length/rows.length).toFixed(2),
        avgFamilyOffers:avg('directorFamilyOffers'),
        familyOpportunityShare:+(rows.filter(x=>x.directorFamilyOffers>0).length/rows.length).toFixed(2),
        avgCareerTurns:avg('directorCareerTurns'),
        careerTurnShare:+(rows.filter(x=>x.directorCareerTurns>0).length/rows.length).toFixed(2)
      }
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
  const rows=profiles.map((cfg,i)=>qaLongCareer(35200+i*37,cfg[0],cfg[1],cfg[2],40));
  const avg=k=>+(rows.reduce((a,x)=>a+(x[k]||0),0)/rows.length).toFixed(1);
  metrics.v50FortyYearCareer={
    sample:rows.length,yearsTarget:40,
    survival:+(rows.filter(x=>x.alive).length/rows.length).toFixed(2),
    avgClicksPerYear:+(rows.reduce((a,x)=>a+x.clicksPerYear,0)/rows.length).toFixed(2),
    avgVisitedPlaces:avg('visited'),
    avgPersonalChapters:avg('personalChapters'),
    avgFoundingMemories:avg('founding'),
    avgRecognition:+(rows.reduce((a,x)=>a+(x.recognition&&x.recognition.score||0),0)/rows.length).toFixed(1),
    organicLegendShare:+(rows.filter(x=>x.endgame&&x.endgame.organic).length/rows.length).toFixed(2),
    partneredShare:+(rows.filter(x=>x.relationshipStatus!=='Célibataire').length/rows.length).toFixed(2),
    parentShare:+(rows.filter(x=>x.children>0).length/rows.length).toFixed(2),
    avgSaveKB:+(rows.reduce((a,x)=>a+(x.saveBytes||0),0)/rows.length/1024).toFixed(1),
    maxSaveKB:+(Math.max(...rows.map(x=>x.saveBytes||0))/1024).toFixed(1),
    profiles:rows.map(x=>({faction:x.faction,spec:x.spec,alive:x.alive,rank:x.finalRank,visited:x.visited,chapters:x.personalChapters,recognition:x.recognition&&x.recognition.score||0,saveKB:+((x.saveBytes||0)/1024).toFixed(1)}))
  };
  const y40=metrics.v50FortyYearCareer;
  if(y40.avgClicksPerYear>6.5)throw new Error('V5.0 forty-year flow regression: '+y40.avgClicksPerYear+' clicks/year');
  if(y40.survival<.50)throw new Error('V5.0 forty-year survival collapse: '+y40.survival);
  if(y40.avgVisitedPlaces<5)throw new Error('V5.0 forty-year journey remains too static: '+y40.avgVisitedPlaces+' places');
  if(y40.avgSaveKB>350||y40.maxSaveKB>450)throw new Error('V5.0 forty-year save growth regression: avg '+y40.avgSaveKB+' KB / max '+y40.maxSaveKB+' KB');
  if(y40.avgPersonalChapters<3)throw new Error('V5.0 forty-year life chapters too dormant: '+y40.avgPersonalChapters);
}
{
  const rows=[];for(let s=0;s<24;s++)rows.push(qaLongCareer(34500+s,'Pirates','Duelliste','combat',20));
  const plans=rows.reduce((a,x)=>{Object.entries(x.planCounts||{}).forEach(([k,v])=>a[k]=(a[k]||0)+v);return a},{});
  metrics.v40PirateFlowStress={
    sample:rows.length,survival:+(rows.filter(x=>x.alive).length/rows.length).toFixed(2),
    avgClicksPerYear:+(rows.reduce((a,x)=>a+x.clicksPerYear,0)/rows.length).toFixed(2),
    avgHeat:+(rows.reduce((a,x)=>a+x.avgHeat,0)/rows.length).toFixed(1),
    deathCauses:rows.filter(x=>!x.alive).reduce((a,x)=>{const k=x.deathCause||'unknown';a[k]=(a[k]||0)+1;return a},{}),
    planCounts:plans
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

{
  const seeds=6,months=480,rows=[];
  for(let si=0;si<seeds;si++){
    const g=fresh(33000+si),ws=g.world.worldState,seenSaga=new Set(),seenResolved=new Set(),seenGeo=new Set();
    const createdByType={},outcomes={},durations=[],geoCauses={},flips={},activeCounts=[],warCounts=[];
    let maxActive=0,totalCreated=0,totalResolved=0;
    const initialBytes=JSON.stringify(g).length,start=Date.now();
    for(let m=0;m<months;m++){
      q.worldMonthStep();
      const active=(ws.worldSagas||[]).filter(x=>x.status==='active');
      activeCounts.push(active.length);maxActive=Math.max(maxActive,active.length);
      warCounts.push((g.world.wars||[]).filter(x=>x.status==='active').length);
      (ws.worldSagas||[]).forEach(s=>{
        if(!seenSaga.has(s.id)){seenSaga.add(s.id);totalCreated++;createdByType[s.type]=(createdByType[s.type]||0)+1}
      });
      (ws.sagaHistory||[]).forEach(s=>{
        if(!seenResolved.has(s.id)){seenResolved.add(s.id);totalResolved++;outcomes[s.outcome]=(outcomes[s.outcome]||0)+1;if(Number.isFinite(s.months))durations.push(s.months)}
      });
      (ws.geopoliticalHistory||[]).forEach(h=>{
        if(seenGeo.has(h.seq))return;seenGeo.add(h.seq);
        const cause=String(h.cause||'unknown'),bucket=cause.startsWith('war:')?'war':cause.startsWith('actor:')?'actor':cause.startsWith('player')?'player':cause.startsWith('crew-')?'crew':cause==='world'||cause==='ambient'?'ambient':'other';
        geoCauses[bucket]=(geoCauses[bucket]||0)+1;flips[h.name]=(flips[h.name]||0)+1;
      });
    }
    const controllers={};Object.values(g.world.territories).forEach(t=>controllers[t.controller]=(controllers[t.controller]||0)+1);
    const terrCount=Object.keys(g.world.territories).length,dominant=Math.max(...Object.values(controllers))/Math.max(1,terrCount);
    const goals=Object.fromEntries(['Pirates','Marine','Révolutionnaires','Gouvernement','Civil','Chasseur de primes'].map(f=>{const x=q.factionWorldGoal(f);return[f,{progress:+(x.progress||0).toFixed(1),completed:x.completed||0}]}));
    const resolvedWars=(g.world.wars||[]).filter(w=>w.status==='resolved');
    rows.push({
      created:totalCreated,resolved:totalResolved,createdByType,outcomes,
      avgActive:+(activeCounts.reduce((a,b)=>a+b,0)/activeCounts.length).toFixed(2),maxActive,
      avgDuration:durations.length?+(durations.reduce((a,b)=>a+b,0)/durations.length).toFixed(1):0,
      geoEvents:seenGeo.size,geoCauses,maxFlips:Math.max(0,...Object.values(flips)),dominantShare:+dominant.toFixed(2),controllers,
      avgWars:+(warCounts.reduce((a,b)=>a+b,0)/warCounts.length).toFixed(2),
      avgWarDuration:resolvedWars.length?+(resolvedWars.reduce((a,w)=>a+(w.months||0),0)/resolvedWars.length).toFixed(1):0,
      goals,initialBytes,finalBytes:JSON.stringify(g).length,elapsedMs:Date.now()-start
    });
  }
  const sum=k=>rows.reduce((a,x)=>a+(x[k]||0),0),mergeMap=k=>rows.reduce((acc,x)=>{Object.entries(x[k]||{}).forEach(([n,v])=>acc[n]=(acc[n]||0)+v);return acc},{});
  const typeTotals=mergeMap('createdByType'),outcomeTotals=mergeMap('outcomes'),causeTotals=mergeMap('geoCauses'),controllerNames=[...new Set(rows.flatMap(x=>Object.keys(x.controllers||{})))],controllerSummary={};
  controllerNames.forEach(f=>controllerSummary[f]=+(rows.reduce((a,x)=>a+((x.controllers&&x.controllers[f])||0),0)/rows.length).toFixed(1));
  const goalSummary={};['Pirates','Marine','Révolutionnaires','Gouvernement','Civil','Chasseur de primes'].forEach(f=>{
    goalSummary[f]={avgProgress:+(rows.reduce((a,x)=>a+x.goals[f].progress,0)/rows.length).toFixed(1),avgCompleted:+(rows.reduce((a,x)=>a+x.goals[f].completed,0)/rows.length).toFixed(1)};
  });
  metrics.v40LivingWorld={
    samples:rows.length,years:40,
    sagas:{avgActive:+(sum('avgActive')/rows.length).toFixed(2),avgCreatedPerDecade:+(sum('created')/rows.length/4).toFixed(2),avgResolved:+(sum('resolved')/rows.length).toFixed(1),resolutionRate:+(sum('resolved')/Math.max(1,sum('created'))).toFixed(2),avgDuration:+(sum('avgDuration')/rows.length).toFixed(1),maxActive:Math.max(...rows.map(x=>x.maxActive)),types:typeTotals,outcomes:outcomeTotals,ruptureRate:+((outcomeTotals['rupture']||0)/Math.max(1,sum('resolved'))).toFixed(2),stabilizationRate:+((outcomeTotals['stabilisation']||0)/Math.max(1,sum('resolved'))).toFixed(2),newBalanceRate:+((outcomeTotals['nouvel équilibre']||0)/Math.max(1,sum('resolved'))).toFixed(2)},
    geopolitics:{avgShifts:+(sum('geoEvents')/rows.length).toFixed(1),causes:causeTotals,avgMaxFlips:+(sum('maxFlips')/rows.length).toFixed(1),avgDominantShare:+(sum('dominantShare')/rows.length).toFixed(2),avgTerritoriesByController:controllerSummary,avgActiveWars:+(sum('avgWars')/rows.length).toFixed(2),avgWarDuration:+(sum('avgWarDuration')/rows.length).toFixed(1)},
    factionGoals:goalSummary,
    performance:{avgInitialSaveKB:+(sum('initialBytes')/rows.length/1024).toFixed(1),avgFinalSaveKB:+(sum('finalBytes')/rows.length/1024).toFixed(1),avgWorldMonthMs:+(sum('elapsedMs')/rows.length/months).toFixed(2)}
  };
}
{
  const g=fresh(33601),ws=g.world.worldState,s=q.startWorldSaga('rivalry',g.player.region,'Alpha','Beta','audit'),before=s.pressure;
  for(let i=0;i<12;i++)q.playerSagaPresence();
  metrics.v40PlayerSagaBaseline={involved:!!s.playerInvolved,role:s.playerRole||null,presenceMonths:s.playerPresenceMonths||0,impact:s.playerImpact||0,pressureGain:+(s.pressure-before).toFixed(1),peakPower:s.playerPeakPower||0};
}
{
  const g=fresh(33602),factions=['Pirates','Marine','Révolutionnaires','Gouvernement','Civil','Chasseur de primes'],out={};
  factions.forEach(f=>q.factionWorldGoal(f));
  for(let i=0;i<1200;i++)q.updateFactionWorldGoals();
  factions.forEach(f=>{const x=q.factionWorldGoal(f);out[f]={progress:+(x.progress||0).toFixed(1),completed:x.completed||0}});
  metrics.v40FactionAutopilot=out;
}
{
  const factions=['Pirates','Marine','Révolutionnaires','Gouvernement','Chasseur de primes','Civil'],out={};
  factions.forEach((f,ix)=>{
    const g=fresh(33700+ix),p=g.player;p.ageMonths=480;p.money=7000000;p.reputation=100;
    Object.keys(p.stats).forEach(k=>{p.stats[k]=90;p.caps[k]=98;p.absoluteCaps[k]=100});
    Object.keys(p.skills).forEach(k=>{p.skills[k]=88;p.caps[k]=98;p.absoluteCaps[k]=100});
    p.factionRep[f]=95;if(f!=='Civil')q.join(f);
    if(f==='Pirates'){p.bounty=1200000000;['Foosha Village','Orange Town','Syrup Village'].forEach(n=>{if(g.world.territories[n])g.world.territories[n].playerControl={ownerKey:String(g.seed),ownerName:p.name,faction:'Pirates',control:80,mode:'conquest'}});g.world.crews.filter(c=>c.faction==='Pirates').slice(0,3).forEach(c=>c.affiliation={ownerKey:String(g.seed),ownerName:p.name})}
    if(f==='Marine')p.rank='Vice-amiral';
    if(f==='Révolutionnaires')p.rank='Commandant régional';
    if(f==='Gouvernement')p.rank='CP0';
    if(f==='Chasseur de primes'){p.justice.captures=20;p.justice.bountiesClaimed=250000000}
    if(f==='Civil'){p.specialization='Scientifique';p.skills.Science=95}
    for(let n=0;n<5;n++)g.world.worldState.sagaHistory.push({id:'elite-'+f+'-'+n,playerInvolved:true,playerRole:n<2?'responsible':'decisive',region:p.region,months:18});
    for(let n=0;n<8;n++)g.world.worldState.playerCanonImpact.push({eventId:'elite-canon-'+n,kind:n<2?'major':'direct'});
    const r=q.playerWorldRecognition(),e=q.endgameStage();
    out[f]={score:r.score,role:r.role,organic:!!(e&&e.organic),stage:e&&e.label};
  });
  metrics.v40EndgameElitePaths=out;
}

{
  const g=fresh(33800),places=Object.keys(q.constants.PL),initialBytes=JSON.stringify(g).length,sizes=[],targetGenerations=28;
  for(let gen=1;gen<=targetGenerations;gen++){
    const p=g.player;
    p.ageMonths=Math.max(p.ageMonths||0,420);p.money=500000+gen*25000;p.reputation=Math.min(100,35+gen*2);
    p.visited=places.slice(0,Math.min(12,2+(gen%11)));
    q.signalPersonalChapter('career','Chapitre dynastique '+gen,18,'audit-career-a-'+gen,'dynasty-'+gen);
    p.ageMonths+=6;
    q.signalPersonalChapter('career','Chapitre dynastique '+gen,20,'audit-career-b-'+gen,'dynasty-'+gen);
    q.recordSignatureMoment('Moment génération '+gen,'Une trace majeure transmise à la génération suivante.','life-chapter',78);
    const child={id:'audit-heir-'+gen,name:'Héritier '+gen,ageMonths:220,birthplace:p.island,birthRegion:p.region,race:p.race,status:'active',bond:82};
    p.children=[child];g.death={cause:'Audit dynastique génération '+gen};
    q.buildHeir(child);
    if(g.version!==28)throw new Error('V5.0 dynasty stress changed GameState version at generation '+gen);
    if(g.dynasty.ancestors.length>20)throw new Error('V5.0 ancestor history exceeded cap at generation '+gen+': '+g.dynasty.ancestors.length);
    sizes.push(JSON.stringify(g).length);
  }
  const ancestors=g.dynasty.ancestors||[],legacyCount=ancestors.filter(a=>a.legacy&&Array.isArray(a.legacy.visited)&&Array.isArray(a.legacy.signatureMoments)&&Array.isArray(a.legacy.chapters)).length,finalBytes=JSON.stringify(g).length,dynastyBytes=JSON.stringify(g.dynasty).length;
  metrics.v50DynastyStress={
    simulatedGenerations:targetGenerations,
    finalGeneration:g.dynasty.generation,
    retainedAncestors:ancestors.length,
    legacyShare:+(legacyCount/Math.max(1,ancestors.length)).toFixed(2),
    initialSaveKB:+(initialBytes/1024).toFixed(1),
    finalSaveKB:+(finalBytes/1024).toFixed(1),
    saveGrowthKB:+((finalBytes-initialBytes)/1024).toFixed(1),
    dynastyKB:+(dynastyBytes/1024).toFixed(1),
    maxSaveKB:+(Math.max(...sizes)/1024).toFixed(1)
  };
  if(ancestors.length!==20)throw new Error('V5.0 dynasty retention cap not exercised: '+ancestors.length);
  if(metrics.v50DynastyStress.legacyShare<1)throw new Error('V5.0 dynasty lost legacy snapshots: '+metrics.v50DynastyStress.legacyShare);
  if(metrics.v50DynastyStress.saveGrowthKB>100)throw new Error('V5.0 dynasty save growth is excessive: '+metrics.v50DynastyStress.saveGrowthKB+' KB');
  if(metrics.v50DynastyStress.dynastyKB>60)throw new Error('V5.0 dynasty metadata is excessive: '+metrics.v50DynastyStress.dynastyKB+' KB');
}
console.log('V50_DYNASTY_AUDIT '+JSON.stringify(metrics.v50DynastyStress));

{
  const lw=metrics.v40LivingWorld,pf=metrics.v40PirateFlowStress;
  if(lw.sagas.avgCreatedPerDecade>6)throw new Error('V4.0 saga density regression: '+lw.sagas.avgCreatedPerDecade+' created/decade');
  if(lw.sagas.avgActive>1.5)throw new Error('V4.0 saga concurrency regression: '+lw.sagas.avgActive+' active average');
  if(lw.sagas.resolutionRate<.7)throw new Error('V4.0 saga resolution regression: '+lw.sagas.resolutionRate);
  if(lw.geopolitics.avgDominantShare>.60)throw new Error('V4.0 territorial monopoly regression: '+lw.geopolitics.avgDominantShare);
  if(lw.geopolitics.avgShifts>35)throw new Error('V4.0 territorial churn regression: '+lw.geopolitics.avgShifts+' shifts/40y');
  if(lw.performance.avgFinalSaveKB>300)throw new Error('V4.0 save growth regression: '+lw.performance.avgFinalSaveKB+' KB');
  if(lw.performance.avgWorldMonthMs>12)throw new Error('V4.0 world simulation regression: '+lw.performance.avgWorldMonthMs+' ms/month');
  if(pf.avgClicksPerYear>8.5)throw new Error('V4.0 pirate flow regression: '+pf.avgClicksPerYear+' clicks/year');
  if(pf.survival<.70)throw new Error('V4.0 pirate survival regression: '+pf.survival);
  const runaway=Math.max(...Object.values(lw.factionGoals).map(x=>x.avgCompleted||0));if(runaway>5)throw new Error('V4.0 collective ambition runaway: '+runaway+' completions/40y');
}
{
  const v5=metrics.v40PostReleaseAudit;
  console.log('V50_PRE_GATE '+JSON.stringify({lifeDirector:v5.lifeDirector,career:v5.career,personalLife:v5.personalLife,narrative:v5.narrative,breadth:v5.breadth,flow:v5.flow,storage:v5.storage}));
  if(v5.flow.avgClicksPerYear>6.2)throw new Error('V5.0 flow regression: '+v5.flow.avgClicksPerYear+' clicks/year');
  if(v5.flow.survival<.85)throw new Error('V5.0 survival regression: '+v5.flow.survival);
  if(v5.storage.avgSaveKB>300||v5.storage.maxSaveKB>400)throw new Error('V5.0 career save growth regression: avg '+v5.storage.avgSaveKB+' KB / max '+v5.storage.maxSaveKB+' KB');
  if(v5.breadth.avgVisitedPlaces<2.5)throw new Error('V5.0 Grand Journey too static: '+v5.breadth.avgVisitedPlaces+' places visited/20y');
  if(v5.personalLife.partneredShare<.15)throw new Error('V5.0 personal life too dormant: '+v5.personalLife.partneredShare+' partnered share');
  if(v5.personalLife.parentShare<=0)throw new Error('V5.0 family legacy never emerged in long careers');
  if(v5.career.avgRankVariety<1.15)throw new Error('V5.0 career trajectories remain too uniform: '+v5.career.avgRankVariety+' ranks/profile');
  if(v5.narrative.avgPersonalChapters<.5)throw new Error('V5.0 personal chapters too dormant: '+v5.narrative.avgPersonalChapters+' per career');
  if(v5.lifeDirector.avgCareerTurns>1.75)throw new Error('V5.0 career turning points became micromanagement: '+v5.lifeDirector.avgCareerTurns+' turns/20y');
}
console.log('V40_LIVING_WORLD_AUDIT '+JSON.stringify({
  livingWorld:metrics.v40LivingWorld,
  passiveSaga:metrics.v40PlayerSagaBaseline,
  factionAutopilot:metrics.v40FactionAutopilot,
  elitePaths:metrics.v40EndgameElitePaths,
  pirateFlow:metrics.v40PirateFlowStress
}));

console.log('V40_POST_RELEASE_AUDIT '+JSON.stringify(metrics.v40PostReleaseAudit));
console.log('V50_GRAND_JOURNEY_AUDIT '+JSON.stringify({lifeDirector:metrics.v40PostReleaseAudit.lifeDirector,career:metrics.v40PostReleaseAudit.career,personalLife:metrics.v40PostReleaseAudit.personalLife,narrative:metrics.v40PostReleaseAudit.narrative,breadth:metrics.v40PostReleaseAudit.breadth,flow:metrics.v40PostReleaseAudit.flow,fortyYearCareer:metrics.v50FortyYearCareer,dynasty:metrics.v50DynastyStress}));
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

// V3.5 final tension dynamics release audit

// final V3.5 named long-audit trigger

// V4.0 emergent world saga foundation stress pass

// V4.0 Living World release candidate full stress audit

// V4.0 post-workflow-rename release audit

// V4.0 final world-pulse release pass

// V4.0 full Living World release regression: collective ambitions, causal geopolitics, saga participation, organic endgame

// V4.0 final RC after economy persistence correction

// V4.0 final release audit after PWA cache refresh

// V4.0 final workflow-metadata-aligned release audit
