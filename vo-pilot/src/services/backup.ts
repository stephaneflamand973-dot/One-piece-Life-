import { DATA_TABLES, db, emitChange, saveSettings, type TableName } from '../lib/db'
import { nowIso } from '../lib/dates'

export interface Backup { app: 'vo-pilot'; format: 1; exportedAt: string; tables: Record<string, unknown[]> }

export async function exportBackup(): Promise<Backup> {
  const tables: Record<string, unknown[]> = {}
  for (const t of DATA_TABLES) tables[t] = await db.table(t).toArray()
  await saveSettings((s) => { s.derniereSauvegarde = nowIso() })
  return { app: 'vo-pilot', format: 1, exportedAt: nowIso(), tables }
}

/** Valide un fichier de sauvegarde avant toute écriture. Lève une erreur explicite si le fichier est invalide. */
export function validateBackup(raw: unknown): { backup: Backup; resume: Record<string, number> } {
  if (!raw || typeof raw !== 'object') throw new Error('Fichier illisible : ce n’est pas une sauvegarde VO PILOT.')
  const b = raw as Backup
  if (b.app !== 'vo-pilot' || b.format !== 1 || !b.tables || typeof b.tables !== 'object') throw new Error('Format non reconnu : ce fichier ne provient pas de VO PILOT (ou d’une version incompatible).')
  const resume: Record<string, number> = {}
  for (const t of DATA_TABLES) {
    const rows = b.tables[t]
    if (rows === undefined) continue
    if (!Array.isArray(rows)) throw new Error(`Sauvegarde corrompue : la table « ${t} » n’est pas une liste.`)
    for (const r of rows) if (!r || typeof r !== 'object' || typeof (r as { id?: unknown }).id !== 'string') throw new Error(`Sauvegarde corrompue : enregistrement sans identifiant dans « ${t} ».`)
    resume[t] = rows.length
  }
  if (!Object.keys(resume).length) throw new Error('Sauvegarde vide.')
  return { backup: b, resume }
}

/** Restauration contrôlée : remplace TOUTES les données locales par celles du fichier (transaction unique). */
export async function restoreBackup(b: Backup) {
  const tables = DATA_TABLES.map((t) => db.table(t))
  await db.transaction('rw', tables, async () => {
    for (const t of DATA_TABLES) {
      await db.table(t).clear()
      const rows = b.tables[t]
      if (rows?.length) await db.table(t).bulkAdd(rows)
    }
  })
  emitChange()
}

export async function wipeAll(keepSettings = true) {
  const tables = DATA_TABLES.filter((t) => !(keepSettings && t === 'settings'))
  await db.transaction('rw', tables.map((t) => db.table(t)), async () => { for (const t of tables) await db.table(t).clear() })
  if (keepSettings) await saveSettings((s) => { s.compteurs = {}; s.snoozes = {}; s.demoChargee = false })
  emitChange()
}

export async function wipeDemo() {
  const tables: TableName[] = ['clients', 'interactions', 'tasks', 'vehicles', 'quotes', 'sales', 'interventions', 'notes']
  await db.transaction('rw', [...tables.map((t) => db.table(t)), db.photos, db.alerts], async () => {
    const vids = (await db.vehicles.filter((v) => !!v.demo).toArray()).map((v) => v.id)
    const cids = new Set((await db.clients.filter((c) => !!c.demo).toArray()).map((c) => c.id))
    const sids = new Set((await db.sales.filter((c) => !!c.demo).toArray()).map((c) => c.id))
    for (const t of tables) await db.table(t).filter((r: { demo?: boolean }) => !!r.demo).delete()
    // Éléments générés automatiquement à partir des données de démonstration
    await db.tasks.filter((t) => (!!t.clientId && cids.has(t.clientId)) || (!!t.saleId && sids.has(t.saleId))).delete()
    await db.interactions.filter((i) => cids.has(i.clientId)).delete()
    await db.photos.where('vehicleId').anyOf(vids).delete()
    await db.alerts.clear()
  })
  await saveSettings((s) => { s.demoChargee = false })
  emitChange()
}

export function download(filename: string, content: string | Blob, type = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
