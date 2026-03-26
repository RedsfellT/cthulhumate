import { useState } from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { streamAiResponse } from '../../lib/ai'
import { UserPlus, Copy, RefreshCw } from 'lucide-react'

const ARCHETYPES = [
  'Détective de police', 'Journaliste d\'investigation', 'Médecin de campagne',
  'Antiquaire louche', 'Professeur universitaire', 'Marin taciturne',
  'Pasteur hanté', 'Aristocrate décadent', 'Domestique loyal', 'Cultiste fanatique',
  'Chasseur de primes', 'Aliéniste (psychiatre)', 'Bibliothécaire érudit',
  'Criminel repenti', 'Artiste bohème', 'Immigré mystérieux',
]

const PERIODS = ['Années 1920 (Classique)', 'Époque contemporaine (Moderne)']

export function NpcGenerator() {
  const { aiProvider, openaiKey, anthropicKey, openaiModel, anthropicModel } = useSettingsStore()
  const [archetype, setArchetype] = useState(ARCHETYPES[0])
  const [period, setPeriod] = useState(PERIODS[0])
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  const configured = aiProvider !== 'none' && ((aiProvider === 'openai' && openaiKey) || (aiProvider === 'anthropic' && anthropicKey))

  async function generate() {
    if (!configured) return
    setGenerating(true)
    setResult('')

    const prompt = `Génère un PNJ complet pour L'Appel de Cthulhu V7, ${period}.
Archétype : ${archetype}

Format :
**NOM** : [Prénom Nom, cohérent avec l'époque]
**Âge** : [âge]
**Apparence** : [2-3 phrases visuelles percutantes]
**Personnalité** : [2-3 traits dominants]
**Occupation** : [occupation détaillée]
**Secret** : [secret sombre ou connexion au mythe]
**Accroche** : [comment les investigateurs peuvent le rencontrer]
**Caractéristiques** : FOR xx | DEX xx | POU xx | CON xx | APP xx | ÉDU xx | TAI xx | INT xx | PV x | SAN xx
**Compétences notables** : [3-5 compétences avec valeurs]
**Citation** : "[une phrase typique du personnage]"

Sois créatif, cohérent avec l'univers lovecraftien. Les caractéristiques doivent être réalistes (valeurs 30-80 généralement).`

    try {
      await streamAiResponse(
        aiProvider, openaiKey, anthropicKey, openaiModel, anthropicModel,
        [{ role: 'user', content: prompt }],
        null,
        ({ text, done }) => {
          if (!done) setResult(prev => prev + text)
        }
      )
    } catch (e: any) {
      setResult(`Erreur : ${e?.message}`)
    } finally {
      setGenerating(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2 text-xs" style={{ color: '#c8972a' }}>
        <UserPlus size={14} />
        <span className="font-semibold">Générateur de PNJ</span>
      </div>

      {!configured ? (
        <div className="text-xs p-3 rounded" style={{ background: '#231008', color: '#8a7055' }}>
          Configurez une clé API IA dans Paramètres.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: '#5a4535' }}>Archétype</label>
              <select value={archetype} onChange={e => setArchetype(e.target.value)}
                className="px-2 py-1.5 rounded text-xs outline-none"
                style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}>
                {ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: '#5a4535' }}>Période</label>
              <select value={period} onChange={e => setPeriod(e.target.value)}
                className="px-2 py-1.5 rounded text-xs outline-none"
                style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}>
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <button onClick={generate} disabled={generating}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
            style={{
              background: generating ? '#231008' : 'linear-gradient(135deg, #8b3a0a, #c8972a)',
              color: generating ? '#5a4535' : '#fff',
            }}>
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {generating ? 'Génération…' : 'Générer un PNJ'}
          </button>

          {result && (
            <div className="relative">
              <div
                className="p-3 rounded-lg text-xs whitespace-pre-wrap"
                style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0', maxHeight: 300, overflowY: 'auto' }}>
                {result}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={copy}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{ background: '#231008', color: copied ? '#27ae60' : '#8a7055' }}>
                  <Copy size={10} /> {copied ? 'Copié !' : 'Copier'}
                </button>
                <button onClick={generate}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{ background: '#231008', color: '#8a7055' }}>
                  <RefreshCw size={10} /> Autre
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
