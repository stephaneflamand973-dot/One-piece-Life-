import type { Client, Intervention, Note, Sale, Task, Vehicle } from '../lib/types'
import { clientName, norm, SALE_STATUS, vehicleLabel } from './logic'

export interface Hit { type: string; titre: string; detail?: string; link: string }
interface Data { clients: Client[]; vehicles: Vehicle[]; sales: Sale[]; tasks: Task[]; notes: Note[]; interventions: Intervention[] }

export function search(query: string, d: Data, limit = 40): Hit[] {
  const mots = norm(query).split(/\s+/).filter(Boolean)
  if (!mots.length) return []
  const digits = query.replace(/\D/g, '')
  const ok = (txt: string) => { const n = norm(txt); return mots.every((m) => n.includes(m)) }
  const cById = new Map(d.clients.map((c) => [c.id, c]))
  const sById = new Map(d.sales.map((s) => [s.id, s]))
  const out: Hit[] = []
  for (const c of d.clients) {
    const r = c.recherche ?? {}
    if (ok(`${c.nom} ${c.prenom ?? ''} ${c.ref} ${c.email ?? ''} ${r.texte ?? ''} ${r.marque ?? ''} ${r.modele ?? ''}`) || (digits.length >= 4 && (c.tel ?? '').replace(/\D/g, '').includes(digits)))
      out.push({ type: 'Client', titre: clientName(c), detail: [c.tel, r.modele ?? r.texte].filter(Boolean).join(' · '), link: `/clients/${c.id}` })
  }
  for (const v of d.vehicles) if (ok(`${v.ref} ${vehicleLabel(v)} ${v.couleur ?? ''} ${v.annee ?? ''} ${v.site ?? ''}`)) out.push({ type: 'Véhicule', titre: vehicleLabel(v), detail: `${v.ref}${v.prix ? ` · ${v.prix} €` : ''}`, link: `/vehicules/${v.id}` })
  for (const s of d.sales) if (ok(`${s.ref} ${s.vehiculeLabel} ${clientName(cById.get(s.clientId))}`)) out.push({ type: s.statut === 'livre' ? 'Livraison' : 'Vente', titre: `${s.vehiculeLabel} — ${clientName(cById.get(s.clientId))}`, detail: `${s.ref} · ${SALE_STATUS[s.statut]}`, link: `/ventes/${s.id}` })
  for (const i of d.interventions) { const s = sById.get(i.saleId); if (ok(`${i.type} ${i.prestataire ?? ''} ${i.commentaire ?? ''} ${s?.vehiculeLabel ?? ''}`)) out.push({ type: 'Intervention', titre: `${i.type}${s ? ` — ${s.vehiculeLabel}` : ''}`, detail: i.commentaire, link: `/ventes/${i.saleId}` }) }
  for (const t of d.tasks) if (t.statut === 'ouverte' && ok(`${t.titre} ${clientName(t.clientId ? cById.get(t.clientId) : undefined)}`)) out.push({ type: t.type === 'rdv' ? 'Rendez-vous' : 'Tâche', titre: t.titre, detail: t.clientId ? clientName(cById.get(t.clientId)) : undefined, link: t.saleId ? `/ventes/${t.saleId}` : t.clientId ? `/clients/${t.clientId}` : '/agenda' })
  for (const n of d.notes) if (ok(`${n.texte} ${n.categorie ?? ''}`)) out.push({ type: 'Note', titre: n.texte.slice(0, 70), detail: n.categorie, link: '/notes' })
  return out.slice(0, limit)
}
