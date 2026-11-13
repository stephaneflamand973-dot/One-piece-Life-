// Assistant déterministe : il reconnaît l'intention par mots-clés et répond à partir des données réelles.
// Les « spécialités » sont des modules de logique, pas des agents IA indépendants. Aucune donnée ne sort de l'appareil.
import { dayKey, fmtDateTime, fmtDay, monthKey, today } from '../lib/dates'
import {
  clientName, clientView, clientsForVehicle, computePriorities, hasBareme, improvementAxes, isOverdue, isToday, leadUrgency, monthMoney, norm,
  openTasks, prepState, salesOfMonth, simulate, stageLabel, vehicleLabel, vehiclesForClient, type Ctx,
} from './logic'
import { euro } from './whatsapp'

export interface Line { texte: string; detail?: string; link?: string }
export interface Answer { module: string; titre: string; lignes: Line[]; note?: string }

export const MODULES = ['00 — Directeur commercial', '01 — CRM et prospection', '02 — Vente et négociation', '03 — Stock et WhatsApp', '04 — Fidélisation', '05 — Logistique', '06 — Performance financière']
export const EXEMPLES = [
  'Quels clients dois-je rappeler aujourd’hui ?', 'Quelles sont mes livraisons bloquées ?', 'Combien de ventes me manque-t-il ?', 'Quels dossiers n’ont pas de prochaine action ?',
  'Quelles commissions vais-je toucher ?', 'Quels leads sont urgents ?', 'Trouve les prospects pour une Clio automatique', 'Quels devis sont sans réponse ?', 'Que dois-je améliorer ?', 'Quels clients livrés dois-je recontacter ?',
]

const has = (q: string, ...mots: string[]) => mots.some((m) => q.includes(m))

export function answer(question: string, ctx: Ctx): Answer {
  const q = norm(question)
  const { clients, tasks, sales, quotes, interventions, vehicles, settings: s } = ctx
  const byId = new Map(clients.map((c) => [c.id, c]))
  const cl = (id?: string) => clientName(id ? byId.get(id) : undefined)
  const mois = monthKey()

  // Client ou véhicule nommé dans la question
  const cNomme = clients.find((c) => (c.nom && c.nom.length > 2 && q.includes(norm(c.nom))) || (c.prenom && c.prenom.length > 2 && q.includes(norm(c.prenom))))

  if (has(q, 'bloqu', 'manque pour livrer', 'empeche')) {
    const lignes: Line[] = []
    for (const x of sales) {
      if (['livre', 'annule'].includes(x.statut)) continue
      const st = prepState(x, interventions, s)
      if (cNomme ? x.clientId !== cNomme.id : st.etat !== 'bloque' && !(has(q, 'manque') && st.manquantes.length)) continue
      lignes.push({ texte: `${x.vehiculeLabel} — ${cl(x.clientId)}`, detail: st.bloquees.length || st.interventionsBloquees.length ? `Bloqué : ${[...st.bloquees.map((b) => `${b.label}${b.commentaire ? ` (${b.commentaire})` : ''}`), ...st.interventionsBloquees.map((i) => i.type)].join(', ')}` : `Reste : ${st.manquantes.map((m) => m.label).join(', ') || 'rien'}`, link: `/ventes/${x.id}` })
    }
    return { module: MODULES[5], titre: lignes.length ? 'Préparations bloquées ou incomplètes' : 'Aucune livraison bloquée dans vos données', lignes }
  }
  if (has(q, 'livraison', 'livrer', 'preparation')) {
    const lignes = sales.filter((x) => !['livre', 'annule'].includes(x.statut)).map((x) => {
      const st = prepState(x, interventions, s)
      return { texte: `${x.vehiculeLabel} — ${cl(x.clientId)}`, detail: `${x.livraisonPrevue ? `Livraison ${fmtDateTime(x.livraisonPrevue)}` : 'Livraison non programmée'} · ${st.faits}/${st.total} étapes${st.manquantes.length ? ` · reste : ${st.manquantes.map((m) => m.label).join(', ')}` : ' · checklist complète'}`, link: `/ventes/${x.id}` }
    })
    return { module: MODULES[5], titre: `${lignes.length} dossier(s) en cours de préparation`, lignes }
  }
  if (has(q, 'lead')) {
    const lignes = clients.filter((c) => c.leadRecuLe && !c.leadTraiteLe).map((c) => ({ texte: clientName(c), detail: `Reçu ${fmtDateTime(c.leadRecuLe)} · ${leadUrgency(c, s) === 'souffrance' ? 'délai dépassé' : 'dans le délai'}`, link: `/clients/${c.id}` }))
    return { module: MODULES[1], titre: lignes.length ? `${lignes.length} lead(s) à traiter` : 'Aucun lead en attente dans VO PILOT', lignes, note: 'Le traitement doit aussi être reporté dans UpYourLeads : VO PILOT n’y est pas connecté.' }
  }
  if (has(q, 'sans prochaine action', 'pas de prochaine action', 'sans action', 'oubli')) {
    const lignes = clientView('sans_action', ctx).map((c) => ({ texte: clientName(c), detail: stageLabel(s.pipeline, c.statut), link: `/clients/${c.id}` }))
    return { module: MODULES[1], titre: `${lignes.length} opportunité(s) sans prochaine action`, lignes }
  }
  if (has(q, 'devis')) {
    const lignes = quotes.filter((x) => x.statut === 'envoye').map((x) => ({ texte: `${cl(x.clientId)} — ${x.vehiculeLabel}`, detail: `Envoyé le ${fmtDay(dayKey(x.dateEnvoi ?? x.dateCreation))}`, link: `/clients/${x.clientId}` }))
    return { module: MODULES[2], titre: `${lignes.length} devis en attente de réponse`, lignes }
  }
  if (has(q, 'commission', 'toucher', 'remuneration', 'salaire', 'revenu', 'gagner')) {
    if (!hasBareme(s)) return { module: MODULES[6], titre: 'Barème de commissions non renseigné', lignes: [{ texte: 'Renseignez votre barème réel pour obtenir une estimation.', link: '/commissions' }], note: 'Aucun montant n’est inventé : sans barème, aucune estimation.' }
    const m = monthMoney(sales, mois, s)
    return { module: MODULES[6], titre: 'Commissions du mois (estimation selon votre barème)', lignes: [
      { texte: `${m.ventes} vente(s) comptabilisée(s)`, link: '/commissions' },
      { texte: `Commissions estimées : ${euro(m.estime ?? 0)}${m.bonus ? ` + prime palier ${euro(m.bonus)}` : ''}` },
      { texte: `Brut estimé (fixe + variable) : ${euro(m.brutEstime ?? 0)}` },
      { texte: `Déjà versé : ${euro(m.verse)} · en attente : ${euro(m.enAttente ?? 0)}` },
    ], note: 'Estimation indicative en brut. Le net réel dépend de votre bulletin de paie.' }
  }
  if (has(q, 'combien de vente', 'manque', 'objectif', 'ou j\'en suis', 'ou en suis')) {
    const n = salesOfMonth(sales, mois, s).length
    const obj = s.profil.objectifMensuel
    const lignes: Line[] = [{ texte: `${n} vente(s) ce mois pour un objectif de ${obj}`, link: '/stats' }, { texte: n >= obj ? 'Objectif atteint.' : `Il reste ${obj - n} vente(s) à réaliser.` }]
    const sim = simulate(obj, s, 15000)
    if (sim !== null) lignes.push({ texte: `Brut estimé à ${obj} ventes : ${euro(sim)}`, link: '/commissions' })
    return { module: MODULES[0], titre: 'Ventes et objectif du mois', lignes }
  }
  if (has(q, 'ameliorer', 'progresser', 'axe', 'performance')) {
    const axes = improvementAxes(ctx)
    return { module: MODULES[0], titre: axes.length ? 'Axes d’amélioration observables' : 'Données insuffisantes pour proposer un axe', lignes: axes.map((a) => ({ texte: a.titre, detail: a.constat })), note: 'Constats tirés de vos saisies ; aucune causalité n’est affirmée.' }
  }
  if (has(q, 'trouve', 'correspond', 'compatible', 'interesse')) {
    // « prospects pour une Clio automatique » : on cherche d'abord un véhicule du catalogue, sinon on filtre les besoins.
    const v = vehicles.find((x) => q.includes(norm(x.modele)) && (!has(q, 'automatique') || norm(x.boite) === 'automatique') && x.statut === 'disponible')
    if (cNomme) {
      const m = vehiclesForClient(cNomme, vehicles)
      return { module: MODULES[3], titre: `${m.length} véhicule(s) du catalogue pour ${clientName(cNomme)}`, lignes: m.slice(0, 8).map((x) => ({ texte: `${vehicleLabel(x.vehicle)} — ${euro(x.vehicle.prix)}`, detail: x.match.raisons.join(' · '), link: `/vehicules/${x.vehicle.id}` })) }
    }
    if (v) {
      const m = clientsForVehicle(v, clients, s.pipeline)
      return { module: MODULES[3], titre: `${m.length} prospect(s) compatible(s) avec ${vehicleLabel(v)} (${v.ref})`, lignes: m.map((x) => ({ texte: clientName(x.client), detail: x.match.raisons.join(' · '), link: `/clients/${x.client.id}` })), note: 'Vérifiez la disponibilité réelle du véhicule avant de recontacter.' }
    }
    const mots = q.split(/\s+/).filter((w) => w.length > 3 && !['trouve', 'prospects', 'prospect', 'correspondant', 'cette', 'pour', 'automatique', 'clients', 'compatible', 'compatibles'].includes(w))
    const lignes = clients.filter((c) => { const r = norm(`${c.recherche?.texte ?? ''} ${c.recherche?.marque ?? ''} ${c.recherche?.modele ?? ''}`); return mots.some((w) => r.includes(w)) && (!has(q, 'automatique') || norm(c.recherche?.boite) === 'automatique') }).map((c) => ({ texte: clientName(c), detail: [c.recherche?.modele ?? c.recherche?.texte, c.recherche?.boite, c.recherche?.budgetMax ? `≤ ${euro(c.recherche.budgetMax)}` : ''].filter(Boolean).join(' · '), link: `/clients/${c.id}` }))
    return { module: MODULES[3], titre: `${lignes.length} prospect(s) dont la recherche correspond`, lignes }
  }
  if (has(q, 'livre', 'fidelis', 'satisfaction', 'apres-vente', 'apres vente', 'recontacter')) {
    const lignes = openTasks(tasks).filter((t) => t.autoKey?.startsWith('suivi:')).sort((a, b) => (a.due ?? '').localeCompare(b.due ?? '')).map((t) => ({ texte: `${cl(t.clientId)} — ${t.titre}`, detail: fmtDateTime(t.due), link: `/clients/${t.clientId}` }))
    return { module: MODULES[4], titre: `${lignes.length} suivi(s) après livraison programmé(s)`, lignes }
  }
  if (has(q, 'message', 'whatsapp', 'relance pour')) {
    return { module: MODULES[3], titre: 'Préparer un message', lignes: [{ texte: cNomme ? `Ouvrir les modèles de message pour ${clientName(cNomme)}` : 'Ouvrir les modèles de message WhatsApp', link: cNomme ? `/whatsapp?client=${cNomme.id}` : '/whatsapp' }], note: 'Le message est préparé à partir de vos modèles ; vous l’envoyez et confirmez l’envoi vous-même.' }
  }
  if (has(q, 'rappeler', 'relancer', 'appeler', 'relance', 'aujourd')) {
    const list = openTasks(tasks).filter((t) => ['appel', 'relance', 'whatsapp'].includes(t.type) && (isToday(t) || isOverdue(t, ctx.now))).sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
    return { module: MODULES[1], titre: `${list.length} client(s) à rappeler / relancer`, lignes: list.map((t) => ({ texte: `${cl(t.clientId)} — ${t.titre}`, detail: `${fmtDateTime(t.due)}${isOverdue(t, ctx.now) && !isToday(t) ? ' · en retard' : ''}`, link: t.clientId ? `/clients/${t.clientId}` : '/agenda' })) }
  }
  if (cNomme) {
    const st = sales.filter((x) => x.clientId === cNomme.id)
    return { module: MODULES[1], titre: clientName(cNomme), lignes: [
      { texte: `Statut : ${stageLabel(s.pipeline, cNomme.statut)}`, link: `/clients/${cNomme.id}` },
      ...openTasks(tasks).filter((t) => t.clientId === cNomme.id).map((t) => ({ texte: `Prochaine action : ${t.titre}`, detail: fmtDateTime(t.due) })),
      ...st.map((x) => ({ texte: `Vente ${x.ref} — ${x.vehiculeLabel}`, link: `/ventes/${x.id}` })),
    ] }
  }
  // Par défaut : la synthèse du « directeur commercial »
  const p = computePriorities(ctx).slice(0, 5)
  return { module: MODULES[0], titre: p.length ? 'Ce qui mérite votre attention maintenant' : 'Rien d’urgent dans vos données', lignes: p.map((x) => ({ texte: `${x.titre} — ${x.action}`, detail: x.raison, link: x.saleId ? `/ventes/${x.saleId}` : x.clientId ? `/clients/${x.clientId}` : '/' })), note: `Je réponds à partir de règles et de vos données (${today()}). Essayez une des questions proposées.` }
}
