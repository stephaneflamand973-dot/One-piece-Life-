import { useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Camera, FileText, MessageCircle, Pencil, Share2, ShoppingBag, Star, Trash2 } from 'lucide-react'
import { db } from '../lib/db'
import type { Vehicle } from '../lib/types'
import { fmtDay } from '../lib/dates'
import { addPhoto, deleteVehicle, reorderPhotos, toggleFavori } from '../services/actions'
import { download } from '../services/backup'
import { clientName, clientsForVehicle, ctAVerifier, vehicleLabel } from '../services/logic'
import { euro, kmFmt } from '../services/whatsapp'
import { useData } from '../ui/data'
import { useDialog, VEHICLE_STATUS } from '../ui/forms'
import { Badge, Button, Card, cx, Empty, Section, useRun, useUI } from '../ui/kit'
import { PageHead } from '../ui/shared'

const ORDRE_CONSEILLE = ['Trois-quarts avant', 'Profil', 'Arrière', 'Habitacle', 'Tableau de bord', 'Compteur', 'Coffre', 'Détail']

/** Réduit la photo (1600 px max) sans aucune retouche : les défauts du véhicule restent visibles. */
async function compress(file: File): Promise<string> {
  const img = await createImageBitmap(file)
  const k = Math.min(1, 1600 / Math.max(img.width, img.height))
  const cv = document.createElement('canvas')
  cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k)
  cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height)
  return cv.toDataURL('image/jpeg', 0.82)
}

/** Fiche partageable : photo principale + bandeau discret (modèle, année, km, garantie, prix). */
async function buildFiche(v: Vehicle, photo?: string): Promise<Blob> {
  const W = 1080, H = 1080
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const g = cv.getContext('2d')!
  g.fillStyle = '#0b1b3a'; g.fillRect(0, 0, W, H)
  if (photo) {
    const img = new Image(); img.src = photo; await img.decode()
    const k = Math.max(W / img.width, H / img.height)
    g.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k)
  }
  const bh = 230
  g.fillStyle = 'rgba(11,27,58,0.86)'; g.fillRect(0, H - bh, W, bh)
  g.fillStyle = '#fff'; g.font = '700 52px -apple-system, Segoe UI, Arial'; g.textBaseline = 'top'
  g.fillText(vehicleLabel(v).slice(0, 34), 48, H - bh + 34)
  g.font = '400 36px -apple-system, Segoe UI, Arial'; g.fillStyle = '#cbd5e1'
  g.fillText([v.annee, v.km !== undefined ? kmFmt(v.km) : '', v.boite, v.carburant].filter(Boolean).join('  ·  '), 48, H - bh + 106)
  g.fillText(v.garantie ? `Garantie ${v.garantie}` : '', 48, H - bh + 158)
  if (v.prix !== undefined) { g.textAlign = 'right'; g.fillStyle = '#22d3ee'; g.font = '800 60px -apple-system, Segoe UI, Arial'; g.fillText(euro(v.prix), W - 48, H - bh + 140) }
  return new Promise((res) => cv.toBlob((b) => res(b!), 'image/jpeg', 0.9))
}

export default function VehicleDetail() {
  const { id } = useParams()
  const d = useData()
  const open = useDialog()
  const nav = useNavigate()
  const run = useRun()
  const { confirm, toast } = useUI()
  const file = useRef<HTMLInputElement>(null)
  const v = id ? d.byVehicle.get(id) : undefined
  const photos = useLiveQuery(() => (id ? db.photos.where('vehicleId').equals(id).sortBy('ordre') : []), [id]) ?? []
  const matches = useMemo(() => (v ? clientsForVehicle(v, d.clients, d.settings.pipeline) : []), [v, d.clients, d.settings.pipeline])
  if (!v) return <Empty title="Véhicule introuvable" action={<Button onClick={() => nav('/vehicules')}>Retour au catalogue</Button>} />
  const sale = d.sales.find((x) => x.vehicleId === v.id && x.statut !== 'annule')
  const ct = ctAVerifier(v, d.settings)

  const onPhotos = (files: FileList | null) => run(async () => {
    for (const f of Array.from(files ?? [])) await addPhoto(v.id, await compress(f), ORDRE_CONSEILLE[Math.min(photos.length, ORDRE_CONSEILLE.length - 1)])
    if (file.current) file.current.value = ''
  }, 'Photo(s) ajoutée(s)')
  const move = (i: number, dir: number) => { const ids = photos.map((p) => p.id); const j = i + dir; if (j < 0 || j >= ids.length) return;[ids[i], ids[j]] = [ids[j], ids[i]]; reorderPhotos(ids) }
  const fiche = () => run(async () => {
    const blob = await buildFiche(v, photos[0]?.data)
    const f = new File([blob], `fiche-${v.ref}.jpg`, { type: 'image/jpeg' })
    if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title: vehicleLabel(v) }) } catch { /* partage annulé */ } }
    else { download(f.name, blob); toast('Fiche téléchargée') }
  })
  const specs: [string, string | number | undefined][] = [['Année', v.annee], ['Kilométrage', v.km !== undefined ? kmFmt(v.km) : undefined], ['Carburant', v.carburant], ['Boîte', v.boite], ['Puissance', v.puissance ? `${v.puissance} ch` : undefined], ['Chevaux fiscaux', v.cvFiscaux], ['Couleur', v.couleur], ['Catégorie', v.categorie], ['Garantie', v.garantie], ['Localisation', v.site], ['Dernier CT', v.dernierCT ? fmtDay(v.dernierCT) : undefined]]

  return (
    <div>
      <PageHead back="/vehicules" title={vehicleLabel(v)} sub={<span className="flex flex-wrap items-center gap-1.5"><Badge tone={VEHICLE_STATUS[v.statut].tone}>{VEHICLE_STATUS[v.statut].label}</Badge><span>{v.ref}</span>{v.demo && <Badge>Démo</Badge>}</span>}
        right={<><button type="button" aria-label="Favori" onClick={() => toggleFavori('vehicles', v.id)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><Star size={20} className={cx(v.favori ? 'fill-current text-warn' : 'text-muted')} /></button><Button variant="outline" size="sm" onClick={() => open('vehicule', { vehicleId: v.id })}><Pencil size={15} />Modifier</Button></>} />

      <Card className="mb-4 overflow-hidden">
        {photos[0] ? (
          <div className="relative"><img src={photos[0].data} alt={`${vehicleLabel(v)} — ${photos[0].label ?? 'photo principale'}`} className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-navy/80 px-4 py-2 text-white"><span className="text-sm"><b>{v.modele}</b> · {[v.annee, v.km !== undefined ? kmFmt(v.km) : '', v.garantie ? `garantie ${v.garantie}` : ''].filter(Boolean).join(' · ')}</span><span className="font-extrabold text-cyan-300">{euro(v.prix)}</span></div></div>
        ) : <div className="grid aspect-[16/7] place-items-center bg-soft text-sm text-muted">Aucune photo</div>}
        <div className="flex flex-wrap gap-2 p-3">
          <Button size="sm" onClick={() => nav(`/devis/nouveau?vehicule=${v.id}`)}><FileText size={15} />Devis</Button>
          <Button size="sm" variant="outline" onClick={fiche}><Share2 size={15} />Fiche à partager</Button>
          {!sale && <Button size="sm" variant="outline" onClick={() => open('vente', { vehicleId: v.id })}><ShoppingBag size={15} />Vendre</Button>}
          {sale && <Button size="sm" variant="outline" onClick={() => nav(`/ventes/${sale.id}`)}>Dossier {sale.ref}</Button>}
        </div>
      </Card>

      <Section title="Caractéristiques">
        <Card className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-muted">Prix affiché</p><p className="text-lg font-extrabold">{euro(v.prix)}</p></div>
          {specs.map(([k, val]) => <div key={k}><p className="text-xs text-muted">{k}</p><p className={cx(val === undefined && 'text-muted')}>{val ?? 'non renseigné'}</p></div>)}
          {v.equipements && <div className="col-span-full"><p className="text-xs text-muted">Équipements</p><p>{v.equipements}</p></div>}
          {v.infos && <div className="col-span-full"><p className="text-xs text-muted">Informations</p><p className="whitespace-pre-line">{v.infos}</p></div>}
          {ct.aVerifier && <p className="col-span-full text-xs text-warn">Contrôle technique à vérifier : {ct.raison}.</p>}
        </Card>
      </Section>

      <Section title={`Prospects compatibles (${matches.length})`}>
        <div className="space-y-2">
          {matches.map(({ client: c, match }) => (
            <Card key={c.id} className="p-3.5">
              <Link to={`/clients/${c.id}`} className="font-bold hover:text-accent">{clientName(c)}</Link>
              <div className="mt-1.5 flex flex-wrap gap-1">{match.raisons.map((r) => <Badge key={r} tone="ok">{r}</Badge>)}{match.ecarts.map((r) => <Badge key={r} tone="warn">{r}</Badge>)}</div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Button size="sm" disabled={!c.consentement?.whatsapp} onClick={() => nav(`/whatsapp?client=${c.id}&vehicule=${v.id}&modele=arrivage`)}><MessageCircle size={15} />Préparer un message</Button>
                <Button size="sm" variant="outline" onClick={() => open('tache', { clientId: c.id, type: 'appel' })}>Planifier un appel</Button>
                {!c.consentement?.whatsapp && <span className="self-center text-xs text-muted">WhatsApp non autorisé par ce client</span>}
              </div>
            </Card>
          ))}
          {!matches.length && <p className="px-1 text-sm text-muted">Aucun prospect actif ne recherche ce type de véhicule d’après les critères saisis.</p>}
        </div>
        {matches.length > 0 && <p className="mt-2 px-1 text-xs text-muted">Suggestions fondées sur les recherches saisies. Aucun envoi groupé : chaque message est préparé et envoyé individuellement par vous.</p>}
      </Section>

      <Section title={`Photos (${photos.length})`} right={<Button size="sm" variant="soft" onClick={() => file.current?.click()}><Camera size={15} />Ajouter</Button>}>
        <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => onPhotos(e.target.files)} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-line bg-card">
              <img src={p.data} alt={p.label ?? `Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center gap-1 p-1.5">
                <input className="min-w-0 flex-1 bg-transparent px-1 text-xs" aria-label="Légende" defaultValue={p.label ?? ''} onBlur={(e) => db.photos.update(p.id, { label: e.target.value })} />
                <button type="button" aria-label="Monter" className="p-1 text-muted" onClick={() => move(i, -1)}><ArrowUp size={16} /></button>
                <button type="button" aria-label="Descendre" className="p-1 text-muted" onClick={() => move(i, 1)}><ArrowDown size={16} /></button>
                <button type="button" aria-label="Supprimer la photo" className="p-1 text-bad" onClick={() => db.photos.delete(p.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 px-1 text-xs text-muted">Ordre conseillé : {ORDRE_CONSEILLE.slice(0, 7).join(' → ')}. La première photo sert de photo principale. Les photos sont seulement redimensionnées, jamais retouchées : les défauts restent visibles.</p>
      </Section>

      <Button variant="danger" onClick={async () => { if (await confirm({ title: 'Supprimer ce véhicule ?', message: `${vehicleLabel(v)} (${v.ref}) et ses photos seront supprimés.`, confirmLabel: 'Supprimer', danger: true })) { const ok = await run(async () => { await deleteVehicle(v.id); return true }, 'Véhicule supprimé'); if (ok) nav('/vehicules') } }}><Trash2 size={16} />Supprimer</Button>
    </div>
  )
}
