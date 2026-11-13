import { createContext, useContext, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings } from '../lib/db'
import type { Alert, Client, Interaction, Intervention, Note, Quote, Revenu, Sale, Settings, Task, Vehicle } from '../lib/types'
import type { Ctx } from '../services/logic'

export interface Data extends Ctx { notes: Note[]; alerts: Alert[]; revenus: Revenu[]; settings: Settings; byClient: Map<string, Client>; byVehicle: Map<string, Vehicle> }
const DataCtx = createContext<Data | null>(null)

export function DataProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const data = useLiveQuery(async (): Promise<Data> => {
    const [clients, tasks, interactions, quotes, sales, interventions, vehicles, notes, alerts, revenus, settings] = await Promise.all([
      db.clients.toArray() as Promise<Client[]>, db.tasks.toArray() as Promise<Task[]>, db.interactions.toArray() as Promise<Interaction[]>, db.quotes.toArray() as Promise<Quote[]>,
      db.sales.toArray() as Promise<Sale[]>, db.interventions.toArray() as Promise<Intervention[]>, db.vehicles.toArray() as Promise<Vehicle[]>, db.notes.toArray(), db.alerts.toArray(), db.revenus.toArray(), getSettings(),
    ])
    return { clients, tasks, interactions, quotes, sales, interventions, vehicles, notes, alerts, revenus, settings, byClient: new Map(clients.map((c) => [c.id, c])), byVehicle: new Map(vehicles.map((v) => [v.id, v])) }
  }, [])
  if (!data) return <>{fallback}</>
  return <DataCtx.Provider value={data}>{children}</DataCtx.Provider>
}
export function useData(): Data {
  const d = useContext(DataCtx)
  if (!d) throw new Error('Données non chargées')
  return d
}
/** Horloge partagée : rafraîchit les comptes à rebours et les retards chaque 30 s. */
import { useEffect, useState } from 'react'
export function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(i) }, [ms])
  return now
}
