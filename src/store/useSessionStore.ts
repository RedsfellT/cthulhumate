import { create } from 'zustand'
import { joinRoom } from '@trystero-p2p/torrent'

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
  peerId?: string
}

export interface HandoutPayload {
  id: string
  data: string
  title: string
  type: 'image' | 'text'
}

interface SessionStore {
  connected: boolean
  role: SessionRole
  playerName: string
  players: ConnectedPlayer[]
  currentHandoutId: string | null
  currentHandoutData: HandoutPayload | null
  currentMapId: string | null
  currentMapData: string | null
  mapPins: MapPin[]
  diceLog: DiceLogEntry[]
  initiative: any[]
  atmosphere: string | null
  roomCode: string

  _room: any | null
  _send: ((data: any, peerId?: string) => void) | null

  init: () => void
  connect: (name: string, role: SessionRole, roomCode: string) => void
  disconnect: () => void
  setRoomCode: (code: string) => void
  setPlayerName: (n: string) => void

  showHandout: (payload: HandoutPayload) => void
  clearHandout: () => void
  showMap: (id: string, data: string, pins?: MapPin[]) => void
  updatePins: (pins: MapPin[]) => void
  sendAtmosphere: (text: string) => void
  updateInitiative: (initiative: any[]) => void
  broadcastDice: (entry: Omit<DiceLogEntry, 'roller' | 'timestamp'>) => void
}

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  connected: false,
  role: 'none',
  playerName: 'Joueur',
  players: [],
  currentHandoutId: null,
  currentHandoutData: null,
  currentMapId: null,
  currentMapData: null,
  mapPins: [],
  diceLog: [],
  initiative: [],
  atmosphere: null,
  roomCode: localStorage.getItem('cthulhu_room_code') || '',
  _room: null,
  _send: null,

  init: () => {},

  setRoomCode: (code) => {
    set({ roomCode: code })
    localStorage.setItem('cthulhu_room_code', code)
  },

  connect: (name, role, roomCode) => {
    const existing = get()._room
    if (existing) existing.leave()

    const room = joinRoom({ appId: 'cthulhumate-v7' }, roomCode)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [send, receive] = (room as any).makeAction('session')

    receive((data: any, peerId: string) => {
      handleIncoming(data, peerId, set, get)
    })

    room.onPeerJoin((peerId: string) => {
      if (get().role === 'keeper') {
        // Send current state to the new peer only
        const s = get()
        send({
          type: 'session_state',
          state: {
            currentHandoutId: s.currentHandoutId,
            currentHandoutData: s.currentHandoutData,
            currentMapId: s.currentMapId,
            currentMapData: s.currentMapData,
            mapPins: s.mapPins,
            diceLog: s.diceLog,
            initiative: s.initiative,
            atmosphere: s.atmosphere,
            players: s.players,
          }
        }, peerId)
      }
    })

    room.onPeerLeave((peerId: string) => {
      set(s => ({ players: s.players.filter(p => p.peerId !== peerId) }))
    })

    set({ _room: room, _send: send, connected: true, role, playerName: name, roomCode })
    localStorage.setItem('cthulhu_room_code', roomCode)

    // Announce ourselves to all peers after a short delay
    setTimeout(() => {
      send({ type: 'announce', name, role })
    }, 400)
  },

  disconnect: () => {
    get()._room?.leave()
    set({ connected: false, _room: null, _send: null, role: 'none', players: [] })
  },

  setPlayerName: (n) => set({ playerName: n }),

  showHandout: (payload) => {
    get()._send?.({ type: 'show_handout', id: payload.id, data: payload.data, title: payload.title, handoutType: payload.type })
    set({ currentHandoutId: payload.id, currentHandoutData: payload, currentMapId: null, currentMapData: null })
  },

  clearHandout: () => {
    get()._send?.({ type: 'clear_handout' })
    set({ currentHandoutId: null, currentHandoutData: null, currentMapId: null, currentMapData: null })
  },

  showMap: (id, data, pins = []) => {
    get()._send?.({ type: 'show_map', id, data, pins })
    set({ currentMapId: id, currentMapData: data, currentHandoutId: null, currentHandoutData: null, mapPins: pins })
  },

  updatePins: (pins) => {
    get()._send?.({ type: 'update_pins', pins })
    set({ mapPins: pins })
  },

  sendAtmosphere: (text) => {
    get()._send?.({ type: 'atmosphere', text })
    set({ atmosphere: text })
  },

  updateInitiative: (initiative) => {
    get()._send?.({ type: 'update_initiative', initiative })
    set({ initiative })
  },

  broadcastDice: (entry) => {
    const name = get().playerName
    const fullEntry: DiceLogEntry = { ...entry, roller: name, timestamp: Date.now() }
    get()._send?.({ type: 'dice_roll', ...fullEntry })
    // Add to local log too (we don't receive our own P2P messages)
    set(s => ({ diceLog: [fullEntry, ...s.diceLog].slice(0, 60) }))
  },
}))

function handleIncoming(msg: any, peerId: string, set: any, get: any) {
  switch (msg.type) {
    case 'announce': {
      set((s: any) => {
        const already = s.players.find((p: ConnectedPlayer) => p.peerId === peerId)
        if (already) return {}
        return { players: [...s.players, { name: msg.name, role: msg.role, peerId }] }
      })
      // Keeper re-announces so the new player knows who the keeper is
      if (get().role === 'keeper') {
        setTimeout(() => {
          get()._send?.({ type: 'announce', name: get().playerName, role: 'keeper' }, peerId)
        }, 100)
      }
      break
    }
    case 'session_state': {
      const s = msg.state
      set({
        currentHandoutId: s.currentHandoutId,
        currentHandoutData: s.currentHandoutData,
        currentMapId: s.currentMapId,
        currentMapData: s.currentMapData,
        mapPins: s.mapPins || [],
        diceLog: s.diceLog || [],
        initiative: s.initiative || [],
        atmosphere: s.atmosphere,
        players: s.players || [],
      })
      break
    }
    case 'show_handout':
      set({
        currentHandoutId: msg.id,
        currentHandoutData: { id: msg.id, data: msg.data, title: msg.title, type: msg.handoutType as 'image' | 'text' },
        currentMapId: null,
        currentMapData: null,
      })
      break
    case 'clear_handout':
      set({ currentHandoutId: null, currentHandoutData: null, currentMapId: null, currentMapData: null })
      break
    case 'show_map':
      set({ currentMapId: msg.id, currentMapData: msg.data, currentHandoutId: null, currentHandoutData: null, mapPins: msg.pins || [] })
      break
    case 'update_pins':
      set({ mapPins: msg.pins })
      break
    case 'dice_roll':
      set((s: any) => ({ diceLog: [{ ...msg, timestamp: msg.timestamp || Date.now() }, ...s.diceLog].slice(0, 60) }))
      break
    case 'update_initiative':
      set({ initiative: msg.initiative })
      break
    case 'atmosphere':
      set({ atmosphere: msg.text })
      break
  }
}
