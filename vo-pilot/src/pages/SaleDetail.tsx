import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, MessageCircle, Plus, ShieldAlert, Star, StickyNote, Trash2, Wrench } from 'lucide-react'
import type { PrepException, Sale, SaleStatus, StepStatus } from '../lib/types'
import { FINANCEMENTS } from '../lib/defaults'
import { dayKey, fmtDateTime, fmtDay, fromLocalInput, toLocalInput, today } from '../lib/dates'
import { deleteSale, setDocument, setStep, toggleFavori, updateSale } from '../services/actions'
import { clientName, ctAVerifier, prepState, SALE_ORDER, SALE_STATUS, STEP_LABEL } from '../services/logic'
import { euro } from '../services/whatsapp'
import { useData } from '../ui/data'
import { INT_STATUS, N, Sel, useDialog } from '../ui/forms'
import { Badge, Button, Card, cx, Empty, Field, Progress, Section, Sheet, Toggle, type Tone, useRun, useUI } from '../ui/kit'
import { PageHead, PREP_LABEL, PREP_TONE, SALE_TONE, TaskRow } from '../ui/shared'

const STEP_TONE: Record<StepStatus, Tone> = { non_necessaire: 'neutral', a_faire: 'neutral', en_cours: 'accent', attente_tiers: 'warn', terminee: 'ok', bloquee: 'bad' }
const NEXT: Record<StepStatus, StepStatus> = { a_faire: 'en_cours', en_cours: 'terminee', attente_tiers: 'terminee', bloquee: 'en_cours', terminee: 'terminee', non_necessaire: 'a_faire' }

export default function SaleDetail() {
  const { id } = useParams()
  const d = useData()
  const { settings: s } = d
  const open = useDialog()
  const nav = useNavigate()
  const run = useRun()
  const { confirm } = useUI()
  const [stepEdit, setStepEdit] = useState<string | null>(null)
  const [edit, setEdit] = useState(false)
  const [exc, setExc] = useState(false)
  const sale = d.sales.find((x) => x.id === id)
  if (!sale) return <Empty title="Dossier introuvable" action={<Button onClick={() => nav('/ventes')}>Retour aux ventes</Button>} />
  const c = d.byClient.get(sale.clientId)
  const v = sale.vehicleId ? d.byVehicle.get(sale.vehicleId) : undefined
  const ints = d.interventions.filter((i) => i.saleId === sale.id)
  const st = prepState(sale, d.interventions, s)
  const tasks = d.tasks.filter((t) => t.saleId === sale.id && t.statut === 'ouverte')
  const notes = d.notes.filter((n) => n.linkId === sale.id)
  const ct = ctAVerifier(v, s)
  const up = (p: Partial<Sale>, msg?: string) => run(() => updateSale(sale.id, p), msg)
  const cur = sale.steps.find((x) => x.id === stepEdit)
  const clos = sale.statut === 'livre' || sale.statut === 'annule'
  const enPrep = ['confirmee', 'preparation', 'pret'].includes(sale.statut)

  const livrer = async () => {
    const reste = st.manquantes.map((m) => m.label).join(', ')
    const msg = st.pret
      ? 'La checklist est complète. Confirmez que la livraison a bien eu lieu et que les personnes autorisées ont validé le véhicule.'
      : `Attention : étapes obligatoires non validées (${reste}). VO PILOT ne peut pas juger si le véhicule est livrable : ne confirmez que si les personnes autorisées ont validé la situation.`
    if (await confirm({ title: 'Confirmer la livraison effective ?', message: msg, confirmLabel: 'Livraison effectuée', danger: !st.pret })) up({ statut: 'livre', livraisonEffective: today() }, 'Livraison enregistrée — suivi après-vente proposé')
  }

  return (
    <div>
      <PageHead back="/ventes" title={sale.vehiculeLabel} sub={<span className="flex flex-wrap items-center gap-1.5"><Badge tone={SALE_TONE[sale.statut]}>{SALE_STATUS[sale.statut]}</Badge>{enPrep && <Badge tone={PREP_TONE[st.etat]}>{PREP_LABEL[st.etat]}</Badge>}<span>{sale.ref}</span>{sale.demo && <Badge>Démo</Badge>}</span>}
        right={<button type="button" aria-label="Favori" onClick={() => toggleFavori('sales', sale.id)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><Star size={20} className={cx(sale.favori ? 'fill-current text-warn' : 'text-muted')} /></button>} />

      {/* Réponse immédiate : qu'est-ce qui manque pour livrer ? */}
      {!clos && (
        <Card className={cx('mb-4 p-4', st.etat === 'bloque' || st.etat === 'retard' ? 'border-bad/60' : st.pret ? 'border-ok/60' : '')}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Ce qui manque pour livrer</p>
          {st.pret ? (
            <p className="mt-1 flex items-center gap-2 font-bold text-ok"><CheckCircle2 size={18} />Checklist complète</p>
          ) : (
            <ul className="mt-1.5 space-y-1 text-sm">
              {st.bloquees.map((b) => <li key={b.id} className="flex gap-2 font-semibold text-bad"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{b.label} — bloqué{b.commentaire ? ` : ${b.commentaire}` : ''}</li>)}
              {st.manquantes.filter((m) => m.statut !== 'bloquee').map((m) => <li key={m.id} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />{m.label} <span className="text-muted">({STEP_LABEL[m.statut].toLowerCase()})</span></li>)}
              {!sale.steps.length && <li className="text-muted">Aucune étape définie.</li>}
            </ul>
          )}
          {st.documentsManquants.length > 0 && <p className="mt-2 text-sm text-warn">Documents à récupérer : {st.documentsManquants.join(', ')}</p>}
          <div className="mt-3"><Progress value={st.faits} max={st.total} tone={st.pret ? 'ok' : st.etat === 'bloque' ? 'bad' : 'accent'} /></div>
          <p className="mt-2 text-sm">{sale.livraisonPrevue ? <>Livraison prévue <b>{fmtDateTime(sale.livraisonPrevue)}</b>{st.joursAvantLivraison !== null && (st.joursAvantLivraison < 0 ? <span className="font-semibold text-bad"> · date dépassée de {-st.joursAvantLivraison} j</span> : <span className="text-muted"> · dans {st.joursAvantLivraison} j</span>)}</> : <span className="text-warn">Livraison non programmée</span>}</p>
          <Field label="Prochaine action sur ce dossier" className="mt-3"><input className="inp" defaultValue={sale.prochaineAction ?? ''} placeholder="ex. Relancer le prestataire pneus demain matin" onBlur={(e) => e.target.value !== (sale.prochaineAction ?? '') && up({ prochaineAction: e.target.value }, 'Prochaine action enregistrée')} /></Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {enPrep && <Button variant={st.pret ? 'primary' : 'outline'} onClick={livrer}>Livraison effectuée</Button>}
            {!enPrep && <Button onClick={() => up({ statut: 'confirmee', dateConfirmation: today() }, 'Vente confirmée')}>Confirmer la vente</Button>}
            <Button variant="outline" onClick={() => nav(`/whatsapp?client=${sale.clientId}&modele=${st.pret ? 'rdv_livraison' : 'point_preparation'}${sale.vehicleId ? `&vehicule=${sale.vehicleId}` : ''}`)}><MessageCircle size={16} />Informer le client</Button>
          </div>
          <p className="mt-2 text-xs text-muted">VO PILOT signale les vérifications à faire ; la décision de livrer appartient aux personnes autorisées.</p>
        </Card>
      )}
      {sale.statut === 'livre' && <p className="mb-4 flex items-center gap-2 rounded-2xl bg-ok-soft px-4 py-3 text-sm font-semibold text-ok"><CheckCircle2 size={18} />Livré le {fmtDay(sale.livraisonEffective)}</p>}

      {tasks.length > 0 && <Section title="Actions liées"><div className="space-y-2">{tasks.map((t) => <TaskRow key={t.id} t={t} />)}</div></Section>}

      <Section title="Checklist de préparation">
        <Card className="divide-y divide-line">
          {sale.steps.map((x) => (
            <div key={x.id} className="flex items-center gap-2 px-3 py-2">
              <button type="button" aria-label={`Avancer ${x.label}`} disabled={clos} onClick={() => run(() => setStep(sale.id, x.id, { statut: NEXT[x.statut] }))} className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full border-2', x.statut === 'terminee' ? 'border-ok bg-ok-soft text-ok' : x.statut === 'bloquee' ? 'border-bad bg-bad-soft text-bad' : x.statut === 'non_necessaire' ? 'border-line bg-soft text-muted' : 'border-line text-muted hover:border-ok')}>
                {x.statut === 'terminee' ? <CheckCircle2 size={20} /> : x.statut === 'bloquee' ? <AlertTriangle size={18} /> : x.statut === 'non_necessaire' ? '–' : ''}
              </button>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setStepEdit(x.id)}>
                <span className={cx('block text-sm font-semibold', x.statut === 'non_necessaire' && 'text-muted line-through')}>{x.label}{!x.obligatoire && <span className="font-normal text-muted"> · facultatif</span>}</span>
                {(x.commentaire || x.responsable) && <span className="block truncate text-xs text-muted">{[x.responsable, x.commentaire].filter(Boolean).join(' · ')}</span>}
                {x.id === 'ct' && x.statut !== 'terminee' && x.statut !== 'non_necessaire' && ct.aVerifier && <span className="block text-xs font-medium text-warn">À vérifier (règle déclarée : CT de moins de {s.delais.ctMaxMois} mois)</span>}
              </button>
              <Badge tone={STEP_TONE[x.statut]}>{STEP_LABEL[x.statut]}</Badge>
            </div>
          ))}
        </Card>
        <p className="mt-1.5 px-1 text-xs text-muted">Touchez le rond pour passer à l’étape suivante, la ligne pour choisir un statut précis.</p>
      </Section>

      <Section title="Interventions" right={!clos && <Button size="sm" variant="soft" onClick={() => open('intervention', { saleId: sale.id })}><Plus size={15} />Intervention</Button>}>
        <div className="space-y-2">
          {ints.map((i) => (
            <button key={i.id} type="button" onClick={() => open('intervention', { interventionId: i.id })} className={cx('flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left', i.statut === 'bloquee' ? 'border-bad/60' : 'border-line')}>
              <Wrench size={18} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{i.type}{i.prestataire ? ` — ${i.prestataire}` : ''}</span><span className="block truncate text-xs text-muted">{[i.datePrevue ? `prévue ${fmtDay(i.datePrevue)}` : i.dateDemande ? `demandée ${fmtDay(i.dateDemande)}` : '', i.prochaineRelance ? `relance ${fmtDay(i.prochaineRelance)}` : '', i.commentaire].filter(Boolean).join(' · ')}</span></span>
              <Badge tone={i.statut === 'bloquee' ? 'bad' : i.statut === 'terminee' ? 'ok' : 'accent'}>{INT_STATUS[i.statut]}</Badge>
            </button>
          ))}
          {!ints.length && <p className="px-1 text-sm text-muted">Aucune intervention. Ajoutez-en une pour suivre un prestataire (pneus, carrosserie, atelier…).</p>}
        </div>
      </Section>

      <Section title="Documents (statut uniquement)">
        <Card className="divide-y divide-line">
          {sale.documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{doc.type}{doc.dateReception && <span className="text-xs text-muted"> · {fmtDay(doc.dateReception)}</span>}</span>
              <select className="inp !min-h-9 !w-auto !py-1 text-sm" aria-label={`Statut ${doc.type}`} value={doc.statut} onChange={(e) => run(() => setDocument(sale.id, doc.id, e.target.value as 'manquant'))}>
                <option value="manquant">Manquant</option><option value="recu">Reçu</option><option value="verifie">Vérifié</option>
              </select>
            </div>
          ))}
        </Card>
        <p className="mt-1.5 px-1 text-xs text-muted">Aucune pièce n’est stockée ici : seul le statut « reçu / vérifié dans le système professionnel » est conservé.</p>
      </Section>

      <Section title="Exception de livraison" right={!clos && !sale.exception?.active && <Button size="sm" variant="ghost" onClick={() => setExc(true)}><ShieldAlert size={15} />Déclarer</Button>}>
        {sale.exception?.active ? (
          <Card className="space-y-1 border-warn/50 p-4 text-sm">
            <p className="font-semibold text-warn">Intervention restante : {sale.exception.interventionRestante}</p>
            <p>Validée par : <b>{sale.exception.valideePar || '— à renseigner'}</b></p>
            <p>Information client : {sale.exception.infoClient || '—'}</p>
            <p>Accord/document conservé : {sale.exception.accordConserve ? 'oui' : 'non'}</p>
            <p>Rendez-vous de retour : {sale.exception.rdvRetour ? fmtDateTime(sale.exception.rdvRetour) : 'à fixer'}</p>
            <div className="flex gap-2 pt-2"><Button size="sm" variant="outline" onClick={() => setExc(true)}>Modifier</Button>{!sale.exception.resolue ? <Button size="sm" variant="ok" onClick={() => up({ exception: { ...sale.exception!, resolue: true } }, 'Exception résolue')}>Marquer résolue</Button> : <Badge tone="ok">Résolue</Badge>}</div>
          </Card>
        ) : <p className="px-1 text-sm text-muted">Aucune. À utiliser si une intervention secondaire reste à faire après livraison, sur validation d’une personne autorisée.</p>}
      </Section>

      <Section title="Dossier" right={<Button size="sm" variant="soft" onClick={() => setEdit(true)}>Modifier</Button>}>
        <Card className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 text-sm">
          <div><p className="text-xs text-muted">Client</p><Link className="font-semibold text-accent" to={`/clients/${sale.clientId}`}>{clientName(c)}</Link></div>
          <div><p className="text-xs text-muted">Véhicule</p>{v ? <Link className="font-semibold text-accent" to={`/vehicules/${v.id}`}>{v.ref}</Link> : <span>hors catalogue</span>}</div>
          <div><p className="text-xs text-muted">Prix de vente</p><p className="font-semibold">{euro(sale.prixVente)}</p></div>
          <div><p className="text-xs text-muted">Remise / reprise</p><p>{euro(sale.remise)} / {euro(sale.reprise)}</p></div>
          <div><p className="text-xs text-muted">Financement</p><p>{sale.financementType || '—'}</p></div>
          <div><p className="text-xs text-muted">Paiement</p><p>{{ attente: 'En attente', partiel: 'Partiel', recu: 'Reçu' }[sale.paiement]}</p></div>
          <div><p className="text-xs text-muted">Bon de commande</p><p>{fmtDay(sale.dateBC)}</p></div>
          <div><p className="text-xs text-muted">Confirmation</p><p>{fmtDay(sale.dateConfirmation)}</p></div>
          {sale.notes && <p className="col-span-2 whitespace-pre-line text-muted">{sale.notes}</p>}
        </Card>
      </Section>

      <Section title="Commission">
        <Card className="p-4 text-sm">
          {sale.commission.estime === undefined ? <p className="text-muted">Barème non renseigné : aucune estimation. <Link className="font-semibold text-accent" to="/commissions">Renseigner mon barème</Link></p> : <>
            <p>Estimation : <b className="text-base">{euro(sale.commission.estime)}</b></p>
            <p className="text-xs text-muted">{sale.commission.detail?.join(' · ')}</p>
          </>}
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="Confirmée (€)"><N value={sale.commission.confirme} onChange={(x) => up({ commission: { ...sale.commission, confirme: x } })} /></Field>
            <Field label="Versée (€)"><N value={sale.commission.verse} onChange={(x) => up({ commission: { ...sale.commission, verse: x } })} /></Field>
            <Field label="Mois de versement"><input className="inp" type="month" value={sale.commission.moisVersement ?? ''} onChange={(e) => up({ commission: { ...sale.commission, moisVersement: e.target.value } })} /></Field>
          </div>
        </Card>
      </Section>

      <Section title="Notes" right={<Button size="sm" variant="soft" onClick={() => open('note', { linkType: 'sale', linkId: sale.id })}><StickyNote size={15} />Note</Button>}>
        {notes.length ? <div className="space-y-2">{notes.map((n) => <button key={n.id} type="button" onClick={() => open('note', { noteId: n.id })} className="block w-full whitespace-pre-line rounded-2xl border border-line bg-card px-4 py-3 text-left text-sm">{n.texte}</button>)}</div> : <p className="px-1 text-sm text-muted">Aucune note.</p>}
      </Section>

      <div className="flex flex-wrap gap-2">
        {sale.statut !== 'annule' && <Button variant="outline" onClick={async () => { if (await confirm({ title: 'Annuler cette vente ?', message: 'La vente ne sera plus comptée dans les statistiques et le véhicule redeviendra disponible.', confirmLabel: 'Annuler la vente', danger: true })) up({ statut: 'annule' }, 'Vente annulée') }}>Annuler la vente</Button>}
        <Button variant="danger" onClick={async () => { if (await confirm({ title: 'Supprimer le dossier ?', message: 'Le dossier, ses interventions et ses tâches seront définitivement supprimés.', confirmLabel: 'Supprimer', danger: true })) { await run(() => deleteSale(sale.id), 'Dossier supprimé'); nav('/ventes') } }}><Trash2 size={16} />Supprimer</Button>
      </div>

      <Sheet open={!!cur} onClose={() => setStepEdit(null)} title={cur?.label ?? ''} footer={<>
        <Button variant="outline" className="mr-auto" onClick={() => { open('intervention', { saleId: sale.id, stepId: cur!.id }); setStepEdit(null) }}><Wrench size={16} />Intervention</Button>
        <Button onClick={() => setStepEdit(null)}>Fermer</Button></>}>
        {cur && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STEP_LABEL) as StepStatus[]).map((k) => <button key={k} type="button" onClick={() => run(() => setStep(sale.id, cur.id, { statut: k }))} className={cx('min-h-12 rounded-xl border px-3 text-sm font-semibold', cur.statut === k ? 'border-accent bg-accent text-white' : 'border-line bg-card')}>{STEP_LABEL[k]}</button>)}
          </div>
          <Field label="Responsable / prestataire"><Sel value={cur.responsable} onChange={(x) => run(() => setStep(sale.id, cur.id, { responsable: x }))} options={s.prep.prestataires} /></Field>
          <Field label={cur.statut === 'bloquee' ? 'Cause du blocage' : 'Commentaire'}><textarea className="inp" defaultValue={cur.commentaire ?? ''} onBlur={(e) => run(() => setStep(sale.id, cur.id, { commentaire: e.target.value }))} /></Field>
          {cur.id === 'ct' && <p className="text-xs text-muted">{ct.raison}. Règle déclarée et réglable ; vérifiez les exigences réellement applicables.</p>}
        </div>}
      </Sheet>
      {edit && <EditSale sale={sale} onClose={() => setEdit(false)} />}
      {exc && <ExceptionSheet sale={sale} onClose={() => setExc(false)} />}
    </div>
  )
}

function EditSale({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const run = useRun()
  const [f, setF] = useState({ ...sale, livraison: toLocalInput(sale.livraisonPrevue) })
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))
  const save = () => run(async () => {
    await updateSale(sale.id, { vehiculeLabel: f.vehiculeLabel, prixVente: f.prixVente || 0, remise: f.remise || 0, reprise: f.reprise || 0, financementType: f.financementType, statut: f.statut, paiement: f.paiement, dateBC: f.dateBC || undefined, dateConfirmation: f.dateConfirmation || undefined, livraisonPrevue: fromLocalInput(f.livraison), livraisonEffective: f.livraisonEffective || undefined, notes: f.notes })
    onClose()
  }, 'Dossier mis à jour')
  return (
    <Sheet open onClose={onClose} title="Modifier le dossier" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Véhicule" className="col-span-2"><input className="inp" value={f.vehiculeLabel} onChange={(e) => set({ vehiculeLabel: e.target.value })} /></Field>
        <Field label="Statut" className="col-span-2"><Sel value={f.statut} onChange={(v) => set({ statut: v as SaleStatus })} options={SALE_ORDER.map((x) => ({ value: x, label: SALE_STATUS[x] }))} empty={null} /></Field>
        <Field label="Prix de vente (€)"><N value={f.prixVente} onChange={(v) => set({ prixVente: v ?? 0 })} /></Field>
        <Field label="Remise (€)"><N value={f.remise} onChange={(v) => set({ remise: v ?? 0 })} /></Field>
        <Field label="Reprise (€)"><N value={f.reprise} onChange={(v) => set({ reprise: v ?? 0 })} /></Field>
        <Field label="Financement"><Sel value={f.financementType} onChange={(v) => set({ financementType: v })} options={FINANCEMENTS} /></Field>
        <Field label="Paiement"><Sel value={f.paiement} onChange={(v) => set({ paiement: v as Sale['paiement'] })} options={[{ value: 'attente', label: 'En attente' }, { value: 'partiel', label: 'Partiel' }, { value: 'recu', label: 'Reçu' }]} empty={null} /></Field>
        <Field label="Bon de commande"><input className="inp" type="date" value={f.dateBC ?? ''} onChange={(e) => set({ dateBC: e.target.value })} /></Field>
        <Field label="Confirmation"><input className="inp" type="date" value={f.dateConfirmation ?? ''} onChange={(e) => set({ dateConfirmation: e.target.value })} /></Field>
        <Field label="Livraison effective"><input className="inp" type="date" value={f.livraisonEffective ?? ''} onChange={(e) => set({ livraisonEffective: e.target.value })} /></Field>
        <Field label="Livraison prévue" className="col-span-2"><input className="inp" type="datetime-local" value={f.livraison} onChange={(e) => set({ livraison: e.target.value })} /></Field>
        <Field label="Notes" className="col-span-2"><textarea className="inp" value={f.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} /></Field>
      </div>
    </Sheet>
  )
}

function ExceptionSheet({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const run = useRun()
  const [e, setE] = useState<PrepException>(sale.exception ?? { active: true, interventionRestante: '' })
  const set = (p: Partial<PrepException>) => setE((x) => ({ ...x, ...p }))
  const save = () => run(async () => {
    if (!e.interventionRestante.trim()) throw new Error('Décrivez l’intervention restante.')
    if (!e.valideePar?.trim()) throw new Error('Indiquez la personne autorisée qui a validé la situation.')
    await updateSale(sale.id, { exception: { ...e, active: true } })
    onClose()
  }, 'Exception enregistrée')
  return (
    <Sheet open onClose={onClose} title="Exception de livraison" footer={<>{sale.exception?.active && <Button variant="danger" className="mr-auto" onClick={() => { run(() => updateSale(sale.id, { exception: undefined })); onClose() }}>Retirer</Button>}<Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
      <p className="mb-3 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">VO PILOT ne conclut jamais qu’un véhicule est sûr ou livrable. Cette fiche trace une décision prise par une personne autorisée.</p>
      <div className="space-y-3">
        <Field label="Intervention restante"><input className="inp" value={e.interventionRestante} onChange={(x) => set({ interventionRestante: x.target.value })} placeholder="ex. retouche carrosserie pare-chocs arrière" /></Field>
        <Field label="Validation professionnelle par"><input className="inp" value={e.valideePar ?? ''} onChange={(x) => set({ valideePar: x.target.value })} placeholder="Nom / fonction de la personne autorisée" /></Field>
        <Field label="Information transmise au client"><textarea className="inp" value={e.infoClient ?? ''} onChange={(x) => set({ infoClient: x.target.value })} /></Field>
        <div className="flex items-center justify-between text-sm"><span>Accord ou document conservé</span><Toggle label="Accord conservé" checked={!!e.accordConserve} onChange={(v) => set({ accordConserve: v })} /></div>
        <Field label="Rendez-vous de retour"><input className="inp" type="datetime-local" value={toLocalInput(e.rdvRetour)} onChange={(x) => set({ rdvRetour: fromLocalInput(x.target.value) })} /></Field>
      </div>
    </Sheet>
  )
}
void dayKey
