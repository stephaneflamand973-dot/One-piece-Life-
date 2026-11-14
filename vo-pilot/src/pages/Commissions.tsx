import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { db, saveSettings, uid } from '../lib/db'
import { recalcCommissions } from '../services/actions'
import type { CommissionRule, Settings } from '../lib/types'
import { FINANCEMENTS } from '../lib/defaults'
import { addMonths, fmtMonth, monthKey } from '../lib/dates'
import { clientName, commissionParVenteBase, hasBareme, monthMoney, palierBonus, round2, salesOfMonth, simulate } from '../services/logic'
import { euro } from '../services/whatsapp'
import { useData } from '../ui/data'
import { N, Sel } from '../ui/forms'
import { Button, Card, Field, Section, Stat, Toggle, useRun, useUI } from '../ui/kit'
import { PageHead } from '../ui/shared'

export default function Commissions() {
  const d = useData()
  const { settings: s, sales, revenus } = d
  const run = useRun()
  const { toast } = useUI()
  const [mois, setMois] = useState(monthKey())
  const [prixMoyen, setPrixMoyen] = useState(15000)
  const up = (fn: (c: Settings['commission']) => void) => run(() => saveSettings((st) => { fn(st.commission) }))
  const m = monthMoney(sales, mois, s)
  const list = salesOfMonth(sales, mois, s)
  const rev = revenus.find((r) => r.id === mois)
  const bareme = hasBareme(s)
  const parVente = commissionParVenteBase(s, prixMoyen)
  // Ratio net/brut : uniquement à partir des mois où le net réellement reçu a été saisi.
  const obs = revenus.filter((r) => r.netRecu).map((r) => ({ net: r.netRecu!, brut: monthMoney(sales, r.id, s).brutEstime })).filter((x) => x.brut)
  const ratio = obs.length ? obs.reduce((t, x) => t + x.net / x.brut!, 0) / obs.length : null
  let cible: number | null = null
  if (ratio && parVente) for (let n = 0; n <= 40; n++) if ((simulate(n, s, prixMoyen) ?? 0) * ratio >= s.profil.objectifNet) { cible = n; break }
  const setRule = (id: string, p: Partial<CommissionRule>) => up((c) => { c.regles = c.regles.map((r) => (r.id === id ? { ...r, ...p } : r)) })
  const ecart = rev?.commissionsVersees !== undefined && m.estime !== null ? round2(rev.commissionsVersees - (m.estime + m.bonus)) : null

  return (
    <div>
      <PageHead title="Commissions" sub="Calculées uniquement à partir de votre barème" back="/plus" />
      {!bareme && <p className="mb-4 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn"><b>Barème non renseigné.</b> Ajoutez vos règles réelles ci-dessous : sans elles, aucune commission n’est estimée (aucun chiffre n’est inventé).</p>}

      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Mois précédent" className="h-10 w-10 rounded-full hover:bg-soft" onClick={() => setMois(addMonths(mois, -1))}>‹</button>
        <p className="font-bold cap">{fmtMonth(mois)}</p>
        <button type="button" aria-label="Mois suivant" className="h-10 w-10 rounded-full hover:bg-soft" onClick={() => setMois(addMonths(mois, 1))}>›</button>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Ventes comptées" value={m.ventes} />
        <Stat label="Commissions estimées" value={m.estime === null ? '—' : euro(m.estime + m.bonus)} sub={m.bonus ? `dont prime palier ${euro(m.bonus)}` : undefined} />
        <Stat label="Versées (saisies)" value={euro(m.verse)} tone={m.verse ? 'ok' : undefined} />
        <Stat label="En attente" value={m.enAttente === null ? '—' : euro(m.enAttente)} tone={m.enAttente ? 'warn' : undefined} />
      </div>

      <Section title="Ventes du mois">
        <Card className="divide-y divide-line">
          {list.map((x) => (
            <Link key={x.id} to={`/ventes/${x.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-soft">
              <span className="min-w-0"><span className="block truncate font-semibold">{x.vehiculeLabel}</span><span className="block truncate text-xs text-muted">{clientName(d.byClient.get(x.clientId))} · {x.financementType}{x.remise ? ` · remise ${euro(x.remise)}` : ''}</span></span>
              <span className="shrink-0 text-right"><span className="block font-bold tabular-nums">{x.commission.confirme !== undefined ? euro(x.commission.confirme) : x.commission.estime !== undefined ? euro(x.commission.estime) : '—'}</span><span className="block text-xs text-muted">{x.commission.verse ? `versé ${euro(x.commission.verse)}` : x.commission.moisVersement ? `prévu ${x.commission.moisVersement}` : 'non versé'}</span></span>
            </Link>
          ))}
          {!list.length && <p className="px-4 py-4 text-sm text-muted">Aucune vente comptabilisée ce mois-là.</p>}
        </Card>
        {list.length > 0 && bareme && <Button size="sm" variant="ghost" className="mt-2" onClick={async () => { const n = await run(() => recalcCommissions(list.map((x) => x.id))); if (n !== undefined) toast(n ? `${n} estimation(s) recalculée(s) avec le barème actuel` : 'Estimations déjà à jour') }}>Recalculer les estimations de ce mois avec le barème actuel</Button>}
      </Section>

      <Section title="Revenu réellement perçu (saisie)">
        <Card className="grid grid-cols-2 gap-3 p-4">
          <Field label="Net reçu sur ce mois (€)" hint="Tel qu’il figure sur votre bulletin / virement."><N value={rev?.netRecu} onChange={(v) => db.revenus.put({ ...rev, id: mois, netRecu: v })} /></Field>
          <Field label="Commissions versées (brut, €)"><N value={rev?.commissionsVersees} onChange={(v) => db.revenus.put({ ...rev, id: mois, commissionsVersees: v })} /></Field>
          <p className="col-span-2 text-sm">Brut estimé (fixe {euro(s.commission.fixeBrut)} + variable) : <b>{m.brutEstime === null ? 'barème à renseigner' : euro(m.brutEstime)}</b>{ecart !== null && <> · écart versé − estimé : <b className={ecart < 0 ? 'text-bad' : 'text-ok'}>{ecart > 0 ? '+' : ''}{euro(ecart)}</b></>}</p>
          <p className="col-span-2 text-xs text-muted">Les commissions sont généralement payées le mois suivant : comparez avec le mois de vente correspondant. Aucune conversion brut → net n’est appliquée automatiquement.</p>
        </Card>
      </Section>

      <Section title="Simulateur d’objectifs">
        <Card className="p-4">
          <Field label="Prix de vente moyen pris en compte (€)" hint="Utile seulement si une règle est en % du prix."><N value={prixMoyen} onChange={(v) => setPrixMoyen(v ?? 0)} /></Field>
          {parVente === null ? <p className="mt-3 text-sm text-muted">Renseignez le barème pour simuler.</p> : <>
            <p className="mt-3 text-sm">Base par vente (règles sans condition) : <b>{euro(parVente)}</b></p>
            <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted"><th className="py-1">Ventes</th><th>Variable</th><th>Prime palier</th><th>Brut estimé</th>{ratio && <th>Net indicatif</th>}</tr></thead>
              <tbody>{[8, 10, 12, 15, 16].map((n) => { const brut = simulate(n, s, prixMoyen)!; return <tr key={n} className="border-t border-line"><td className="py-1.5 font-bold">{n}</td><td className="tabular-nums">{euro(n * parVente)}</td><td className="tabular-nums">{euro(palierBonus(n, s))}</td><td className="font-semibold tabular-nums">{euro(brut)}</td>{ratio && <td className="tabular-nums">{euro(Math.round(brut * ratio))}</td>}</tr> })}</tbody></table></div>
            <p className="mt-3 text-sm">Impact d’une remise ≥ {euro(s.commission.remise.seuil)} : {s.commission.remise.actif ? <b>− {euro(s.commission.remise.penalite)} par vente concernée</b> : 'règle désactivée'}.</p>
            <p className="mt-2 text-sm">Pour {euro(s.profil.objectifNet)} nets : {ratio ? (cible !== null ? <b>environ {cible} ventes</b> : 'hors de portée avec ce barème (plus de 40 ventes)') : <span className="text-muted">données insuffisantes — saisissez votre net réellement reçu sur au moins un mois pour obtenir un ratio net/brut observé.</span>}</p>
            {ratio && <p className="mt-1 text-xs text-muted">Net indicatif = brut estimé × {Math.round(ratio * 100)} % (ratio moyen observé sur {obs.length} mois saisi(s)). Ce n’est pas un calcul de paie.</p>}
          </>}
        </Card>
      </Section>

      <Section title="Mon barème" right={<Button size="sm" variant="soft" onClick={() => up((c) => { c.regles.push({ id: uid(), label: 'Commission par vente', type: 'par_vente', montant: 0, actif: true }) })}><Plus size={15} />Règle</Button>}>
        <div className="space-y-3">
          {s.commission.regles.map((r) => (
            <Card key={r.id} className="grid grid-cols-2 gap-3 p-4">
              <Field label="Intitulé" className="col-span-2"><input className="inp" defaultValue={r.label} onBlur={(e) => setRule(r.id, { label: e.target.value })} /></Field>
              <Field label="Type"><Sel value={r.type} onChange={(v) => setRule(r.id, { type: v as CommissionRule['type'] })} options={[{ value: 'par_vente', label: 'Montant fixe par vente' }, { value: 'pourcent_prix', label: '% du prix de vente' }]} empty={null} /></Field>
              <Field label={r.type === 'par_vente' ? 'Montant (€)' : 'Pourcentage (%)'}><N value={r.montant || undefined} onChange={(v) => setRule(r.id, { montant: v ?? 0 })} /></Field>
              <Field label="Seulement si financement"><Sel value={r.conditionFinancement} onChange={(v) => setRule(r.id, { conditionFinancement: v || undefined })} options={FINANCEMENTS} empty="Tous" /></Field>
              <Field label="Seulement si modèle contient"><input className="inp" defaultValue={r.conditionModele ?? ''} onBlur={(e) => setRule(r.id, { conditionModele: e.target.value || undefined })} placeholder="ex. Arkana" /></Field>
              <Field label="Prix min (€)"><N value={r.prixMin} onChange={(v) => setRule(r.id, { prixMin: v })} /></Field>
              <Field label="Prix max (€)"><N value={r.prixMax} onChange={(v) => setRule(r.id, { prixMax: v })} /></Field>
              <div className="col-span-2 flex items-center justify-between"><span className="flex items-center gap-2 text-sm"><Toggle label="Règle active" checked={r.actif} onChange={(v) => setRule(r.id, { actif: v })} />Active</span><Button size="sm" variant="danger" onClick={() => up((c) => { c.regles = c.regles.filter((x) => x.id !== r.id) })}><Trash2 size={15} />Retirer</Button></div>
            </Card>
          ))}
          {!s.commission.regles.length && <p className="px-1 text-sm text-muted">Aucune règle. Les règles applicables à une vente se cumulent (ex. base par vente + prime financement).</p>}
          <Card className="grid grid-cols-2 gap-3 p-4">
            <Field label="Fixe brut mensuel (€)"><N value={s.commission.fixeBrut} onChange={(v) => up((c) => { c.fixeBrut = v ?? 0 })} /></Field>
            <Field label="Versement : décalage (mois)"><N value={s.commission.decalageVersementMois} onChange={(v) => up((c) => { c.decalageVersementMois = v ?? 1 })} /></Field>
            <div className="col-span-2 flex items-center justify-between text-sm"><span>Règle de remise (perte de prime)</span><Toggle label="Règle de remise" checked={s.commission.remise.actif} onChange={(v) => up((c) => { c.remise.actif = v })} /></div>
            {s.commission.remise.actif && <><Field label="À partir d’une remise de (€)"><N value={s.commission.remise.seuil} onChange={(v) => up((c) => { c.remise.seuil = v ?? 0 })} /></Field><Field label="Perte de prime (€)"><N value={s.commission.remise.penalite} onChange={(v) => up((c) => { c.remise.penalite = v ?? 0 })} /></Field><p className="col-span-2 text-xs text-muted">Exemple historique déclaré (500 € → jusqu’à 50 €) : à confirmer avec votre barème applicable.</p></>}
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Primes par palier mensuel</p><Button size="sm" variant="soft" onClick={() => up((c) => { c.paliers.push({ ventesMin: 10, bonus: 0 }) })}><Plus size={15} />Palier</Button></div>
            {s.commission.paliers.map((p, i) => (
              <div key={i} className="mb-2 flex items-end gap-2"><Field label="À partir de (ventes)"><N value={p.ventesMin} onChange={(v) => up((c) => { c.paliers[i].ventesMin = v ?? 0 })} /></Field><Field label="Prime (€)"><N value={p.bonus || undefined} onChange={(v) => up((c) => { c.paliers[i].bonus = v ?? 0 })} /></Field><Button variant="ghost" aria-label="Retirer le palier" onClick={() => up((c) => { c.paliers.splice(i, 1) })}><Trash2 size={16} /></Button></div>
            ))}
            {!s.commission.paliers.length && <p className="text-sm text-muted">Aucun palier. Le palier atteint le plus élevé s’applique une fois sur le mois.</p>}
          </Card>
          <p className="px-1 text-xs text-muted">Modifier le barème ne change pas d’office les ventes déjà enregistrées : utilisez « Recalculer les estimations de ce mois » sous la liste des ventes. Les montants confirmés et versés ne sont jamais modifiés.</p>
        </div>
      </Section>
    </div>
  )
}
