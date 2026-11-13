import { Link } from 'react-router-dom'
import { BarChart3, Bot, CalendarDays, Car, FileText, HeartHandshake, Lightbulb, MessageCircle, Settings, StickyNote, Wallet, Zap } from 'lucide-react'
import { PageHead } from '../ui/shared'

const ITEMS = [
  { to: '/vehicules', label: 'Véhicules', sub: 'Catalogue, import CSV, photos', icon: Car },
  { to: '/agenda', label: 'Agenda', sub: 'Jour, semaine, mois, export ICS', icon: CalendarDays },
  { to: '/devis', label: 'Devis', sub: 'Propositions et simulations', icon: FileText },
  { to: '/whatsapp', label: 'WhatsApp', sub: 'Modèles de messages', icon: MessageCircle },
  { to: '/assistant', label: 'Assistant', sub: 'Questions sur vos données', icon: Bot },
  { to: '/aide-vente', label: 'Aide à la vente', sub: 'Objections, conclusion', icon: Lightbulb },
  { to: '/commissions', label: 'Commissions', sub: 'Barème, simulateur, versements', icon: Wallet },
  { to: '/stats', label: 'Statistiques', sub: 'Conversions, axes d’amélioration', icon: BarChart3 },
  { to: '/fidelisation', label: 'Fidélisation', sub: 'Clients livrés, suivis', icon: HeartHandshake },
  { to: '/automatisations', label: 'Automatisations', sub: 'Règles métier', icon: Zap },
  { to: '/notes', label: 'Notes', sub: 'Notes professionnelles', icon: StickyNote },
  { to: '/parametres', label: 'Paramètres', sub: 'Profil, tarifs, sauvegarde', icon: Settings },
]
export default function Plus() {
  return (
    <div>
      <PageHead title="Plus" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {ITEMS.map((i) => (
          <Link key={i.to} to={i.to} className="rounded-2xl border border-line bg-card p-4 transition hover:border-accent">
            <i.icon size={24} className="text-accent" />
            <p className="mt-2 font-bold">{i.label}</p>
            <p className="text-xs text-muted">{i.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
