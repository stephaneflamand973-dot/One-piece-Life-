import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Car, Download, Plus, Star, Upload } from 'lucide-react'
import type { Vehicle } from '../lib/types'
import { BOITES } from '../lib/defaults'
import { saveVehicle } from '../services/actions'
import { download } from '../services/backup'
import { toCsv, VEHICLE_HEADERS, vehiclesFromCsv, vehiclesToCsv, type CsvImport } from '../services/csv'
import { norm, vehicleLabel } from '../services/logic'
import { euro, kmFmt } from '../services/whatsapp'
import { useData } from '../ui/data'
import { useDialog, VEHICLE_STATUS } from '../ui/forms'
import { Badge, Button, Chip, Empty, Sheet, useRun, useUI } from '../ui/kit'
import { PageHead } from '../ui/shared'

export default function Vehicles() {
  const { vehicles } = useData()
  const open = useDialog()
  const run = useRun()
  const { toast } = useUI()
  const file = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [statut, setStatut] = useState<'dispo' | 'tous' | Vehicle['statut']>('dispo')
  const [boite, setBoite] = useState('')
  const [budget, setBudget] = useState('')
  const [tri, setTri] = useState<'recent' | 'prix' | 'prix_desc' | 'km'>('recent')
  const [imp, setImp] = useState<CsvImport | null>(null)

  const list = useMemo(() => {
    const mots = norm(q).split(/\s+/).filter(Boolean)
    const b = parseFloat(budget)
    const r = vehicles.filter((v) => {
      if (statut === 'dispo' ? !['disponible', 'a_verifier'].includes(v.statut) : statut !== 'tous' && v.statut !== statut) return false
      if (boite && norm(v.boite) !== norm(boite)) return false
      if (b > 0 && (v.prix === undefined || v.prix > b)) return false
      const txt = norm(`${v.ref} ${vehicleLabel(v)} ${v.categorie ?? ''} ${v.carburant ?? ''} ${v.couleur ?? ''} ${v.annee ?? ''} ${v.site ?? ''} ${v.equipements ?? ''}`)
      return mots.every((m) => txt.includes(m))
    })
    const by = { recent: (a: Vehicle, c: Vehicle) => c.createdAt.localeCompare(a.createdAt), prix: (a: Vehicle, c: Vehicle) => (a.prix ?? 9e9) - (c.prix ?? 9e9), prix_desc: (a: Vehicle, c: Vehicle) => (c.prix ?? 0) - (a.prix ?? 0), km: (a: Vehicle, c: Vehicle) => (a.km ?? 9e9) - (c.km ?? 9e9) }
    return r.sort(by[tri])
  }, [vehicles, q, statut, boite, budget, tri])

  const onFile = async (f?: File) => {
    if (!f) return
    if (/\.xlsx?$/i.test(f.name)) return toast('Les fichiers Excel ne sont pas lus directement : enregistrez la feuille au format CSV, puis importez-la.', 'bad')
    try { setImp(vehiclesFromCsv(await f.text())) } catch { toast('Fichier illisible.', 'bad') }
    if (file.current) file.current.value = ''
  }
  const doImport = () => run(async () => {
    let crees = 0, maj = 0
    for (const v of imp!.vehicles) { const r = await saveVehicle(v, { origine: 'import' }); r.created ? crees++ : maj++ }
    setImp(null)
    toast(`${crees} véhicule(s) ajouté(s), ${maj} mis à jour`)
  })
  const existants = new Set(vehicles.map((v) => v.ref))

  return (
    <div>
      <PageHead title="Catalogue véhicules" sub={`${vehicles.length} véhicule${vehicles.length > 1 ? 's' : ''} — catalogue personnel, non relié au stock Renault`} back="/plus"
        right={<><Button variant="outline" size="sm" aria-label="Importer un CSV" onClick={() => file.current?.click()}><Upload size={16} /><span className="hidden sm:inline">Importer</span></Button><Button variant="outline" size="sm" aria-label="Exporter en CSV" disabled={!vehicles.length} onClick={() => download('vo-pilot-vehicules.csv', vehiclesToCsv(vehicles), 'text/csv')}><Download size={16} /></Button><Button onClick={() => open('vehicule')}><Plus size={18} /></Button></>} />
      <input ref={file} type="file" accept=".csv,text/csv,.txt,.xlsx,.xls" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <input className="inp col-span-2" placeholder="Marque, modèle, référence, équipement…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un véhicule" />
        <input className="inp" inputMode="numeric" placeholder="Budget max €" value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Budget maximum" />
        <select className="inp" value={tri} onChange={(e) => setTri(e.target.value as typeof tri)} aria-label="Tri"><option value="recent">Plus récents</option><option value="prix">Prix croissant</option><option value="prix_desc">Prix décroissant</option><option value="km">Kilométrage</option></select>
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={statut === 'dispo'} onClick={() => setStatut('dispo')}>Disponibles</Chip>
        {BOITES.map((b) => <Chip key={b} active={boite === b} onClick={() => setBoite(boite === b ? '' : b)}>{b}</Chip>)}
        {(['reserve', 'preparation', 'vendu', 'a_verifier'] as const).map((k) => <Chip key={k} active={statut === k} onClick={() => setStatut(k)}>{VEHICLE_STATUS[k].label}</Chip>)}
        <Chip active={statut === 'tous'} onClick={() => setStatut('tous')}>Tous</Chip>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => (
          <Link key={v.id} to={`/vehicules/${v.id}`} className="rounded-2xl border border-line bg-card p-3.5 transition hover:border-accent">
            <div className="flex items-start justify-between gap-2"><p className="min-w-0 truncate font-bold">{v.favori && <Star size={14} className="mr-1 inline fill-current text-warn" />}{vehicleLabel(v)}</p><Badge tone={VEHICLE_STATUS[v.statut].tone}>{VEHICLE_STATUS[v.statut].label}</Badge></div>
            <p className="mt-0.5 truncate text-sm text-muted">{[v.annee, v.km !== undefined ? kmFmt(v.km) : '', v.carburant, v.boite].filter(Boolean).join(' · ') || 'Caractéristiques à compléter'}</p>
            <div className="mt-2 flex items-end justify-between"><span className="text-lg font-extrabold">{euro(v.prix)}</span><span className="text-xs text-muted">{v.ref}{v.site ? ` · ${v.site}` : ''}</span></div>
          </Link>
        ))}
      </div>
      {!list.length && <Empty icon={<Car size={28} />} title={vehicles.length ? 'Aucun véhicule ne correspond' : 'Catalogue vide'} action={<div className="flex flex-wrap justify-center gap-2"><Button onClick={() => open('vehicule')}>Ajouter un véhicule</Button><Button variant="outline" onClick={() => download('modele-import-vehicules.csv', toCsv(VEHICLE_HEADERS, [['EX-001', 'Renault', 'Clio', 'V TCe 90', 'Citadine', 2022, 30000, 'Essence', 'Automatique', 90, 5, 'Gris', 14490, '12 mois', 'Lareinty', 'GPS, Caméra', 'disponible', '2026-06-01', '']]), 'text/csv')}>Modèle de fichier CSV</Button></div>}>Ajoutez vos véhicules à la main ou importez un fichier CSV que vous êtes autorisé à utiliser.</Empty>}

      <Sheet open={!!imp} onClose={() => setImp(null)} title="Import CSV — vérification" footer={<><Button variant="ghost" onClick={() => setImp(null)}>Annuler</Button><Button disabled={!imp?.vehicles.length} onClick={doImport}>Importer {imp?.vehicles.length ?? 0} véhicule(s)</Button></>}>
        {imp && <div className="space-y-3 text-sm">
          <p><b>{imp.vehicles.length}</b> ligne(s) valides : {imp.vehicles.filter((v) => v.ref && existants.has(v.ref)).length} mise(s) à jour par référence, {imp.vehicles.filter((v) => !v.ref || !existants.has(v.ref)).length} création(s).</p>
          {imp.erreurs.map((e) => <p key={e} className="rounded-xl bg-bad-soft px-3 py-2 text-bad">{e}</p>)}
          {imp.colonnesIgnorees.length > 0 && <p className="text-muted">Colonnes ignorées : {imp.colonnesIgnorees.join(', ')}</p>}
          <div className="max-h-56 overflow-y-auto rounded-xl border border-line">{imp.vehicles.slice(0, 50).map((v, i) => <p key={i} className="border-b border-line px-3 py-1.5 last:border-0">{v.ref ?? '(réf. générée)'} — {v.marque} {v.modele} {v.prix ? `· ${euro(v.prix)}` : ''}</p>)}</div>
          <p className="text-xs text-muted">N’importez que des données que vous êtes autorisé à utiliser. Aucune connexion au stock Renault n’est effectuée.</p>
        </div>}
      </Sheet>
    </div>
  )
}
