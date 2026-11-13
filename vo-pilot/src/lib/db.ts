import Dexie, { type Table } from 'dexie'
import type {
  Alert, AuditEntry, AutomationRun, Client, Interaction, Intervention, Note, Photo, Quote, Revenu, Sale, Settings, Task, Vehicle,
} from './types'
import { defaultSettings } from './defaults'
import { nowIso, setTimeZone } from './dates'

export class VoPilotDB extends Dexie {
  clients!: Table<Client, string>
  interactions!: Table<Interaction, string>
  tasks!: Table<Task, string>
  vehicles!: Table<Vehicle, string>
  photos!: Table<Photo, string>
  quotes!: Table<Quote, string>
  sales!: Table<Sale, string>
  interventions!: Table<Intervention, string>
  notes!: Table<Note, string>
  alerts!: Table<Alert, string>
  revenus!: Table<Revenu, string>
  audit!: Table<AuditEntry, string>
  runs!: Table<AutomationRun, string>
  settings!: Table<Settings, string>

  constructor() {
    super('vo-pilot')
    this.version(1).stores({
      clients: 'id, ref, nom, tel, statut, updatedAt',
      interactions: 'id, clientId, date, type',
      tasks: 'id, clientId, saleId, due, statut, autoKey',
      vehicles: 'id, &ref, marque, modele, statut',
      photos: 'id, vehicleId, ordre',
      quotes: 'id, clientId, vehicleId, statut',
      sales: 'id, clientId, vehicleId, statut',
      interventions: 'id, saleId, statut',
      notes: 'id, linkId, updatedAt',
      alerts: 'id, &key, ruleId',
      revenus: 'id',
      audit: 'id, date, entiteId',
      runs: 'id, ruleId, date',
      settings: 'id',
    })
  }
}

export const db = new VoPilotDB()

export const DATA_TABLES = [
  'clients', 'interactions', 'tasks', 'vehicles', 'photos', 'quotes', 'sales', 'interventions', 'notes', 'alerts', 'revenus', 'audit', 'runs', 'settings',
] as const
export type TableName = (typeof DATA_TABLES)[number]

export const uid = (): string =>
  globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Fusionne les paramètres enregistrés avec les valeurs par défaut (nouvelles clés après mise à jour). */
function merge<T>(def: T, saved: unknown): T {
  if (saved === undefined || saved === null) return def
  if (Array.isArray(def) || typeof def !== 'object' || def === null) return saved as T
  const out: Record<string, unknown> = { ...(saved as Record<string, unknown>) }
  for (const k of Object.keys(def as Record<string, unknown>)) out[k] = merge((def as Record<string, unknown>)[k], (saved as Record<string, unknown>)[k])
  return out as T
}

export async function getSettings(): Promise<Settings> {
  const s = merge(defaultSettings(), await db.settings.get('main'))
  setTimeZone(s.profil.fuseau)
  return s
}

export async function saveSettings(patch: (s: Settings) => void | Settings): Promise<Settings> {
  return db.transaction('rw', db.settings, async () => {
    const s = await getSettings()
    const r = patch(s) ?? s
    await db.settings.put(r)
    setTimeZone(r.profil.fuseau)
    return r
  })
}

/** Référence lisible et unique (C-0001, V-0003…). */
export async function nextRef(prefix: string): Promise<string> {
  const s = await saveSettings((st) => {
    st.compteurs[prefix] = (st.compteurs[prefix] ?? 0) + 1
  })
  return `${prefix}-${String(s.compteurs[prefix]).padStart(4, '0')}`
}

export async function audit(entite: string, entiteId: string, action: string, avant?: unknown, apres?: unknown, origine: AuditEntry['origine'] = 'utilisateur') {
  const str = (v: unknown) => (v === undefined ? undefined : typeof v === 'string' ? v : JSON.stringify(v).slice(0, 500))
  await db.audit.add({ id: uid(), date: nowIso(), entite, entiteId, action, avant: str(avant), apres: str(apres), origine })
}

// Petit bus d'événements : chaque écriture métier le déclenche pour relancer les automatisations.
const listeners = new Set<() => void>()
export const onDataChanged = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const emitChange = () => listeners.forEach((fn) => fn())
