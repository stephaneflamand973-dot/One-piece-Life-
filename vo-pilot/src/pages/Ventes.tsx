import { useMemo, useState } from 'react'
import { Plus, ShoppingBag } from 'lucide-react'
import { addMonths, fmtMonth, monthKey } from '../lib/dates'
import { isConfirmed, saleMonth, salesOfMonth, VENTE_DEF } from '../services/logic'
import { euro } from '../services/whatsapp'
import { useData } from '../ui/data'
import { useDialog } from '../ui/forms'
import { Button, Chip, Empty, Progress, Card } from '../ui/kit'
import { PageHead, SaleCard } from '../ui/shared'

type F = 'cours' | 'commandes' | 'mois' | 'livrees' | 'annulees' | 'toutes'
export default function Ventes() {
  const { sales, settings: s } = useData()
  const open = useDialog()
  const [f, setF] = useState<F>('cours')
  const [mois, setMois] = useState(monthKey())
  const groups = useMemo(() => ({
    cours: sales.filter((x) => isConfirmed(x) && x.statut !== 'livre'),
    commandes: sales.filter((x) => ['commande_attente', 'bc_signe', 'financement_attente', 'paiement_attente'].includes(x.statut)),
    mois: salesOfMonth(sales, mois, s),
    livrees: sales.filter((x) => x.statut === 'livre'),
    annulees: sales.filter((x) => x.statut === 'annule'),
    toutes: sales,
  }), [sales, mois, s])
  const list = [...groups[f]].sort((a, b) => (saleMonth(b, s) ?? b.createdAt).localeCompare(saleMonth(a, s) ?? a.createdAt) || b.createdAt.localeCompare(a.createdAt))
  const nMois = groups.mois.length
  return (
    <div>
      <PageHead title="Ventes" sub="Un dossier unique par vente, du bon de commande à la livraison" right={<Button onClick={() => open('vente')}><Plus size={18} /><span className="hidden sm:inline">Vente</span></Button>} />
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <button type="button" aria-label="Mois précédent" className="h-9 w-9 rounded-full hover:bg-soft" onClick={() => setMois(addMonths(mois, -1))}>‹</button>
          <div className="text-center"><p className="text-sm font-semibold cap">{fmtMonth(mois)}</p><p className="text-2xl font-extrabold tabular-nums">{nMois}<span className="text-base font-semibold text-muted"> / {s.profil.objectifMensuel} ventes</span></p></div>
          <button type="button" aria-label="Mois suivant" className="h-9 w-9 rounded-full hover:bg-soft" onClick={() => setMois(addMonths(mois, 1))}>›</button>
        </div>
        <div className="mt-2"><Progress value={nMois} max={s.profil.objectifMensuel} tone={nMois >= s.profil.objectifMensuel ? 'ok' : 'accent'} /></div>
        <p className="mt-2 text-xs text-muted">Une vente est comptée une seule fois, {VENTE_DEF[s.commission.venteCompteeA]} (réglable dans Paramètres). Chiffre d’affaires du mois : {euro(groups.mois.reduce((t, x) => t + x.prixVente, 0))}.</p>
      </Card>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {([['cours', 'En cours'], ['commandes', 'Commandes à confirmer'], ['mois', 'Comptées ce mois'], ['livrees', 'Livrées'], ['annulees', 'Annulées'], ['toutes', 'Toutes']] as [F, string][]).map(([id, l]) => <Chip key={id} active={f === id} count={groups[id].length} onClick={() => setF(id)}>{l}</Chip>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2">{list.map((x) => <SaleCard key={x.id} sale={x} />)}</div>
      {!list.length && <Empty icon={<ShoppingBag size={28} />} title="Aucune vente dans cette vue" action={<Button onClick={() => open('vente')}>Nouvelle vente</Button>}>Créer une vente ouvre automatiquement le dossier de préparation et l’estimation de commission (si le barème est renseigné).</Empty>}
    </div>
  )
}
