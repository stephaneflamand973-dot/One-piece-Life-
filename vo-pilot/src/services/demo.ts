// Données de démonstration FICTIVES, toutes marquées « demo » et supprimables en un geste.
import { db, saveSettings } from '../lib/db'
import { addDays, atTime, today } from '../lib/dates'
import { addInteraction, createSale, markQuoteSent, newQuoteDraft, saveClient, saveIntervention, saveQuote, saveTask, saveVehicle, setStep } from './actions'
import { runAutomations } from './automations'

export async function loadDemo() {
  const t = today()
  const d = (n: number, h = '10:00') => atTime(addDays(t, n), h)
  const V = async (v: Parameters<typeof saveVehicle>[0]) => (await saveVehicle(v, { demo: true })).vehicle
  const clio = await V({ ref: 'DEMO-001', marque: 'Renault', modele: 'Clio', version: 'V TCe 90 Evolution', categorie: 'Citadine', annee: 2022, km: 31500, carburant: 'Essence', boite: 'Automatique', puissance: 90, cvFiscaux: 5, couleur: 'Gris', prix: 14490, garantie: '12 mois', site: 'Lareinty', equipements: 'Caméra de recul, CarPlay, Régulateur', dernierCT: addDays(t, -40) })
  const captur = await V({ ref: 'DEMO-002', marque: 'Renault', modele: 'Captur', version: 'TCe 100 Zen', categorie: 'SUV', annee: 2021, km: 48200, carburant: 'Essence', boite: 'Manuelle', puissance: 100, cvFiscaux: 5, couleur: 'Bleu', prix: 16990, garantie: '12 mois', site: 'Lareinty', equipements: 'GPS, Radar de recul', dernierCT: addDays(t, -250) })
  const arkana = await V({ ref: 'DEMO-003', marque: 'Renault', modele: 'Arkana', version: 'E-Tech 145 Intens', categorie: 'SUV', annee: 2022, km: 39800, carburant: 'Hybride', boite: 'Automatique', puissance: 145, cvFiscaux: 7, couleur: 'Noir', prix: 24900, garantie: '12 mois', site: 'La Lézarde', equipements: 'Caméra de recul, GPS, Sièges chauffants' })
  const sandero = await V({ ref: 'DEMO-004', marque: 'Dacia', modele: 'Sandero', version: 'SCe 65 Essentiel', categorie: 'Citadine', annee: 2020, km: 62300, carburant: 'Essence', boite: 'Manuelle', puissance: 65, cvFiscaux: 4, couleur: 'Blanc', prix: 9990, garantie: '6 mois', site: 'Lareinty', equipements: 'Climatisation, Bluetooth' })
  await V({ ref: 'DEMO-005', marque: 'Dacia', modele: 'Lodgy', version: 'Blue dCi 115 7 places', categorie: 'Monospace', annee: 2019, km: 88400, carburant: 'Diesel', boite: 'Manuelle', puissance: 115, cvFiscaux: 6, couleur: 'Gris', prix: 13490, garantie: '6 mois', site: 'Les Mangles', equipements: '7 places, GPS' })

  const C = (c: Parameters<typeof saveClient>[0], lead = false) => saveClient(c, { demo: true, lead })
  const lea = await C({ nom: 'Exemple', prenom: 'Léa', tel: '0696 00 00 01', source: 'UpYourLeads', site: 'Lareinty', recherche: { modele: 'Clio', boite: 'Automatique', budgetMax: 15000 }, importance: 3 }, true)
  const marc = await C({ nom: 'Fictif', prenom: 'Marc', tel: '0696 00 00 02', source: 'Passage showroom', site: 'Lareinty', recherche: { categorie: 'SUV', budgetMax: 18000 }, usage: 'Trajets quotidiens Fort-de-France', financement: 'Crédit' })
  const nadia = await C({ nom: 'Démo', prenom: 'Nadia', tel: '0696 00 00 03', source: 'WhatsApp', recherche: { modele: 'Sandero', budgetMax: 10500 }, reprise: 'Twingo 2012', importance: 2 })
  const paul = await C({ nom: 'Test', prenom: 'Paul', tel: '0696 00 00 04', source: 'Recommandation', recherche: { modele: 'Arkana', carburant: 'Hybride' }, usage: 'Famille, longs trajets', financement: 'LOA / LLD', importance: 3 })
  const ines = await C({ nom: 'Essai', prenom: 'Inès', tel: '0696 00 00 05', source: 'Appel entrant', recherche: { texte: 'petite citadine économique' } })
  const hugo = await C({ nom: 'Modèle', prenom: 'Hugo', tel: '0696 00 00 06', source: 'Ancien client', recherche: { modele: 'Captur' }, financement: 'Comptant' })

  await addInteraction({ clientId: marc.id, type: 'appel_sortant', resultat: 'Joint', commentaire: 'Cherche un SUV pour le quotidien, budget 18 000 € max.', date: d(-3, '11:00'), demo: true })
  await saveTask({ type: 'rdv', titre: 'Présentation Captur', clientId: marc.id, due: d(0, '15:00'), dureeMin: 45 }, true)
  await addInteraction({ clientId: nadia.id, type: 'whatsapp', resultat: 'Répondu', commentaire: 'Demande des photos de la Sandero.', date: d(-2, '16:00'), demo: true })
  const q = await saveQuote({ ...(await newQuoteDraft(nadia.id, sandero)), reprise: 1500 }, true)
  await markQuoteSent(q.id, d(-4, '17:00'))
  await addInteraction({ clientId: ines.id, type: 'appel_sortant', resultat: 'Sans réponse', date: d(-1, '10:30'), demo: true })
  await saveTask({ type: 'appel', titre: 'Nouvelle tentative d’appel', clientId: ines.id, due: d(-1, '16:00') }, true)
  await saveTask({ type: 'essai', titre: 'Essai Arkana', clientId: paul.id, vehicleId: arkana.id, due: d(1, '10:00'), dureeMin: 45 }, true)
  await addInteraction({ clientId: paul.id, type: 'appel_entrant', resultat: 'Joint', commentaire: 'Hésite entre Arkana et un modèle concurrent.', date: d(-1, '09:30'), demo: true })

  const sale = await createSale({ clientId: hugo.id, vehicleId: captur.id, vehiculeLabel: 'Renault Captur TCe 100 Zen (2021)', prixVente: 16990, remise: 0, reprise: 0, financementType: 'Comptant', dateBC: addDays(t, -6), dateConfirmation: addDays(t, -5), livraisonPrevue: d(2, '14:00'), statut: 'confirmee' }, true)
  await setStep(sale.id, 'nettoyage', { statut: 'terminee' })
  await setStep(sale.id, 'revision', { statut: 'terminee' })
  await saveIntervention({ saleId: sale.id, stepId: 'pneus', type: 'Pneus', prestataire: 'Pneus', statut: 'bloquee', commentaire: 'Pneus commandés, non livrés', demo: true })
  await db.tasks.filter((x) => !x.demo && (x.saleId === sale.id)).modify({ demo: true })
  void lea; void clio
  await saveSettings((s) => { s.demoChargee = true })
  await runAutomations()
}
