import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const manifest=fs.readFileSync('manifest.webmanifest','utf8');
const pack=fs.readFileSync('content-v1.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

new Function(app);
new Function(pack);
JSON.parse(manifest);

if(!html.includes('V1.0')) throw new Error('index.html does not expose V1.0');
if(!app.includes('version:10') || !app.includes('g.version=10')) throw new Error('game state is not V1.0 migration version 10');
if(!html.includes('<script src="content-v1.js"></script>')) throw new Error('content pack is not loaded');
if(html.indexOf('content-v1.js')>html.indexOf('app.js')) throw new Error('content pack must load before app.js');
if(!sw.includes('content-v1.js')) throw new Error('PWA cache does not include content-v1.js');

const dynamicIds=new Set(['eatHeldFruit','challengeBtn','martialTrainBtn','changeCareerBtn','careerRecordBtn','upgradeHousingBtn','investBusinessBtn','partnerTimeBtn','marryBtn','breakupBtn','welcomeChildBtn']);
const ids=[...app.matchAll(/\$\('#([^']+)'\)/g)].map(m=>m[1]);
const missing=[...new Set(ids)].filter(id=>!dynamicIds.has(id)&&!html.includes('id="'+id+'"'));
if(missing.length) throw new Error('Missing HTML ids: '+missing.join(', '));

if(!app.includes('function careerTick') || !app.includes('var CAREERS=')) throw new Error('career engine missing');
if(!app.includes('function worldMonthStep') || !app.includes('function simulateCrews') || !app.includes('function simulateActors') || !app.includes('function simulateConflicts')) throw new Error('living world engine missing');
if(!app.includes('function lifeTick') || !app.includes('function continueWithHeir') || !app.includes('function checkAchievements')) throw new Error('life simulator engine missing');
if(!app.includes('function processCanonEvents') || !app.includes('function resolveCanonEvent')) throw new Error('V1 causal canon engine missing');
if(!app.includes('CANON_EVENTS') || !app.includes('SPECIAL_TECHNIQUES') || !app.includes('pickFruit')) throw new Error('V1 content integration missing');
if(!app.includes('relationshipStatus') || !app.includes('children') || !app.includes('netWorthPeak')) throw new Error('family/economy state missing');
if(!app.includes('factionRep') || !app.includes('Cipher Pol')) throw new Error('faction systems missing');
if(!app.includes('canonForecast') || !app.includes('contentStats')) throw new Error('V1 canon UI missing');

console.log('ONE PIECE LIFE V1.0 validation OK');
