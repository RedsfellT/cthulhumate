import type { Character } from '../db/database'
import { db } from '../db/database'

// ── JSON Export ────────────────────────────────────────────
export async function exportAllData(): Promise<void> {
  const [characters, sessions] = await Promise.all([
    db.characters.toArray(),
    db.sessions.toArray(),
  ])

  // Strip blobs for JSON export (portraits)
  const sanitizedChars = characters.map(c => {
    const { portrait, ...rest } = c as any
    return rest
  })

  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    characters: sanitizedChars,
    sessions,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cthulhumate-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<{ characters: number; sessions: number }> {
  const text = await file.text()
  const data = JSON.parse(text)

  if (!data.version || !data.characters) {
    throw new Error('Format de fichier invalide')
  }

  let charCount = 0, sessionCount = 0

  for (const char of data.characters) {
    const { id, ...rest } = char
    await db.characters.add({ ...rest, createdAt: new Date(rest.createdAt), updatedAt: new Date() })
    charCount++
  }

  if (data.sessions) {
    for (const session of data.sessions) {
      const { id, ...rest } = session
      await db.sessions.add({ ...rest, date: new Date(rest.date), createdAt: new Date(rest.createdAt) })
      sessionCount++
    }
  }

  return { characters: charCount, sessions: sessionCount }
}

// ── Character sheet print / PDF ─────────────────────────────
export function printCharacterSheet(char: Character): void {
  const pv = char.pvMax - char.pvCrossed.length
  const san = char.sanInitial - char.sanCrossed.length
  const pm = char.pmMax - char.pmCrossed.length

  const skillsHtml = Object.entries(char.skills)
    .filter(([_, s]) => !s.custom || s.value > 0)
    .map(([key, skill]) => {
      const name = key.replace(/_/g, ' ')
      return `<tr>
        <td>${skill.checked ? '✓' : '○'}</td>
        <td>${name}</td>
        <td style="text-align:right">${skill.base}%</td>
        <td style="text-align:right;font-weight:bold">${skill.value}%</td>
        <td style="text-align:right;color:#888">${Math.floor(skill.value / 2)}</td>
        <td style="text-align:right;color:#888">${Math.floor(skill.value / 5)}</td>
      </tr>`
    }).join('')

  const weaponsHtml = char.weapons.map(w => `
    <tr>
      <td>${w.name}</td><td>${w.ord}</td><td>${w.maj}</td><td>${w.ext}</td>
      <td>${w.degats}</td><td>${w.portee}</td><td>${w.cad}</td><td>${w.cap}</td><td>${w.panne}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Fiche — ${char.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; font-size: 10px; color: #111; padding: 1cm; }
  h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 4px; margin-bottom: 8px; }
  h2 { font-size: 12px; background: #ddd; padding: 2px 6px; margin: 8px 0 4px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #eee; text-align: left; padding: 2px 4px; font-size: 9px; }
  td { padding: 2px 4px; border-bottom: 1px solid #eee; }
  .char-box { display: inline-block; border: 1px solid #999; padding: 2px 6px; margin: 1px; text-align: center; min-width: 40px; }
  .char-label { font-weight: bold; font-size: 9px; }
  .vital { padding: 4px; border: 1px solid #999; margin: 2px 0; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>L'Appel de Cthulhu V7 — ${char.period === 'classique' ? 'Période Classique' : 'Période Moderne'}</h1>

<div class="grid-2">
<div>
<h2>État civil</h2>
<table>
<tr><td><b>Nom</b></td><td>${char.name}</td><td><b>Joueur</b></td><td>${char.player}</td></tr>
<tr><td><b>Occupation</b></td><td colspan="3">${char.occupation}</td></tr>
<tr><td><b>Âge</b></td><td>${char.age}</td><td><b>Sexe</b></td><td>${char.sex}</td></tr>
<tr><td><b>Résidence</b></td><td colspan="3">${char.residence}</td></tr>
<tr><td><b>Naissance</b></td><td colspan="3">${char.birthplace}</td></tr>
</table>
</div>
<div>
<h2>Caractéristiques</h2>
<div style="display:flex;flex-wrap:wrap;gap:4px">
${[['FOR',char.str],['DEX',char.dex],['POU',char.pow],['CON',char.con],['APP',char.app],['ÉDU',char.edu],['TAI',char.siz],['INT',char.int],['MVT',char.mov]].map(([l,v]) =>
  `<div class="char-box"><div class="char-label">${l}</div><div style="font-size:14px;font-weight:bold">${v}</div><div style="font-size:8px">½${Math.floor(Number(v)/2)} ⅕${Math.floor(Number(v)/5)}</div></div>`
).join('')}
</div>
</div>
</div>

<div class="grid-3" style="margin-top:8px">
<div class="vital"><b>PV</b> ${pv}/${char.pvMax} — Bless. grave: ${char.pvBlessureGrave}</div>
<div class="vital"><b>SAN</b> ${san}/${char.sanInitial} (max ${char.sanMax})</div>
<div class="vital"><b>PM</b> ${pm}/${char.pmMax} | <b>Chance</b> ${char.chance}</div>
</div>

<div class="grid-2" style="margin-top:8px">
<div>
<h2>Compétences</h2>
<table>
<tr><th></th><th>Compétence</th><th>Base</th><th>Val.</th><th>½</th><th>⅕</th></tr>
${skillsHtml}
</table>
</div>
<div>
<h2>Combat</h2>
<p>Impact: ${char.impact} | Carrure: ${char.carrure} | Esquive: ${char.esquiveBase}%</p>
<table style="margin-top:6px">
<tr><th>Arme</th><th>Ord.</th><th>Maj.</th><th>Ext.</th><th>Dégâts</th><th>Portée</th><th>Cad.</th><th>Cap.</th><th>Panne</th></tr>
${weaponsHtml}
</table>
<h2 style="margin-top:8px">Profil</h2>
<p><b>Description :</b> ${char.description}</p>
<p><b>Idéologie :</b> ${char.ideologie}</p>
<p><b>Traits :</b> ${char.traits}</p>
<p><b>Séquelles :</b> ${char.sequellesCicatrices}</p>
<h2 style="margin-top:8px">Richesse</h2>
<p>Espèces: ${char.especes} | Capital: ${char.capital}</p>
<p><b>Notes :</b> ${char.notes}</p>
</div>
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}
