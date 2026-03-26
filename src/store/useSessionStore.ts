import { create } from 'zustand'

export type SessionRole = 'keeper' | 'player' | 'none'

export interface DiceLogEntry {
  roller: string
  skill: string
  roll: number
  result: string
  color: string
  timestamp: number
}

export interface MapPin {
  id: string
  x: number  // percentage 0-100
  y: number  // percentage 0-100
  label: string
  color: string
}

export interface ConnectedPlayer {
  name: string
  role: 'keeper' | 'player'
}

interface SessionStore {
  connected: boolean
  role: SessionRole
  playerName: string
  players: ConnectedPlayer[]
  currentHandoutId: string | null
  currentMapId: string | null
  mapPins: MapPin[]
  diceLog: DiceLogEntry[]
  initiative: any[]
  atmosphere: string | null
  serverIP: string | null
  ws: WebSocket | null

  lanHost: string  // IP:port du serveur LAN, ex: "192.168.1.42:3000"
  setLanHost: (h: string) => void

  // Actions
  init: () => Promise<void>
  connect: (name: string, role: SessionRole, host?: string) => void
  disconnect: () => void
  setPlayerName: (n: string) => void

  // Keeper
  showHandout: (id: string) => void
  clearHandout: () => void
  showMap: (id: string, pins?: MapPin[]) => void
  updatePins: (pins: MapPin[]) => void
  sendAtmosphere: (text: string) => void
  updateInitiative: (initiative: any[]) => void

  // Both
  broadcastDice: (entry: Omit<DiceLogEntry, 'roller' | 'timestamp'>) => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  connected: false,
  role: 'none',
  playerName: 'Joueur',
  players: [],
  currentHandoutId: null,
  currentMapId: null,
  mapPins: [],
  diceLog: [],
  initiative: [],
  atmosphere: null,
  serverIP: null,
  ws: null,
  lanHost: localStorage.getItem('cthulhu_lan_host') || '',
  setLanHost: (h) => { set({ lanHost: h }); localStorage.setItem('cthulhu_lan_host', h) },

  init: async () => {
    try {
      const lanHost = get().lanHost
      const url = lanHost ? `https://${lanHost}/api/info` : '/api/info'
      const res = await fetch(url)
      const { ip } = await res.json()
      set({ serverIP: ip })
    } catch {}
  },

  connect: (name: string, role: SessionRole, host?: string) => {
    const existing = get().ws
    if (existing) existing.close()

    // Détermine l'hôte : paramètre > lanHost sauvegardé > hôte actuel
    const targetHost = host || get().lanHost || window.location.host
    // Toujours WSS si on se connecte à un serveur LAN HTTPS, ws si localhost sans https
    const isSecure = targetHost.startsWith('localhost') || targetHost.startsWith('127.')
      ? window.location.protocol === 'https:'
      : true  // le serveur LAN utilise HTTPS
    const protocol = isSecure ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${targetHost}`)

    ws.onopen = () => {
      set({ connected: true, ws, role, playerName: name })
      ws.send(JSON.stringify({ type: 'set_role', role, name }))
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      handleIncoming(msg, set, get)
    }

    ws.onclose = () => set({ connected: false, ws: null })
    ws.onerror = () => set({ connected: false, ws: null })
  },

  disconnect: () => {
    get().ws?.close()
    set({ connected: false, ws: null, role: 'none' })
  },

  setPlayerName: (n) => set({ playerName: n }),

  showHandout: (id) => {
    get().ws?.send(JSON.stringify({ type: 'show_handout', handoutId: id }))
  },
  clearHandout: () => {
    get().ws?.send(JSON.stringify({ type: 'clear_handout' }))
    set({ currentHandoutId: null, currentMapId: null })
  },
  showMap: (id, pins = []) => {
    get().ws?.send(JSON.stringify({ type: 'show_map', handoutId: id, pins }))
  },
  updatePins: (pins) => {
    get().ws?.send(JSON.stringify({ type: 'update_pins', pins }))
    set({ mapPins: pins })
  },
  sendAtmosphere: (text) => {
    get().ws?.send(JSON.stringify({ type: 'atmosphere', text }))
    set({ atmosphere: text })
  },
  updateInitiative: (initiative) => {
    get().ws?.send(JSON.stringify({ type: 'update_initiative', initiative }))
    set({ initiative })
  },
  broadcastDice: (entry) => {
    get().ws?.send(JSON.stringify({ type: 'dice_roll', ...entry }))
  },
}))

function handleIncoming(msg: any, set: any, _get: any) {
  switch (msg.type) {
    case 'session_state':
      set({
        currentHandoutId: msg.state.currentHandoutId,
        currentMapId: msg.state.currentMapId,
        mapPins: msg.state.mapPins || [],
        diceLog: msg.state.diceLog || [],
        initiative: msg.state.initiative || [],
        atmosphere: msg.state.atmosphere,
        players: msg.state.players || [],
      })
      break
    case 'players':
      set({ players: msg.players })
      break
    case 'show_handout':
      set({ currentHandoutId: msg.handoutId, currentMapId: null })
      break
    case 'clear_handout':
      set({ currentHandoutId: null, currentMapId: null })
      break
    case 'show_map':
      set({ currentMapId: msg.handoutId, currentHandoutId: null, mapPins: msg.pins || [] })
      break
    case 'update_pins':
      set({ mapPins: msg.pins })
      break
    case 'dice_roll':
      set((s: any) => ({ diceLog: [msg, ...s.diceLog].slice(0, 60) }))
      break
    case 'update_initiative':
      set({ initiative: msg.initiative })
      break
    case 'atmosphere':
      set({ atmosphere: msg.text })
      break
  }
}
