import { useEffect, useRef } from 'react'
import headSrc from '../assets/kmus-head.png'
import { CHECKPOINT_FLASH_DURATION, GROUND_Y, VIEW_H, VIEW_W, WORLD_W } from '../game/constants.ts'
import { useGameStore } from '../game/store.ts'
import type { Checkpoint, EnemyKind, LevelTheme, Mountain, Pickup } from '../game/types.ts'

const head = new Image()
head.src = headSrc

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let frame = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      useGameStore.getState().tick(dt)
      draw(canvasRef.current)
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={VIEW_W}
      height={VIEW_H}
      className="h-auto w-full max-w-[960px] rounded-md border-4 border-cyan-300/80 shadow-[0_0_40px_rgba(34,211,238,0.35)]"
    />
  )
}

function draw(canvas: HTMLCanvasElement | null) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { player, enemies, items, checkpoints, shots, enemyShots, checkpointFlash, checkpointBanner, cameraX, phase, stage, time } = useGameStore.getState()
  const { platforms, theme, mountains } = stage

  ctx.clearRect(0, 0, VIEW_W, VIEW_H)
  drawSky(ctx, cameraX, theme, mountains)

  ctx.save()
  ctx.translate(-cameraX, 0)

  for (let x = 0; x < WORLD_W; x += 48) {
    ctx.fillStyle = x % 96 === 0 ? theme.dirtA : theme.dirtB
    ctx.fillRect(x, GROUND_Y + 18, 48, VIEW_H - GROUND_Y)
  }

  for (const platform of platforms) {
    if (platform.kind === 'goal') {
      ctx.fillStyle = '#22d3ee'
      ctx.fillRect(platform.x + 28, platform.y, 8, platform.h)
      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.moveTo(platform.x + 36, platform.y + 6)
      ctx.lineTo(platform.x + 68, platform.y + 20)
      ctx.lineTo(platform.x + 36, platform.y + 34)
      ctx.closePath()
      ctx.fill()
      continue
    }

    ctx.fillStyle = platform.kind === 'ground' ? theme.ground : theme.ledge
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h)
    ctx.fillStyle = platform.kind === 'ground' ? theme.groundTop : theme.ledgeTop
    ctx.fillRect(platform.x, platform.y, platform.w, 6)
    ctx.strokeStyle = 'rgba(8, 20, 32, 0.45)'
    ctx.strokeRect(platform.x + 0.5, platform.y + 0.5, platform.w - 1, platform.h - 1)
  }

  drawCheckpoints(ctx, checkpoints, time)

  for (const enemy of enemies) {
    if (!enemy.alive) continue
    drawMet(ctx, enemy.x, enemy.y, enemy.w, enemy.h, enemy.vx < 0, enemy.kind)
  }

  drawPickups(ctx, items, time)

  for (const shot of shots) {
    const spread = Math.abs(shot.vy) > 0
    ctx.fillStyle = spread ? '#99f6e4' : '#fef08a'
    ctx.shadowColor = spread ? '#2dd4bf' : '#facc15'
    ctx.shadowBlur = spread ? 10 : 12
    ctx.fillRect(shot.x, shot.y, shot.w, shot.h)
    ctx.shadowBlur = 0
  }

  for (const shot of enemyShots) {
    ctx.fillStyle = '#fb7185'
    ctx.shadowColor = '#f43f5e'
    ctx.shadowBlur = 10
    ctx.fillRect(shot.x, shot.y, shot.w, shot.h)
    ctx.shadowBlur = 0
  }

  drawHero(
    ctx,
    player.x,
    player.y,
    player.w,
    player.facing,
    player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0,
    player.onGround,
    player.vx,
    time,
    player.dashTime,
  )

  ctx.restore()

  drawCheckpointSignal(ctx, checkpointFlash, checkpointBanner)

  if (phase !== 'playing') {
    ctx.fillStyle = 'rgba(2, 8, 18, 0.35)'
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
}

function drawCheckpointSignal(ctx: CanvasRenderingContext2D, flash: number, banner: number) {
  if (flash > 0) {
    const alpha = Math.min(0.5, (flash / CHECKPOINT_FLASH_DURATION) * 0.5)
    ctx.fillStyle = `rgba(103, 232, 249, ${alpha})`
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }

  if (banner > 0) {
    const alpha = Math.min(1, banner / 0.35)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = 'rgba(2, 8, 23, 0.82)'
    ctx.fillRect(VIEW_W / 2 - 160, 34, 320, 36)
    ctx.strokeStyle = '#67e8f9'
    ctx.lineWidth = 2
    ctx.strokeRect(VIEW_W / 2 - 160, 34, 320, 36)
    ctx.fillStyle = '#cffafe'
    ctx.font = '900 16px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('CHECKPOINT +20 BALAS', VIEW_W / 2, 52)
    ctx.restore()
  }
}

function drawSky(ctx: CanvasRenderingContext2D, cameraX: number, theme: LevelTheme, mountains: Mountain[]) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H)
  sky.addColorStop(0, theme.sky[0])
  sky.addColorStop(0.55, theme.sky[1])
  sky.addColorStop(1, theme.sky[2])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  if (theme.snow) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    for (let i = 0; i < 42; i += 1) {
      const x = ((i * 97 - cameraX * 0.4 + i * 13) % (VIEW_W + 30)) - 10
      const y = (i * 41) % 260
      ctx.fillRect(x, y, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2)
    }
  } else if (theme.void) {
    ctx.fillStyle = '#f5d0fe'
    for (let i = 0; i < 24; i += 1) {
      const x = ((i * 151 - cameraX * 0.12) % (VIEW_W + 40)) - 20
      const y = (i * 37) % 160
      ctx.fillRect(x, y, 2, 2)
    }
  } else if (theme.sunny) {
    ctx.fillStyle = '#fef08a'
    ctx.beginPath()
    ctx.arc(VIEW_W - 110, 78, 36, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)'
    ctx.lineWidth = 3
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(VIEW_W - 110 + Math.cos(angle) * 46, 78 + Math.sin(angle) * 46)
      ctx.lineTo(VIEW_W - 110 + Math.cos(angle) * 64, 78 + Math.sin(angle) * 64)
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
    for (let i = 0; i < 28; i += 1) {
      const x = ((i * 137 - cameraX * 0.15) % (VIEW_W + 40)) - 20
      const y = (i * 53) % 180
      ctx.fillRect(x, y, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2)
    }
  }

  mountains.forEach((ridge, index) => {
    ctx.fillStyle = index === 0 ? theme.mountainFar : theme.mountain
    ctx.beginPath()
    ctx.moveTo(0, VIEW_H)
    for (let x = 0; x <= VIEW_W; x += 32) {
      const worldX = x + cameraX * (index === 0 ? 0.22 : 0.38)
      ctx.lineTo(x, ridge.base + Math.sin(worldX * ridge.freq + ridge.phase) * ridge.amp)
    }
    ctx.lineTo(VIEW_W, VIEW_H)
    ctx.closePath()
    ctx.fill()
  })
}

function drawCheckpoints(ctx: CanvasRenderingContext2D, checkpoints: Checkpoint[], time: number) {
  for (const checkpoint of checkpoints) {
    const pulse = checkpoint.active ? 0.75 + Math.sin(time * 6) * 0.25 : 0.35 + Math.sin(time * 4) * 0.08
    ctx.fillStyle = checkpoint.active ? `rgba(34, 211, 238, ${Math.max(0.2, pulse)})` : 'rgba(148, 163, 184, 0.45)'
    ctx.fillRect(checkpoint.x + 10, checkpoint.y, 6, checkpoint.h)

    ctx.fillStyle = checkpoint.active ? 'rgba(103, 232, 249, 0.88)' : 'rgba(148, 163, 184, 0.6)'
    ctx.beginPath()
    ctx.moveTo(checkpoint.x + checkpoint.w / 2, checkpoint.y + 5)
    ctx.lineTo(checkpoint.x + checkpoint.w - 2, checkpoint.y + 16)
    ctx.lineTo(checkpoint.x + checkpoint.w / 2, checkpoint.y + 27)
    ctx.lineTo(checkpoint.x + 2, checkpoint.y + 16)
    ctx.closePath()
    ctx.fill()
  }
}

function drawPickups(ctx: CanvasRenderingContext2D, items: Pickup[], time: number) {
  for (const item of items) {
    if (item.taken) continue
    const bob = Math.sin(time * 3 + item.x * 0.02) * (item.kind === 'life' ? 6 : 4)
    const y = item.baseY + bob
    ctx.save()
    if (item.kind === 'ammo') {
      ctx.fillStyle = '#f8d48a'
      ctx.fillRect(item.x + 4, y, 6, 4)
      ctx.fillStyle = '#d4a017'
      ctx.fillRect(item.x + 2, y + 4, 10, 13)
      ctx.fillStyle = '#8a5a12'
      ctx.fillRect(item.x, y + 16, 14, 4)
    } else if (item.kind === 'spread') {
      ctx.fillStyle = '#34d399'
      ctx.fillRect(item.x + 9, y + 2, 4, 14)
      ctx.fillRect(item.x + 3, y + 8, 4, 10)
      ctx.fillRect(item.x + 15, y + 8, 4, 10)
      ctx.fillStyle = '#99f6e4'
      ctx.fillRect(item.x + 8, y, 6, 4)
      ctx.fillRect(item.x + 2, y + 6, 6, 4)
      ctx.fillRect(item.x + 14, y + 6, 6, 4)
    } else if (item.kind === 'rapid') {
      ctx.fillStyle = '#f43f5e'
      ctx.fillRect(item.x + 8, y, 8, 5)
      ctx.fillStyle = '#fb7185'
      ctx.fillRect(item.x + 4, y + 5, 8, 5)
      ctx.fillRect(item.x + 10, y + 10, 8, 5)
      ctx.fillStyle = '#ffe4e6'
      ctx.fillRect(item.x + 7, y + 15, 6, 4)
    } else {
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 2
      ctx.strokeRect(item.x - 1, y - 1, item.w + 2, item.h + 2)
      if (head.complete && head.naturalWidth > 0) ctx.drawImage(head, item.x, y, item.w, item.h)
      else {
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(item.x, y, item.w, item.h)
      }
    }
    ctx.restore()
  }
}

function drawHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  facing: 1 | -1,
  hidden: boolean,
  onGround: boolean,
  vx: number,
  time: number,
  dashTime: number,
) {
  if (hidden) return

  const walking = onGround && Math.abs(vx) > 12
  const step = walking ? Math.sin(time * 11) : 0
  const bob = walking ? Math.abs(Math.sin(time * 11)) * 2 : 0
  const bodyY = y - bob

  if (dashTime > 0) {
    ctx.fillStyle = 'rgba(34, 211, 238, 0.7)'
    const trailX = vx >= 0 ? x - 24 : x + w + 2
    ctx.fillRect(trailX, bodyY + 36, 20, 12)
    ctx.fillStyle = 'rgba(103, 232, 249, 0.5)'
    ctx.fillRect(trailX + (vx >= 0 ? -14 : 14), bodyY + 39, 14, 7)
  }

  ctx.fillStyle = '#dc2626'
  ctx.fillRect(x + 8, bodyY + 30, w - 16, 24)

  ctx.fillStyle = '#991b1b'
  if (!onGround) {
    ctx.fillRect(x + w - 6, bodyY + 8, 8, 20)
    ctx.fillRect(x - 2, bodyY + 42, 8, 18)
  } else {
    ctx.fillRect(x + 2, bodyY + 32 - step * 5, 8, 14)
    ctx.fillRect(x + w - 10, bodyY + 32 + step * 5, 8, 14)
  }

  if (!onGround) {
    ctx.fillStyle = '#334155'
    ctx.fillRect(x - 6, bodyY + 50, 16, 8)
    ctx.fillRect(x + w - 10, bodyY + 50, 16, 8)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(x - 12, bodyY + 48, 8, 12)
    ctx.fillRect(x + w + 4, bodyY + 48, 8, 12)
  } else {
    const stride = step * 8
    ctx.fillStyle = '#334155'
    ctx.fillRect(x + 10 + stride, bodyY + 52, 8, 16)
    ctx.fillRect(x + w - 18 - stride, bodyY + 52, 8, 16)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(x + 8 + stride, bodyY + 64, 12, 6)
    ctx.fillRect(x + w - 20 - stride, bodyY + 64, 12, 6)
  }

  ctx.fillStyle = '#facc15'
  ctx.fillRect(facing === 1 ? x + w - 8 : x - 10, onGround ? bodyY + 38 : bodyY + 28, 18, 6)

  const headSize = 40
  const headX = x + (w - headSize) / 2
  const headY = bodyY - 2
  if (head.complete && head.naturalWidth > 0) {
    ctx.save()
    if (facing === 1) {
      ctx.translate(headX + headSize, headY)
      ctx.scale(-1, 1)
      ctx.drawImage(head, 0, 0, headSize, headSize)
    } else {
      ctx.drawImage(head, headX, headY, headSize, headSize)
    }
    ctx.restore()
  } else {
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(headX, headY, headSize, headSize)
  }
}

function drawMet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  flip: boolean,
  kind: EnemyKind,
) {
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.scale(flip ? -1 : 1, 1)
  if (kind === 'boss') {
    ctx.fillStyle = '#7f1d1d'
    ctx.fillRect(-w / 2, -h / 2 + 8, w, h - 8)
    ctx.fillStyle = '#991b1b'
    ctx.fillRect(-w / 2 + 8, -h / 2, w - 16, h - 20)
    ctx.fillStyle = '#facc15'
    ctx.fillRect(-w / 2 + 18, -h / 2 + 26, 18, 12)
    ctx.fillRect(w / 2 - 36, -h / 2 + 26, 18, 12)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(-w / 2 + 14, h / 2 - 20, w - 28, 12)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(-w / 2 + 12, -h / 2 + 52, w - 24, 12)
    ctx.restore()
    return
  }
  ctx.fillStyle = kind === 'hopper' ? '#f97316' : '#ef4444'
  ctx.beginPath()
  ctx.ellipse(0, -4, w / 2, h / 2.2, 0, Math.PI, 0)
  ctx.lineTo(w / 2 - 2, 10)
  ctx.lineTo(-w / 2 + 2, 10)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#111827'
  ctx.fillRect(-6, -2, 12, 6)
  ctx.fillStyle = kind === 'hopper' ? '#fff7ed' : '#facc15'
  ctx.fillRect(2, -1, 5, 4)
  ctx.fillStyle = kind === 'hopper' ? '#9a3412' : '#7f1d1d'
  ctx.fillRect(-10, 8, 8, 8)
  ctx.fillRect(2, 8, 8, 8)
  ctx.restore()
}
