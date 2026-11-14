import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Plus, ShieldCheck, Trash2, Upload, X } from 'lucide-react'
import { db, saveSettings, uid } from '../lib/db'
import type { Settings } from '../lib/types'
import { dayKey, diffDays, fmtDateTime, today } from '../lib/dates'
import { download, exportBackup, restoreBackup, validateBackup, wipeAll, wipeDemo, type Backup } from '../services/backup'
import { toCsv } from '../services/csv'
import { loadDemo } from '../services/demo'
import { checkLock, setLock, validCode } from '../services/lock'
import { clientName, expiredClients, SALE_STATUS, stageLabel } from '../services/logic'
import { deleteClient } from '../services/actions'
import { useData } from '../ui/data'
import { N, QUICK, Sel } from '../ui/forms'
import { Button, Card, Chip, Field, Section, Sheet, Toggle, useRun, useUI } from '../ui/kit'
import { PageHead } from '../ui/shared'

const TABS = ['Profil', 'Commercial', 'Tarifs', 'Logistique', 'Communications', 'Données'] as const

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [v, setV] = useState('')
  const add = () => { const t = v.trim(); if (t && !items.includes(t)) onChange([...items, t]); setV('') }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">{items.map((x) => <span key={x} className="inline-flex items-center gap-1 rounded-full bg-soft px-3 py-1.5 text-sm">{x}<button type="button" aria-label={`Retirer ${x}`} onClick={() => onChange(items.filter((y) => y !== x))} className="text-muted"><X size={14} /></button></span>)}</div>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); add() }}><input className="inp" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} aria-label={placeholder} /><Button type="submit" variant="soft" aria-label="Ajouter"><Plus size={18} /></Button></form>
    </div>
  )
}

export default function Parametres() {
  const d = useData()
  const { settings: s } = d
  const run = useRun()
  const { confirm, toast } = useUI()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Profil')
  const [restore, setRestore] = useState<{ backup: Backup; resume: Record<string, number> } | null>(null)
  const [quota, setQuota] = useState<{ usage?: number; quota?: number; persisted?: boolean }>({})
  const [showAudit, setShowAudit] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const [lockOpen, setLockOpen] = useState(false)
  const [lk, setLk] = useState({ ancien: '', code: '', confirm: '' })
  const auditLog = useLiveQuery(() => (showAudit ? db.audit.orderBy('date').reverse().limit(80).toArray() : []), [showAudit]) ?? []
  const up = (fn: (st: Settings) => void, msg?: string) => run(() => saveSettings(fn), msg)
  useEffect(() => { (async () => { try { const e = await navigator.storage?.estimate?.(); const p = await navigator.storage?.persisted?.(); setQuota({ usage: e?.usage, quota: e?.quota, persisted: p }) } catch { /* indisponible */ } })() }, [])
  const P = <K extends keyof Settings['profil']>(k: K, v: Settings['profil'][K]) => up((st) => { st.profil[k] = v })
  const D = <K extends keyof Settings['delais']>(k: K, v: Settings['delais'][K]) => up((st) => { st.delais[k] = v })
  const sauvegardeAge = s.derniereSauvegarde ? diffDays(today(), dayKey(s.derniereSauvegarde)) : null

  const exporter = () => run(async () => { const b = await exportBackup(); download(`vo-pilot-sauvegarde-${today()}.json`, JSON.stringify(b)) }, 'Sauvegarde exportée')
  const onFile = async (f?: File) => {
    if (!f) return
    try { setRestore(validateBackup(JSON.parse(await f.text()))) } catch (e) { toast(e instanceof SyntaxError ? 'Fichier illisible : ce n’est pas un fichier JSON valide.' : (e as Error).message, 'bad') }
    if (file.current) file.current.value = ''
  }
  const saveLock = (retirer: boolean) => run(async () => {
    if (s.verrou && !(await checkLock(lk.ancien, s.verrou))) throw new Error('Le code actuel est incorrect.')
    if (!retirer) {
      if (!validCode(lk.code)) throw new Error('Le code doit comporter 4 à 8 chiffres.')
      if (lk.code !== lk.confirm) throw new Error('Les deux saisies du nouveau code ne correspondent pas.')
    }
    await setLock(retirer ? null : lk.code)
    setLockOpen(false); setLk({ ancien: '', code: '', confirm: '' })
  }, retirer ? 'Code d’accès retiré' : 'Code d’accès enregistré')
  const csvClients = () => download('vo-pilot-clients.csv', toCsv(['ref', 'nom', 'prenom', 'telephone', 'email', 'source', 'statut', 'recherche', 'budget', 'premier contact'], d.clients.map((c) => [c.ref, c.nom, c.prenom, c.tel, c.email, c.source, stageLabel(s.pipeline, c.statut), c.recherche?.modele ?? c.recherche?.texte, c.recherche?.budgetMax, c.premierContact])), 'text/csv')
  const csvVentes = () => download('vo-pilot-ventes.csv', toCsv(['ref', 'client', 'vehicule', 'prix', 'remise', 'reprise', 'financement', 'statut', 'bon de commande', 'confirmation', 'livraison effective', 'commission estimee', 'commission versee'], d.sales.map((x) => [x.ref, clientName(d.byClient.get(x.clientId)), x.vehiculeLabel, x.prixVente, x.remise, x.reprise, x.financementType, SALE_STATUS[x.statut], x.dateBC, x.dateConfirmation, x.livraisonEffective, x.commission.estime, x.commission.verse])), 'text/csv')

  return (
    <div>
      <PageHead title="Paramètres" back="/plus" />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">{TABS.map((t) => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>)}</div>

      {tab === 'Profil' && <>
        <Section title="Profil">
          <Card className="grid grid-cols-2 gap-3 p-4">
            <Field label="Nom du commercial" className="col-span-2"><input className="inp" defaultValue={s.profil.nom} onBlur={(e) => P('nom', e.target.value.trim())} placeholder="Prénom Nom" /></Field>
            <Field label="Site principal"><Sel value={s.profil.site} onChange={(v) => P('site', v)} options={s.sites} empty={null} /></Field>
            <Field label="Apparence"><Sel value={s.profil.theme} onChange={(v) => P('theme', v as Settings['profil']['theme'])} options={[{ value: 'auto', label: 'Automatique' }, { value: 'clair', label: 'Clair' }, { value: 'sombre', label: 'Sombre' }]} empty={null} /></Field>
            <Field label="Début de journée"><input className="inp" type="time" value={s.profil.debut} onChange={(e) => P('debut', e.target.value)} /></Field>
            <Field label="Fin de journée"><input className="inp" type="time" value={s.profil.fin} onChange={(e) => P('fin', e.target.value)} /></Field>
            <Field label="Début de pause"><input className="inp" type="time" value={s.profil.pauseDebut} onChange={(e) => P('pauseDebut', e.target.value)} /></Field>
            <Field label="Fin de pause"><input className="inp" type="time" value={s.profil.pauseFin} onChange={(e) => P('pauseFin', e.target.value)} /></Field>
            <Field label="Objectif mensuel (ventes)"><N value={s.profil.objectifMensuel} onChange={(v) => P('objectifMensuel', Math.max(0, v ?? 0))} /></Field>
            <Field label="Objectif de progression"><N value={s.profil.objectifProgression} onChange={(v) => P('objectifProgression', Math.max(0, v ?? 0))} /></Field>
            <Field label="Objectif net mensuel (€)"><N value={s.profil.objectifNet} onChange={(v) => P('objectifNet', v ?? 0)} /></Field>
            <Field label="Devise"><input className="inp" value="Euro (EUR)" disabled /></Field>
            <Field label="Fuseau horaire" className="col-span-2"><Sel value={s.profil.fuseau} onChange={(v) => P('fuseau', v)} options={['America/Martinique', 'America/Guadeloupe', 'America/Cayenne', 'Europe/Paris', 'Indian/Reunion']} empty={null} /></Field>
          </Card>
        </Section>
        <Section title="Sites"><Card className="p-4"><ListEditor items={s.sites} onChange={(v) => up((st) => { st.sites = v })} placeholder="Ajouter un site" /></Card></Section>
        <Section title="Actions rapides de l’accueil">
          <div className="flex flex-wrap gap-1.5">{QUICK.map((q) => <Chip key={q.id} active={s.raccourcis.includes(q.id)} onClick={() => up((st) => { st.raccourcis = st.raccourcis.includes(q.id) ? st.raccourcis.filter((x) => x !== q.id) : [...st.raccourcis, q.id] })}>{q.label}</Chip>)}</div>
        </Section>
      </>}

      {tab === 'Commercial' && <>
        <Section title="Pipeline (intitulés)">
          <Card className="divide-y divide-line">
            {s.pipeline.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-1.5">
                <span className="w-6 text-center text-xs font-bold text-muted">{i + 1}</span>
                <input className="inp !min-h-10" aria-label={`Étape ${i + 1}`} defaultValue={p.label} onBlur={(e) => e.target.value.trim() && e.target.value !== p.label && up((st) => { st.pipeline[i].label = e.target.value.trim() })} />
                {!p.systeme && <button type="button" aria-label="Retirer l’étape" className="px-2 text-bad" onClick={() => d.clients.some((c) => c.statut === p.id) ? toast('Des fiches utilisent cette étape : changez d’abord leur statut.', 'bad') : up((st) => { st.pipeline = st.pipeline.filter((x) => x.id !== p.id) })}><Trash2 size={16} /></button>}
              </div>
            ))}
          </Card>
          <Button variant="ghost" className="mt-2" onClick={() => up((st) => { const i = st.pipeline.findIndex((x) => x.id === 'bc'); st.pipeline.splice(i, 0, { id: `etape_${uid().slice(0, 6)}`, label: 'Nouvelle étape', kind: 'actif' }) })}><Plus size={16} />Ajouter une étape (avant le bon de commande)</Button>
          <p className="mt-1 px-1 text-xs text-muted">Les étapes d’origine peuvent être renommées mais pas supprimées : les automatisations s’appuient dessus.</p>
        </Section>
        <Section title="Délais de suivi">
          <Card className="grid grid-cols-2 gap-3 p-4">
            <Field label="Lead : délai de prise en charge (min)" hint="Référence UpYourLeads déclarée : environ 2 h."><N value={s.delais.leadMinutes} onChange={(v) => D('leadMinutes', Math.max(5, v ?? 120))} /></Field>
            <Field label="Relance après devis (jours)"><N value={s.delais.relanceDevisJours} onChange={(v) => D('relanceDevisJours', Math.max(1, v ?? 2))} /></Field>
            <Field label="Nouvelle tentative si injoignable (jours)"><N value={s.delais.rappelInjoignableJours} onChange={(v) => D('rappelInjoignableJours', Math.max(0, v ?? 1))} /></Field>
            <Field label="Relance par défaut (jours)"><N value={s.delais.relanceDefautJours} onChange={(v) => D('relanceDefautJours', Math.max(1, v ?? 3))} /></Field>
            <Field label="« Sans interaction » après (jours)"><N value={s.delais.sansInteractionJours} onChange={(v) => D('sansInteractionJours', Math.max(1, v ?? 7))} /></Field>
            <Field label="Suivis après livraison (jours)" hint="Séparés par des virgules"><input className="inp" defaultValue={s.delais.suiviLivraisonJours.join(', ')} onBlur={(e) => D('suiviLivraisonJours', e.target.value.split(/[,; ]+/).map(Number).filter((n) => n > 0))} /></Field>
          </Card>
        </Section>
        <Section title="Sources des prospects"><Card className="p-4"><ListEditor items={s.sources} onChange={(v) => up((st) => { st.sources = v })} placeholder="Ajouter une source" /></Card></Section>
        <Section title="Motifs de perte"><Card className="p-4"><ListEditor items={s.motifsPerte} onChange={(v) => up((st) => { st.motifsPerte = v })} placeholder="Ajouter un motif" /></Card></Section>
      </>}

      {tab === 'Tarifs' && <>
        <Section title="Frais et carte grise">
          <Card className="grid grid-cols-2 gap-3 p-4">
            <Field label="Frais de dossier (€)"><N value={s.tarifs.fraisDossier} onChange={(v) => up((st) => { st.tarifs.fraisDossier = v ?? 0 })} /></Field>
            <Field label="Remise maximale déclarée (€)"><N value={s.tarifs.remiseMax} onChange={(v) => up((st) => { st.tarifs.remiseMax = v ?? 0 })} /></Field>
            <Field label="Carte grise : part fixe (€)"><N value={s.tarifs.cgFixe} onChange={(v) => up((st) => { st.tarifs.cgFixe = v ?? 0 })} /></Field>
            <Field label="Carte grise : par cheval fiscal (€)"><N value={s.tarifs.cgParCv} onChange={(v) => up((st) => { st.tarifs.cgParCv = v ?? 0 })} /></Field>
            <p className="col-span-2 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">Formule déclarée : {s.tarifs.cgFixe} € + (CV × {s.tarifs.cgParCv} €). C’est une règle de travail à vérifier avant tout usage officiel ; elle ne couvre pas toutes les situations (exonérations, taxes additionnelles…).</p>
          </Card>
        </Section>
        <Section title="Comptabilisation des ventes">
          <Card className="p-4"><Field label="Une vente est comptée…" hint="Définition utilisée partout : tableau de bord, statistiques, commissions."><Sel value={s.commission.venteCompteeA} onChange={(v) => up((st) => { st.commission.venteCompteeA = v as Settings['commission']['venteCompteeA'] })} options={[{ value: 'bc', label: 'À la date du bon de commande' }, { value: 'confirmation', label: 'À la confirmation de la vente' }, { value: 'livraison', label: 'À la livraison effective' }]} empty={null} /></Field></Card>
        </Section>
        <Section title="Références historiques déclarées" right={<Button size="sm" variant="soft" onClick={() => up((st) => { st.historique.push({ mois: today().slice(0, 7), ventes: 0 }) })}><Plus size={15} />Mois</Button>}>
          <Card className="space-y-2 p-4">
            {s.historique.map((h, i) => <div key={i} className="flex items-center gap-2"><input className="inp" type="month" aria-label="Mois" value={h.mois} onChange={(e) => up((st) => { st.historique[i].mois = e.target.value })} /><input className="inp !w-24" inputMode="numeric" aria-label="Ventes" value={h.ventes} onChange={(e) => up((st) => { st.historique[i].ventes = +e.target.value || 0 })} /><button type="button" aria-label="Retirer" className="px-2 text-muted" onClick={() => up((st) => { st.historique.splice(i, 1) })}><X size={18} /></button></div>)}
            <p className="text-xs text-muted">Affichées à part dans les statistiques ; jamais mélangées aux ventes enregistrées dans l’application.</p>
          </Card>
        </Section>
        <p className="px-1 text-sm text-muted">Barème de commissions, primes et paliers : écran <b>Plus → Commissions</b>.</p>
      </>}

      {tab === 'Logistique' && <>
        <Section title="Étapes de préparation (nouvelles ventes)" right={<Button size="sm" variant="soft" onClick={() => up((st) => { st.prep.etapes.push({ id: `etape_${uid().slice(0, 6)}`, label: 'Nouvelle étape', obligatoire: false }) })}><Plus size={15} />Étape</Button>}>
          <Card className="divide-y divide-line">
            {s.prep.etapes.map((e, i) => (
              <div key={e.id} className="flex items-center gap-2 px-3 py-1.5">
                <input className="inp !min-h-10" aria-label="Intitulé de l’étape" defaultValue={e.label} onBlur={(x) => x.target.value.trim() && up((st) => { st.prep.etapes[i].label = x.target.value.trim() })} />
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted"><Toggle label="Obligatoire" checked={e.obligatoire} onChange={(v) => up((st) => { st.prep.etapes[i].obligatoire = v })} />Oblig.</span>
                <button type="button" aria-label="Retirer" className="px-1 text-bad" onClick={() => up((st) => { st.prep.etapes.splice(i, 1) })}><Trash2 size={16} /></button>
              </div>
            ))}
          </Card>
          <p className="mt-1 px-1 text-xs text-muted">Un dossier devient « prêt à livrer » quand toutes les étapes obligatoires sont terminées ou non nécessaires.</p>
        </Section>
        <Section title="Seuils d’alerte">
          <Card className="grid grid-cols-2 gap-3 p-4">
            <Field label="Alerte livraison proche (jours)"><N value={s.delais.alerteLivraisonJours} onChange={(v) => D('alerteLivraisonJours', Math.max(0, v ?? 3))} /></Field>
            <Field label="CT à vérifier si plus de (mois)" hint="Règle déclarée ; vérifiez l’exigence réelle."><N value={s.delais.ctMaxMois} onChange={(v) => D('ctMaxMois', Math.max(1, v ?? 6))} /></Field>
          </Card>
        </Section>
        <Section title="Prestataires"><Card className="p-4"><ListEditor items={s.prep.prestataires} onChange={(v) => up((st) => { st.prep.prestataires = v })} placeholder="Ajouter un prestataire" /></Card></Section>
        <Section title="Documents suivis (statut uniquement)"><Card className="p-4"><ListEditor items={s.prep.documents} onChange={(v) => up((st) => { st.prep.documents = v })} placeholder="Ajouter un document" /></Card></Section>
      </>}

      {tab === 'Communications' && <>
        <Section title="Signature"><input className="inp" defaultValue={s.signature} onBlur={(e) => up((st) => { st.signature = e.target.value })} placeholder="ex. Prénom — Renault Renew Lareinty" aria-label="Signature" /><p className="mt-1 px-1 text-xs text-muted">Ajoutée à la fin de chaque message préparé.</p></Section>
        <Section title="Modèles WhatsApp" right={<Button size="sm" variant="soft" onClick={() => up((st) => { st.waTemplates.push({ id: uid(), titre: 'Nouveau modèle', texte: 'Bonjour {prenom}, ' }) })}><Plus size={15} />Modèle</Button>}>
          <p className="mb-2 px-1 text-xs text-muted">Variables : {'{prenom} {nom} {modele} {prix} {annee} {km} {garantie} {date} {heure} {commercial} {site}'}</p>
          <div className="space-y-2">
            {s.waTemplates.map((t, i) => (
              <Card key={t.id} className="p-3">
                <div className="flex gap-2"><input className="inp !min-h-10 font-semibold" aria-label="Titre du modèle" defaultValue={t.titre} onBlur={(e) => up((st) => { st.waTemplates[i].titre = e.target.value })} /><button type="button" aria-label="Supprimer le modèle" className="px-2 text-bad" onClick={async () => { if (await confirm({ title: 'Supprimer ce modèle ?', message: t.titre, danger: true, confirmLabel: 'Supprimer' })) up((st) => { st.waTemplates = st.waTemplates.filter((x) => x.id !== t.id) }) }}><Trash2 size={16} /></button></div>
                <textarea className="inp mt-2" aria-label="Texte du modèle" defaultValue={t.texte} onBlur={(e) => up((st) => { st.waTemplates[i].texte = e.target.value })} />
              </Card>
            ))}
          </div>
        </Section>
        <Section title="Réponses aux objections">
          <div className="space-y-2">{s.objections.map((o, i) => <Card key={o.id} className="p-3"><p className="text-xs font-bold uppercase text-accent">{o.theme}</p><input className="inp mt-1 !min-h-10" aria-label="Objection" defaultValue={o.question} onBlur={(e) => up((st) => { st.objections[i].question = e.target.value })} /><textarea className="inp mt-2" aria-label="Réponse" defaultValue={o.reponse} onBlur={(e) => up((st) => { st.objections[i].reponse = e.target.value })} /></Card>)}</div>
        </Section>
        <p className="px-1 text-sm text-muted">E-mails : VO PILOT n’envoie pas d’e-mails. Les modèles ci-dessus peuvent être copiés dans Outlook. Notifications : écran <b>Automatisations</b>.</p>
      </>}

      {tab === 'Données' && <>
        <Card className="mb-4 flex gap-3 p-4 text-sm">
          <ShieldCheck size={22} className="shrink-0 text-ok" />
          <div><p className="font-bold">Vos données restent sur cet appareil</p><p className="mt-1 text-muted">Stockage local du navigateur (IndexedDB). <b>Aucune synchronisation entre iPhone et ordinateur</b>, aucun serveur, aucun envoi à un tiers. Pour changer d’appareil ou vous protéger d’une perte : exportez une sauvegarde et restaurez-la.</p>
            <p className="mt-1 text-muted">Espace utilisé : {quota.usage !== undefined ? `${(quota.usage / 1048576).toFixed(1)} Mo` : 'inconnu'} · stockage persistant : {quota.persisted === undefined ? 'inconnu' : quota.persisted ? 'accordé' : 'non garanti par le navigateur'}.</p></div>
        </Card>
        <Section title="Sauvegarde">
          <Card className="space-y-3 p-4">
            <p className="text-sm">Dernière sauvegarde exportée : <b className={sauvegardeAge === null || sauvegardeAge > 7 ? 'text-warn' : ''}>{s.derniereSauvegarde ? `${fmtDateTime(s.derniereSauvegarde)}${sauvegardeAge ? ` (il y a ${sauvegardeAge} j)` : ''}` : 'jamais'}</b></p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={exporter}><Download size={16} />Exporter tout (JSON)</Button>
              <Button variant="outline" onClick={() => file.current?.click()}><Upload size={16} />Restaurer une sauvegarde</Button>
              <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={csvClients}>Clients (CSV)</Button><Button size="sm" variant="ghost" onClick={csvVentes}>Ventes (CSV)</Button></div>
            <p className="text-xs text-muted">Le fichier contient des données personnelles de clients : conservez-le dans un espace protégé. Sur iPhone, Safari peut effacer les données d’un site non utilisé pendant plusieurs semaines : installez l’application sur l’écran d’accueil et exportez régulièrement.</p>
          </Card>
        </Section>
        <Section title="Code d’accès">
          <Card className="space-y-2 p-4 text-sm">
            <p>État : <b className={s.verrou ? 'text-ok' : 'text-warn'}>{s.verrou ? 'activé' : 'désactivé'}</b></p>
            <p className="text-muted">Demandé à l’ouverture et après 5 minutes en arrière-plan. Il empêche un tiers d’ouvrir l’application sur votre téléphone, mais ne chiffre pas les données stockées. En cas d’oubli, il faut tout effacer puis restaurer une sauvegarde : exportez-en une avant d’activer le code.</p>
            <Button variant="outline" onClick={() => setLockOpen(true)}>{s.verrou ? 'Modifier ou retirer le code' : 'Définir un code'}</Button>
          </Card>
        </Section>
        <Section title="Confidentialité (RGPD)">
          <Card className="space-y-2 p-4 text-sm text-muted">
            <p>• <b className="text-ink">Autorisation :</b> conserver des données clients sur un outil personnel n’est pas automatiquement autorisé par votre employeur. Vérifiez-le avant d’y saisir des données réelles.</p>
            <p>• <b className="text-ink">Minimisation :</b> pas de copie de pièces d’identité ni de données bancaires ; seuls des statuts « reçu / vérifié » sont enregistrés.</p>
            <p>• <b className="text-ink">Droits des personnes :</b> chaque fiche peut être exportée (CSV), corrigée ou supprimée avec tout son historique ; le refus d’être contacté est respecté dans toute l’application.</p>
            <p>• <b className="text-ink">Conservation :</b> les fiches closes sans vente et sans activité au-delà de la durée ci-dessous peuvent être supprimées en un geste. Rien n’est supprimé automatiquement.</p>
            <div className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
              <Field label="Durée de conservation (mois)" className="w-48"><N value={s.delais.conservationMois} onChange={(v) => D('conservationMois', Math.max(1, v ?? 36))} /></Field>
              {(() => { const vieux = expiredClients(d); return <Button size="sm" variant={vieux.length ? 'danger' : 'ghost'} disabled={!vieux.length} onClick={async () => { if (await confirm({ title: `Supprimer ${vieux.length} fiche(s) ?`, message: `Fiches « perdu » ou « à réactiver », sans vente et sans activité depuis plus de ${s.delais.conservationMois} mois : ${vieux.slice(0, 6).map((c) => clientName(c)).join(', ')}${vieux.length > 6 ? '…' : ''}. Leur historique sera supprimé définitivement.`, confirmLabel: 'Supprimer', danger: true })) run(async () => { for (const c of vieux) await deleteClient(c.id) }, 'Fiches supprimées') }}>{vieux.length ? `Supprimer ${vieux.length} fiche(s) au-delà de la durée` : 'Aucune fiche au-delà de la durée'}</Button> })()}
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAudit(true)}>Journal des modifications</Button>
          </Card>
        </Section>
        <Section title="Démonstration et suppression">
          <Card className="flex flex-wrap gap-2 p-4">
            {s.demoChargee ? <Button variant="outline" onClick={async () => { if (await confirm({ title: 'Supprimer la démonstration ?', message: 'Seules les données fictives sont effacées.', confirmLabel: 'Supprimer', danger: true })) run(wipeDemo, 'Démonstration supprimée') }}>Supprimer les données de démonstration</Button> : <Button variant="outline" onClick={() => run(loadDemo, 'Démonstration chargée')}>Charger des données fictives</Button>}
            <Button variant="danger" onClick={async () => { if (await confirm({ title: 'Tout effacer ?', message: 'Tous les clients, véhicules, ventes, tâches et notes seront définitivement supprimés de cet appareil. Vos paramètres sont conservés. Exportez une sauvegarde avant si nécessaire.', confirmLabel: 'Continuer', danger: true }) && await confirm({ title: 'Confirmation définitive', message: 'Cette action est irréversible. Effacer toutes les données ?', confirmLabel: 'Tout effacer', danger: true })) run(() => wipeAll(true), 'Toutes les données ont été effacées') }}><Trash2 size={16} />Effacer toutes les données</Button>
          </Card>
        </Section>
        <Section title="Intégrations">
          <Card className="space-y-1 p-4 text-sm text-muted">
            <p>• UpYourLeads, stock Renault : <b className="text-ink">aucune connexion</b> (saisie manuelle ou import CSV autorisé).</p>
            <p>• WhatsApp Business : ouverture d’une conversation préremplie, envoi manuel.</p>
            <p>• Outlook / Calendrier : export .ics depuis l’Agenda, pas de synchronisation.</p>
            <p>• Fichiers Excel (.xlsx) : lus directement à l’import du catalogue.</p>
            <p>• Synchronisation cloud et IA externe : non développées.</p>
          </Card>
        </Section>
      </>}

      <Sheet open={!!restore} onClose={() => setRestore(null)} title="Restaurer cette sauvegarde ?" footer={<><Button variant="ghost" onClick={() => setRestore(null)}>Annuler</Button><Button variant="danger" onClick={() => { const b = restore!.backup; setRestore(null); run(() => restoreBackup(b), 'Sauvegarde restaurée') }}>Remplacer mes données</Button></>}>
        {restore && <div className="space-y-2 text-sm"><p>Sauvegarde du <b>{fmtDateTime(restore.backup.exportedAt)}</b> :</p><p className="text-muted">{[['clients', 'client(s)'], ['vehicles', 'véhicule(s)'], ['sales', 'vente(s)'], ['tasks', 'tâche(s)'], ['quotes', 'devis'], ['notes', 'note(s)']].map(([k, l]) => `${restore.resume[k] ?? 0} ${l}`).join(' · ')}</p><p className="rounded-xl bg-bad-soft px-3 py-2 font-semibold text-bad">Toutes les données actuelles de cet appareil seront remplacées.</p></div>}
      </Sheet>
      <Sheet open={lockOpen} onClose={() => setLockOpen(false)} title="Code d’accès" footer={<>{s.verrou && <Button variant="danger" className="mr-auto" onClick={() => saveLock(true)}>Retirer le code</Button>}<Button variant="ghost" onClick={() => setLockOpen(false)}>Annuler</Button><Button onClick={() => saveLock(false)}>Enregistrer</Button></>}>
        <div className="space-y-3">
          {s.verrou && <Field label="Code actuel"><input className="inp" type="password" inputMode="numeric" autoComplete="off" value={lk.ancien} onChange={(e) => setLk({ ...lk, ancien: e.target.value.replace(/\D/g, '') })} /></Field>}
          <Field label="Nouveau code (4 à 8 chiffres)"><input className="inp" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={lk.code} onChange={(e) => setLk({ ...lk, code: e.target.value.replace(/\D/g, '') })} /></Field>
          <Field label="Confirmer le nouveau code"><input className="inp" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={lk.confirm} onChange={(e) => setLk({ ...lk, confirm: e.target.value.replace(/\D/g, '') })} /></Field>
        </div>
      </Sheet>
      <Sheet open={showAudit} onClose={() => setShowAudit(false)} title="Journal des modifications" wide>
        <div className="divide-y divide-line text-sm">{auditLog.map((a) => <div key={a.id} className="py-2"><p><b>{a.entite}</b> · {a.action} <span className="text-xs text-muted">({a.origine})</span></p><p className="text-xs text-muted">{fmtDateTime(a.date)}{a.avant ? ` · avant : ${a.avant}` : ''}{a.apres ? ` · après : ${a.apres}` : ''}</p></div>)}{!auditLog.length && <p className="py-4 text-muted">Aucune modification journalisée.</p>}</div>
      </Sheet>
    </div>
  )
}
