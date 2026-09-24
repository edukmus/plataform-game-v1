import { GROUND_Y, WORLD_W } from './constants.ts'
import type { Enemy, LevelId, LevelTheme, Mountain, Platform } from './types.ts'

export const NIGHT_THEME: LevelTheme = {
  sky: ['#071426', '#123456', '#1d4e46'],
  mountain: '#0b1c30',
  mountainFar: '#10243c',
  ground: '#1f6f4a',
  groundTop: '#86efac',
  ledge: '#38bdf8',
  ledgeTop: '#e0f2fe',
  dirtA: '#12324a',
  dirtB: '#0e283c',
  sunny: false,
  snow: false,
  void: false,
}

export const SUN_THEME: LevelTheme = {
  sky: ['#7dd3fc', '#fde68a', '#fb923c'],
  mountain: '#c2410c',
  mountainFar: '#ea580c',
  ground: '#ca8a04',
  groundTop: '#fef08a',
  ledge: '#f97316',
  ledgeTop: '#ffedd5',
  dirtA: '#b45309',
  dirtB: '#9a3412',
  sunny: true,
  snow: false,
  void: false,
}

export const SNOW_THEME: LevelTheme = {
  sky: ['#dbeafe', '#93c5fd', '#e2e8f0'],
  mountain: '#cbd5e1',
  mountainFar: '#94a3b8',
  ground: '#e2e8f0',
  groundTop: '#ffffff',
  ledge: '#7dd3fc',
  ledgeTop: '#f8fafc',
  dirtA: '#bae6fd',
  dirtB: '#7dd3fc',
  sunny: false,
  snow: true,
  void: false,
}

export const VOID_THEME: LevelTheme = {
  sky: ['#1e1033', '#4c1d95', '#111827'],
  mountain: '#312e81',
  mountainFar: '#4c1d95',
  ground: '#3b0764',
  groundTop: '#c084fc',
  ledge: '#22d3ee',
  ledgeTop: '#f5d0fe',
  dirtA: '#1e1b4b',
  dirtB: '#0f172a',
  sunny: false,
  snow: false,
  void: true,
}

const level1Platforms = (): Platform[] => [
  { id: 'g0', kind: 'ground', x: 0, y: GROUND_Y, w: 780, h: 80 },
  { id: 'g1', kind: 'ground', x: 980, y: GROUND_Y, w: 640, h: 80 },
  { id: 'g2', kind: 'ground', x: 1780, y: GROUND_Y, w: 520, h: 80 },
  { id: 'g3', kind: 'ground', x: 2460, y: GROUND_Y, w: 900, h: 80 },
  { id: 'g4', kind: 'ground', x: 3520, y: GROUND_Y, w: WORLD_W - 3520, h: 80 },

  { id: 'l1', kind: 'ledge', x: 260, y: 360, w: 140, h: 18 },
  { id: 'l2', kind: 'ledge', x: 480, y: 270, w: 120, h: 18 },
  { id: 'l3', kind: 'ledge', x: 700, y: 190, w: 110, h: 18 },
  { id: 'l4', kind: 'ledge', x: 820, y: 320, w: 100, h: 18 },
  { id: 'l5', kind: 'ledge', x: 1120, y: 340, w: 150, h: 18 },
  { id: 'l6', kind: 'ledge', x: 1360, y: 250, w: 130, h: 18 },
  { id: 'l7', kind: 'ledge', x: 1580, y: 170, w: 120, h: 18 },
  { id: 'l8', kind: 'ledge', x: 1880, y: 330, w: 160, h: 18 },
  { id: 'l9', kind: 'ledge', x: 2120, y: 230, w: 140, h: 18 },
  { id: 'l10', kind: 'ledge', x: 2300, y: 150, w: 110, h: 18 },
  { id: 'l11', kind: 'ledge', x: 2620, y: 340, w: 180, h: 18 },
  { id: 'l12', kind: 'ledge', x: 2900, y: 240, w: 140, h: 18 },
  { id: 'l13', kind: 'ledge', x: 3140, y: 160, w: 130, h: 18 },
  { id: 'l14', kind: 'ledge', x: 3380, y: 300, w: 120, h: 18 },
  { id: 'l15', kind: 'ledge', x: 3680, y: 220, w: 160, h: 18 },
  { id: 'goal', kind: 'goal', x: 3920, y: GROUND_Y - 90, w: 70, h: 90 },
]

const patrol = (
  id: string,
  x: number,
  y: number,
  vx: number,
  range: number,
): Enemy => ({
  id,
  x,
  y,
  w: 36,
  h: 40,
  vx,
  originX: x,
  range,
  alive: true,
  kind: 'patrol',
  hop: 0,
  baseY: y,
})

const level1Enemies = (): Enemy[] => [
  patrol('e1', 420, GROUND_Y - 40, 70, 180),
  patrol('e2', 1180, GROUND_Y - 40, -80, 200),
  patrol('e3', 1360, 210, 60, 90),
  patrol('e4', 1980, GROUND_Y - 40, 90, 160),
  patrol('e5', 2680, GROUND_Y - 40, -75, 220),
  patrol('e6', 2900, 200, 55, 100),
  patrol('e7', 3300, GROUND_Y - 40, 85, 140),
  patrol('e8', 3680, 180, -60, 110),
]

const nightMountains = (): Mountain[] => [
  { amp: 28, freq: 0.01, base: 210, phase: 0 },
  { amp: 16, freq: 0.018, base: 248, phase: 1.2 },
]

const rng = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const jitter = (rand: () => number, amount: number) => Math.round((rand() - 0.5) * amount)

const varyPlatforms = (base: Platform[], rand: () => number): Platform[] =>
  base.map((platform) => {
    if (platform.kind === 'goal') {
      return { ...platform, x: Math.min(WORLD_W - 90, Math.max(3600, platform.x + jitter(rand, 140))) }
    }
    if (platform.kind === 'ground') {
      return {
        ...platform,
        x: Math.max(0, platform.x + jitter(rand, 160)),
        w: Math.max(260, platform.w + jitter(rand, 220)),
      }
    }
    return {
      ...platform,
      x: Math.max(40, platform.x + jitter(rand, 180)),
      y: Math.max(120, Math.min(390, platform.y + jitter(rand, 110))),
      w: Math.max(90, platform.w + jitter(rand, 70)),
    }
  })

const varyEnemies = (base: Enemy[], rand: () => number): Enemy[] =>
  base.map((enemy, index) => {
    const hopper = index % 2 === 1
    const y = Math.max(120, enemy.baseY + jitter(rand, hopper ? 40 : 0))
    return {
      ...enemy,
      x: enemy.x + jitter(rand, 80),
      y,
      baseY: y,
      originX: enemy.originX + jitter(rand, 80),
      vx: Math.round(enemy.vx * (1.15 + rand() * 0.45)),
      range: Math.max(70, enemy.range + jitter(rand, 80)),
      kind: hopper ? 'hopper' : 'patrol',
      hop: rand() * Math.PI,
      w: hopper ? 34 : 40,
      h: hopper ? 36 : 46,
    }
  })

const sunMountains = (rand: () => number): Mountain[] => [
  { amp: 22 + rand() * 36, freq: 0.006 + rand() * 0.012, base: 170 + rand() * 40, phase: rand() * Math.PI * 2 },
  { amp: 14 + rand() * 28, freq: 0.012 + rand() * 0.02, base: 220 + rand() * 36, phase: rand() * Math.PI * 2 },
]

const snowPlatforms = (): Platform[] => [
  { id: 'g0', kind: 'ground', x: 0, y: GROUND_Y, w: 520, h: 80 },
  { id: 'g1', kind: 'ground', x: 760, y: GROUND_Y, w: 380, h: 80 },
  { id: 'g2', kind: 'ground', x: 1380, y: GROUND_Y, w: 340, h: 80 },
  { id: 'g3', kind: 'ground', x: 1960, y: GROUND_Y, w: 420, h: 80 },
  { id: 'g4', kind: 'ground', x: 2620, y: GROUND_Y, w: 360, h: 80 },
  { id: 'g5', kind: 'ground', x: 3220, y: GROUND_Y, w: 300, h: 80 },
  { id: 'g6', kind: 'ground', x: 3720, y: GROUND_Y, w: WORLD_W - 3720, h: 80 },
  { id: 'l1', kind: 'ledge', x: 540, y: 340, w: 110, h: 16 },
  { id: 'l2', kind: 'ledge', x: 900, y: 250, w: 100, h: 16 },
  { id: 'l3', kind: 'ledge', x: 1160, y: 170, w: 90, h: 16 },
  { id: 'l4', kind: 'ledge', x: 1540, y: 320, w: 100, h: 16 },
  { id: 'l5', kind: 'ledge', x: 1760, y: 210, w: 90, h: 16 },
  { id: 'l6', kind: 'ledge', x: 2140, y: 300, w: 110, h: 16 },
  { id: 'l7', kind: 'ledge', x: 2420, y: 180, w: 90, h: 16 },
  { id: 'l8', kind: 'ledge', x: 2860, y: 280, w: 100, h: 16 },
  { id: 'l9', kind: 'ledge', x: 3080, y: 160, w: 90, h: 16 },
  { id: 'l10', kind: 'ledge', x: 3480, y: 250, w: 110, h: 16 },
  { id: 'goal', kind: 'goal', x: 3980, y: GROUND_Y - 90, w: 70, h: 90 },
]

const snowEnemies = (): Enemy[] => {
  const spots: Array<[number, number, number, number]> = [
    [280, GROUND_Y - 40, 110, 140],
    [860, GROUND_Y - 40, -120, 120],
    [900, 210, 90, 70],
    [1480, GROUND_Y - 40, 130, 110],
    [1540, 280, -100, 60],
    [2060, GROUND_Y - 40, -140, 130],
    [2140, 260, 110, 70],
    [2700, GROUND_Y - 40, 150, 120],
    [2860, 240, -120, 70],
    [3300, GROUND_Y - 40, -130, 100],
    [3480, 210, 100, 70],
    [3840, GROUND_Y - 40, 140, 90],
    [1160, 130, 80, 50],
    [2420, 140, -90, 50],
  ]
  return spots.map(([x, y, vx, range], index) => {
    const enemy = patrol(`s${index}`, x, y, vx, range)
    if (index % 2 === 0) {
      enemy.kind = 'hopper'
      enemy.w = 34
      enemy.h = 36
    }
    return enemy
  })
}

const snowMountains = (): Mountain[] => [
  { amp: 34, freq: 0.008, base: 190, phase: 0.4 },
  { amp: 18, freq: 0.02, base: 240, phase: 2.1 },
]

const voidPlatforms = (): Platform[] => {
  const islands: Platform[] = []
  for (let i = 0; i < 8; i += 1) {
    const x = i * 520
    islands.push({
      id: `g${i}`,
      kind: 'ground',
      x,
      y: GROUND_Y - (i % 2) * 40,
      w: i === 7 ? WORLD_W - x : 280,
      h: 70,
    })
    islands.push({ id: `a${i}`, kind: 'ledge', x: x + 40, y: 300 - (i % 3) * 30, w: 100, h: 16 })
    islands.push({ id: `b${i}`, kind: 'ledge', x: x + 160, y: 190 - (i % 2) * 20, w: 90, h: 16 })
  }
  islands.push({ id: 'goal', kind: 'goal', x: 4040, y: 150, w: 70, h: 90 })
  return islands
}

const voidEnemies = (): Enemy[] => {
  const list: Enemy[] = []
  for (let i = 0; i < 8; i += 1) {
    const x = i * 520 + 80
    list.push(patrol(`v${i}a`, x, GROUND_Y - 80 - (i % 2) * 40, i % 2 === 0 ? 150 : -160, 90))
    const high = patrol(`v${i}b`, x + 150, 150 - (i % 2) * 20, i % 2 === 0 ? -120 : 130, 60)
    high.kind = 'hopper'
    high.w = 32
    high.h = 34
    list.push(high)
    if (i % 2 === 0) {
      const extra = patrol(`v${i}c`, x + 40, 260, 140, 50)
      extra.kind = 'hopper'
      list.push(extra)
    }
  }
  return list
}

const voidMountains = (): Mountain[] => [
  { amp: 48, freq: 0.015, base: 160, phase: 0.8 },
  { amp: 26, freq: 0.028, base: 230, phase: 3.4 },
]

export interface Stage {
  level: LevelId
  platforms: Platform[]
  enemies: Enemy[]
  theme: LevelTheme
  mountains: Mountain[]
}

export const buildStage = (level: LevelId, seed = 1): Stage => {
  if (level === 1) {
    return {
      level,
      platforms: level1Platforms(),
      enemies: level1Enemies(),
      theme: NIGHT_THEME,
      mountains: nightMountains(),
    }
  }

  if (level === 3) {
    return {
      level,
      platforms: snowPlatforms(),
      enemies: snowEnemies(),
      theme: SNOW_THEME,
      mountains: snowMountains(),
    }
  }

  if (level === 4) {
    return {
      level,
      platforms: voidPlatforms(),
      enemies: voidEnemies(),
      theme: VOID_THEME,
      mountains: voidMountains(),
    }
  }

  const rand = rng(seed)
  return {
    level,
    platforms: varyPlatforms(level1Platforms(), rand),
    enemies: varyEnemies(level1Enemies(), rand),
    theme: SUN_THEME,
    mountains: sunMountains(rand),
  }
}


