// Dialogues de saisie rapide, accessibles depuis n'importe quel écran (bouton « + », actions rapides, fiches).
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Car, ClipboardList, MessageCircle, Phone, PhoneCall, ShoppingBag, StickyNote, UserPlus, X } from 'lucide-react'
import { db } from '../lib/db'
import type { Client, Intervention, InteractionType, Note, SaleStatus, Task, TaskType, Vehicle } from '../lib/types'
import { BOITES, CARBURANTS, CATEGORIES, FINANCEMENTS } from '../lib/defaults'
import { addDays, atTime, fromLocalInput, nowIso, toLocalInput, today } from '../lib/dates'
import {
  addInteraction, completeTask, createSale, emptyClient, findDuplicateClient, saveClient, saveIntervention, saveNote, saveTask, saveVehicle,
} from '../services/actions'
import { clientName, estimateCommission, norm, num, SALE_ORDER, SALE_STATUS, vehicleLabel } from '../services/logic'
import { euro } from '../services/whatsapp'
import { Button, Chip, cx, Field, Sheet, Toggle, useRun, useUI } from './kit'
import { useData } from './data'

export type DialogKind = 'ajout' | 'prospect' | 'interaction' | 'tache' | 'vente' | 'vehicule' | 'note' | 'intervention'
export interface DialogParams { clientId?: string; saleId?: string; vehicleId?: string; quoteId?: string; taskId?: string; noteId?: string; interventionId?: string; stepId?: string; type?: string; linkType?: Note['linkType']; linkId?: string }
const DialogCtx = createContext<(kind: DialogKind, params?: DialogParams) => void>(() => {})
export const useDialog = () => useContext(DialogCtx)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ kind: DialogKind; params: DialogParams } | null>(null)
  const close = () => setState(null)
  const open = (kind: DialogKind, params: DialogParams = {}) => setState({ kind, params })
  const k = state?.kind
  const p = state?.params ?? {}
  return (
    <DialogCtx.Provider value={open}>
      {children}
      {k === 'ajout' && <QuickAdd onClose={close} open={open} />}
      {k === 'prospect' && <ProspectForm onClose={close} {...p} />}
      {k === 'interaction' && <InteractionForm onClose={close} {...p} />}
      {k === 'tache' && <TaskForm onClose={close} {...p} />}
      {k === 'vente' && <SaleForm onClose={close} {...p} />}
      {k === 'vehicule' && <VehicleForm onClose={close} {...p} />}
      {k === 'note' && <NoteForm onClose={close} {...p} />}
      {k === 'intervention' && <InterventionForm onClose={close} {...p} />}
    </DialogCtx.Provider>
  )
}

export const QUICK: { id: string; label: string; icon: ReactNode; kind: DialogKind; params?: DialogParams; route?: string }[] = [
  { id: 'prospect', label: 'Prospect', icon: <UserPlus size={22} />, kind: 'prospect' },
  { id: 'appel', label: 'Appel', icon: <PhoneCall size={22} />, kind: 'interaction', params: { type: 'appel_sortant' } },
  { id: 'relance', label: 'Relance', icon: <Phone size={22} />, kind: 'tache', params: { type: 'relance' } },
  { id: 'rdv', label: 'Rendez-vous', icon: <CalendarPlus size={22} />, kind: 'tache', params: { type: 'rdv' } },
  { id: 'vente', label: 'Vente', icon: <ShoppingBag size={22} />, kind: 'vente' },
  { id: 'vehicule', label: 'Véhicule', icon: <Car size={22} />, kind: 'vehicule' },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={22} />, kind: 'ajout', route: '/whatsapp' },
  { id: 'tache', label: 'Tâche', icon: <ClipboardList size={22} />, kind: 'tache', params: { type: 'tache' } },
  { id: 'note', label: 'Note', icon: <StickyNote size={22} />, kind: 'note' },
]

function QuickAdd({ onClose, open }: { onClose: () => void; open: (k: DialogKind, p?: DialogParams) => void }) {
  const nav = useNavigate()
  return (
    <Sheet open onClose={onClose} title="Ajout rapide">
      <div className="grid grid-cols-3 gap-3">
        {QUICK.map((q) => (
          <button key={q.id} type="button" onClick={() => { if (q.route) { onClose(); nav(q.route) } else open(q.kind, q.params) }} className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-card p-3 text-sm font-semibold hover:border-accent hover:bg-accent-soft">
            <span className="text-accent">{q.icon}</span>{q.label}
          </button>
        ))}
      </div>
    </Sheet>
  )
}

// ---------- Sélecteurs ----------
export function ClientPicker({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const { clients, byClient } = useData()
  const [q, setQ] = useState('')
  const sel = value ? byClient.get(value) : undefined
  const list = useMemo(() => {
    const n = norm(q)
    return clients.filter((c) => !n || norm(`${c.nom} ${c.prenom ?? ''} ${c.tel ?? ''}`).includes(n)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)
  }, [clients, q])
  if (sel) return <div className="inp flex items-center justify-between"><span className="font-semibold">{clientName(sel)}</span><button type="button" aria-label="Changer de client" onClick={() => onChange(undefined)} className="text-muted"><X size={18} /></button></div>
  return (
    <div>
      <input className="inp" placeholder="Rechercher un client…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un client" />
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {list.map((c) => <Chip key={c.id} onClick={() => onChange(c.id)}>{clientName(c)}</Chip>)}
        {!list.length && <span className="text-sm text-muted">Aucun client trouvé.</span>}
      </div>
    </div>
  )
}
export function VehiclePicker({ value, onChange, all }: { value?: string; onChange: (v: Vehicle | undefined) => void; all?: boolean }) {
  const { vehicles, byVehicle } = useData()
  const [q, setQ] = useState('')
  const sel = value ? byVehicle.get(value) : undefined
  const list = useMemo(() => {
    const n = norm(q)
    return vehicles.filter((v) => (all || ['disponible', 'a_verifier', 'reserve'].includes(v.statut)) && (!n || norm(`${v.ref} ${vehicleLabel(v)}`).includes(n))).slice(0, 6)
  }, [vehicles, q, all])
  if (sel) return <div className="inp flex items-center justify-between"><span><span className="font-semibold">{vehicleLabel(sel)}</span> <span className="text-muted">· {sel.ref} · {euro(sel.prix)}</span></span><button type="button" aria-label="Changer de véhicule" onClick={() => onChange(undefined)} className="text-muted"><X size={18} /></button></div>
  return (
    <div>
      <input className="inp" placeholder="Rechercher dans le catalogue…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un véhicule" />
      <div className="mt-1.5 flex flex-wrap gap-1.5">{list.map((v) => <Chip key={v.id} onClick={() => onChange(v)}>{v.modele} {v.annee ?? ''} · {euro(v.prix)}</Chip>)}</div>
    </div>
  )
}
const Sel = ({ value, onChange, options, empty = '—' }: { value?: string; onChange: (v: string) => void; options: string[] | { value: string; label: string }[]; empty?: string | null }) => (
  <select className="inp" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
    {empty !== null && <option value="">{empty}</option>}
    {options.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
  </select>
)
export { Sel }
const N = ({ value, onChange, placeholder }: { value?: number; onChange: (v: number | undefined) => void; placeholder?: string }) => (
  <input className="inp" inputMode="decimal" placeholder={placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : num(e.target.value))} />
)
export { N }

// ---------- Prospect ----------
function ProspectForm({ onClose, clientId }: { onClose: () => void } & DialogParams) {
  const { settings: s, byClient } = useData()
  const run = useRun()
  const nav = useNavigate()
  const editing = clientId ? byClient.get(clientId) : undefined
  const [c, setC] = useState<Partial<Client>>(() => editing ?? { ...emptyClient(), site: s.profil.site, source: '' })
  const [lead, setLead] = useState(false)
  const [leadAt, setLeadAt] = useState(toLocalInput(nowIso()))
  const [more, setMore] = useState(!!editing)
  const [suivi, setSuivi] = useState(!editing)
  const [suiviAt, setSuiviAt] = useState(toLocalInput(atTime(addDays(today(), 1), '10:00')))
  const [dup, setDup] = useState<Client>()
  const set = (p: Partial<Client>) => setC((x) => ({ ...x, ...p }))
  const setR = (p: Partial<Client['recherche']>) => setC((x) => ({ ...x, recherche: { ...x.recherche, ...p } }))
  useEffect(() => { let on = true; findDuplicateClient(c.tel, c.email, c.id).then((d) => on && setDup(d)); return () => { on = false } }, [c.tel, c.email, c.id])

  const save = () => run(async () => {
    const saved = await saveClient({ ...c, leadRecuLe: lead ? fromLocalInput(leadAt) : c.leadRecuLe }, { lead })
    if (!editing && suivi && !lead) await saveTask({ type: 'appel', titre: 'Premier suivi', clientId: saved.id, due: fromLocalInput(suiviAt) })
    onClose()
    if (!editing) nav(`/clients/${saved.id}`)
  }, editing ? 'Fiche mise à jour' : 'Prospect créé')

  return (
    <Sheet open onClose={onClose} title={editing ? 'Modifier la fiche' : 'Nouveau prospect'} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom"><input className="inp" autoFocus value={c.nom ?? ''} onChange={(e) => set({ nom: e.target.value })} autoComplete="off" /></Field>
        <Field label="Prénom"><input className="inp" value={c.prenom ?? ''} onChange={(e) => set({ prenom: e.target.value })} autoComplete="off" /></Field>
        <Field label="Téléphone"><input className="inp" type="tel" inputMode="tel" value={c.tel ?? ''} onChange={(e) => set({ tel: e.target.value })} autoComplete="off" /></Field>
        <Field label="Source"><Sel value={c.source} onChange={(v) => { set({ source: v }); if (!editing && v === 'UpYourLeads') setLead(true) }} options={s.sources} /></Field>
        {dup && <p className="col-span-2 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">Doublon possible : {clientName(dup)} ({dup.tel ?? dup.email}) existe déjà.</p>}
        <Field label="Véhicule recherché" className="col-span-2"><input className="inp" placeholder="ex. Clio automatique" value={c.recherche?.texte ?? ''} onChange={(e) => setR({ texte: e.target.value })} /></Field>
        <Field label="Budget max (€)"><N value={c.recherche?.budgetMax} onChange={(v) => setR({ budgetMax: v })} /></Field>
        <Field label="Boîte"><Sel value={c.recherche?.boite} onChange={(v) => setR({ boite: v })} options={BOITES} empty="Indifférent" /></Field>
      </div>
      {!editing && (
        <div className="mt-4 space-y-3 rounded-2xl bg-soft p-3">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Lead UpYourLeads reçu</p><p className="text-xs text-muted">Démarre le compte à rebours de {s.delais.leadMinutes} min dans VO PILOT.</p></div><Toggle checked={lead} onChange={setLead} label="Lead reçu" /></div>
          {lead && <Field label="Heure de réception"><input className="inp" type="datetime-local" value={leadAt} onChange={(e) => setLeadAt(e.target.value)} /></Field>}
          {!lead && <><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Programmer un premier suivi</p><Toggle checked={suivi} onChange={setSuivi} label="Programmer un suivi" /></div>
            {suivi && <input className="inp" type="datetime-local" aria-label="Date du suivi" value={suiviAt} onChange={(e) => setSuiviAt(e.target.value)} />}</>}
        </div>
      )}
      <button type="button" className="mt-4 text-sm font-semibold text-accent" onClick={() => setMore(!more)}>{more ? 'Masquer les détails' : 'Plus de détails (facultatif)'}</button>
      {more && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="E-mail" className="col-span-2"><input className="inp" type="email" value={c.email ?? ''} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Marque"><input className="inp" value={c.recherche?.marque ?? ''} onChange={(e) => setR({ marque: e.target.value })} /></Field>
          <Field label="Modèle"><input className="inp" value={c.recherche?.modele ?? ''} onChange={(e) => setR({ modele: e.target.value })} /></Field>
          <Field label="Catégorie"><Sel value={c.recherche?.categorie} onChange={(v) => setR({ categorie: v })} options={CATEGORIES} /></Field>
          <Field label="Carburant"><Sel value={c.recherche?.carburant} onChange={(v) => setR({ carburant: v })} options={CARBURANTS} /></Field>
          <Field label="Km max"><N value={c.recherche?.kmMax} onChange={(v) => setR({ kmMax: v })} /></Field>
          <Field label="Année min"><N value={c.recherche?.anneeMin} onChange={(v) => setR({ anneeMin: v })} /></Field>
          <Field label="Équipements souhaités" className="col-span-2"><input className="inp" placeholder="séparés par des virgules" value={c.recherche?.equipements ?? ''} onChange={(e) => setR({ equipements: e.target.value })} /></Field>
          <Field label="Usage prévu" className="col-span-2" hint="Trajets, famille, professionnel… à explorer systématiquement."><input className="inp" value={c.usage ?? ''} onChange={(e) => set({ usage: e.target.value })} /></Field>
          <Field label="Km annuel"><N value={c.kmAnnuel} onChange={(v) => set({ kmAnnuel: v })} /></Field>
          <Field label="Délai d’achat"><input className="inp" value={c.delaiAchat ?? ''} onChange={(e) => set({ delaiAchat: e.target.value })} /></Field>
          <Field label="Reprise éventuelle"><input className="inp" value={c.reprise ?? ''} onChange={(e) => set({ reprise: e.target.value })} /></Field>
          <Field label="Financement"><Sel value={c.financement} onChange={(v) => set({ financement: v })} options={FINANCEMENTS} /></Field>
          <Field label="Site"><Sel value={c.site} onChange={(v) => set({ site: v })} options={s.sites} /></Field>
          <Field label="Importance"><Sel value={String(c.importance ?? 2)} onChange={(v) => set({ importance: (+v || 2) as 1 | 2 | 3 })} options={[{ value: '1', label: 'Faible' }, { value: '2', label: 'Normale' }, { value: '3', label: 'Élevée' }]} empty={null} /></Field>
          <Field label="Contraintes" className="col-span-2"><input className="inp" value={c.contraintes ?? ''} onChange={(e) => set({ contraintes: e.target.value })} /></Field>
          <Field label="Commentaires" className="col-span-2"><textarea className="inp" value={c.commentaires ?? ''} onChange={(e) => set({ commentaires: e.target.value })} /></Field>
        </div>
      )}
    </Sheet>
  )
}

// ---------- Interaction (mode express) ----------
const I_TYPES: { id: InteractionType; label: string }[] = [
  { id: 'appel_sortant', label: 'Appel sortant' }, { id: 'appel_entrant', label: 'Appel entrant' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'email', label: 'E-mail' },
  { id: 'rdv', label: 'Rendez-vous' }, { id: 'essai', label: 'Essai' }, { id: 'negociation', label: 'Négociation' }, { id: 'remarque', label: 'Remarque' },
]
const RESULTATS: Partial<Record<InteractionType, string[]>> = {
  appel_sortant: ['Joint', 'Sans réponse', 'Message laissé', 'Rappeler plus tard', 'Pas intéressé'],
  appel_entrant: ['Demande d’information', 'Prise de rendez-vous', 'Hésite', 'Pas intéressé'],
  whatsapp: ['Message envoyé', 'Répondu', 'Sans réponse'],
  email: ['E-mail envoyé', 'Répondu', 'Sans réponse'],
  rdv: ['Venu — intéressé', 'Venu — hésite', 'Venu — pas intéressé', 'Absent'],
  essai: ['Convaincu', 'Hésite', 'Pas convaincu'],
  negociation: ['En cours', 'Accord', 'Désaccord'],
}

function InteractionForm({ onClose, clientId, type, taskId }: { onClose: () => void } & DialogParams) {
  const { settings: s, byClient, tasks } = useData()
  const run = useRun()
  const [cid, setCid] = useState(clientId)
  const [t, setT] = useState<InteractionType>((type as InteractionType) ?? 'appel_sortant')
  const [res, setRes] = useState<string>()
  const [com, setCom] = useState('')
  const [hesit, setHesit] = useState('')
  const client = cid ? byClient.get(cid) : undefined
  // Proposition de prochaine action selon le résultat (toujours modifiable, jamais imposée).
  const prop = useMemo(() => {
    const freq = client?.frequenceRelanceJours ?? s.delais.relanceDefautJours
    if (res === 'Pas intéressé' || res === 'Venu — pas intéressé' || res === 'Accord') return null
    if (['Sans réponse', 'Message laissé', 'Absent'].includes(res ?? '')) return { type: 'appel' as TaskType, titre: 'Nouvelle tentative d’appel', j: s.delais.rappelInjoignableJours }
    if (res === 'Rappeler plus tard') return { type: 'appel' as TaskType, titre: 'Rappeler comme convenu', j: 1 }
    if (t === 'essai') return { type: 'relance' as TaskType, titre: res === 'Convaincu' ? 'Proposer un devis' : 'Revenir sur les hésitations après essai', j: 1 }
    if (t === 'rdv') return { type: 'relance' as TaskType, titre: 'Suite du rendez-vous', j: 2 }
    return { type: 'relance' as TaskType, titre: 'Relance', j: freq }
  }, [res, t, client, s])
  const [plan, setPlan] = useState(true)
  const [titre, setTitre] = useState('')
  const [due, setDue] = useState('')
  useEffect(() => { if (prop) { setTitre(prop.titre); setDue(toLocalInput(atTime(addDays(today(), prop.j), '10:00'))) } }, [prop])
  const aDejaSuite = !!cid && tasks.some((x) => x.clientId === cid && x.statut === 'ouverte' && x.id !== taskId)

  const save = () => run(async () => {
    if (!cid) throw new Error('Choisissez un client.')
    const commentaire = [com, t === 'essai' && hesit ? `Hésitations : ${hesit}` : ''].filter(Boolean).join('\n')
    await addInteraction({ clientId: cid, type: t, resultat: res, commentaire })
    if (taskId) await completeTask(taskId, res)
    if (prop && plan && titre.trim()) await saveTask({ type: prop.type, titre: titre.trim(), clientId: cid, due: fromLocalInput(due) })
    onClose()
  }, 'Enregistré')

  return (
    <Sheet open onClose={onClose} title="Enregistrer un échange" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
      <div className="space-y-4">
        <Field label="Client"><ClientPicker value={cid} onChange={setCid} /></Field>
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">{I_TYPES.map((x) => <Chip key={x.id} active={t === x.id} onClick={() => { setT(x.id); setRes(undefined) }}>{x.label}</Chip>)}</div>
        {RESULTATS[t] && <Field label="Résultat"><div className="flex flex-wrap gap-1.5">{RESULTATS[t]!.map((r) => <Chip key={r} active={res === r} onClick={() => setRes(r)}>{r}</Chip>)}</div></Field>}
        {t === 'essai' && <Field label="Hésitations exprimées" hint="Notez les vraies réserves, pas seulement les points positifs."><input className="inp" value={hesit} onChange={(e) => setHesit(e.target.value)} placeholder="ex. coffre, mensualité, avis du conjoint…" /></Field>}
        <Field label="Commentaire (facultatif)"><textarea className="inp" value={com} onChange={(e) => setCom(e.target.value)} /></Field>
        {prop ? (
          <div className="space-y-2 rounded-2xl bg-soft p-3">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Prochaine action proposée</p><Toggle checked={plan} onChange={setPlan} label="Programmer la prochaine action" /></div>
            {plan && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><input className="inp" aria-label="Intitulé de la prochaine action" value={titre} onChange={(e) => setTitre(e.target.value)} /><input className="inp" type="datetime-local" aria-label="Échéance" value={due} onChange={(e) => setDue(e.target.value)} /></div>}
            {aDejaSuite && plan && <p className="text-xs text-muted">Ce client a déjà une action ouverte : celle-ci s’y ajoutera.</p>}
          </div>
        ) : res ? <p className="rounded-xl bg-soft px-3 py-2 text-sm text-muted">Pas de relance proposée pour ce résultat. Pensez à mettre à jour le statut du dossier si besoin.</p> : null}
      </div>
    </Sheet>
  )
}

// ---------- Tâche / relance / rendez-vous / essai ----------
const T_TYPES: { id: TaskType; label: string }[] = [
  { id: 'relance', label: 'Relance' }, { id: 'appel', label: 'Appel' }, { id: 'rdv', label: 'Rendez-vous' }, { id: 'essai', label: 'Essai' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'tache', label: 'Tâche' },
]
function TaskForm({ onClose, clientId, saleId, taskId, type }: { onClose: () => void } & DialogParams) {
  const { tasks } = useData()
  const run = useRun()
  const { confirm } = useUI()
  const ex = taskId ? tasks.find((x) => x.id === taskId) : undefined
  const [t, setT] = useState<Partial<Task>>(() => ex ?? { type: (type as TaskType) ?? 'relance', titre: '', clientId, saleId, priorite: 2, due: atTime(addDays(today(), type === 'tache' ? 0 : 1), '10:00') })
  const set = (p: Partial<Task>) => setT((x) => ({ ...x, ...p }))
  const defTitre: Record<string, string> = { relance: 'Relance', appel: 'Appel', rdv: 'Rendez-vous', essai: 'Essai', whatsapp: 'Message WhatsApp', tache: '' }
  const save = () => run(async () => {
    const titre = (t.titre ?? '').trim() || defTitre[t.type ?? 'tache']
    if (!titre) throw new Error('Donnez un intitulé à la tâche.')
    if (t.due && Number.isNaN(new Date(t.due).getTime())) throw new Error('Date invalide.')
    await saveTask({ ...t, titre, dureeMin: t.dureeMin ?? (['rdv', 'essai'].includes(t.type!) ? 45 : undefined) })
    onClose()
  }, ex ? 'Modifié' : 'Programmé')
  const quick = [{ l: 'Aujourd’hui', j: 0 }, { l: 'Demain', j: 1 }, { l: 'Dans 3 j', j: 3 }, { l: 'Dans 1 sem.', j: 7 }]
  return (
    <Sheet open onClose={onClose} title={ex ? 'Modifier' : 'Programmer une action'} footer={<>
      {ex && <Button variant="danger" className="mr-auto" onClick={async () => { if (await confirm({ title: 'Supprimer cette action ?', message: ex.titre, danger: true, confirmLabel: 'Supprimer' })) { await db.tasks.delete(ex.id); onClose() } }}>Supprimer</Button>}
      <Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
      <div className="space-y-4">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">{T_TYPES.map((x) => <Chip key={x.id} active={t.type === x.id} onClick={() => set({ type: x.id })}>{x.label}</Chip>)}</div>
        <Field label="Intitulé"><input className="inp" placeholder={defTitre[t.type ?? 'tache'] || 'À faire…'} value={t.titre ?? ''} onChange={(e) => set({ titre: e.target.value })} /></Field>
        {!saleId && <Field label={t.type === 'tache' ? 'Client (facultatif)' : 'Client'}><ClientPicker value={t.clientId} onChange={(id) => set({ clientId: id })} /></Field>}
        <Field label="Échéance">
          <input className="inp" type="datetime-local" value={toLocalInput(t.due)} onChange={(e) => set({ due: fromLocalInput(e.target.value) })} />
          <div className="mt-1.5 flex flex-wrap gap-1.5">{quick.map((q) => <Chip key={q.l} onClick={() => set({ due: atTime(addDays(today(), q.j), (toLocalInput(t.due).slice(11) || '10:00')) })}>{q.l}</Chip>)}</div>
        </Field>
        <Field label="Priorité"><div className="flex gap-1.5">{[1, 2, 3].map((p) => <Chip key={p} active={t.priorite === p} onClick={() => set({ priorite: p as 1 | 2 | 3 })}>{['Basse', 'Normale', 'Haute'][p - 1]}</Chip>)}</div></Field>
      </div>
    </Sheet>
  )
}

// ---------- Vente ----------
function SaleForm({ onClose, clientId, vehicleId, quoteId }: { onClose: () => void } & DialogParams) {
  const { settings: s, byVehicle, quotes } = useData()
  const run = useRun()
  const nav = useNavigate()
  const q = quoteId ? quotes.find((x) => x.id === quoteId) : undefined
  const v0 = byVehicle.get(q?.vehicleId ?? vehicleId ?? '')
  const [f, setF] = useState({
    clientId: q?.clientId ?? clientId, vehicleId: v0?.id, vehiculeLabel: q?.vehiculeLabel ?? (v0 ? `${vehicleLabel(v0)}${v0.annee ? ` (${v0.annee})` : ''}` : ''),
    prixVente: q ? q.prix - q.remise : v0?.prix, remise: q?.remise ?? 0, reprise: q?.reprise ?? 0, financementType: 'Comptant', statut: 'confirmee' as SaleStatus,
    dateBC: today(), livraison: toLocalInput(atTime(addDays(today(), 14), '14:00')), notes: '',
  })
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))
  const est = estimateCommission({ prixVente: f.prixVente ?? 0, remise: f.remise ?? 0, financementType: f.financementType, vehiculeLabel: f.vehiculeLabel }, s)
  const save = () => run(async () => {
    if (!f.clientId) throw new Error('Choisissez un client.')
    if (!(num(f.prixVente) > 0)) throw new Error('Indiquez le prix de vente.')
    const confirmed = ['confirmee', 'preparation'].includes(f.statut)
    const sale = await createSale({
      clientId: f.clientId, vehicleId: f.vehicleId, quoteId, vehiculeLabel: f.vehiculeLabel, prixVente: num(f.prixVente), remise: num(f.remise), reprise: num(f.reprise),
      financementType: f.financementType, statut: f.statut, dateBC: f.dateBC || undefined, dateConfirmation: confirmed ? f.dateBC || today() : undefined, livraisonPrevue: fromLocalInput(f.livraison), notes: f.notes,
    })
    onClose()
    nav(`/ventes/${sale.id}`)
  }, 'Vente créée — dossier de préparation ouvert')
  return (
    <Sheet open onClose={onClose} title="Nouvelle vente" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Créer le dossier</Button></>}>
      <div className="space-y-4">
        <Field label="Client"><ClientPicker value={f.clientId} onChange={(id) => set({ clientId: id })} /></Field>
        <Field label="Véhicule du catalogue"><VehiclePicker value={f.vehicleId} onChange={(v) => set(v ? { vehicleId: v.id, vehiculeLabel: `${vehicleLabel(v)}${v.annee ? ` (${v.annee})` : ''}`, prixVente: v.prix ?? f.prixVente } : { vehicleId: undefined })} /></Field>
        {!f.vehicleId && <Field label="Ou désignation libre" hint="Si le véhicule n’est pas dans votre catalogue."><input className="inp" value={f.vehiculeLabel} onChange={(e) => set({ vehiculeLabel: e.target.value })} placeholder="ex. Renault Clio V 2022" /></Field>}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Prix de vente (€)"><N value={f.prixVente} onChange={(v) => set({ prixVente: v })} /></Field>
          <Field label="Remise (€)"><N value={f.remise} onChange={(v) => set({ remise: v ?? 0 })} /></Field>
          <Field label="Reprise (€)"><N value={f.reprise} onChange={(v) => set({ reprise: v ?? 0 })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Financement"><Sel value={f.financementType} onChange={(v) => set({ financementType: v })} options={FINANCEMENTS} empty={null} /></Field>
          <Field label="Statut"><Sel value={f.statut} onChange={(v) => set({ statut: v as SaleStatus })} options={SALE_ORDER.slice(0, 5).map((x) => ({ value: x, label: SALE_STATUS[x] }))} empty={null} /></Field>
          <Field label="Date du bon de commande"><input className="inp" type="date" value={f.dateBC} onChange={(e) => set({ dateBC: e.target.value })} /></Field>
          <Field label="Livraison prévue"><input className="inp" type="datetime-local" value={f.livraison} onChange={(e) => set({ livraison: e.target.value })} /></Field>
        </div>
        <div className={cx('rounded-2xl p-3 text-sm', est.estime === undefined ? 'bg-soft text-muted' : 'bg-ok-soft text-ok')}>
          {est.estime === undefined ? 'Commission : barème non renseigné (Plus → Commissions). Aucune estimation n’est inventée.' : <>Commission estimée : <b>{euro(est.estime)}</b> <span className="opacity-80">({est.detail?.join(' · ')})</span></>}
        </div>
        <p className="text-xs text-muted">La création ouvre automatiquement le dossier de préparation (checklist, documents) et place la livraison au planning.</p>
      </div>
    </Sheet>
  )
}

// ---------- Véhicule ----------
function VehicleForm({ onClose, vehicleId }: { onClose: () => void } & DialogParams) {
  const { settings: s, byVehicle } = useData()
  const run = useRun()
  const nav = useNavigate()
  const ex = vehicleId ? byVehicle.get(vehicleId) : undefined
  const [v, setV] = useState<Partial<Vehicle>>(() => ex ?? { marque: 'Renault', modele: '', statut: 'disponible', site: s.profil.site })
  const set = (p: Partial<Vehicle>) => setV((x) => ({ ...x, ...p }))
  const save = () => run(async () => {
    const r = await saveVehicle(v)
    onClose()
    if (!ex) nav(`/vehicules/${r.vehicle.id}`)
  }, ex ? 'Véhicule mis à jour' : 'Véhicule ajouté')
  return (
    <Sheet open onClose={onClose} title={ex ? 'Modifier le véhicule' : 'Nouveau véhicule'} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marque"><input className="inp" value={v.marque ?? ''} onChange={(e) => set({ marque: e.target.value })} /></Field>
        <Field label="Modèle"><input className="inp" autoFocus={!ex} value={v.modele ?? ''} onChange={(e) => set({ modele: e.target.value })} /></Field>
        <Field label="Version" className="col-span-2"><input className="inp" value={v.version ?? ''} onChange={(e) => set({ version: e.target.value })} /></Field>
        <Field label="Prix affiché (€)"><N value={v.prix} onChange={(x) => set({ prix: x })} /></Field>
        <Field label="Référence" hint="Vide = générée"><input className="inp" value={v.ref ?? ''} onChange={(e) => set({ ref: e.target.value })} /></Field>
        <Field label="Année"><N value={v.annee} onChange={(x) => set({ annee: x })} /></Field>
        <Field label="Kilométrage"><N value={v.km} onChange={(x) => set({ km: x })} /></Field>
        <Field label="Carburant"><Sel value={v.carburant} onChange={(x) => set({ carburant: x })} options={CARBURANTS} /></Field>
        <Field label="Boîte"><Sel value={v.boite} onChange={(x) => set({ boite: x })} options={BOITES} /></Field>
        <Field label="Catégorie"><Sel value={v.categorie} onChange={(x) => set({ categorie: x })} options={CATEGORIES} /></Field>
        <Field label="Couleur"><input className="inp" value={v.couleur ?? ''} onChange={(e) => set({ couleur: e.target.value })} /></Field>
        <Field label="Puissance (ch)"><N value={v.puissance} onChange={(x) => set({ puissance: x })} /></Field>
        <Field label="Chevaux fiscaux"><N value={v.cvFiscaux} onChange={(x) => set({ cvFiscaux: x })} /></Field>
        <Field label="Garantie" hint="Telle qu’elle figure réellement"><input className="inp" value={v.garantie ?? ''} onChange={(e) => set({ garantie: e.target.value })} /></Field>
        <Field label="Site"><Sel value={v.site} onChange={(x) => set({ site: x })} options={s.sites} /></Field>
        <Field label="Statut"><Sel value={v.statut} onChange={(x) => set({ statut: x as Vehicle['statut'] })} options={Object.entries(VEHICLE_STATUS).map(([value, o]) => ({ value, label: o.label }))} empty={null} /></Field>
        <Field label="Dernier contrôle technique"><input className="inp" type="date" value={v.dernierCT ?? ''} onChange={(e) => set({ dernierCT: e.target.value })} /></Field>
        <Field label="Équipements" className="col-span-2"><input className="inp" placeholder="séparés par des virgules" value={v.equipements ?? ''} onChange={(e) => set({ equipements: e.target.value })} /></Field>
        <Field label="Informations complémentaires" className="col-span-2" hint="Défauts visibles compris : ils doivent rester signalés."><textarea className="inp" value={v.infos ?? ''} onChange={(e) => set({ infos: e.target.value })} /></Field>
      </div>
    </Sheet>
  )
}
export const VEHICLE_STATUS: Record<Vehicle['statut'], { label: string; tone: 'ok' | 'warn' | 'neutral' | 'accent' | 'bad' }> = {
  disponible: { label: 'Disponible', tone: 'ok' }, reserve: { label: 'Réservé', tone: 'accent' }, vendu: { label: 'Vendu', tone: 'neutral' },
  preparation: { label: 'En préparation', tone: 'accent' }, indisponible: { label: 'Indisponible', tone: 'neutral' }, a_verifier: { label: 'Statut à vérifier', tone: 'warn' },
}

// ---------- Note ----------
function NoteForm({ onClose, noteId, linkType, linkId }: { onClose: () => void } & DialogParams) {
  const { notes } = useData()
  const run = useRun()
  const ex = noteId ? notes.find((n) => n.id === noteId) : undefined
  const [texte, setTexte] = useState(ex?.texte ?? '')
  const [cat, setCat] = useState(ex?.categorie ?? '')
  const save = () => run(async () => {
    if (!texte.trim()) throw new Error('La note est vide.')
    await saveNote({ ...ex, texte: texte.trim(), categorie: cat, linkType: ex?.linkType ?? linkType, linkId: ex?.linkId ?? linkId })
    onClose()
  }, 'Note enregistrée')
  return (
    <Sheet open onClose={onClose} title={ex ? 'Modifier la note' : 'Nouvelle note'} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
      <div className="space-y-3">
        <textarea className="inp min-h-32" autoFocus value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Votre note…" aria-label="Texte de la note" />
        <Field label="Catégorie"><div className="flex flex-wrap gap-1.5">{['Client', 'Véhicule', 'Vente', 'Livraison', 'Atelier', 'Personnel'].map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? '' : c)}>{c}</Chip>)}</div></Field>
        <p className="text-xs text-muted">N’enregistrez pas de copie de pièce d’identité ni de donnée bancaire : un statut « reçu / vérifié » suffit.</p>
      </div>
    </Sheet>
  )
}

// ---------- Intervention ----------
const INT_STATUS: Record<Intervention['statut'], string> = { demandee: 'Demandée', planifiee: 'Planifiée', en_cours: 'En cours', bloquee: 'Bloquée', terminee: 'Terminée', annulee: 'Annulée' }
export { INT_STATUS }
function InterventionForm({ onClose, saleId, stepId, interventionId }: { onClose: () => void } & DialogParams) {
  const { settings: s, interventions, sales } = useData()
  const run = useRun()
  const ex = interventionId ? interventions.find((i) => i.id === interventionId) : undefined
  const sale = sales.find((x) => x.id === (ex?.saleId ?? saleId))
  const step = sale?.steps.find((x) => x.id === (ex?.stepId ?? stepId))
  const [f, setF] = useState<Partial<Intervention>>(() => ex ?? { saleId: saleId!, stepId, type: step?.label ?? '', statut: 'demandee', dateDemande: today() })
  const set = (p: Partial<Intervention>) => setF((x) => ({ ...x, ...p }))
  const save = () => run(async () => {
    if (!f.type?.trim()) throw new Error('Indiquez le type d’intervention.')
    await saveIntervention({ ...f, saleId: f.saleId!, type: f.type.trim() })
    onClose()
  }, 'Intervention enregistrée')
  return (
    <Sheet open onClose={onClose} title={ex ? 'Intervention' : 'Nouvelle intervention'} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type"><input className="inp" value={f.type ?? ''} onChange={(e) => set({ type: e.target.value })} placeholder="Pneus, carrosserie…" /></Field>
        <Field label="Étape liée"><Sel value={f.stepId} onChange={(v) => set({ stepId: v || undefined })} options={(sale?.steps ?? []).map((x) => ({ value: x.id, label: x.label }))} empty="Aucune" /></Field>
        <Field label="Prestataire"><Sel value={f.prestataire} onChange={(v) => set({ prestataire: v })} options={s.prep.prestataires} /></Field>
        <Field label="Statut"><Sel value={f.statut} onChange={(v) => set({ statut: v as Intervention['statut'] })} options={Object.entries(INT_STATUS).map(([value, label]) => ({ value, label }))} empty={null} /></Field>
        <Field label="Demandée le"><input className="inp" type="date" value={f.dateDemande ?? ''} onChange={(e) => set({ dateDemande: e.target.value })} /></Field>
        <Field label="Prévue le"><input className="inp" type="date" value={f.datePrevue ?? ''} onChange={(e) => set({ datePrevue: e.target.value })} /></Field>
        <Field label="Réalisée le"><input className="inp" type="date" value={f.dateReelle ?? ''} onChange={(e) => set({ dateReelle: e.target.value })} /></Field>
        <Field label="Prochaine relance"><input className="inp" type="date" value={f.prochaineRelance ?? ''} onChange={(e) => set({ prochaineRelance: e.target.value })} /></Field>
        <Field label="Commentaire / cause du blocage" className="col-span-2"><textarea className="inp" value={f.commentaire ?? ''} onChange={(e) => set({ commentaire: e.target.value })} /></Field>
        <Field label="Document ou preuve (référence)" className="col-span-2" hint="Numéro de facture, de PV… Le document lui-même reste dans le système professionnel."><input className="inp" value={f.preuve ?? ''} onChange={(e) => set({ preuve: e.target.value })} /></Field>
      </div>
      {f.stepId && <p className="mt-3 text-xs text-muted">Le statut de l’intervention met à jour l’étape liée de la checklist.</p>}
    </Sheet>
  )
}
