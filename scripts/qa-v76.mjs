import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('src/v76/ui-v76.css','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const dataSrc=fs.readFileSync('src/data/ui-layout-v76.js','utf8');
const engineSrc=fs.readFileSync('src/v76/ui-components-v76.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}
function eq(a,b,msg){if(a!==b)throw new Error(msg+': '+a+' !== '+b)}
function gt(a,b,msg){if(!(a>b))throw new Error(msg+': '+a+' <= '+b)}

const sandbox={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(registrySrc,sandbox,{filename:'module-registry.js'});
vm.runInContext(dataSrc,sandbox,{filename:'ui-layout-v76.js'});
vm.runInContext(engineSrc,sandbox,{filename:'ui-components-v76.js'});

const registry=sandbox.OPL_MODULES;
const data=registry.get('uiLayoutDataV76');
const ui=registry.get('uiComponentsV76');

assert(data&&ui,'V7.6 modules not registered');
eq(data.version,'7.6.0','UI layout data version mismatch');
eq(ui.version,'7.6.0','UI components version mismatch');
eq(data.tabs.length,5,'Bottom navigation should keep five primary tabs');
assert(data.sections.length>=20,'Not enough modular section definitions');
assert(data.tabs.some(t=>t.id==='life')&&data.tabs.some(t=>t.id==='world'),'Core tabs missing');

const fresh=ui.normalizeState({});
eq(fresh.density,'focus','Fresh UI should default to Focus mode');
eq(fresh.activeTab,'life','Fresh UI should open on Life');
assert(fresh.collapsed&&typeof fresh.collapsed==='object','Collapsed state missing');
const invalid=ui.normalizeState({density:'chaos',activeTab:'inventory'});
eq(invalid.density,'focus','Invalid density should migrate safely');
eq(invalid.activeTab,'life','Invalid active tab should migrate safely');

const secondary=data.sections.find(x=>x.defaultCollapsed);
const primary=data.sections.find(x=>!x.defaultCollapsed);
assert(secondary&&primary,'Section priority definitions incomplete');
assert(ui.sectionCollapsed(fresh,secondary),'Secondary section should collapse in Focus mode');
assert(!ui.sectionCollapsed(fresh,primary),'Primary section should remain open in Focus mode');
const manually=ui.toggleSection(fresh,secondary.key);
assert(!ui.sectionCollapsed(manually,secondary),'Manual section toggle failed');

const expanded=ui.toggleDensity({...fresh,collapsed:{[secondary.key]:true}});
eq(expanded.density,'expanded','Density toggle did not enter expanded mode');
eq(Object.keys(expanded.collapsed).length,0,'Density toggle should reset manual collapse overrides');
assert(!ui.sectionCollapsed(expanded,secondary),'Expanded mode should open default-secondary sections');

const pending=ui.priority({pendingDecision:true,pendingDecisionTitle:'Choix majeur',health:10,energy:10});
eq(pending.title,'Décision en attente','Pending decision should remain the highest UI priority');
eq(pending.severity,'critical','Pending decision severity mismatch');
const health=ui.priority({health:20,energy:80});
eq(health.title,'Santé critique','Critical health priority missing');
const energy=ui.priority({health:90,energy:12});
eq(energy.title,'Énergie très basse','Low-energy priority missing');
const promo=ui.priority({health:90,energy:90,promotionEligible:true});
eq(promo.title,'Promotion possible','Promotion priority missing');
const calm=ui.priority({health:90,energy:90});
eq(calm.title,'Trajectoire stable','Calm-state fallback missing');

const badges=ui.navBadges({pendingDecision:true,activeMission:true,promotionEligible:true,highRelationRisk:12,worldThreats:4});
eq(badges.life,1,'Life badge missing');
eq(badges.character,1,'Character badge missing');
eq(badges.relations,9,'Relation badge should cap at 9');
eq(badges.world,4,'World badge mismatch');

const deltas=ui.annualDeltas({powerDelta:4,moneyDelta:-1200,healthDelta:-5,rankBefore:'Lieutenant',rankAfter:'Commandant',visitedDelta:2});
assert(deltas.some(d=>d.id==='power'&&d.tone==='up'),'Positive power delta missing');
assert(deltas.some(d=>d.id==='money'&&d.tone==='down'),'Negative money delta missing');
assert(deltas.some(d=>d.id==='rank'),'Rank delta missing');
assert(deltas.length<=5,'Annual delta strip should stay compact');

const before=ui.snapshot({age:120,money:10000,health:100,energy:80,power:40,rank:'A',location:'East Blue',reputation:12});
const after=ui.snapshot({age:132,money:12500,health:91,energy:95,power:46,rank:'B',location:'Grand Line',reputation:18});
const diffs=ui.diffSnapshots(before,after);
assert(diffs.some(d=>d.key==='money'&&d.delta===2500&&d.tone==='up'),'Money feedback diff incorrect');
assert(diffs.some(d=>d.key==='health'&&d.delta===-9&&d.tone==='down'),'Health feedback diff incorrect');
assert(diffs.some(d=>d.key==='rank'&&d.from==='A'&&d.to==='B'),'Rank feedback diff missing');
assert(diffs.some(d=>d.key==='location'&&d.tone==='neutral'),'Location feedback diff missing');

const focus=ui.focusModel({health:75,energy:68,power:63,reputation:44,reputationLabel:'Remarqué',lastAnnualReport:{powerDelta:2,moneyDelta:5000,healthDelta:0,rankBefore:'A',rankAfter:'A'}});
eq(focus.vitals.length,4,'Focus dashboard should expose four essential vitals');
assert(focus.annual.length>=2,'Focus dashboard should expose recent annual changes');

assert(css.includes('.v76-focus-card'),'Focus dashboard CSS missing');
assert(css.includes('.nav-badge'),'Navigation badge CSS missing');
assert(css.includes('.v76-section.v76-collapsed'),'Collapsible section CSS missing');
assert(css.includes('@media(max-width:520px)'),'Mobile breakpoint missing');
assert(css.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion accessibility rule missing');

// Live integration contract.
const saveVersion=Number(html.match(/const SAVE_VERSION\s*=\s*(\d+);/)?.[1]||0);
const gameVersion=html.match(/const GAME_VERSION\s*=\s*'([0-9.]+)';/)?.[1]||'0.0.0';
assert(/ONE PIECE LIFE — V(?:7|8)\./.test(html),'V7+ release title missing');
assert(saveVersion>=760,'V7.6 regression QA requires save version >= 760');
const [gameMajor,gameMinor]=gameVersion.split('.').map(Number);
assert(gameMajor>7||(gameMajor===7&&gameMinor>=6),'V7.6 regression QA requires game version >= 7.6');
for(const asset of ['src/data/ui-layout-v76.js','src/v76/ui-components-v76.js','src/v76/ui-v76.css']){
  assert(html.includes(asset),'Index does not load '+asset);
  assert(sw.includes(asset),'PWA does not cache '+asset);
}
assert(/one-piece-life-v7-[6-9]-\d+/.test(sw),'PWA cache must remain at V7.6 or newer');
assert(html.includes('id="v76FocusCard"'),'Focus dashboard missing');
assert(html.includes('id="uiDensityToggle"'),'Density control missing');
assert(html.includes("uiV76:{version:1,density:'focus'"),'Fresh-save UI state missing');
assert(html.includes("if(!game.meta.uiV76||typeof game.meta.uiV76!=='object')"),'Old-save UI migration guard missing');
for(const fn of ['function v76Ensure','function v76OpenTab','function v76EnhanceSections','function v76RenderFocus','function v76RenderNavBadges','function v76ApplyFeedback','function v76AfterRender']){
  assert(html.includes(fn),'Missing live V7.6 bridge '+fn);
}
assert(html.includes("document.querySelectorAll('.nav-item').forEach"),'Safe navigation binding missing');
assert(html.includes('renderDev();v76AfterRender()'),'V7.6 after-render orchestration missing');
assert(/V7\.[6-9] • /.test(html),'Start screen release copy is stale');
assert(!/(?<!\$)\$\([^)]*\)\.forEach/g.test(html),'Mono-element $() selector followed by forEach regression');

console.log('V7.6 UI & GAME FEEL QA OK',JSON.stringify({
  version:gameVersion,
  tabs:data.tabs.length,
  sections:data.sections.length,
  focusDefaults:data.sections.filter(x=>x.defaultCollapsed).length,
  priorityCritical:pending.title,
  navWorldBadge:badges.world,
  feedbackDiffs:diffs.length,
  mobile:true,
  migrationGuard:true
}));
