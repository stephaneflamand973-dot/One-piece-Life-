import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('src/v93/relationships-v93.css','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/relationships-v93.js','utf8');
const engineSrc=fs.readFileSync('src/v93/relationships-engine-v93.js','utf8');

function assert(c,m){if(!c)throw new Error(m)}
function eq(a,b,m){if(a!==b)throw new Error(m+': '+a+' !== '+b)}
function gt(a,b,m){if(!(a>b))throw new Error(m+': '+a+' <= '+b)}
function lt(a,b,m){if(!(a<b))throw new Error(m+': '+a+' >= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'relationships-v93.js'});
vm.runInContext(engineSrc,sandbox,{filename:'relationships-engine-v93.js'});

const registry=sandbox.OPL_MODULES,data=registry.get('relationshipsDataV93'),engine=registry.get('relationshipsEngineV93');
assert(data&&engine,'V9.3 modules not registered');
eq(data.version,'9.3.0','V9.3 data version mismatch');
eq(engine.version,'9.3.0','V9.3 engine version mismatch');
assert(data.bondTiers.length>=6,'Bond tiers missing');
assert(Object.keys(data.eventBeats).length>=7,'Relationship life beats missing');
assert(Object.keys(data.choices).length>=10,'Relationship choices missing');

const friend={id:'mira',name:'Mira',trust:76,respect:70,affection:72,familiarity:78,loyalty:68,rivalry:6,status:'active'};
const friendSocial={bond:74,reliability:77,unresolved:0,memories:[{valence:7,impact:4}]};
const friendLife={power:46,renown:55,region:'East Blue',playerRegion:'East Blue'};
let friendState=engine.interaction({},friend.id,'help',{year:24,month:288}).state;
eq(friendState.relations.mira.npcOwes,1,'Concrete help should create one NPC debt');
gt(engine.supportBonus(friendState,friend.id),0,'Relationship debt should create tangible support');

const queued=engine.queueLifeEvent(friendState,friend,{id:'evt1',type:'setback',importance:72,month:289,title:'Mira chute',desc:'Un revers important.'},{social:friendSocial,life:friendLife,year:24});
assert(queued.queued,'Strong relationship life event should queue a beat');
const beat=engine.nextBeat(queued.state,[friend],24);
assert(beat&&beat.type==='setback','Queued setback beat missing');
const choiceIds=engine.choiceDefs(beat,queued.state.relations.mira).map(x=>x.id);
assert(choiceIds.includes('support')&&choiceIds.includes('exploit'),'Setback choices incomplete');
const supported=engine.applyChoice(queued.state,beat.id,'support',friend,{year:24,month:289});
assert(!supported.error,'Support choice failed');
eq(supported.link.npcOwes,2,'Supporting a setback should deepen obligation');
gt(supported.link.bondXp,friendState.relations.mira.bondXp,'Support should strengthen bond');
eq(engine.nextBeat(supported.state,[friend],24),null,'One V9.3 beat per year rule broken');

const nextYear=engine.annualTick(supported.state,[friend],25);
const profile=engine.profile(friend,friendSocial,friendLife,nextYear.relations.mira);
assert(['trusted','bonded','oathbound'].includes(profile.tierId),'Strong relation should classify as trusted+');

const noDebt=engine.queueLifeEvent({},friend,{id:'evt2',type:'promotion',importance:70,month:300,title:'Promotion',desc:'Mira progresse.'},{social:friendSocial,life:friendLife,year:25});
const promoBeat=engine.nextBeat(noDebt.state,[friend],25);
assert(!engine.choiceDefs(promoBeat,noDebt.state.relations.mira).some(x=>x.id==='ask_favor'),'Favor request should be hidden without debt');

const rival={id:'rook',name:'Rook',trust:18,respect:82,affection:14,familiarity:82,loyalty:12,rivalry:90,status:'active'};
const rivalSocial={bond:35,reliability:38,unresolved:3,memories:[{valence:-9,impact:5},{valence:-7,impact:4}]};
const rivalLife={power:78,renown:76,region:'Grand Line',playerRegion:'Grand Line'};
let rivalState=engine.interaction({},rival.id,'challenge',{year:24,month:288}).state;
const nemesisScore=engine.nemesisScore(rival,rivalSocial,rivalLife,rivalState.relations.rook);
gt(nemesisScore,72,'Deep hostile rivalry should cross nemesis threshold');
assert(engine.nemesisEligible(rival,rivalSocial,rivalLife,rivalState.relations.rook),'Hostile rivalry should be eligible for nemesis');
const marked=engine.markNemesis(rivalState,rival.id,'antag_rook',{year:24});
assert(marked.link.promotedNemesis,'Nemesis promotion flag missing');
eq(marked.state.totalNemeses,1,'Nemesis counter mismatch');
assert(!engine.nemesisEligible(rival,rivalSocial,rivalLife,marked.link),'Promoted nemesis must not promote twice');

const friendlyRival={...rival,id:'friendly',trust:82,affection:72,rivalry:76,familiarity:85};
const friendlySocial={bond:78,reliability:80,unresolved:0,memories:[]};
const friendlyLife={power:76,renown:72,region:'Grand Line',playerRegion:'Grand Line'};
const friendlyLink=engine.ensureLink({},friendlyRival.id).link;
assert(!engine.nemesisEligible(friendlyRival,friendlySocial,friendlyLife,friendlyLink),'Respectful close rivalry should not automatically become nemesis');

assert(html.includes('ONE PIECE LIFE — V10.1'),'V9.3 title missing');
assert(/const SAVE_VERSION\s*=\s*1000;/.test(html),'Save version 930 missing');
assert(/const GAME_VERSION\s*=\s*'10\.1\.0';/.test(html),'Game version 9.3.0 missing');
for(const asset of ['src/data/relationships-v93.js','src/v93/relationships-engine-v93.js','src/v93/relationships-v93.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(sw.includes('one-piece-life-v10-1-0'),'PWA cache not V9.3');
assert(html.includes('v92Ensure();v93Ensure()'),'V9.3 ensure chain missing');
for(const fn of ['function v93Module','function v93Ensure','function v93Profile','function v93OnNpcLifeEvent','function v93MaybePromoteNemesis','function v93MaybeQueueBeat','function v93ResolveDecision','function renderV93Relationships']){
  assert(html.includes(fn),'Missing V9.3 live bridge '+fn);
}
assert(html.includes('id="v93SocialCard"'),'V9.3 social UI missing');
assert(html.includes('v93OnNpcLifeEvent(r,e)'),'V9.2 life event bridge missing');
assert(html.includes('v74MaybeQueueArc();if(!game.pendingDecision)v93MaybeQueueBeat()'),'V9.3 annual social beat hook missing');
assert(html.includes('v93RecordInteraction(r,action)'),'Direct interaction bridge missing');
assert(html.includes("if(parts[0]==='v93bond')v93ResolveDecision(parts)"),'V9.3 decision resolver hook missing');
assert(html.includes('mod.supportScore(snap)*.42+v93SupportBonus(r)'),'Debt support integration missing');
assert(html.includes("source:'v93_relation'"),'Relation to nemesis bridge missing');
assert(html.includes('renderV92Lives();renderV93Relationships();'),'V9.3 Relations render hook missing');
assert(!html.includes('v92Ensure(;v93Ensure()'),'Malformed V9.3 ensure chain regression');
assert(css.includes('.v93-social')&&css.includes('.v93-nemesis'),'V9.3 CSS incomplete');

console.log('V9.3 RELATIONSHIPS & NEMESIS 5.0 QA OK',JSON.stringify({
  version:'9.3.0',friendTier:profile.tierLabel,friendScore:profile.score,
  supportBonus:engine.supportBonus(nextYear,'mira'),nemesisScore,
  beats:Object.keys(data.eventBeats).length,choices:Object.keys(data.choices).length
}));
