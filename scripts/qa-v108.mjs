import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const w={console,Math,JSON,Object,Array,String,Number,Map,Set};w.window=w;vm.createContext(w);
for(const file of ['src/core/module-registry.js','src/data/encounters-v107.js','src/v107/encounter-engine-v107.js',
 'src/data/encounters-v108.js','src/v108/encounter-engine-v108.js'])
 vm.runInContext(fs.readFileSync(file,'utf8'),w,{filename:file});
const m=w.OPL_MODULES.get('encounterEngineV108'),n=w.OPL_MODULES.get('encounterEngineV107');
assert.equal(m.version,'10.8.0');
const c={year:24,age:24,island:'Shells Town',region:'East Blue',danger:40,worldRep:30,
 playerFaction:'Pirates',alive:true,travel:false,pending:false,crew:30,energy:80,power:37,
 skills:{Commandement:55,Combat:52,Navigation:50,Discrétion:50,Médecine:40}};
let old=n.begin({},c,{faction:.3,actor:.2});assert(old.ok);
const npc=old.active;
const original=n.decision(old.state,c);
let decorated=m.decorate({},npc,original,c);
assert(decorated.choices.some(x=>x.action.startsWith('v108talk:')),'Dialogue should replace scene talk');
assert(decorated.choices.some(x=>x.action.startsWith('v108fight:')),'Duel should replace direct attack');
const talk=m.dialogueDecision(npc,'talk',c);assert(talk.choices.length===4);
assert(talk.choices.some(x=>x.action.includes('v108say:')));
const chance=m.dialogueOdds(npc,'frank',c).chance;
assert(m.dialogueOdds(npc,'frank',{...c,contactTrust:91}).chance>chance,'Trust does not affect dialogue');
assert(m.dialogueOdds(npc,'frank',{...c,contactRivalry:91}).chance<chance,'Rivalry does not affect dialogue');
const diplomatic=m.resolveDialogue({},npc,'talk','frank',c,0);
assert(diplomatic.ok&&diplomatic.success&&diplomatic.state.dialogues===1&&diplomatic.state.dialogue.tone==='frank');
assert(!m.resolveDialogue({},npc,'talk','wrong',c,0).ok);
let duel=m.startCombat(diplomatic.state,npc,c);assert(duel.ok&&duel.state.combat,'Duel not started');
assert(!m.startCombat(duel.state,npc,c).ok,'Two duels allowed');
const first=m.combatDecision(duel.state,npc,c);
assert(first.choices.length===5&&first.title.includes('Tour 1/4'),'Duel state not shown');
let combat=duel.state,last=null;
for(let i=0;i<4;i++){
 const out=m.combatTurn(combat,'guard',c,{hit:1,enemy:0});
 assert(out.ok,'Guard turn missing');
 assert(out.healthLoss>=0&&out.energyLoss===2,'Combat damage or stamina not charged');
 combat=out.state;last=out;if(out.finished)break;
}
assert(last.finished&&last.outcome==='defeat'&&combat.combat===null,'Four-round defeat must terminate');
const fatigued=m.startCombat(combat,npc,{...c,energy:1});
assert(!m.combatTurn(fatigued.state,'strike',{...c,energy:1}).ok,'Insufficient stamina ignored');
const exit=m.combatTurn(fatigued.state,'retreat',{...c,energy:1});
assert(exit.ok&&exit.finished&&exit.outcome==='withdraw'&&exit.healthLoss===0,'Combat retreat broken');
duel=m.startCombat(exit.state,npc,c);
let won=null;combat=duel.state;
for(let i=0;i<4;i++){
 const out=m.combatTurn(combat,'charge',{...c,power:125,danger:0,skills:{...c.skills,Combat:100}},
 {hit:0,enemy:1});combat=out.state;won=out;if(out.finished)break;
}
assert(won.finished&&won.outcome==='victory'&&combat.victories===1,'Strong player cannot win duel');
const narrative=m.decorate(combat,npc,original,c);
assert(narrative.id===original.id,'Finished duel should return encounter choices');
const contact={key:npc.faction+'|'+npc.actor,trust:72,rivalry:10};
const story={id:npc.id,actor:npc.actor,faction:npc.faction,year:24,island:c.island,
 outcome:'success',choices:['observe','search','share'],contact};
const done=m.complete(combat,story,{region:c.region});
assert(done.state.memory.length===1&&done.state.memory[0].encounters===1,'Memory missing');
assert(done.lead&&done.state.leads.length===1,'Successful discovery should unlock clue');
assert.equal(m.complete(done.state,story,{region:c.region}).state.memory[0].encounters,1,'Duplicate completion changed relationship memory');
let picked=m.selectLead(done.state,done.lead.id,{region:c.region});
assert(picked.ok&&picked.state.selected===done.lead.id);
assert(m.currentLead(picked.state,{region:'Grand Line'})===null,'Lead usable from wrong region');
assert(m.currentLead(picked.state,{region:c.region}).faction===story.faction);
assert(!m.selectLead(done.state,done.lead.id,{region:'Grand Line'}).ok);
const spent=m.consumeLead(picked.state,done.lead.id);
assert(!m.currentLead(spent,{region:c.region})&&spent.leads[0].used,'Lead should have one use');
assert(n.pickEncounter({...c,leadFaction:'Gouvernement'},{faction:0}).faction==='Gouvernement','Clue cannot steer encounter');
assert(n.choiceOdds({...npc,stage:0,danger:40,approach:'balanced',wins:0,losses:0,preparation:0},'talk',
 {...c,contactTrust:85}).chance>
 n.choiceOdds({...npc,stage:0,danger:40,approach:'balanced',wins:0,losses:0,preparation:0},'talk',
 {...c,contactTrust:15}).chance,'Past relation missing from V10.7 odds');
const bad=m.normalize({memory:Array(99).fill({name:'x',trust:999,rivalry:-10}),leads:Array(40).fill({id:'x',used:false,boost:900}),
 combat:{id:'x',stage:55,turn:1,hp:999,guard:999},dialogue:{tone:'test',trust:555}});
assert(bad.memory.length===24&&bad.leads.length===10&&bad.combat.hp<=100&&bad.dialogue.trust<=20,'Invalid save boundaries');
assert(m.normalize(JSON.parse(JSON.stringify(done.state))).leads.length===1,'Save migration changed leads');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(html.includes("const GAME_VERSION = '11.0.0'")&&html.includes('function v108ResolveChoice(parts)'),'V10.8 integration missing');
assert(html.includes('function v108RenderDepth(root)')&&html.includes('v108BuildDecision'),'V10.8 UI missing');
assert(html.includes("function v100AdvanceYear()")&&!html.includes("p.money+=result.pay;advanceClock(12)"),'Annual manual aging regressed');
assert(sw.includes('one-piece-life-v11-0-0')&&sw.includes('src/v108/encounter-engine-v108.js'),'Offline files not precached');
assert(manifest.description.includes('V11.0'),'Manifest stale');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'');
console.log('V10.8 BRANCHING DIALOGUE AND DUEL QA OK',JSON.stringify({choices:decorated.choices.length,duels:combat.battles,memories:done.state.memory.length,lead:done.lead.id}));