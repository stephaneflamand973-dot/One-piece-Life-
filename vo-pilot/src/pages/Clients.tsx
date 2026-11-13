import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Flame, Plus, Star, Users } from 'lucide-react'
import { fmtDateTime, relative } from '../lib/dates'
import { saveTask, snoozeTask } from '../services/actions'
import { clientName, clientView, isOverdue, leadDeadline, leadUrgency, nextTask, norm, type ViewId } from '../services/logic'
import { atTime, addDays, today } from '../lib/dates'
import { useData, useNow } from '../ui/data'
import { useDialog } from '../ui/forms'
import { Badge, Button, Chip, cx, Empty, useRun } from '../ui/kit'
import { PageHead, StageBadge } from '../ui/shared'

const VIEWS: { id: ViewId; label: string; tone?: 'bad' | 'warn' }[] = [
  { id: 'actifs', label: 'Actifs' }, { id: 'leads', label: 'Leads à traiter', tone: 'bad' }, { id: 'aujourdhui', label: 'Aujourd’hui' }, { id: 'retard', label: 'En retard', tone: 'warn' },
  { id: 'sans_action', label: 'Sans prochaine action', tone: 'warn' }, { id: 'devis', label: 'Devis sans réponse' }, { id: 'inactifs', label: 'Sans interaction' },
  { id: 'reactiver', label: 'À réactiver' }, { id: 'livres', label: 'Livrés' }, { id: 'perdus', label: 'Perdus' }, { id: 'favoris', label: 'Favoris' }, { id: 'tous', label: 'Tous' },
]

export default function Clients() {
  const d = useData()
  const now = useNow()
  const open = useDialog()
  const run = useRun()
  const [sp, setSp] = useSearchParams()
  const view = (sp.get('vue') as ViewId) || 'actifs'
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [multi, setMulti] = useState(false)
  const ctx = useMemo(() => ({ ...d, now }), [d, now])
  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.id, clientView(v.id, ctx).length])), [ctx])
  const list = useMemo(() => {
    const n = norm(q)
    const digits = q.replace(/\D/g, '')
    return clientView(view, ctx)
      .filter((c) => !n || norm(`${c.nom} ${c.prenom ?? ''} ${c.recherche?.texte ?? ''} ${c.recherche?.modele ?? ''}`).includes(n) || (digits.length > 3 && (c.tel ?? '').replace(/\D/g, '').includes(digits)))
      .map((c) => ({ c, next: nextTask(c.id, d.tasks) }))
      .sort((a, b) => (a.next?.due ?? 'z').localeCompare(b.next?.due ?? 'z') || b.c.updatedAt.localeCompare(a.c.updatedAt))
  }, [view, ctx, q, d.tasks])
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const bulkRelance = () => run(async () => {
    for (const id of sel) {
      const nt = nextTask(id, d.tasks)
      if (nt) await snoozeTask(nt.id, 1)
      else await saveTask({ type: 'relance', titre: 'Relance', clientId: id, due: atTime(addDays(today(), 1), '10:00') })
    }
    setSel(new Set()); setMulti(false)
  }, 'Relances programmées / reportées à demain')

  return (
    <div>
      <PageHead title="Clients & prospects" sub={`${d.clients.length} fiche${d.clients.length > 1 ? 's' : ''}`} right={<><Button variant="outline" size="sm" onClick={() => { setMulti(!multi); setSel(new Set()) }}>{multi ? 'Terminer' : 'Sélection'}</Button><Button onClick={() => open('prospect')}><Plus size={18} /><span className="hidden sm:inline">Prospect</span></Button></>} />
      <input className="inp mb-3" placeholder="Filtrer par nom, téléphone, véhicule recherché…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filtrer les clients" />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {VIEWS.map((v) => <Chip key={v.id} active={view === v.id} count={counts[v.id]} tone={v.tone} onClick={() => setSp({ vue: v.id }, { replace: true })}>{v.label}</Chip>)}
      </div>
      {multi && sel.size > 0 && (
        <div className="sticky top-16 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-navy px-4 py-2.5 text-sm text-white">
          <span className="font-semibold">{sel.size} sélectionné{sel.size > 1 ? 's' : ''}</span>
          <Button size="sm" className="ml-auto" onClick={bulkRelance}>Relance demain 10 h</Button>
        </div>
      )}
      <div className="space-y-2">
        {list.map(({ c, next }) => {
          const u = leadUrgency(c, d.settings, now)
          const late = next && isOverdue(next, now)
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-bold">{c.favori && <Star size={14} className="shrink-0 fill-current text-warn" />}{clientName(c)}{c.importance === 3 && <Flame size={14} className="shrink-0 text-warn" />}</p>
                  <p className="truncate text-sm text-muted">{[c.recherche?.modele ?? c.recherche?.texte ?? c.recherche?.categorie, c.recherche?.boite, c.recherche?.budgetMax ? `≤ ${c.recherche.budgetMax} €` : '', c.tel].filter(Boolean).join(' · ') || 'Besoin à qualifier'}</p>
                </div>
                <StageBadge c={c} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                {u && u !== 'traite' && <Badge tone={u === 'ok' ? 'warn' : 'bad'}>Lead · {relative(leadDeadline(c, d.settings)!, now)}</Badge>}
                {next ? <Badge tone={late ? 'warn' : 'neutral'}>{next.titre} · {next.due ? fmtDateTime(next.due) : 'sans date'}</Badge> : ['actif'].includes(d.settings.pipeline.find((p) => p.id === c.statut)?.kind ?? '') && <Badge tone="warn">Aucune prochaine action</Badge>}
                {c.consentement?.nePasContacter && <Badge tone="bad">Ne pas contacter</Badge>}
                {c.demo && <Badge>Démo</Badge>}
              </div>
            </>
          )
          return multi ? (
            <button key={c.id} type="button" onClick={() => toggle(c.id)} className={cx('block w-full rounded-2xl border bg-card p-3.5 text-left', sel.has(c.id) ? 'border-accent ring-2 ring-accent/30' : 'border-line')}>{body}</button>
          ) : (
            <Link key={c.id} to={`/clients/${c.id}`} className="block rounded-2xl border border-line bg-card p-3.5 transition hover:border-accent">{body}</Link>
          )
        })}
        {!list.length && (
          <Empty icon={<Users size={28} />} title={d.clients.length ? 'Aucune fiche dans cette vue' : 'Aucun prospect pour l’instant'} action={<Button onClick={() => open('prospect')}>Nouveau prospect</Button>}>
            {d.clients.length ? 'Changez de filtre ou créez un prospect.' : 'Un nom et un téléphone suffisent pour commencer.'}
          </Empty>
        )}
      </div>
    </div>
  )
}
