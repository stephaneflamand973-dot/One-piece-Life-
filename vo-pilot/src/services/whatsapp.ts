import type { Client, Settings, Vehicle } from '../lib/types'
import { fmtDay, fmtTime, dayKey } from '../lib/dates'
import { vehicleLabel } from './logic'

export const euro = (n?: number, devise = 'EUR') =>
  n === undefined || n === null || Number.isNaN(n) ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n)
export const kmFmt = (n?: number) => (n === undefined ? '—' : `${new Intl.NumberFormat('fr-FR').format(n)} km`)

export interface WaVars { client?: Client; vehicle?: Vehicle; modele?: string; prix?: number; rdv?: string; settings: Settings }

/** Remplace les variables {prenom}, {modele}… Les variables sans donnée restent visibles entre crochets : rien n'est inventé. */
export function renderTemplate(texte: string, v: WaVars): string {
  const veh = v.vehicle
  const vals: Record<string, string | undefined> = {
    prenom: v.client?.prenom || v.client?.nom,
    nom: v.client?.nom,
    modele: v.modele || (veh ? vehicleLabel(veh) : v.client?.recherche?.modele || v.client?.recherche?.texte),
    prix: v.prix !== undefined ? euro(v.prix) : veh?.prix !== undefined ? euro(veh.prix) : undefined,
    annee: veh?.annee ? String(veh.annee) : undefined,
    km: veh?.km !== undefined ? kmFmt(veh.km) : undefined,
    garantie: veh?.garantie,
    date: v.rdv ? fmtDay(dayKey(v.rdv), { weekday: 'long', day: 'numeric', month: 'long' }) : undefined,
    heure: v.rdv ? fmtTime(v.rdv) : undefined,
    commercial: v.settings.profil.nom || undefined,
    site: v.settings.profil.site || undefined,
  }
  let out = texte.replace(/\{(\w+)\}/g, (_, k: string) => vals[k] ?? `[${k}]`)
  if (v.settings.signature && !out.includes(v.settings.signature)) out += `\n${v.settings.signature}`
  return out
}

/** Numéro au format international pour wa.me. Hypothèse configurable par la saisie : 0696… → +596 696… (Martinique). */
export function waNumber(tel?: string): string | null {
  let d = (tel ?? '').replace(/[^\d+]/g, '')
  if (!d) return null
  if (d.startsWith('+')) d = d.slice(1)
  else if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0') && d.length === 10) d = `596${d.slice(1)}`
  return d.length >= 9 ? d : null
}
/** Lien qui OUVRE WhatsApp avec le message prérempli. L'envoi reste fait (et confirmé) par l'utilisateur. */
export function waLink(tel: string | undefined, text: string): string | null {
  const n = waNumber(tel)
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null
}
