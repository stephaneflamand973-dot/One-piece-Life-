import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MessageCircle, Plus, Printer, Send, ShoppingBag, Trash2, X } from 'lucide-react'
import type { Quote } from '../lib/types'
import { dayKey, fmtDay, fromLocalInput, nowIso, toLocalInput, today } from '../lib/dates'
import { deleteQuote, markQuoteSent, newQuoteDraft, saveQuote, setQuoteStatus } from '../services/actions'
import { carteGrise, clientName, mensualiteIndicative, quoteTotals, vehicleLabel } from '../services/logic'
import { euro, kmFmt } from '../services/whatsapp'
import { useData } from '../ui/data'
import { ClientPicker, N, Sel, useDialog, VehiclePicker } from '../ui/forms'
import { Badge, Button, Card, Empty, Field, Section, Sheet, useRun, useUI } from '../ui/kit'
import { PageHead } from '../ui/shared'
import { QUOTE_LABEL } from './Devis'

type Draft = Omit<Quote, 'id' | 'ref'> & { id?: string; ref?: string }

export default function DevisEdit() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const d = useData()
  const { settings: s } = d
  const nav = useNavigate()
  const open = useDialog()
  const run = useRun()
  const { confirm } = useUI()
  const [q, setQ] = useState<Draft | null>(null)
  const [missing, setMissing] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentAt, setSentAt] = useState(toLocalInput(nowIso()))
  const print = sp.has('imprimer')

  useEffect(() => {
    if (q) return
    if (id === 'nouveau') newQuoteDraft(sp.get('client') ?? '', d.byVehicle.get(sp.get('vehicule') ?? '')).then(setQ)
    else { const ex = d.quotes.find((x) => x.id === id); ex ? setQ(ex) : setMissing(true) }
  }, [id, q, d.quotes, d.byVehicle, sp])
  // Garde l'écran à jour quand le statut change en base (envoi, acceptation).
  useEffect(() => { const ex = d.quotes.find((x) => x.id === q?.id); if (ex && q && (ex.statut !== q.statut || ex.dateEnvoi !== q.dateEnvoi)) setQ({ ...q, statut: ex.statut, dateEnvoi: ex.dateEnvoi }) }, [d.quotes, q])

  if (missing) return <Empty title="Devis introuvable" action={<Button onClick={() => nav('/devis')}>Retour</Button>} />
  if (!q) return null
  const set = (p: Partial<Draft>) => setQ((x) => ({ ...x!, ...p }))
  const t = quoteTotals(q)
  const c = d.byClient.get(q.clientId)
  const v = q.vehicleId ? d.byVehicle.get(q.vehicleId) : undefined
  const fin = q.financement
  const capital = fin.capital ?? t.resteAFinancer
  const mens = fin.taux !== undefined && fin.dureeMois ? mensualiteIndicative(capital, fin.taux, fin.dureeMois) : null
  const save = async () => run(async () => { const r = await saveQuote(q); setQ(r); if (id === 'nouveau') nav(`/devis/${r.id}`, { replace: true }); return r }, 'Devis enregistré')
  const sale = d.sales.find((x) => x.quoteId === q.id)

  if (print) return <PrintView q={q as Quote} />

  return (
    <div>
      <PageHead back="/devis" title={q.ref ? `Devis ${q.ref}` : 'Nouveau devis'} sub={<span className="flex items-center gap-1.5"><Badge tone={q.statut === 'envoye' ? 'accent' : q.statut === 'accepte' ? 'ok' : 'neutral'}>{QUOTE_LABEL[q.statut]}</Badge>{q.dateEnvoi && <span>envoyé le {fmtDay(dayKey(q.dateEnvoi))}</span>}</span>} />
      <div className="grid gap-x-6 lg:grid-cols-[1fr_340px]">
        <div>
          <Section title="Client et véhicule">
            <Card className="space-y-3 p-4">
              <Field group label="Client"><ClientPicker value={q.clientId || undefined} onChange={(cid) => set({ clientId: cid ?? '' })} /></Field>
              <Field group label="Véhicule du catalogue"><VehiclePicker value={q.vehicleId} onChange={(veh) => set(veh ? { vehicleId: veh.id, vehiculeLabel: `${vehicleLabel(veh)}${veh.annee ? ` (${veh.annee})` : ''}`, prix: veh.prix ?? q.prix, cvFiscaux: veh.cvFiscaux ?? 0, carteGrise: carteGrise(veh.cvFiscaux ?? 0, s.tarifs) } : { vehicleId: undefined })} /></Field>
              {!q.vehicleId && <Field label="Désignation libre"><input className="inp" value={q.vehiculeLabel} onChange={(e) => set({ vehiculeLabel: e.target.value })} /></Field>}
            </Card>
          </Section>
          <Section title="Prix et frais">
            <Card className="grid grid-cols-2 gap-3 p-4">
              <Field label="Prix du véhicule (€)"><N value={q.prix || undefined} onChange={(x) => set({ prix: x ?? 0 })} /></Field>
              <Field label="Remise (€)" hint={q.remise > s.tarifs.remiseMax ? `Au-delà du plafond déclaré (${s.tarifs.remiseMax} €) : autorisation à vérifier` : `Plafond déclaré : ${s.tarifs.remiseMax} €`}><N value={q.remise || undefined} onChange={(x) => set({ remise: x ?? 0 })} /></Field>
              <Field label="Frais de dossier (€)"><N value={q.fraisDossier} onChange={(x) => set({ fraisDossier: x ?? 0 })} /></Field>
              <Field label="Chevaux fiscaux"><N value={q.cvFiscaux || undefined} onChange={(x) => set({ cvFiscaux: x ?? 0, carteGrise: carteGrise(x ?? 0, s.tarifs) })} /></Field>
              <Field label="Carte grise (€)" className="col-span-2" hint={`Règle déclarée : ${s.tarifs.cgFixe} € + CV × ${s.tarifs.cgParCv} €. À vérifier avant tout usage officiel ; montant modifiable.`}><N value={q.carteGrise} onChange={(x) => set({ carteGrise: x ?? 0 })} /></Field>
              <div className="col-span-2 space-y-2">
                {q.autresFrais.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="inp" placeholder="Libellé du frais" aria-label="Libellé" value={f.label} onChange={(e) => set({ autresFrais: q.autresFrais.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                    <input className="inp !w-28" inputMode="decimal" placeholder="€" aria-label="Montant" value={f.montant || ''} onChange={(e) => set({ autresFrais: q.autresFrais.map((x, j) => (j === i ? { ...x, montant: parseFloat(e.target.value.replace(',', '.')) || 0 } : x)) })} />
                    <button type="button" aria-label="Retirer" className="px-2 text-muted" onClick={() => set({ autresFrais: q.autresFrais.filter((_, j) => j !== i) })}><X size={18} /></button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={() => set({ autresFrais: [...q.autresFrais, { label: '', montant: 0 }] })}><Plus size={15} />Autre frais identifié</Button>
              </div>
              <Field label="Valeur de reprise (€)" className="col-span-2" hint="La reprise n’est pas automatiquement un apport disponible."><N value={q.reprise || undefined} onChange={(x) => set({ reprise: x ?? 0 })} /></Field>
            </Card>
          </Section>
          <Section title="Financement (indicatif)">
            <Card className="grid grid-cols-2 gap-3 p-4">
              <Field label="Apport (€)"><N value={fin.apport} onChange={(x) => set({ financement: { ...fin, apport: x } })} /></Field>
              <Field label="Capital financé (€)" hint={`Par défaut : ${euro(t.resteAFinancer)}`}><N value={fin.capital} onChange={(x) => set({ financement: { ...fin, capital: x } })} /></Field>
              <Field label="Durée (mois)"><N value={fin.dureeMois} onChange={(x) => set({ financement: { ...fin, dureeMois: x } })} /></Field>
              <Field label="Taux annuel (%) si connu"><N value={fin.taux} onChange={(x) => set({ financement: { ...fin, taux: x } })} /></Field>
              <Field label="Mensualité communiquée par l’organisme (€)"><N value={fin.mensualite} onChange={(x) => set({ financement: { ...fin, mensualite: x } })} /></Field>
              <Field label="Assurances / frais mensuels (€)"><N value={fin.assurance} onChange={(x) => set({ financement: { ...fin, assurance: x } })} /></Field>
              <Field label="Organisme" className="col-span-2"><input className="inp" value={fin.organisme ?? ''} onChange={(e) => set({ financement: { ...fin, organisme: e.target.value } })} /></Field>
              {mens !== null && <p className="col-span-2 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">Estimation indicative : {euro(mens)} / mois hors assurance, sur {fin.dureeMois} mois pour {euro(capital)}. Ce calcul n’est pas une offre de crédit : seule la proposition de l’organisme financier fait foi.</p>}
            </Card>
          </Section>
          <Section title="Notes"><textarea className="inp" value={q.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} placeholder="Précisions pour le client (facultatif)" aria-label="Notes" /></Section>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Récapitulatif estimé</p>
            <dl className="mt-2 space-y-1.5 text-sm">
              <Row k="Prix initial" v={euro(q.prix)} />
              {q.remise > 0 && <Row k="Remise" v={`− ${euro(q.remise)}`} />}
              <Row k="Frais de dossier" v={euro(q.fraisDossier)} />
              <Row k="Carte grise (estimée)" v={euro(q.carteGrise)} />
              {q.autresFrais.filter((f) => f.montant).map((f, i) => <Row key={i} k={f.label || 'Autre frais'} v={euro(f.montant)} />)}
              <div className="my-2 border-t border-line" />
              <Row k={<b>Total estimé</b>} v={<b className="text-lg">{euro(t.total)}</b>} />
              {q.reprise > 0 && <><Row k="Valeur de reprise" v={`− ${euro(q.reprise)}`} /><Row k="Après reprise" v={euro(t.apresReprise)} /></>}
              {(fin.apport ?? 0) > 0 && <Row k="Apport" v={`− ${euro(fin.apport)}`} />}
              {(q.reprise > 0 || (fin.apport ?? 0) > 0) && <Row k={<b>Reste à financer</b>} v={<b>{euro(t.resteAFinancer)}</b>} />}
              {fin.mensualite && <Row k="Mensualité (organisme)" v={`${euro(fin.mensualite + (fin.assurance ?? 0))} / mois`} />}
            </dl>
            <div className="mt-4 grid gap-2">
              <Button onClick={save}>Enregistrer</Button>
              {q.id && <>
                <Button variant="outline" onClick={async () => { await save(); nav(`/devis/${q.id}?imprimer`) }}><Printer size={16} />Proposition PDF / impression</Button>
                <Button variant="outline" disabled={!c} onClick={async () => { await save(); nav(`/whatsapp?client=${q.clientId}&modele=envoi_devis${q.vehicleId ? `&vehicule=${q.vehicleId}` : ''}&prix=${t.total}`) }}><MessageCircle size={16} />Message d’envoi</Button>
                {q.statut === 'brouillon' && <Button variant="soft" onClick={() => setSent(true)}><Send size={16} />J’ai envoyé ce devis</Button>}
                {q.statut === 'envoye' && !sale && <Button variant="ok" onClick={() => open('vente', { quoteId: q.id })}><ShoppingBag size={16} />Transformer en vente</Button>}
                {q.statut === 'envoye' && <Button variant="ghost" onClick={() => run(() => setQuoteStatus(q.id!, 'refuse'), 'Devis marqué refusé')}>Marquer refusé</Button>}
                {sale && <Button variant="outline" onClick={() => nav(`/ventes/${sale.id}`)}>Voir la vente {sale.ref}</Button>}
                <Button variant="danger" onClick={async () => { if (await confirm({ title: 'Supprimer ce devis ?', message: `${q.ref} — ${q.vehiculeLabel}`, confirmLabel: 'Supprimer', danger: true })) { await deleteQuote(q.id!); nav('/devis') } }}><Trash2 size={16} />Supprimer</Button>
              </>}
            </div>
            <p className="mt-3 text-xs text-muted">Document indicatif, non contractuel. Ce n’est ni un bon de commande ni une offre de crédit.</p>
            {v && <p className="mt-1 text-xs text-muted">{v.ref} · {kmFmt(v.km)} · garantie : {v.garantie ?? 'non renseignée'}</p>}
          </Card>
        </div>
      </div>

      <Sheet open={sent} onClose={() => setSent(false)} title="Devis envoyé" footer={<><Button variant="ghost" onClick={() => setSent(false)}>Annuler</Button><Button onClick={async () => { const r = await save(); if (r) { await run(() => markQuoteSent(r.id, fromLocalInput(sentAt)), `Envoi enregistré — relance proposée à J+${s.delais.relanceDevisJours}`); setSent(false) } }}>Confirmer l’envoi</Button></>}>
        <p className="mb-3 text-sm text-muted">VO PILOT n’envoie rien lui-même : vous confirmez ici que vous avez transmis la proposition au client. Une relance sera programmée automatiquement {s.delais.relanceDevisJours} jour(s) plus tard (modifiable).</p>
        <Field label="Date et heure d’envoi"><input className="inp" type="datetime-local" value={sentAt} onChange={(e) => setSentAt(e.target.value)} /></Field>
      </Sheet>
    </div>
  )
}
const Row = ({ k, v }: { k: React.ReactNode; v: React.ReactNode }) => <div className="flex items-baseline justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="tabular-nums">{v}</dd></div>

function PrintView({ q }: { q: Quote }) {
  const d = useData()
  const nav = useNavigate()
  const c = d.byClient.get(q.clientId)
  const v = q.vehicleId ? d.byVehicle.get(q.vehicleId) : undefined
  const t = quoteTotals(q)
  const s = d.settings
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex gap-2"><Button variant="outline" onClick={() => nav(`/devis/${q.id}`)}>Retour</Button><Button onClick={() => window.print()}><Printer size={16} />Imprimer / enregistrer en PDF</Button></div>
      <div className="print-page rounded-2xl border border-line bg-white p-8 text-[#0b1b3a] shadow">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div><p className="text-xl font-extrabold">Proposition commerciale</p><p className="text-sm text-slate-500">Document indicatif non contractuel · {q.ref} · {fmtDay(today())}</p></div>
          <div className="text-right text-sm"><p className="font-bold">{s.profil.nom || 'Votre conseiller'}</p><p className="text-slate-500">Véhicules d’occasion · {s.profil.site}</p></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
          <div><p className="text-xs font-bold uppercase text-slate-400">Client</p><p className="font-semibold">{clientName(c)}</p><p className="text-slate-500">{c?.tel}</p></div>
          <div><p className="text-xs font-bold uppercase text-slate-400">Véhicule</p><p className="font-semibold">{q.vehiculeLabel}</p>
            {v && <p className="text-slate-500">{[v.ref, v.annee, v.km !== undefined ? kmFmt(v.km) : '', v.carburant, v.boite, v.couleur].filter(Boolean).join(' · ')}</p>}
            {v?.garantie && <p className="text-slate-500">Garantie : {v.garantie}</p>}</div>
        </div>
        <table className="mt-6 w-full text-sm">
          <tbody>
            {[['Prix du véhicule', euro(q.prix)], ...(q.remise ? [['Remise', `− ${euro(q.remise)}`]] : []), ['Frais de dossier', euro(q.fraisDossier)], ['Carte grise (estimation)', euro(q.carteGrise)], ...q.autresFrais.filter((f) => f.montant).map((f) => [f.label || 'Autre frais', euro(f.montant)])].map(([k, val], i) => <tr key={i} className="border-b border-slate-100"><td className="py-2">{k}</td><td className="py-2 text-right tabular-nums">{val}</td></tr>)}
            <tr><td className="py-3 text-base font-extrabold">Total estimé</td><td className="py-3 text-right text-base font-extrabold tabular-nums">{euro(t.total)}</td></tr>
            {q.reprise > 0 && <tr className="border-t border-slate-100"><td className="py-2">Valeur de reprise estimée</td><td className="py-2 text-right tabular-nums">− {euro(q.reprise)}</td></tr>}
            {(q.financement.apport ?? 0) > 0 && <tr className="border-t border-slate-100"><td className="py-2">Apport</td><td className="py-2 text-right tabular-nums">− {euro(q.financement.apport)}</td></tr>}
            {(q.reprise > 0 || (q.financement.apport ?? 0) > 0) && <tr className="border-t border-slate-200"><td className="py-2 font-bold">Reste à financer estimé</td><td className="py-2 text-right font-bold tabular-nums">{euro(t.resteAFinancer)}</td></tr>}
          </tbody>
        </table>
        {q.financement.mensualite && <p className="mt-4 text-sm">Mensualité communiquée par {q.financement.organisme || 'l’organisme financier'} : <b>{euro(q.financement.mensualite)}</b>{q.financement.dureeMois ? ` sur ${q.financement.dureeMois} mois` : ''}{q.financement.assurance ? ` (+ ${euro(q.financement.assurance)} d’assurance)` : ''} — sous réserve d’acceptation du dossier.</p>}
        {q.notes && <p className="mt-4 whitespace-pre-line text-sm">{q.notes}</p>}
        <p className="mt-8 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">Ce document est une simulation établie à titre indicatif. Il ne constitue ni un bon de commande, ni une offre de crédit, ni un engagement contractuel. Les montants (notamment carte grise et reprise) sont des estimations à confirmer. Seuls les documents officiels remis par le point de vente font foi.</p>
      </div>
    </div>
  )
}
void Sel
