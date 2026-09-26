export type Phase = 'menu' | 'playing' | 'won' | 'lost'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Platform extends Rect {
  id: string
  kind: 'ground' | 'ledge' | 'goal'
}

export type EnemyKind = 'patrol' | 'hopper'

export interface Enemy extends Rect {
  id: string
  vx: number
  originX: number
  range: number
  alive: boolean
  kind: EnemyKind
  hop: number
  baseY: number
}

export interface Mountain {
  amp: number
  freq: number
  base: number
  phase: number
}

export interface LevelTheme {
  sky: [string, string, string]
  mountain: string
  mountainFar: string
  ground: string
  groundTop: string
  ledge: string
  ledgeTop: string
  dirtA: string
  dirtB: string
  sunny: boolean
  snow: boolean
  void: boolean
}

export type LevelId = 1 | 2 | 3 | 4

export type Difficulty = 1 | 2 | 3

export type PickupKind = 'ammo' | 'life'

export interface Pickup extends Rect {
  id: string
  kind: PickupKind
  baseY: number
  taken: boolean
}

export interface Projectile extends Rect {
  id: string
  vx: number
}

export interface Player {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  facing: 1 | -1
  onGround: boolean
  jumpsLeft: number
  invuln: number
  shootCd: number
}

export interface Keys {
  left: boolean
  right: boolean
  jump: boolean
  shoot: boolean
}
