import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

type Variant = 'primary' | 'soft' | 'ghost' | 'danger' | 'ok' | 'outline'
const VAR: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110',
  soft: 'bg-accent-soft text-accent hover:brightness-95',
  ghost: 'text-muted hover:bg-soft',
  outline: 'border border-line bg-card text-ink hover:bg-soft',
  danger: 'bg-bad-soft text-bad hover:brightness-95',
  ok: 'bg-ok-soft text-ok hover:brightness-95',
}
export function Button({ variant = 'primary', size = 'md', className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'min-h-9 px-3 text-sm rounded-lg' : size === 'lg' ? 'min-h-12 px-5 text-base rounded-xl' : 'min-h-11 px-4 text-sm rounded-xl'
  return <button type="button" {...p} className={cx('inline-flex items-center justify-center gap-2 font-semibold transition disabled:opacity-50 disabled:pointer-events-none select-none', sz, VAR[variant], className)} />
}

export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgba(11,27,58,0.04)]', className)}>{children}</div>
}

export type Tone = 'neutral' | 'accent' | 'warn' | 'bad' | 'ok' | 'teal'
const TONE: Record<Tone, string> = {
  neutral: 'bg-soft text-muted', accent: 'bg-accent-soft text-accent', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad', ok: 'bg-ok-soft text-ok', teal: 'bg-soft text-teal',
}
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap', TONE[tone], className)}>{children}</span>
}

export function Chip({ active, children, onClick, count, tone }: { active?: boolean; children: ReactNode; onClick?: () => void; count?: number; tone?: Tone }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cx('inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition', active ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-card text-ink hover:bg-soft')}>
      {children}
      {count !== undefined && <span className={cx('rounded-full px-1.5 text-xs font-bold', active ? 'bg-white/25' : count > 0 && tone ? TONE[tone] : 'bg-soft text-muted')}>{count}</span>}
    </button>
  )
}

/** `group` : pour un ensemble de boutons/pastilles (un <label> activerait le premier bouton au clic sur le libellé). */
export function Field({ label, hint, children, className, group }: { label: string; hint?: string; children: ReactNode; className?: string; group?: boolean }) {
  if (group) return (
    <div role="group" aria-label={label} className={cx('block', className)}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </div>
  )
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Sheet({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cx('sheet-in relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-card shadow-2xl md:rounded-3xl', wide ? 'md:max-w-3xl' : 'md:max-w-xl')}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="text-base font-bold">{title}</h2>
          <button type="button" aria-label="Fermer" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-soft"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="safe-b border-t border-line px-5 py-3"><div className="flex flex-wrap items-center justify-end gap-2 pb-1">{footer}</div></div>}
      </div>
    </div>
  )
}

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-8 text-center">
      {icon && <div className="mb-2 text-muted">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function Section({ title, right, children, className }: { title: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('mb-5', className)}>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Stat({ label, value, sub, tone, onClick }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; onClick?: () => void }) {
  const col = tone === 'bad' ? 'text-bad' : tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : tone === 'accent' ? 'text-accent' : 'text-ink'
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="rounded-2xl border border-line bg-card p-3 text-left transition enabled:hover:border-accent disabled:cursor-default">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={cx('mt-0.5 text-2xl font-bold tabular-nums leading-tight', col)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </button>
  )
}

export function Progress({ value, max, tone = 'accent' }: { value: number; max: number; tone?: 'accent' | 'ok' | 'bad' | 'warn' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const bg = tone === 'ok' ? 'bg-ok' : tone === 'bad' ? 'bg-bad' : tone === 'warn' ? 'bg-warn' : 'bg-accent'
  return <div className="h-2 w-full overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={value} aria-valuemax={max}><div className={cx('h-full rounded-full transition-all', bg)} style={{ width: `${pct}%` }} /></div>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cx('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-accent' : 'bg-line')}>
      <span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

// ---------- Toasts & confirmation ----------
interface ToastCtx { toast: (msg: string, tone?: 'ok' | 'bad') => void; confirm: (o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean> }
const Ctx = createContext<ToastCtx>({ toast: () => {}, confirm: async () => false })
export const useUI = () => useContext(Ctx)

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: 'ok' | 'bad' }[]>([])
  const [conf, setConf] = useState<{ title: string; message: string; confirmLabel?: string; danger?: boolean } | null>(null)
  const resolver = useRef<(v: boolean) => void>(undefined)
  const toast = useCallback((msg: string, tone: 'ok' | 'bad' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'bad' ? 5000 : 2600)
  }, [])
  const confirm = useCallback((o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => new Promise<boolean>((res) => { resolver.current = res; setConf(o) }), [])
  const close = (v: boolean) => { resolver.current?.(v); setConf(null) }
  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={cx('sheet-in pointer-events-auto flex max-w-md items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg', t.tone === 'ok' ? 'bg-navy dark:bg-soft' : 'bg-red-700')}>
            {t.tone === 'ok' && <Check size={16} className="text-emerald-400" />}{t.msg}
          </div>
        ))}
      </div>
      <Sheet open={!!conf} onClose={() => close(false)} title={conf?.title ?? ''} footer={<><Button variant="ghost" onClick={() => close(false)}>Annuler</Button><Button variant={conf?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{conf?.confirmLabel ?? 'Confirmer'}</Button></>}>
        <p className="text-sm text-muted">{conf?.message}</p>
      </Sheet>
    </Ctx.Provider>
  )
}

/** Exécute une action asynchrone et affiche l'erreur éventuelle au lieu de la perdre. */
export function useRun() {
  const { toast } = useUI()
  return useCallback(async <T,>(fn: () => Promise<T>, okMsg?: string): Promise<T | undefined> => {
    try { const r = await fn(); if (okMsg) toast(okMsg); return r } catch (e) { toast((e as Error).message || 'Une erreur est survenue.', 'bad'); return undefined }
  }, [toast])
}
