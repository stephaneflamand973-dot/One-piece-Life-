import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit, devices } from 'playwright';

const BASE='http://127.0.0.1:4187/foundation/';
const server=spawn('python3',['-m','http.server','4187','--bind','127.0.0.1'],{
  cwd:process.cwd(),stdio:'ignore'
});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const picture=(label,phase)=>'test-output/'+label+'-'+phase+'.png';

async function waitForServer() {
  for(let i=0;i<70;i++){
    try { if((await fetch(BASE)).ok) return; } catch {}
    await pause(200);
  }
  throw new Error('Serveur QA inaccessible');
}
async function checkGeometry(page,label,phase){
  const metrics=await page.evaluate(()=>{
    const nav=document.querySelector('.bottom-nav').getBoundingClientRect();
    return {
      width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
      height:window.innerHeight,navBottom:nav.bottom,
      buttonWidth:document.querySelector('.bottom-nav button').getBoundingClientRect().width
    };
  });
  assert.ok(metrics.scrollWidth<=metrics.width+2,
    label+'/'+phase+' débordement horizontal: '+JSON.stringify(metrics));
  assert.ok(Math.abs(metrics.navBottom-metrics.height)<=3,
    label+'/'+phase+' navigation non fixe: '+JSON.stringify(metrics));
  assert.ok(metrics.buttonWidth>=44,
    label+'/'+phase+' boutons trop étroits: '+JSON.stringify(metrics));
}
async function journey(browser,label,contextOptions){
  const context=await browser.newContext(contextOptions);
  const page=await context.newPage();
  // Tirages contrôlés pour une QA reproductible des initiatives des PNJ.
  await page.addInitScript(() => { Math.random=()=>0; });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(BASE,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#firstName').count(),1);
    await checkGeometry(page,label,'start');
    await page.locator('#firstName').focus();
    if(await page.evaluate(()=>CSS.supports('selector(.app-shell:has(.creation-form:focus-within))'))){
      const visibility=await page.locator('.bottom-nav').evaluate(el=>getComputedStyle(el).visibility);
      assert.equal(visibility,'hidden','Le clavier mobile ne doit pas recouvrir le formulaire');
    }
    await page.locator('#firstName').fill('Lina');
    await page.locator('#lastName').fill('Marin');
    await page.locator('#gender').selectOption('F');
    await page.locator('#sea-select').selectOption('east');
    await page.locator('#place-select').selectOption({label:'Village de Fuchsia'});
    await page.locator('[data-create-life] button[type=submit]').click();
    assert.match(await page.locator('.character-header h1').innerText(),/Lina Marin/);
    assert.equal(await page.locator('.story-event').count(),1);
    await checkGeometry(page,label,'born');
    await page.screenshot({path:picture(label,'birth')});

    await page.locator('[data-age]').click();
    assert.equal(await page.locator('.story-latest').getAttribute('data-history-age'),'1');
    await page.locator('button[data-nav=career]').click();
    await page.waitForURL('**/#/career');
    await page.locator('button[data-back]').waitFor();
    assert.equal(await page.locator('[data-age]').count(),0);
    await page.locator('button[data-back]').click();
    await page.waitForURL('**/#/life');
    await page.locator('.story-latest').waitFor();
    assert.equal(await page.locator('.story-latest').getAttribute('data-history-age'),'1');

    for(let age=2;age<=6;age++) await page.locator('[data-age]').click();
    assert.equal(await page.locator('.decision-panel').count(),1);
    assert.equal(await page.locator('button[data-age]').count(),0);
    await checkGeometry(page,label,'pending');
    await page.screenshot({path:picture(label,'decision')});
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('.decision-panel').count(),1);
    await page.locator('button[data-choice]').first().click();
    assert.equal(await page.locator('.story-latest').getAttribute('data-history-age'),'6');
    assert.equal(await page.locator('.decision-panel').count(),0);

    // Relations réelles : famille, affinité, rencontre, sauvegarde et reprise.
    await page.locator('button[data-nav=relationships]').click();
    await page.locator('.relation-card[data-person=mother]').waitFor();
    assert.equal(await page.locator('.relation-card[data-person=father]').count(),1);
    const parentBond=Number(await page.locator('.relation-card[data-person=mother] .relation-score')
      .innerText().then(text=>text.replace('%','')));
    await page.locator('.relation-card[data-person=mother]').click();
    await page.locator('button[data-interact=talk]').click();
    const afterContact=Number(await page.locator('.relation-card[data-person=mother] .relation-score')
      .innerText().then(text=>text.replace('%','')));
    assert.notEqual(afterContact,parentBond,label+' la réaction ne change pas le lien');
    await page.locator('button[data-meet]').click();
    assert.equal(await page.locator('.relation-card[data-person=friend-1]').count(),1);
    await checkGeometry(page,label,'relationships');
    await page.screenshot({path:picture(label,'relations')});
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('.relation-card[data-person=friend-1]').count(),1);
    assert.equal(await page.locator('.relation-card[data-person=mother] .relation-score').innerText(),
      afterContact+'%');
    await page.locator('.bottom-nav button[data-nav=life]').click();
    await page.waitForURL('**/#/life');
    await page.locator('[data-age]').waitFor();

    for(let age=7;age<=20;age++){
      await page.locator('[data-age]').click();
      const choices=page.locator('button[data-choice]');
      if(await choices.count()) await choices.first().click();
      const npcChoices=page.locator('button[data-npc-choice]');
      if(await npcChoices.count()){
        if(age===9){
          assert.equal(await npcChoices.count(),2);
          await checkGeometry(page,label,'npc-pending');
          await page.screenshot({path:picture(label,'npc-event')});
          await page.reload({waitUntil:'networkidle'});
          assert.equal(await page.locator('button[data-npc-choice]').count(),2,
            label+' initiative perdue après rechargement');
        }
        await page.locator('button[data-npc-choice]').first().click();
      }
      if(age===7){
        // Un deuxième ami forme un véritable cercle social.
        await page.locator('button[data-nav=relationships]').click();
        await page.locator('.relation-card[data-person=mother]').waitFor();
        await page.locator('button[data-meet]').click();
        assert.equal(await page.locator('.relation-card[data-person=friend-2]').count(),1);
        assert.equal(await page.locator('.social-circle').count(),1);
        await checkGeometry(page,label,'social-circle');
        await page.locator('.bottom-nav button[data-nav=life]').click();
        await page.locator('[data-age]').waitFor();
      }
      if(age===18){
        await page.locator('button[data-nav=relationships]').click();
        await page.locator('[data-join-faction=pirate]').click();
        assert.equal(await page.locator('.world-section .relation-card').count(),4);
        assert.match(await page.locator('.world-summary').innerText(),/Équipage des Alizés/);
        await checkGeometry(page,label,'world-join');
        await page.screenshot({path:picture(label,'pirate-crew')});
        await page.reload({waitUntil:'networkidle'});
        assert.equal(await page.locator('.world-section .relation-card').count(),4);
        await page.locator('.bottom-nav button[data-nav=life]').click();
        await page.locator('[data-age]').waitFor();
      }
      if(age===19){
        await page.locator('button[data-nav=relationships]').click();
        const before=Number(await page.locator('.world-score-grid b').first().innerText().then(x=>x.split('/')[0]));
        await page.locator('[data-world-action=mission]').click();
        const after=Number(await page.locator('.world-score-grid b').first().innerText().then(x=>x.split('/')[0]));
        assert.ok(after>before,label+' : une mission réussie doit augmenter la réputation');
        await checkGeometry(page,label,'world-mission');
        await page.screenshot({path:picture(label,'world-mission')});
        await page.reload({waitUntil:'networkidle'});
        assert.equal(Number(await page.locator('.world-score-grid b').first().innerText().then(x=>x.split('/')[0])),after);
        await page.locator('.bottom-nav button[data-nav=life]').click();
        await page.locator('[data-age]').waitFor();
      }
      if(age===8){
        await page.locator('button[data-nav=relationships]').click();
        const beforeCohesion=Number(await page.locator('.social-circle [aria-label="Cohésion du groupe"]')
          .getAttribute('aria-valuenow'));
        await page.locator('button[data-gather]').click();
        const afterCohesion=Number(await page.locator('.social-circle [aria-label="Cohésion du groupe"]')
          .getAttribute('aria-valuenow'));
        assert.notEqual(beforeCohesion,afterCohesion);
        await page.screenshot({path:picture(label,'social-group')});
        await page.reload({waitUntil:'networkidle'});
        assert.equal(Number(await page.locator('.social-circle [aria-label="Cohésion du groupe"]')
          .getAttribute('aria-valuenow')),afterCohesion);
        await page.locator('.bottom-nav button[data-nav=life]').click();
        await page.locator('[data-age]').waitFor();
      }
    }
    // V0.4.4 : rencontre, rendez-vous, puis sauvegarde du couple.
    await page.locator('button[data-nav=relationships]').click();
    await page.locator('[data-romance-meet]').click();
    assert.equal(await page.locator('.relation-card[data-person=partner-1]').count(),1);
    await page.locator('[data-romance=date]').click();
    const bondDating=await page.locator('.relation-card[data-person=partner-1] .relation-score').innerText();
    await checkGeometry(page,label,'romance');
    await page.screenshot({path:picture(label,'romance')});
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('.relation-card[data-person=partner-1] .relation-score').innerText(),
      bondDating);
    await page.locator('.bottom-nav button[data-nav=life]').click();
    await page.locator('[data-age]').waitFor();

    assert.equal(await page.locator('.story-latest').getAttribute('data-history-age'),'20');
    assert.equal(await page.locator('.story-event').count(),8);
    await checkGeometry(page,label,'age20');
    await page.screenshot({path:picture(label,'timeline')});
    await page.locator('[data-show-older]').click();
    assert.equal(await page.locator('.story-event').count(),16);
    await page.locator('[data-show-older]').evaluate(el=>el.scrollIntoView({block:'center'}));
    const before=await page.evaluate(()=>window.scrollY);
    await page.locator('[data-show-older]').click();
    const after=await page.evaluate(()=>window.scrollY);
    assert.ok(Math.abs(after-before)<110,
      label+' l’historique saute de '+before+' vers '+after);
    assert.equal(await page.locator('.story-event').count(),21);
    assert.equal(await page.locator('.story-event').last().getAttribute('data-history-age'),'0');

    await page.locator('[data-age]').click();
    assert.equal(await page.locator('.story-latest').getAttribute('data-history-age'),'21');
    assert.equal(await page.locator('.story-event').count(),8);
    assert.ok((await page.evaluate(()=>window.scrollY))<=2,
      label+' le fil ne revient pas au présent');
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('.story-latest').getAttribute('data-history-age'),'21');
    await checkGeometry(page,label,'reload');

    await page.locator('button[data-nav=relationships]').click();
    await page.locator('[data-romance=date]').click();
    await page.locator('.bottom-nav button[data-nav=life]').click();
    await page.locator('[data-age]').waitFor();
    await page.locator('[data-age]').click(); // 22 ans, mariage.
    await page.locator('button[data-nav=relationships]').click();
    assert.equal(await page.locator('[data-romance=marry]').isEnabled(),true);
    await page.locator('[data-romance=marry]').click();
    assert.match(await page.locator('.relation-card[data-person=partner-1] small').first().innerText(),
      /Marié/);
    await page.locator('.bottom-nav button[data-nav=life]').click();
    await page.locator('[data-age]').waitFor();
    await page.locator('[data-age]').click(); // 23 ans, choix PNJ potentiel.
    if(await page.locator('[data-npc-choice]').count())
      await page.locator('[data-npc-choice]').first().click();
    await page.locator('button[data-nav=relationships]').click();
    assert.equal(await page.locator('[data-romance=child]').isEnabled(),true);
    await page.locator('[data-romance=child]').click();
    assert.equal(await page.locator('.relation-card[data-person=child-1]').count(),1);
    await checkGeometry(page,label,'child');
    await page.screenshot({path:picture(label,'children')});
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('.relation-card[data-person=child-1]').count(),1);
    await page.locator('.bottom-nav button[data-nav=life]').click();
    await page.locator('[data-age]').waitFor();
    await page.locator('[data-age]').click(); // 24 ans, séparation.
    await page.locator('button[data-nav=relationships]').click();
    await page.locator('[data-romance=separate]').click();
    assert.equal(await page.locator('.relation-card[data-person=child-1]').count(),1);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('.relation-card[data-person=partner-1]').count(),1);
    assert.equal(await page.locator('[data-romance-meet]').isEnabled(),true);


    page.once('dialog',dialog=>dialog.accept());
    await page.locator('button[data-restart]').click();
    await page.locator('[data-create-life]').waitFor();
    assert.equal(await page.locator('[data-create-life]').count(),1);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('[data-create-life]').count(),1);
    assert.deepEqual(errors,[],label+' erreurs JavaScript');
    console.log('OK '+label+' : création, défilement, navigation, choix, reprise, reset');
  } catch(error) {
    await page.screenshot({path:picture(label,'failed')}).catch(()=>{});
    throw new Error(label+' : '+error.message,{cause:error});
  } finally { await context.close(); }
}
await mkdir('test-output',{recursive:true});
try {
  await waitForServer();
  const chrome=await chromium.launch({headless:true});
  try {
    for(const [label,width,height] of [
      ['chromium-320',320,568],['chromium-390',390,844],['chromium-430',430,932]
    ]) {
      await journey(chrome,label,{viewport:{width,height},isMobile:true,
        hasTouch:true,deviceScaleFactor:2});
    }
  } finally { await chrome.close(); }
  const safari=await webkit.launch({headless:true});
  try { await journey(safari,'webkit-iphone13',devices['iPhone 13']); }
  finally { await safari.close(); }
  console.log('QA MOBILE : 4 parcours complets réussis.');
} finally { server.kill('SIGTERM'); }
