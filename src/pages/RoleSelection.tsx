import { useSettingsStore } from '../store/useSettingsStore'

export function RoleSelection() {
  const setAppRole = useSettingsStore(s => s.setAppRole)

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6"
      style={{ background: '#0d0500' }}>

      {/* Logo */}
      <div className="text-center">
        <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 20px #c8972a44)' }}>🐙</div>
        <h1 className="text-2xl font-bold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
          CthulhuMate V7
        </h1>
        <p className="text-sm mt-2" style={{ color: '#5a4535' }}>
          L'Appel de Cthulhu — Éditions Sans Détour
        </p>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ color: '#8a7055' }}>
          Qui es-tu autour de cette table ?
        </p>
        <p className="text-xs" style={{ color: '#3d1a08' }}>
          Ce choix peut être modifié dans les Paramètres
        </p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* Gardien */}
        <button
          onClick={() => setAppRole('gardien')}
          className="w-full rounded-xl p-5 text-left transition-all active:scale-95"
          style={{ background: '#1a0a00', border: '2px solid #c8972a44' }}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl shrink-0">👁️</div>
            <div className="flex-1">
              <div className="font-bold text-base" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
                Gardien des Arcanes
              </div>
              <div className="text-xs mt-1 leading-relaxed" style={{ color: '#5a4535' }}>
                Tu mènes la partie. Accès à l'écran du Gardien, gestion des PNJs, sessions WiFi, ambiances sonores et générateur de PNJs IA.
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Écran MJ', 'Session WiFi', 'Handouts & Cartes', 'Ambiances', 'IA'].map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#231008', color: '#c8972a', border: '1px solid #3d1a08' }}>
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* Investigateur */}
        <button
          onClick={() => setAppRole('investigateur')}
          className="w-full rounded-xl p-5 text-left transition-all active:scale-95"
          style={{ background: '#1a0a00', border: '2px solid #3d1a0844' }}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl shrink-0">🔍</div>
            <div className="flex-1">
              <div className="font-bold text-base" style={{ color: '#e8d5b0', fontFamily: 'Georgia,serif' }}>
                Investigateur
              </div>
              <div className="text-xs mt-1 leading-relaxed" style={{ color: '#5a4535' }}>
                Tu joues un personnage. Accès à ta fiche, la bibliothèque de PDFs, l'assistant IA et les notes de session.
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Fiche de perso', 'Bibliothèque', 'Assistant IA', 'Notes'].map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#1a0a00', color: '#8a7055', border: '1px solid #3d1a08' }}>
                {tag}
              </span>
            ))}
          </div>
        </button>
      </div>

      <p className="text-xs text-center" style={{ color: '#3d1a08' }}>
        Chaque appareil choisit son rôle indépendamment
      </p>
    </div>
  )
}
