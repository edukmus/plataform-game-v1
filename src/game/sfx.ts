let ctx: AudioContext | null = null

function audio(): AudioContext | null {
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
  const ac = audio()
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
