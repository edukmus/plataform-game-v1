import { create } from 'zustand'
import {
  GRAVITY,
  ICE_ACCEL,
  ICE_DRAG,
  JUMP_VELOCITY,
  MAX_FALL,
  MAX_HP,
  MOVE_SPEED,
  PLAYER_H,
  PLAYER_W,
  SHOT_COOLDOWN,
  SHOT_SPEED,
  VIEW_W,
  WORLD_W,
} from './constants.ts'
import { buildStage, type Stage } from './level.ts'
import { clamp, overlaps } from './physics.ts'
import { playEnemyDown, playJump, playShot, playStageClear } from './sfx.ts'
import type { Keys, LevelId, Phase, Player, Projectile } from './types.ts'

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
  hp: MAX_HP,
  invuln: 0,
  shootCd: 0,
})

interface GameState {
  phase: Phase
  level: LevelId
  stage: Stage
  player: Player
  enemies: Stage['enemies']
  shots: Projectile[]
  keys: Keys
  jumpWasDown: boolean
  cameraX: number
  score: number
  time: number
  setKey: (key: keyof Keys, down: boolean) => void
  start: (level?: LevelId) => void
  next: () => void
  tick: (dt: number) => void
}

const opening = buildStage(1)

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  level: 1,
  stage: opening,
  player: freshPlayer(),
  enemies: opening.enemies,
  shots: [],
  jumpWasDown: false,
  keys: { left: false, right: false, jump: false, shoot: false },
  cameraX: 0,
  score: 0,
  time: 0,

  setKey: (key, down) =>
    set((state) => ({ keys: { ...state.keys, [key]: down } })),

  start: (level = 1) => {
    const stage = buildStage(level, level === 2 ? Date.now() : 1)
    set({
      phase: 'playing',
      level,
      stage,
      player: freshPlayer(),
      enemies: stage.enemies,
      shots: [],
      cameraX: 0,
      score: 0,
      jumpWasDown: false,
      time: 0,
      keys: { left: false, right: false, jump: false, shoot: false },
    })
  },

  next: () => {
    const level = Math.min(4, get().level + 1) as LevelId
    const stage = buildStage(level, Date.now())
    const player = freshPlayer()
    player.hp = get().player.hp
    set({
      phase: 'playing',
      level,
      stage,
      player,
      enemies: stage.enemies,
      shots: [],
      cameraX: 0,
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
    let score = state.score

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

    if (player.y > 700) player.hp = 0

    if (keys.shoot && player.shootCd <= 0) {
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

    if (player.invuln <= 0) {
      const touching = enemies.some((enemy) => enemy.alive && overlaps(player, enemy))
      if (touching) {
        player.hp -= 1
        player.invuln = 1.1
        player.vy = -280
        player.vx = icy ? -player.facing * 340 : -player.facing * 180
      }
    }

    const goal = platforms.find((platform) => platform.kind === 'goal')
    const reachedGoal = goal ? overlaps(player, goal) : false
    const cameraX = clamp(player.x - VIEW_W * 0.38, 0, WORLD_W - VIEW_W)

    let phase: Phase = 'playing'
    if (player.hp <= 0) phase = 'lost'
    else if (reachedGoal) {
      phase = 'won'
      playStageClear()
    }

    set({
      player,
      shots,
      enemies,
      score,
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
