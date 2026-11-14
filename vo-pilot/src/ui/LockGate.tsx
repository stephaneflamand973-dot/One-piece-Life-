import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { wipeAll } from '../services/backup'
import { checkLock, setLock } from '../services/lock'
import { useData } from './data'
import { Button, useUI } from './kit'

const DELAI_MS = 5 * 60 * 1000 // reverrouillage après 5 min en arrière-plan

export function LockGate({ children }: { children: ReactNode }) {
  const { settings } = useData()
  const { confirm } = useUI()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [essais, setEssais] = useState(0)
  const [attente, setAttente] = useState(0)
  const hiddenAt = useRef<number | null>(null)
  const v = settings.verrou

  useEffect(() => {
    const h = () => {
      if (document.hidden) hiddenAt.current = Date.now()
      else if (hiddenAt.current && Date.now() - hiddenAt.current > DELAI_MS) setOpen(false)
    }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [])
  useEffect(() => { if (attente <= 0) return; const t = setTimeout(() => setAttente(attente - 1), 1000); return () => clearTimeout(t) }, [attente])

  if (!v || open) return <>{children}</>
  const submit = async () => {
    if (attente > 0 || !code) return
    if (await checkLock(code, v)) { setOpen(true); setCode(''); setErr(''); setEssais(0); return }
    const n = essais + 1
    setEssais(n); setCode(''); setErr('Code incorrect.')
    if (n >= 3) setAttente(Math.min(60, 5 * 2 ** (n - 3))) // temporisation croissante après 3 erreurs
  }
  const oubli = async () => {
    if (await confirm({ title: 'Code oublié ?', message: 'Le code ne peut pas être retrouvé. La seule issue est d’effacer toutes les données de cet appareil (clients, ventes, paramètres), puis de restaurer une sauvegarde si vous en avez une.', confirmLabel: 'Continuer', danger: true })
      && await confirm({ title: 'Tout effacer définitivement ?', message: 'Cette action est irréversible.', confirmLabel: 'Tout effacer', danger: true })) {
      await wipeAll(false); await setLock(null); setOpen(true)
    }
  }
  return (
    <div className="grid min-h-full place-items-center bg-navy px-6 text-white">
      <form className="w-full max-w-xs text-center" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><Lock size={26} /></div>
        <h1 className="text-xl font-extrabold">VO PILOT</h1>
        <p className="mt-1 text-sm text-white/70">Saisissez votre code d’accès</p>
        <input className="mt-5 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-cyan-300" type="password" inputMode="numeric" autoComplete="off" autoFocus maxLength={8} aria-label="Code d’accès" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        <p className="mt-2 min-h-5 text-sm text-orange-300" role="alert">{attente > 0 ? `Trop d’erreurs : réessayez dans ${attente} s.` : err}</p>
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={attente > 0 || code.length < 4}>Déverrouiller</Button>
        <button type="button" className="mt-4 text-sm text-white/60 underline" onClick={oubli}>Code oublié</button>
      </form>
    </div>
  )
}
