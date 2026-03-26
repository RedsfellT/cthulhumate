const express = require('express')
const { WebSocketServer, WebSocket } = require('ws')
const https = require('https')
const http = require('http')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const fs = require('fs')
const selfsigned = require('selfsigned')
const qrcode = require('qrcode-terminal')

// ── Certificat HTTPS auto-généré ───────────────────────────
const CERT_FILE = path.join(__dirname, '.cert.json')

function getCert(ip) {
  // Réutilise le cert existant si l'IP n'a pas changé
  if (fs.existsSync(CERT_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CERT_FILE, 'utf8'))
      if (saved.ip === ip) return { key: saved.key, cert: saved.cert }
    } catch {}
  }
  console.log('  Génération du certificat HTTPS pour', ip, '...')
  const attrs = [{ name: 'commonName', value: 'CthulhuMate Local' }]
  const opts = {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      { name: 'subjectAltName', altNames: [
        { type: 7, ip },           // IP LAN
        { type: 7, ip: '127.0.0.1' },
        { type: 2, value: 'localhost' },
      ]},
    ],
  }
  const pems = selfsigned.generate(attrs, opts)
  fs.writeFileSync(CERT_FILE, JSON.stringify({ ip, key: pems.private, cert: pems.cert }))
  return { key: pems.private, cert: pems.cert }
}

function getLocalIP() {
  const nets = os.networkInterfaces()
  for (const ifaces of Object.values(nets)) {
    for (const net of ifaces) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return '127.0.0.1'
}

const PORT = 3000
const ip = getLocalIP()
const credentials = getCert(ip)

const app = express()
app.use(express.json({ limit: '20mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

// ── Session state ──────────────────────────────────────────
const session = {
  handouts: new Map(),
  currentHandoutId: null,
  currentMapId: null,
  mapPins: [],
  diceLog: [],
  initiative: [],
  atmosphere: null,
  characters: new Map(),
}

const clients = new Map()  // ws -> { role, name }

// ── HTTP API ───────────────────────────────────────────────
app.get('/api/info', (_req, res) => {
  res.json({
    ip,
    port: PORT,
    players: [...clients.values()].map(c => ({ name: c.name, role: c.role }))
  })
})

app.post('/api/handout', (req, res) => {
  const { title, type, data, thumb } = req.body
  if (!data) return res.status(400).json({ error: 'No data' })
  const id = crypto.randomUUID()
  session.handouts.set(id, { id, title: title || 'Handout', type: type || 'image', data, thumb, createdAt: Date.now() })
  res.json({ id })
})

app.get('/api/handout/:id', (req, res) => {
  const h = session.handouts.get(req.params.id)
  if (!h) return res.status(404).json({ error: 'Not found' })
  res.json(h)
})

app.delete('/api/handout/:id', (req, res) => {
  session.handouts.delete(req.params.id)
  res.json({ ok: true })
})

app.get('/api/handouts', (_req, res) => {
  res.json([...session.handouts.values()].map(h => ({
    id: h.id, title: h.title, type: h.type, thumb: h.thumb, createdAt: h.createdAt
  })))
})

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ── Serveurs HTTP (redirect) + HTTPS ──────────────────────
// Redirect HTTP → HTTPS
const httpApp = express()
httpApp.use((req, res) => res.redirect(`https://${req.hostname}:${PORT}${req.url}`))
http.createServer(httpApp).listen(80, '0.0.0.0').on('error', () => {})  // port 80 optionnel

const server = https.createServer(credentials, app)
const wss = new WebSocketServer({ server })

// ── WebSocket ──────────────────────────────────────────────
wss.on('connection', (ws) => {
  clients.set(ws, { role: 'player', name: 'Joueur' })
  send(ws, { type: 'session_state', state: getState() })
  broadcastPlayers()

  ws.on('message', raw => {
    try { handleMsg(ws, JSON.parse(raw.toString())) } catch (e) { console.error('WS:', e.message) }
  })
  ws.on('close', () => {
    const info = clients.get(ws)
    clients.delete(ws)
    if (info?.role === 'player') broadcast({ type: 'player_left', name: info.name })
    broadcastPlayers()
  })
  ws.on('error', () => clients.delete(ws))
})

function handleMsg(ws, msg) {
  const c = clients.get(ws)
  switch (msg.type) {
    case 'set_role':
      clients.set(ws, { ...c, role: msg.role, name: msg.name || c.name })
      broadcastPlayers()
      if (msg.role === 'player') broadcast({ type: 'player_joined', name: msg.name })
      break
    case 'show_handout':
      session.currentHandoutId = msg.handoutId
      session.currentMapId = null
      broadcast({ type: 'show_handout', handoutId: msg.handoutId })
      break
    case 'clear_handout':
      session.currentHandoutId = null
      session.currentMapId = null
      broadcast({ type: 'clear_handout' })
      break
    case 'show_map':
      session.currentMapId = msg.handoutId
      session.currentHandoutId = null
      session.mapPins = msg.pins || []
      broadcast({ type: 'show_map', handoutId: msg.handoutId, pins: session.mapPins })
      break
    case 'update_pins':
      session.mapPins = msg.pins
      broadcast({ type: 'update_pins', pins: msg.pins })
      break
    case 'dice_roll': {
      const entry = { ...msg, roller: c.name, timestamp: Date.now() }
      session.diceLog.unshift(entry)
      if (session.diceLog.length > 60) session.diceLog.pop()
      broadcast({ type: 'dice_roll', ...entry })
      break
    }
    case 'update_initiative':
      session.initiative = msg.initiative
      broadcast({ type: 'update_initiative', initiative: msg.initiative })
      break
    case 'atmosphere':
      session.atmosphere = msg.text
      broadcast({ type: 'atmosphere', text: msg.text })
      break
    case 'char_update':
      session.characters.set(c.name, msg.stats)
      broadcast({ type: 'char_update', player: c.name, stats: msg.stats })
      break
    case 'request_state':
      send(ws, { type: 'session_state', state: getState() })
      break
  }
}

function getState() {
  return {
    currentHandoutId: session.currentHandoutId,
    currentMapId: session.currentMapId,
    mapPins: session.mapPins,
    diceLog: session.diceLog.slice(0, 20),
    initiative: session.initiative,
    atmosphere: session.atmosphere,
    players: [...clients.values()].map(c => ({ name: c.name, role: c.role })),
    characters: Object.fromEntries(session.characters),
  }
}

function broadcastPlayers() {
  broadcast({ type: 'players', players: [...clients.values()].map(c => ({ name: c.name, role: c.role })) })
}

function broadcast(msg, exclude = null) {
  const data = JSON.stringify(msg)
  for (const [ws] of clients) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) ws.send(data)
  }
}

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

// ── Démarrage ──────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  const url = `https://${ip}:${PORT}`

  console.log('')
  console.log('  ╔══════════════════════════════════════════════╗')
  console.log('  ║       CthulhuMate V7 — Session locale        ║')
  console.log('  ╠══════════════════════════════════════════════╣')
  console.log(`  ║  Gardien  : https://localhost:${PORT}           ║`)
  console.log(`  ║  Joueurs  : ${url.padEnd(35)}║`)
  console.log('  ╠══════════════════════════════════════════════╣')
  console.log('  ║  PREMIERE CONNEXION : ouvrez l\'URL ci-dessus ║')
  console.log('  ║  dans votre navigateur et cliquez "Avancé"   ║')
  console.log('  ║  puis "Continuer" pour approuver le cert.    ║')
  console.log('  ╚══════════════════════════════════════════════╝')
  console.log('')
  console.log('  QR Code pour les joueurs :')
  console.log('')
  qrcode.generate(url, { small: true })
  console.log('')
})
