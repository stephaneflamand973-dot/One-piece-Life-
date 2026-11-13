import { Component, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Bell, Bot, CalendarDays, Car, FileText, Home, LayoutGrid, MessageCircle, Plus, Search, Settings as Cog, ShoppingBag, Truck, Users, Wallet, WifiOff, Zap } from 'lucide-react'
import { db, onDataChanged } from './lib/db'
import { runAutomations } from './services/automations'
import { search } from './services/search'
import { DataProvider, useData } from './ui/data'
import { DialogProvider, useDialog } from './ui/forms'
import { Badge, Button, cx, Sheet, UIProvider } from './ui/kit'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Ventes from './pages/Ventes'
import SaleDetail from './pages/SaleDetail'
import Livraisons from './pages/Livraisons'
import Plus_ from './pages/Plus'
import Vehicles from './pages/Vehicles'
import VehicleDetail from './pages/VehicleDetail'

const Devis = lazy(() => import('./pages/Devis'))
const DevisEdit = lazy(() => import('./pages/DevisEdit'))
const WhatsApp = lazy(() => import('./pages/WhatsApp'))
const Agenda = lazy(() => import('./pages/Agenda'))
const Commissions = lazy(() => import('./pages/Commissions'))
const Stats = lazy(() => import('./pages/Stats'))
const Assistant = lazy(() => import('./pages/Assistant'))
const Automations = lazy(() => import('./pages/Automations'))
const Notes = lazy(() => import('./pages/Notes'))
const AideVente = lazy(() => import('./pages/AideVente'))
const Fidelisation = lazy(() => import('./pages/Fidelisation'))
const Parametres = lazy(() => import('./pages/Parametres'))

class Boundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {}
  static getDerivedStateFromError(err: Error) { return { err } }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="text-lg font-bold">Un problème est survenu</h1>
        <p className="mt-2 text-sm text-muted">{this.state.err.message}</p>
        <p className="mt-2 text-sm text-muted">Vos données enregistrées ne sont pas touchées. Si le stockage du navigateur est désactivé (navigation privée), VO PILOT ne peut pas fonctionner.</p>
        <Button className="mt-4" onClick={() => location.reload()}>Recharger</Button>
      </div>
    )
  }
}

const TABS = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/ventes', label: 'Ventes', icon: ShoppingBag },
  { to: '/livraisons', label: 'Livraisons', icon: Truck },
  { to: '/plus', label: 'Plus', icon: LayoutGrid },
]
const SIDE = [
  ...TABS.slice(0, 4),
  { to: '/vehicules', label: 'Véhicules', icon: Car },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/devis', label: 'Devis', icon: FileText },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { to: '/assistant', label: 'Assistant', icon: Bot },
  { to: '/commissions', label: 'Commissions', icon: Wallet },
  { to: '/stats', label: 'Statistiques', icon: BarChart3 },
  { to: '/automatisations', label: 'Automatisations', icon: Zap },
  { to: '/plus', label: 'Tout voir', icon: LayoutGrid },
  { to: '/parametres', label: 'Paramètres', icon: Cog },
]

function useOnline() {
  const [on, setOn] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOn(true), down = () => setOn(false)
    window.addEventListener('online', up); window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  return on
}

function SearchSheet({ onClose }: { onClose: () => void }) {
  const d = useData()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const hits = useMemo(() => search(q, d), [q, d])
  return (
    <Sheet open onClose={onClose} title="Recherche">
      <input className="inp" autoFocus placeholder="Client, téléphone, véhicule, référence, note…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Recherche globale" />
      <div className="mt-3 space-y-1">
        {hits.map((h, i) => (
          <button key={i} type="button" onClick={() => { onClose(); nav(h.link) }} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-soft">
            <Badge tone="accent">{h.type}</Badge>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{h.titre}</span>{h.detail && <span className="block truncate text-xs text-muted">{h.detail}</span>}</span>
          </button>
        ))}
        {q.trim() && !hits.length && <p className="py-6 text-center text-sm text-muted">Aucun résultat pour « {q} ».</p>}
        {!q.trim() && <p className="py-6 text-center text-sm text-muted">Tapez un nom, un numéro, un modèle (« Arkana »)…</p>}
      </div>
    </Sheet>
  )
}

function AlertsSheet({ onClose }: { onClose: () => void }) {
  const { alerts } = useData()
  const nav = useNavigate()
  const list = alerts.filter((a) => !a.dismissedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <Sheet open onClose={onClose} title="Alertes" footer={list.length ? <Button variant="ghost" onClick={() => db.alerts.toCollection().modify({ dismissedAt: new Date().toISOString() })}>Tout marquer comme vu</Button> : undefined}>
      <div className="space-y-2">
        {list.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { if (a.link) { onClose(); nav(a.link) } }}>
              <Badge tone={a.niveau === 'critique' ? 'bad' : a.niveau === 'urgent' ? 'warn' : 'accent'}>{a.niveau === 'critique' ? 'Blocage' : a.niveau === 'urgent' ? 'Urgent' : 'Info'}</Badge>
              <span className="mt-1 block text-sm font-semibold">{a.titre}</span>
              {a.detail && <span className="block text-xs text-muted">{a.detail}</span>}
            </button>
            <Button size="sm" variant="ghost" onClick={() => db.alerts.update(a.id, { dismissedAt: new Date().toISOString() })}>Vu</Button>
          </div>
        ))}
        {!list.length && <p className="py-6 text-center text-sm text-muted">Aucune alerte en cours.</p>}
      </div>
    </Sheet>
  )
}

function Shell() {
  const { settings, alerts } = useData()
  const open = useDialog()
  const online = useOnline()
  const loc = useLocation()
  const [searching, setSearching] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const nAlerts = alerts.filter((a) => !a.dismissedAt).length

  useEffect(() => {
    const dark = settings.profil.theme === 'sombre' || (settings.profil.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }, [settings.profil.theme])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearching(true) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  // Moteur d'automatisations : à l'ouverture, après chaque modification, puis chaque minute (application ouverte uniquement).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const kick = () => { clearTimeout(t); t = setTimeout(() => { runAutomations().catch(() => {}) }, 400) }
    kick()
    const off = onDataChanged(kick)
    const i = setInterval(kick, 60000)
    return () => { off(); clearInterval(i); clearTimeout(t) }
  }, [])

  const isPrint = loc.pathname.startsWith('/devis/') && loc.search.includes('imprimer')
  const tools = (
    <div className="flex items-center gap-1">
      {!online && <Badge tone="warn"><WifiOff size={12} /> Hors ligne</Badge>}
      <button type="button" aria-label="Recherche" onClick={() => setSearching(true)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 md:hover:bg-soft"><Search size={20} /></button>
      <button type="button" aria-label={`Alertes (${nAlerts})`} onClick={() => setShowAlerts(true)} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 md:hover:bg-soft">
        <Bell size={20} />{nAlerts > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">{nAlerts}</span>}
      </button>
    </div>
  )
  return (
    <div className="min-h-full md:pl-60">
      {/* Barre latérale (ordinateur) */}
      <aside className={cx('no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-navy text-white md:flex', isPrint && '!hidden')}>
        <Link to="/" className="flex items-center gap-2 px-5 py-5 text-lg font-extrabold tracking-tight"><img src="./icon.svg" alt="" className="h-8 w-8 rounded-lg" />VO PILOT</Link>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {SIDE.map((t) => (
            <NavLink key={t.label} to={t.to} end={t.to === '/'} className={({ isActive }) => cx('flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium', isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white')}>
              <t.icon size={18} />{t.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3"><Button className="w-full" onClick={() => open('ajout')}><Plus size={18} />Ajout rapide</Button></div>
        <p className="px-5 pb-4 text-[11px] leading-snug text-white/50">Données enregistrées sur cet appareil uniquement. Pas de synchronisation cloud.</p>
      </aside>

      {/* En-tête mobile */}
      <header className={cx('safe-t no-print sticky top-0 z-20 bg-navy text-white md:hidden', isPrint && 'hidden')}>
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-base font-extrabold tracking-tight"><img src="./icon.svg" alt="" className="h-7 w-7 rounded-md" />VO PILOT</Link>
          {tools}
        </div>
      </header>
      <div className={cx('no-print sticky top-0 z-20 hidden items-center justify-end border-b border-line bg-bg/90 px-6 py-2 backdrop-blur md:flex', isPrint && '!hidden')}>
        <button type="button" onClick={() => setSearching(true)} className="mr-auto flex h-10 w-80 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm text-muted"><Search size={16} />Rechercher… <kbd className="ml-auto rounded bg-soft px-1.5 text-xs">Ctrl K</kbd></button>
        {tools}
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:px-6 md:pb-10">
        <Boundary>
          <Suspense fallback={<p className="py-10 text-center text-sm text-muted">Chargement…</p>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/ventes" element={<Ventes />} />
              <Route path="/ventes/:id" element={<SaleDetail />} />
              <Route path="/livraisons" element={<Livraisons />} />
              <Route path="/plus" element={<Plus_ />} />
              <Route path="/vehicules" element={<Vehicles />} />
              <Route path="/vehicules/:id" element={<VehicleDetail />} />
              <Route path="/devis" element={<Devis />} />
              <Route path="/devis/:id" element={<DevisEdit />} />
              <Route path="/whatsapp" element={<WhatsApp />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/commissions" element={<Commissions />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/automatisations" element={<Automations />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/aide-vente" element={<AideVente />} />
              <Route path="/fidelisation" element={<Fidelisation />} />
              <Route path="/parametres" element={<Parametres />} />
              <Route path="*" element={<p className="py-10 text-center text-muted">Page introuvable. <Link className="text-accent" to="/">Retour à l’accueil</Link></p>} />
            </Routes>
          </Suspense>
        </Boundary>
      </main>

      {/* Navigation inférieure (mobile) avec bouton d'ajout rapide */}
      <nav className={cx('safe-b no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur md:hidden', isPrint && 'hidden')} aria-label="Navigation principale">
        <div className="relative mx-auto grid max-w-lg grid-cols-5">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => cx('flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold', isActive ? 'text-accent' : 'text-muted')}>
              <t.icon size={22} />{t.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <button type="button" aria-label="Ajout rapide" onClick={() => open('ajout')} className={cx('no-print fixed bottom-[calc(4.4rem+env(safe-area-inset-bottom))] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 active:scale-95 md:hidden', isPrint && 'hidden')}><Plus size={28} /></button>

      {searching && <SearchSheet onClose={() => setSearching(false)} />}
      {showAlerts && <AlertsSheet onClose={() => setShowAlerts(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <Boundary>
      <UIProvider>
        <DataProvider fallback={<div className="grid h-full place-items-center text-sm text-muted">Ouverture de VO PILOT…</div>}>
          <DialogProvider>
            <Shell />
          </DialogProvider>
        </DataProvider>
      </UIProvider>
    </Boundary>
  )
}
