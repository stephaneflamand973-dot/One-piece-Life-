import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { fmtDateTime, fmtDay, today } from '../lib/dates'
import { clientName, lastInteraction, vehicleLabel, vehiclesForClient } from '../services/logic'
import { euro, kmFmt } from '../services/whatsapp'
import { useData } from '../ui/data'
import { Button, Empty } from '../ui/kit'

/** Fiche de préparation d'un rendez-vous : ce qu'on sait déjà, ce qu'il reste à demander, les véhicules à présenter. */
export default function FicheRdv() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const d = useData()
  const nav = useNavigate()
  const c = id ? d.byClient.get(id) : undefined
  if (!c) return <Empty title="Fiche introuvable" action={<Button onClick={() => nav('/clients')}>Retour</Button>} />
  const rdv = d.tasks.filter((t) => t.clientId === c.id && t.statut === 'ouverte' && ['rdv', 'essai'].includes(t.type)).sort((a, b) => (a.due ?? 'z').localeCompare(b.due ?? 'z'))[0]
  const matches = vehiclesForClient(c, d.vehicles).slice(0, 3)
  const dernier = lastInteraction(c.id, d.interactions)
  const r = c.recherche ?? {}
  const sait: [string, string | undefined][] = [
    ['Véhicule recherché', [r.marque, r.modele ?? r.texte, r.categorie].filter(Boolean).join(' ') || undefined], ['Usage prévu', c.usage], ['Budget', r.budgetMax ? `≤ ${euro(r.budgetMax)}` : undefined],
    ['Boîte / carburant', [r.boite, r.carburant].filter(Boolean).join(' · ') || undefined], ['Reprise', c.reprise], ['Financement', c.financement], ['Indispensables', r.equipements], ['Délai d’achat', c.delaiAchat], ['Contraintes', c.contraintes],
  ]
  const manque = sait.filter(([, v]) => !v).map(([k]) => k)
  const print = sp.has('imprimer')
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex gap-2"><Button variant="outline" onClick={() => nav(`/clients/${c.id}`)}>Retour</Button><Button onClick={() => (print ? window.print() : nav(`/fiche-rdv/${c.id}?imprimer`))}><Printer size={16} />{print ? 'Imprimer / enregistrer en PDF' : 'Version imprimable'}</Button></div>
      <div className={print ? 'print-page rounded-2xl border border-line bg-white p-8 text-[#0b1b3a]' : 'rounded-2xl border border-line bg-card p-5'}>
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div><p className="text-xl font-extrabold">Fiche de rendez-vous</p><p className="text-sm text-muted">{rdv ? `${rdv.type === 'essai' ? 'Essai' : 'Rendez-vous'} — ${rdv.titre} · ${fmtDateTime(rdv.due)}` : 'Aucun rendez-vous programmé'}</p></div>
          <p className="text-right text-xs text-muted">{d.settings.profil.nom}<br />{fmtDay(today())}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs font-bold uppercase text-muted">Client</p><p className="font-semibold">{clientName(c)}</p><p>{c.tel}</p><p>{c.email}</p></div>
          <div><p className="text-xs font-bold uppercase text-muted">Dernier échange</p><p>{dernier ? `${fmtDay(dernier.date.slice(0, 10))}${dernier.resultat ? ` — ${dernier.resultat}` : ''}` : 'Aucun échange enregistré'}</p>{dernier?.commentaire && <p className="text-muted">{dernier.commentaire}</p>}</div>
        </div>
        <p className="mt-5 text-xs font-bold uppercase text-muted">Ce que je sais déjà</p>
        <table className="mt-1 w-full text-sm"><tbody>{sait.filter(([, v]) => v).map(([k, v]) => <tr key={k} className="border-b border-line"><td className="w-40 py-1.5 text-muted">{k}</td><td className="py-1.5">{v}</td></tr>)}</tbody></table>
        {!sait.some(([, v]) => v) && <p className="mt-1 text-sm text-muted">Rien de renseigné pour l’instant.</p>}
        {manque.length > 0 && <><p className="mt-5 text-xs font-bold uppercase text-muted">À demander pendant le rendez-vous</p><ul className="mt-1 space-y-2 text-sm">{manque.map((k) => <li key={k} className="flex items-end gap-2"><span className="h-4 w-4 shrink-0 rounded border border-line" />{k}<span className="flex-1 border-b border-dotted border-line" /></li>)}</ul></>}
        <p className="mt-5 text-xs font-bold uppercase text-muted">Véhicules à présenter</p>
        {matches.length ? <table className="mt-1 w-full text-sm"><tbody>{matches.map(({ vehicle: v, match }) => <tr key={v.id} className="border-b border-line align-top"><td className="py-1.5 font-semibold">{vehicleLabel(v)}<span className="block text-xs font-normal text-muted">{[v.ref, v.annee, v.km !== undefined ? kmFmt(v.km) : '', v.boite, v.site].filter(Boolean).join(' · ')}</span><span className="block text-xs font-normal text-muted">{match.raisons.join(' · ')}</span></td><td className="py-1.5 text-right font-semibold">{euro(v.prix)}</td></tr>)}</tbody></table> : <p className="mt-1 text-sm text-muted">Aucun véhicule du catalogue ne correspond aux critères saisis.</p>}
        <p className="mt-5 text-xs font-bold uppercase text-muted">Pendant le rendez-vous</p>
        <ul className="mt-1 space-y-1.5 text-sm">{['Proposer un essai', 'Demander ce qui le fait hésiter, pas seulement ce qui lui plaît', 'Convenir d’une prochaine étape datée avant qu’il parte'].map((x) => <li key={x} className="flex items-center gap-2"><span className="h-4 w-4 shrink-0 rounded border border-line" />{x}</li>)}</ul>
        <p className="mt-5 text-xs font-bold uppercase text-muted">Notes</p>
        <div className="mt-1 h-24 rounded-xl border border-dashed border-line" />
        <p className="mt-4 text-xs text-muted">Document de travail interne. Disponibilité et prix des véhicules à vérifier dans les outils internes avant le rendez-vous.</p>
      </div>
    </div>
  )
}
