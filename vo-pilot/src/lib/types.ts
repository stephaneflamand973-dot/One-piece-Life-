// Modèle de données de VO PILOT. Les identifiants sont stables (UUID) ; les dates-heures
// sont des instants ISO (UTC) ; les dates seules sont au format AAAA-MM-JJ dans le fuseau configuré.

export type ID = string

export interface Recherche {
  texte?: string
  marque?: string
  modele?: string
  categorie?: string
  budgetMax?: number
  carburant?: string
  boite?: string
  kmMax?: number
  anneeMin?: number
  equipements?: string
}

export interface Consentement {
  tel: boolean
  whatsapp: boolean
  email: boolean
  nePasContacter: boolean
}

export interface Client {
  id: ID
  ref: string
  nom: string
  prenom?: string
  tel?: string
  email?: string
  source?: string
  site?: string
  premierContact?: string // AAAA-MM-JJ
  leadRecuLe?: string // ISO : lead distribué (UpYourLeads), saisi à la main
  leadTraiteLe?: string // ISO : traité DANS VO PILOT uniquement
  statut: string // id d'étape du pipeline
  recherche: Recherche
  reprise?: string
  financement?: string
  usage?: string
  kmAnnuel?: number
  contraintes?: string
  delaiAchat?: string
  commentaires?: string
  importance: 1 | 2 | 3
  consentement: Consentement
  frequenceRelanceJours?: number
  motifPerte?: string
  favori?: boolean
  createdAt: string
  updatedAt: string
  demo?: boolean
}

export type InteractionType =
  | 'appel_sortant' | 'appel_entrant' | 'whatsapp' | 'email' | 'rdv' | 'essai'
  | 'devis' | 'negociation' | 'remarque' | 'statut' | 'lead'

export interface Interaction {
  id: ID
  clientId: ID
  type: InteractionType
  date: string // ISO
  resultat?: string
  commentaire?: string
  de?: string // changement de statut : ancien
  vers?: string // changement de statut : nouveau
  demo?: boolean
}

export type TaskType = 'appel' | 'relance' | 'rdv' | 'essai' | 'livraison' | 'intervention' | 'whatsapp' | 'tache'

export interface Task {
  id: ID
  type: TaskType
  titre: string
  clientId?: ID
  saleId?: ID
  vehicleId?: ID
  due?: string // ISO
  dureeMin?: number
  statut: 'ouverte' | 'faite' | 'annulee'
  priorite: 1 | 2 | 3
  doneAt?: string
  resultat?: string
  autoKey?: string // clé d'idempotence des automatisations
  favori?: boolean
  createdAt: string
  demo?: boolean
}

export type VehicleStatus = 'disponible' | 'reserve' | 'vendu' | 'preparation' | 'indisponible' | 'a_verifier'

export interface Vehicle {
  id: ID
  ref: string
  marque: string
  modele: string
  version?: string
  categorie?: string
  annee?: number
  km?: number
  carburant?: string
  boite?: string
  puissance?: number
  cvFiscaux?: number
  couleur?: string
  prix?: number
  garantie?: string
  site?: string
  equipements?: string
  statut: VehicleStatus
  infos?: string
  dernierCT?: string // AAAA-MM-JJ
  favori?: boolean
  createdAt: string
  updatedAt: string
  demo?: boolean
}

export interface Photo {
  id: ID
  vehicleId: ID
  ordre: number
  label?: string
  data: string // dataURL compressée
}

export interface FraisLigne { label: string; montant: number }

export interface Financement {
  apport?: number
  capital?: number
  dureeMois?: number
  taux?: number
  mensualite?: number
  assurance?: number
  organisme?: string
}

export type QuoteStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'

export interface Quote {
  id: ID
  ref: string
  clientId: ID
  vehicleId?: ID
  vehiculeLabel: string
  prix: number
  fraisDossier: number
  cvFiscaux: number
  carteGrise: number
  remise: number
  reprise: number
  autresFrais: FraisLigne[]
  financement: Financement
  statut: QuoteStatus
  dateCreation: string
  dateEnvoi?: string
  notes?: string
  demo?: boolean
}

export type StepStatus = 'non_necessaire' | 'a_faire' | 'en_cours' | 'attente_tiers' | 'terminee' | 'bloquee'

export interface PrepStep {
  id: string
  label: string
  obligatoire: boolean
  statut: StepStatus
  commentaire?: string
  responsable?: string
  updatedAt?: string
}

export interface SaleDocument {
  id: string
  type: string
  statut: 'manquant' | 'recu' | 'verifie'
  dateReception?: string
  dateExpiration?: string
}

export interface PrepException {
  active: boolean
  interventionRestante: string
  valideePar?: string // personne autorisée ayant validé (saisie)
  infoClient?: string
  accordConserve?: boolean
  rdvRetour?: string // ISO
  resolue?: boolean
}

export type SaleStatus =
  | 'commande_attente' | 'bc_signe' | 'financement_attente' | 'paiement_attente'
  | 'confirmee' | 'preparation' | 'pret' | 'livre' | 'annule'

export interface Commission {
  estime?: number // calculé à partir du barème saisi
  detail?: string[]
  confirme?: number
  verse?: number
  moisVersement?: string // AAAA-MM
}

export interface Sale {
  id: ID
  ref: string
  clientId: ID
  vehicleId?: ID
  quoteId?: ID
  vehiculeLabel: string
  prixVente: number
  remise: number
  reprise: number
  financementType: string
  dateBC?: string // AAAA-MM-JJ
  dateConfirmation?: string
  livraisonPrevue?: string // ISO
  livraisonEffective?: string // AAAA-MM-JJ
  paiement: 'attente' | 'partiel' | 'recu'
  statut: SaleStatus
  notes?: string
  commission: Commission
  steps: PrepStep[]
  documents: SaleDocument[]
  exception?: PrepException
  prochaineAction?: string
  favori?: boolean
  createdAt: string
  updatedAt: string
  demo?: boolean
}

export interface Intervention {
  id: ID
  saleId: ID
  stepId?: string
  type: string
  prestataire?: string
  dateDemande?: string
  datePrevue?: string
  dateReelle?: string
  commentaire?: string
  preuve?: string
  statut: 'demandee' | 'planifiee' | 'en_cours' | 'bloquee' | 'terminee' | 'annulee'
  prochaineRelance?: string
  createdAt: string
  demo?: boolean
}

export interface Note {
  id: ID
  texte: string
  categorie?: string
  linkType?: 'client' | 'vehicle' | 'sale' | 'intervention'
  linkId?: ID
  createdAt: string
  updatedAt: string
  demo?: boolean
}

export interface Alert {
  id: ID
  key: string
  ruleId: string
  titre: string
  detail?: string
  link?: string
  niveau: 'info' | 'urgent' | 'critique'
  createdAt: string
  dismissedAt?: string
}

export interface Revenu {
  id: string // AAAA-MM
  netRecu?: number
  commissionsVersees?: number
  notes?: string
}

export interface AuditEntry {
  id: ID
  date: string
  entite: string
  entiteId: string
  action: string
  avant?: string
  apres?: string
  origine: 'utilisateur' | 'automatisation' | 'import'
}

export interface AutomationRun {
  id: ID
  ruleId: string
  date: string
  message: string
  ok: boolean
}

// ---- Paramètres ----
export interface PipelineStage { id: string; label: string; kind: 'actif' | 'gagne' | 'perdu' | 'dormant'; systeme?: boolean }

export interface CommissionRule {
  id: string
  label: string
  type: 'par_vente' | 'pourcent_prix'
  montant: number
  conditionFinancement?: string
  conditionModele?: string
  prixMin?: number
  prixMax?: number
  actif: boolean
}

export interface WaTemplate { id: string; titre: string; texte: string }
export interface Objection { id: string; theme: string; question: string; reponse: string }

export interface Settings {
  id: 'main'
  version: number
  profil: {
    nom: string
    site: string
    debut: string
    fin: string
    pauseDebut: string
    pauseFin: string
    objectifMensuel: number
    objectifProgression: number
    objectifNet: number
    devise: string
    fuseau: string
    theme: 'auto' | 'clair' | 'sombre'
  }
  sites: string[]
  sources: string[]
  motifsPerte: string[]
  pipeline: PipelineStage[]
  delais: {
    leadMinutes: number
    relanceDevisJours: number
    rappelInjoignableJours: number
    sansInteractionJours: number
    suiviLivraisonJours: number[]
    alerteLivraisonJours: number
    ctMaxMois: number
    relanceDefautJours: number
    conservationMois: number
  }
  tarifs: {
    fraisDossier: number
    cgFixe: number
    cgParCv: number
    remiseMax: number
  }
  commission: {
    fixeBrut: number
    regles: CommissionRule[]
    remise: { actif: boolean; seuil: number; penalite: number }
    paliers: { ventesMin: number; bonus: number }[]
    venteCompteeA: 'bc' | 'confirmation' | 'livraison'
    decalageVersementMois: number
  }
  prep: { etapes: { id: string; label: string; obligatoire: boolean }[]; documents: string[]; prestataires: string[] }
  waTemplates: WaTemplate[]
  objections: Objection[]
  signature: string
  automations: Record<string, { actif: boolean; dernierRun?: string; derniereErreur?: string; dernierMessage?: string }>
  notifications: boolean
  snoozes: Record<string, string> // clé de priorité -> ISO jusqu'à
  historique: { mois: string; ventes: number }[] // références déclarées, hors données de l'application
  raccourcis: string[]
  compteurs: Record<string, number>
  demoChargee?: boolean
  verrou?: { sel: string; hash: string } // code d'accès (empreinte uniquement, jamais le code)
  derniereSauvegarde?: string
}
