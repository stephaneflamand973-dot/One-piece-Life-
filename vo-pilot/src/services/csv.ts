import type { Vehicle, VehicleStatus } from '../lib/types'
import { norm, num } from './logic'

/** Analyse CSV tolérante : séparateur ; , ou tabulation, guillemets, BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const first = src.split(/\r?\n/)[0] ?? ''
  const count = (ch: string) => first.split(ch).length - 1
  const sep = count(';') >= count(',') && count(';') >= count('\t') ? ';' : count('\t') > count(',') ? '\t' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (q) {
      if (ch === '"') { if (src[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += ch
    } else if (ch === '"') q = true
    else if (ch === sep) { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cur); cur = ''
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
    } else cur += ch
  }
  row.push(cur)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  return rows
}

export function toCsv(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const esc = (v: string | number | undefined | null) => {
    const s = v === undefined || v === null ? '' : String(v)
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [headers, ...rows].map((r) => r.map(esc).join(';')).join('\r\n')
}

const COLS: Record<string, keyof Vehicle> = {
  ref: 'ref', reference: 'ref', 'reference interne': 'ref', immat: 'ref', marque: 'marque', modele: 'modele', version: 'version', finition: 'version',
  categorie: 'categorie', annee: 'annee', 'mise en circulation': 'annee', km: 'km', kilometrage: 'km', carburant: 'carburant', energie: 'carburant',
  boite: 'boite', 'boite de vitesses': 'boite', transmission: 'boite', puissance: 'puissance', ch: 'puissance', cv: 'cvFiscaux', 'cv fiscaux': 'cvFiscaux',
  'chevaux fiscaux': 'cvFiscaux', couleur: 'couleur', prix: 'prix', 'prix affiche': 'prix', garantie: 'garantie', site: 'site', localisation: 'site',
  equipements: 'equipements', options: 'equipements', statut: 'statut', infos: 'infos', informations: 'infos', commentaire: 'infos', 'dernier ct': 'dernierCT',
}
const STATUTS: Record<string, VehicleStatus> = { disponible: 'disponible', reserve: 'reserve', vendu: 'vendu', 'en preparation': 'preparation', preparation: 'preparation', indisponible: 'indisponible' }
const NUMS: (keyof Vehicle)[] = ['annee', 'km', 'puissance', 'cvFiscaux', 'prix']

export interface CsvImport { vehicles: Partial<Vehicle>[]; erreurs: string[]; colonnesIgnorees: string[] }
export function vehiclesFromCsv(text: string): CsvImport {
  const rows = parseCsv(text)
  if (rows.length < 2) return { vehicles: [], erreurs: ['Fichier vide ou sans ligne de données.'], colonnesIgnorees: [] }
  const header = rows[0].map((h) => norm(h).replace(/[_.]/g, ' '))
  const map = header.map((h) => COLS[h])
  const colonnesIgnorees = rows[0].filter((_, i) => !map[i] && header[i])
  if (!map.includes('marque') || !map.includes('modele')) return { vehicles: [], erreurs: ['Colonnes « marque » et « modele » introuvables dans l’en-tête.'], colonnesIgnorees }
  const vehicles: Partial<Vehicle>[] = []
  const erreurs: string[] = []
  rows.slice(1).forEach((r, idx) => {
    const v: Record<string, unknown> = {}
    map.forEach((k, i) => {
      const raw = (r[i] ?? '').trim()
      if (!k || raw === '') return
      if (NUMS.includes(k)) {
        const n = num(raw.replace(/[^\d,.-]/g, ''))
        if (n > 0) v[k] = k === 'prix' ? n : Math.round(n)
      } else if (k === 'statut') v[k] = STATUTS[norm(raw)] ?? 'a_verifier'
      else if (k === 'dernierCT') { if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) v[k] = raw; else { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw); if (m) v[k] = `${m[3]}-${m[2]}-${m[1]}` } }
      else v[k] = raw
    })
    if (!v.marque || !v.modele) { erreurs.push(`Ligne ${idx + 2} ignorée : marque ou modèle manquant.`); return }
    if (!v.statut) v.statut = 'disponible'
    vehicles.push(v as Partial<Vehicle>)
  })
  return { vehicles, erreurs, colonnesIgnorees }
}

export const VEHICLE_HEADERS = ['ref', 'marque', 'modele', 'version', 'categorie', 'annee', 'km', 'carburant', 'boite', 'puissance', 'cv fiscaux', 'couleur', 'prix', 'garantie', 'site', 'equipements', 'statut', 'dernier ct', 'infos']
export const vehiclesToCsv = (vs: Vehicle[]) =>
  toCsv(VEHICLE_HEADERS, vs.map((v) => [v.ref, v.marque, v.modele, v.version, v.categorie, v.annee, v.km, v.carburant, v.boite, v.puissance, v.cvFiscaux, v.couleur, v.prix, v.garantie, v.site, v.equipements, v.statut, v.dernierCT, v.infos]))
