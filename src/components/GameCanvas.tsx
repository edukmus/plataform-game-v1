import { useEffect, useRef } from 'react'
import headSrc from '../assets/kmus-head.png'
import { GROUND_Y, VIEW_H, VIEW_W, WORLD_W } from '../game/constants.ts'
import { useGameStore } from '../game/store.ts'
import type { LevelTheme, Mountain, Pickup } from '../game/types.ts'

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

  const { player, enemies, items, shots, cameraX, phase, stage, time } = useGameStore.getState()
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

  for (const enemy of enemies) {
    if (!enemy.alive) continue
    drawMet(ctx, enemy.x, enemy.y, enemy.w, enemy.h, enemy.vx < 0, enemy.kind)
  }

  drawPickups(ctx, items, time)

  for (const shot of shots) {
    ctx.fillStyle = '#fef08a'
    ctx.shadowColor = '#facc15'
    ctx.shadowBlur = 12
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
    useGameStore.getState().time,
  )

  ctx.restore()

  if (phase !== 'playing') {
    ctx.fillStyle = 'rgba(2, 8, 18, 0.35)'
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
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
) {
  if (hidden) return

  const walking = onGround && Math.abs(vx) > 12
  const step = walking ? Math.sin(time * 11) : 0
  const bob = walking ? Math.abs(Math.sin(time * 11)) * 2 : 0
  const bodyY = y - bob

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
  kind: 'patrol' | 'hopper',
) {
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.scale(flip ? -1 : 1, 1)
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
