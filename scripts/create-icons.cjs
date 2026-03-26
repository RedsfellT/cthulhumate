// Génère les icônes PWA 192x192 et 512x512 en PNG pur Node.js (sans dépendances)
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// CRC32 pour PNG
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function createPNG(size) {
  // Couleurs CthulhuMate : fond #1a0a00, cercle/octopus #c8972a
  const bg = [0x1a, 0x0a, 0x00]
  const gold = [0xc8, 0x97, 0x2a]
  const cx = size / 2, cy = size / 2, r = size * 0.38

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2  // 8-bit RGB

  // Image data : chaque ligne = filtre 0 + pixels RGB
  const rows = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    rows[y * (1 + size * 3)] = 0  // filtre None
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const color = dist <= r ? gold : bg
      const off = y * (1 + size * 3) + 1 + x * 3
      rows[off] = color[0]; rows[off + 1] = color[1]; rows[off + 2] = color[2]
    }
  }

  const idat = zlib.deflateSync(rows)
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512))
console.log('✓ Icônes créées : public/icons/icon-192.png et icon-512.png')
