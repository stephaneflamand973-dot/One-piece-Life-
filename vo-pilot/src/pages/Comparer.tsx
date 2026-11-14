import { useNavigate, useSearchParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import type { Vehicle } from '../lib/types'
import { fmtDay, today } from '../lib/dates'
import { vehicleLabel } from '../services/logic'
import { euro, kmFmt } from '../services/whatsapp'
import { useData } from '../ui/data'
import { VEHICLE_STATUS } from '../ui/forms'
import { Button, Empty } from '../ui/kit'
import { PageHead } from '../ui/shared'

const ROWS: [string, (v: Vehicle) => string | number | undefined, ('min' | 'max')?][] = [
  ['Prix affiché', (v) => v.prix, 'min'], ['Année', (v) => v.annee, 'max'], ['Kilométrage', (v) => v.km, 'min'], ['Carburant', (v) => v.carburant], ['Boîte', (v) => v.boite],
  ['Puissance (ch)', (v) => v.puissance], ['Chevaux fiscaux', (v) => v.cvFiscaux], ['Catégorie', (v) => v.categorie], ['Couleur', (v) => v.couleur], ['Garantie', (v) => v.garantie],
  ['Localisation', (v) => v.site], ['Disponibilité', (v) => VEHICLE_STATUS[v.statut].label], ['Équipements', (v) => v.equipements], ['Informations', (v) => v.infos],
]
const show = (label: string, x: string | number | undefined) => (x === undefined || x === '' ? '—' : label === 'Prix affiché' ? euro(x as number) : label === 'Kilométrage' ? kmFmt(x as number) : String(x))

export default function Comparer() {
  const { byVehicle, settings } = useData()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const list = (sp.get('ids') ?? '').split(',').map((id) => byVehicle.get(id)).filter((v): v is Vehicle => !!v).slice(0, 3)
  const print = sp.has('imprimer')
  if (list.length < 2) return <Empty title="Sélectionnez au moins deux véhicules" action={<Button onClick={() => nav('/vehicules')}>Retour au catalogue</Button>}>Dans le catalogue, touchez « Comparer » puis choisissez 2 ou 3 véhicules.</Empty>
  return (
    <div className={print ? 'mx-auto max-w-4xl' : ''}>
      {!print && <PageHead back="/vehicules" title="Comparaison" sub={`${list.length} véhicules`} right={<Button variant="outline" size="sm" onClick={() => nav(`/comparer?ids=${sp.get('ids')}&imprimer`)}><Printer size={16} />Imprimer</Button>} />}
      {print && <div className="no-print mb-4 flex gap-2"><Button variant="outline" onClick={() => nav(`/comparer?ids=${sp.get('ids')}`)}>Retour</Button><Button onClick={() => window.print()}><Printer size={16} />Imprimer / enregistrer en PDF</Button></div>}
      <div className={print ? 'print-page rounded-2xl border border-line bg-white p-6 text-[#0b1b3a]' : 'overflow-x-auto rounded-2xl border border-line bg-card'}>
        {print && <div className="mb-4 flex items-end justify-between border-b border-slate-200 pb-3"><p className="text-xl font-extrabold">Comparaison de véhicules</p><p className="text-sm text-slate-500">{settings.profil.nom || 'Votre conseiller'} · {fmtDay(today())}</p></div>}
        <table className="w-full text-sm" style={{ minWidth: 90 + list.length * 130 }}>
          <thead><tr><th className="w-24 p-2 text-left text-xs font-semibold uppercase text-muted" />{list.map((v) => <th key={v.id} className="p-3 text-left align-top"><span className="block font-bold">{vehicleLabel(v)}</span><span className="block text-xs font-normal text-muted">{v.ref}</span></th>)}</tr></thead>
          <tbody>
            {ROWS.map(([label, get, best]) => {
              const vals = list.map(get)
              if (vals.every((x) => x === undefined || x === '')) return null
              const nums = vals.filter((x): x is number => typeof x === 'number')
              const top = best && nums.length === list.length && new Set(nums).size > 1 ? (best === 'min' ? Math.min(...nums) : Math.max(...nums)) : undefined
              return <tr key={label} className="border-t border-line"><td className="p-2 text-[11px] font-semibold uppercase text-muted">{label}</td>{vals.map((x, i) => <td key={i} className={`p-3 align-top ${top !== undefined && x === top ? 'font-bold text-ok' : ''}`}>{show(label, x)}</td>)}</tr>
            })}
          </tbody>
        </table>
        <p className={`p-3 text-xs ${print ? 'text-slate-500' : 'text-muted'}`}>En vert : la valeur la plus basse (prix, kilométrage) ou la plus récente (année). Caractéristiques telles que saisies dans le catalogue ; « — » = non renseigné. Document indicatif, non contractuel.</p>
      </div>
    </div>
  )
}
