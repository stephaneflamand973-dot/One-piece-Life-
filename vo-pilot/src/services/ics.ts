import type { Client, Task } from '../lib/types'
import { clientName } from './logic'

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** Fichier ICS (import manuel dans Outlook / Calendrier). Ce n'est PAS une synchronisation. */
export function tasksToIcs(tasks: Task[], clients: Client[]): string {
  const byId = new Map(clients.map((c) => [c.id, c]))
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VO PILOT//FR', 'CALSCALE:GREGORIAN']
  for (const t of tasks) {
    if (!t.due || t.statut !== 'ouverte') continue
    const end = new Date(new Date(t.due).getTime() + (t.dureeMin ?? 30) * 60e3).toISOString()
    const c = t.clientId ? byId.get(t.clientId) : undefined
    lines.push('BEGIN:VEVENT', `UID:${t.id}@vo-pilot`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(t.due)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(`${t.titre}${c ? ` — ${clientName(c)}` : ''}`)}`, 'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Rappel VO PILOT', 'END:VALARM', 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
