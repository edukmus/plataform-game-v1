import { create } from 'zustand'
import {
  AMMO_PACK,
  BOSS_SHOT_TTL,
  CHECKPOINT_AMMO_REFILL,
  CHECKPOINT_BANNER_DURATION,
  CHECKPOINT_FLASH_DURATION,
  CHECKPOINT_RESPAWN_INVULN,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  GRAVITY,
  ICE_ACCEL,
  ICE_DRAG,
  JUMP_VELOCITY,
  MAX_DIFFICULTY,
  MAX_FALL,
  MOVE_SPEED,
  PLAYER_H,
  PLAYER_W,
  RAPID_COOLDOWN_FACTOR,
  RAPID_DURATION,
  SHOT_COOLDOWN,
  SHOT_SPEED,
  SPREAD_DURATION,
  START_AMMO,
  START_LIVES,
  VIEW_W,
  WORLD_W,
} from './constants.ts'
import { buildStage, type Stage } from './level.ts'
import { playMusic, stopMusic } from './music.ts'
import { clamp, overlaps } from './physics.ts'
import {
  playBossHit,
  playBossShot,
  playCheckpoint,
  playDash,
  playEnemyDown,
  playJump,
  playLife,
  playPickup,
  playPowerRapid,
  playPowerSpread,
  playShot,
  playStageClear,
} from './sfx.ts'
import type { Difficulty, EnemyShot, Keys, LevelId, Phase, Player, Projectile } from './types.ts'

let shotSeq = 0
let enemyShotSeq = 0

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
  dashCd: 0,
  dashTime: 0,
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
  checkpoints: Stage['checkpoints']
  checkpointIndex: number
  shots: Projectile[]
  enemyShots: EnemyShot[]
  keys: Keys
  jumpWasDown: boolean
  dashWasDown: boolean
  cameraX: number
  score: number
  lives: number
  ammo: number
  spreadTimer: number
  rapidTimer: number
  bossShotCd: number
  checkpointFlash: number
  checkpointBanner: number
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

const startAmmoForDifficulty = (difficulty: Difficulty) =>
  difficulty === 1 ? START_AMMO + 6 : difficulty === 2 ? START_AMMO : Math.max(18, START_AMMO - 4)

const ammoPackForDifficulty = (difficulty: Difficulty) =>
  difficulty === 1 ? AMMO_PACK + 3 : difficulty === 2 ? AMMO_PACK : Math.max(10, AMMO_PACK - 3)

const hitInvulnForDifficulty = (difficulty: Difficulty) =>
  difficulty === 1 ? 1.25 : difficulty === 2 ? 1.05 : 0.9

const spreadDurationForDifficulty = (difficulty: Difficulty) =>
  difficulty === 1 ? SPREAD_DURATION + 1 : difficulty === 2 ? SPREAD_DURATION : Math.max(6.5, SPREAD_DURATION - 1)

const rapidDurationForDifficulty = (difficulty: Difficulty) =>
  difficulty === 1 ? RAPID_DURATION + 0.9 : difficulty === 2 ? RAPID_DURATION : Math.max(5.8, RAPID_DURATION - 0.8)

const bossShotCooldownForDifficulty = (difficulty: Difficulty) =>
  difficulty === 1 ? 1.85 : difficulty === 2 ? 1.45 : 1.15

const bossShotSpeedForDifficulty = (difficulty: Difficulty) =>
  difficulty === 1 ? 320 : difficulty === 2 ? 380 : 440

function getRespawnPoint(player: Player, checkpoints: Stage['checkpoints'], checkpointIndex: number) {
  const checkpoint = checkpointIndex >= 0 ? checkpoints[checkpointIndex] : undefined
  if (!checkpoint) return { x: 80, y: 180 }
  return {
    x: checkpoint.x + checkpoint.w / 2 - player.w / 2,
    y: checkpoint.y + checkpoint.h - player.h,
  }
}

function applyRespawn(player: Player, x: number, y: number) {
  player.x = x
  player.y = y
  player.vx = 0
  player.vy = 0
  player.onGround = false
  player.jumpsLeft = 1
  player.dashTime = 0
}

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
    checkpoints: stage.checkpoints.map((checkpoint) => ({ ...checkpoint, active: false })),
    checkpointIndex: -1,
    shots: [],
    enemyShots: [],
    cameraX: 0,
    score,
    lives: START_LIVES,
    ammo: startAmmoForDifficulty(difficulty),
    spreadTimer: 0,
    rapidTimer: 0,
    bossShotCd: bossShotCooldownForDifficulty(difficulty) * 0.75,
    checkpointFlash: 0,
    checkpointBanner: 0,
    jumpWasDown: false,
    dashWasDown: false,
    time: 0,
    keys: { left: false, right: false, jump: false, shoot: false, dash: false },
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
  checkpoints: opening.checkpoints,
  checkpointIndex: -1,
  shots: [],
  enemyShots: [],
  jumpWasDown: false,
  dashWasDown: false,
  keys: { left: false, right: false, jump: false, shoot: false, dash: false },
  cameraX: 0,
  score: 0,
  lives: START_LIVES,
  ammo: startAmmoForDifficulty(1),
  spreadTimer: 0,
  rapidTimer: 0,
  bossShotCd: bossShotCooldownForDifficulty(1),
  checkpointFlash: 0,
  checkpointBanner: 0,
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
      checkpoints: stage.checkpoints.map((checkpoint) => ({ ...checkpoint, active: false })),
      checkpointIndex: -1,
      shots: [],
      enemyShots: [],
      cameraX: 0,
      score: get().score,
      spreadTimer: 0,
      rapidTimer: 0,
      bossShotCd: bossShotCooldownForDifficulty(get().difficulty) * 0.75,
      checkpointFlash: 0,
      checkpointBanner: 0,
      jumpWasDown: false,
      dashWasDown: false,
      time: 0,
      keys: { left: false, right: false, jump: false, shoot: false, dash: false },
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
      checkpoints: stage.checkpoints.map((checkpoint) => ({ ...checkpoint, active: false })),
      checkpointIndex: -1,
      shots: [],
      enemyShots: [],
      cameraX: 0,
      score: 0,
      lives: START_LIVES,
      ammo: startAmmoForDifficulty(1),
      spreadTimer: 0,
      rapidTimer: 0,
      bossShotCd: bossShotCooldownForDifficulty(1),
      checkpointFlash: 0,
      checkpointBanner: 0,
      jumpWasDown: false,
      dashWasDown: false,
      time: 0,
      keys: { left: false, right: false, jump: false, shoot: false, dash: false },
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
    let enemyShots = state.enemyShots.map((shot) => ({ ...shot }))
    let enemies = state.enemies.map((enemy) => ({ ...enemy }))
    const items = state.items.map((item) => ({ ...item }))
    const checkpoints = state.checkpoints.map((checkpoint) => ({ ...checkpoint }))
    let checkpointIndex = state.checkpointIndex
    let score = state.score
    let lives = state.lives
    let ammo = state.ammo
    let spreadTimer = Math.max(0, state.spreadTimer - step)
    let rapidTimer = Math.max(0, state.rapidTimer - step)
    let bossShotCd = Math.max(0, state.bossShotCd - step)
    let checkpointFlash = Math.max(0, state.checkpointFlash - step)
    let checkpointBanner = Math.max(0, state.checkpointBanner - step)

    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    const icy = state.level === 3
    const dashPressed = keys.dash && !state.dashWasDown

    player.shootCd = Math.max(0, player.shootCd - step)
    player.invuln = Math.max(0, player.invuln - step)
    player.dashCd = Math.max(0, player.dashCd - step)
    player.dashTime = Math.max(0, player.dashTime - step)

    if (dashPressed && player.dashCd <= 0) {
      if (dir !== 0) player.facing = dir as 1 | -1
      player.dashCd = DASH_COOLDOWN
      player.dashTime = DASH_DURATION
      player.vx = player.facing * DASH_SPEED
      playDash()
    }

    if (player.dashTime > 0) {
      player.vx = player.facing * DASH_SPEED
    } else if (dir !== 0) {
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

    player.x += player.vx * step
    resolveAxis(player, 'x', platforms)
    player.y += player.vy * step
    player.onGround = false
    resolveAxis(player, 'y', platforms)

    const previousCheckpointIndex = checkpointIndex
    for (let index = 0; index < checkpoints.length; index += 1) {
      const checkpoint = checkpoints[index]
      if (checkpoint.active) continue
      const trigger = { x: checkpoint.x - 10, y: checkpoint.y - 12, w: checkpoint.w + 20, h: checkpoint.h + 24 }
      if (!overlaps(player, trigger)) continue
      checkpoint.active = true
      checkpointIndex = index
      if (checkpointIndex > previousCheckpointIndex) {
        ammo += CHECKPOINT_AMMO_REFILL
        checkpointFlash = CHECKPOINT_FLASH_DURATION
        checkpointBanner = CHECKPOINT_BANNER_DURATION
      }
      playCheckpoint()
    }
    if (checkpointIndex >= 0) {
      for (let index = 0; index <= checkpointIndex; index += 1) {
        checkpoints[index].active = true
      }
    }

    if (player.y > 700 && lives > 0) {
      lives -= 1
      if (lives > 0) {
        const respawn = getRespawnPoint(player, checkpoints, checkpointIndex)
        applyRespawn(player, respawn.x, respawn.y)
        player.invuln = CHECKPOINT_RESPAWN_INVULN
      }
    }

    if (keys.shoot && player.shootCd <= 0 && ammo > 0) {
      ammo -= 1
      player.shootCd = SHOT_COOLDOWN * (rapidTimer > 0 ? RAPID_COOLDOWN_FACTOR : 1)
      playShot()
      const muzzleX = player.facing === 1 ? player.x + player.w : player.x - 16
      const pattern = spreadTimer > 0 ? [-180, 0, 180] : [0]
      for (const vy of pattern) {
        shots.push({
          id: `s${shotSeq++}`,
          x: muzzleX,
          y: player.y + 28 + vy * 0.01,
          w: 16,
          h: 8,
          vx: player.facing * SHOT_SPEED,
          vy,
        })
      }
    }

    shots = shots
      .map((shot) => ({ ...shot, x: shot.x + shot.vx * step, y: shot.y + shot.vy * step }))
      .filter((shot) => shot.x > -40 && shot.x < WORLD_W + 40 && shot.y > -80 && shot.y < 760)
      .filter((shot) => !platforms.some((platform) => platform.kind !== 'goal' && overlaps(shot, platform)))

    enemies = enemies.map((enemy) => {
      if (!enemy.alive) return enemy
      const burst = enemy.kind === 'boss' ? 1 + Math.max(0, Math.sin(enemy.hop * 0.9)) * 0.45 : 1
      const hopSpeed = enemy.kind === 'boss' ? 3.4 : 7
      const next = { ...enemy, x: enemy.x + enemy.vx * step * burst, hop: enemy.hop + step * hopSpeed }
      if (next.x < enemy.originX - enemy.range || next.x > enemy.originX + enemy.range) {
        next.vx = -enemy.vx
        next.x = clamp(next.x, enemy.originX - enemy.range, enemy.originX + enemy.range)
      }
      next.y =
        enemy.kind === 'hopper'
          ? enemy.baseY - Math.abs(Math.sin(next.hop)) * 46
          : enemy.kind === 'boss'
            ? enemy.baseY - Math.abs(Math.sin(next.hop * 1.3)) * 14
            : enemy.baseY
      return next
    })

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.kind !== 'boss' || bossShotCd > 0) continue
      const sx = enemy.x + enemy.w / 2
      const sy = enemy.y + enemy.h * 0.48
      const tx = player.x + player.w / 2
      const ty = player.y + player.h * 0.45
      const dx = tx - sx
      const dy = ty - sy
      const dist = Math.max(1, Math.hypot(dx, dy))
      const speed = bossShotSpeedForDifficulty(state.difficulty)
      enemyShots.push({
        id: `b${enemyShotSeq++}`,
        x: sx - 7,
        y: sy - 7,
        w: 14,
        h: 14,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        ttl: BOSS_SHOT_TTL,
      })
      playBossShot()
      bossShotCd = bossShotCooldownForDifficulty(state.difficulty)
      break
    }

    enemyShots = enemyShots
      .map((shot) => ({ ...shot, x: shot.x + shot.vx * step, y: shot.y + shot.vy * step, ttl: shot.ttl - step }))
      .filter((shot) => shot.ttl > 0 && shot.x > -80 && shot.x < WORLD_W + 80 && shot.y > -120 && shot.y < 760)
      .filter((shot) => !platforms.some((platform) => platform.kind !== 'goal' && overlaps(shot, platform)))

    for (const enemy of enemies) {
      if (!enemy.alive) continue
      const hit = shots.find((shot) => overlaps(shot, enemy))
      if (!hit) continue
      shots = shots.filter((shot) => shot.id !== hit.id)
      if (enemy.kind === 'boss') {
        enemy.hp = Math.max(0, enemy.hp - 1)
        if (enemy.hp <= 0) {
          enemy.alive = false
          playEnemyDown()
          score += 1500
        } else {
          playBossHit()
          score += 35
        }
      } else {
        enemy.hp = 0
        enemy.alive = false
        playEnemyDown()
        score += 100
      }
    }

    if (player.dashTime > 0) {
      for (const enemy of enemies) {
        if (!enemy.alive || !overlaps(player, enemy)) continue
        if (enemy.kind === 'boss') {
          enemy.hp = Math.max(0, enemy.hp - 2)
          player.dashTime = 0
          player.vx = -player.facing * 220
          player.vy = -120
          if (enemy.hp <= 0) {
            enemy.alive = false
            playEnemyDown()
            score += 1500
          } else {
            playBossHit()
            score += 70
          }
          break
        }
        enemy.hp = 0
        enemy.alive = false
        playEnemyDown()
        score += 100
      }
    }

    if (player.invuln <= 0 && lives > 0) {
      const hitByBossShot = enemyShots.find((shot) => overlaps(shot, player))
      if (hitByBossShot) {
        enemyShots = enemyShots.filter((shot) => shot.id !== hitByBossShot.id)
        lives -= 1
        if (lives > 0) {
          const respawn = getRespawnPoint(player, checkpoints, checkpointIndex)
          applyRespawn(player, respawn.x, respawn.y)
          player.invuln = Math.max(0.8, hitInvulnForDifficulty(state.difficulty) - 0.1)
        }
      }
    }

    if (player.invuln <= 0 && lives > 0) {
      const touching = enemies.find((enemy) => enemy.alive && overlaps(player, enemy))
      if (touching) {
        lives -= 1
        if (lives > 0) {
          const respawn = getRespawnPoint(player, checkpoints, checkpointIndex)
          applyRespawn(player, respawn.x, respawn.y)
          player.invuln = hitInvulnForDifficulty(state.difficulty)
        }
      }
    }

    const ammoGain = ammoPackForDifficulty(state.difficulty)
    for (const item of items) {
      if (item.taken || lives <= 0) continue
      const hitbox = { x: item.x - 6, y: item.baseY - 8, w: item.w + 12, h: item.h + 18 }
      if (!overlaps(player, hitbox)) continue
      item.taken = true
      if (item.kind === 'ammo') {
        ammo += ammoGain
        playPickup()
      } else if (item.kind === 'life') {
        lives += 1
        playLife()
      } else if (item.kind === 'spread') {
        spreadTimer = spreadDurationForDifficulty(state.difficulty)
        rapidTimer = Math.max(0, rapidTimer - 0.8)
        playPowerSpread()
      } else {
        rapidTimer = rapidDurationForDifficulty(state.difficulty)
        spreadTimer = Math.max(0, spreadTimer - 0.6)
        playPowerRapid()
      }
    }

    const goal = platforms.find((platform) => platform.kind === 'goal')
    const reachedGoal = goal ? overlaps(player, goal) : false
    const bossAlive = enemies.some((enemy) => enemy.kind === 'boss' && enemy.alive)
    const canFinish = reachedGoal && !bossAlive
    const cameraX = clamp(player.x - VIEW_W * 0.38, 0, WORLD_W - VIEW_W)

    let phase: Phase = 'playing'
    if (lives <= 0) phase = 'lost'
    else if (canFinish) {
      phase = 'won'
      playStageClear()
    }

    if (phase !== 'playing') stopMusic()

    set({
      player,
      shots,
      enemies,
      items,
      checkpoints,
      checkpointIndex,
      score,
      lives,
      ammo,
      enemyShots,
      spreadTimer,
      rapidTimer,
      bossShotCd,
      checkpointFlash,
      checkpointBanner,
      cameraX,
      phase,
      jumpWasDown: keys.jump,
      dashWasDown: keys.dash,
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
