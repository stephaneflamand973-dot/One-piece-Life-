import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Car, Check, FileText, MessageCircle, Pencil, Phone, Plus, ShoppingBag, Star, StickyNote, Trash2 } from 'lucide-react'
import type { Client } from '../lib/types'
import { FINANCEMENTS } from '../lib/defaults'
import { fmtDateTime, fmtDay, dayKey, relative } from '../lib/dates'
import { deleteClient, markLeadHandled, saveClient, setClientStatus, toggleFavori } from '../services/actions'
import { clientName, isActiveStage, leadDeadline, leadUrgency, SALE_STATUS, vehicleLabel, vehiclesForClient } from '../services/logic'
import { euro, kmFmt } from '../services/whatsapp'
import { useData, useNow } from '../ui/data'
import { Sel, useDialog } from '../ui/forms'
import { Badge, Button, Card, Chip, cx, Empty, Field, Section, Sheet, Toggle, useRun, useUI } from '../ui/kit'
import { PageHead, StageBadge, TaskRow } from '../ui/shared'

const I_LABEL: Record<string, string> = { appel_sortant: 'Appel sortant', appel_entrant: 'Appel entrant', whatsapp: 'WhatsApp', email: 'E-mail', rdv: 'Rendez-vous', essai: 'Essai', devis: 'Devis', negociation: 'Négociation', remarque: 'Remarque', statut: 'Changement de statut', lead: 'Lead' }
const QUESTIONS: { key: keyof Client | 'recherche'; q: string; filled: (c: Client) => boolean }[] = [
  { key: 'recherche', q: 'Quel véhicule recherchez-vous ?', filled: (c) => !!(c.recherche?.texte || c.recherche?.modele || c.recherche?.categorie) },
  { key: 'usage', q: 'Pour quel usage ? (trajets, famille, professionnel…)', filled: (c) => !!c.usage },
  { key: 'recherche', q: 'Quel budget souhaitez-vous respecter ?', filled: (c) => !!c.recherche?.budgetMax },
  { key: 'reprise', q: 'Avez-vous un véhicule à reprendre ?', filled: (c) => !!c.reprise },
  { key: 'financement', q: 'Souhaitez-vous un financement ?', filled: (c) => !!c.financement },
  { key: 'recherche', q: 'Quelles caractéristiques sont indispensables ?', filled: (c) => !!(c.recherche?.equipements || c.recherche?.boite || c.recherche?.carburant) },
  { key: 'delaiAchat', q: 'Dans quel délai souhaitez-vous acheter ?', filled: (c) => !!c.delaiAchat },
]

export default function ClientDetail() {
  const { id } = useParams()
  const d = useData()
  const { settings: s } = d
  const now = useNow()
  const open = useDialog()
  const nav = useNavigate()
  const run = useRun()
  const { confirm } = useUI()
  const [tab, setTab] = useState<'suivi' | 'besoin' | 'vehicules' | 'devis'>('suivi')
  const [perdu, setPerdu] = useState(false)
  const [motif, setMotif] = useState('')
  const c = id ? d.byClient.get(id) : undefined
  const matches = useMemo(() => (c ? vehiclesForClient(c, d.vehicles) : []), [c, d.vehicles])
  if (!c) return <Empty title="Fiche introuvable" action={<Button onClick={() => nav('/clients')}>Retour aux clients</Button>}>Elle a peut-être été supprimée.</Empty>

  const tasks = d.tasks.filter((t) => t.clientId === c.id)
  const ouvertes = tasks.filter((t) => t.statut === 'ouverte').sort((a, b) => (a.due ?? 'z').localeCompare(b.due ?? 'z'))
  const timeline = d.interactions.filter((i) => i.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date))
  const quotes = d.quotes.filter((q) => q.clientId === c.id)
  const sales = d.sales.filter((x) => x.clientId === c.id)
  const notes = d.notes.filter((n) => n.linkId === c.id)
  const u = leadUrgency(c, s, now)
  const actif = isActiveStage(s.pipeline, c.statut)
  const essaiFait = tasks.some((t) => t.type === 'essai' && t.statut !== 'annulee') || timeline.some((i) => i.type === 'essai')
  const manquantes = QUESTIONS.filter((x) => !x.filled(c))
  const bloque = c.consentement?.nePasContacter
  const patch = (p: Partial<Client>) => run(() => saveClient({ id: c.id, ...p }))

  // Conseils contextuels déterministes (assistant de vente) : toujours fondés sur l'état de la fiche.
  const conseils: { txt: string; action?: () => void; label?: string }[] = []
  if (actif && !c.usage && !['nouveau', 'a_contacter', 'injoignable'].includes(c.statut)) conseils.push({ txt: 'L’usage du véhicule n’est pas renseigné : explorez-le pour mieux cibler la proposition.', action: () => setTab('besoin'), label: 'Compléter' })
  if (actif && !essaiFait && ['qualifie', 'propose', 'rdv', 'devis', 'negociation'].includes(c.statut)) conseils.push({ txt: 'Aucun essai proposé : un essai aide le client à se décider, sans attendre un signal d’achat fort.', action: () => open('tache', { clientId: c.id, type: 'essai' }), label: 'Planifier un essai' })
  if (actif && !ouvertes.length) conseils.push({ txt: 'Aucune prochaine action : fixez une étape concrète (relance datée, rendez-vous, devis actualisé, vérification de reprise).', action: () => open('tache', { clientId: c.id, type: 'relance' }), label: 'Planifier' })
  if (actif && matches.length && !quotes.length && ['contact', 'qualifie'].includes(c.statut)) conseils.push({ txt: `${matches.length} véhicule(s) du catalogue correspondent à sa recherche.`, action: () => setTab('vehicules'), label: 'Voir' })

  return (
    <div>
      <PageHead back="/clients" title={clientName(c)} sub={<span className="flex flex-wrap items-center gap-1.5"><StageBadge c={c} /><span>{c.ref}</span>{c.source && <span>· {c.source}</span>}{c.demo && <Badge>Démo</Badge>}</span>}
        right={<><button type="button" aria-label="Favori" onClick={() => toggleFavori('clients', c.id)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><Star size={20} className={cx(c.favori ? 'fill-current text-warn' : 'text-muted')} /></button><Button variant="outline" size="sm" onClick={() => open('prospect', { clientId: c.id })}><Pencil size={15} />Modifier</Button></>} />

      {u && u !== 'traite' && (
        <div className={cx('mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm', u === 'ok' ? 'bg-warn-soft text-warn' : 'bg-bad-soft text-bad')}>
          <span className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} />Lead reçu {fmtDateTime(c.leadRecuLe)} — premier traitement {relative(leadDeadline(c, s)!, now)}</span>
          <Button size="sm" variant="outline" onClick={() => run(() => markLeadHandled(c.id), 'Marqué traité dans VO PILOT — à reporter dans UpYourLeads')}>Marquer traité</Button>
        </div>
      )}
      {bloque && <p className="mb-4 rounded-2xl bg-bad-soft px-4 py-3 text-sm font-semibold text-bad">Ce client a demandé à ne plus être contacté.</p>}

      <div className="mb-4 grid grid-cols-4 gap-2">
        <a href={c.tel && !bloque ? `tel:${c.tel.replace(/\s/g, '')}` : undefined} aria-disabled={!c.tel || bloque} className={cx('flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-accent text-xs font-semibold text-white', (!c.tel || bloque) && 'pointer-events-none opacity-40')}><Phone size={20} />Appeler</a>
        <button type="button" disabled={bloque} onClick={() => nav(`/whatsapp?client=${c.id}`)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-ok-soft text-xs font-semibold text-ok disabled:opacity-40"><MessageCircle size={20} />WhatsApp</button>
        <button type="button" onClick={() => open('interaction', { clientId: c.id })} className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border border-line bg-card text-xs font-semibold"><Check size={20} />Noter</button>
        <button type="button" onClick={() => open('tache', { clientId: c.id, type: 'relance' })} className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border border-line bg-card text-xs font-semibold"><Plus size={20} />Planifier</button>
      </div>

      {conseils.length > 0 && (
        <Card className="mb-4 divide-y divide-line">
          {conseils.slice(0, 3).map((k, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm"><span className="flex-1">{k.txt}</span>{k.action && <Button size="sm" variant="soft" onClick={k.action}>{k.label}</Button>}</div>
          ))}
        </Card>
      )}

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={tab === 'suivi'} onClick={() => setTab('suivi')}>Suivi</Chip>
        <Chip active={tab === 'besoin'} count={manquantes.length} tone="warn" onClick={() => setTab('besoin')}>Découverte</Chip>
        <Chip active={tab === 'vehicules'} count={matches.length} onClick={() => setTab('vehicules')}>Véhicules</Chip>
        <Chip active={tab === 'devis'} count={quotes.length + sales.length} onClick={() => setTab('devis')}>Devis & ventes</Chip>
      </div>

      {tab === 'suivi' && <>
        <Section title="Prochaines actions" right={<Button size="sm" variant="soft" onClick={() => open('tache', { clientId: c.id, type: 'relance' })}><Plus size={15} />Ajouter</Button>}>
          <div className="space-y-2">
            {ouvertes.map((t) => <TaskRow key={t.id} t={t} showClient={false} now={now} />)}
            {!ouvertes.length && <p className={cx('rounded-2xl border border-dashed px-4 py-3 text-sm', actif ? 'border-warn/50 text-warn' : 'border-line text-muted')}>{actif ? 'Aucune prochaine action programmée.' : 'Aucune action programmée.'}</p>}
          </div>
        </Section>
        {ouvertes.some((t) => ['rdv', 'essai'].includes(t.type)) && <Button variant="outline" className="mb-5 w-full" onClick={() => nav(`/fiche-rdv/${c.id}`)}><FileText size={16} />Préparer le rendez-vous (fiche imprimable)</Button>}
        <Section title="Statut du dossier">
          <Card className="p-4">
            <Sel value={c.statut} onChange={(v) => (v === 'perdu' ? setPerdu(true) : run(() => setClientStatus(c.id, v), 'Statut mis à jour'))} options={s.pipeline.map((p) => ({ value: p.id, label: p.label }))} empty={null} />
            {c.statut === 'perdu' && c.motifPerte && <p className="mt-2 text-sm text-muted">Motif : {c.motifPerte}</p>}
          </Card>
        </Section>
        <Section title="Historique" right={<Button size="sm" variant="soft" onClick={() => open('interaction', { clientId: c.id })}><Plus size={15} />Échange</Button>}>
          {timeline.length ? (
            <Card className="divide-y divide-line">
              {timeline.map((i) => (
                <div key={i.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{I_LABEL[i.type] ?? i.type}{i.resultat ? ` — ${i.resultat}` : ''}</span><span className="shrink-0 text-xs text-muted">{fmtDateTime(i.date)}</span></div>
                  {i.commentaire && <p className="mt-0.5 whitespace-pre-line text-sm text-muted">{i.commentaire}</p>}
                </div>
              ))}
            </Card>
          ) : <p className="px-1 text-sm text-muted">Aucun échange enregistré. Premier contact : {fmtDay(c.premierContact)}.</p>}
        </Section>
        <Section title="Notes" right={<Button size="sm" variant="soft" onClick={() => open('note', { linkType: 'client', linkId: c.id })}><StickyNote size={15} />Note</Button>}>
          {notes.length ? <div className="space-y-2">{notes.map((n) => <button key={n.id} type="button" onClick={() => open('note', { noteId: n.id })} className="block w-full rounded-2xl border border-line bg-card px-4 py-3 text-left text-sm"><span className="whitespace-pre-line">{n.texte}</span><span className="mt-1 block text-xs text-muted">{fmtDay(dayKey(n.updatedAt))}</span></button>)}</div> : c.commentaires ? <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">{c.commentaires}</p> : <p className="px-1 text-sm text-muted">Aucune note.</p>}
        </Section>
        <Section title="Préférences de contact">
          <Card className="divide-y divide-line">
            {([['tel', 'Téléphone'], ['whatsapp', 'WhatsApp'], ['email', 'E-mail']] as const).map(([k, l]) => (
              <div key={k} className="flex items-center justify-between px-4 py-2.5 text-sm"><span>Accepte : {l}</span><Toggle label={l} checked={!!c.consentement?.[k]} onChange={(v) => patch({ consentement: { ...c.consentement, [k]: v } })} /></div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="font-semibold text-bad">Ne plus contacter</span><Toggle label="Ne plus contacter" checked={!!c.consentement?.nePasContacter} onChange={(v) => patch({ consentement: { ...c.consentement, nePasContacter: v } })} /></div>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span>Fréquence de relance souhaitée (jours)</span><input className="inp !w-20" inputMode="numeric" aria-label="Fréquence de relance" defaultValue={c.frequenceRelanceJours ?? ''} placeholder={String(s.delais.relanceDefautJours)} onBlur={(e) => patch({ frequenceRelanceJours: e.target.value ? Math.max(1, +e.target.value || 1) : undefined })} /></div>
          </Card>
        </Section>
        <Button variant="danger" onClick={async () => { if (await confirm({ title: 'Supprimer cette fiche ?', message: `${clientName(c)} : la fiche, son historique, ses tâches et ses devis seront définitivement supprimés.`, confirmLabel: 'Supprimer', danger: true })) { const ok = await run(async () => { await deleteClient(c.id); return true }, 'Fiche supprimée'); if (ok) nav('/clients') } }}><Trash2 size={16} />Supprimer la fiche</Button>
      </>}

      {tab === 'besoin' && <>
        <Section title="Découverte guidée">
          <Card className="divide-y divide-line">
            {QUESTIONS.map((x, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full', x.filled(c) ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn')}>{x.filled(c) ? <Check size={14} /> : '?'}</span>
                <span className={cx('flex-1', x.filled(c) && 'text-muted')}>{x.q}</span>
              </div>
            ))}
          </Card>
        </Section>
        <Section title="Réponses">
          <Card className="grid grid-cols-2 gap-3 p-4">
            <Field label="Usage prévu" className="col-span-2" hint="Point à explorer systématiquement."><input className="inp" defaultValue={c.usage ?? ''} onBlur={(e) => e.target.value !== (c.usage ?? '') && patch({ usage: e.target.value })} placeholder="Trajets quotidiens, famille, professionnel…" /></Field>
            <Field label="Véhicule recherché" className="col-span-2"><input className="inp" defaultValue={c.recherche?.texte ?? ''} onBlur={(e) => patch({ recherche: { ...c.recherche, texte: e.target.value } })} /></Field>
            <Field label="Modèle"><input className="inp" defaultValue={c.recherche?.modele ?? ''} onBlur={(e) => patch({ recherche: { ...c.recherche, modele: e.target.value } })} /></Field>
            <Field label="Budget max (€)"><input className="inp" inputMode="numeric" defaultValue={c.recherche?.budgetMax ?? ''} onBlur={(e) => patch({ recherche: { ...c.recherche, budgetMax: +e.target.value || undefined } })} /></Field>
            <Field label="Reprise"><input className="inp" defaultValue={c.reprise ?? ''} onBlur={(e) => patch({ reprise: e.target.value })} placeholder="Modèle, année, km" /></Field>
            <Field label="Financement"><Sel value={c.financement} onChange={(v) => patch({ financement: v })} options={FINANCEMENTS} /></Field>
            <Field label="Indispensables"><input className="inp" defaultValue={c.recherche?.equipements ?? ''} onBlur={(e) => patch({ recherche: { ...c.recherche, equipements: e.target.value } })} placeholder="Caméra, 5 portes…" /></Field>
            <Field label="Délai d’achat"><input className="inp" defaultValue={c.delaiAchat ?? ''} onBlur={(e) => patch({ delaiAchat: e.target.value })} /></Field>
            <Field label="Modèles déjà envisagés / contraintes" className="col-span-2"><input className="inp" defaultValue={c.contraintes ?? ''} onBlur={(e) => patch({ contraintes: e.target.value })} /></Field>
          </Card>
          <Button variant="ghost" className="mt-2" onClick={() => open('prospect', { clientId: c.id })}>Tous les champs de la fiche</Button>
        </Section>
      </>}

      {tab === 'vehicules' && (
        <Section title="Véhicules du catalogue correspondant à la recherche">
          <div className="space-y-2">
            {matches.map(({ vehicle: v, match }) => (
              <Card key={v.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/vehicules/${v.id}`} className="min-w-0"><p className="truncate font-bold">{vehicleLabel(v)}</p><p className="text-sm text-muted">{[v.annee, kmFmt(v.km), v.boite, v.site].filter(Boolean).join(' · ')}</p></Link>
                  <p className="shrink-0 font-bold">{euro(v.prix)}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">{match.raisons.map((r) => <Badge key={r} tone="ok">{r}</Badge>)}{match.ecarts.map((r) => <Badge key={r} tone="warn">{r}</Badge>)}{v.statut === 'a_verifier' && <Badge tone="warn">Disponibilité à vérifier</Badge>}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => nav(`/devis/nouveau?client=${c.id}&vehicule=${v.id}`)}><FileText size={15} />Devis</Button>
                  <Button size="sm" variant="outline" onClick={() => nav(`/whatsapp?client=${c.id}&vehicule=${v.id}&modele=presentation`)}><MessageCircle size={15} />Présenter</Button>
                  <Button size="sm" variant="outline" onClick={() => open('tache', { clientId: c.id, type: 'essai' })}><Car size={15} />Essai</Button>
                </div>
              </Card>
            ))}
            {!matches.length && <Empty icon={<Car size={28} />} title="Aucune correspondance" action={<Button variant="outline" onClick={() => setTab('besoin')}>Préciser la recherche</Button>}>Le rapprochement utilise uniquement les critères renseignés (modèle, budget, boîte…) et les véhicules disponibles de votre catalogue.</Empty>}
          </div>
          <p className="mt-2 px-1 text-xs text-muted">Vérifiez toujours la disponibilité réelle dans les outils internes avant de proposer.</p>
        </Section>
      )}

      {tab === 'devis' && <>
        <Section title="Devis" right={<Button size="sm" variant="soft" onClick={() => nav(`/devis/nouveau?client=${c.id}`)}><Plus size={15} />Devis</Button>}>
          <div className="space-y-2">
            {quotes.map((q) => (
              <Link key={q.id} to={`/devis/${q.id}`} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-card p-3.5 hover:border-accent">
                <span className="min-w-0"><span className="block truncate font-semibold">{q.vehiculeLabel}</span><span className="text-xs text-muted">{q.ref} · {q.dateEnvoi ? `envoyé ${fmtDay(dayKey(q.dateEnvoi))}` : 'brouillon'}</span></span>
                <Badge tone={q.statut === 'envoye' ? 'accent' : q.statut === 'accepte' ? 'ok' : 'neutral'}>{{ brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé', expire: 'Expiré' }[q.statut]}</Badge>
              </Link>
            ))}
            {!quotes.length && <p className="px-1 text-sm text-muted">Aucun devis pour ce client.</p>}
          </div>
        </Section>
        <Section title="Ventes" right={<Button size="sm" variant="soft" onClick={() => open('vente', { clientId: c.id })}><ShoppingBag size={15} />Vente</Button>}>
          <div className="space-y-2">
            {sales.map((x) => <Link key={x.id} to={`/ventes/${x.id}`} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-card p-3.5 hover:border-accent"><span className="min-w-0"><span className="block truncate font-semibold">{x.vehiculeLabel}</span><span className="text-xs text-muted">{x.ref} · {euro(x.prixVente)}</span></span><Badge tone="accent">{SALE_STATUS[x.statut]}</Badge></Link>)}
            {!sales.length && <p className="px-1 text-sm text-muted">Aucune vente. La fiche client est réutilisée telle quelle lors de la vente : rien à ressaisir.</p>}
          </div>
        </Section>
      </>}

      <Sheet open={perdu} onClose={() => setPerdu(false)} title="Dossier perdu — motif" footer={<><Button variant="ghost" onClick={() => setPerdu(false)}>Annuler</Button><Button onClick={() => { run(() => setClientStatus(c.id, 'perdu', motif), 'Dossier classé perdu'); setPerdu(false) }}>Confirmer</Button></>}>
        <div className="flex flex-wrap gap-1.5">{s.motifsPerte.map((m) => <Chip key={m} active={motif === m} onClick={() => setMotif(m)}>{m}</Chip>)}</div>
      </Sheet>
    </div>
  )
}
