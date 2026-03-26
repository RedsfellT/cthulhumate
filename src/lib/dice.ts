export type DiceResult = {
  roll: number
  target: number
  level: 'critical_success' | 'success' | 'hard_success' | 'extreme_success' | 'fail' | 'fumble'
  label: string
  color: string
}

export function rollD100(): number {
  return Math.floor(Math.random() * 100) + 1
}

export function rollDice(sides: number, count = 1): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
}

export function checkSkill(roll: number, target: number): DiceResult {
  const hard = Math.floor(target / 2)
  const extreme = Math.floor(target / 5)

  let level: DiceResult['level']
  let label: string
  let color: string

  if (roll === 1) {
    level = 'critical_success'
    label = 'Réussite Critique !'
    color = '#f1c40f'
  } else if (roll <= extreme) {
    level = 'extreme_success'
    label = 'Réussite Extrême'
    color = '#2ecc71'
  } else if (roll <= hard) {
    level = 'hard_success'
    label = 'Réussite Difficile'
    color = '#27ae60'
  } else if (roll <= target) {
    level = 'success'
    label = 'Réussite'
    color = '#1abc9c'
  } else if (roll >= 96 || (target < 50 && roll >= 96)) {
    level = 'fumble'
    label = 'Fumble !'
    color = '#e74c3c'
  } else {
    level = 'fail'
    label = 'Échec'
    color = '#c0392b'
  }

  return { roll, target, level, label, color }
}

export function rollBonus(rolls: number[]): number {
  return Math.min(...rolls)
}

export function rollPenalty(rolls: number[]): number {
  return Math.max(...rolls)
}

export function parseDiceFormula(formula: string): number {
  // e.g. "1d6+2", "2d6", "1d4+1d6", "3"
  let total = 0
  const parts = formula.toLowerCase().replace(/\s/g, '').split(/(?=[+-])/)
  for (const part of parts) {
    const sign = part.startsWith('-') ? -1 : 1
    const clean = part.replace(/^[+-]/, '')
    if (clean.includes('d')) {
      const [countStr, sidesStr] = clean.split('d')
      const count = parseInt(countStr) || 1
      const sides = parseInt(sidesStr) || 6
      const rolls = rollDice(sides, count)
      total += sign * rolls.reduce((a, b) => a + b, 0)
    } else {
      total += sign * (parseInt(clean) || 0)
    }
  }
  return total
}
