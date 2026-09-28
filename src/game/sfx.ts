let ctx: AudioContext | null = null

export function getAudioContext(): AudioContext | null {
  const AC = window.AudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  slideTo?: number,
) {
  const ac = getAudioContext()
  if (!ac) return

  const t = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration)

  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

export function playShot() {
  tone(880, 0.08, 'square', 0.1, 220)
}

export function playJump() {
  tone(420, 0.1, 'square', 0.08, 860)
}

export function playDash() {
  tone(180, 0.06, 'sawtooth', 0.085, 620)
}

export function playStageClear() {
  const notes = [523, 659, 784, 1046]
  notes.forEach((freq, index) => {
    window.setTimeout(() => tone(freq, 0.18, 'square', 0.09), index * 130)
  })
}

export function playEnemyDown() {
  tone(220, 0.06, 'square', 0.12, 90)
  window.setTimeout(() => tone(140, 0.14, 'triangle', 0.1, 50), 50)
}

export function playPickup() {
  tone(740, 0.07, 'square', 0.07, 1180)
}

export function playCheckpoint() {
  tone(520, 0.07, 'triangle', 0.06, 760)
}

export function playPowerSpread() {
  tone(680, 0.09, 'sawtooth', 0.07, 980)
  window.setTimeout(() => tone(860, 0.08, 'square', 0.06, 1280), 60)
}

export function playPowerRapid() {
  tone(610, 0.08, 'square', 0.06, 1180)
  window.setTimeout(() => tone(420, 0.06, 'triangle', 0.05, 940), 70)
}

export function playBossHit() {
  tone(160, 0.05, 'square', 0.1, 120)
}

export function playBossShot() {
  tone(240, 0.08, 'triangle', 0.07, 150)
}

export function playLife() {
  tone(523, 0.1, 'triangle', 0.08, 784)
  window.setTimeout(() => tone(1046, 0.14, 'triangle', 0.07), 90)
}
