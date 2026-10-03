import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/education-v79.js','utf8');
const engineSrc=fs.readFileSync('src/v79/education-engine-v79.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function lt(a,b,msg){if(!(a<b))throw new Error(msg+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'education-v79.js'});
vm.runInContext(engineSrc,sandbox,{filename:'education-engine-v79.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('educationDataV79');
const engine=registry.get('educationEngineV79');

assert(data&&engine,'V7.9 modules not registered');
eq(data.version,'7.9.0','Education data version mismatch');
eq(engine.version,'7.9.0','Education engine version mismatch');
eq(Object.keys(data.tracks).length,8,'Education track count mismatch');
eq(Object.keys(data.focuses).length,5,'Education focus count mismatch');
eq(Object.keys(data.milestones).length,4,'Education milestone count mismatch');
assert(Object.keys(data.events).length>=6,'Youth event catalog too small');

eq(engine.stage(3).id,'early','Early-childhood stage mismatch');
eq(engine.stage(6).id,'foundation','Foundation stage mismatch');
eq(engine.stage(11).id,'formation','Formation stage mismatch');
eq(engine.stage(14).id,'orientation','Orientation stage mismatch');
eq(engine.stage(16).id,'transition','Transition stage mismatch');
eq(engine.stage(19).id,'adult','Adult stage mismatch');

const child=engine.normalizeState({}, {age:6,year:6});
eq(child.track,'general','Fresh youth track mismatch');
eq(child.focus,'balanced','Fresh youth focus mismatch');
assert(child.knowledge>0&&child.practical>0,'School-age defaults should initialize learning metrics');

const baseCtx={age:12,year:12,learningTalent:'Correct',familyStability:60,householdStress:20,energy:80,activityStudy:.2,activityPractical:.3};
const highCtx={...baseCtx,learningTalent:'Exceptionnel',familyStability:82,householdStress:8,energy:95,activityStudy:1,activityPractical:1};
const lowCtx={...baseCtx,learningTalent:'Faible',familyStability:30,householdStress:78,energy:35,activityStudy:0,activityPractical:0};
const seedState={...child,track:'navigation',focus:'balanced',knowledge:30,practical:30,discipline:50,confidence:50};
const highProgress=engine.monthProgress(seedState,highCtx,{growth:.7,skill:.4,stat:.4});
const lowProgress=engine.monthProgress(seedState,lowCtx,{growth:.7,skill:.4,stat:.4});
gt(highProgress.deltas.knowledge,lowProgress.deltas.knowledge,'Learning environment should affect knowledge gain');
gt(highProgress.skillGain,lowProgress.skillGain,'Learning environment should affect skill gain');
assert(highProgress.skill,'Track should select a skill');
assert(highProgress.stat,'Track should select a stat');

eq(engine.weightedKey({A:1,B:3},0),'A','Weighted key low roll mismatch');
eq(engine.weightedKey({A:1,B:3},.99),'B','Weighted key high roll mismatch');

const focusResult=engine.focusAction(seedState,'theory',{...baseCtx,year:12});
assert(!focusResult.error,'Valid focus action failed');
eq(focusResult.state.focus,'theory','Focus did not update');
eq(focusResult.state.lastActionYear,12,'Focus action year missing');

const lockedTrack=engine.switchTrack(seedState,'martial',{...baseCtx,age:8});
eq(lockedTrack.error,'age_locked','Track switch should be age locked before 10');
const switched=engine.switchTrack(seedState,'martial',{...baseCtx,age:12,year:12});
assert(!switched.error,'Valid track switch failed');
eq(switched.state.track,'martial','Track did not update');
assert(switched.state.trackHistory.length===1,'Track history missing');

const strongExam={...seedState,knowledge:78,practical:76,discipline:80,confidence:72,mentor:true};
const weakExam={...seedState,knowledge:24,practical:20,discipline:28,confidence:25};
const strongChance=engine.milestoneChance(strongExam,'orientation',{...highCtx,age:13});
const weakChance=engine.milestoneChance(weakExam,'orientation',{...lowCtx,age:13});
gt(strongChance,weakChance,'Exam chance should be dynamic');
const passed=engine.resolveMilestone(strongExam,'orientation',{...highCtx,age:13},0);
assert(['pass','distinction','partial'].includes(passed.exam.result),'Strong zero-roll exam should not fail');
const failed=engine.resolveMilestone(weakExam,'orientation',{...lowCtx,age:13},.99);
assert(['fail','partial'].includes(failed.exam.result),'Weak high-roll exam should not fully pass');
assert(passed.state.exams.length===1,'Exam record missing');
const duplicate=engine.resolveMilestone(passed.state,'orientation',{...highCtx,age:13},0);
eq(duplicate.error,'already_completed','Milestone must not resolve twice');

const dueState={...seedState,exams:[]};
eq(engine.nextMilestone(dueState,7),null,'No milestone should be due before age 8');
eq(engine.nextMilestone(dueState,8).id,'basics','Age-8 milestone should become due');

const navReady=engine.careerReadiness({...strongExam,track:'navigation'},'pirate',highCtx);
const govReady=engine.careerReadiness({...strongExam,track:'navigation'},'government',highCtx);
gt(navReady.score,govReady.score,'Navigation training should fit pirate career better than government career');
const serviceMarine=engine.careerReadiness({...strongExam,track:'service'},'marine',highCtx);
const servicePirate=engine.careerReadiness({...strongExam,track:'service'},'pirate',highCtx);
gt(serviceMarine.score,servicePirate.score,'Service training should favor Marine career');

const bonus=engine.careerBonus({...strongExam,track:'service',exams:[{id:'basics',result:'pass'},{id:'foundation',result:'distinction'},{id:'orientation',result:'pass'}]},'marine',highCtx);
assert(bonus.xp>0,'Prepared career should receive XP bonus');
assert(bonus.topSkill==='Commandement','Service track top skill mismatch');
assert(bonus.topStat==='Discipline','Service track top stat mismatch');

const candidates=engine.eventCandidates({...seedState,mentor:false,sponsor:false},{...baseCtx,age:12,householdStress:65});
assert(candidates.some(x=>x.id==='mentor'),'Mentor youth event missing');
assert(candidates.some(x=>x.id==='setback'),'High-stress youth setback missing');
assert(candidates.some(x=>x.id==='field'),'Practical youth event missing');
const pickedA=engine.chooseEvent(seedState,{...baseCtx,age:12,householdStress:20},.25);
const pickedB=engine.chooseEvent(seedState,{...baseCtx,age:12,householdStress:20},.25);
eq(pickedA.id,pickedB.id,'Youth event selection should be deterministic for fixed roll');

const eventResolved=engine.resolveEvent(seedState,'discovery','deepen',{...baseCtx,year:12});
assert(!eventResolved.error,'Youth event resolution failed');
gt(eventResolved.state.knowledge,seedState.knowledge,'Discovery should improve knowledge');

const summary=engine.summary({...strongExam,track:'science',exams:[{id:'basics',label:'Bases acquises',result:'pass'}],credentials:['Bases acquises']},{...highCtx,age:13});
eq(summary.track,'Sciences & techniques','Education summary track mismatch');
eq(summary.exams,1,'Education summary exam count mismatch');
assert(summary.career.length===6,'Career-readiness summary incomplete');

// Live integration contract.
const saveVersion=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
const gameVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
const [gameMajor,gameMinor]=gameVersion.split('.').map(Number);
assert(/ONE PIECE LIFE — V(?:7|8)\./.test(html),'V7.9+ title missing');
assert(saveVersion>=790,'V7.9 regression QA requires save version >= 790');
assert(gameMajor>7||(gameMajor===7&&gameMinor>=9),'V7.9 regression QA requires game version >= 7.9');
for(const asset of ['src/data/education-v79.js','src/v79/education-engine-v79.js','src/v79/education-v79.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:7-9|8-[0-9]+)-[0-9]+/.test(sw),'PWA cache must remain at V7.9 or newer');
assert(html.includes("educationV79:{version:1"),'Fresh-save education state missing');
assert(html.includes("if(!game.player.educationV79||typeof game.player.educationV79!=='object')"),'Old-save education migration guard missing');
assert(html.includes('id="v79EducationCard"'),'Education UI missing');
for(const fn of ['function v79Ensure','function v79EducationMonth','function v79MilestoneTick','function v79MaybeEvent','function v79ApplyCareerPreparation','function v79CareerHint','function renderV79Education']){
  assert(html.includes(fn),'Missing live V7.9 bridge '+fn);
}
assert(html.includes('v79MilestoneTick();'),'Lifecycle milestone hook missing');
assert(html.includes('trainProgress(1);v79EducationMonth(1);'),'Monthly education hook missing');
assert(html.includes('if(!game.pendingDecision)v79MaybeEvent()')||(html.includes('function v80CollectInterruptionCandidates')&&html.includes("kind:'education'")),'Youth event arbitration missing');
assert(html.includes('v79ApplyCareerPreparation(parts[1]);refreshMissionBoard()')||html.includes('v79ApplyCareerPreparation(parts[1]);v81OnFactionChange(oldFaction,p.faction);refreshMissionBoard()'),'Career preparation hook missing');
assert(html.includes("if(parts[0]==='v79track'||parts[0]==='v79event')v79ResolveDecision(parts)"),'Education decision routing missing');
assert(html.includes("v79CareerHint('marine'"),'Career decision readiness hints missing');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V7.9 EDUCATION & YOUTH QA OK',JSON.stringify({
  version:gameVersion,
  tracks:Object.keys(data.tracks).length,
  focuses:Object.keys(data.focuses).length,
  milestones:Object.keys(data.milestones).length,
  events:Object.keys(data.events).length,
  strongExamChance:strongChance,
  weakExamChance:weakChance,
  marineReadiness:serviceMarine.score,
  pirateReadiness:servicePirate.score,
  careerBonusXP:bonus.xp,
  migrationGuard:true
}));
