import { useLiveQuery } from 'dexie-react-hooks'
import { Play } from 'lucide-react'
import { db, saveSettings } from '../lib/db'
import { fmtDateTime } from '../lib/dates'
import { RULES, runAutomations } from '../services/automations'
import { useData } from '../ui/data'
import { Badge, Button, Card, Section, Toggle, useRun, useUI } from '../ui/kit'
import { PageHead } from '../ui/shared'

export default function Automations() {
  const { settings: s } = useData()
  const run = useRun()
  const { toast } = useUI()
  const runs = useLiveQuery(() => db.runs.orderBy('date').reverse().limit(15).toArray(), []) ?? []
  const notif = async (v: boolean) => {
    if (v) {
      if (typeof Notification === 'undefined') return toast('Ce navigateur ne propose pas les notifications.', 'bad')
      if ((await Notification.requestPermission()) !== 'granted') return toast('Autorisation refusée par le navigateur.', 'bad')
    }
    await saveSettings((st) => { st.notifications = v })
  }
  return (
    <div>
      <PageHead title="Automatisations" sub="Règles locales, exécutées quand l’application est ouverte" back="/plus" right={<Button variant="outline" size="sm" onClick={() => run(async () => { const n = await runAutomations(); toast(n ? `${n} élément(s) créé(s)` : 'Rien de nouveau à créer') })}><Play size={15} />Exécuter</Button>} />
      <div className="space-y-3">
        {RULES.map((r) => {
          const cfg = s.automations[r.id] ?? { actif: true }
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-bold">{r.nom}</p><p className="mt-1 text-sm"><span className="text-muted">Déclencheur :</span> {r.declencheur}</p><p className="text-sm"><span className="text-muted">Action :</span> {r.action}</p></div>
                <Toggle label={`Activer ${r.nom}`} checked={cfg.actif} onChange={(v) => saveSettings((st) => { st.automations[r.id] = { ...st.automations[r.id], actif: v } })} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={cfg.actif ? 'ok' : 'neutral'}>{cfg.actif ? 'Active' : 'Désactivée'}</Badge>
                <Badge>{r.portee}</Badge>
                <Badge>Dernière exécution utile : {cfg.dernierRun ? `${fmtDateTime(cfg.dernierRun)} — ${cfg.dernierMessage}` : 'jamais'}</Badge>
                {cfg.derniereErreur && <Badge tone="bad">Erreur : {cfg.derniereErreur}</Badge>}
              </div>
            </Card>
          )
        })}
      </div>
      <Section title="Notifications" className="mt-5">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Notification système pour les nouvelles alertes</p><p className="text-xs text-muted">Avec votre autorisation, et seulement pendant que VO PILOT est ouvert. Aucune notification en arrière-plan : elle exigerait un serveur d’envoi, non mis en place. Non testé sur iPhone.</p></div><Toggle label="Notifications" checked={s.notifications} onChange={notif} /></div>
        </Card>
      </Section>
      <Section title="Ce que les automatisations ne font pas">
        <Card className="space-y-1 p-4 text-sm text-muted">
          <p>• Aucun message n’est envoyé à un client : elles créent des tâches et des alertes, vous décidez.</p>
          <p>• Aucune mise à jour d’UpYourLeads, d’Outlook ou du stock Renault : aucune connexion n’existe.</p>
          <p>• Chaque élément créé porte une clé unique : relancer le moteur ne crée pas de doublon.</p>
        </Card>
      </Section>
      <Section title="Journal">
        <Card className="divide-y divide-line">{runs.map((x) => <div key={x.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm"><span className="min-w-0 truncate">{RULES.find((r) => r.id === x.ruleId)?.nom ?? x.ruleId} — {x.message}</span><span className="shrink-0 text-xs text-muted">{fmtDateTime(x.date)}</span></div>)}{!runs.length && <p className="px-4 py-3 text-sm text-muted">Aucune exécution enregistrée.</p>}</Card>
      </Section>
    </div>
  )
}
