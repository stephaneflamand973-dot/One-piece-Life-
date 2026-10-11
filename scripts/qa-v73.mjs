import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/career-organizations-v73.js','utf8');
const engineSrc=fs.readFileSync('src/v73/career-organization-engine-v73.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'career-organizations-v73.js'});
vm.runInContext(engineSrc,sandbox,{filename:'career-organization-engine-v73.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('careerOrganizationsV73');
const engine=registry.get('careerOrganizationEngineV73');

assert(data&&engine,'V7.3 modules not registered');
eq(data.version,'7.3.0','Career data version mismatch');
eq(engine.version,'7.3.0','Career engine version mismatch');
for(const faction of ['Marine','Pirates','Chasseurs de primes','Révolutionnaires','Gouvernement','Civil']){
  assert(data.organizations[faction],'Missing organization '+faction);
  assert(data.organizations[faction].branches.length>=3,'Organization needs at least three branches: '+faction);
}
assert(data.responsibilities.length>=5,'Responsibility ladder too shallow');
assert(Object.keys(data.internalActions).length>=4,'Internal action set too small');

const marineProfile={
  faction:'Marine',specialization:'officer',combatStyle:{primary:'Équilibré'},
  skills:{Combat:54,Commandement:88,Discrétion:35,Navigation:18,Science:15,Médecine:10,Sabre:5,Tir:5},
  stats:{Discipline:86,Volonté:80,Résistance:65,Réflexes:58,Force:60,Agilité:55,Vitesse:56}
};
const branch=engine.defaultBranch('Marine',marineProfile);
eq(branch.id,'command','Command-oriented Marine should default to command branch');

const baseState=engine.normalizeState({},'Marine');
eq(baseState.standing,30,'Fresh standing');
eq(baseState.trust,50,'Fresh trust');
assert(baseState.missionRecord.success===0,'Fresh mission record not empty');

const successDelta=engine.missionImpact(baseState,{faction:'Marine',outcome:'success',danger:'high',aligned:true});
const failDelta=engine.missionImpact(baseState,{faction:'Marine',outcome:'failure',danger:'high',aligned:true});
gt(successDelta.standing,0,'Successful dangerous mission must raise standing');
assert(failDelta.standing<0&&failDelta.trust<0,'Failed dangerous mission must hurt organization dossier');

const withMission=engine.recordMission({...baseState,branch:'command'},{faction:'Marine',outcome:'success',danger:'high',aligned:true});
eq(withMission.missionRecord.success,1,'Mission success record not incremented');
gt(withMission.standing,baseState.standing,'Mission success did not raise standing');

const junior=engine.responsibilityFor({...baseState,standing:35},{faction:'Marine',authority:20,rankRatio:.1});
eq(junior.id,'member','Junior responsibility should stay operational');
const leader=engine.responsibilityFor({...baseState,standing:68},{faction:'Marine',authority:66,rankRatio:.7});
assert(['unit_lead','strategic'].includes(leader.id),'High-authority member did not receive leadership responsibility');

const weakReview=engine.promotionReview({...baseState,standing:20,trust:20},{
  faction:'Marine',rankIndex:3,rankCount:11,xp:999,xpNeed:60,skillScore:90,skillNeed:27
});
assert(!weakReview.eligible,'XP and skills alone should not guarantee promotion');
assert(weakReview.missing.includes('standing interne')&&weakReview.missing.includes('confiance'),'Organization gates missing from promotion review');

const strongState={...baseState,standing:82,trust:84,discipline:88,influence:55,commendations:4,sanctions:0,missionRecord:{success:8,partial:1,failure:1,retreat:0}};
const strongReview=engine.promotionReview(strongState,{
  faction:'Marine',rankIndex:7,rankCount:11,xp:300,xpNeed:140,skillScore:82,skillNeed:47
});
assert(strongReview.eligible,'Strong high-rank dossier should be promotion eligible');
gt(strongReview.approvalChance,.6,'Strong dossier approval chance too low');
assert(engine.resolvePromotion(strongReview,.01).approved,'Low roll should approve eligible promotion');
assert(!engine.resolvePromotion(strongReview,.999).approved,'High roll should defer eligible promotion');

const aligned=engine.missionAlignment('Marine','command',{type:'escort'});
const offBranch=engine.missionAlignment('Marine','command',{type:'covert'});
assert(aligned.aligned&&!offBranch.aligned,'Branch mission alignment is not discriminating');

const bonusLead=engine.missionBonus(strongState,{faction:'Marine',authority:68,rankRatio:.72,mission:{type:'escort'}});
const bonusJunior=engine.missionBonus(baseState,{faction:'Marine',authority:15,rankRatio:.08,mission:{type:'covert'}});
gt(bonusLead,bonusJunior,'Leadership and branch fit should improve mission support');

const ambitionLow=engine.internalAction({...baseState,standing:30},'ambition',{faction:'Marine',energy:80});
assert(ambitionLow.state.influence>baseState.influence,'Ambition action should raise influence');
assert(ambitionLow.state.trust<baseState.trust,'Premature ambition should cost trust');

const politics=engine.politicsEvent({...strongState,influence:70,standing:75,trust:72},{faction:'Marine'},0);
assert(politics,'High internal profile should be able to trigger politics event');
assert(['backing','opportunity','rivalry','scrutiny'].includes(politics.id),'Unknown politics event');

const zeroState=engine.normalizeState({standing:0,trust:0,discipline:0},'Marine');
eq(zeroState.standing,0,'Explicit zero standing must not be reset');
eq(zeroState.trust,0,'Explicit zero trust must not be reset');

// Live integration contract.
const saveVersion=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
const gameVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
assert(/ONE PIECE LIFE — V(?:[7-9]|\d{2,})\./.test(html),'V7+ release title missing');
assert(saveVersion>=730,'V7.3 regression QA requires save version >= 730');
const [gameMajor,gameMinor]=gameVersion.split('.').map(Number);
assert(gameMajor>7||(gameMajor===7&&gameMinor>=3),'V7.3 regression QA requires game version >= 7.3');
for(const asset of ['src/data/career-organizations-v73.js','src/v73/career-organization-engine-v73.js']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v(?:7-[3-9]|8-[0-9]+|9-[0-9]+|10)-[0-9]+/.test(sw),'PWA cache must remain at V7.3 or newer');
assert(html.includes('function v73PromotionReview'),'Promotion bridge missing');
assert(html.includes('v73RecordMissionOutcome'),'Mission-to-career bridge missing');
assert(html.includes('function renderV73Organization'),'Organization UI bridge missing');
assert(html.includes('id="v73OrganizationCard"'),'Organization card missing');
assert(html.includes('data-v73-branch'),'Branch controls missing');
assert(html.includes('data-v73-action'),'Internal action controls missing');
assert(html.includes("careerV73:{version:1"),'Fresh save V7.3 state missing');
assert(html.includes("if(!game.player.careerV73||typeof game.player.careerV73!=='object')"),'Old-save V7.3 migration guard missing');
assert(html.includes("const org=p.careerV73||{}"),'V6.9 authority not connected to V7.3 organization state');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V7.3 CAREER & ORGANIZATION QA OK',JSON.stringify({
  version:gameVersion,
  organizations:Object.keys(data.organizations).length,
  branches:Object.values(data.organizations).reduce((n,o)=>n+o.branches.length,0),
  responsibilities:data.responsibilities.length,
  defaultMarineBranch:branch.label,
  strongApproval:strongReview.approvalChance,
  leadershipBonus:bonusLead,
  juniorBonus:bonusJunior,
  migrationGuard:true
}));
