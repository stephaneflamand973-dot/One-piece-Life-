import { Link, useNavigate } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { dayKey, diffDays, fmtDay, today } from '../lib/dates'
import { clientName, nextTask, quoteTotals } from '../services/logic'
import { euro } from '../services/whatsapp'
import { useData } from '../ui/data'
import { Badge, Button, Empty } from '../ui/kit'
import { PageHead } from '../ui/shared'

export const QUOTE_LABEL = { brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé', expire: 'Expiré' } as const
export default function Devis() {
  const { quotes, byClient, tasks } = useData()
  const nav = useNavigate()
  const list = [...quotes].sort((a, b) => b.dateCreation.localeCompare(a.dateCreation))
  return (
    <div>
      <PageHead title="Devis" sub="Propositions commerciales non contractuelles" back="/plus" right={<Button onClick={() => nav('/devis/nouveau')}><Plus size={18} /><span className="hidden sm:inline">Devis</span></Button>} />
      <div className="space-y-2">
        {list.map((q) => {
          const age = q.dateEnvoi ? diffDays(today(), dayKey(q.dateEnvoi)) : null
          const sansRelance = q.statut === 'envoye' && !nextTask(q.clientId, tasks)
          return (
            <Link key={q.id} to={`/devis/${q.id}`} className="block rounded-2xl border border-line bg-card p-3.5 hover:border-accent">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="truncate font-bold">{clientName(byClient.get(q.clientId))}</p><p className="truncate text-sm text-muted">{q.vehiculeLabel} · {q.ref}</p></div>
                <div className="text-right"><p className="font-bold">{euro(quoteTotals(q).total)}</p><Badge tone={q.statut === 'envoye' ? 'accent' : q.statut === 'accepte' ? 'ok' : 'neutral'}>{QUOTE_LABEL[q.statut]}</Badge></div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">{q.dateEnvoi && <Badge>Envoyé le {fmtDay(dayKey(q.dateEnvoi))}{age ? ` · il y a ${age} j` : ''}</Badge>}{sansRelance && <Badge tone="warn">Aucune relance programmée</Badge>}</div>
            </Link>
          )
        })}
        {!list.length && <Empty icon={<FileText size={28} />} title="Aucun devis" action={<Button onClick={() => nav('/devis/nouveau')}>Créer un devis</Button>}>Sélectionnez un client et un véhicule : frais de dossier et carte grise sont préremplis.</Empty>}
      </div>
    </div>
  )
}
