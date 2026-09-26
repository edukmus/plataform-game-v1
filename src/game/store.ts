import { create } from 'zustand'
import {
  AMMO_PACK,
  GRAVITY,
  ICE_ACCEL,
  ICE_DRAG,
  JUMP_VELOCITY,
  MAX_DIFFICULTY,
  MAX_FALL,
  MOVE_SPEED,
  PLAYER_H,
  PLAYER_W,
  SHOT_COOLDOWN,
  SHOT_SPEED,
  START_AMMO,
  START_LIVES,
  VIEW_W,
  WORLD_W,
} from './constants.ts'
import { buildStage, type Stage } from './level.ts'
import { playMusic, stopMusic } from './music.ts'
import { clamp, overlaps } from './physics.ts'
import { playEnemyDown, playJump, playLife, playPickup, playShot, playStageClear } from './sfx.ts'
import type { Difficulty, Keys, LevelId, Phase, Player, Projectile } from './types.ts'

let shotSeq = 0

const freshPlayer = (): Player => ({
  x: 80,
  y: 200,
  vx: 0,
  vy: 0,
  w: PLAYER_W,
  h: PLAYER_H,
  facing: 1,
  onGround: false,
  jumpsLeft: 1,
  invuln: 0,
  shootCd: 0,
})

export type MenuView = 'home' | 'instructions'

interface GameState {
  phase: Phase
  menuView: MenuView
  level: LevelId
  difficulty: Difficulty
  stage: Stage
  player: Player
  enemies: Stage['enemies']
  items: Stage['items']
  shots: Projectile[]
  keys: Keys
  jumpWasDown: boolean
  cameraX: number
  score: number
  lives: number
  ammo: number
  time: number
  setKey: (key: keyof Keys, down: boolean) => void
  openInstructions: () => void
  closeInstructions: () => void
  start: (level?: LevelId) => void
  next: () => void
  advanceDifficulty: () => void
  returnToMenu: () => void
  tick: (dt: number) => void
}

const opening = buildStage(1)

const beginRun = (
  set: (partial: Partial<GameState>) => void,
  level: LevelId,
  difficulty: Difficulty,
  score: number,
) => {
  const stage = buildStage(level, level === 2 ? Date.now() : 1, difficulty)
  set({
    phase: 'playing',
    menuView: 'home',
    level,
    difficulty,
    stage,
    player: freshPlayer(),
    enemies: stage.enemies,
    items: stage.items.map((item) => ({ ...item })),
    shots: [],
    cameraX: 0,
    score,
    lives: START_LIVES,
    ammo: START_AMMO,
    jumpWasDown: false,
    time: 0,
    keys: { left: false, right: false, jump: false, shoot: false },
  })
  playMusic(level)
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  menuView: 'home',
  level: 1,
  difficulty: 1,
  stage: opening,
  player: freshPlayer(),
  enemies: opening.enemies,
  items: opening.items,
  shots: [],
  jumpWasDown: false,
  keys: { left: false, right: false, jump: false, shoot: false },
  cameraX: 0,
  score: 0,
  lives: START_LIVES,
  ammo: START_AMMO,
  time: 0,

  setKey: (key, down) =>
    set((state) => ({ keys: { ...state.keys, [key]: down } })),

  openInstructions: () => {
    if (get().phase !== 'menu') return
    set({ menuView: 'instructions' })
  },

  closeInstructions: () => set({ menuView: 'home' }),

  start: (level = 1) => {
    const difficulty = get().phase === 'menu' ? 1 : get().difficulty
    beginRun(set, level, difficulty, 0)
  },

  next: () => {
    const level = Math.min(4, get().level + 1) as LevelId
    const stage = buildStage(level, Date.now(), get().difficulty)
    set({
      phase: 'playing',
      level,
      stage,
      player: freshPlayer(),
      enemies: stage.enemies,
      items: stage.items.map((item) => ({ ...item })),
      shots: [],
      cameraX: 0,
      score: get().score,
      jumpWasDown: false,
      time: 0,
      keys: { left: false, right: false, jump: false, shoot: false },
    })
    playMusic(level)
  },

  advanceDifficulty: () => {
    const difficulty = Math.min(MAX_DIFFICULTY, get().difficulty + 1) as Difficulty
    beginRun(set, 1, difficulty, 0)
  },

  returnToMenu: () => {
    const stage = buildStage(1)
    stopMusic()
    set({
      phase: 'menu',
      menuView: 'home',
      level: 1,
      difficulty: 1,
      stage,
      player: freshPlayer(),
      enemies: stage.enemies,
      items: stage.items.map((item) => ({ ...item })),
      shots: [],
      cameraX: 0,
      score: 0,
      lives: START_LIVES,
      ammo: START_AMMO,
      jumpWasDown: false,
      time: 0,
      keys: { left: false, right: false, jump: false, shoot: false },
    })
  },

  tick: (dt) => {
    const state = get()
    if (state.phase !== 'playing') return
    const { platforms } = state.stage

    const step = Math.min(dt, 0.033)
    const player = { ...state.player }
    const keys = state.keys
    let shots = state.shots.map((shot) => ({ ...shot }))
    let enemies = state.enemies.map((enemy) => ({ ...enemy }))
    const items = state.items.map((item) => ({ ...item }))
    let score = state.score
    let lives = state.lives
    let ammo = state.ammo

    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    const icy = state.level === 3
    if (dir !== 0) {
      player.facing = dir as 1 | -1
      const target = dir * MOVE_SPEED
      player.vx = icy ? player.vx + (target - player.vx) * Math.min(1, step * ICE_ACCEL) : target
    } else if (icy && player.onGround) {
      player.vx *= Math.exp(-ICE_DRAG * step)
      if (Math.abs(player.vx) < 12) player.vx = 0
    } else if (!icy) {
      player.vx = 0
    }

    const jumpPressed = keys.jump && !state.jumpWasDown
    if (jumpPressed && player.onGround) {
      player.vy = JUMP_VELOCITY
      player.onGround = false
      player.jumpsLeft = 1
      playJump()
    } else if (jumpPressed && player.jumpsLeft > 0) {
      player.vy = JUMP_VELOCITY
      player.jumpsLeft -= 1
      playJump()
    } else if (!player.onGround && player.jumpsLeft > 1) {
      player.jumpsLeft = 1
    }

    player.vy = Math.min(player.vy + GRAVITY * step, MAX_FALL)
    player.shootCd = Math.max(0, player.shootCd - step)
    player.invuln = Math.max(0, player.invuln - step)

    player.x += player.vx * step
    resolveAxis(player, 'x', platforms)
    player.y += player.vy * step
    player.onGround = false
    resolveAxis(player, 'y', platforms)

    if (player.y > 700 && lives > 0) {
      lives -= 1
      if (lives > 0) {
        player.x = 80
        player.y = 180
        player.vx = 0
        player.vy = 0
        player.onGround = false
        player.invuln = 1.6
      }
    }

    if (keys.shoot && player.shootCd <= 0 && ammo > 0) {
      ammo -= 1
      player.shootCd = SHOT_COOLDOWN
      playShot()
      const muzzleX = player.facing === 1 ? player.x + player.w : player.x - 16
      shots.push({
        id: `s${shotSeq++}`,
        x: muzzleX,
        y: player.y + 28,
        w: 16,
        h: 8,
        vx: player.facing * SHOT_SPEED,
      })
    }

    shots = shots
      .map((shot) => ({ ...shot, x: shot.x + shot.vx * step }))
      .filter((shot) => shot.x > -40 && shot.x < WORLD_W + 40)
      .filter((shot) => !platforms.some((platform) => platform.kind !== 'goal' && overlaps(shot, platform)))

    enemies = enemies.map((enemy) => {
      if (!enemy.alive) return enemy
      const next = { ...enemy, x: enemy.x + enemy.vx * step, hop: enemy.hop + step * 7 }
      if (next.x < enemy.originX - enemy.range || next.x > enemy.originX + enemy.range) {
        next.vx = -enemy.vx
        next.x = clamp(next.x, enemy.originX - enemy.range, enemy.originX + enemy.range)
      }
      next.y = enemy.kind === 'hopper' ? enemy.baseY - Math.abs(Math.sin(next.hop)) * 46 : enemy.baseY
      return next
    })

    for (const enemy of enemies) {
      if (!enemy.alive) continue
      const hit = shots.find((shot) => overlaps(shot, enemy))
      if (hit) {
        enemy.alive = false
        shots = shots.filter((shot) => shot.id !== hit.id)
        playEnemyDown()
        score += 100
      }
    }

    if (player.invuln <= 0 && lives > 0) {
      const touching = enemies.some((enemy) => enemy.alive && overlaps(player, enemy))
      if (touching) {
        lives -= 1
        player.invuln = 1.1
        player.vy = -280
        player.vx = icy ? -player.facing * 340 : -player.facing * 180
      }
    }

    for (const item of items) {
      if (item.taken || lives <= 0) continue
      const hitbox = { x: item.x - 6, y: item.baseY - 8, w: item.w + 12, h: item.h + 18 }
      if (!overlaps(player, hitbox)) continue
      item.taken = true
      if (item.kind === 'ammo') {
        ammo += AMMO_PACK
        playPickup()
      } else {
        lives += 1
        playLife()
      }
    }

    const goal = platforms.find((platform) => platform.kind === 'goal')
    const reachedGoal = goal ? overlaps(player, goal) : false
    const cameraX = clamp(player.x - VIEW_W * 0.38, 0, WORLD_W - VIEW_W)

    let phase: Phase = 'playing'
    if (lives <= 0) phase = 'lost'
    else if (reachedGoal) {
      phase = 'won'
      playStageClear()
    }

    if (phase !== 'playing') stopMusic()

    set({
      player,
      shots,
      enemies,
      items,
      score,
      lives,
      ammo,
      cameraX,
      phase,
      jumpWasDown: keys.jump,
      time: state.time + step,
    })
  },
}))

function resolveAxis(player: Player, axis: 'x' | 'y', platforms: Stage['platforms']) {
  for (const platform of platforms) {
    if (platform.kind === 'goal') continue
    if (!overlaps(player, platform)) continue

    if (axis === 'x') {
      if (player.vx > 0) player.x = platform.x - player.w
      else if (player.vx < 0) player.x = platform.x + platform.w
      player.vx = 0
    } else if (player.vy > 0 && player.y + player.h - player.vy * 0.02 <= platform.y + 8) {
      player.y = platform.y - player.h
      player.vy = 0
      player.onGround = true
      player.jumpsLeft = 2
    } else if (player.vy < 0) {
      player.y = platform.y + platform.h
      player.vy = 0
    }
  }

  player.x = clamp(player.x, 0, WORLD_W - player.w)
}
