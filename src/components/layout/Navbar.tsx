import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Users, Eye, MessageSquare, Swords, Settings, Dice6, Wifi, Radio } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { QuickDicePanel } from '../ui/DiceRoller'
import { useSessionStore } from '../../store/useSessionStore'
import { useSettingsStore } from '../../store/useSettingsStore'

const NAV_ITEMS_GARDIEN = [
  { path: '/', icon: BookOpen, label: 'Bibliothèque' },
  { path: '/characters', icon: Users, label: 'Personnages' },
  { path: '/keeper', icon: Eye, label: 'Gardien' },
  { path: '/ai', icon: MessageSquare, label: 'IA' },
  { path: '/sessions', icon: Swords, label: 'Sessions' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
]

const NAV_ITEMS_INVESTIGATEUR = [
  { path: '/', icon: BookOpen, label: 'Bibliothèque' },
  { path: '/characters', icon: Users, label: 'Personnages' },
  { path: '/session-live', icon: Radio, label: 'Session' },
  { path: '/ai', icon: MessageSquare, label: 'IA' },
  { path: '/sessions', icon: Swords, label: 'Notes' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
]

export function Navbar() {
  const { pathname } = useLocation()
  const [diceOpen, setDiceOpen] = useState(false)
  const sessionConnected = useSessionStore(s => s.connected)
  const appRole = useSettingsStore(s => s.appRole)
  const NAV_ITEMS = appRole === 'gardien' ? NAV_ITEMS_GARDIEN : NAV_ITEMS_INVESTIGATEUR

  return (
    <>
      <nav
        className="shrink-0 flex items-center justify-between px-2"
        style={{
          background: '#1a0a00',
          borderBottom: '1px solid #3d1a08',
          height: '52px',
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 px-2 shrink-0">
          <span className="text-lg text-glow" style={{ color: '#c8972a' }}>🐙</span>
          <span className="hidden sm:block text-sm font-semibold tracking-wider" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
            CthulhuMate
          </span>
        </Link>

        {/* Nav items */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = pathname === path || (path !== '/' && pathname.startsWith(path))
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0"
                style={{
                  background: active ? '#231008' : 'transparent',
                  color: active ? '#c8972a' : '#5a4535',
                  borderBottom: active ? '2px solid #c8972a' : '2px solid transparent',
                }}
              >
                <Icon size={18} />
                <span className="text-xs hidden md:block">{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Session indicator */}
        {sessionConnected && (
          <div className="flex items-center gap-1 px-2 shrink-0" title="Session active">
            <Wifi size={14} style={{ color: '#27ae60' }} />
          </div>
        )}

        {/* Quick dice */}
        <button
          onClick={() => setDiceOpen(true)}
          className="p-2 rounded-lg shrink-0 transition-all"
          style={{ color: '#5a4535' }}
          title="Dés rapides"
        >
          <Dice6 size={20} />
        </button>
      </nav>

      <Modal open={diceOpen} onClose={() => setDiceOpen(false)} title="Lanceur de dés">
        <QuickDicePanel />
      </Modal>
    </>
  )
}
