// Composants métier réutilisés par plusieurs écrans.
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarClock, Car, Check, ChevronRight, Clock, ClipboardList, MessageCircle, Phone, Star, Truck, Users, Wrench } from 'lucide-react'
import type { Client, Sale, Task } from '../lib/types'
import { fmtDateTime, fmtTime, relative } from '../lib/dates'
import { completeTask, snoozeTask } from '../services/actions'
import { clientName, isOverdue, isToday, prepState, SALE_STATUS, stageLabel } from '../services/logic'
import { Badge, Button, cx, Progress, type Tone, useRun } from './kit'
import { useData } from './data'
import { useDialog } from './forms'

export function PageHead({ title, sub, back, right }: { title: ReactNode; sub?: ReactNode; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="mb-4 flex items-start gap-2">
      {back && <button type="button" aria-label="Retour" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} className="-ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-soft"><ArrowLeft size={20} /></button>}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold tracking-tight md:text-2xl">{title}</h1>
        {sub && <div className="mt-0.5 text-sm text-muted">{sub}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

export const TASK_ICON: Record<Task['type'], ReactNode> = {
  appel: <Phone size={16} />, relance: <Phone size={16} />, rdv: <Users size={16} />, essai: <Car size={16} />, livraison: <Truck size={16} />,
  intervention: <Wrench size={16} />, whatsapp: <MessageCircle size={16} />, tache: <ClipboardList size={16} />,
}
export const TASK_LABEL: Record<Task['type'], string> = { appel: 'Appel', relance: 'Relance', rdv: 'Rendez-vous', essai: 'Essai', livraison: 'Livraison', intervention: 'Intervention', whatsapp: 'WhatsApp', tache: 'Tâche' }

/** Ligne de tâche avec les actions express : fait (avec résultat), reporter, ouvrir. */
export function TaskRow({ t, showClient = true, now }: { t: Task; showClient?: boolean; now?: number }) {
  const { byClient } = useData()
  const open = useDialog()
  const run = useRun()
  const nav = useNavigate()
  const c = t.clientId ? byClient.get(t.clientId) : undefined
  const late = isOverdue(t, now)
  const done = t.statut === 'faite'
  const express = () => {
    if (c && ['appel', 'relance', 'rdv', 'essai', 'whatsapp'].includes(t.type)) open('interaction', { clientId: c.id, taskId: t.id, type: t.type === 'rdv' ? 'rdv' : t.type === 'essai' ? 'essai' : t.type === 'whatsapp' ? 'whatsapp' : 'appel_sortant' })
    else run(() => completeTask(t.id), 'Fait')
  }
  return (
    <div className={cx('flex items-center gap-2 rounded-2xl border bg-card p-2.5', late && !done ? 'border-warn/50' : 'border-line', done && 'opacity-60')}>
      <button type="button" aria-label={done ? 'Fait' : 'Marquer comme fait'} disabled={done} onClick={express} className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full border-2', done ? 'border-ok bg-ok-soft text-ok' : 'border-line text-transparent hover:border-ok hover:text-ok')}><Check size={18} /></button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => (t.saleId ? nav(`/ventes/${t.saleId}`) : c ? nav(`/clients/${c.id}`) : open('tache', { taskId: t.id }))}>
        <span className="flex items-center gap-1.5 text-sm font-semibold"><span className="text-muted">{TASK_ICON[t.type]}</span><span className={cx('truncate', done && 'line-through')}>{showClient && c ? `${clientName(c)} — ` : ''}{t.titre}</span></span>
        <span className={cx('mt-0.5 flex items-center gap-1 text-xs', late && !done ? 'font-semibold text-warn' : 'text-muted')}>
          <Clock size={12} />{t.due ? fmtDateTime(t.due) : 'Sans échéance'}{late && !done && !isToday(t) ? ` · ${relative(t.due, now)}` : ''}
        </span>
      </button>
      {!done && <>
        <Button size="sm" variant="ghost" aria-label="Reporter à demain" title="Reporter à demain" onClick={() => run(() => snoozeTask(t.id, 1), 'Reporté à demain')}><CalendarClock size={18} /></Button>
        <Button size="sm" variant="ghost" aria-label="Modifier" onClick={() => open('tache', { taskId: t.id })}><ChevronRight size={18} /></Button>
      </>}
    </div>
  )
}

export function StageBadge({ c }: { c: Client }) {
  const { settings } = useData()
  const kind = settings.pipeline.find((p) => p.id === c.statut)?.kind
  const tone: Tone = kind === 'gagne' ? 'ok' : kind === 'perdu' ? 'neutral' : kind === 'dormant' ? 'teal' : 'accent'
  return <Badge tone={tone}>{stageLabel(settings.pipeline, c.statut)}</Badge>
}

export const SALE_TONE: Record<Sale['statut'], Tone> = { commande_attente: 'neutral', bc_signe: 'accent', financement_attente: 'warn', paiement_attente: 'warn', confirmee: 'accent', preparation: 'accent', pret: 'ok', livre: 'ok', annule: 'neutral' }
export const PREP_TONE = { bloque: 'bad', retard: 'bad', risque: 'warn', en_cours: 'accent', pret: 'ok', livre: 'ok' } as const
export const PREP_LABEL = { bloque: 'Bloqué', retard: 'En retard', risque: 'À risque', en_cours: 'En cours', pret: 'Prêt à livrer', livre: 'Livré' } as const

export function SaleCard({ sale }: { sale: Sale }) {
  const { byClient, interventions, settings } = useData()
  const st = prepState(sale, interventions, settings)
  const enPrep = !['annule', 'commande_attente'].includes(sale.statut)
  return (
    <Link to={`/ventes/${sale.id}`} className={cx('block rounded-2xl border bg-card p-3.5 transition hover:border-accent', st.etat === 'bloque' || st.etat === 'retard' ? 'border-bad/50' : 'border-line')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold">{sale.vehiculeLabel}</p>
          <p className="truncate text-sm text-muted">{clientName(byClient.get(sale.clientId))} · {sale.ref}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {enPrep && sale.statut !== 'livre' ? <Badge tone={PREP_TONE[st.etat]}>{PREP_LABEL[st.etat]}</Badge> : <Badge tone={SALE_TONE[sale.statut]}>{SALE_STATUS[sale.statut]}</Badge>}
          {sale.favori && <Star size={14} className="fill-current text-warn" />}
        </div>
      </div>
      {enPrep && sale.statut !== 'livre' && (
        <div className="mt-3">
          <Progress value={st.faits} max={st.total} tone={st.etat === 'bloque' || st.etat === 'retard' ? 'bad' : st.pret ? 'ok' : 'accent'} />
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 text-xs text-muted">
            <span>{st.faits}/{st.total} étapes · {sale.livraisonPrevue ? `livraison ${fmtDateTime(sale.livraisonPrevue)}` : 'livraison non programmée'}</span>
          </div>
          {(st.bloquees.length > 0 || st.interventionsBloquees.length > 0) && <p className="mt-1 text-xs font-semibold text-bad">Bloqué : {[...st.bloquees.map((b) => `${b.label}${b.commentaire ? ` (${b.commentaire})` : ''}`), ...st.interventionsBloquees.filter((i) => !i.stepId).map((i) => i.type)].join(' · ')}</p>}
          {!st.bloquees.length && st.manquantes.length > 0 && <p className="mt-1 truncate text-xs text-muted">Reste : {st.manquantes.map((m) => m.label).join(', ')}</p>}
        </div>
      )}
    </Link>
  )
}
export { fmtTime }
