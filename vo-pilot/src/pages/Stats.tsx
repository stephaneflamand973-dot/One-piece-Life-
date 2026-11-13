import { useMemo, useState } from 'react'
import { addMonths, fmtMonth, fmtMonthShort, monthKey } from '../lib/dates'
import { avgDeliveryDays, conversions, improvementAxes, MIN_SAMPLE, monthMoney, monthStats, prepState, ratioText, salesOfMonth, VENTE_DEF } from '../services/logic'
import { euro } from '../services/whatsapp'
import { useData, useNow } from '../ui/data'
import { Card, Chip, cx, Section, Stat } from '../ui/kit'
import { PageHead } from '../ui/shared'

const PERIODS = [{ id: 'mois', label: 'Mois actuel', n: 1 }, { id: 'prec', label: 'Mois précédent', n: 1 }, { id: '3m', label: '3 mois', n: 3 }, { id: '6m', label: '6 mois', n: 6 }, { id: 'an', label: 'Année en cours', n: 0 }] as const

export default function Stats() {
  const d = useData()
  const now = useNow(60000)
  const { settings: s, sales } = d
  const [p, setP] = useState<(typeof PERIODS)[number]['id']>('mois')
  const cur = monthKey()
  const [from, to] = p === 'mois' ? [cur, cur] : p === 'prec' ? [addMonths(cur, -1), addMonths(cur, -1)] : p === 'an' ? [`${cur.slice(0, 4)}-01`, cur] : [addMonths(cur, p === '3m' ? -2 : -5), cur]
  const months = useMemo(() => { const a: string[] = []; for (let m = from; m <= to; m = addMonths(m, 1)) a.push(m); return a }, [from, to])
  const ctx = useMemo(() => ({ ...d, now }), [d, now])
  const stats = useMemo(() => months.map((m) => monthStats(m, ctx)), [months, ctx])
  const sum = (k: keyof (typeof stats)[number]) => stats.reduce((t, x) => t + (x[k] as number), 0)
  const obj = s.profil.objectifMensuel * months.length
  const conv = useMemo(() => conversions(from, to, ctx), [from, to, ctx])
  const axes = useMemo(() => improvementAxes(ctx), [ctx])
  const six = Array.from({ length: 6 }, (_, i) => addMonths(cur, i - 5))
  const bars = six.map((m) => ({ m, n: salesOfMonth(sales, m, s).length, ref: s.historique.find((h) => h.mois === m)?.ventes }))
  const max = Math.max(s.profil.objectifMensuel, ...bars.map((b) => Math.max(b.n, b.ref ?? 0)), 1)
  const modeles = Object.entries(sales.filter((x) => x.statut !== 'annule').reduce<Record<string, number>>((a, x) => { const k = x.vehiculeLabel.split(' ').slice(0, 2).join(' '); a[k] = (a[k] ?? 0) + 1; return a }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const delai = avgDeliveryDays(sales)
  const perdus = d.interactions.filter((i) => i.type === 'statut' && i.vers === 'perdu')
  const perdusDe = Object.entries(perdus.reduce<Record<string, number>>((a, i) => { const k = s.pipeline.find((x) => x.id === i.de)?.label ?? i.de ?? '?'; a[k] = (a[k] ?? 0) + 1; return a }, {})).sort((a, b) => b[1] - a[1])
  const bloques = sales.filter((x) => !['livre', 'annule'].includes(x.statut) && prepState(x, d.interventions, s).etat === 'bloque')
  const ecarts = d.revenus.filter((r) => r.commissionsVersees !== undefined).map((r) => { const m = monthMoney(sales, r.id, s); return { mois: r.id, ecart: m.estime === null ? null : r.commissionsVersees! - (m.estime + m.bonus) } }).filter((x) => x.ecart !== null)

  return (
    <div>
      <PageHead title="Performance" sub="Calculée uniquement à partir de vos saisies" back="/plus" />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">{PERIODS.map((x) => <Chip key={x.id} active={p === x.id} onClick={() => setP(x.id)}>{x.label}</Chip>)}</div>
      <p className="mb-3 px-1 text-sm font-semibold cap">{from === to ? fmtMonth(from) : `${fmtMonth(from)} → ${fmtMonth(to)}`}</p>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Ventes" value={sum('ventes')} sub={`objectif ${obj} · ${obj ? Math.round((sum('ventes') / obj) * 100) : 0} %`} tone={sum('ventes') >= obj ? 'ok' : undefined} />
        <Stat label="Nouveaux prospects" value={sum('prospects')} />
        <Stat label="Contacts aboutis" value={sum('contacts')} />
        <Stat label="Rendez-vous" value={sum('rdv')} />
        <Stat label="Essais réalisés" value={sum('essais')} />
        <Stat label="Devis envoyés" value={sum('devis')} />
        <Stat label="Commandes (BC)" value={sum('commandes')} />
        <Stat label="Livraisons" value={sum('livraisons')} />
        <Stat label="Dossiers perdus" value={sum('perdus')} />
      </div>
      <p className="-mt-3 mb-5 px-1 text-xs text-muted">Une vente est comptée {VENTE_DEF[s.commission.venteCompteeA]}, une seule fois ; les ventes annulées sont exclues.</p>

      <Section title="Ventes sur 6 mois">
        <Card className="p-4">
          <div className="flex h-36 items-end gap-2">
            {bars.map((b) => (
              <div key={b.m} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-bold tabular-nums">{b.n}{b.ref !== undefined && <span className="font-normal text-muted"> ({b.ref})</span>}</span>
                <div className="flex w-full items-end justify-center gap-0.5" style={{ height: '100px' }}>
                  <div className={cx('w-1/2 rounded-t-md', b.n >= s.profil.objectifMensuel ? 'bg-ok' : 'bg-accent')} style={{ height: `${(b.n / max) * 100}%`, minHeight: b.n ? 4 : 0 }} />
                  {b.ref !== undefined && <div className="w-1/4 rounded-t-md bg-line" style={{ height: `${(b.ref / max) * 100}%` }} title="Référence déclarée" />}
                </div>
                <span className="text-xs cap text-muted">{fmtMonthShort(b.m)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Barre colorée : ventes enregistrées dans VO PILOT. Barre grise et chiffre entre parenthèses : références historiques que vous avez déclarées (non issues de l’application).</p>
        </Card>
      </Section>

      <Section title="Taux de conversion (prospects créés sur la période)">
        <Card className="divide-y divide-line">
          {conv.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0"><span className="block text-sm font-semibold">{r.label}</span><span className="block text-xs text-muted">{r.num} {r.libNum} / {r.den} {r.libDen}</span></span>
              <span className={cx('shrink-0 text-right font-bold tabular-nums', r.den < MIN_SAMPLE && 'text-xs font-medium text-muted')}>{ratioText(r)}</span>
            </div>
          ))}
        </Card>
        <p className="mt-1.5 px-1 text-xs text-muted">En dessous de {MIN_SAMPLE} dossiers au dénominateur, le taux n’est pas affiché : il ne serait pas significatif.</p>
      </Section>

      <Section title="Axes d’amélioration (3 maximum)">
        {axes.length ? <div className="space-y-2">{axes.map((a, i) => <Card key={a.titre} className="flex gap-3 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft font-extrabold text-accent">{i + 1}</span><div><p className="font-bold">{a.titre}</p><p className="text-sm text-muted">{a.constat}</p></div></Card>)}</div> : <p className="px-1 text-sm text-muted">Données insuffisantes pour proposer un axe : continuez à enregistrer vos échanges et vos relances.</p>}
        <p className="mt-1.5 px-1 text-xs text-muted">Ce sont des constats observables dans vos données, pas des causes démontrées de vos résultats.</p>
      </Section>

      <Section title="Analyse">
        <Card className="divide-y divide-line text-sm">
          <div className="px-4 py-2.5"><p className="font-semibold">Modèles les plus vendus dans vos données</p><p className="text-muted">{modeles.length ? modeles.map(([k, n]) => `${k} (${n})`).join(' · ') : 'Aucune vente enregistrée.'}</p></div>
          <div className="px-4 py-2.5"><p className="font-semibold">Délai moyen vente → livraison</p><p className="text-muted">{delai ? `${delai.moyenne} jours (sur ${delai.n} livraison${delai.n > 1 ? 's' : ''})` : 'Données insuffisantes.'}</p></div>
          <div className="px-4 py-2.5"><p className="font-semibold">Étapes où les prospects sont perdus</p><p className="text-muted">{perdusDe.length ? perdusDe.map(([k, n]) => `${k} (${n})`).join(' · ') : 'Aucun dossier perdu enregistré.'}</p></div>
          <div className="px-4 py-2.5"><p className="font-semibold">Dossiers de préparation bloqués</p><p className="text-muted">{bloques.length ? bloques.map((x) => x.vehiculeLabel).join(' · ') : 'Aucun.'}</p></div>
          <div className="px-4 py-2.5"><p className="font-semibold">Écart commissions versées − estimées</p><p className="text-muted">{ecarts.length ? ecarts.map((e) => `${e.mois} : ${e.ecart! > 0 ? '+' : ''}${euro(e.ecart!)}`).join(' · ') : 'Saisissez les commissions versées (Commissions) pour suivre l’écart.'}</p></div>
        </Card>
      </Section>
    </div>
  )
}
