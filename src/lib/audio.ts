// Ambient sound engine using Web Audio API — no external files needed

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Utility: create white noise buffer
function makeNoiseBuffer(duration = 2): AudioBuffer {
  const c = getCtx()
  const sr = c.sampleRate
  const buf = c.createBuffer(1, sr * duration, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

// Sound factory types
export type AmbientType = 'rain' | 'storm' | 'wind' | 'heartbeat' | 'horror' | 'fire' | 'ocean' | 'asylum'

interface SoundNode {
  gain: GainNode
  stop: () => void
}

const activeSounds = new Map<AmbientType, SoundNode>()

// ── RAIN ─────────────────────────────────────────────────────
function createRain(volume: number): SoundNode {
  const c = getCtx()
  const buf = makeNoiseBuffer(2)
  const gain = c.createGain()
  gain.gain.value = volume * 0.4

  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 3000
  filter.Q.value = 0.3

  const filter2 = c.createBiquadFilter()
  filter2.type = 'lowpass'
  filter2.frequency.value = 8000

  function loop() {
    const src = c.createBufferSource()
    src.buffer = buf
    src.loop = true
    src.connect(filter)
    filter.connect(filter2)
    filter2.connect(gain)
    gain.connect(c.destination)
    src.start()
    return src
  }
  const src = loop()
  return { gain, stop: () => { try { src.stop() } catch {} } }
}

// ── STORM ─────────────────────────────────────────────────────
function createStorm(volume: number): SoundNode {
  const c = getCtx()
  const buf = makeNoiseBuffer(2)
  const gain = c.createGain()
  gain.gain.value = volume * 0.6

  // Low rumble
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.1
  const lfoGain = c.createGain()
  lfoGain.gain.value = 500

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 400
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)

  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start()
  lfo.start()

  // Occasional thunder boom
  let thunderTimer: any
  function thunder() {
    const boom = c.createOscillator()
    const boomGain = c.createGain()
    boom.frequency.value = 60
    boom.type = 'sawtooth'
    boomGain.gain.setValueAtTime(0, c.currentTime)
    boomGain.gain.linearRampToValueAtTime(volume * 0.8, c.currentTime + 0.05)
    boomGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5)
    boom.connect(boomGain)
    boomGain.connect(c.destination)
    boom.start()
    boom.stop(c.currentTime + 1.5)
    thunderTimer = setTimeout(thunder, 5000 + Math.random() * 10000)
  }
  thunder()

  return {
    gain,
    stop: () => {
      try { src.stop(); lfo.stop() } catch {}
      clearTimeout(thunderTimer)
    }
  }
}

// ── WIND ─────────────────────────────────────────────────────
function createWind(volume: number): SoundNode {
  const c = getCtx()
  const buf = makeNoiseBuffer(2)
  const gain = c.createGain()
  gain.gain.value = volume * 0.35

  const lfo = c.createOscillator()
  lfo.frequency.value = 0.2
  const lfoGain = c.createGain()
  lfoGain.gain.value = 800

  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 800
  filter.Q.value = 0.5
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)

  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start()
  lfo.start()

  return { gain, stop: () => { try { src.stop(); lfo.stop() } catch {} } }
}

// ── HEARTBEAT ─────────────────────────────────────────────────
function createHeartbeat(volume: number): SoundNode {
  const c = getCtx()
  const gain = c.createGain()
  gain.gain.value = volume

  let timer: any
  function beat() {
    const now = c.currentTime
    // Lub
    const o1 = c.createOscillator()
    const g1 = c.createGain()
    o1.frequency.value = 80
    o1.type = 'sine'
    g1.gain.setValueAtTime(0, now)
    g1.gain.linearRampToValueAtTime(volume * 0.9, now + 0.02)
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    o1.connect(g1)
    g1.connect(c.destination)
    o1.start(now)
    o1.stop(now + 0.15)

    // Dub
    const o2 = c.createOscillator()
    const g2 = c.createGain()
    o2.frequency.value = 70
    o2.type = 'sine'
    g2.gain.setValueAtTime(0, now + 0.2)
    g2.gain.linearRampToValueAtTime(volume * 0.6, now + 0.23)
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    o2.connect(g2)
    g2.connect(c.destination)
    o2.start(now + 0.2)
    o2.stop(now + 0.35)

    timer = setTimeout(beat, 900 - (1 - volume) * 200)
  }
  beat()

  return { gain, stop: () => clearTimeout(timer) }
}

// ── HORROR STRINGS ────────────────────────────────────────────
function createHorror(volume: number): SoundNode {
  const c = getCtx()
  const gain = c.createGain()
  gain.gain.value = volume * 0.3

  const freqs = [55, 58, 61, 65, 69]
  const oscs: OscillatorNode[] = []

  freqs.forEach((f, i) => {
    const osc = c.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = f

    const lfo = c.createOscillator()
    lfo.frequency.value = 5 + i * 0.7
    const lfoGain = c.createGain()
    lfoGain.gain.value = 1.5
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    const oGain = c.createGain()
    oGain.gain.value = 1 / freqs.length
    osc.connect(oGain)
    oGain.connect(gain)
    gain.connect(c.destination)
    osc.start()
    lfo.start()
    oscs.push(osc, lfo)
  })

  return { gain, stop: () => oscs.forEach(o => { try { o.stop() } catch {} }) }
}

// ── FIRE ─────────────────────────────────────────────────────
function createFire(volume: number): SoundNode {
  const c = getCtx()
  const buf = makeNoiseBuffer(2)
  const gain = c.createGain()
  gain.gain.value = volume * 0.3

  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1000
  filter.Q.value = 0.8

  const lfo = c.createOscillator()
  lfo.frequency.value = 3
  const lfoGain = c.createGain()
  lfoGain.gain.value = 500
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)

  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start()
  lfo.start()

  return { gain, stop: () => { try { src.stop(); lfo.stop() } catch {} } }
}

// ── OCEAN ─────────────────────────────────────────────────────
function createOcean(volume: number): SoundNode {
  const c = getCtx()
  const buf = makeNoiseBuffer(4)
  const gain = c.createGain()
  gain.gain.value = volume * 0.5

  const lfo = c.createOscillator()
  lfo.frequency.value = 0.08
  const lfoGain = c.createGain()
  lfoGain.gain.value = 0.3
  lfo.connect(lfoGain)
  lfoGain.connect(gain.gain)

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200

  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start()
  lfo.start()

  return { gain, stop: () => { try { src.stop(); lfo.stop() } catch {} } }
}

// ── ASYLUM ────────────────────────────────────────────────────
function createAsylum(volume: number): SoundNode {
  const c = getCtx()
  const buf = makeNoiseBuffer(2)
  const gain = c.createGain()
  gain.gain.value = volume * 0.2

  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 400
  filter.Q.value = 2

  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start()

  // Occasional distant moan
  let timer: any
  function moan() {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(200 + Math.random() * 200, c.currentTime)
    o.frequency.linearRampToValueAtTime(100 + Math.random() * 100, c.currentTime + 1.5)
    g.gain.setValueAtTime(0, c.currentTime)
    g.gain.linearRampToValueAtTime(volume * 0.15, c.currentTime + 0.3)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5)
    o.connect(g)
    g.connect(c.destination)
    o.start()
    o.stop(c.currentTime + 1.5)
    timer = setTimeout(moan, 4000 + Math.random() * 8000)
  }
  moan()

  return { gain, stop: () => { try { src.stop() } catch {}; clearTimeout(timer) } }
}

// ── Public API ─────────────────────────────────────────────────
const CREATORS: Record<AmbientType, (vol: number) => SoundNode> = {
  rain: createRain, storm: createStorm, wind: createWind,
  heartbeat: createHeartbeat, horror: createHorror,
  fire: createFire, ocean: createOcean, asylum: createAsylum,
}

export function startSound(type: AmbientType, volume: number): void {
  stopSound(type)
  const node = CREATORS[type](volume)
  activeSounds.set(type, node)
}

export function stopSound(type: AmbientType): void {
  activeSounds.get(type)?.stop()
  activeSounds.delete(type)
}

export function setVolume(type: AmbientType, volume: number): void {
  const node = activeSounds.get(type)
  if (node) node.gain.gain.setTargetAtTime(volume * getBaseVolume(type), getCtx().currentTime, 0.1)
}

function getBaseVolume(type: AmbientType): number {
  const bases: Record<AmbientType, number> = {
    rain: 0.4, storm: 0.6, wind: 0.35, heartbeat: 1,
    horror: 0.3, fire: 0.3, ocean: 0.5, asylum: 0.2
  }
  return bases[type] ?? 0.5
}

export function stopAll(): void {
  activeSounds.forEach((_, t) => stopSound(t))
}

export function isPlaying(type: AmbientType): boolean {
  return activeSounds.has(type)
}
