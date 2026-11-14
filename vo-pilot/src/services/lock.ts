// Code d'accès : seule une empreinte (PBKDF2-SHA-256 + sel) est conservée.
// Limite assumée : il empêche l'ouverture de l'application par un tiers, mais ne chiffre pas la base locale.
import { saveSettings } from '../lib/db'
import type { Settings } from '../lib/types'

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b instanceof Uint8Array ? b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) : b)].map((x) => x.toString(16).padStart(2, '0')).join('')
async function derive(code: string, sel: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sel), iterations: 150000 }, key, 256))
}
export const validCode = (code: string) => /^\d{4,8}$/.test(code)
export async function makeLock(code: string): Promise<NonNullable<Settings['verrou']>> {
  if (!validCode(code)) throw new Error('Le code doit comporter 4 à 8 chiffres.')
  const sel = hex(crypto.getRandomValues(new Uint8Array(16)))
  return { sel, hash: await derive(code, sel) }
}
export async function checkLock(code: string, v: NonNullable<Settings['verrou']>): Promise<boolean> {
  return (await derive(code, v.sel)) === v.hash
}
export async function setLock(code: string | null) {
  const v = code === null ? undefined : await makeLock(code)
  await saveSettings((s) => { s.verrou = v })
}
