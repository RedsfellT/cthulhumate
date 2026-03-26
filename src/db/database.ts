import Dexie, { type EntityTable } from 'dexie'

export type Period = 'classique' | 'moderne'
export type PdfCategory = 'regles' | 'scenarios' | 'aides-de-jeu' | 'cartes' | 'campagnes' | 'bestiaire' | 'personnages' | 'autre'

// ── Skill ────────────────────────────────────────────────────
export interface SkillData {
  base: number       // valeur de base officielle
  value: number      // valeur actuelle du personnage
  checked: boolean   // cercle d'expérience coché
  custom?: boolean   // compétence personnalisée
}

// ── Weapon ───────────────────────────────────────────────────
export interface Weapon {
  name: string
  ord: string   // jet ordinaire
  maj: string   // jet majeur (½)
  ext: string   // jet extrême (⅕)
  degats: string
  portee: string
  cad: string   // cadence
  cap: string   // capacité
  panne: string
}

// ── Ami investigateur ────────────────────────────────────────
export interface AmiInvestigateur {
  nom: string
  joueur: string
  scenario: string
}

// ── Character ────────────────────────────────────────────────
export interface Character {
  id?: number
  period: Period

  // État civil
  name: string
  player: string
  campaign: string
  occupation: string
  age: number
  sex: string
  birthplace: string
  residence: string

  // Caractéristiques (valeur brute 1-99)
  str: number   // FOR
  dex: number   // DEX
  pow: number   // POU
  con: number   // CON
  app: number   // APP
  edu: number   // ÉDU
  siz: number   // TAI
  int: number   // INT
  mov: number   // MVT

  // Combat dérivé
  impact: string    // bonus dégâts
  carrure: number   // carrure
  esquiveBase: number // DEX/2

  // Points de vie
  pvMax: number
  pvBlessureGrave: number   // seuil blessure grave (pvMax/2)
  pvCrossed: number[]       // numéros barrés (0-20)

  // Points de magie
  pmMax: number
  pmCrossed: number[]       // numéros barrés (0-24)

  // Santé mentale
  sanInitial: number
  sanMax: number
  sanFolieTemp: number
  sanFoliePercist: number
  sanCrossed: number[]      // 1-100 barrés

  // Chance
  chance: number
  chanceCrossed: number[]   // 1-100 barrés

  // Compétences
  skills: Record<string, SkillData>

  // Armes
  weapons: Weapon[]

  // Profil (page 2)
  description: string
  ideologie: string
  personnesImportantes: string
  lieuxSignificatifs: string
  biensPrecieux: string
  traits: string
  sequellesCicatrices: string
  phobiesManies: string
  ouvragesOccultes: string
  rencontresEntites: string

  // Équipement & richesse
  equipmentLines: string[]
  depensesCourantes: string
  especes: string
  capital: string

  // Amis investigateurs
  amis: AmiInvestigateur[]

  // Notes libres
  notes: string

  // Portrait
  portrait?: Blob

  createdAt: Date
  updatedAt: Date
}

// ── PDF Document ─────────────────────────────────────────────
export interface PdfDocument {
  id?: number
  name: string
  category: PdfCategory
  campaign?: string
  tags: string[]
  blob: Blob
  size: number
  pageCount?: number
  textContent?: string
  addedAt: Date
  lastOpenedAt?: Date
  thumbnail?: Blob
}

// ── Session Note ─────────────────────────────────────────────
export interface SessionNote {
  id?: number
  campaign: string
  sessionNumber: number
  date: Date
  title: string
  content: string
  tags: string[]
  createdAt: Date
}

// ── Handout (session LAN) ─────────────────────────────────────
export interface Handout {
  id: string   // UUID
  title: string
  type: 'image' | 'text'
  data: string // base64 data URL ou texte brut
  createdAt: Date
}

// ── App Settings ─────────────────────────────────────────────
export interface AppSettings {
  id?: number
  key: string
  value: string
}

// ── Category meta ────────────────────────────────────────────
export const CATEGORY_LABELS: Record<PdfCategory, string> = {
  'regles': 'Règles', 'scenarios': 'Scénarios', 'aides-de-jeu': 'Aides de jeu',
  'cartes': 'Cartes', 'campagnes': 'Campagnes', 'bestiaire': 'Bestiaire',
  'personnages': 'Personnages', 'autre': 'Autre',
}
export const CATEGORY_ICONS: Record<PdfCategory, string> = {
  'regles': '📖', 'scenarios': '🎭', 'aides-de-jeu': '🗺️', 'cartes': '🗾',
  'campagnes': '📜', 'bestiaire': '🐙', 'personnages': '👤', 'autre': '📄',
}

// ── Skill definitions ────────────────────────────────────────
// Format: [displayName, baseValue, isCustomSlot]
export interface SkillDef {
  key: string        // internal key
  label: string      // display label
  base: number
  special?: string   // e.g. "DEX/2" or "ÉDU"
}

const COMMON_SKILLS: SkillDef[] = [
  { key: 'anthropologie', label: 'Anthropologie', base: 1 },
  { key: 'archeologie', label: 'Archéologie', base: 1 },
  { key: 'arts_metiers', label: 'Arts et métiers', base: 5 },
  { key: 'arts_metiers_1', label: '', base: 5, special: 'custom' },
  { key: 'arts_metiers_2', label: '', base: 5, special: 'custom' },
  { key: 'arts_metiers_3', label: '', base: 5, special: 'custom' },
  { key: 'baratin', label: 'Baratin', base: 5 },
  { key: 'bibliotheque', label: 'Bibliothèque', base: 20 },
  { key: 'charme', label: 'Charme', base: 15 },
  { key: 'combat_dist_poing', label: 'Combat à distance (armes de poing)', base: 20 },
  { key: 'combat_dist_fusil', label: 'Combat à distance (fusils)', base: 25 },
  { key: 'combat_dist_1', label: '', base: 0, special: 'custom' },
  { key: 'combat_dist_2', label: '', base: 0, special: 'custom' },
  { key: 'combat_rapp_corps', label: 'Combat rapproché (corps à corps)', base: 25 },
  { key: 'combat_rapp_1', label: '', base: 0, special: 'custom' },
  { key: 'combat_rapp_2', label: '', base: 0, special: 'custom' },
  { key: 'comptabilite', label: 'Comptabilité', base: 5 },
  { key: 'conduite', label: 'Conduite', base: 20 },
  { key: 'conduite_engin', label: 'Conduite engin lourd', base: 1 },
  { key: 'credit', label: 'Crédit', base: 0 },
  { key: 'crochetage', label: 'Crochetage', base: 1 },
  { key: 'discretion', label: 'Discrétion', base: 20 },
  { key: 'droit', label: 'Droit', base: 5 },
  { key: 'ecouter', label: 'Écouter', base: 20 },
  { key: 'electricite', label: 'Électricité', base: 10 },
  { key: 'equitation', label: 'Équitation', base: 5 },
  { key: 'esquive', label: 'Esquive', base: 0, special: 'DEX/2' },
  { key: 'estimation', label: 'Estimation', base: 5 },
  { key: 'grimper', label: 'Grimper', base: 20 },
  { key: 'histoire', label: 'Histoire', base: 5 },
  { key: 'imposture', label: 'Imposture', base: 5 },
  { key: 'intimidation', label: 'Intimidation', base: 15 },
  { key: 'lancer', label: 'Lancer', base: 20 },
  { key: 'langue_maternelle', label: 'Langue maternelle', base: 0, special: 'ÉDU' },
  { key: 'langue_1', label: '', base: 1, special: 'custom' },
  { key: 'langue_2', label: '', base: 1, special: 'custom' },
  { key: 'langue_3', label: '', base: 1, special: 'custom' },
  { key: 'mecanique', label: 'Mécanique', base: 10 },
  { key: 'medecine', label: 'Médecine', base: 1 },
  { key: 'mythe_cthulhu', label: 'Mythe de Cthulhu', base: 0 },
  { key: 'nager', label: 'Nager', base: 20 },
  { key: 'naturalisme', label: 'Naturalisme', base: 10 },
  { key: 'occultisme', label: 'Occultisme', base: 5 },
  { key: 'orientation', label: 'Orientation', base: 10 },
  { key: 'persuasion', label: 'Persuasion', base: 10 },
  { key: 'pickpocket', label: 'Pickpocket', base: 10 },
  { key: 'pilotage', label: 'Pilotage', base: 1 },
  { key: 'pilotage_custom', label: '', base: 1, special: 'custom' },
  { key: 'pister', label: 'Pister', base: 10 },
  { key: 'plongee', label: 'Plongée', base: 1 },
  { key: 'premiers_soins', label: 'Premiers soins', base: 30 },
  { key: 'psychanalyse', label: 'Psychanalyse', base: 1 },
  { key: 'psychologie', label: 'Psychologie', base: 10 },
  { key: 'sauter', label: 'Sauter', base: 20 },
  { key: 'sciences', label: 'Sciences', base: 1 },
  { key: 'sciences_1', label: '', base: 1, special: 'custom' },
  { key: 'sciences_2', label: '', base: 1, special: 'custom' },
  { key: 'sciences_3', label: '', base: 1, special: 'custom' },
  { key: 'survie', label: 'Survie', base: 10 },
  { key: 'survie_custom', label: '', base: 10, special: 'custom' },
  { key: 'trouver_objet', label: 'Trouver Objet Caché', base: 25 },
  { key: 'custom_1', label: '', base: 0, special: 'custom' },
  { key: 'custom_2', label: '', base: 0, special: 'custom' },
  { key: 'custom_3', label: '', base: 0, special: 'custom' },
]

const MODERNE_ONLY: SkillDef[] = [
  { key: 'electronique', label: 'Électronique', base: 1 },
  { key: 'informatique', label: 'Informatique', base: 5 },
]

export function getSkillDefs(period: Period): SkillDef[] {
  const skills = [...COMMON_SKILLS]
  if (period === 'moderne') {
    // Insert after électricité
    const idx = skills.findIndex(s => s.key === 'equitation')
    skills.splice(idx, 0, ...MODERNE_ONLY)
    // Add one more custom at end
    skills.push({ key: 'custom_4', label: '', base: 0, special: 'custom' })
  } else {
    skills.push(
      { key: 'custom_4', label: '', base: 0, special: 'custom' },
      { key: 'custom_5', label: '', base: 0, special: 'custom' },
    )
  }
  return skills
}

export function buildDefaultSkills(period: Period, edu: number, dex: number): Record<string, SkillData> {
  const defs = getSkillDefs(period)
  const result: Record<string, SkillData> = {}
  for (const def of defs) {
    let base = def.base
    if (def.special === 'ÉDU') base = edu
    if (def.special === 'DEX/2') base = Math.floor(dex / 2)
    result[def.key] = { base, value: base, checked: false, custom: def.special === 'custom' }
  }
  return result
}

export function newCharacter(period: Period = 'classique'): Omit<Character, 'id'> {
  const edu = 60, dex = 50
  return {
    period,
    name: 'Nouvel Investigateur',
    player: '', campaign: '', occupation: '',
    age: 25, sex: '', birthplace: '', residence: '',
    str: 50, dex, pow: 50, con: 50, app: 50, edu, siz: 50, int: 50, mov: 8,
    impact: '0', carrure: 0, esquiveBase: Math.floor(dex / 2),
    pvMax: 10, pvBlessureGrave: 5, pvCrossed: [],
    pmMax: 10, pmCrossed: [],
    sanInitial: 50, sanMax: 99, sanFolieTemp: 0, sanFoliePercist: 0, sanCrossed: [],
    chance: 50, chanceCrossed: [],
    skills: buildDefaultSkills(period, edu, dex),
    weapons: [{ name: 'Corps à corps', ord: '25', maj: '12', ext: '5', degats: '1d3+Imp.', portee: '-', cad: '1', cap: '-', panne: '-' }],
    description: '', ideologie: '', personnesImportantes: '', lieuxSignificatifs: '',
    biensPrecieux: '', traits: '', sequellesCicatrices: '', phobiesManies: '',
    ouvragesOccultes: '', rencontresEntites: '',
    equipmentLines: Array(14).fill(''),
    depensesCourantes: '', especes: '', capital: '',
    amis: [
      { nom: '', joueur: '', scenario: '' },
      { nom: '', joueur: '', scenario: '' },
      { nom: '', joueur: '', scenario: '' },
      { nom: '', joueur: '', scenario: '' },
    ],
    notes: '',
    createdAt: new Date(), updatedAt: new Date(),
  }
}

// ── Database ─────────────────────────────────────────────────
class CthulhuDatabase extends Dexie {
  pdfs!: EntityTable<PdfDocument, 'id'>
  characters!: EntityTable<Character, 'id'>
  sessions!: EntityTable<SessionNote, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  handouts!: Dexie.Table<Handout, string>

  constructor() {
    super('CthulhuMateDB')
    this.version(2).stores({
      pdfs: '++id, name, category, campaign, addedAt',
      characters: '++id, name, player, campaign, period, updatedAt',
      sessions: '++id, campaign, sessionNumber, date',
      settings: '++id, &key',
    })
    this.version(3).stores({
      pdfs: '++id, name, category, campaign, addedAt',
      characters: '++id, name, player, campaign, period, updatedAt',
      sessions: '++id, campaign, sessionNumber, date',
      settings: '++id, &key',
      handouts: 'id, title, type, createdAt',
    })
  }
}

export const db = new CthulhuDatabase()

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.settings.where('key').equals(key).first()
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first()
  if (existing?.id) await db.settings.update(existing.id, { value })
  else await db.settings.add({ key, value })
}
