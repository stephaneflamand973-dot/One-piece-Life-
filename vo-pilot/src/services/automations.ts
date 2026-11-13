// Moteur de règles déterministe. Chaque règle « scanne » l'état réel des données et propose des tâches
// ou des alertes identifiées par une clé unique : relancer le moteur ne crée donc jamais de doublon.
// Limite assumée : le moteur ne tourne que lorsque l'application est ouverte (aucun serveur).
import { db, getSettings, saveSettings, uid } from '../lib/db'
import type { Alert, Settings, Task } from '../lib/types'
import { addDays, atTime, dayKey, diffDays, nowIso, today } from '../lib/dates'
import { clientName, clientsForVehicle, isActiveStage, leadDeadline, nextTask, prepState, type Ctx } from './logic'

type NewTask = Omit<Task, 'id' | 'createdAt' | 'statut'> & { autoKey: string }
type NewAlert = Omit<Alert, 'id' | 'createdAt'>
export interface Rule {
  id: string; nom: string; declencheur: string; action: string; type: 'tâche' | 'alerte'
  portee: 'Locale (application ouverte)'
  scan: (ctx: Ctx) => { tasks?: NewTask[]; alerts?: NewAlert[] }
}

const hSuivante = (s: Settings) => atTime(today(), s.profil.debut)

export const RULES: Rule[] = [
  {
    id: 'lead_premier_contact', nom: 'Lead reçu → premier contact', declencheur: 'Réception déclarée d’un lead', action: 'Créer la tâche « Premier contact » à l’échéance du délai', type: 'tâche', portee: 'Locale (application ouverte)',
    scan: ({ clients, settings: s }) => ({
      tasks: clients.filter((c) => c.leadRecuLe && !c.leadTraiteLe).map((c) => ({ type: 'appel' as const, titre: 'Premier contact (lead)', clientId: c.id, due: leadDeadline(c, s)!, priorite: 3 as const, autoKey: `lead:${c.id}` })),
    }),
  },
  {
    id: 'devis_relance', nom: 'Devis envoyé → relance', declencheur: 'Envoi confirmé d’un devis', action: 'Créer une relance datée (délai configurable)', type: 'tâche', portee: 'Locale (application ouverte)',
    scan: ({ quotes, settings: s }) => ({
      tasks: quotes.filter((q) => q.statut === 'envoye' && q.dateEnvoi).map((q) => ({ type: 'relance' as const, titre: `Relance devis ${q.vehiculeLabel}`, clientId: q.clientId, due: atTime(addDays(dayKey(q.dateEnvoi!), s.delais.relanceDevisJours), '10:00'), priorite: 2 as const, autoKey: `devis:${q.id}` })),
    }),
  },
  {
    id: 'vente_documents', nom: 'Vente créée → documents', declencheur: 'Création d’une vente', action: 'Créer la tâche « Demander les documents au client »', type: 'tâche', portee: 'Locale (application ouverte)',
    scan: ({ sales, settings: s }) => ({
      tasks: sales.filter((x) => !['livre', 'annule'].includes(x.statut) && x.documents.some((d) => d.statut === 'manquant')).map((x) => ({ type: 'tache' as const, titre: `Demander les documents — ${x.vehiculeLabel}`, clientId: x.clientId, saleId: x.id, due: atTime(addDays(dayKey(x.createdAt), 1), s.profil.debut), priorite: 2 as const, autoKey: `docs:${x.id}` })),
    }),
  },
  {
    id: 'intervention_bloquee', nom: 'Intervention bloquée → déblocage', declencheur: 'Étape ou intervention au statut « bloquée »', action: 'Créer une tâche de déblocage et une alerte critique', type: 'tâche', portee: 'Locale (application ouverte)',
    scan: ({ sales, interventions, clients, settings: s }) => {
      const tasks: NewTask[] = []
      const alerts: NewAlert[] = []
      for (const x of sales) {
        if (['livre', 'annule'].includes(x.statut)) continue
        const st = prepState(x, interventions, s)
        for (const b of st.bloquees) {
          const key = `blocage:${x.id}:${b.id}:${(b.updatedAt ?? '').slice(0, 16)}`
          tasks.push({ type: 'intervention', titre: `Débloquer « ${b.label} » — ${x.vehiculeLabel}`, clientId: x.clientId, saleId: x.id, due: hSuivante(s), priorite: 3, autoKey: key })
          alerts.push({ key, ruleId: 'intervention_bloquee', niveau: 'critique', titre: `Préparation bloquée : ${b.label}`, detail: `${x.vehiculeLabel} — ${clientName(clients.find((c) => c.id === x.clientId))}${b.commentaire ? ` · ${b.commentaire}` : ''}`, link: `/ventes/${x.id}` })
        }
      }
      return { tasks, alerts }
    },
  },
  {
    id: 'livraison_proche', nom: 'Livraison proche et préparation incomplète', declencheur: 'Date de livraison approchant (seuil configurable)', action: 'Afficher une alerte avec ce qui manque', type: 'alerte', portee: 'Locale (application ouverte)',
    scan: ({ sales, interventions, settings: s }) => ({
      alerts: sales.flatMap((x) => {
        if (['livre', 'annule'].includes(x.statut) || !x.livraisonPrevue) return []
        const st = prepState(x, interventions, s)
        if (!st.manquantes.length || st.joursAvantLivraison === null || st.joursAvantLivraison > s.delais.alerteLivraisonJours) return []
        return [{ key: `livraison:${x.id}:${dayKey(x.livraisonPrevue)}`, ruleId: 'livraison_proche', niveau: 'urgent' as const, titre: `Livraison ${st.joursAvantLivraison < 0 ? 'dépassée' : `dans ${st.joursAvantLivraison} j`} : ${x.vehiculeLabel}`, detail: `Reste : ${st.manquantes.map((m) => m.label).join(', ')}`, link: `/ventes/${x.id}` }]
      }),
    }),
  },
  {
    id: 'suivi_livraison', nom: 'Vente livrée → suivi après-vente', declencheur: 'Vente passée au statut « Livré »', action: 'Proposer des tâches de suivi (délais configurables, selon consentement)', type: 'tâche', portee: 'Locale (application ouverte)',
    scan: ({ sales, clients, settings: s }) => ({
      tasks: sales.filter((x) => x.statut === 'livre' && x.livraisonEffective).flatMap((x) => {
        const c = clients.find((k) => k.id === x.clientId)
        if (!c || c.consentement?.nePasContacter) return []
        return s.delais.suiviLivraisonJours.map((j, i) => ({ type: 'relance' as const, titre: i === 0 ? `Suivi satisfaction — ${x.vehiculeLabel}` : `Suivi après-vente J+${j} — ${x.vehiculeLabel}`, clientId: x.clientId, saleId: x.id, due: atTime(addDays(x.livraisonEffective!, j), '10:00'), priorite: 1 as const, autoKey: `suivi:${x.id}:${j}` }))
      }),
    }),
  },
  {
    id: 'arrivage', nom: 'Nouveau véhicule → prospects compatibles', declencheur: 'Véhicule ajouté au catalogue (7 derniers jours)', action: 'Afficher les correspondances véhicule ↔ prospects', type: 'alerte', portee: 'Locale (application ouverte)',
    scan: ({ vehicles, clients, settings: s }) => ({
      alerts: vehicles.filter((v) => v.statut === 'disponible' && diffDays(today(), dayKey(v.createdAt)) <= 7).flatMap((v) => {
        const m = clientsForVehicle(v, clients, s.pipeline)
        if (!m.length) return []
        return [{ key: `arrivage:${v.id}`, ruleId: 'arrivage', niveau: 'info' as const, titre: `Arrivage : ${v.marque} ${v.modele} — ${m.length} prospect(s) compatible(s)`, detail: m.slice(0, 4).map((x) => clientName(x.client)).join(', '), link: `/vehicules/${v.id}` }]
      }),
    }),
  },
  {
    id: 'sans_action', nom: 'Opportunité sans prochaine action', declencheur: 'Prospect actif sans tâche ouverte', action: 'Afficher une alerte (regroupée)', type: 'alerte', portee: 'Locale (application ouverte)',
    scan: ({ clients, tasks, settings: s }) => {
      const n = clients.filter((c) => isActiveStage(s.pipeline, c.statut) && !nextTask(c.id, tasks)).length
      return { alerts: n ? [{ key: `sans_action:${today()}`, ruleId: 'sans_action', niveau: 'info' as const, titre: `${n} opportunité(s) sans prochaine action`, detail: 'Chaque opportunité active devrait avoir une prochaine étape datée.', link: '/clients?vue=sans_action' }] : [] }
    },
  },
]

export async function loadCtx(): Promise<Ctx> {
  const [clients, tasks, interactions, quotes, sales, interventions, vehicles, settings] = await Promise.all([
    db.clients.toArray(), db.tasks.toArray(), db.interactions.toArray(), db.quotes.toArray(), db.sales.toArray(), db.interventions.toArray(), db.vehicles.toArray(), getSettings(),
  ])
  return { clients, tasks, interactions, quotes, sales, interventions, vehicles, settings }
}

let running = false
export async function runAutomations(): Promise<number> {
  if (running) return 0
  running = true
  let created = 0
  try {
    const ctx = await loadCtx()
    const state: Settings['automations'] = {}
    for (const rule of RULES) {
      const cfg = ctx.settings.automations[rule.id] ?? { actif: true }
      if (!cfg.actif) continue
      try {
        const res = rule.scan(ctx)
        let n = 0
        for (const t of res.tasks ?? []) {
          if (await db.tasks.where('autoKey').equals(t.autoKey).count()) continue
          await db.tasks.add({ ...t, id: uid(), statut: 'ouverte', createdAt: nowIso() })
          n++
        }
        for (const a of res.alerts ?? []) {
          if (await db.alerts.where('key').equals(a.key).count()) continue
          await db.alerts.add({ ...a, id: uid(), createdAt: nowIso() })
          n++
          notify(a.titre, a.detail)
        }
        if (n) {
          created += n
          state[rule.id] = { actif: true, dernierRun: nowIso(), dernierMessage: `${n} élément(s) créé(s)`, derniereErreur: undefined }
          await db.runs.add({ id: uid(), ruleId: rule.id, date: nowIso(), message: `${n} élément(s) créé(s)`, ok: true })
        }
      } catch (e) {
        state[rule.id] = { ...cfg, derniereErreur: `${nowIso()} — ${(e as Error).message}` }
        await db.runs.add({ id: uid(), ruleId: rule.id, date: nowIso(), message: (e as Error).message, ok: false })
      }
    }
    if (Object.keys(state).length) await saveSettings((s) => { for (const k of Object.keys(state)) s.automations[k] = { ...s.automations[k], ...state[k] } })
  } finally {
    running = false
  }
  return created
}

/** Notification système : seulement si l'utilisateur l'a autorisée, et seulement application ouverte. */
async function notify(title: string, body?: string) {
  try {
    const s = await getSettings()
    if (!s.notifications || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg?.showNotification) await reg.showNotification(`VO PILOT — ${title}`, { body, icon: './icon-192.png' })
    else new Notification(`VO PILOT — ${title}`, { body })
  } catch { /* la notification est un confort : son échec ne doit jamais bloquer l'application */ }
}
