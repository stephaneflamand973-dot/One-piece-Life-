// Parcours métier de bout en bout sur une vraie base IndexedDB (implémentation en mémoire pour les tests).
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, getSettings, saveSettings } from '../src/lib/db'
import { addDays, atTime, today } from '../src/lib/dates'
import { addInteraction, createSale, deleteClient, markQuoteSent, newQuoteDraft, saveClient, saveIntervention, saveQuote, saveTask, saveVehicle, setDocument, setStep, updateSale } from '../src/services/actions'
import { loadCtx, runAutomations } from '../src/services/automations'
import { exportBackup, restoreBackup, validateBackup, wipeAll, wipeDemo } from '../src/services/backup'
import { clientView, computePriorities, monthMoney, prepState, quoteTotals } from '../src/services/logic'
import { loadDemo } from '../src/services/demo'
import { answer } from '../src/services/assistant'
import { search } from '../src/services/search'
import { vehiclesFromCsv } from '../src/services/csv'

beforeEach(async () => {
  await wipeAll(false)
})

describe('Parcours 1 — nouveau prospect', () => {
  it('crée, détecte l’absence de prochaine action, puis affiche la relance à l’échéance', async () => {
    const c = await saveClient({ nom: 'Durand', tel: '0696111111', recherche: { modele: 'Clio', boite: 'Automatique', budgetMax: 15000 } })
    expect(c.ref).toBe('C-0001')
    expect(clientView('sans_action', await loadCtx()).map((x) => x.id)).toContain(c.id)
    await saveTask({ type: 'relance', titre: 'Rappeler', clientId: c.id, due: atTime(today(), '00:01') })
    const ctx = await loadCtx()
    expect(clientView('sans_action', ctx)).toHaveLength(0)
    const p = computePriorities(ctx)
    expect(p[0]).toMatchObject({ kind: 'task', clientId: c.id })
  })
  it('refuse une fiche vide et détecte un doublon par téléphone', async () => {
    await expect(saveClient({ nom: '  ' })).rejects.toThrow()
    await saveClient({ nom: 'A', tel: '0696 22 22 22' })
    const { findDuplicateClient } = await import('../src/services/actions')
    expect((await findDuplicateClient('+596696222222'))?.nom).toBe('A')
  })
  it('modifie puis supprime une fiche et ses dépendances', async () => {
    const c = await saveClient({ nom: 'Martin', tel: '0696333333' })
    await saveClient({ id: c.id, prenom: 'Zoé', statut: 'qualifie' })
    expect((await db.clients.get(c.id))!.prenom).toBe('Zoé')
    expect(await db.interactions.where('clientId').equals(c.id).count()).toBe(1) // historique du changement de statut
    await saveTask({ titre: 'x', clientId: c.id })
    await deleteClient(c.id)
    expect(await db.clients.count()).toBe(0)
    expect(await db.tasks.count()).toBe(0)
    expect(await db.interactions.count()).toBe(0)
  })
})

describe('Lead UpYourLeads (saisi à la main)', () => {
  it('crée la tâche de premier contact une seule fois et la solde au premier appel', async () => {
    const c = await saveClient({ nom: 'Lead', tel: '0696444444' }, { lead: true })
    await runAutomations()
    await runAutomations()
    expect(await db.tasks.where('autoKey').equals(`lead:${c.id}`).count()).toBe(1)
    await addInteraction({ clientId: c.id, type: 'appel_sortant', resultat: 'Sans réponse' })
    const after = (await db.clients.get(c.id))!
    expect(after.leadTraiteLe).toBeTruthy()
    expect(after.statut).toBe('injoignable')
    expect((await db.tasks.where('autoKey').equals(`lead:${c.id}`).first())!.statut).toBe('faite')
  })
})

describe('Parcours 2 — devis', () => {
  it('préremplit frais et carte grise, enregistre l’envoi et crée la relance sans doublon', async () => {
    const c = await saveClient({ nom: 'Devis', tel: '0696555555' })
    const { vehicle } = await saveVehicle({ marque: 'Renault', modele: 'Clio', prix: 14490, cvFiscaux: 5 })
    const draft = await newQuoteDraft(c.id, vehicle)
    expect(draft.fraisDossier).toBe(200)
    expect(draft.carteGrise).toBe(278.76)
    expect(quoteTotals(draft).total).toBe(14968.76)
    const q = await saveQuote(draft)
    await markQuoteSent(q.id)
    await runAutomations(); await runAutomations()
    expect((await db.clients.get(c.id))!.statut).toBe('devis')
    const rel = await db.tasks.where('autoKey').equals(`devis:${q.id}`).toArray()
    expect(rel).toHaveLength(1)
    expect(rel[0].due!.slice(0, 10) >= addDays(today(), 2)).toBe(true)
  })
})

describe('Parcours 3 et 4 — vente, préparation, blocage, livraison', () => {
  it('va de la vente à « prêt à livrer » puis « livré »', async () => {
    await saveSettings((s) => { s.commission.regles = [{ id: 'r', label: 'Base', type: 'par_vente', montant: 150, actif: true }] })
    const c = await saveClient({ nom: 'Acheteur', tel: '0696666666' })
    const { vehicle } = await saveVehicle({ marque: 'Renault', modele: 'Captur', prix: 16990 })
    const sale = await createSale({ clientId: c.id, vehicleId: vehicle.id, vehiculeLabel: 'Renault Captur', prixVente: 16990, remise: 0, reprise: 0, financementType: 'Comptant', dateBC: today(), dateConfirmation: today(), livraisonPrevue: atTime(addDays(today(), 10), '14:00'), statut: 'confirmee' })
    // une seule saisie : commission, checklist, documents, tâche de livraison, statuts liés
    expect(sale.commission.estime).toBe(150)
    expect(sale.steps.length).toBe(9)
    expect(sale.steps.find((x) => x.id === 'ct')!.commentaire).toContain('non renseignée')
    expect((await db.vehicles.get(vehicle.id))!.statut).toBe('preparation')
    expect((await db.clients.get(c.id))!.statut).toBe('vendu')
    expect(await db.tasks.where('autoKey').equals(`livraison:${sale.id}`).count()).toBe(1)
    await expect(createSale({ clientId: c.id, vehicleId: vehicle.id, vehiculeLabel: 'x', prixVente: 1, remise: 0, reprise: 0, financementType: '', statut: 'confirmee' })).rejects.toThrow(/deux fois/)
    expect(monthMoney(await db.sales.toArray(), today().slice(0, 7), await getSettings()).ventes).toBe(1)

    // blocage
    const it1 = await saveIntervention({ saleId: sale.id, stepId: 'pneus', type: 'Pneus', statut: 'bloquee', commentaire: 'Pneus commandés' })
    await runAutomations(); await runAutomations()
    let ctx = await loadCtx()
    let st = prepState(ctx.sales[0], ctx.interventions, ctx.settings)
    expect(st.etat).toBe('bloque')
    expect(st.bloquees[0].label).toBe('Pneus')
    expect(computePriorities(ctx)[0]).toMatchObject({ kind: 'blocage', saleId: sale.id })
    expect(await db.alerts.where('ruleId').equals('intervention_bloquee').count()).toBe(1)
    expect(answer('Quelles sont mes livraisons bloquées ?', ctx).lignes[0].detail).toContain('Pneus')

    // déblocage puis validation de toutes les étapes obligatoires
    await saveIntervention({ ...it1, statut: 'terminee' })
    expect((await db.sales.get(sale.id))!.statut).toBe('preparation')
    for (const step of sale.steps.filter((x) => x.obligatoire && x.id !== 'pneus')) await setStep(sale.id, step.id, { statut: step.id === 'carrosserie' ? 'non_necessaire' : 'terminee' })
    const pret = (await db.sales.get(sale.id))!
    expect(pret.statut).toBe('pret')
    expect(pret.paiement).toBe('recu')
    // revenir en arrière sur une étape fait repasser le dossier en préparation
    await setStep(sale.id, 'nettoyage', { statut: 'en_cours' })
    expect((await db.sales.get(sale.id))!.statut).toBe('preparation')
    await setStep(sale.id, 'nettoyage', { statut: 'terminee' })
    await setDocument(sale.id, pret.documents[0].id, 'recu')

    await updateSale(sale.id, { statut: 'livre' })
    const livre = (await db.sales.get(sale.id))!
    expect(livre.livraisonEffective).toBe(today())
    expect((await db.vehicles.get(vehicle.id))!.statut).toBe('vendu')
    expect((await db.clients.get(c.id))!.statut).toBe('livre')
    await runAutomations(); await runAutomations()
    expect(await db.tasks.filter((t) => !!t.autoKey?.startsWith(`suivi:${sale.id}`)).count()).toBe(2)
    ctx = await loadCtx()
    st = prepState(ctx.sales[0], ctx.interventions, ctx.settings)
    expect(st.etat).toBe('livre')
  })
})

describe('Parcours 5 — nouvel arrivage', () => {
  it('suggère les prospects compatibles avec leurs raisons, sans doublon de référence à l’import', async () => {
    const c = await saveClient({ nom: 'Cherche Clio', tel: '0696777777', recherche: { modele: 'Clio', boite: 'Automatique', budgetMax: 15000 } })
    await saveTask({ titre: 'suivi', clientId: c.id })
    const imp = vehiclesFromCsv('ref;marque;modele;boite;prix\nR1;Renault;Clio;Automatique;14490\nR2;Dacia;Sandero;Manuelle;9990')
    for (const v of imp.vehicles) await saveVehicle(v, { origine: 'import' })
    const again = await saveVehicle({ ...imp.vehicles[0], prix: 13990 }, { origine: 'import' })
    expect(again.created).toBe(false)
    expect(await db.vehicles.count()).toBe(2)
    expect((await db.vehicles.where('ref').equals('R1').first())!.prix).toBe(13990)
    await runAutomations(); await runAutomations()
    const al = await db.alerts.where('ruleId').equals('arrivage').toArray()
    expect(al).toHaveLength(1)
    expect(al[0].detail).toContain('Cherche Clio')
    const ctx = await loadCtx()
    expect(answer('Trouve les prospects correspondant à cette Clio automatique', ctx).lignes[0].texte).toContain('Cherche Clio')
    expect(search('clio', { ...ctx, notes: [] }).map((h) => h.type).sort()).toEqual(['Client', 'Tâche', 'Véhicule'].sort())
  })
})

describe('Sauvegarde, restauration, démonstration', () => {
  it('exporte puis restaure à l’identique', async () => {
    await loadDemo()
    const b = JSON.parse(JSON.stringify(await exportBackup()))
    const n = { c: await db.clients.count(), v: await db.vehicles.count(), t: await db.tasks.count(), s: await db.sales.count() }
    expect(n.c).toBe(6)
    await wipeAll(false)
    expect(await db.clients.count()).toBe(0)
    await restoreBackup(validateBackup(b).backup)
    expect({ c: await db.clients.count(), v: await db.vehicles.count(), t: await db.tasks.count(), s: await db.sales.count() }).toEqual(n)
  })
  it('supprime les données de démonstration sans toucher aux vraies', async () => {
    const vrai = await saveClient({ nom: 'Vrai client', tel: '0696888888' })
    await loadDemo()
    await wipeDemo()
    expect((await db.clients.toArray()).map((c) => c.id)).toEqual([vrai.id])
    expect(await db.vehicles.count()).toBe(0)
    expect(await db.sales.count()).toBe(0)
    expect(await db.tasks.count()).toBe(0)
  })
})

describe('Régression', () => {
  it('modifie un seul champ d’une fiche existante sans exiger de ressaisir le nom', async () => {
    const c = await saveClient({ nom: 'Partiel', tel: '0696999999' })
    await saveClient({ id: c.id, usage: 'Trajets quotidiens' })
    expect((await db.clients.get(c.id))!.usage).toBe('Trajets quotidiens')
    await expect(saveClient({ id: c.id, nom: '', tel: '' })).rejects.toThrow()
  })
})
