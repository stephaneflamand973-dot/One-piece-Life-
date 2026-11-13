// Utilitaires de dates : tout l'affichage se fait dans le fuseau configuré (America/Martinique par défaut).
let TZ = 'America/Martinique'
export function setTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: tz })
    TZ = tz
  } catch {
    TZ = 'America/Martinique'
  }
}
export const getTimeZone = () => TZ

function parts(d: Date) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
  const o: Record<string, string> = {}
  for (const p of f.formatToParts(d)) o[p.type] = p.value
  return o
}

export const isValidDate = (s?: string) => !!s && !Number.isNaN(new Date(s).getTime())
export const nowIso = () => new Date().toISOString()

/** AAAA-MM-JJ dans le fuseau configuré. */
export function dayKey(d: string | Date = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  const p = parts(date)
  return `${p.year}-${p.month}-${p.day}`
}
export const today = () => dayKey(new Date())
export const monthKey = (d: string | Date = new Date()) => dayKey(d).slice(0, 7)

/** Valeur pour <input type="datetime-local"> dans le fuseau configuré. */
export function toLocalInput(iso?: string): string {
  if (!isValidDate(iso)) return ''
  const p = parts(new Date(iso!))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** Convertit « AAAA-MM-JJTHH:mm » (heure locale du fuseau configuré) en instant ISO. */
export function fromLocalInput(local: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local || '')
  if (!m) return undefined
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  const p = parts(new Date(guess))
  const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute)
  const d = new Date(guess - (shown - guess))
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}
export const atTime = (day: string, hhmm: string) => fromLocalInput(`${day}T${hhmm}`)!

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7)
}
export function diffDays(a: string, b: string): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10))
  return Math.round((da - db) / 86400000)
}
/** Lundi = 0 … dimanche = 6 */
export function weekday(day: string): number {
  const [y, m, d] = day.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}
export const startOfWeek = (day: string) => addDays(day, -weekday(day))

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...o })
const fmtUtc = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...o })
const dayToDate = (day: string) => new Date(`${day}T12:00:00Z`)

export function fmtDay(day?: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!day || !/^\d{4}-\d{2}-\d{2}/.test(day)) return '—'
  return fmtUtc(o).format(dayToDate(day.slice(0, 10)))
}
export const fmtDayLong = (day: string) => fmtDay(day, { weekday: 'long', day: 'numeric', month: 'long' })
export const fmtMonth = (month: string) => fmtUtc({ month: 'long', year: 'numeric' }).format(new Date(`${month}-15T12:00:00Z`))
export const fmtMonthShort = (month: string) => fmtUtc({ month: 'short' }).format(new Date(`${month}-15T12:00:00Z`))
export function fmtTime(iso?: string) {
  return isValidDate(iso) ? fmt({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso!)) : '—'
}
export function fmtDateTime(iso?: string) {
  if (!isValidDate(iso)) return '—'
  const k = dayKey(iso!)
  const t = today()
  const hm = fmtTime(iso)
  if (k === t) return `Aujourd’hui ${hm}`
  if (k === addDays(t, 1)) return `Demain ${hm}`
  if (k === addDays(t, -1)) return `Hier ${hm}`
  return `${fmtDay(k, { day: 'numeric', month: 'short' })} ${hm}`
}
/** « dans 35 min », « en retard de 2 j » … */
export function relative(iso?: string, now = Date.now()): string {
  if (!isValidDate(iso)) return ''
  const diff = new Date(iso!).getTime() - now
  const abs = Math.abs(diff)
  const txt = abs < 3600e3 ? `${Math.max(1, Math.round(abs / 60e3))} min` : abs < 48 * 3600e3 ? `${Math.round(abs / 3600e3)} h` : `${Math.round(abs / 86400e3)} j`
  return diff >= 0 ? `dans ${txt}` : `en retard de ${txt}`
}
export const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
