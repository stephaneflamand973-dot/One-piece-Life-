import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, StickyNote, Trash2 } from 'lucide-react'
import { dayKey, fmtDay } from '../lib/dates'
import { deleteNote } from '../services/actions'
import { clientName, norm, vehicleLabel } from '../services/logic'
import { useData } from '../ui/data'
import { useDialog } from '../ui/forms'
import { Badge, Button, Card, Empty, useUI } from '../ui/kit'
import { PageHead } from '../ui/shared'

export default function Notes() {
  const d = useData()
  const open = useDialog()
  const { confirm } = useUI()
  const [q, setQ] = useState('')
  const list = useMemo(() => d.notes.filter((n) => norm(`${n.texte} ${n.categorie ?? ''}`).includes(norm(q))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [d.notes, q])
  const link = (n: (typeof list)[number]) => {
    if (n.linkType === 'client') { const c = d.byClient.get(n.linkId!); return c ? { to: `/clients/${c.id}`, label: clientName(c) } : null }
    if (n.linkType === 'sale') { const s = d.sales.find((x) => x.id === n.linkId); return s ? { to: `/ventes/${s.id}`, label: s.vehiculeLabel } : null }
    if (n.linkType === 'vehicle') { const v = d.byVehicle.get(n.linkId!); return v ? { to: `/vehicules/${v.id}`, label: vehicleLabel(v) } : null }
    return null
  }
  return (
    <div>
      <PageHead title="Notes" back="/plus" right={<Button onClick={() => open('note')}><Plus size={18} /></Button>} />
      <input className="inp mb-4" placeholder="Rechercher dans les notes…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher dans les notes" />
      <div className="space-y-2">
        {list.map((n) => { const l = link(n); return (
          <Card key={n.id} className="p-4">
            <button type="button" className="block w-full whitespace-pre-line text-left text-sm" onClick={() => open('note', { noteId: n.id })}>{n.texte}</button>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {n.categorie && <Badge>{n.categorie}</Badge>}{l && <Link to={l.to} className="font-semibold text-accent">{l.label}</Link>}
              <span>créée le {fmtDay(dayKey(n.createdAt))}{n.updatedAt !== n.createdAt ? ` · modifiée le ${fmtDay(dayKey(n.updatedAt))}` : ''}</span>
              <button type="button" aria-label="Supprimer la note" className="ml-auto text-bad" onClick={async () => { if (await confirm({ title: 'Supprimer cette note ?', message: n.texte.slice(0, 120), confirmLabel: 'Supprimer', danger: true })) deleteNote(n.id) }}><Trash2 size={16} /></button>
            </div>
          </Card>) })}
        {!list.length && <Empty icon={<StickyNote size={28} />} title="Aucune note" action={<Button onClick={() => open('note')}>Nouvelle note</Button>}>Les notes peuvent être libres ou rattachées à un client, un véhicule ou une vente depuis leur fiche.</Empty>}
      </div>
    </div>
  )
}
