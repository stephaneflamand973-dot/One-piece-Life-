import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { dayKey, fmtDay, fmtDayLong, fmtTime } from '../lib/dates'
import { clientName, prepState, type PrepState } from '../services/logic'
import { useData } from '../ui/data'
import { useDialog } from '../ui/forms'
import { Badge, Button, Card, Chip, Empty, Section } from '../ui/kit'
import { PageHead, PREP_LABEL, PREP_TONE, SaleCard } from '../ui/shared'

const ORDER: PrepState['etat'][] = ['bloque', 'retard', 'risque', 'en_cours', 'pret']
const TITLES: Record<string, string> = { bloque: 'Bloqués', retard: 'En retard', risque: 'Livraison proche, préparation incomplète', en_cours: 'En préparation', pret: 'Prêts à livrer' }

export default function Livraisons() {
  const { sales, interventions, settings, byClient } = useData()
  const open = useDialog()
  const [tab, setTab] = useState<'tableau' | 'calendrier' | 'livrees'>('tableau')
  const rows = useMemo(() => sales.filter((x) => ['confirmee', 'preparation', 'pret'].includes(x.statut)).map((sale) => ({ sale, st: prepState(sale, interventions, settings) })), [sales, interventions, settings])
  const livrees = sales.filter((x) => x.statut === 'livre').sort((a, b) => (b.livraisonEffective ?? '').localeCompare(a.livraisonEffective ?? ''))
  const cal = rows.filter((r) => r.sale.livraisonPrevue).sort((a, b) => a.sale.livraisonPrevue!.localeCompare(b.sale.livraisonPrevue!))
  const days = [...new Set(cal.map((r) => dayKey(r.sale.livraisonPrevue!)))]
  const docs = [...rows.map((r) => r.sale), ...livrees].filter((x) => x.documents.some((d) => d.statut === 'manquant'))
  return (
    <div>
      <PageHead title="Préparations & livraisons" sub={`${rows.length} dossier${rows.length > 1 ? 's' : ''} en cours`} />
      <div className="mb-4 grid grid-cols-5 gap-2">
        {ORDER.map((e) => { const n = rows.filter((r) => r.st.etat === e).length; return <div key={e} className="rounded-xl border border-line bg-card p-2 text-center"><p className="text-xl font-extrabold tabular-nums">{n}</p><Badge tone={n ? PREP_TONE[e] : 'neutral'} className="!px-1.5 !text-[10px]">{e === 'pret' ? 'Prêts' : e === 'bloque' ? 'Bloqués' : PREP_LABEL[e]}</Badge></div> })}
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={tab === 'tableau'} onClick={() => setTab('tableau')}>Tableau</Chip>
        <Chip active={tab === 'calendrier'} count={cal.length} onClick={() => setTab('calendrier')}>Calendrier</Chip>
        <Chip active={tab === 'livrees'} count={livrees.length} onClick={() => setTab('livrees')}>Livrées</Chip>
      </div>

      {tab === 'tableau' && <>
        {ORDER.map((e) => {
          const list = rows.filter((r) => r.st.etat === e)
          if (!list.length) return null
          return <Section key={e} title={`${TITLES[e]} (${list.length})`}><div className="grid gap-3 md:grid-cols-2">{list.map((r) => <SaleCard key={r.sale.id} sale={r.sale} />)}</div></Section>
        })}
        {!rows.length && <Empty icon={<Truck size={28} />} title="Aucune préparation en cours" action={<Button onClick={() => open('vente')}>Nouvelle vente</Button>}>Chaque vente confirmée apparaît ici avec sa checklist, ses blocages et sa date de livraison.</Empty>}
        {docs.length > 0 && (
          <Section title="Documents restant à récupérer">
            <Card className="divide-y divide-line">{docs.map((x) => <Link key={x.id} to={`/ventes/${x.id}`} className="block px-4 py-2.5 text-sm hover:bg-soft"><span className="font-semibold">{x.vehiculeLabel} — {clientName(byClient.get(x.clientId))}</span><span className="block text-xs text-muted">{x.documents.filter((d) => d.statut === 'manquant').map((d) => d.type).join(', ')}</span></Link>)}</Card>
          </Section>
        )}
      </>}

      {tab === 'calendrier' && <>
        {days.map((day) => (
          <Section key={day} title={<span className="cap">{fmtDayLong(day)}</span>}>
            <Card className="divide-y divide-line">
              {cal.filter((r) => dayKey(r.sale.livraisonPrevue!) === day).map(({ sale, st }) => (
                <Link key={sale.id} to={`/ventes/${sale.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-soft">
                  <span className="w-12 text-sm font-bold tabular-nums">{fmtTime(sale.livraisonPrevue)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{sale.vehiculeLabel}</span><span className="block truncate text-xs text-muted">{clientName(byClient.get(sale.clientId))} · {st.faits}/{st.total} étapes</span></span>
                  <Badge tone={PREP_TONE[st.etat]}>{PREP_LABEL[st.etat]}</Badge>
                </Link>
              ))}
            </Card>
          </Section>
        ))}
        {!cal.length && <Empty title="Aucune livraison programmée">Indiquez la date de livraison prévue dans chaque dossier de vente.</Empty>}
        {rows.some((r) => !r.sale.livraisonPrevue) && <p className="px-1 text-sm text-warn">{rows.filter((r) => !r.sale.livraisonPrevue).length} dossier(s) sans date de livraison prévue.</p>}
      </>}

      {tab === 'livrees' && (
        <div className="space-y-2">
          {livrees.map((x) => <Link key={x.id} to={`/ventes/${x.id}`} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-card p-3.5 hover:border-accent"><span className="min-w-0"><span className="block truncate font-semibold">{x.vehiculeLabel}</span><span className="text-xs text-muted">{clientName(byClient.get(x.clientId))}</span></span><Badge tone="ok">Livré le {fmtDay(x.livraisonEffective)}</Badge></Link>)}
          {!livrees.length && <Empty title="Aucune livraison effectuée enregistrée" />}
        </div>
      )}
    </div>
  )
}
