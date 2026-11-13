import { Link, useNavigate } from 'react-router-dom'
import { HeartHandshake, MessageCircle } from 'lucide-react'
import { diffDays, fmtDay, fmtDateTime, today } from '../lib/dates'
import { setClientStatus } from '../services/actions'
import { clientName, openTasks } from '../services/logic'
import { useData } from '../ui/data'
import { useDialog } from '../ui/forms'
import { Badge, Button, Card, Empty, Section, useRun } from '../ui/kit'
import { PageHead, TaskRow } from '../ui/shared'

export default function Fidelisation() {
  const d = useData()
  const nav = useNavigate()
  const open = useDialog()
  const run = useRun()
  const livres = d.sales.filter((x) => x.statut === 'livre').sort((a, b) => (b.livraisonEffective ?? '').localeCompare(a.livraisonEffective ?? ''))
  const suivis = openTasks(d.tasks).filter((t) => t.autoKey?.startsWith('suivi:')).sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
  const dormants = d.clients.filter((c) => d.settings.pipeline.find((p) => p.id === c.statut)?.kind === 'dormant')
  return (
    <div>
      <PageHead title="Fidélisation" sub="La relation continue après la livraison" back="/plus" />
      <Section title={`Suivis programmés (${suivis.length})`}>
        <div className="space-y-2">{suivis.map((t) => <TaskRow key={t.id} t={t} />)}</div>
        {!suivis.length && <p className="px-1 text-sm text-muted">Aucun suivi en attente. À chaque livraison, des suivis sont proposés à J+{d.settings.delais.suiviLivraisonJours.join(' et J+')} (réglable, et jamais pour un client qui refuse d’être contacté).</p>}
      </Section>
      <Section title={`Clients livrés (${livres.length})`}>
        <div className="space-y-2">
          {livres.map((x) => { const c = d.byClient.get(x.clientId); const j = x.livraisonEffective ? diffDays(today(), x.livraisonEffective) : null; const ok = c && !c.consentement?.nePasContacter; return (
            <Card key={x.id} className="p-3.5">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><Link to={`/clients/${x.clientId}`} className="font-bold hover:text-accent">{clientName(c)}</Link><p className="truncate text-sm text-muted">{x.vehiculeLabel}</p></div><Badge tone="ok">Livré le {fmtDay(x.livraisonEffective)}{j !== null ? ` · J+${j}` : ''}</Badge></div>
              {x.exception?.active && !x.exception.resolue && <p className="mt-1.5 text-sm font-semibold text-warn">Intervention restante : {x.exception.interventionRestante}{x.exception.rdvRetour ? ` · retour ${fmtDateTime(x.exception.rdvRetour)}` : ''}</p>}
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={!ok || !c?.consentement?.whatsapp} onClick={() => nav(`/whatsapp?client=${x.clientId}&modele=${j !== null && j <= 2 ? 'remerciement' : 'suivi_apres_vente'}${x.vehicleId ? `&vehicule=${x.vehicleId}` : ''}`)}><MessageCircle size={15} />{j !== null && j <= 2 ? 'Remercier' : 'Prendre des nouvelles'}</Button>
                <Button size="sm" variant="outline" disabled={!ok} onClick={() => open('tache', { clientId: x.clientId, type: 'relance' })}>Rappel personnalisé</Button>
                <Button size="sm" variant="ghost" disabled={!ok} onClick={() => run(() => setClientStatus(x.clientId, 'reactiver'), 'Nouveau besoin : dossier passé « À réactiver »')}>Nouveau besoin détecté</Button>
                {!ok && <span className="self-center text-xs text-bad">Ne souhaite pas être contacté</span>}
              </div>
            </Card>) })}
          {!livres.length && <Empty icon={<HeartHandshake size={28} />} title="Aucun client livré pour l’instant">Les clients apparaissent ici dès qu’une vente passe au statut « Livré ».</Empty>}
        </div>
      </Section>
      <Section title={`Prospects à réactiver (${dormants.length})`}>
        <div className="space-y-2">{dormants.map((c) => <Link key={c.id} to={`/clients/${c.id}`} className="block rounded-2xl border border-line bg-card p-3.5 text-sm font-semibold hover:border-accent">{clientName(c)}<span className="block text-xs font-normal text-muted">{c.recherche?.modele ?? c.recherche?.texte ?? 'Besoin à requalifier'}</span></Link>)}{!dormants.length && <p className="px-1 text-sm text-muted">Aucun.</p>}</div>
      </Section>
      <p className="px-1 text-xs text-muted">Demandes d’avis et parrainage : à pratiquer uniquement si votre employeur les autorise. Aucun message n’est envoyé automatiquement.</p>
    </div>
  )
}
