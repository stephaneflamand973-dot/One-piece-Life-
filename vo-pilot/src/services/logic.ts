// Logique métier pure (sans accès à la base) : calculs, correspondances, priorités, statistiques.
import type {
  Client, Commission, Interaction, Intervention, PipelineStage, PrepStep, Quote, Sale, SaleStatus, Settings, StepStatus, Task, Vehicle,
} from '../lib/types'
import { addDays, addMonths, dayKey, diffDays, monthKey, today } from '../lib/dates'

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
export const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
export const norm = (s?: string) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export const clientName = (c?: Client) => (c ? [c.prenom, c.nom].filter(Boolean).join(' ') || c.ref : 'Client supprimé')
export const vehicleLabel = (v?: Partial<Vehicle>) => (v ? [v.marque, v.modele, v.version].filter(Boolean).join(' ') : '')

// ---------- Devis ----------
/** Règle déclarée (à vérifier avant tout usage officiel) : fixe + CV fiscaux × tarif. */
export function carteGrise(cv: number, t: Settings['tarifs']): number {
  return cv > 0 ? round2(t.cgFixe + cv * t.cgParCv) : 0
}

export interface QuoteTotals { prixRemise: number; frais: number; total: number; apresReprise: number; resteAFinancer: number }
export function quoteTotals(q: Pick<Quote, 'prix' | 'fraisDossier' | 'carteGrise' | 'remise' | 'reprise' | 'autresFrais' | 'financement'>): QuoteTotals {
  const autres = (q.autresFrais ?? []).reduce((s, f) => s + num(f.montant), 0)
  const prixRemise = round2(num(q.prix) - num(q.remise))
  const frais = round2(num(q.fraisDossier) + num(q.carteGrise) + autres)
  const total = round2(prixRemise + frais)
  const apresReprise = round2(total - num(q.reprise))
  const resteAFinancer = round2(Math.max(0, apresReprise - num(q.financement?.apport)))
  return { prixRemise, frais, total, apresReprise, resteAFinancer }
}

/** Mensualité INDICATIVE (formule d'amortissement classique) — jamais une offre de crédit. */
export function mensualiteIndicative(capital: number, tauxAnnuelPct: number, dureeMois: number): number | null {
  if (!(capital > 0) || !(dureeMois > 0)) return null
  const r = tauxAnnuelPct / 100 / 12
  if (!(r > 0)) return round2(capital / dureeMois)
  return round2((capital * r) / (1 - Math.pow(1 + r, -dureeMois)))
}

// ---------- Correspondance véhicule ↔ prospect ----------
export interface Match { score: number; raisons: string[]; ecarts: string[] }

export function matchVehicle(c: Client, v: Vehicle): Match | null {
  const r = c.recherche ?? {}
  const raisons: string[] = []
  const ecarts: string[] = []
  let score = 0
  let criteres = 0
  const txt = norm(`${v.marque} ${v.modele} ${v.version ?? ''} ${v.categorie ?? ''}`)

  if (r.marque) { criteres++; if (norm(v.marque) === norm(r.marque)) { score += 2; raisons.push(`Marque ${v.marque}`) } else ecarts.push(`Marque recherchée : ${r.marque}`) }
  if (r.modele) {
    criteres++
    if (norm(v.modele).includes(norm(r.modele)) || norm(r.modele).includes(norm(v.modele))) { score += 4; raisons.push(`Modèle ${v.modele}`) } else ecarts.push(`Modèle recherché : ${r.modele}`)
  }
  if (r.categorie) { criteres++; if (norm(v.categorie) === norm(r.categorie)) { score += 2; raisons.push(`Catégorie ${v.categorie}`) } else ecarts.push(`Catégorie recherchée : ${r.categorie}`) }
  if (r.budgetMax) {
    criteres++
    if (v.prix === undefined) ecarts.push('Prix non renseigné sur la fiche')
    else if (v.prix <= r.budgetMax) { score += 3; raisons.push(`Prix ${v.prix} € ≤ budget ${r.budgetMax} €`) }
    else if (v.prix <= r.budgetMax * 1.07) { score += 1; ecarts.push(`Prix ${v.prix} € légèrement au-dessus du budget ${r.budgetMax} €`) }
    else return null
  }
  if (r.boite) { criteres++; if (!v.boite) ecarts.push('Boîte non renseignée'); else if (norm(v.boite) === norm(r.boite)) { score += 3; raisons.push(`Boîte ${v.boite.toLowerCase()}`) } else return null }
  if (r.carburant) { criteres++; if (!v.carburant) ecarts.push('Carburant non renseigné'); else if (norm(v.carburant) === norm(r.carburant)) { score += 2; raisons.push(v.carburant) } else ecarts.push(`Carburant recherché : ${r.carburant}`) }
  if (r.kmMax) { criteres++; if (v.km === undefined) ecarts.push('Kilométrage non renseigné'); else if (v.km <= r.kmMax) { score += 1; raisons.push(`${v.km} km ≤ ${r.kmMax} km`) } else ecarts.push(`${v.km} km > ${r.kmMax} km souhaités`) }
  if (r.anneeMin) { criteres++; if (v.annee === undefined) ecarts.push('Année non renseignée'); else if (v.annee >= r.anneeMin) { score += 1; raisons.push(`Année ${v.annee} ≥ ${r.anneeMin}`) } else ecarts.push(`Année ${v.annee} < ${r.anneeMin}`) }
  if (r.equipements) {
    const eq = norm(v.equipements)
    for (const e of r.equipements.split(/[,;]/).map(norm).filter(Boolean)) {
      if (eq.includes(e)) { score += 1; raisons.push(`Équipement : ${e}`) } else ecarts.push(`Équipement non listé : ${e}`)
    }
  }
  // Recherche en texte libre : chaque mot retrouvé dans marque/modèle/version compte.
  if (r.texte && !r.modele && !r.marque) {
    const mots = norm(r.texte).split(/\s+/).filter((m) => m.length > 2)
    const trouves = mots.filter((m) => txt.includes(m))
    if (mots.length) { criteres++; if (trouves.length) { score += 2 * trouves.length; raisons.push(`Recherche « ${r.texte} »`) } }
  }
  if (criteres === 0 || raisons.length === 0) return null
  // Il faut au moins un critère d'identité (marque, modèle, catégorie ou texte) OU deux critères satisfaits.
  if (score < 3) return null
  return { score, raisons, ecarts }
}

export const isActiveStage = (pipeline: PipelineStage[], id: string) => pipeline.find((p) => p.id === id)?.kind === 'actif'
export const stageLabel = (pipeline: PipelineStage[], id: string) => pipeline.find((p) => p.id === id)?.label ?? id

export function vehiclesForClient(c: Client, vehicles: Vehicle[]) {
  return vehicles
    .filter((v) => v.statut === 'disponible' || v.statut === 'a_verifier')
    .map((v) => ({ vehicle: v, match: matchVehicle(c, v) }))
    .filter((x): x is { vehicle: Vehicle; match: Match } => !!x.match)
    .sort((a, b) => b.match.score - a.match.score)
}
export function clientsForVehicle(v: Vehicle, clients: Client[], pipeline: PipelineStage[]) {
  return clients
    .filter((c) => {
      const kind = pipeline.find((p) => p.id === c.statut)?.kind
      return (kind === 'actif' || kind === 'dormant') && !c.consentement?.nePasContacter
    })
    .map((c) => ({ client: c, match: matchVehicle(c, v) }))
    .filter((x): x is { client: Client; match: Match } => !!x.match)
    .sort((a, b) => b.match.score - a.match.score)
}

// ---------- Préparation ----------
export const STEP_LABEL: Record<StepStatus, string> = {
  non_necessaire: 'Non nécessaire', a_faire: 'À faire', en_cours: 'En cours', attente_tiers: 'En attente d’un tiers', terminee: 'Terminée', bloquee: 'Bloquée',
}
export const stepDone = (s: PrepStep) => s.statut === 'terminee' || s.statut === 'non_necessaire'

export interface PrepState {
  total: number; faits: number; bloquees: PrepStep[]; manquantes: PrepStep[]; pret: boolean
  retard: boolean; joursAvantLivraison: number | null; etat: 'bloque' | 'retard' | 'risque' | 'en_cours' | 'pret' | 'livre'
  interventionsBloquees: Intervention[]; documentsManquants: string[]
}
export function prepState(sale: Sale, interventions: Intervention[], s: Settings): PrepState {
  const oblig = sale.steps.filter((x) => x.obligatoire)
  const manquantes = oblig.filter((x) => !stepDone(x))
  const bloquees = sale.steps.filter((x) => x.statut === 'bloquee')
  const ints = interventions.filter((i) => i.saleId === sale.id)
  const interventionsBloquees = ints.filter((i) => i.statut === 'bloquee')
  const documentsManquants = sale.documents.filter((d) => d.statut === 'manquant').map((d) => d.type)
  const jours = sale.livraisonPrevue ? diffDays(dayKey(sale.livraisonPrevue), today()) : null
  const pret = oblig.length > 0 && manquantes.length === 0 && interventionsBloquees.length === 0
  const retard = jours !== null && jours < 0 && sale.statut !== 'livre'
  let etat: PrepState['etat'] = 'en_cours'
  if (sale.statut === 'livre') etat = 'livre'
  else if (bloquees.length || interventionsBloquees.length) etat = 'bloque'
  else if (retard) etat = 'retard'
  else if (pret) etat = 'pret'
  else if (jours !== null && jours <= s.delais.alerteLivraisonJours) etat = 'risque'
  return { total: oblig.length, faits: oblig.length - manquantes.length, bloquees, manquantes, pret, retard, joursAvantLivraison: jours, etat, interventionsBloquees, documentsManquants }
}

/** Le contrôle technique doit-il être vérifié ? Règle déclarée et configurable (ctMaxMois). */
export function ctAVerifier(v: Vehicle | undefined, s: Settings, ref = today()): { aVerifier: boolean; raison: string } {
  if (!v?.dernierCT) return { aVerifier: true, raison: 'Date du dernier contrôle technique non renseignée' }
  const limite = dayKey(new Date(`${addMonths(v.dernierCT.slice(0, 7), s.delais.ctMaxMois)}-${v.dernierCT.slice(8, 10)}T12:00:00Z`))
  const depasse = !limite || limite <= ref
  return depasse
    ? { aVerifier: true, raison: `Dernier CT du ${v.dernierCT} : plus de ${s.delais.ctMaxMois} mois` }
    : { aVerifier: false, raison: `Dernier CT du ${v.dernierCT} : moins de ${s.delais.ctMaxMois} mois (à confirmer)` }
}

// ---------- Ventes & statistiques ----------
export const SALE_STATUS: Record<SaleStatus, string> = {
  commande_attente: 'Commande en attente', bc_signe: 'Bon de commande signé', financement_attente: 'Financement en attente',
  paiement_attente: 'Paiement en attente', confirmee: 'Vente confirmée', preparation: 'Préparation en cours', pret: 'Prêt à livrer', livre: 'Livré', annule: 'Annulé',
}
export const SALE_ORDER: SaleStatus[] = ['commande_attente', 'bc_signe', 'financement_attente', 'paiement_attente', 'confirmee', 'preparation', 'pret', 'livre', 'annule']
const CONFIRMED: SaleStatus[] = ['confirmee', 'preparation', 'pret', 'livre']
export const isConfirmed = (s: Sale) => CONFIRMED.includes(s.statut)

/** Mois de comptabilisation d'une vente selon la définition choisie dans les paramètres. Une vente n'est comptée qu'une fois. */
export function saleMonth(sale: Sale, s: Settings): string | null {
  if (sale.statut === 'annule') return null
  const mode = s.commission.venteCompteeA
  if (mode === 'bc') return sale.dateBC ? sale.dateBC.slice(0, 7) : null
  if (mode === 'livraison') return sale.livraisonEffective ? sale.livraisonEffective.slice(0, 7) : null
  if (!isConfirmed(sale)) return null
  const d = sale.dateConfirmation ?? sale.dateBC
  return d ? d.slice(0, 7) : null
}
export const salesOfMonth = (sales: Sale[], month: string, s: Settings) => sales.filter((x) => saleMonth(x, s) === month)
export const VENTE_DEF: Record<Settings['commission']['venteCompteeA'], string> = {
  bc: 'à la date du bon de commande', confirmation: 'à la date de confirmation de la vente', livraison: 'à la date de livraison effective',
}

// ---------- Commissions ----------
export const hasBareme = (s: Settings) => s.commission.regles.some((r) => r.actif)

export function estimateCommission(sale: Pick<Sale, 'prixVente' | 'remise' | 'financementType' | 'vehiculeLabel'>, s: Settings): Commission {
  const regles = s.commission.regles.filter((r) => r.actif)
  if (!regles.length) return { estime: undefined, detail: ['Barème non renseigné : aucune estimation'] }
  let total = 0
  const detail: string[] = []
  for (const r of regles) {
    if (r.conditionFinancement && norm(r.conditionFinancement) !== norm(sale.financementType)) continue
    if (r.conditionModele && !norm(sale.vehiculeLabel).includes(norm(r.conditionModele))) continue
    if (r.prixMin !== undefined && r.prixMin > 0 && sale.prixVente < r.prixMin) continue
    if (r.prixMax !== undefined && r.prixMax > 0 && sale.prixVente > r.prixMax) continue
    const m = r.type === 'pourcent_prix' ? round2((sale.prixVente * r.montant) / 100) : r.montant
    total += m
    detail.push(`${r.label} : +${m} €`)
  }
  const rem = s.commission.remise
  if (rem.actif && sale.remise >= rem.seuil && rem.seuil > 0) {
    total -= rem.penalite
    detail.push(`Remise ≥ ${rem.seuil} € : −${rem.penalite} €`)
  }
  return { estime: round2(Math.max(0, total)), detail }
}

export function palierBonus(nbVentes: number, s: Settings): number {
  const ok = s.commission.paliers.filter((p) => nbVentes >= p.ventesMin).sort((a, b) => b.ventesMin - a.ventesMin)[0]
  return ok ? ok.bonus : 0
}

export interface MonthMoney { ventes: number; estime: number | null; bonus: number; confirme: number; verse: number; enAttente: number | null; brutEstime: number | null }
export function monthMoney(sales: Sale[], month: string, s: Settings): MonthMoney {
  const list = salesOfMonth(sales, month, s)
  const bareme = hasBareme(s)
  const estime = bareme ? round2(list.reduce((t, x) => t + (x.commission.confirme ?? x.commission.estime ?? 0), 0)) : null
  const bonus = palierBonus(list.length, s)
  const confirme = round2(list.reduce((t, x) => t + (x.commission.confirme ?? 0), 0))
  const verse = round2(list.reduce((t, x) => t + (x.commission.verse ?? 0), 0))
  return {
    ventes: list.length, estime, bonus, confirme, verse,
    enAttente: estime === null ? null : round2(Math.max(0, estime + bonus - verse)),
    brutEstime: estime === null ? null : round2(s.commission.fixeBrut + estime + bonus),
  }
}

/** Commission moyenne par vente d'après les règles sans condition (base de simulation). */
export function commissionParVenteBase(s: Settings, prixMoyen: number): number | null {
  if (!hasBareme(s)) return null
  return estimateCommission({ prixVente: prixMoyen, remise: 0, financementType: '', vehiculeLabel: '' }, s).estime ?? null
}
export function simulate(nb: number, s: Settings, prixMoyen: number, parVente?: number | null) {
  const base = parVente ?? commissionParVenteBase(s, prixMoyen)
  if (base === null) return null
  return round2(s.commission.fixeBrut + nb * base + palierBonus(nb, s))
}

// ---------- Vues « prospects oubliés » ----------
export interface Ctx {
  clients: Client[]; tasks: Task[]; interactions: Interaction[]; quotes: Quote[]; sales: Sale[]
  interventions: Intervention[]; vehicles: Vehicle[]; settings: Settings; now?: number
}
export const openTasks = (tasks: Task[]) => tasks.filter((t) => t.statut === 'ouverte')
export function nextTask(clientId: string, tasks: Task[]): Task | undefined {
  return openTasks(tasks).filter((t) => t.clientId === clientId).sort((a, b) => (a.due ?? '9').localeCompare(b.due ?? '9'))[0]
}
export function lastInteraction(clientId: string, interactions: Interaction[]): Interaction | undefined {
  return interactions.filter((i) => i.clientId === clientId && i.type !== 'statut').sort((a, b) => b.date.localeCompare(a.date))[0]
}
export const isOverdue = (t: Task, now = Date.now()) => t.statut === 'ouverte' && !!t.due && new Date(t.due).getTime() < now
export const isToday = (t: Task) => !!t.due && dayKey(t.due) === today()

export type ViewId = 'tous' | 'actifs' | 'leads' | 'sans_action' | 'aujourdhui' | 'retard' | 'devis' | 'inactifs' | 'reactiver' | 'livres' | 'perdus' | 'favoris'
export function clientView(view: ViewId, ctx: Ctx): Client[] {
  const { clients, tasks, interactions, quotes, settings: s } = ctx
  const now = ctx.now ?? Date.now()
  const active = (c: Client) => isActiveStage(s.pipeline, c.statut)
  switch (view) {
    case 'tous': return clients
    case 'actifs': return clients.filter(active)
    case 'favoris': return clients.filter((c) => c.favori)
    case 'leads': return clients.filter((c) => c.leadRecuLe && !c.leadTraiteLe)
    case 'sans_action': return clients.filter((c) => active(c) && !nextTask(c.id, tasks))
    case 'aujourdhui': return clients.filter((c) => openTasks(tasks).some((t) => t.clientId === c.id && isToday(t)))
    case 'retard': return clients.filter((c) => openTasks(tasks).some((t) => t.clientId === c.id && isOverdue(t, now) && !isToday(t)))
    case 'devis': return clients.filter((c) => quotes.some((q) => q.clientId === c.id && q.statut === 'envoye'))
    case 'inactifs': return clients.filter((c) => {
      if (!active(c)) return false
      const li = lastInteraction(c.id, interactions)
      const ref = dayKey(li?.date ?? c.createdAt)
      return diffDays(today(), ref) >= s.delais.sansInteractionJours
    })
    case 'reactiver': return clients.filter((c) => s.pipeline.find((p) => p.id === c.statut)?.kind === 'dormant')
    case 'livres': return clients.filter((c) => c.statut === 'livre')
    case 'perdus': return clients.filter((c) => c.statut === 'perdu')
  }
}

// ---------- Leads ----------
export function leadDeadline(c: Client, s: Settings): string | null {
  return c.leadRecuLe ? new Date(new Date(c.leadRecuLe).getTime() + s.delais.leadMinutes * 60e3).toISOString() : null
}
export function leadUrgency(c: Client, s: Settings, now = Date.now()): 'traite' | 'ok' | 'urgent' | 'souffrance' | null {
  if (!c.leadRecuLe) return null
  if (c.leadTraiteLe) return 'traite'
  const reste = new Date(leadDeadline(c, s)!).getTime() - now
  return reste < 0 ? 'souffrance' : reste < (s.delais.leadMinutes * 60e3) / 4 ? 'urgent' : 'ok'
}

// ---------- Priorités du tableau de bord ----------
export interface Priority {
  key: string; score: number; titre: string; action: string; raison: string; echeance?: string
  niveau: 'critique' | 'urgent' | 'normal'
  kind: 'lead' | 'task' | 'blocage' | 'livraison' | 'devis' | 'sans_action'
  clientId?: string; saleId?: string; taskId?: string; quoteId?: string
}

export function computePriorities(ctx: Ctx): Priority[] {
  const { clients, tasks, quotes, sales, interventions, settings: s } = ctx
  const now = ctx.now ?? Date.now()
  const out: Priority[] = []
  const byId = new Map(clients.map((c) => [c.id, c]))
  const imp = (c?: Client) => ((c?.importance ?? 2) - 2) * 6

  for (const c of clients) {
    const u = leadUrgency(c, s, now)
    if (u && u !== 'traite') {
      const dl = leadDeadline(c, s)!
      out.push({
        key: `lead:${c.id}`, kind: 'lead', clientId: c.id, echeance: dl,
        score: (u === 'souffrance' ? 120 : u === 'urgent' ? 110 : 95) + imp(c),
        niveau: u === 'ok' ? 'urgent' : 'critique', titre: clientName(c), action: 'Traiter le lead (premier contact)',
        raison: u === 'souffrance' ? `Délai de prise en charge de ${s.delais.leadMinutes} min dépassé` : `Lead reçu, à traiter avant l’échéance (${s.delais.leadMinutes} min)`,
      })
    }
  }

  for (const sale of sales) {
    if (sale.statut === 'livre' || sale.statut === 'annule') continue
    const st = prepState(sale, interventions, s)
    const c = byId.get(sale.clientId)
    if (st.etat === 'bloque') {
      const quoi = [...st.bloquees.map((b) => b.label), ...st.interventionsBloquees.map((i) => `intervention ${i.type}`)].join(', ')
      out.push({
        key: `blocage:${sale.id}`, kind: 'blocage', saleId: sale.id, clientId: sale.clientId, echeance: sale.livraisonPrevue,
        score: 100 + (st.joursAvantLivraison !== null ? Math.max(0, 10 - st.joursAvantLivraison) : 0), niveau: 'critique',
        titre: `${sale.vehiculeLabel} — ${clientName(c)}`, action: sale.prochaineAction || 'Débloquer la préparation',
        raison: `Bloqué : ${quoi}`,
      })
    } else if (st.manquantes.length && st.joursAvantLivraison !== null && st.joursAvantLivraison <= s.delais.alerteLivraisonJours) {
      out.push({
        key: `livraison:${sale.id}`, kind: 'livraison', saleId: sale.id, clientId: sale.clientId, echeance: sale.livraisonPrevue,
        score: 88 + Math.max(0, 5 - st.joursAvantLivraison), niveau: st.joursAvantLivraison < 0 ? 'critique' : 'urgent',
        titre: `${sale.vehiculeLabel} — ${clientName(c)}`, action: 'Vérifier la préparation avant livraison',
        raison: `${st.joursAvantLivraison < 0 ? 'Livraison prévue dépassée' : `Livraison dans ${st.joursAvantLivraison} j`} · reste : ${st.manquantes.map((m) => m.label).join(', ')}`,
      })
    }
  }

  const TYPE_W: Record<string, number> = { rdv: 14, essai: 14, livraison: 14, appel: 8, relance: 8, whatsapp: 6, intervention: 6, tache: 2 }
  const VERBE: Record<string, string> = { rdv: 'Rendez-vous', essai: 'Essai', livraison: 'Livraison', appel: 'Appeler', relance: 'Relancer', whatsapp: 'Message WhatsApp', intervention: 'Suivre l’intervention', tache: 'Tâche' }
  for (const t of openTasks(tasks)) {
    if (!t.due) continue
    const c = t.clientId ? byId.get(t.clientId) : undefined
    const overdue = new Date(t.due).getTime() < now
    const todayTask = isToday(t)
    if (!overdue && !todayTask) continue
    const lateDays = Math.max(0, diffDays(today(), dayKey(t.due)))
    out.push({
      key: `task:${t.id}`, kind: 'task', taskId: t.id, clientId: t.clientId, saleId: t.saleId, echeance: t.due,
      score: (overdue ? 62 : 50) + Math.min(15, lateDays * 3) + (TYPE_W[t.type] ?? 0) + (t.priorite - 2) * 6 + imp(c),
      niveau: overdue && lateDays > 0 ? 'urgent' : 'normal',
      titre: c ? clientName(c) : t.titre, action: c ? `${VERBE[t.type]} — ${t.titre}` : VERBE[t.type],
      raison: overdue ? (lateDays > 0 ? `Prévu il y a ${lateDays} j, non fait` : 'Heure prévue dépassée') : 'Prévu aujourd’hui',
    })
  }

  for (const q of quotes) {
    if (q.statut !== 'envoye' || !q.dateEnvoi) continue
    const age = diffDays(today(), dayKey(q.dateEnvoi))
    if (age < s.delais.relanceDevisJours) continue
    if (nextTask(q.clientId, tasks)) continue
    const c = byId.get(q.clientId)
    out.push({
      key: `devis:${q.id}`, kind: 'devis', quoteId: q.id, clientId: q.clientId,
      score: 58 + Math.min(12, age) + imp(c), niveau: 'urgent', titre: clientName(c), action: `Relancer le devis ${q.vehiculeLabel}`,
      raison: `Devis envoyé il y a ${age} j, aucune relance programmée`,
    })
  }

  for (const c of clients) {
    if (!isActiveStage(s.pipeline, c.statut) || nextTask(c.id, tasks)) continue
    if (c.leadRecuLe && !c.leadTraiteLe) continue
    if (quotes.some((q) => q.clientId === c.id && q.statut === 'envoye')) continue
    out.push({
      key: `sans_action:${c.id}`, kind: 'sans_action', clientId: c.id, score: 40 + imp(c) + (['negociation', 'essai', 'rdv'].includes(c.statut) ? 8 : 0),
      niveau: 'normal', titre: clientName(c), action: 'Définir la prochaine action',
      raison: `Opportunité active (« ${stageLabel(s.pipeline, c.statut)} ») sans prochaine action`,
    })
  }

  return out
    .filter((p) => {
      const until = s.snoozes[p.key]
      return !until || new Date(until).getTime() <= now
    })
    .sort((a, b) => b.score - a.score)
}

// ---------- Statistiques ----------
export interface Ratio { label: string; num: number; den: number; libNum: string; libDen: string }
export const MIN_SAMPLE = 5
export function ratioText(r: Ratio) {
  return r.den < MIN_SAMPLE ? 'Données insuffisantes' : `${Math.round((r.num / r.den) * 100)} %`
}

export interface MonthStats {
  mois: string; ventes: number; prospects: number; contacts: number; rdv: number; essais: number; devis: number
  commandes: number; livraisons: number; perdus: number
}
export function monthStats(month: string, ctx: Ctx): MonthStats {
  const inM = (d?: string) => !!d && monthKey(d) === month
  const inMDay = (d?: string) => !!d && d.slice(0, 7) === month
  const { clients, interactions, tasks, quotes, sales, settings: s } = ctx
  return {
    mois: month,
    ventes: salesOfMonth(sales, month, s).length,
    prospects: clients.filter((c) => inM(c.createdAt)).length,
    contacts: interactions.filter((i) => inM(i.date) && ['appel_sortant', 'appel_entrant', 'whatsapp', 'email'].includes(i.type) && i.resultat !== 'Sans réponse').length,
    rdv: tasks.filter((t) => t.type === 'rdv' && t.statut !== 'annulee' && inM(t.due)).length,
    essais: tasks.filter((t) => t.type === 'essai' && t.statut === 'faite' && inM(t.doneAt ?? t.due)).length,
    devis: quotes.filter((q) => inM(q.dateEnvoi)).length,
    commandes: sales.filter((x) => x.statut !== 'annule' && inMDay(x.dateBC)).length,
    livraisons: sales.filter((x) => inMDay(x.livraisonEffective)).length,
    perdus: interactions.filter((i) => i.type === 'statut' && i.vers === 'perdu' && inM(i.date)).length,
  }
}

/** Taux de conversion par cohorte de prospects créés sur la période [from, to] (mois inclus). */
export function conversions(from: string, to: string, ctx: Ctx): Ratio[] {
  const { clients, interactions, tasks, quotes, sales } = ctx
  const cohort = clients.filter((c) => { const m = monthKey(c.createdAt); return m >= from && m <= to })
  const ids = new Set(cohort.map((c) => c.id))
  const set = (arr: (string | undefined)[]) => new Set(arr.filter((x): x is string => !!x && ids.has(x)))
  const contactes = set(interactions.filter((i) => ['appel_sortant', 'appel_entrant', 'whatsapp', 'email', 'rdv', 'essai'].includes(i.type) && i.resultat !== 'Sans réponse').map((i) => i.clientId))
  const rdv = set(tasks.filter((t) => t.type === 'rdv' && t.statut !== 'annulee').map((t) => t.clientId))
  const essais = set(tasks.filter((t) => t.type === 'essai' && t.statut === 'faite').map((t) => t.clientId))
  const devis = set(quotes.filter((q) => q.dateEnvoi).map((q) => q.clientId))
  const vendus = set(sales.filter((x) => x.statut !== 'annule').map((x) => x.clientId))
  const inter = (a: Set<string>, b: Set<string>) => [...a].filter((x) => b.has(x)).length
  return [
    { label: 'Prospects → contacts', num: contactes.size, den: cohort.length, libNum: 'prospects contactés', libDen: 'prospects créés' },
    { label: 'Contacts → rendez-vous', num: inter(rdv, contactes), den: contactes.size, libNum: 'avec rendez-vous', libDen: 'prospects contactés' },
    { label: 'Rendez-vous → essais', num: inter(essais, rdv), den: rdv.size, libNum: 'avec essai réalisé', libDen: 'prospects avec rendez-vous' },
    { label: 'Essais → ventes', num: inter(vendus, essais), den: essais.size, libNum: 'ventes', libDen: 'prospects ayant essayé' },
    { label: 'Devis → ventes', num: inter(vendus, devis), den: devis.size, libNum: 'ventes', libDen: 'prospects avec devis envoyé' },
  ]
}

/** Trois axes d'amélioration maximum, fondés sur des constats observables (aucune causalité affirmée). */
export function improvementAxes(ctx: Ctx): { titre: string; constat: string }[] {
  const { clients, tasks, interactions, quotes, sales, interventions, settings: s } = ctx
  const now = ctx.now ?? Date.now()
  const axes: { poids: number; titre: string; constat: string }[] = []
  const actifs = clients.filter((c) => isActiveStage(s.pipeline, c.statut))
  const sansAction = actifs.filter((c) => !nextTask(c.id, tasks))
  if (actifs.length >= 3 && sansAction.length / actifs.length >= 0.2)
    axes.push({ poids: sansAction.length / actifs.length + 1, titre: 'Donner une prochaine action à chaque opportunité', constat: `${sansAction.length} opportunité(s) active(s) sur ${actifs.length} n’ont aucune prochaine action.` })
  const relances = tasks.filter((t) => ['relance', 'appel'].includes(t.type) && t.due)
  const tardives = relances.filter((t) => (t.statut === 'ouverte' && new Date(t.due!).getTime() < now && !isToday(t)) || (t.statut === 'faite' && t.doneAt && diffDays(dayKey(t.doneAt), dayKey(t.due!)) > 0))
  if (relances.length >= MIN_SAMPLE && tardives.length / relances.length >= 0.25)
    axes.push({ poids: tardives.length / relances.length + 0.8, titre: 'Tenir les relances à la date prévue', constat: `${tardives.length} relance(s)/appel(s) sur ${relances.length} ont été faits en retard ou sont en retard.` })
  const leads = clients.filter((c) => c.leadRecuLe)
  const horsDelai = leads.filter((c) => {
    const dl = new Date(leadDeadline(c, s)!).getTime()
    return c.leadTraiteLe ? new Date(c.leadTraiteLe).getTime() > dl : dl < now
  })
  if (leads.length >= 3 && horsDelai.length / leads.length >= 0.2)
    axes.push({ poids: horsDelai.length / leads.length + 0.9, titre: 'Traiter les leads dans le délai', constat: `${horsDelai.length} lead(s) sur ${leads.length} traités (ou encore en attente) au-delà de ${s.delais.leadMinutes} min.` })
  const devisSansSuite = quotes.filter((q) => q.statut === 'envoye' && q.dateEnvoi && diffDays(today(), dayKey(q.dateEnvoi)) >= s.delais.relanceDevisJours && !nextTask(q.clientId, tasks))
  if (devisSansSuite.length >= 2)
    axes.push({ poids: 0.7 + devisSansSuite.length / 10, titre: 'Relancer systématiquement les devis', constat: `${devisSansSuite.length} devis envoyés sans relance programmée.` })
  const sansUsage = actifs.filter((c) => !c.usage && !['nouveau', 'a_contacter', 'injoignable'].includes(c.statut))
  if (sansUsage.length >= 3)
    axes.push({ poids: 0.6 + sansUsage.length / actifs.length / 2, titre: 'Explorer l’usage du véhicule en découverte', constat: `${sansUsage.length} prospect(s) contacté(s) sans usage renseigné.` })
  const avances = clients.filter((c) => ['devis', 'negociation', 'propose'].includes(c.statut))
  const sansEssai = avances.filter((c) => !tasks.some((t) => t.clientId === c.id && t.type === 'essai' && t.statut !== 'annulee') && !interactions.some((i) => i.clientId === c.id && i.type === 'essai'))
  if (avances.length >= 3 && sansEssai.length / avances.length >= 0.5)
    axes.push({ poids: 0.55 + sansEssai.length / avances.length / 2, titre: 'Proposer l’essai plus tôt', constat: `${sansEssai.length} prospect(s) sur ${avances.length} au stade proposition/devis/négociation n’ont pas d’essai proposé ou réalisé.` })
  const bloques = sales.filter((x) => !['livre', 'annule'].includes(x.statut) && prepState(x, interventions, s).etat === 'bloque')
  if (bloques.length)
    axes.push({ poids: 0.5 + bloques.length / 5, titre: 'Débloquer les préparations en attente', constat: `${bloques.length} dossier(s) de préparation bloqué(s).` })
  return axes.sort((a, b) => b.poids - a.poids).slice(0, 3).map(({ titre, constat }) => ({ titre, constat }))
}

export function avgDeliveryDays(sales: Sale[]): { moyenne: number; n: number } | null {
  const ds = sales.filter((x) => x.livraisonEffective && (x.dateConfirmation || x.dateBC)).map((x) => diffDays(x.livraisonEffective!, (x.dateConfirmation ?? x.dateBC)!)).filter((d) => d >= 0)
  return ds.length ? { moyenne: Math.round(ds.reduce((a, b) => a + b, 0) / ds.length), n: ds.length } : null
}

// ---------- Planning ----------
export interface Slot { debut: number; fin: number } // minutes depuis minuit
export function freeSlots(busy: Slot[], s: Settings['profil'], minLen = 30): Slot[] {
  const toMin = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + (b || 0) }
  const blocks = [...busy, { debut: toMin(s.pauseDebut), fin: toMin(s.pauseFin) }].filter((b) => b.fin > b.debut).sort((a, b) => a.debut - b.debut)
  const out: Slot[] = []
  let cur = toMin(s.debut)
  const end = toMin(s.fin)
  for (const b of blocks) {
    if (b.debut - cur >= minLen) out.push({ debut: cur, fin: Math.min(b.debut, end) })
    cur = Math.max(cur, b.fin)
    if (cur >= end) break
  }
  if (end - cur >= minLen) out.push({ debut: cur, fin: end })
  return out
}
export { addDays }
