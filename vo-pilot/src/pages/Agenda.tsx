import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react'
import type { Task } from '../lib/types'
import { addDays, addMonths, dayKey, fmtDay, fmtDayLong, fmtMonth, fmtTime, hhmm, minutesOf, startOfWeek, today, toLocalInput, weekday } from '../lib/dates'
import { download } from '../services/backup'
import { tasksToIcs } from '../services/ics'
import { freeSlots, isOverdue } from '../services/logic'
import { useData, useNow } from '../ui/data'
import { useDialog } from '../ui/forms'
import { Button, Card, Chip, cx, Section } from '../ui/kit'
import { PageHead, TaskRow } from '../ui/shared'

export default function Agenda() {
  const { tasks, clients, settings: s } = useData()
  const open = useDialog()
  const now = useNow()
  const [mode, setMode] = useState<'jour' | 'semaine' | 'mois'>('jour')
  const [day, setDay] = useState(today())
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) { if (!t.due || t.statut === 'annulee') continue; const k = dayKey(t.due); m.set(k, [...(m.get(k) ?? []), t]) }
    for (const l of m.values()) l.sort((a, b) => a.due!.localeCompare(b.due!))
    return m
  }, [tasks])
  const list = byDay.get(day) ?? []
  const retard = tasks.filter((t) => isOverdue(t, now) && dayKey(t.due!) < today())
  const step = (n: number) => setDay(mode === 'mois' ? `${addMonths(day.slice(0, 7), n)}-01` : addDays(day, n * (mode === 'semaine' ? 7 : 1)))
  const fixes = list.filter((t) => ['rdv', 'essai', 'livraison'].includes(t.type) && t.statut === 'ouverte')
  const libres = freeSlots(fixes.map((t) => { const m = minutesOf(toLocalInput(t.due).slice(11)); return { debut: m, fin: m + (t.dureeMin ?? 45) } }), s.profil)
  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(day), i))
  const month = day.slice(0, 7)
  const first = `${month}-01`
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i - weekday(first)))
  const dot = (t: Task) => (t.statut === 'faite' ? 'bg-ok' : ['rdv', 'essai'].includes(t.type) ? 'bg-accent' : t.type === 'livraison' ? 'bg-teal' : 'bg-warn')

  return (
    <div>
      <PageHead title="Agenda" back="/plus" sub="Agenda interne — non synchronisé avec Outlook" right={<><Button variant="outline" size="sm" title="Exporter en .ics pour Outlook / Calendrier" onClick={() => download('vo-pilot-agenda.ics', tasksToIcs(tasks, clients), 'text/calendar')}><Download size={16} /><span className="hidden sm:inline">ICS</span></Button><Button onClick={() => open('tache', { type: 'rdv' })}><Plus size={18} /></Button></>} />
      <div className="mb-3 flex items-center gap-2">
        {(['jour', 'semaine', 'mois'] as const).map((m) => <Chip key={m} active={mode === m} onClick={() => setMode(m)}>{m[0].toUpperCase() + m.slice(1)}</Chip>)}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setDay(today())}>Aujourd’hui</Button>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" aria-label="Précédent" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft" onClick={() => step(-1)}><ChevronLeft size={20} /></button>
        <p className="text-base font-bold cap">{mode === 'mois' ? fmtMonth(month) : mode === 'semaine' ? `Semaine du ${fmtDay(week[0], { day: 'numeric', month: 'long' })}` : fmtDayLong(day)}</p>
        <button type="button" aria-label="Suivant" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft" onClick={() => step(1)}><ChevronRight size={20} /></button>
      </div>

      {mode === 'jour' && <>
        {day === today() && retard.length > 0 && <Section title={`En retard (${retard.length})`}><div className="space-y-2">{retard.slice(0, 6).map((t) => <TaskRow key={t.id} t={t} now={now} />)}</div></Section>}
        <Section title="Planning">
          <div className="space-y-2">{list.map((t) => <TaskRow key={t.id} t={t} now={now} />)}</div>
          {!list.length && <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">Rien de programmé ce jour-là.</p>}
        </Section>
        <Section title="Créneaux libres">
          <Card className="divide-y divide-line">{libres.map((l) => <div key={l.debut} className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="font-semibold tabular-nums">{hhmm(l.debut)} – {hhmm(l.fin)}</span><Button size="sm" variant="ghost" onClick={() => open('tache', { type: 'rdv' })}>Réserver</Button></div>)}{!libres.length && <p className="px-4 py-3 text-sm text-muted">Aucun créneau libre de 30 min sur les horaires habituels ({s.profil.debut}–{s.profil.fin}).</p>}</Card>
          <p className="mt-1.5 px-1 text-xs text-muted">Gardez de la marge pour les clients spontanés et les imprévus : VO PILOT ne remplit pas ces créneaux et ne déplace jamais un rendez-vous client sans vous.</p>
        </Section>
      </>}

      {mode === 'semaine' && (
        <div className="grid gap-2 md:grid-cols-7">
          {week.map((k) => { const l = byDay.get(k) ?? []; return (
            <button key={k} type="button" onClick={() => { setDay(k); setMode('jour') }} className={cx('rounded-2xl border bg-card p-3 text-left md:min-h-40', k === today() ? 'border-accent' : 'border-line')}>
              <p className="text-xs font-bold cap text-muted">{fmtDay(k, { weekday: 'short', day: 'numeric' })}</p>
              <div className="mt-1.5 space-y-1">{l.slice(0, 5).map((t) => <p key={t.id} className={cx('flex items-center gap-1.5 truncate text-xs', t.statut === 'faite' && 'text-muted line-through')}><span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', dot(t))} /><span className="tabular-nums">{fmtTime(t.due)}</span><span className="truncate">{t.titre}</span></p>)}{l.length > 5 && <p className="text-xs text-muted">+{l.length - 5}</p>}{!l.length && <p className="text-xs text-muted">—</p>}</div>
            </button>) })}
        </div>
      )}

      {mode === 'mois' && (
        <Card className="p-2">
          <div className="grid grid-cols-7 text-center text-[11px] font-bold uppercase text-muted">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x, i) => <span key={i} className="py-1">{x}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((k) => { const l = byDay.get(k) ?? []; return (
              <button key={k} type="button" onClick={() => { setDay(k); setMode('jour') }} className={cx('flex aspect-square flex-col items-center justify-center rounded-xl text-sm', k.slice(0, 7) !== month && 'opacity-30', k === today() ? 'bg-accent font-bold text-white' : 'hover:bg-soft')}>
                {+k.slice(8)}
                <span className="mt-0.5 flex h-1.5 gap-0.5">{l.slice(0, 3).map((t) => <span key={t.id} className={cx('h-1.5 w-1.5 rounded-full', k === today() ? 'bg-white' : dot(t))} />)}</span>
              </button>) })}
          </div>
        </Card>
      )}
    </div>
  )
}
