import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Library } from './pages/Library'
import { Characters } from './pages/Characters'
import { KeeperScreen } from './pages/KeeperScreen'
import { AiAssistant } from './pages/AiAssistant'
import { Sessions } from './pages/Sessions'
import { Settings } from './pages/Settings'
import { useSettingsStore } from './store/useSettingsStore'
import { useSessionStore } from './store/useSessionStore'
import { PlayerView } from './components/session/PlayerView'

export default function App() {
  const load = useSettingsStore(s => s.load)
  const sessionInit = useSessionStore(s => s.init)

  useEffect(() => { load(); sessionInit() }, [])

  // Player mode: accessed from another device on the local network
  const isPlayerMode = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  if (isPlayerMode) return <PlayerView />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <Navbar />
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/keeper" element={<KeeperScreen />} />
            <Route path="/ai" element={<AiAssistant />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
