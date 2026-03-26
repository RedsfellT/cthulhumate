import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Library } from './pages/Library'
import { Characters } from './pages/Characters'
import { KeeperScreen } from './pages/KeeperScreen'
import { AiAssistant } from './pages/AiAssistant'
import { Sessions } from './pages/Sessions'
import { Settings } from './pages/Settings'
import { RoleSelection } from './pages/RoleSelection'
import { useSettingsStore } from './store/useSettingsStore'
import { useSessionStore } from './store/useSessionStore'

export default function App() {
  const load = useSettingsStore(s => s.load)
  const sessionInit = useSessionStore(s => s.init)
  const { loaded, appRole } = useSettingsStore(s => ({ loaded: s.loaded, appRole: s.appRole }))

  useEffect(() => { load(); sessionInit() }, [])

  // Attendre le chargement des settings avant d'afficher quoi que ce soit
  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: '#0d0500' }}>
        <div style={{ color: '#3d1a08', fontSize: '2rem' }}>🐙</div>
      </div>
    )
  }

  // Pas encore de rôle choisi → écran de sélection
  if (!appRole) {
    return <RoleSelection />
  }

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <Navbar />
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/characters" element={<Characters />} />
            {appRole === 'gardien' && (
              <Route path="/keeper" element={<KeeperScreen />} />
            )}
            <Route path="/ai" element={<AiAssistant />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
