// Lecture minimale d'un classeur Excel (.xlsx) : première feuille, valeurs affichées en texte.
// Un .xlsx est une archive ZIP de fichiers XML ; aucune formule n'est recalculée, aucune macro n'est lue.
import { strFromU8, unzipSync } from 'fflate'

const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&')
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join('')
const colIndex = (ref: string) => { let n = 0; for (const ch of ref.replace(/\d/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1 }

export function xlsxToRows(data: Uint8Array): string[][] {
  let files: Record<string, Uint8Array>
  try { files = unzipSync(data) } catch { throw new Error('Fichier Excel illisible (seul le format .xlsx est pris en charge, pas l’ancien .xls).') }
  const sheetName = Object.keys(files).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))[0]
  if (!sheetName) throw new Error('Aucune feuille trouvée dans ce classeur.')
  const shared = files['xl/sharedStrings.xml'] ? [...strFromU8(files['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1])) : []
  const rows: string[][] = []
  for (const r of strFromU8(files[sheetName]).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = []
    for (const c of r[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+)\d+"/.exec(c[1])?.[1]
      const type = /t="(\w+)"/.exec(c[1])?.[1]
      const body = c[2] ?? ''
      const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1]
      const val = type === 's' ? shared[+(v ?? -1)] ?? '' : type === 'inlineStr' ? texts(body) : decode(v ?? '')
      row[ref ? colIndex(ref) : row.length] = val
    }
    const filled = Array.from(row, (x) => x ?? '')
    if (filled.some((x) => x.trim() !== '')) rows.push(filled)
  }
  return rows
}
