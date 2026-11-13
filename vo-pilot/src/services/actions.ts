// Écritures métier : chaque fonction modifie les vraies données persistantes (IndexedDB),
// journalise la modification et relance les automatisations.
import { audit, db, emitChange, getSettings, nextRef, saveSettings, uid } from '../lib/db'
import type {
  Client, Interaction, InteractionType, Intervention, Note, Photo, PrepStep, Quote, Sale, SaleStatus, StepStatus, Task, Vehicle,
} from '../lib/types'
import { addDays, atTime, dayKey, nowIso, today } from '../lib/dates'
import { carteGrise, ctAVerifier, estimateCommission, isConfirmed, prepState, stageLabel, vehicleLabel } from './logic'

const strip = <T extends object>(o: T): T => {
  const r = { ...o } as Record<string, unknown>
  for (const k of Object.keys(r)) if (r[k] === '' || r[k] === undefined || (typeof r[k] === 'number' && Number.isNaN(r[k]))) delete r[k]
  return r as T
}

// ---------- Clients ----------
export const emptyClient = (): Partial<Client> => ({
  nom: '', statut: 'nouveau', recherche: {}, importance: 2,
  consentement: { tel: true, whatsapp: true, email: true, nePasContacter: false },
})

export async function findDuplicateClient(tel?: string, email?: string, exceptId?: string): Promise<Client | undefined> {
  const t = (tel ?? '').replace(/\D/g, '').slice(-9)
  const all = await db.clients.toArray()
  return all.find((c) => c.id !== exceptId && ((t.length >= 6 && (c.tel ?? '').replace(/\D/g, '').endsWith(t)) || (!!email && !!c.email && c.email.toLowerCase() === email.toLowerCase())))
}

export async function saveClient(data: Partial<Client>, opts: { lead?: boolean; demo?: boolean } = {}): Promise<Client> {
  if (!data.nom?.trim() && !data.prenom?.trim() && !data.tel?.trim()) throw new Error('Indiquez au moins un nom ou un moyen de contact.')
  const now = nowIso()
  if (data.id) {
    const prev = await db.clients.get(data.id)
    if (!prev) throw new Error('Fiche introuvable.')
    const next = strip({ ...prev, ...data, updatedAt: now }) as Client
    next.recherche = strip({ ...(data.recherche ?? prev.recherche) })
    await db.clients.put(next)
    if (prev.statut !== next.statut) await logStatus(next.id, prev.statut, next.statut)
    await audit('client', next.id, 'modification', { nom: prev.nom, tel: prev.tel, statut: prev.statut }, { nom: next.nom, tel: next.tel, statut: next.statut })
    emitChange()
    return next
  }
  const c = strip({
    ...emptyClient(), ...data, id: uid(), ref: await nextRef('C'), nom: (data.nom ?? '').trim(),
    premierContact: data.premierContact ?? today(), createdAt: now, updatedAt: now,
    leadRecuLe: opts.lead ? data.leadRecuLe ?? now : data.leadRecuLe, demo: opts.demo,
  }) as Client
  c.recherche = strip({ ...(data.recherche ?? {}) })
  await db.clients.add(c)
  await audit('client', c.id, 'création', undefined, { nom: c.nom, ref: c.ref })
  emitChange()
  return c
}

async function logStatus(clientId: string, de: string, vers: string) {
  const s = await getSettings()
  await db.interactions.add({ id: uid(), clientId, type: 'statut', date: nowIso(), de, vers, commentaire: `${stageLabel(s.pipeline, de)} → ${stageLabel(s.pipeline, vers)}` })
}

export async function setClientStatus(id: string, statut: string, motifPerte?: string) {
  const c = await db.clients.get(id)
  if (!c || c.statut === statut) return
  await db.clients.update(id, { statut, motifPerte: statut === 'perdu' ? motifPerte : undefined, updatedAt: nowIso() })
  await logStatus(id, c.statut, statut)
  await audit('client', id, 'statut', c.statut, statut)
  emitChange()
}

/** Suppression maîtrisée : la fiche et tout ce qui en dépend (sauf si une vente existe). */
export async function deleteClient(id: string) {
  const ventes = await db.sales.where('clientId').equals(id).count()
  if (ventes > 0) throw new Error('Ce client a un dossier de vente : supprimez ou annulez d’abord la vente.')
  await db.transaction('rw', [db.clients, db.interactions, db.tasks, db.quotes, db.notes, db.audit], async () => {
    await db.interactions.where('clientId').equals(id).delete()
    await db.tasks.where('clientId').equals(id).delete()
    await db.quotes.where('clientId').equals(id).delete()
    await db.notes.where('linkId').equals(id).delete()
    await db.clients.delete(id)
    await audit('client', id, 'suppression')
  })
  emitChange()
}

export async function markLeadHandled(id: string) {
  await db.clients.update(id, { leadTraiteLe: nowIso(), updatedAt: nowIso() })
  await db.interactions.add({ id: uid(), clientId: id, type: 'lead', date: nowIso(), commentaire: 'Lead marqué traité dans VO PILOT (à reporter aussi dans UpYourLeads)' })
  await db.tasks.where('autoKey').equals(`lead:${id}`).modify((t) => { if (t.statut === 'ouverte') { t.statut = 'faite'; t.doneAt = nowIso() } })
  emitChange()
}

// ---------- Interactions ----------
export async function addInteraction(i: Omit<Interaction, 'id' | 'date'> & { date?: string }): Promise<Interaction> {
  const it: Interaction = strip({ ...i, id: uid(), date: i.date ?? nowIso() })
  await db.interactions.add(it)
  const c = await db.clients.get(i.clientId)
  if (c) {
    const patch: Partial<Client> = { updatedAt: nowIso() }
    // Toute tentative de contact enregistrée vaut premier traitement du lead dans VO PILOT (pas dans UpYourLeads).
    if (c.leadRecuLe && !c.leadTraiteLe && i.type !== 'remarque' && i.type !== 'statut') patch.leadTraiteLe = it.date
    await db.clients.update(c.id, patch)
    if (patch.leadTraiteLe) await db.tasks.where('autoKey').equals(`lead:${c.id}`).modify((t) => { if (t.statut === 'ouverte') { t.statut = 'faite'; t.doneAt = nowIso() } })
    // Avancement automatique du pipeline, uniquement vers l'avant et sur des faits saisis.
    const auto: Partial<Record<InteractionType, string>> = { essai: 'essai', devis: 'devis', negociation: 'negociation' }
    const order = (await getSettings()).pipeline.map((p) => p.id)
    let cible = auto[i.type]
    if (!cible && ['appel_sortant', 'appel_entrant', 'whatsapp', 'email'].includes(i.type)) {
      if (i.resultat === 'Sans réponse') cible = ['nouveau', 'a_contacter'].includes(c.statut) ? 'injoignable' : undefined
      else if (['nouveau', 'a_contacter', 'injoignable'].includes(c.statut)) cible = 'contact'
    }
    if (cible && order.indexOf(cible) > order.indexOf(c.statut) && order.indexOf(c.statut) < order.indexOf('bc')) await setClientStatus(c.id, cible)
  }
  emitChange()
  return it
}

// ---------- Tâches ----------
export async function saveTask(data: Partial<Task> & { titre: string }, demo?: boolean): Promise<Task> {
  if (data.id) {
    const prev = await db.tasks.get(data.id)
    if (!prev) throw new Error('Tâche introuvable.')
    const next = strip({ ...prev, ...data }) as Task
    await db.tasks.put(next)
    emitChange()
    return next
  }
  if (data.autoKey) {
    const ex = await db.tasks.where('autoKey').equals(data.autoKey).first()
    if (ex) return ex
  }
  const t = strip({ type: 'tache', statut: 'ouverte', priorite: 2, ...data, id: uid(), createdAt: nowIso(), demo }) as Task
  await db.tasks.add(t)
  if (t.clientId && t.type === 'rdv') {
    const c = await db.clients.get(t.clientId)
    const order = (await getSettings()).pipeline.map((p) => p.id)
    if (c && order.indexOf(c.statut) < order.indexOf('rdv')) await setClientStatus(c.id, 'rdv')
  }
  emitChange()
  return t
}
export async function completeTask(id: string, resultat?: string) {
  await db.tasks.update(id, { statut: 'faite', doneAt: nowIso(), resultat })
  emitChange()
}
export async function reopenTask(id: string) {
  await db.tasks.update(id, { statut: 'ouverte', doneAt: undefined })
  emitChange()
}
export async function snoozeTask(id: string, days = 1) {
  const t = await db.tasks.get(id)
  if (!t) return
  const base = t.due && dayKey(t.due) > today() ? dayKey(t.due) : today()
  const heure = t.due ? new Intl.DateTimeFormat('en-GB', { timeZone: (await getSettings()).profil.fuseau, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(t.due)) : '09:00'
  await db.tasks.update(id, { due: atTime(addDays(base, days), heure) })
  emitChange()
}
export async function deleteTask(id: string) {
  await db.tasks.delete(id)
  emitChange()
}
export async function snoozePriority(key: string, days = 1) {
  if (key.startsWith('task:')) return snoozeTask(key.slice(5), days)
  await saveSettings((s) => { s.snoozes[key] = atTime(addDays(today(), days), '08:00') })
  emitChange()
}

// ---------- Véhicules ----------
export async function saveVehicle(data: Partial<Vehicle>, opts: { demo?: boolean; origine?: 'utilisateur' | 'import' } = {}): Promise<{ vehicle: Vehicle; created: boolean }> {
  if (!data.marque?.trim() || !data.modele?.trim()) throw new Error('Marque et modèle sont nécessaires.')
  const now = nowIso()
  const ref = (data.ref ?? '').trim()
  let prev = data.id ? await db.vehicles.get(data.id) : undefined
  const sameRef = ref ? await db.vehicles.where('ref').equals(ref).first() : undefined
  if (sameRef && sameRef.id !== prev?.id) {
    if (data.id) throw new Error(`La référence ${ref} est déjà utilisée par un autre véhicule.`)
    prev = sameRef // import ou saisie d'une référence existante : mise à jour, pas de doublon
  }
  if (prev) {
    const next = strip({ ...prev, ...data, id: prev.id, ref: ref || prev.ref, updatedAt: now }) as Vehicle
    await db.vehicles.put(next)
    await audit('vehicule', next.id, 'modification', { prix: prev.prix, statut: prev.statut }, { prix: next.prix, statut: next.statut }, opts.origine)
    emitChange()
    return { vehicle: next, created: false }
  }
  const v = strip({ statut: 'disponible', ...data, id: uid(), ref: ref || (await nextRef('V')), createdAt: now, updatedAt: now, demo: opts.demo }) as Vehicle
  await db.vehicles.add(v)
  await audit('vehicule', v.id, 'création', undefined, { ref: v.ref, label: vehicleLabel(v) }, opts.origine)
  emitChange()
  return { vehicle: v, created: true }
}
export async function deleteVehicle(id: string) {
  if (await db.sales.where('vehicleId').equals(id).count()) throw new Error('Ce véhicule est lié à une vente : il ne peut pas être supprimé.')
  await db.photos.where('vehicleId').equals(id).delete()
  await db.vehicles.delete(id)
  await audit('vehicule', id, 'suppression')
  emitChange()
}
export async function addPhoto(vehicleId: string, data: string, label?: string) {
  const n = await db.photos.where('vehicleId').equals(vehicleId).count()
  const p: Photo = { id: uid(), vehicleId, ordre: n, label, data }
  await db.photos.add(p)
  return p
}
export async function reorderPhotos(ids: string[]) {
  await db.transaction('rw', db.photos, async () => { for (let i = 0; i < ids.length; i++) await db.photos.update(ids[i], { ordre: i }) })
}

// ---------- Devis ----------
export async function newQuoteDraft(clientId: string, v?: Vehicle): Promise<Omit<Quote, 'id' | 'ref'>> {
  const s = await getSettings()
  const cv = v?.cvFiscaux ?? 0
  return {
    clientId, vehicleId: v?.id, vehiculeLabel: v ? `${vehicleLabel(v)}${v.annee ? ` (${v.annee})` : ''}` : '', prix: v?.prix ?? 0,
    fraisDossier: s.tarifs.fraisDossier, cvFiscaux: cv, carteGrise: carteGrise(cv, s.tarifs), remise: 0, reprise: 0, autresFrais: [],
    financement: {}, statut: 'brouillon', dateCreation: nowIso(),
  }
}
export async function saveQuote(q: Partial<Quote> & Omit<Quote, 'id' | 'ref'>, demo?: boolean): Promise<Quote> {
  if (!q.clientId) throw new Error('Choisissez un client.')
  if (!(q.prix > 0)) throw new Error('Indiquez le prix du véhicule.')
  const full = { ...q, id: q.id ?? uid(), ref: q.ref ?? (await nextRef('D')), demo: q.demo ?? demo } as Quote
  await db.quotes.put(full)
  emitChange()
  return full
}
/** Enregistre la date d'envoi déclarée par l'utilisateur (VO PILOT n'envoie rien lui-même). */
export async function markQuoteSent(id: string, date = nowIso()) {
  const q = await db.quotes.get(id)
  if (!q) return
  await db.quotes.update(id, { statut: 'envoye', dateEnvoi: date })
  await addInteraction({ clientId: q.clientId, type: 'devis', date, resultat: 'Devis envoyé', commentaire: `${q.ref} — ${q.vehiculeLabel}` })
  if (q.vehicleId) {
    const c = await db.clients.get(q.clientId)
    if (c && !c.recherche?.modele) { /* rien : on ne modifie pas le besoin du client */ }
  }
  emitChange()
}
export async function setQuoteStatus(id: string, statut: Quote['statut']) {
  await db.quotes.update(id, { statut })
  emitChange()
}
export async function deleteQuote(id: string) {
  await db.quotes.delete(id)
  emitChange()
}

// ---------- Ventes & préparation ----------
export interface SaleInput {
  clientId: string; vehicleId?: string; quoteId?: string; vehiculeLabel: string; prixVente: number; remise: number; reprise: number
  financementType: string; dateBC?: string; dateConfirmation?: string; livraisonPrevue?: string; statut: SaleStatus; notes?: string; paiement?: Sale['paiement']
}

/** Crée le dossier de vente unique : checklist de préparation, documents, commission estimée, tout est généré d'une seule saisie. */
export async function createSale(input: SaleInput, demo?: boolean): Promise<Sale> {
  if (!input.clientId) throw new Error('Choisissez un client.')
  if (!input.vehiculeLabel.trim()) throw new Error('Indiquez le véhicule vendu.')
  if (input.vehicleId) {
    const deja = (await db.sales.where('vehicleId').equals(input.vehicleId).toArray()).find((x) => x.statut !== 'annule')
    if (deja) throw new Error(`Ce véhicule est déjà dans le dossier ${deja.ref} : une vente ne peut pas être comptée deux fois.`)
  }
  const s = await getSettings()
  const v = input.vehicleId ? await db.vehicles.get(input.vehicleId) : undefined
  const ct = ctAVerifier(v, s)
  const steps: PrepStep[] = s.prep.etapes.map((e) => ({
    id: e.id, label: e.label, obligatoire: e.obligatoire, statut: 'a_faire' as StepStatus,
    commentaire: e.id === 'ct' ? ct.raison : undefined,
  }))
  const now = nowIso()
  const sale: Sale = strip({
    ...input, id: uid(), ref: await nextRef('VT'), paiement: input.paiement ?? 'attente',
    commission: estimateCommission(input, s),
    steps, documents: s.prep.documents.map((d) => ({ id: uid(), type: d, statut: 'manquant' as const })),
    createdAt: now, updatedAt: now, demo,
  }) as Sale
  if (sale.commission.estime !== undefined) {
    const base = (sale.dateConfirmation ?? sale.dateBC ?? today()).slice(0, 7)
    const [y, m] = base.split('-').map(Number)
    sale.commission.moisVersement = new Date(Date.UTC(y, m - 1 + s.commission.decalageVersementMois, 1)).toISOString().slice(0, 7)
  }
  await db.sales.add(sale)
  if (input.quoteId) await db.quotes.update(input.quoteId, { statut: 'accepte' })
  if (v) await db.vehicles.update(v.id, { statut: isConfirmed(sale) ? 'preparation' : 'reserve', updatedAt: now })
  await syncClientWithSale(sale)
  await syncDeliveryTask(sale)
  await audit('vente', sale.id, 'création', undefined, { ref: sale.ref, vehicule: sale.vehiculeLabel, prix: sale.prixVente })
  emitChange()
  return sale
}

async function syncClientWithSale(sale: Sale) {
  const map: Partial<Record<SaleStatus, string>> = {
    commande_attente: 'negociation', bc_signe: 'bc', financement_attente: 'bc', paiement_attente: 'bc', confirmee: 'vendu', preparation: 'preparation', pret: 'preparation', livre: 'livre',
  }
  const cible = map[sale.statut]
  if (cible) await setClientStatus(sale.clientId, cible)
}

/** La livraison programmée alimente le planning : une tâche « livraison » unique par vente. */
async function syncDeliveryTask(sale: Sale) {
  const key = `livraison:${sale.id}`
  const ex = await db.tasks.where('autoKey').equals(key).first()
  const done = sale.statut === 'livre' || sale.statut === 'annule'
  if (!sale.livraisonPrevue) { if (ex && ex.statut === 'ouverte') await db.tasks.delete(ex.id); return }
  if (ex) await db.tasks.update(ex.id, { due: sale.livraisonPrevue, titre: `Livraison ${sale.vehiculeLabel}`, statut: done ? (sale.statut === 'livre' ? 'faite' : 'annulee') : 'ouverte', doneAt: done ? nowIso() : undefined })
  else if (!done) await db.tasks.add({ id: uid(), type: 'livraison', titre: `Livraison ${sale.vehiculeLabel}`, clientId: sale.clientId, saleId: sale.id, due: sale.livraisonPrevue, dureeMin: 45, statut: 'ouverte', priorite: 3, autoKey: key, createdAt: nowIso(), demo: sale.demo })
}

export async function updateSale(id: string, patch: Partial<Sale>): Promise<Sale> {
  const prev = await db.sales.get(id)
  if (!prev) throw new Error('Vente introuvable.')
  const s = await getSettings()
  const next = { ...prev, ...patch, updatedAt: nowIso() } as Sale
  // Recalcul de l'estimation si les montants changent (sans écraser un montant confirmé/versé).
  if (['prixVente', 'remise', 'financementType', 'vehiculeLabel'].some((k) => k in patch)) {
    const est = estimateCommission(next, s)
    next.commission = { ...next.commission, estime: est.estime, detail: est.detail }
  }
  if (isConfirmed(next) && !next.dateConfirmation) next.dateConfirmation = today()
  if (next.statut === 'livre' && !next.livraisonEffective) next.livraisonEffective = today()
  // Passage automatique préparation ⇄ prêt selon la checklist (la décision de livrer reste humaine).
  if (['confirmee', 'preparation', 'pret'].includes(next.statut)) {
    const ints = await db.interventions.where('saleId').equals(id).toArray()
    const st = prepState(next, ints, s)
    const commence = next.steps.some((x) => x.statut !== 'a_faire')
    if (st.pret) next.statut = 'pret'
    else if (next.statut === 'pret' || (next.statut === 'confirmee' && commence)) next.statut = 'preparation'
  }
  await db.sales.put(next)
  if (prev.statut !== next.statut) {
    await audit('vente', id, 'statut', prev.statut, next.statut)
    await syncClientWithSale(next)
    if (next.vehicleId) {
      const vs = next.statut === 'annule' ? 'disponible' : next.statut === 'livre' ? 'vendu' : isConfirmed(next) ? 'preparation' : 'reserve'
      await db.vehicles.update(next.vehicleId, { statut: vs, updatedAt: nowIso() })
    }
  }
  await syncDeliveryTask(next)
  emitChange()
  return next
}

export async function setStep(saleId: string, stepId: string, patch: Partial<PrepStep>) {
  const sale = await db.sales.get(saleId)
  if (!sale) return
  const steps = sale.steps.map((x) => (x.id === stepId ? { ...x, ...patch, updatedAt: nowIso() } : x))
  const extra: Partial<Sale> = { steps }
  if (stepId === 'paiement' && patch.statut === 'terminee') extra.paiement = 'recu'
  await audit('vente', saleId, `étape ${stepId}`, sale.steps.find((x) => x.id === stepId)?.statut, patch.statut)
  return updateSale(saleId, extra)
}
export async function setDocument(saleId: string, docId: string, statut: 'manquant' | 'recu' | 'verifie') {
  const sale = await db.sales.get(saleId)
  if (!sale) return
  const documents = sale.documents.map((d) => (d.id === docId ? { ...d, statut, dateReception: statut === 'manquant' ? undefined : d.dateReception ?? today() } : d))
  return updateSale(saleId, { documents })
}
export async function deleteSale(id: string) {
  const sale = await db.sales.get(id)
  if (!sale) return
  await db.interventions.where('saleId').equals(id).delete()
  await db.tasks.where('saleId').equals(id).delete()
  await db.sales.delete(id)
  if (sale.vehicleId) await db.vehicles.update(sale.vehicleId, { statut: 'a_verifier' })
  await audit('vente', id, 'suppression', { ref: sale.ref })
  emitChange()
}

export async function saveIntervention(data: Partial<Intervention> & { saleId: string; type: string }): Promise<Intervention> {
  const it = strip({ statut: 'demandee', dateDemande: today(), ...data, id: data.id ?? uid(), createdAt: data.createdAt ?? nowIso() }) as Intervention
  if (it.statut === 'terminee' && !it.dateReelle) it.dateReelle = today()
  await db.interventions.put(it)
  // L'intervention pilote l'étape de checklist liée : une seule saisie.
  if (it.stepId) {
    const map: Record<Intervention['statut'], StepStatus | null> = { demandee: 'attente_tiers', planifiee: 'attente_tiers', en_cours: 'en_cours', bloquee: 'bloquee', terminee: 'terminee', annulee: null }
    const st = map[it.statut]
    if (st) await setStep(it.saleId, it.stepId, { statut: st, commentaire: it.commentaire, responsable: it.prestataire })
    else await updateSale(it.saleId, {})
  } else await updateSale(it.saleId, {})
  emitChange()
  return it
}
export async function deleteIntervention(id: string) {
  const it = await db.interventions.get(id)
  await db.interventions.delete(id)
  if (it) await updateSale(it.saleId, {})
  emitChange()
}

// ---------- Notes ----------
export async function saveNote(data: Partial<Note> & { texte: string }): Promise<Note> {
  const now = nowIso()
  const n = strip({ ...data, id: data.id ?? uid(), createdAt: data.createdAt ?? now, updatedAt: now }) as Note
  await db.notes.put(n)
  emitChange()
  return n
}
export async function deleteNote(id: string) {
  await db.notes.delete(id)
  emitChange()
}

export async function toggleFavori(table: 'clients' | 'vehicles' | 'sales' | 'tasks', id: string) {
  const row = await db.table(table).get(id)
  if (row) await db.table(table).update(id, { favori: !row.favori })
}
