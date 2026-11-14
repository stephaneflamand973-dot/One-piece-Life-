// Tests de bout en bout dans Chromium, au format iPhone. Lancer : npm run build && npx vite preview --port 4173 & npm run e2e
import { createRequire } from 'module'
import fs from 'fs'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
const URL = process.env.VO_URL ?? 'http://localhost:4173/'
const OUT = new globalThis.URL('./output/', import.meta.url).pathname
fs.mkdirSync(OUT, { recursive: true })

const results = []
let page
const errors = []
async function step(name, fn) {
  try { await fn(); results.push(['OK', name]); console.log('  ✓', name) }
  catch (e) { results.push(['ÉCHEC', name, e.message.split('\n')[0]]); console.log('  ✗', name, '—', e.message.split('\n').slice(0, 9).join(' // ')); await page.screenshot({ path: `${OUT}echec-${results.length}.png` }).catch(() => {}) }
}
const expectText = async (t, timeout = 5000) => page.getByText(t, { exact: false }).first().waitFor({ timeout })
const shot = (n) => page.screenshot({ path: `${OUT}${n}.png` })
const save = () => page.getByRole('button', { name: /^(Enregistrer|Créer le dossier)$/ }).last().click()
const go = (hash) => page.evaluate((h) => { location.hash = h }, hash)

const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 14'], locale: 'fr-FR', timezoneId: 'America/Martinique' })
page = await ctx.newPage(); page.setDefaultTimeout(6000)
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto(URL)

await step('Ouverture : état vide utile, aucune donnée inventée', async () => {
  await expectText('Bienvenue dans VO PILOT')
  await expectText('Rien d’urgent pour l’instant')
  await shot('01-accueil-vide')
})

await step('Parcours 1 — création d’un prospect en quelques champs', async () => {
  await page.getByRole('button', { name: 'Ajout rapide' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Prospect', exact: true }).click()
  const d = page.getByRole('dialog')
  await d.locator('input').nth(0).fill('Durand')
  await d.locator('input').nth(1).fill('Camille')
  await d.locator('input[type=tel]').fill('0696 12 34 56')
  await d.getByPlaceholder('ex. Clio automatique').fill('Clio automatique')
  await d.locator('select').nth(1).selectOption('Automatique')
  await d.getByRole('textbox').nth(4).fill('15000')
  await save()
  await page.getByRole('heading', { name: 'Camille Durand' }).waitFor()
  await expectText('Prochaines actions')
  await page.getByText('Premier suivi', { exact: true }).first().waitFor()
})

await step('Persistance après actualisation de la page', async () => {
  await page.reload()
  await page.getByRole('heading', { name: 'Camille Durand' }).waitFor()
  await page.getByText('Premier suivi', { exact: true }).first().waitFor()
})

await step('Modification du prospect (découverte : usage)', async () => {
  await page.getByRole('button', { name: /Découverte/ }).click()
  const usage = page.getByPlaceholder('Trajets quotidiens, famille, professionnel…')
  await usage.fill('Trajets quotidiens Lamentin')
  await page.getByPlaceholder('Modèle, année, km').click()
  await page.waitForTimeout(400)
  await page.reload()
  await page.getByRole('button', { name: /Découverte/ }).click()
  if ((await page.getByPlaceholder('Trajets quotidiens, famille, professionnel…').inputValue()) !== 'Trajets quotidiens Lamentin') throw new Error('usage non enregistré')
})

await step('Mode express : appel sans réponse → nouvelle tentative proposée, statut « Injoignable »', async () => {
  await page.getByRole('button', { name: 'Suivi', exact: true }).click()
  await page.getByRole('button', { name: 'Noter' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Sans réponse', exact: true }).click()
  await page.waitForTimeout(300)
  const prop = await page.getByLabel('Intitulé de la prochaine action').inputValue()
  if (prop !== 'Nouvelle tentative d’appel') throw new Error('proposition inattendue : ' + prop)
  await save()
  await expectText('Appel sortant — Sans réponse')
  await expectText('Injoignable')
})

await step('Relance échue visible dans les priorités du tableau de bord', async () => {
  // on avance artificiellement l'échéance dans le passé
  await page.evaluate(async () => {
    const req = indexedDB.open('vo-pilot')
    await new Promise((res) => { req.onsuccess = res })
    const tx = req.result.transaction('tasks', 'readwrite'); const st = tx.objectStore('tasks')
    const all = await new Promise((res) => { const r = st.getAll(); r.onsuccess = () => res(r.result) })
    for (const t of all) { t.due = new Date(Date.now() - 26 * 3600e3).toISOString(); st.put(t) }
    await new Promise((res) => { tx.oncomplete = res })
  })
  await go('#/'); await page.reload()
  await expectText('Mes trois priorités')
  await expectText('non fait')
  await expectText('Camille Durand')
  await shot('02-priorites')
})

await step('Recherche globale par nom et par téléphone', async () => {
  await page.getByRole('button', { name: 'Recherche' }).first().click()
  await page.getByLabel('Recherche globale').fill('durand')
  await page.getByRole('dialog').getByText('Camille Durand').first().waitFor()
  await page.getByLabel('Recherche globale').fill('123456')
  await page.getByRole('dialog').getByText('Camille Durand').first().waitFor()
  await page.keyboard.press('Escape')
})

await step('Parcours 5 — ajout d’un véhicule → prospect compatible suggéré avec raisons', async () => {
  await page.getByRole('button', { name: 'Ajout rapide' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Véhicule', exact: true }).click()
  const d = page.getByRole('dialog')
  await d.locator('input').nth(1).fill('Clio')
  await d.locator('input').nth(2).fill('V TCe 90')
  await d.locator('input').nth(3).fill('14490')
  await d.locator('select').nth(1).selectOption('Automatique')
  await d.locator('input').nth(9).fill('5')
  await save()
  await expectText('Prospects compatibles (1)')
  await expectText('Boîte automatique')
  await shot('03-vehicule-correspondance')
})

await step('Message WhatsApp préparé, lien wa.me correct, envoi NON marqué sans confirmation', async () => {
  await page.getByRole('button', { name: 'Préparer un message' }).click()
  await page.getByRole('heading', { name: 'Messages' }).waitFor()
  const txt = await page.getByLabel('Texte du message').inputValue()
  if (!txt.includes('Camille') || !txt.includes('Clio')) throw new Error('variables non remplacées : ' + txt)
  const href = await page.getByRole('link', { name: 'Ouvrir WhatsApp' }).getAttribute('href')
  if (!href.startsWith('https://wa.me/596696123456?text=')) throw new Error('lien inattendu ' + href)
  await page.getByRole('button', { name: 'J’ai envoyé' }).click()
  await expectText('Le message est-il réellement parti ?')
  await page.getByRole('button', { name: 'Oui, envoyé' }).click()
  await expectText('Envoi confirmé')
  await shot('04-whatsapp')
})

await step('Parcours 2 — devis : frais préremplis, total calculé, envoi enregistré, relance créée', async () => {
  await go('#/clients'); await page.getByText('Camille Durand').first().click()
  await page.getByRole('button', { name: /Véhicules/ }).click()
  await page.getByRole('button', { name: 'Devis', exact: true }).first().click()
  await expectText('Récapitulatif estimé')
  await expectText('278,76') // 13,76 + 5 × 53
  await expectText('14 968,76') // 14 490 + 200 + 278,76
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.getByRole('button', { name: 'J’ai envoyé ce devis' }).click()
  await page.getByRole('button', { name: 'Confirmer l’envoi' }).click()
  await expectText('Transformer en vente')
  await shot('05-devis')
  await page.waitForTimeout(900)
  await go('#/clients'); await page.getByText('Camille Durand').first().click()
  await expectText('Relance devis')
  await expectText('Devis envoyé')
})

await step('Proposition imprimable (PDF) non contractuelle', async () => {
  await go('#/devis'); await page.getByText('Camille Durand').first().click()
  await page.getByRole('button', { name: /Proposition PDF/ }).click()
  await expectText('Proposition commerciale')
  await expectText('ni un bon de commande')
  await shot('06-proposition')
  await page.getByRole('button', { name: 'Retour' }).click()
})

await step('Barème de commission saisi (150 € par vente)', async () => {
  await go('#/commissions')
  await expectText('Barème non renseigné')
  await page.getByRole('button', { name: 'Règle' }).click()
  await page.getByText('Montant (€)').locator('..').locator('input').fill('150')
  await page.waitForTimeout(300)
  await expectText('Base par vente')
})

await step('Parcours 3 — vente depuis le devis : dossier, commission, checklist, statuts liés', async () => {
  await go('#/devis'); await page.getByText('Camille Durand').first().click()
  await page.getByRole('button', { name: 'Transformer en vente' }).click()
  await page.getByRole('dialog').getByText('Commission estimée').waitFor()
  await save()
  await expectText('Ce qui manque pour livrer')
  await expectText('Contrôle technique')
  await expectText('150')
  await shot('07-dossier-vente')
  await go('#/'); await expectText('Mes trois priorités')
  const txt = await page.locator('main').innerText()
  if (!/1\s*\/ 10/.test(txt)) throw new Error('vente non comptée au tableau de bord')
})

await step('Parcours 4 — blocage visible, raison affichée, puis déblocage', async () => {
  await go('#/livraisons'); await page.getByText('Renault Clio').first().click()
  await page.getByText('Pneus', { exact: true }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Bloquée' }).click()
  await page.getByRole('dialog').locator('textarea').fill('Pneus commandés, non livrés')
  await page.getByRole('dialog').getByRole('button', { name: 'Fermer' }).last().click()
  await expectText('Pneus — bloqué : Pneus commandés, non livrés')
  await page.waitForTimeout(900)
  await go('#/livraisons')
  await expectText('Bloqués (1)')
  await shot('08-livraisons-bloque')
  await go('#/')
  await expectText('Bloqué : Pneus')
  await shot('09-accueil-blocage')
  await go('#/livraisons'); await page.getByText('Renault Clio').first().click()
  await page.getByRole('button', { name: 'Avancer Pneus' }).click() // bloquée → en cours
  await page.getByRole('button', { name: 'Avancer Pneus' }).click() // → terminée
})

await step('Validation des étapes obligatoires → « Prêt à livrer » → livraison effective', async () => {
  for (const label of ['Contrôle technique', 'Révision', 'Carrosserie', 'Nettoyage', 'Contrôle final', 'Documents', 'Paiement confirmé']) {
    const b = page.getByRole('button', { name: `Avancer ${label}` })
    await b.click(); await page.waitForTimeout(120); await b.click(); await page.waitForTimeout(120)
  }
  await expectText('Checklist complète')
  await expectText('Prêt à livrer')
  await shot('10-pret-a-livrer')
  await page.getByRole('button', { name: 'Livraison effectuée' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Livraison effectuée' }).click()
  await expectText('Livré le')
  await page.waitForTimeout(900)
  await go('#/fidelisation')
  await expectText('Suivi satisfaction')
})

await step('Parcours 6 — fin de mois : commissions, versement saisi, écart, statistiques', async () => {
  await go('#/commissions')
  await expectText('Ventes comptées')
  await page.getByText('Commissions versées (brut, €)').locator('..').locator('input').fill('100')
  await expectText('écart versé − estimé')
  await expectText('50')
  await shot('11-commissions')
  await go('#/stats')
  await expectText('Données insuffisantes')
  await expectText('Axes d’amélioration')
  await shot('12-stats')
})

await step('Assistant : réponses tirées des données réelles', async () => {
  await go('#/assistant')
  await page.getByRole('button', { name: 'Combien de ventes me manque-t-il ?' }).click()
  await expectText('1 vente(s) ce mois pour un objectif de 10')
  await shot('13-assistant')
})

await step('Import CSV : aperçu, doublon par référence mis à jour, ligne invalide signalée', async () => {
  await go('#/vehicules')
  const csv = 'ref;marque;modele;prix;boite\nCSV-1;Dacia;Sandero;9990;Manuelle\nCSV-1;Dacia;Sandero;9490;Manuelle\n;Renault;;1;\n'
  await page.locator('input[type=file]').setInputFiles({ name: 'stock.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expectText('Import — vérification')
  await expectText('Ligne 4 ignorée')
  await page.getByRole('button', { name: /Importer 2 véhicule/ }).click()
  await expectText('1 véhicule(s) ajouté(s), 1 mis à jour')
  await page.getByText('Tous', { exact: true }).click()
  await expectText('9 490')
  await page.locator('input[type=file]').setInputFiles({ name: 'faux.csv', mimeType: 'text/csv', buffer: Buffer.from('a;b\n1;2') })
  await expectText('introuvables')
  await page.keyboard.press('Escape')
})

let backup
await step('Export de sauvegarde JSON', async () => {
  await go('#/parametres'); await page.getByRole('button', { name: 'Données' }).click()
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter tout (JSON)' }).click()])
  backup = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'))
  if (backup.app !== 'vo-pilot' || backup.tables.clients.length !== 1 || backup.tables.sales.length !== 1) throw new Error('contenu inattendu')
})

await step('Import corrompu refusé sans toucher aux données', async () => {
  const f = page.locator('input[type=file][accept*="json"]')
  await f.setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{pas du json') })
  await expectText('pas un fichier JSON valide')
  await f.setInputFiles({ name: 'y.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"autre"}') })
  await expectText('Format non reconnu')
})

await step('Suppression massive avec double confirmation, puis restauration complète', async () => {
  await page.getByRole('button', { name: 'Effacer toutes les données' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Tout effacer' }).click()
  await expectText('Toutes les données ont été effacées')
  await go('#/clients'); await expectText('Aucun prospect pour l’instant')
  await go('#/parametres'); await page.getByRole('button', { name: 'Données' }).click()
  await page.locator('input[type=file][accept*="json"]').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
  await expectText('Restaurer cette sauvegarde ?')
  await page.getByRole('button', { name: 'Remplacer mes données' }).click()
  await expectText('Sauvegarde restaurée')
  await go('#/clients?vue=tous'); await expectText('Camille Durand')
  await go('#/ventes'); await page.getByText('Livrées').click(); await expectText('Renault Clio')
})

await step('Suppression contrôlée d’une fiche (refusée si une vente existe)', async () => {
  await go('#/clients?vue=tous'); await page.getByText('Camille Durand').first().click()
  await page.getByRole('button', { name: 'Supprimer la fiche' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click()
  await expectText('dossier de vente')
})

await step('Vue pipeline : les dossiers rangés par étape', async () => {
  await go('#/clients?vue=tous')
  await page.getByRole('button', { name: 'Pipeline', exact: true }).click()
  const col = page.locator('div.w-64', { hasText: 'Livré' })
  await col.getByText('Camille Durand').waitFor()
  await shot('19-pipeline')
})

await step('Import Excel (.xlsx) lu directement', async () => {
  const { zipSync, strToU8 } = await import('fflate')
  const sheet = '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>ref</t></is></c><c r="B1" t="inlineStr"><is><t>marque</t></is></c><c r="C1" t="inlineStr"><is><t>modele</t></is></c><c r="D1" t="inlineStr"><is><t>prix</t></is></c><c r="E1" t="inlineStr"><is><t>km</t></is></c></row>'
    + '<row r="2"><c r="A2" t="inlineStr"><is><t>XL-1</t></is></c><c r="B2" t="inlineStr"><is><t>Renault</t></is></c><c r="C2" t="inlineStr"><is><t>Captur</t></is></c><c r="D2"><v>16990</v></c><c r="E2"><v>48200</v></c></row></sheetData></worksheet>'
  const buf = Buffer.from(zipSync({ 'xl/worksheets/sheet1.xml': strToU8(sheet) }))
  await go('#/vehicules')
  await page.locator('input[type=file]').setInputFiles({ name: 'stock.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: buf })
  await expectText('Import — vérification')
  await page.getByRole('button', { name: /Importer 1 véhicule/ }).click()
  await expectText('1 véhicule(s) ajouté(s), 0 mis à jour')
  await expectText('Renault Captur')
})

await step('Comparaison de deux véhicules, version imprimable', async () => {
  await go('#/vehicules')
  await page.getByRole('button', { name: 'Comparer des véhicules' }).click()
  await page.getByText('Renault Captur').first().click()
  await page.getByText('Dacia Sandero').first().click()
  await page.getByRole('button', { name: 'Comparer', exact: true }).click()
  await expectText('Comparaison')
  await expectText('Prix affiché')
  await expectText('16 990')
  await shot('20-comparaison')
  await page.getByRole('button', { name: 'Imprimer' }).click()
  await expectText('Comparaison de véhicules')
})

await step('Code d’accès : demandé au rechargement, refusé si faux, puis retiré', async () => {
  await go('#/parametres'); await page.getByRole('button', { name: 'Données' }).click()
  await page.getByRole('button', { name: 'Définir un code' }).click()
  const d = page.getByRole('dialog')
  await d.locator('input').nth(0).fill('4821'); await d.locator('input').nth(1).fill('4821')
  await d.getByRole('button', { name: 'Enregistrer' }).click()
  await expectText('Code d’accès enregistré')
  await page.reload()
  await expectText('Saisissez votre code d’accès')
  if (await page.getByText('Mes trois priorités').count()) throw new Error('contenu visible derrière le verrou')
  await shot('21-verrou')
  await page.getByLabel('Code d’accès').fill('0000'); await page.getByRole('button', { name: 'Déverrouiller' }).click()
  await expectText('Code incorrect')
  await page.getByLabel('Code d’accès').fill('4821'); await page.getByRole('button', { name: 'Déverrouiller' }).click()
  await page.getByRole('heading', { name: 'Paramètres' }).waitFor()
  await page.getByRole('button', { name: 'Données' }).click()
  await page.getByRole('button', { name: 'Modifier ou retirer le code' }).click()
  await page.getByRole('dialog').locator('input').nth(0).fill('4821')
  await page.getByRole('dialog').getByRole('button', { name: 'Retirer le code' }).click()
  await expectText('Code d’accès retiré')
  await page.reload(); await page.getByRole('heading', { name: 'Paramètres' }).waitFor()
})

await step('Import de prospects (CSV) : doublon ignoré, leads créés', async () => {
  await go('#/clients?vue=tous')
  const csv = 'nom;prenom;telephone;email;vehicule recherche;budget\nMartin;Zoé;0696 77 88 99;zoe@example.org;Captur;18000\nDurand;Camille;0696123456;;;\n'
  await page.locator('input[type=file]').setInputFiles({ name: 'leads.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expectText('Import de prospects — vérification')
  await expectText('dont 1 déjà présente')
  await page.getByRole('switch', { name: 'Leads à traiter' }).click()
  await page.getByRole('button', { name: /Importer 1 prospect/ }).click()
  await expectText('1 prospect(s) importé(s), 1 doublon(s) ignoré(s)')
  await go('#/clients?vue=leads'); await expectText('Zoé Martin')
})

await step('Fiche de rendez-vous imprimable et e-mail préparé', async () => {
  await page.getByText('Zoé Martin').first().click()
  await page.getByRole('button', { name: 'Planifier' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Rendez-vous', exact: true }).click()
  await save()
  await page.getByRole('button', { name: /Préparer le rendez-vous/ }).click()
  await expectText('Fiche de rendez-vous')
  await expectText('À demander pendant le rendez-vous')
  await expectText('Renault Captur')
  await shot('22-fiche-rdv')
  await page.getByRole('button', { name: 'Retour' }).click()
  await page.getByRole('button', { name: 'WhatsApp' }).click()
  const href = await page.getByRole('link', { name: /messagerie/ }).getAttribute('href')
  if (!href.startsWith('mailto:zoe@example.org?subject=')) throw new Error('lien e-mail inattendu ' + href)
})

await step('Accueil : rythme nécessaire et bilan du jour', async () => {
  await go('#/')
  await expectText('Rythme nécessaire')
  await expectText('nouveaux prospects')
  await shot('23-accueil-rythme')
})

await step('Démonstration fictive identifiée et supprimable', async () => {
  await go('#/parametres'); await page.getByRole('button', { name: 'Données' }).click()
  await page.getByRole('button', { name: 'Charger des données fictives' }).click()
  await expectText('Démonstration chargée')
  await go('#/'); await expectText('Données de démonstration fictives')
  await shot('14-accueil-demo')
  await page.evaluate(() => document.documentElement.classList.add('dark')); await shot('15-accueil-sombre'); await page.evaluate(() => document.documentElement.classList.remove('dark'))
  await go('#/livraisons'); await expectText('Bloqués'); await shot('16-livraisons-demo')
  await go('#/agenda'); await expectText('Créneaux libres'); await shot('17-agenda')
})

await step('Hors connexion : l’application se recharge et reste modifiable', async () => {
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 15000 })
  await go('#/')
  await ctx.setOffline(true)
  await page.reload()
  await expectText('Mes trois priorités')
  await expectText('Hors ligne')
  await go('#/clients?vue=tous'); await expectText('Camille Durand')
  await ctx.setOffline(false)
})

// Ordinateur
const desk = await browser.newContext({ viewport: { width: 1360, height: 850 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'America/Martinique', storageState: await ctx.storageState({ indexedDB: true }).catch(() => undefined) })
const p2 = await desk.newPage()
await p2.goto(URL); await p2.waitForTimeout(1500)
await p2.screenshot({ path: `${OUT}18-ordinateur.png` })
await browser.close()

const ko = results.filter((r) => r[0] !== 'OK')
console.log(`\n${results.length - ko.length}/${results.length} parcours réussis`)
if (errors.length) console.log('Erreurs console :', [...new Set(errors)].slice(0, 8))
fs.writeFileSync(`${OUT}resultats.json`, JSON.stringify({ results, errors: [...new Set(errors)] }, null, 2))
process.exit(ko.length ? 1 : 0)
