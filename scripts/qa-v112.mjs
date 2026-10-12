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
const shown=m.offers(state,valid).map(x=>x.id);
assert(shown.length>=10,'The market should display numerous vacancies');
assert.deepEqual(shown,m.offers(state,valid).map(x=>x.id),'Offers should remain stable inside a year');
assert(shown.some(x=>data.ordinary.find(j=>j.id===x)?.minAge<=21),'Playable job must appear');
const child={...valid,age:12,year:12};
assert(!m.status(m.byId('docker'),state,child).available,'Children must not join full-time jobs');
assert(m.status(m.byId('docker'),state,valid).available,'An unemployed adult must be allowed to apply');
assert(!m.status(m.byId('doctor'),state,{...valid,stats:{Intelligence:5}}).available,'Specialized jobs need prerequisites');
const hired=m.apply(state,'docker',valid,0);
assert(hired.ok&&hired.accepted&&hired.state.current?.id==='docker','Qualified applications must permit a successful interview');
assert(hired.energyCost===3,'Applications must consume the advertised amount of energy');
assert(!m.status(m.byId('fisher'),hired.state,valid).available,'Already-employed characters must resign before applying elsewhere');
const pay1=m.estimatedPay(hired.state,{rank:'Apprenti'}),pay2=m.estimatedPay(hired.state,{rank:'Expert'});
assert(pay2.perAction>pay1.perAction&&pay1.annualMax===pay1.perAction*4,'Civilian salaries must grow with promotions but remain action-based');
assert(!m.apply(hired.state,'fisher',valid,0).ok,'Applications must not replace an active job silently');
const retired=m.resign(hired.state,valid);
assert(retired.ok&&!retired.state.current,'Resigning must free the current occupation');
const rejected=m.apply(retired.state,'fisher',valid,1);
assert(rejected.ok&&!rejected.accepted,'Interviews must also allow refusals');
assert(!m.apply(rejected.state,'fisher',valid,0).ok,'One vacancy cannot be spammed during a year');
const again=m.apply(rejected.state,'docker',valid,1),third=m.apply(again.state,'merchantAid',valid,1);
assert(third.ok,'Three ordinary applications should be possible per year');
assert(!m.status(m.byId('server'),third.state,valid).available,'Annual application quota must work');
assert(m.status(m.byId('server'),m.normalize(third.state,22),{...valid,year:22}).available,'Applications must refresh after advancing one year');
assert(!m.status(m.byId('government'),state,{...valid,bounty:1000}).available,'Wanted characters cannot join the government');
assert(!m.status(m.byId('pirate_found'),state,{...valid,money:100}).available,'Founding a crew must require funds');
assert(m.apply(state,'pirate_found',valid,0).accepted,'An adult with leadership and funds may found their own crew');
assert(m.apply(state,'pirate_join',{...valid,age:16,year:16},0).accepted,'Younger pirates can join an existing crew');
assert(!m.status(m.byId('marine'),state,{...valid,travel:true}).available,'Applications must not work during a crossing');
assert(!m.status(m.byId('marine'),state,{...valid,pending:true}).available,'Story decisions must take priority');
const migrated=m.normalize({current:{id:'legacy',kind:'ordinary',startYear:18}},21);
assert(m.resign(migrated,{...valid,career:'Marchand'}).ok,'Old careers must be terminable without deleting the save');
const html=fs.readFileSync('index.html','utf8'),hub=fs.readFileSync('src/v95/action-hub-runtime-v95.js','utf8'),sw=fs.readFileSync('sw.js','utf8');
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
assert(html.includes("v112Engine()?.estimatedPay(employment,{rank:p.rank})"),'Civilian wages must replace generic salaries');
console.log('V11.2 CAREER MARKET QA OK',JSON.stringify({ordinary:data.ordinary.length,special:data.special.length,offers:shown.length,applyLimit:data.maxOrdinaryApplications}));
