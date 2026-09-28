import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const manifest=fs.readFileSync('manifest.webmanifest','utf8');
const pack=fs.readFileSync('content-v1.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

new Function(app);
new Function(pack);
JSON.parse(manifest);

if(!html.includes('V1.4')) throw new Error('index.html does not expose V1.4');
if(!app.includes('version:14') || !app.includes('g.version=14')) throw new Error('game state is not V1.4 migration version 14');
if(!html.includes('<script src="content-v1.js"></script>')) throw new Error('content pack is not loaded');
if(html.indexOf('content-v1.js')>html.indexOf('app.js')) throw new Error('content pack must load before app.js');
if(!sw.includes('content-v1.js')) throw new Error('PWA cache does not include content-v1.js');

const dynamicIds=new Set(['eatHeldFruit','challengeBtn','martialTrainBtn','changeCareerBtn','careerRecordBtn','upgradeHousingBtn','investBusinessBtn','partnerTimeBtn','marryBtn','breakupBtn','welcomeChildBtn','orgBondBtn','orgRecruitBtn','orgTrainBtn','orgFundBtn','orgSupplyBtn','orgRepairBtn','orgUpgradeBtn','layLowBtn','surrenderBtn','escapeBtn','claimDomainBtn','fortifyDomainBtn','affiliateCrewBtn','launchCampaignBtn']);
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
if(!app.includes('var ORG_CONFIG=') || !app.includes('var SHIP_TIERS=')) throw new Error('V1.4 organization configuration missing');
if(!app.includes('function organizationTick') || !app.includes('function organizationMissionDanger') || !app.includes('function recruitOrganizationMember')) throw new Error('V1.4 organization engine missing');
if(!app.includes('function upgradeOrganizationShip') || !app.includes('function syncOrganizationRole')) throw new Error('V1.4 command/ship engine missing');
if(!html.includes('id="organizationMembers"') || !html.includes('id="organizationResources"') || !html.includes('id="organizationActions"')) throw new Error('V1.4 organization UI missing');

if(!app.includes('function justiceTick') || !app.includes('function pursuitEncounter') || !app.includes('function arrestPlayer')) throw new Error('V1.4 pursuit/justice engine missing');
if(!app.includes('function prisonTick') || !app.includes('function attemptEscape') || !app.includes('function releaseFromPrison')) throw new Error('V1.4 prison engine missing');
if(!app.includes('function bountyTargets') || !app.includes('function huntBountyTarget')) throw new Error('V1.4 bounty hunting engine missing');
if(!app.includes('function registerCrime') || !app.includes('regionalHeat')) throw new Error('V1.4 crime/heat state missing');
if(!html.includes('id="wantedPoster"') || !html.includes('id="prisonSection"') || !html.includes('id="bountyTargets"')) throw new Error('V1.4 justice UI missing');
if(!app.includes('function influenceTick') || !app.includes('function influenceMetrics') || !app.includes('function evaluateTitles')) throw new Error('V1.4 influence engine missing');
if(!app.includes('function establishDomain') || !app.includes('function fortifyDomain') || !app.includes('function playerDomainDefense')) throw new Error('V1.4 domain engine missing');
if(!app.includes('function recruitAffiliate') || !app.includes('function affiliateCandidates')) throw new Error('V1.4 affiliate network missing');
if(!app.includes('function realignInfluenceAfterFactionChange')) throw new Error('V1.4 faction/domain realignment missing');
if(!html.includes('id="publicStanding"') || !html.includes('id="domainList"') || !html.includes('id="affiliateList"')) throw new Error('V1.4 influence UI missing');
const badDynamicLoops=[...app.matchAll(/(?<!\$)\$\('\[[^']+\]'\)\.forEach/g)];
if(badDynamicLoops.length) throw new Error('Single-element selector used as list: '+badDynamicLoops[0][0]);
if(!app.includes('function strategyTick') || !app.includes('function simulateWars') || !app.includes('function startStrategicWar')) throw new Error('V1.4 strategic war engine missing');
if(!app.includes('function createTreaty') || !app.includes('function simulateTreaties') || !app.includes('function coalitionFor')) throw new Error('V1.4 alliance engine missing');
if(!app.includes('function launchCampaign') || !app.includes('function supportStrategicWar') || !app.includes('function joinWarFront') || !app.includes('function proposeStrategicPeace')) throw new Error('V1.4 player strategy actions missing');
if(!html.includes('id="warList"') || !html.includes('id="treatyList"') || !html.includes('id="strategyActions"')) throw new Error('V1.4 strategic UI missing');
if(app.includes('$$(')) throw new Error('Invalid $$ selector helper found');
const badDynamicLoops2=[...app.matchAll(/(?<!\$)\$\('\[[^']+\]'\)\.forEach/g)];
if(badDynamicLoops2.length) throw new Error('Single-element selector used as list: '+badDynamicLoops2[0][0]);
console.log('ONE PIECE LIFE V1.4 validation OK');
