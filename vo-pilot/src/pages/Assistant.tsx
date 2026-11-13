import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, ChevronRight, Send } from 'lucide-react'
import { answer, EXEMPLES, MODULES, type Answer } from '../services/assistant'
import { useData } from '../ui/data'
import { Badge, Button, Card, Chip } from '../ui/kit'
import { PageHead } from '../ui/shared'

export default function Assistant() {
  const d = useData()
  const [q, setQ] = useState('')
  const [log, setLog] = useState<{ q: string; a: Answer }[]>([])
  const ctx = useMemo(() => ({ ...d, now: Date.now() }), [d])
  const ask = (text: string) => { if (!text.trim()) return; setLog((l) => [{ q: text, a: answer(text, ctx) }, ...l].slice(0, 12)); setQ('') }
  return (
    <div>
      <PageHead title="Assistant" sub="Règles métier sur vos données — aucune IA externe, rien ne quitte l’appareil" back="/plus" />
      <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q) }}>
        <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quels clients dois-je rappeler aujourd’hui ?" aria-label="Votre question" />
        <Button type="submit" aria-label="Demander"><Send size={18} /></Button>
      </form>
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">{EXEMPLES.map((e) => <Chip key={e} onClick={() => ask(e)}>{e}</Chip>)}</div>
      <div className="space-y-4">
        {log.map((x, i) => (
          <div key={log.length - i}>
            <p className="mb-1.5 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm text-white">{x.q}</p>
            <Card className="p-4">
              <div className="mb-1.5 flex items-center gap-2"><Bot size={16} className="text-accent" /><Badge tone="accent">{x.a.module}</Badge></div>
              <p className="font-bold">{x.a.titre}</p>
              <div className="mt-2 divide-y divide-line">
                {x.a.lignes.slice(0, 12).map((l, j) => {
                  const body = <><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{l.texte}</span>{l.detail && <span className="block text-xs text-muted">{l.detail}</span>}</span>{l.link && <ChevronRight size={16} className="shrink-0 text-muted" />}</>
                  return l.link ? <Link key={j} to={l.link} className="flex items-center gap-2 py-2 hover:text-accent">{body}</Link> : <div key={j} className="flex items-center gap-2 py-2">{body}</div>
                })}
              </div>
              {x.a.note && <p className="mt-2 text-xs text-muted">{x.a.note}</p>}
            </Card>
          </div>
        ))}
        {!log.length && (
          <Card className="p-4 text-sm">
            <p className="font-bold">Comment fonctionne l’assistant</p>
            <p className="mt-1 text-muted">Il reconnaît votre question par mots-clés et y répond avec des règles déterministes appliquées à vos données locales. Ses spécialités sont des modules de logique, pas des agents IA :</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{MODULES.map((m) => <Badge key={m}>{m}</Badge>)}</div>
            <p className="mt-3 text-xs text-muted">Intégration d’un modèle IA (Claude ou autre) : non configurée. Elle nécessiterait une clé API protégée côté serveur et votre autorisation explicite avant tout envoi de données clients.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
