import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const files=['src/core/module-registry.js','src/data/career-market-v112.js','src/v112/career-market-engine-v112.js'];
const win={};win.window=win;
const ctx=vm.createContext({window:win,console,Math,Number,String,Object,Array,Map,Set});
for(const p of files)vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
const data=win.OPL_MODULES.get('careerMarketDataV112'),m=win.OPL_MODULES.get('careerMarketEngineV112');
assert(data&&m,'Career market dependencies missing');
assert(data.ordinary.length>=40,'There must be a broad catalogue of jobs');
assert(data.special.length>=6,'Pirates, marines, government, hunters and revolutionaries are required');
assert(data.special.some(x=>x.id==='pirate_join')&&data.special.some(x=>x.id==='pirate_found'),'Joining or founding a pirate crew must be distinct');
const valid={age:21,year:21,island:'Shells Town',career:'Aucune',rank:'Sans emploi',faction:'Civil',energy:95,money:5000,bounty:0,
 skills:{Combat:45,Commandement:60,Navigation:65,Discrétion:40},stats:{Discipline:60,Intelligence:75,Force:75,Endurance:75,Charisme:60},schoolBonus:12,alive:true,pending:false,travel:false};
const state=m.normalize({},21);
valid.region='East Blue';
const worldCrew={id:'east-vipers',name:'Équipage des Vipères',power:68,captainPower:76,region:'East Blue',status:'active'};
const localCrews=m.crewOffers(valid,[worldCrew]);
assert(localCrews.some(c=>c.id==='world:east-vipers'&&c.name===worldCrew.name),'A living world pirate crew must be available in its actual region');
assert(localCrews.length>=3,'The pirate recruiter must show several distinct captains');
assert.deepEqual(localCrews,m.crewOffers(valid,[worldCrew]),'Recruiting pirate crews must be stable during the same year');
assert(!m.crewOffers({...valid,region:'North Blue'},[worldCrew]).some(c=>c.id==='world:east-vipers'),'World crews must not appear in unrelated seas');
valid.crewOptions=localCrews;
const shown=m.offers(state,valid).map(x=>x.id);
assert(shown.length>=10,'The market should display numerous vacancies');
assert.deepEqual(shown,m.offers(state,valid).map(x=>x.id),'Offers should remain stable inside a year');
assert(shown.some(x=>data.ordinary.find(j=>j.id===x)?.minAge<=21),'Playable job must appear');
const vacancies=m.offers(state,valid).filter(job=>m.status(job,state,valid).available);
assert(vacancies.length>=4,'At least four genuinely accessible vacancies should be available at age 21');
const [first,second,third,fourth]=vacancies;
const child={...valid,age:12,year:12};
assert(!m.status(first,state,child).available,'Children must not join full-time jobs');
assert(m.status(first,state,valid).available,'An unemployed adult must be allowed to apply to local vacancies');
assert(!m.status(m.byId('doctor'),state,{...valid,stats:{Intelligence:5}}).available,'Specialized jobs need prerequisites');
const interview=m.startInterview(state,first.id,valid);
assert(interview.ok&&interview.state.interview.id===first.id,'An application should open an interview');
assert(!m.startInterview(interview.state,second.id,valid).ok,'No second interview may start while another is unresolved');
assert(!m.apply(interview.state,first.id,valid,0).ok,'A started interview must receive an answer');
const hired=m.apply(interview.state,first.id,valid,0,'skills');
assert(hired.ok&&hired.accepted&&hired.state.current?.id===first.id,'Qualified interviews must permit recruitment');
assert(!hired.state.interview,'Resolved interviews must close');
assert(hired.energyCost===3,'Applications must consume the advertised amount of energy');
assert(m.status(second,hired.state,valid).available,'Civilian employees must be able to seek better employment before resigning');
assert(!m.status(first,hired.state,valid).available,'Players cannot reapply to their own current occupation');
assert(!m.status(m.byId('marine'),hired.state,valid).available,'Special career enrollment must remain separate from ordinary employment');
assert(!m.apply(hired.state,second.id,valid,0).ok,'Civilian candidates may not bypass mandatory interviews');
const hunt=m.startInterview({...hired.state,jobHunt:true},second.id,valid);
assert(hunt.ok,'Job search must permit interviewing while still employed');
const huntRefused=m.apply(hunt.state,second.id,valid,1,'team');
assert(huntRefused.ok&&!huntRefused.accepted&&huntRefused.state.current?.id===first.id&&huntRefused.state.jobHunt,
  'Rejected job switches must preserve the previous job, salary and job search');
const nextInterview=m.startInterview(huntRefused.state,third.id,valid);
assert(nextInterview.ok,'A different vacancy must remain accessible after a rejection');
const switched=m.apply(nextInterview.state,third.id,valid,0,'skills');
assert(switched.accepted&&switched.switched&&switched.previous.id===first.id&&switched.state.current.id===third.id,
  'Accepted job switch must replace the old job and report its identity');
assert(switched.state.raisePct===0&&!switched.state.jobHunt&&switched.state.lastPromotionYear===-1,
  'Moving employer must reset negotiated wage, promotion cooldown and job search');
assert(!m.status(m.byId('hunter'),switched.state,valid).available,'Switching between civilian jobs must never leak into bounty hunter careers');
const salaryContext={...valid,performance:76,trust:62,workSessions:4,energy:95};
assert(!m.raiseStatus(hired.state,{...salaryContext,workSessions:1}).available,'Ordinary raises require actual employment history');
assert(!m.raiseStatus(hired.state,{...salaryContext,performance:30}).available,'Salary negotiation must depend on professional performance');
const wageBefore=m.estimatedPay(hired.state,{rank:'Apprenti'});
const negotiated=m.negotiateRaise(hired.state,salaryContext,0);
assert(negotiated.ok&&negotiated.accepted&&negotiated.raisePct===8,'Successful negotiation grants an 8% raise');
const wageAfter=m.estimatedPay(negotiated.state,{rank:'Apprenti'});
assert(wageAfter.perAction>wageBefore.perAction&&wageAfter.annualMax===wageAfter.perAction*4,
  'Wage increase must affect real voluntary work payments');
assert(!m.raiseStatus(negotiated.state,salaryContext).available,'Raises must be capped to one request per year');
assert(m.raiseStatus(m.normalize(negotiated.state,22),{...salaryContext,year:22}).available,
  'Salary negotiation should renew in the next life year');
const refusedRaise=m.negotiateRaise(hired.state,salaryContext,1);
assert(refusedRaise.ok&&!refusedRaise.accepted&&refusedRaise.raisePct===0,
  'Employers can refuse a demand; failure must not award phantom salary');

const pay1=m.estimatedPay(hired.state,{rank:'Apprenti'}),pay2=m.estimatedPay(hired.state,{rank:'Expert'});
assert(pay2.perAction>pay1.perAction&&pay1.annualMax===pay1.perAction*4,'Civilian salaries must grow with promotions but remain action-based');
const promotionContext={...salaryContext,rank:'Apprenti',careerXP:35,workSessions:5,performance:74,trust:67};
const promoted=m.civilPromotion(hired.state,promotionContext,0);
assert(promoted.ok&&promoted.accepted&&promoted.rank==='Professionnel'&&promoted.cost===6,
  'Eligible civil employees can request an explicit promotion with a real energy cost');
assert(!m.civilPromotionStatus(promoted.state,promotionContext).available,'Only one civilian promotion review is allowed per year');
assert(m.estimatedPay(promoted.state,{rank:promoted.rank}).perAction>m.estimatedPay(hired.state,{rank:'Apprenti'}).perAction,
  'Civil promotions must increase the salary of deliberate work actions');
const promotionNext=m.normalize(promoted.state,22);
assert(m.civilPromotionStatus(promotionNext,{...promotionContext,year:22,rank:'Apprenti'}).available,
  'Civil promotion eligibility resets with the next year');
const promotionDenied=m.civilPromotion(hired.state,promotionContext,1);
assert(promotionDenied.ok&&!promotionDenied.accepted&&promotionDenied.rank==='Apprenti',
  'Promotions must be refusible with no phantom change of grade');
assert(!m.civilPromotionStatus(hired.state,{...promotionContext,careerXP:3}).available,
  'Too little professional XP must block a civilian promotion');
assert(!m.civilPromotionStatus(hired.state,{...promotionContext,performance:20}).available,
  'Low professional performance must block a civilian promotion');
assert(!m.civilPromotionStatus(hired.state,{...promotionContext,workSessions:1}).available,
  'No promotion without real work sessions');
assert(!m.civilPromotionStatus(hired.state,{...promotionContext,rank:'Maître'}).available,
  'The maximum civilian rank must be respected');
assert(!m.civilPromotionStatus(m.normalize({current:{kind:'special',id:'marine',startYear:20}},21),
  {...promotionContext,faction:'Marine',rank:'Recrue'}).available,
  'Faction members must never use the ordinary employee promotion system');
const retired=m.resign(hired.state,valid);
assert(retired.ok&&!retired.state.current,'Resigning must free the current occupation');
const secondInterview=m.startInterview(retired.state,second.id,valid);
assert(secondInterview.ok,'Resigned candidates still need an interview');
const rejected=m.apply(secondInterview.state,second.id,valid,1,'team');
assert(rejected.ok&&!rejected.accepted,'Interviews must also allow refusals');
assert(!m.startInterview(rejected.state,second.id,valid).ok,'One vacancy cannot be spammed during a year');
const thirdInterview=m.startInterview(rejected.state,third.id,valid);
assert(thirdInterview.ok,'Another interview can start after a rejected candidacy');
const thirdTry=m.apply(thirdInterview.state,third.id,valid,1,'ambition');
assert(thirdTry.ok&&!thirdTry.accepted,'The third application should remain possible');
assert(!m.status(fourth,thirdTry.state,valid).available,'Annual application quota must work');
const future={...valid,year:22};
const futureVacancy=m.offers(state,future).find(job=>m.status(job,m.normalize(thirdTry.state,22),future).available);
assert(futureVacancy,'Applications must refresh when a new year brings new local offers');
const cancelled=m.cancelInterview(interview.state,valid.year);
assert(!cancelled.interview&&m.status(first,cancelled,valid).available,'An interview must be cancellable without consuming a candidature');
assert(!m.startInterview(state,'hunter',valid).ok,'Independent bounty hunting should not require an interview');
assert(!m.status(m.byId('government'),state,{...valid,bounty:1000}).available,'Wanted characters cannot join the government');
assert(!m.status(m.byId('pirate_found'),state,{...valid,money:100}).available,'Founding a crew must require funds');
assert(m.apply(state,'pirate_found',valid,0).accepted,'An adult with leadership and funds may found their own crew');
assert(m.apply(state,'pirate_found',valid,1).accepted,'Founding a qualified pirate crew must be guaranteed even at a maximal random roll');
assert(m.apply(state,'hunter',valid,1).accepted,'Independent bounty hunters must not fail an imaginary recruiter interview');
assert(!m.normalize(interview.state,22).interview,'Abandoned interviews must expire when the year changes');
const youngContext={...valid,age:16,year:16,crewOptions:m.crewOffers({...valid,age:16,year:16},[worldCrew])};
assert(!m.startInterview(state,'pirate_join',youngContext).ok,'Pirate enlistment must require choosing an existing crew');
const choice=m.chooseCrew(state,'world:east-vipers',youngContext);
assert(choice.ok&&choice.state.crewChoice.id==='world:east-vipers','Player must be able to choose which crew to join');
assert(!m.chooseCrew(state,'fictional-crew',youngContext).ok,'Invented or missing pirate crews may not be selected');
const pirateInterview=m.startInterview(choice.state,'pirate_join',youngContext);
assert(pirateInterview.ok,'Choosing a crew should unlock the playable pirate recruitment interview');
const joined=m.apply(pirateInterview.state,'pirate_join',youngContext,0,'ambition');
assert(joined.accepted&&joined.joinCrew.name===worldCrew.name&&joined.joinCrew.captain.includes(worldCrew.name),
  'Joining pirates must preserve the exact selected ship and captain');
assert(!m.normalize(choice.state,17).crewChoice,'Crew selection expires when available crews refresh next year');
assert(m.chooseCrew(state,localCrews[0].id,valid).ok,'Another pirate crew may be selected without consuming an application');
assert(!m.status(m.byId('marine'),state,{...valid,travel:true}).available,'Applications must not work during a crossing');
assert(!m.status(m.byId('marine'),state,{...valid,pending:true}).available,'Story decisions must take priority');
const migrated=m.normalize({current:{id:'legacy',kind:'ordinary',startYear:18}},21);
assert(m.resign(migrated,{...valid,career:'Marchand'}).ok,'Old careers must be terminable without deleting the save');
// Distinct special-career engines and independently renewable operations.
const ops=data.specialOperations;
assert(ops.length>=15,'Special careers need faction-specific operations');
for(const faction of [...new Set(data.special.map(x=>x.faction))])
 assert(ops.filter(x=>x.faction===faction).length>=2,'No specific operations for '+faction);
const activeMarine=m.normalize({current:{id:'marine',kind:'special',startYear:19}},21);
const marineActions=m.specialOperations(activeMarine,{...valid,faction:'Marine',rank:'Recrue'});
assert(marineActions.some(x=>x.id==='marine_patrol')&&marineActions.every(x=>x.faction==='Marine'),'Marines only receive Marine operations');
const patrol=m.specialPerform(activeMarine,'marine_patrol',{...valid,faction:'Marine',rank:'Recrue'},0);
assert(patrol.ok&&patrol.success&&patrol.xp>0&&patrol.energyCost>0,'Operations must produce actual costs and XP');
assert(patrol.state.operations.some(x=>x.id==='marine_patrol'&&x.success),'Results must persist across render and save');
assert(!m.specialStatus(ops.find(x=>x.id==='marine_arrest'),activeMarine,
 {...valid,faction:'Marine',rank:'Recrue'}).available,
 'Arresting suspects must require a prepared case first');
assert(patrol.state.specialPreparation===1,'Successful patrols must create a genuine intervention dossier');
const failed=m.specialPerform(patrol.state,'marine_arrest',{...valid,faction:'Marine',rank:'Recrue'},1);
assert(failed.ok&&!failed.success&&failed.healthLoss>0&&failed.state.specialPreparation===0,
 'Risky arrests must spend their prepared case even on failure, with a real injury');
assert(!m.specialPerform(activeMarine,'pirate_raid',{...valid,faction:'Marine'},0).ok,'Marines may not raid as pirates');
assert(!m.specialPerform(state,'marine_patrol',{...valid,faction:'Marine'},0).ok,'Unemployed characters may not perform special missions');
let quota=activeMarine;
for(let i=0;i<2;i++){const result=m.specialPerform(quota,'marine_patrol',{...valid,faction:'Marine',rank:'Recrue'},0);assert(result.ok);quota=result.state}
assert(!m.specialStatus(ops.find(x=>x.id==='marine_patrol'),quota,{...valid,faction:'Marine'}).available,'Per-operation annual limit must be enforced');
assert(m.specialStatus(ops.find(x=>x.id==='marine_patrol'),m.normalize(quota,22),{...valid,year:22,faction:'Marine'}).available,'Special missions renew each year');
const pirateCareer=m.normalize({current:{id:'pirate_found',kind:'special',startYear:18}},21);
assert(m.specialStatus(ops.find(x=>x.id==='pirate_recruit'),pirateCareer,{...valid,faction:'Pirates',isCaptain:true}).available,'Captains may recruit their crew');
assert(!m.specialStatus(ops.find(x=>x.id==='pirate_recruit'),pirateCareer,{...valid,faction:'Pirates',isCaptain:false}).available,'Only captains may recruit crew members');
assert(!m.specialStatus(ops.find(x=>x.id==='pirate_loyalty'),pirateCareer,{...valid,faction:'Pirates',isCaptain:true}).available,'Captains cannot earn their own captain loyalty');
assert(!m.raiseStatus(pirateCareer,salaryContext).available,'Special careers cannot negotiate civilian salary raises');
const pirateCrewMember=m.normalize({current:{id:'pirate_join',kind:'special',startYear:18}},21);
const command={...valid,faction:'Pirates',rank:'Bras droit',isCaptain:false,hasCrewCaptain:true,trust:70,energy:90};
const duel=ops.find(x=>x.id==='pirate_challenge');
assert(duel?.role==='heir','Pirate leadership must be an independent operation');
assert(!m.specialStatus(duel,pirateCrewMember,{...command,rank:'Combattant'}).available,
  'Only the right-hand crew member may challenge the captain');
assert(!m.specialStatus(duel,pirateCrewMember,{...command,trust:30}).available,
  'A challenge requires real crew trust');
assert(!m.specialStatus(duel,pirateCrewMember,{...command,hasCrewCaptain:false}).available,
  'The takeover requires an existing captain, not an imaginary opponent');
const captainGate=m.specialStatus(duel,pirateCrewMember,command);
assert(captainGate.available&&captainGate.chance>0&&captainGate.chance<1,
  'Qualified player must have a real chance to claim leadership');
const wonDuel=m.specialPerform(pirateCrewMember,'pirate_challenge',command,0);
assert(wonDuel.ok&&wonDuel.success&&wonDuel.trust>0,'Captainship should be achieved by success');
const lostDuel=m.specialPerform(pirateCrewMember,'pirate_challenge',command,1);
assert(lostDuel.ok&&!lostDuel.success&&lostDuel.trust<=-10,
  'Failed mutiny should negatively affect the relationship with the crew');
assert(!m.specialStatus(duel,pirateCrewMember,{...command,isCaptain:true}).available,
  'Captains cannot challenge themselves');

const govt=m.normalize({current:{id:'government',kind:'special',startYear:18}},21);
assert(!m.specialStatus(ops.find(x=>x.id==='government_cipher'),govt,{...valid,faction:'Gouvernement',rank:'Recrue'}).available,'Cipher Pol operations require career progression');
assert(!m.specialStatus(ops.find(x=>x.id==='government_cipher'),govt,
 {...valid,faction:'Gouvernement',rank:'Agent spécial'}).available,
 'Cipher Pol eligibility requires gathered intelligence as well as rank');
const governmentCtx={...valid,faction:'Gouvernement',rank:'Agent spécial'};
const dossier1=m.specialPerform(govt,'government_intel',governmentCtx,0);
const dossier2=m.specialPerform(dossier1.state,'government_intel',governmentCtx,0);
assert(dossier1.ok&&dossier2.ok&&dossier2.state.specialPreparation===2,
 'Government agents must be able to collect two separate dossiers');
assert(m.specialStatus(ops.find(x=>x.id==='government_cipher'),dossier2.state,governmentCtx).available,
 'Advanced agents can launch Cipher Pol missions only after two real intelligence reports');
const cipher=m.specialPerform(dossier2.state,'government_cipher',governmentCtx,0);
assert(cipher.ok&&cipher.preparationSpent===2&&cipher.state.specialPreparation===0,
 'Cipher Pol operations must consume both classified dossiers');
assert(!m.specialStatus(ops.find(x=>x.id==='government_intel'),govt,{...valid,faction:'Gouvernement',travel:true}).available,'No clandestine operation during a crossing');
// The five special careers have DIFFERENT operational prerequisites and budgets.
assert(Object.keys(data.specialPreparation).length===5,'Every independent special career needs its own preparation economy');
assert(!m.preparationStatus(hired.state,valid),'Civilian jobs must never inherit faction mission stock');
for(const [faction,jobId,prepId,missionId,baseCtx] of [
 ['Pirates','pirate_join','pirate_loyalty','pirate_raid',{...valid,faction:'Pirates',rank:'Mousse',isCaptain:false}],
 ['Marine','marine','marine_patrol','marine_arrest',{...valid,faction:'Marine',rank:'Recrue'}],
 ['Gouvernement','government','government_intel','government_infiltrate',{...valid,faction:'Gouvernement',rank:'Agent'}],
 ['Chasseurs de primes','hunter','hunter_track','hunter_capture',{...valid,faction:'Chasseurs de primes',rank:'Débutant'}],
 ['Révolutionnaires','revolution','revolution_network','revolution_rescue',{...valid,faction:'Révolutionnaires',rank:'Sympathisant'}]
]){
 const empty=m.normalize({current:{id:jobId,kind:'special',startYear:18}},21);
 const mission=data.specialOperations.find(x=>x.id===missionId);
 assert(!m.specialStatus(mission,empty,baseCtx).available,
   faction+': risky operations must not start before faction-specific groundwork');
 const prepared=m.specialPerform(empty,prepId,baseCtx,0);
 assert(prepared.ok&&prepared.success&&prepared.preparationEarned===1,
   faction+': groundwork must yield an actual career-specific resource');
 assert(m.specialStatus(mission,prepared.state,baseCtx).available,
   faction+': a successful groundwork action should unlock the next action');
 const outcome=m.specialPerform(prepared.state,missionId,baseCtx,0);
 assert(outcome.ok&&outcome.preparationSpent===1&&outcome.state.specialPreparation===0,
   faction+': a mission must consume its preparation transactionally');
 const restored=m.normalize(JSON.parse(JSON.stringify(prepared.state)),22);
 assert(restored.specialPreparation===1,
   faction+': preparation must survive save serialization and a year change');
 const resignation=m.resign(prepared.state,baseCtx);
 assert(resignation.ok&&resignation.state.specialPreparation===0,
   faction+': faction reserves must disappear when resigning');
}
const bountyBoard=m.normalize({current:{id:'hunter',kind:'special',startYear:18},specialPreparation:1},21);
assert(!m.specialStatus(data.specialOperations.find(x=>x.id==='hunter_elite'),bountyBoard,
 {...valid,faction:'Chasseurs de primes',rank:'Débutant'}).available,
 'Elite bounty hunting needs at least two independently gathered leads');
assert(m.preparationStatus(bountyBoard,{...valid,faction:'Chasseurs de primes'}).label==='Pistes confirmées',
 'Hunter career dashboard must name its own resource');
const capped=m.normalize({current:{id:'marine',kind:'special',startYear:19},specialPreparation:500},21);
assert(capped.specialPreparation===6,'Mission preparation must have a bounded persisted capacity');
// Every civilian job sector has an independent, playable task and persistent outcomes.
assert(data.ordinaryTasks.length>=9,'All civilian job sectors need dedicated activities');
const sectors=[...new Set(data.ordinary.map(x=>x.sector))];
assert(sectors.length===9,'Expected the nine ordinary work sectors');
for(const sector of sectors){
 const jobs=data.ordinary.filter(j=>j.sector===sector),task=data.ordinaryTasks.find(x=>x.sector===sector);
 assert(task,'Missing sector-specific activity: '+sector);
 const job=jobs[0],worked=m.normalize({current:{id:job.id,kind:'ordinary',startYear:19}},21);
 const ctx={...valid,skills:{...valid.skills,Navigation:70,Artisanat:70,Charisme:75,Endurance:75,Intelligence:75,Combat:75},
  performance:65};
 const gate=m.ordinaryTaskStatus(task,worked,ctx);
 assert(gate.available,'Qualified worker must be able to act in '+sector+': '+gate.reason);
 const outcome=m.ordinaryTaskPerform(worked,task.id,ctx,0);
 assert(outcome.ok&&outcome.success&&outcome.bonus>0&&outcome.xp>0&&outcome.cost>0,'Work projects must award earned progress and cost energy');
 assert(outcome.state.tasks.some(x=>x.id===task.id&&x.jobId===job.id),'Task history must persist with exact job id');
 const again=m.ordinaryTaskPerform(outcome.state,task.id,ctx,0);
 assert(again.ok,'Second annual attempt should remain available');
 assert(!m.ordinaryTaskPerform(again.state,task.id,ctx,0).ok,'Work tasks must respect their own annual quota');
 assert(m.ordinaryTaskStatus(task,m.normalize(again.state,22),{...ctx,year:22}).available,'Task quota should renew next year');
 const failed=m.ordinaryTaskPerform(worked,task.id,ctx,1);
 assert(failed.ok&&!failed.success&&failed.bonus===0&&failed.performanceDelta<0,
   'Work tasks should have credible failure consequences without phantom pay');
 assert(!m.ordinaryTaskPerform(worked,data.ordinaryTasks.find(x=>x.sector!==sector).id,ctx,0).ok,
   'A worker must not use another profession\'s activities');
 const restored=m.normalize(JSON.parse(JSON.stringify(outcome.state)),21);
 assert(restored.tasks[0].jobId===job.id,'Work history must survive serialization and save migration');
}
assert(!m.ordinaryTaskPerform(activeMarine,data.ordinaryTasks[0].id,{...valid,faction:'Marine'},0).ok,
  'Special careers must never receive ordinary sector tasks');
assert(!m.ordinaryTaskPerform(state,data.ordinaryTasks[0].id,valid,0).ok,
  'Unemployed characters must not access workplace projects');
assert(m.ordinaryTasks(activeMarine,{...valid,faction:'Marine'}).length===0,
  'Marine and other special careers must have a completely separate menu');
const html=fs.readFileSync('index.html','utf8'),hub=fs.readFileSync('src/v95/action-hub-runtime-v95.js','utf8'),sw=fs.readFileSync('sw.js','utf8');
assert(html.includes('ordinaryTasks:active?.kind===\'ordinary\'?engine.ordinaryTasks(state,ctx):[]'),
  'Only actual ordinary careers should expose civilian sector tasks');
assert(html.includes("if(action==='ordinary_task')")&&html.includes('engine.ordinaryTaskPerform(state,id,ctx'),
  'Civilian tasks must change the real saved player');
assert(hub.includes('data-v112-ordinary-task')&&hub.includes("bridge.careerAction?.('ordinary_task'"),
  'Civilian task button must connect to the live engine');

for(const path of [...files.slice(1),'src/v112/career-market-v112.css']){
 assert(html.includes(path),'Missing marketplace asset '+path);
 assert(sw.includes(path),'PWA offline cache missing career market '+path);
}
for(const fragment of ['function v112Ensure()','function v112Market()','function v112Do(action,id)','function v112View(type)',
 'setCareerMode:id=>v103SetMode(id)','careerMarket:()=>v112Market()']){
 assert(html.includes(fragment),'Missing integrated career function '+fragment);
}
assert(html.includes("if(age>=15&&p.career==='Aucune'")&&html.includes("À la recherche d’un emploi"),'Career enrollment should be voluntary');
assert(hub.includes('function renderCareerBoard()')&&hub.includes('data-v112-apply=')&&hub.includes('data-v112-quit'),'Career cards must be actionable');
assert(hub.includes('function renderSpecialCareerBoard(market)')&&hub.includes('data-v112-special=')&&hub.includes("active?.kind==='special'"),'Special careers need their own UI, separate from employment');
assert(html.includes("if(action==='special')")&&html.includes('engine.specialPerform(state,id,ctx'),'Special operations must reach the actual stats engine');
assert(hub.includes('data-v112-answer=')&&hub.includes('data-v112-cancel'),'Applications must display a playable interview with cancellation');
assert(html.includes("specialPreparation:active?.kind==='special'?engine.preparationStatus(state,ctx):null")&&
 hub.includes('opl-special-preparation')&&hub.includes('gate.preparationCost')&&
 fs.readFileSync('src/v112/career-market-v112.css','utf8').includes('.opl-special-preparation-track'),
 'All independent special dossiers must render persisted prep levels and mission costs');
assert(html.includes('const preparationDelta=result.preparationEarned-result.preparationSpent'),
 'Earning or spending mission preparation must appear in the live story history');
assert(hub.includes('data-v112-crew-select')&&hub.includes('opl-crew-picker')&&hub.includes('Sélectionne d’abord un équipage'),
 'Pirate recruitment must require player-driven target selection');
assert(html.includes("if(action==='crew_select')")&&html.includes('const joined=out.joinCrew')&&html.includes("v112Engine()?.crewOffers"),
 "Chosen crew must flow all the way to the canonical player ship without rerolling");
assert(html.includes("if(action==='answer')")||html.includes("action==='answer'?state.interview?.id:id"),'Interview answers must reach the real recruitment engine');
assert(html.includes("v112Engine()?.estimatedPay(employment,{rank:p.rank})"),'Civilian wages must replace generic salaries');
assert(html.includes("if(action==='raise')")&&html.includes('engine.negotiateRaise(state,ctx'),
  'Real career screen must apply contract raises to player and save');
assert(hub.includes('data-v112-raise')&&hub.includes("bridge.careerAction?.('raise')"),
  'Civilian workplace must let the player negotiate salary');
assert(hub.includes('data-v112-civil-promotion')&&hub.includes("bridge.careerAction?.('civil_promotion')"),
  'Civilian promotions must be playable without passing through special faction grade buttons');
assert(html.includes("if(action==='civil_promotion')")&&html.includes('engine.civilPromotion(state,ctx'),
  'Promotion success or failure must update the actual character state');
assert(hub.includes('data-v112-view="switch"')&&html.includes("if(type==='switch')"),
  'Players must be able to view other vacancies without resigning their current civilian job');
assert(html.includes("if(route?.kind==='ordinary'&&id==='promotion')"),
  'The legacy faction promotion button must be disabled in ordinary employment');
assert(html.includes("if(special&&['work','career_support','career_initiative','career_bonus'].includes(id))"),
  'Special careers must not inherit the ordinary work buttons');
assert(html.includes("if(result.success){\n        const formerCaptain=p.crew.captain?.name"),
  'A pirate leadership victory must actually change the captain in the live save');

// V12: separate career paths, faction merit, merit reviews and saved gameplay effects.
assert(data.specialRanks&&Object.keys(data.specialRanks).length===5,'V12 must define five independent rank ladders');
for(const faction of Object.keys(data.specialRanks)){
 assert(data.specialPaths[faction].length>=3,'Each special organization needs three playable specializations: '+faction);
 assert(data.specialProgression[faction].meritStep>0,'Special rank criteria must be faction-specific: '+faction);
}
const pathChosen=m.chooseSpecialPath(activeMarine,'patrol',{...valid,faction:'Marine',rank:'Recrue'});
assert(pathChosen.ok&&pathChosen.state.specialPath==='patrol'&&pathChosen.cost===5,
 'A Marine must select a path with a real energy cost');
assert(!m.chooseSpecialPath(pathChosen.state,'justice',{...valid,faction:'Marine'}).ok,
 'The annual path change quota must be enforced');
assert(!m.chooseSpecialPath(activeMarine,'boarding',{...valid,faction:'Marine'}).ok,
 'Marine branches must not allow pirate specializations');
const patrolOp=ops.find(x=>x.id==='marine_patrol');
const plainChance=m.specialStatus(patrolOp,activeMarine,{...valid,faction:'Marine',rank:'Recrue'}).chance;
const focusedChance=m.specialStatus(patrolOp,pathChosen.state,{...valid,faction:'Marine',rank:'Recrue'}).chance;
assert(focusedChance>plainChance,'A chosen specialization must improve matching mission chances');
const focusedOutcome=m.specialPerform(pathChosen.state,'marine_patrol',{...valid,faction:'Marine',rank:'Recrue'},0);
const baselineOutcome=m.specialPerform(activeMarine,'marine_patrol',{...valid,faction:'Marine',rank:'Recrue'},0);
assert(focusedOutcome.ok&&focusedOutcome.xp>baselineOutcome.xp&&
 focusedOutcome.meritGain>baselineOutcome.meritGain&&focusedOutcome.state.specialMerit>0,
 'A special path must produce real XP, merit and mission benefits');
assert(m.normalize(JSON.parse(JSON.stringify(focusedOutcome.state)),22).specialMerit===focusedOutcome.state.specialMerit,
 'Special merits must persist after save serialization and year progression');
assert(m.specialPathStatus(m.normalize(pathChosen.state,22),'justice',{...valid,year:22,faction:'Marine'}).available,
 'Next year must allow a fresh specialization choice');
const marineQualified=m.normalize({
 current:{id:'marine',kind:'special',startYear:18},specialMerit:48,
 operations:[{id:'marine_patrol',year:20,success:true}]},21);
const officerCtx={...valid,faction:'Marine',rank:'Recrue',careerXP:100,trust:75};
const officerGate=m.specialPromotionStatus(marineQualified,officerCtx);
assert(officerGate.available&&officerGate.next==='Matelot','Marine first grade should have a faction-only promotion dossier');
const officerAccepted=m.specialPromotion(marineQualified,officerCtx,0);
assert(officerAccepted.ok&&officerAccepted.accepted&&officerAccepted.rank==='Matelot'&&
 officerAccepted.state.specialMerit<marineQualified.specialMerit,
 'Special promotion consumes a real faction merit decision and awards an explicit rank');
assert(!m.specialPromotionStatus(officerAccepted.state,officerCtx).available,
 'A faction cannot demand promotions indefinitely during one year');
assert(!m.specialPromotion(marineQualified,officerCtx,1).accepted,
 'Special rank reviews must have a failure outcome');
assert(!m.specialPromotionStatus(activeMarine,{...officerCtx,careerXP:0}).available,
 'Special promotion cannot ignore operation experience requirements');
const pirateHeir=m.normalize({current:{id:'pirate_join',kind:'special',startYear:18},specialMerit:999,
 operations:[{id:'pirate_raid',year:20,success:true}]},21);
assert(!m.specialPromotionStatus(pirateHeir,{...valid,faction:'Pirates',rank:'Bras droit',
 careerXP:500,trust:100}).available,
 'Pirates must win or found captaincy; administrative promotion can never make a captain');
assert(!m.specialPromotionStatus(hired.state,{...officerCtx,faction:'Civil'}).available,
 'An ordinary job must never be allowed into special faction promotion rules');
assert(!m.specialPathOptions(hired.state,{...valid,faction:'Civil'}).length,
 'Ordinary professions cannot use special-career paths');
const legacyDropped=m.resign(focusedOutcome.state,{...valid,faction:'Marine'});
assert(legacyDropped.ok&&legacyDropped.state.specialMerit===0&&legacyDropped.state.specialPath==='',
 'Special career resignation must erase faction perks');
assert(hub.includes('data-v112-special-path')&&hub.includes('data-v112-special-promotion')&&
 html.includes("if(action==='special_path')")&&html.includes("if(action==='special_promotion')"),
 'V12 faction-only actions must be reachable and mutate the live character');
assert(html.includes("if(special&&id==='promotion')"),
 'Generic faction promotions must no longer bypass V12 special-career merits');
assert(fs.readFileSync('src/v112/career-market-v112.css','utf8').includes('.opl-special-progress-grid'),
 'Special-career progress and conditions need visible mobile cards');

assert(html.includes("if(v112Ensure()?.current?.kind==='special')")&&
  html.includes('v112OpenSpecialFromProfile')&&html.includes('Les horaires, primes et méthodes de travail'),
  'Profile must not show civilian work and salary mechanics during a special career');
assert(html.includes("if(recognized?.kind==='special')")&&
  html.includes('marketEngine.specialPromotionStatus(v112Ensure(),marketContext)')&&
  html.includes('v112SpecialProfileToCareer'),
  'Special profile progression must display authoritative merit, operations and voluntary promotion gates');
assert(html.includes("if(recognized?.kind==='ordinary')")&&
  html.includes('marketEngine.civilPromotionStatus(v112Ensure(),marketContext)')&&
  html.includes('v112OrdinaryProfileToCareer'),
  'Civilian profile progression must display only the ordinary employer promotion rules');
assert(html.includes("const c=careerProgressInfo(p);")&&html.includes("if(!c.active)"),
  'The profile retains a safe no-career fallback');
assert(html.includes("career:p.career,rank:p.rank,faction:p.faction,careerXP:p.careerXP,"),
  'Live player career XP must flow into V12 civil and special promotion requirements');
assert(html.includes("const DB_NAME = 'one-piece-life-careers-v12'")&&
  html.includes("const SAVE_VERSION = 1200")&&html.includes("opl-v12-slot-"),
  'The incompatible V12 career schema must have an isolated storage namespace');
assert(html.includes('await retirePreviousCareerSaves()')&&html.includes("indexedDB.deleteDatabase('one-piece-life')")&&
  html.includes("localStorage.removeItem('opl-slot-'+slot)"),
  'Startup must retire old career saves explicitly, as authorized by the player');
assert(html.includes("careerMarketV112:{version:2,current:null")&&
  !html.includes("id:exact?.id||'legacy'"),
  'Newborn career must start without inferred legacy employment');
assert(!html.includes("if(parts[1]==='marine'){p.faction='Marine'")&&
  !html.includes("if(parts[1]==='civil'){p.faction='Civil'"),
  'Old career event branches must not bypass V12 recruitment');
assert(!html.includes("game.pendingDecision=specializationDecision()"),
  'Old forced specialization events must not compete with special-career choices');

console.log('V12 CAREER REBUILD QA OK',JSON.stringify({ordinary:data.ordinary.length,special:data.special.length,operations:ops.length,offers:shown.length,applyLimit:data.maxOrdinaryApplications}));
