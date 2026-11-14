import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, Check, ChevronRight, Coffee, Play, Sparkles, Target } from 'lucide-react'
import { dayKey, diffDays, fmtDateTime, fmtDayLong, fmtTime, hhmm, minutesOf, monthKey, relative, today, toLocalInput } from '../lib/dates'
import { completeTask, markLeadHandled, snoozePriority } from '../services/actions'
import { download, exportBackup, wipeDemo } from '../services/backup'
import { loadDemo } from '../services/demo'
import { clientView, computePriorities, freeSlots, hasBareme, isActiveStage, isOverdue, isToday, monthMoney, openTasks, pace, dayRecap, salesOfMonth, type Priority } from '../services/logic'
import { euro } from '../services/whatsapp'
import { useData, useNow } from '../ui/data'
import { QUICK, useDialog } from '../ui/forms'
import { Badge, Button, Card, cx, Empty, Progress, Section, Stat, useRun, useUI } from '../ui/kit'
import { TASK_ICON, TASK_LABEL } from '../ui/shared'

function PriorityCard({ p, rank }: { p: Priority; rank: number }) {
  const { tasks } = useData()
  const open = useDialog()
  const nav = useNavigate()
  const run = useRun()
  const now = useNow()
  const task = p.taskId ? tasks.find((t) => t.id === p.taskId) : undefined
  const tone = p.niveau === 'critique' ? 'bad' : p.niveau === 'urgent' ? 'warn' : 'accent'

  const executer = () => {
    if (p.kind === 'lead') return open('interaction', { clientId: p.clientId, type: 'appel_sortant' })
    if (p.kind === 'blocage' || p.kind === 'livraison') return nav(`/ventes/${p.saleId}`)
    if (p.kind === 'devis') return open('interaction', { clientId: p.clientId, type: 'appel_sortant' })
    if (p.kind === 'sans_action') return open('tache', { clientId: p.clientId, type: 'relance' })
    if (task?.saleId) return nav(`/ventes/${task.saleId}`)
    if (task && p.clientId) return open('interaction', { clientId: p.clientId, taskId: task.id, type: task.type === 'rdv' ? 'rdv' : task.type === 'essai' ? 'essai' : task.type === 'whatsapp' ? 'whatsapp' : 'appel_sortant' })
    if (task) return open('tache', { taskId: task.id })
  }
  const valider = () => {
    if (p.kind === 'lead') return run(() => markLeadHandled(p.clientId!), 'Lead marqué traité dans VO PILOT — pensez à UpYourLeads')
    if (task) return run(() => completeTask(task.id), 'Fait')
    return executer()
  }
  const validable = p.kind === 'lead' || p.kind === 'task'
  return (
    <Card className={cx('relative overflow-hidden p-4', p.niveau === 'critique' && 'border-bad/60', p.niveau === 'urgent' && 'border-warn/60')}>
      <div className={cx('absolute inset-y-0 left-0 w-1.5', p.niveau === 'critique' ? 'bg-bad' : p.niveau === 'urgent' ? 'bg-warn' : 'bg-accent')} />
      <div className="flex items-start gap-3 pl-1.5">
        <div className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold', p.niveau === 'critique' ? 'bg-bad-soft text-bad' : p.niveau === 'urgent' ? 'bg-warn-soft text-warn' : 'bg-accent-soft text-accent')}>{rank}</div>
        <div className="min-w-0 flex-1">
          <button type="button" className="block w-full text-left" onClick={() => (p.saleId ? nav(`/ventes/${p.saleId}`) : p.clientId ? nav(`/clients/${p.clientId}`) : executer())}>
            <p className="truncate text-base font-bold">{p.titre}</p>
            <p className="text-sm font-medium">{p.action}</p>
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={tone}>{p.niveau === 'critique' && <AlertTriangle size={12} />}{p.raison}</Badge>
            {p.echeance && <Badge>{p.kind === 'lead' ? `Échéance ${fmtTime(p.echeance)} · ${relative(p.echeance, now)}` : fmtDateTime(p.echeance)}</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={executer}><Play size={15} />{p.kind === 'blocage' || p.kind === 'livraison' ? 'Ouvrir le dossier' : p.kind === 'sans_action' ? 'Planifier' : 'Exécuter'}</Button>
            <Button size="sm" variant="outline" onClick={() => run(() => snoozePriority(p.key, 1), 'Reporté à demain')}><CalendarClock size={15} />Reporter</Button>
            {validable && <Button size="sm" variant="ok" onClick={valider}><Check size={15} />Valider</Button>}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const d = useData()
  const { settings: s, clients, tasks, sales, quotes, interventions } = d
  const now = useNow()
  const open = useDialog()
  const nav = useNavigate()
  const run = useRun()
  const { confirm } = useUI()
  const ctx = useMemo(() => ({ ...d, now }), [d, now])
  const priorities = useMemo(() => computePriorities(ctx), [ctx])
  const mois = monthKey()
  const jour = today()

  const ventes = salesOfMonth(sales, mois, s).length
  const obj = s.profil.objectifMensuel
  const money = monthMoney(sales, mois, s)
  const ouvertes = openTasks(tasks)
  const duJour = ouvertes.filter((t) => t.due && isToday(t)).sort((a, b) => a.due!.localeCompare(b.due!))
  const enRetard = ouvertes.filter((t) => isOverdue(t, now) && !isToday(t))
  const rdvAVenir = ouvertes.filter((t) => ['rdv', 'essai'].includes(t.type) && t.due && new Date(t.due).getTime() >= now).length
  const actifs = clients.filter((c) => isActiveStage(s.pipeline, c.statut)).length
  const devisAttente = quotes.filter((q) => q.statut === 'envoye').length
  const livraisons = sales.filter((x) => !['livre', 'annule'].includes(x.statut)).length

  // Planning : événements à heure fixe + créneaux libres ; les relances restent « à caser », sans remplir la journée.
  const fixes = duJour.filter((t) => ['rdv', 'essai', 'livraison'].includes(t.type))
  const souples = duJour.filter((t) => !['rdv', 'essai', 'livraison'].includes(t.type))
  const busy = fixes.map((t) => { const m = minutesOf(toLocalInput(t.due).slice(11)); return { debut: m, fin: m + (t.dureeMin ?? 45) } })
  const libres = freeSlots(busy, s.profil)
  const nowMin = minutesOf(toLocalInput(new Date(now).toISOString()).slice(11))
  type Item = { min: number; kind: 'fixe' | 'libre' | 'pause'; label: string; sub?: string; link?: string; type?: keyof typeof TASK_ICON }
  const items: Item[] = [
    ...fixes.map((t): Item => ({ min: minutesOf(toLocalInput(t.due).slice(11)), kind: 'fixe', label: `${TASK_LABEL[t.type]} — ${t.titre}`, sub: t.clientId ? d.byClient.get(t.clientId)?.nom : undefined, link: t.saleId ? `/ventes/${t.saleId}` : t.clientId ? `/clients/${t.clientId}` : undefined, type: t.type })),
    ...libres.map((l): Item => ({ min: l.debut, kind: 'libre', label: `Créneau libre jusqu’à ${hhmm(l.fin)}`, sub: 'Clients spontanés, appels entrants, imprévus' })),
    { min: minutesOf(s.profil.pauseDebut), kind: 'pause' as const, label: `Pause jusqu’à ${s.profil.pauseFin}` },
  ].sort((a, b) => a.min - b.min)

  const vide = !clients.length && !d.vehicles.length && !sales.length
  const raccourcis = QUICK.filter((q) => s.raccourcis.includes(q.id))

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-medium cap text-muted">{fmtDayLong(jour)}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{s.profil.nom ? `Bonjour ${s.profil.nom.split(' ')[0]}` : 'Bonjour'}</h1>
      </div>

      {s.demoChargee && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn">
          <span><b>Données de démonstration fictives.</b> Elles ne reflètent aucun résultat réel.</span>
          <Button size="sm" variant="outline" onClick={async () => { if (await confirm({ title: 'Supprimer la démonstration ?', message: 'Toutes les données fictives seront effacées. Vos propres saisies sont conservées.', confirmLabel: 'Supprimer', danger: true })) run(wipeDemo, 'Données de démonstration supprimées') }}>Supprimer la démo</Button>
        </div>
      )}
      {!vide && !s.demoChargee && (!s.derniereSauvegarde || diffDays(jour, dayKey(s.derniereSauvegarde)) >= 7) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-card px-4 py-3 text-sm">
          <span>{s.derniereSauvegarde ? `Dernière sauvegarde il y a ${diffDays(jour, dayKey(s.derniereSauvegarde))} jours.` : 'Aucune sauvegarde exportée pour l’instant.'} <span className="text-muted">Vos données ne sont que sur cet appareil.</span></span>
          <Button size="sm" variant="soft" onClick={() => run(async () => { const b = await exportBackup(); download(`vo-pilot-sauvegarde-${jour}.json`, JSON.stringify(b)) }, 'Sauvegarde exportée')}>Sauvegarder maintenant</Button>
        </div>
      )}
      {vide && !s.demoChargee && (
        <Card className="mb-5 p-5">
          <p className="flex items-center gap-2 text-base font-bold"><Sparkles size={18} className="text-accent" />Bienvenue dans VO PILOT</p>
          <p className="mt-1 text-sm text-muted">Commencez par créer un prospect ou ajouter un véhicule. Vous pouvez aussi charger des données <b>fictives</b> pour découvrir l’application ; elles sont identifiées et supprimables en un geste.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => open('prospect')}>Créer mon premier prospect</Button>
            <Button variant="outline" onClick={() => run(loadDemo, 'Démonstration chargée')}>Charger la démonstration</Button>
            <Button variant="ghost" onClick={() => nav('/parametres')}>Régler mon profil</Button>
          </div>
        </Card>
      )}

      <Section title="Mes trois priorités" right={priorities.length > 3 ? <span className="text-xs text-muted">+{priorities.length - 3} autres en attente</span> : undefined}>
        {priorities.length ? (
          <div className="grid gap-3 lg:grid-cols-3">{priorities.slice(0, 3).map((p, i) => <PriorityCard key={p.key} p={p} rank={i + 1} />)}</div>
        ) : (
          <Empty icon={<Check size={28} />} title="Rien d’urgent pour l’instant">{vide ? 'Vos priorités apparaîtront ici dès que vous aurez des prospects, des relances ou des livraisons.' : 'Aucune relance échue, aucun lead en attente, aucune livraison bloquée dans vos données.'}</Empty>
        )}
        <p className="mt-2 px-1 text-xs text-muted">Classement établi sur des faits saisis : urgence, échéance, blocage, statut, importance, ancienneté. Ce n’est pas une prédiction de vente.</p>
      </Section>

      <Section title="Ce mois-ci">
        <Card className="mb-3 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><Target size={14} />Ventes / objectif</p>
              <p className="text-3xl font-extrabold tabular-nums">{ventes}<span className="text-lg font-semibold text-muted"> / {obj}</span></p>
            </div>
            <p className="text-right text-sm font-medium">{ventes >= obj ? <span className="text-ok">Objectif atteint</span> : <>{obj - ventes} vente{obj - ventes > 1 ? 's' : ''} restante{obj - ventes > 1 ? 's' : ''}</>}<br /><span className="text-xs text-muted">Progression visée : {s.profil.objectifProgression}</span></p>
          </div>
          <div className="mt-3"><Progress value={ventes} max={obj} tone={ventes >= obj ? 'ok' : 'accent'} /></div>
          {(() => { const p = pace(ventes, obj, jour); return p.tousLesJours !== null ? <p className="mt-2 text-xs text-muted">Rythme nécessaire : {p.restantes} vente{p.restantes > 1 ? 's' : ''} en {p.joursRestants} jour{p.joursRestants > 1 ? 's' : ''} calendaire{p.joursRestants > 1 ? 's' : ''}, soit environ une tous les {String(p.tousLesJours).replace('.', ',')} jours.</p> : null })()}
        </Card>
        {(() => { const r = dayRecap(ctx, jour); return <p className="mb-3 px-1 text-sm">Aujourd’hui : <b>{r.echanges}</b> échange{r.echanges > 1 ? 's' : ''} enregistré{r.echanges > 1 ? 's' : ''} · <b>{r.faites}</b> action{r.faites > 1 ? 's' : ''} faite{r.faites > 1 ? 's' : ''} · <b>{r.prospects}</b> nouveau{r.prospects > 1 ? 'x' : ''} prospect{r.prospects > 1 ? 's' : ''}</p> })()}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Relances en retard" value={enRetard.length} tone={enRetard.length ? 'warn' : undefined} onClick={() => nav('/clients?vue=retard')} />
          <Stat label="Rendez-vous prévus" value={rdvAVenir} onClick={() => nav('/agenda')} />
          <Stat label="Prospects actifs" value={actifs} onClick={() => nav('/clients?vue=actifs')} />
          <Stat label="Devis en attente" value={devisAttente} onClick={() => nav('/devis')} />
          <Stat label="Livraisons à venir" value={livraisons} onClick={() => nav('/livraisons')} />
          <Stat label="Commissions estimées" value={hasBareme(s) ? euro((money.estime ?? 0) + money.bonus) : '—'} sub={hasBareme(s) ? 'selon votre barème' : 'barème à renseigner'} onClick={() => nav('/commissions')} />
        </div>
      </Section>

      <div className="grid gap-x-6 lg:grid-cols-2">
        <Section title="Planning du jour" right={<Link to="/agenda" className="flex items-center text-xs font-semibold text-accent">Agenda<ChevronRight size={14} /></Link>}>
          <Card className="divide-y divide-line">
            {items.map((it, i) => {
              const passe = it.kind !== 'fixe' && it.min < nowMin - 60 && i < items.length - 1 && items[i + 1].min <= nowMin
              const inner = (
                <div className={cx('flex items-center gap-3 px-4 py-2.5', passe && 'opacity-40')}>
                  <span className="w-11 shrink-0 text-sm font-bold tabular-nums">{hhmm(it.min)}</span>
                  {it.kind === 'fixe' ? <span className="text-accent">{TASK_ICON[it.type!]}</span> : it.kind === 'pause' ? <Coffee size={16} className="text-muted" /> : <span className="h-2 w-2 rounded-full bg-ok" />}
                  <span className="min-w-0 flex-1"><span className={cx('block truncate text-sm', it.kind === 'fixe' ? 'font-semibold' : 'text-muted')}>{it.label}</span>{it.sub && <span className="block truncate text-xs text-muted">{it.sub}</span>}</span>
                </div>
              )
              return it.link ? <Link key={i} to={it.link} className="block hover:bg-soft">{inner}</Link> : <div key={i}>{inner}</div>
            })}
          </Card>
          {souples.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 px-1 text-xs font-semibold text-muted">À caser aujourd’hui ({souples.length}) — sans heure imposée</p>
              <div className="space-y-2">{souples.slice(0, 5).map((t) => <MiniTask key={t.id} id={t.id} />)}</div>
            </div>
          )}
          {!fixes.length && !souples.length && <p className="mt-2 px-1 text-sm text-muted">Aucun rendez-vous ni relance aujourd’hui. VO PILOT ne remplit pas votre journée artificiellement.</p>}
        </Section>

        <div>
          <Section title="Actions rapides">
            <div className="grid grid-cols-4 gap-2">
              {raccourcis.map((q) => (
                <button key={q.id} type="button" onClick={() => (q.route ? nav(q.route) : open(q.kind, q.params))} className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-card px-1 text-xs font-semibold hover:border-accent">
                  <span className="text-accent">{q.icon}</span>{q.label}
                </button>
              ))}
            </div>
          </Section>
          <Section title="À surveiller">
            <Card className="divide-y divide-line">
              {([
                ['Leads à traiter', clientView('leads', ctx).length, '/clients?vue=leads', 'bad'],
                ['Sans prochaine action', clientView('sans_action', ctx).length, '/clients?vue=sans_action', 'warn'],
                ['Sans interaction depuis ' + s.delais.sansInteractionJours + ' j', clientView('inactifs', ctx).length, '/clients?vue=inactifs', 'warn'],
                ['Préparations bloquées', sales.filter((x) => !['livre', 'annule'].includes(x.statut) && (x.steps.some((st) => st.statut === 'bloquee') || interventions.some((i) => i.saleId === x.id && i.statut === 'bloquee'))).length, '/livraisons', 'bad'],
              ] as const).map(([label, n, link, tone]) => (
                <Link key={label} to={link} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-soft">
                  <span>{label}</span><span className="flex items-center gap-1"><Badge tone={n ? tone : 'neutral'}>{n}</Badge><ChevronRight size={16} className="text-muted" /></span>
                </Link>
              ))}
            </Card>
          </Section>
        </div>
      </div>

      {s.historique.length > 0 && (
        <p className="px-1 text-xs text-muted">Références déclarées (hors données de l’application) : {s.historique.map((h) => `${h.mois} : ${h.ventes} ventes`).join(' · ')}. Dernière sauvegarde exportée : {s.derniereSauvegarde ? dayKey(s.derniereSauvegarde) : 'jamais'}.</p>
      )}
    </div>
  )
}

function MiniTask({ id }: { id: string }) {
  const { tasks, byClient } = useData()
  const open = useDialog()
  const t = tasks.find((x) => x.id === id)
  if (!t) return null
  const c = t.clientId ? byClient.get(t.clientId) : undefined
  return (
    <button type="button" onClick={() => (c ? open('interaction', { clientId: c.id, taskId: t.id, type: t.type === 'whatsapp' ? 'whatsapp' : 'appel_sortant' }) : open('tache', { taskId: t.id }))} className="flex w-full items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-left text-sm hover:border-accent">
      <span className="text-muted">{TASK_ICON[t.type]}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{c ? `${[c.prenom, c.nom].filter(Boolean).join(' ')} — ` : ''}{t.titre}</span>
      <span className="text-xs text-muted">{fmtTime(t.due)}</span>
    </button>
  )
}
