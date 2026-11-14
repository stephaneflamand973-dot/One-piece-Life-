import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Clock, Copy, ExternalLink, Mail } from 'lucide-react'
import { addDays, atTime, fromLocalInput, today, toLocalInput } from '../lib/dates'
import { addInteraction, saveTask } from '../services/actions'
import { clientName, nextTask } from '../services/logic'
import { renderTemplate, waLink } from '../services/whatsapp'
import { useData } from '../ui/data'
import { ClientPicker, VehiclePicker } from '../ui/forms'
import { Button, Card, Chip, Field, Section, Toggle, useRun, useUI } from '../ui/kit'
import { PageHead } from '../ui/shared'

export default function WhatsApp() {
  const d = useData()
  const { settings: s } = d
  const [sp] = useSearchParams()
  const run = useRun()
  const { toast } = useUI()
  const [cid, setCid] = useState<string | undefined>(sp.get('client') ?? undefined)
  const [vid, setVid] = useState<string | undefined>(sp.get('vehicule') ?? undefined)
  const [tid, setTid] = useState(sp.get('modele') ?? s.waTemplates[0]?.id)
  const [rdv, setRdv] = useState('')
  const [custom, setCustom] = useState<string | null>(null)
  const [opened, setOpened] = useState(false)
  const [canal, setCanal] = useState<'whatsapp' | 'email'>('whatsapp')
  const [suite, setSuite] = useState(true)
  const [suiteAt, setSuiteAt] = useState(toLocalInput(atTime(addDays(today(), s.delais.relanceDefautJours), '10:00')))
  const c = cid ? d.byClient.get(cid) : undefined
  const v = vid ? d.byVehicle.get(vid) : undefined
  const tpl = s.waTemplates.find((t) => t.id === tid)
  const prix = sp.get('prix') ? +sp.get('prix')! : undefined
  const generated = useMemo(() => (tpl ? renderTemplate(tpl.texte, { client: c, vehicle: v, rdv: fromLocalInput(rdv), prix, settings: s }) : ''), [tpl, c, v, rdv, prix, s])
  const text = custom ?? generated
  const manque = [...text.matchAll(/\[(\w+)\]/g)].map((m) => m[1])
  const link = waLink(c?.tel, text)
  const interdit = !!c && (c.consentement?.nePasContacter || !c.consentement?.whatsapp)
  const needsRdv = !!tpl && /\{(date|heure)\}/.test(tpl.texte)

  const copy = async () => { try { await navigator.clipboard.writeText(text); toast('Texte copié') } catch { toast('Copie impossible : sélectionnez le texte manuellement.', 'bad') } }
  const confirmSent = () => run(async () => {
    if (!c) throw new Error('Choisissez un client.')
    await addInteraction({ clientId: c.id, type: canal, resultat: canal === 'email' ? 'E-mail envoyé' : 'Message envoyé', commentaire: `${tpl?.titre ?? 'Message'} : ${text.slice(0, 200)}` })
    if (suite && !nextTask(c.id, d.tasks)) await saveTask({ type: 'relance', titre: canal === 'email' ? 'Suite de l’e-mail' : 'Suite du message WhatsApp', clientId: c.id, due: fromLocalInput(suiteAt) })
    setOpened(false)
  }, 'Envoi confirmé et ajouté à l’historique')
  const planifier = () => run(async () => {
    if (!c) throw new Error('Choisissez un client.')
    await saveTask({ type: 'whatsapp', titre: `Envoyer : ${tpl?.titre ?? 'message'}`, clientId: c.id, due: atTime(today(), '16:00') })
  }, 'Envoi prévu ajouté à vos actions du jour')

  return (
    <div>
      <PageHead title="Messages" sub="WhatsApp ou e-mail : préparés ici, envoyés et confirmés par vous" back="/plus" />
      <div className="grid gap-x-6 lg:grid-cols-2">
        <div>
          <Section title="Destinataire">
            <Card className="space-y-3 p-4">
              <Field group label="Client"><ClientPicker value={cid} onChange={(x) => { setCid(x); setCustom(null); setOpened(false) }} /></Field>
              <Field group label="Véhicule (facultatif)"><VehiclePicker all value={vid} onChange={(x) => { setVid(x?.id); setCustom(null) }} /></Field>
              {needsRdv && <Field label="Date et heure du rendez-vous"><input className="inp" type="datetime-local" value={rdv} onChange={(e) => { setRdv(e.target.value); setCustom(null) }} /></Field>}
            </Card>
          </Section>
          <Section title="Modèle">
            <div className="flex flex-wrap gap-1.5">{s.waTemplates.map((t) => <Chip key={t.id} active={tid === t.id} onClick={() => { setTid(t.id); setCustom(null) }}>{t.titre}</Chip>)}</div>
            <p className="mt-2 px-1 text-xs text-muted">Modèles modifiables dans Paramètres → Communications.</p>
          </Section>
        </div>
        <div>
          <Section title="Message">
            <Card className="p-4">
              <textarea className="inp min-h-44" value={text} onChange={(e) => setCustom(e.target.value)} aria-label="Texte du message" />
              {manque.length > 0 && <p className="mt-2 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">À compléter avant l’envoi : {[...new Set(manque)].join(', ')}. Aucune information n’est inventée.</p>}
              {interdit && <p className="mt-2 rounded-xl bg-bad-soft px-3 py-2 text-sm font-semibold text-bad">{clientName(c)} n’a pas autorisé le contact par WhatsApp.</p>}
              {c && !c.tel && <p className="mt-2 text-sm text-warn">Aucun numéro de téléphone sur la fiche.</p>}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={copy}><Copy size={16} />Copier</Button>
                <a href={!interdit && link ? link : undefined} target="_blank" rel="noreferrer" onClick={() => { if (link && !interdit) { setCanal('whatsapp'); setOpened(true) } }} aria-disabled={!link || interdit} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#128c4b] px-4 text-sm font-semibold text-white ${!link || interdit ? 'pointer-events-none opacity-40' : ''}`}><ExternalLink size={16} />Ouvrir WhatsApp</a>
                <Button variant="ghost" disabled={!c || interdit} onClick={planifier}><Clock size={16} />Envoi prévu</Button>
                <Button variant="ok" disabled={!c || interdit} onClick={() => { setCanal('whatsapp'); setOpened(true) }}><Check size={16} />J’ai envoyé</Button>
                {c?.email && c.consentement?.email && !c.consentement?.nePasContacter && <a href={`mailto:${c.email}?subject=${encodeURIComponent(tpl?.titre ?? 'Votre recherche de véhicule')}&body=${encodeURIComponent(text)}`} onClick={() => { setCanal('email'); setOpened(true) }} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-semibold"><Mail size={16} />Ouvrir dans la messagerie (e-mail)</a>}
              </div>
              {opened && c && (
                <div className="mt-3 space-y-2 rounded-2xl bg-soft p-3">
                  <p className="text-sm font-semibold">{canal === 'email' ? 'L’e-mail est-il réellement parti ?' : 'Le message est-il réellement parti ?'}</p>
                  <p className="text-xs text-muted">Ouvrir {canal === 'email' ? 'la messagerie' : 'WhatsApp'} ne vaut pas envoi : rien n’est inscrit dans l’historique tant que vous ne confirmez pas.</p>
                  <div className="flex items-center justify-between gap-2 text-sm"><span>Programmer la suite</span><Toggle label="Programmer la suite" checked={suite} onChange={setSuite} /></div>
                  {suite && <input className="inp" type="datetime-local" aria-label="Date de la prochaine action" value={suiteAt} onChange={(e) => setSuiteAt(e.target.value)} />}
                  <div className="flex gap-2"><Button onClick={confirmSent}>Oui, envoyé</Button><Button variant="ghost" onClick={() => setOpened(false)}>Pas encore</Button></div>
                </div>
              )}
            </Card>
            <p className="mt-2 px-1 text-xs text-muted">VO PILOT n’est pas connecté à WhatsApp Business : il prépare le texte et ouvre la conversation ; l’envoi reste manuel et individuel.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
