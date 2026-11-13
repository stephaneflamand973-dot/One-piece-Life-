import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../src/lib/defaults'
import { addDays, atTime, dayKey, diffDays, fromLocalInput, toLocalInput, today, weekday } from '../src/lib/dates'
import type { Client, Sale, Vehicle } from '../src/lib/types'
import { carteGrise, computePriorities, conversions, estimateCommission, freeSlots, matchVehicle, mensualiteIndicative, monthMoney, quoteTotals, ratioText, saleMonth, simulate } from '../src/services/logic'
import { parseCsv, vehiclesFromCsv, vehiclesToCsv } from '../src/services/csv'
import { validateBackup } from '../src/services/backup'
import { renderTemplate, waLink, waNumber } from '../src/services/whatsapp'

const s = defaultSettings()
const client = (p: Partial<Client>): Client => ({ id: 'c1', ref: 'C-1', nom: 'Test', statut: 'contact', recherche: {}, importance: 2, consentement: { tel: true, whatsapp: true, email: true, nePasContacter: false }, createdAt: new Date().toISOString(), updatedAt: '', ...p })
const veh = (p: Partial<Vehicle>): Vehicle => ({ id: 'v1', ref: 'V-1', marque: 'Renault', modele: 'Clio', statut: 'disponible', createdAt: new Date().toISOString(), updatedAt: '', ...p })

describe('dates (fuseau America/Martinique)', () => {
  it('convertit une heure locale en instant UTC (UTC−4) et inversement', () => {
    expect(fromLocalInput('2026-11-12T09:00')).toBe('2026-11-12T13:00:00.000Z')
    expect(toLocalInput('2026-11-12T13:00:00.000Z')).toBe('2026-11-12T09:00')
    expect(atTime('2026-11-12', '17:30')).toBe('2026-11-12T21:30:00.000Z')
  })
  it('rattache un instant au bon jour local', () => {
    expect(dayKey('2026-11-13T02:00:00.000Z')).toBe('2026-11-12') // 22 h la veille en Martinique
  })
  it('calcule les écarts et les jours', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(diffDays('2026-11-15', '2026-11-12')).toBe(3)
    expect(weekday('2026-11-12')).toBe(3) // jeudi
  })
  it('refuse une date invalide', () => {
    expect(fromLocalInput('n’importe quoi')).toBeUndefined()
    expect(dayKey('pas une date')).toBe('')
  })
})

describe('devis', () => {
  it('applique la règle déclarée de carte grise : 13,76 + CV × 53', () => {
    expect(carteGrise(5, s.tarifs)).toBe(278.76)
    expect(carteGrise(7, s.tarifs)).toBe(384.76)
    expect(carteGrise(0, s.tarifs)).toBe(0)
  })
  it('calcule le total, la reprise et le reste à financer', () => {
    const t = quoteTotals({ prix: 14490, fraisDossier: 200, carteGrise: 278.76, remise: 500, reprise: 3000, autresFrais: [{ label: 'Plaques', montant: 40 }], financement: { apport: 2000 } })
    expect(t.prixRemise).toBe(13990)
    expect(t.frais).toBe(518.76)
    expect(t.total).toBe(14508.76)
    expect(t.apresReprise).toBe(11508.76)
    expect(t.resteAFinancer).toBe(9508.76)
  })
  it('tolère les valeurs manquantes', () => {
    const t = quoteTotals({ prix: 10000, fraisDossier: 0, carteGrise: 0, remise: 0, reprise: 0, autresFrais: [], financement: {} })
    expect(t.total).toBe(10000)
    expect(t.resteAFinancer).toBe(10000)
  })
  it('mensualité indicative', () => {
    expect(mensualiteIndicative(12000, 0, 48)).toBe(250)
    expect(mensualiteIndicative(10000, 6, 60)).toBe(193.33)
    expect(mensualiteIndicative(0, 5, 48)).toBeNull()
  })
})

describe('correspondance véhicule ↔ prospect', () => {
  const c = client({ recherche: { modele: 'Clio', boite: 'Automatique', budgetMax: 15000 } })
  it('trouve la Clio automatique sous le budget et explique pourquoi', () => {
    const m = matchVehicle(c, veh({ boite: 'Automatique', prix: 14490 }))!
    expect(m).not.toBeNull()
    expect(m.raisons.join(' ')).toContain('Modèle Clio')
    expect(m.raisons.join(' ')).toContain('budget')
  })
  it('écarte une boîte manuelle ou un prix nettement au-dessus du budget', () => {
    expect(matchVehicle(c, veh({ boite: 'Manuelle', prix: 14000 }))).toBeNull()
    expect(matchVehicle(c, veh({ boite: 'Automatique', prix: 18000 }))).toBeNull()
  })
  it('n’invente rien quand la donnée manque : signale l’écart', () => {
    const m = matchVehicle(c, veh({ boite: 'Automatique' }))!
    expect(m.ecarts).toContain('Prix non renseigné sur la fiche')
  })
  it('ne propose rien sans critère', () => {
    expect(matchVehicle(client({}), veh({ prix: 10000 }))).toBeNull()
  })
})

const sale = (p: Partial<Sale>): Sale => ({ id: 's' + Math.random(), ref: 'VT-1', clientId: 'c1', vehiculeLabel: 'Renault Clio', prixVente: 15000, remise: 0, reprise: 0, financementType: 'Comptant', paiement: 'attente', statut: 'confirmee', commission: {}, steps: [], documents: [], createdAt: '', updatedAt: '', dateBC: '2026-11-02', dateConfirmation: '2026-11-03', ...p })

describe('commissions', () => {
  it('ne produit aucune estimation sans barème', () => {
    expect(estimateCommission(sale({}), s).estime).toBeUndefined()
    expect(simulate(10, s, 15000)).toBeNull()
  })
  const sb = defaultSettings()
  sb.commission.regles = [
    { id: 'a', label: 'Base', type: 'par_vente', montant: 150, actif: true },
    { id: 'b', label: 'Prime financement', type: 'par_vente', montant: 80, conditionFinancement: 'Crédit', actif: true },
    { id: 'c', label: 'Inactive', type: 'par_vente', montant: 999, actif: false },
  ]
  sb.commission.remise = { actif: true, seuil: 500, penalite: 50 }
  sb.commission.paliers = [{ ventesMin: 10, bonus: 300 }]
  it('cumule les règles applicables', () => {
    expect(estimateCommission(sale({}), sb).estime).toBe(150)
    expect(estimateCommission(sale({ financementType: 'Crédit' }), sb).estime).toBe(230)
  })
  it('applique la règle de remise configurée', () => {
    expect(estimateCommission(sale({ remise: 500 }), sb).estime).toBe(100)
    expect(estimateCommission(sale({ remise: 200 }), sb).estime).toBe(150)
  })
  it('simule le revenu brut avec palier', () => {
    expect(simulate(8, sb, 15000)).toBe(750 + 8 * 150)
    expect(simulate(10, sb, 15000)).toBe(750 + 1500 + 300)
  })
  it('ne compte une vente qu’une fois, dans le mois de sa confirmation, et jamais une vente annulée', () => {
    const list = [sale({ commission: { estime: 150 } }), sale({ statut: 'bc_signe', dateConfirmation: undefined }), sale({ statut: 'annule' }), sale({ statut: 'livre', commission: { estime: 150, verse: 150 } })]
    expect(list.map((x) => saleMonth(x, sb))).toEqual(['2026-11', null, null, '2026-11'])
    const m = monthMoney(list, '2026-11', sb)
    expect(m.ventes).toBe(2)
    expect(m.estime).toBe(300)
    expect(m.verse).toBe(150)
    expect(m.enAttente).toBe(150)
  })
})

describe('priorités du tableau de bord', () => {
  const base = { interactions: [], quotes: [], sales: [], interventions: [], vehicles: [], settings: s }
  it('place un lead en souffrance devant une relance du jour', () => {
    const now = Date.now()
    const lead = client({ id: 'lead', leadRecuLe: new Date(now - 3 * 3600e3).toISOString(), statut: 'nouveau' })
    const autre = client({ id: 'autre' })
    const p = computePriorities({ ...base, clients: [lead, autre], tasks: [{ id: 't1', type: 'relance', titre: 'Relance', clientId: 'autre', due: new Date(now + 600e3).toISOString(), statut: 'ouverte', priorite: 2, createdAt: '' }, { id: 't0', type: 'appel', titre: 'x', clientId: 'lead', due: new Date(now).toISOString(), statut: 'faite', priorite: 2, createdAt: '' }], now })
    expect(p[0].kind).toBe('lead')
    expect(p[0].raison).toContain('dépassé')
  })
  it('signale une opportunité active sans prochaine action, sauf si reportée', () => {
    const c = client({})
    expect(computePriorities({ ...base, clients: [c], tasks: [] })[0].kind).toBe('sans_action')
    const s2 = defaultSettings()
    s2.snoozes['sans_action:c1'] = new Date(Date.now() + 86400e3).toISOString()
    expect(computePriorities({ ...base, settings: s2, clients: [c], tasks: [] })).toHaveLength(0)
  })
})

describe('statistiques', () => {
  it('affiche « données insuffisantes » sous le seuil', () => {
    const r = conversions('2020-01', '2099-12', { clients: [client({})], tasks: [], interactions: [], quotes: [], sales: [], interventions: [], vehicles: [], settings: s })
    expect(r[0].den).toBe(1)
    expect(ratioText(r[0])).toBe('Données insuffisantes')
    expect(ratioText({ label: '', num: 3, den: 6, libNum: '', libDen: '' })).toBe('50 %')
  })
})

describe('planning', () => {
  it('laisse des créneaux libres hors pause', () => {
    expect(freeSlots([{ debut: 600, fin: 660 }], s.profil)).toEqual([{ debut: 540, fin: 600 }, { debut: 660, fin: 720 }, { debut: 780, fin: 1020 }])
  })
})

describe('import / export CSV', () => {
  it('lit un CSV à point-virgule avec guillemets et accents', () => {
    const r = vehiclesFromCsv('Référence;Marque;Modèle;Prix;Kilométrage;Boîte;Options\nA1;Renault;Clio;"14 490 €";31 500;Automatique;"GPS; caméra"\n;;;;;;\nA2;Dacia;;9990;;;')
    expect(r.vehicles).toHaveLength(1)
    expect(r.vehicles[0]).toMatchObject({ ref: 'A1', marque: 'Renault', modele: 'Clio', prix: 14490, km: 31500, boite: 'Automatique', equipements: 'GPS; caméra' })
    expect(r.erreurs).toHaveLength(1)
  })
  it('refuse un fichier sans les colonnes indispensables', () => {
    expect(vehiclesFromCsv('a,b\n1,2').erreurs[0]).toContain('marque')
    expect(vehiclesFromCsv('').vehicles).toHaveLength(0)
  })
  it('fait l’aller-retour export → import', () => {
    const csv = vehiclesToCsv([veh({ prix: 12000, km: 1000, infos: 'Rayure "portière"; à signaler' })])
    const back = vehiclesFromCsv(csv).vehicles[0]
    expect(back).toMatchObject({ ref: 'V-1', marque: 'Renault', modele: 'Clio', prix: 12000, infos: 'Rayure "portière"; à signaler' })
    expect(parseCsv('a,b\r\n"x,1",2')).toEqual([['a', 'b'], ['x,1', '2']])
  })
})

describe('sauvegarde', () => {
  it('rejette un fichier corrompu ou étranger', () => {
    expect(() => validateBackup(null)).toThrow()
    expect(() => validateBackup({ app: 'autre' })).toThrow(/Format non reconnu/)
    expect(() => validateBackup({ app: 'vo-pilot', format: 1, tables: { clients: 'x' } })).toThrow(/corrompue/)
    expect(() => validateBackup({ app: 'vo-pilot', format: 1, tables: { clients: [{ nom: 'sans id' }] } })).toThrow(/identifiant/)
  })
  it('accepte une sauvegarde valide', () => {
    expect(validateBackup({ app: 'vo-pilot', format: 1, tables: { clients: [{ id: 'a' }] } }).resume.clients).toBe(1)
  })
})

describe('WhatsApp', () => {
  it('remplit les variables connues et laisse visibles celles qui manquent', () => {
    const txt = renderTemplate('Bonjour {prenom}, {modele} à {prix}, garantie {garantie}.', { client: client({ prenom: 'Léa' }), vehicle: veh({ prix: 14490 }), settings: s })
    expect(txt).toContain('Bonjour Léa, Renault Clio à 14')
    expect(txt).toContain('garantie [garantie]')
  })
  it('construit un lien wa.me au format international', () => {
    expect(waNumber('0696 12 34 56')).toBe('596696123456')
    expect(waNumber('+33 6 12 34 56 78')).toBe('33612345678')
    expect(waNumber('')).toBeNull()
    expect(waLink('0696123456', 'Bonjour à vous')).toBe('https://wa.me/596696123456?text=Bonjour%20%C3%A0%20vous')
  })
})
void today
