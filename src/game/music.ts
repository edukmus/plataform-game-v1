import { getAudioContext } from './sfx.ts'
import type { LevelId } from './types.ts'

type Cell = string
type Bar = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell]
type Token = string | null
type DrumStyle = 'march' | 'bounce' | 'ice' | 'drive'

interface Track {
  bpm: number
  swing: number
  filter: number
  lead: Token[]
  bass: Token[]
  ping: Token[] | null
  leadType: OscillatorType
  bassType: OscillatorType
  leadGain: number
  bassGain: number
  pingGain: number
  leadGate: number
  bassGate: number
  detune: number
  tremolo: number
  drum: DrumStyle
  drumGain: number
}

const SEMI: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

const BUS_GAIN = 0.78

function bars(rows: Bar[]): Token[] {
  return rows.flat().map((token) => (token === '-' ? null : token))
}

function freq(note: string): number {
  const match = /^([A-G](?:#|b)?)(\d)$/.exec(note)
  const semi = match ? SEMI[match[1]] : undefined
  if (!match || semi === undefined) throw new Error(`Nota invalida: ${note}`)
  const midi = (Number(match[2]) + 1) * 12 + semi
  return 440 * 2 ** ((midi - 69) / 12)
}

function track(options: {
  bpm: number
  lead: Bar[]
  bass: Bar[]
  ping?: Bar[]
  leadType?: OscillatorType
  bassType?: OscillatorType
  leadGain?: number
  bassGain?: number
  pingGain?: number
  leadGate?: number
  bassGate?: number
  filter?: number
  swing?: number
  detune?: number
  tremolo?: number
  drum: DrumStyle
  drumGain?: number
}): Track {
  const song: Track = {
    bpm: options.bpm,
    swing: options.swing ?? 0,
    filter: options.filter ?? 2400,
    lead: bars(options.lead),
    bass: bars(options.bass),
    ping: options.ping ? bars(options.ping) : null,
    leadType: options.leadType ?? 'square',
    bassType: options.bassType ?? 'triangle',
    leadGain: options.leadGain ?? 0.05,
    bassGain: options.bassGain ?? 0.055,
    pingGain: options.pingGain ?? 0.03,
    leadGate: options.leadGate ?? 0.7,
    bassGate: options.bassGate ?? 0.82,
    detune: options.detune ?? 0,
    tremolo: options.tremolo ?? 0,
    drum: options.drum,
    drumGain: options.drumGain ?? 1,
  }
  const length = song.lead.length
  if (song.bass.length !== length || (song.ping && song.ping.length !== length)) {
    throw new Error('Las pistas del nivel no tienen la misma duracion')
  }
  for (const note of [...song.lead, ...song.bass, ...(song.ping ?? [])]) {
    if (note && note !== '~') freq(note)
  }
  return song
}

const TRACKS: Record<LevelId, Track> = {
  1: track({
    bpm: 108,
    filter: 2300,
    leadGate: 0.72,
    drum: 'march',
    lead: [
      ['E4', '-', 'A4', 'C5', 'E5', '-', 'C5', 'A4'],
      ['G4', '-', 'E4', 'G4', 'A4', '-', 'G4', 'E4'],
      ['F4', '-', 'A4', 'C5', 'F5', '-', 'C5', 'A4'],
      ['G4', '-', 'B4', 'D5', 'E5', '-', 'D5', 'B4'],
      ['E4', '-', 'A4', 'C5', 'E5', '-', 'C5', 'A4'],
      ['G4', '-', 'A4', 'C5', 'E5', '-', 'D5', 'C5'],
      ['D5', '-', 'C5', 'B4', 'A4', '-', 'G4', 'E4'],
      ['A4', '-', '-', '-', 'E4', '-', '-', '-'],
    ],
    bass: [
      ['A2', '-', 'E2', '-', 'A2', '-', 'E2', '-'],
      ['A2', '-', 'E2', '-', 'A2', '-', 'G2', '-'],
      ['F2', '-', 'C2', '-', 'F2', '-', 'C2', '-'],
      ['G2', '-', 'D2', '-', 'G2', '-', 'D2', '-'],
      ['A2', '-', 'E2', '-', 'A2', '-', 'E2', '-'],
      ['F2', '-', 'C2', '-', 'F2', '-', 'E2', '-'],
      ['G2', '-', 'D2', '-', 'E2', '-', 'G2', '-'],
      ['A2', '-', 'E2', '-', 'A2', '-', '-', '-'],
    ],
  }),
  2: track({
    bpm: 136,
    filter: 3600,
    swing: 0.08,
    leadGate: 0.34,
    bassGate: 0.5,
    leadGain: 0.046,
    drum: 'bounce',
    lead: [
      ['G4', '-', 'B4', 'D5', 'G5', '-', 'D5', 'B4'],
      ['E5', '-', 'C5', 'E5', 'D5', '-', 'B4', 'G4'],
      ['A4', '-', 'D5', 'F#5', 'A5', '-', 'F#5', 'D5'],
      ['G5', '-', 'D5', 'B4', 'G4', '-', '-', '-'],
      ['D5', '-', 'G5', 'B5', 'D6', '-', 'B5', 'G5'],
      ['C5', 'E5', 'G5', 'C6', '-', 'E5', 'C5', '-'],
      ['A4', '-', 'F#5', '-', 'D5', '-', 'C5', 'B4'],
      ['G4', '-', 'B4', '-', 'D5', '-', 'G5', '-'],
    ],
    bass: [
      ['G2', '-', 'D2', '-', 'G2', '-', 'D2', '-'],
      ['C2', '-', 'G2', '-', 'C2', '-', 'E2', '-'],
      ['D2', '-', 'A2', '-', 'D2', '-', 'A2', '-'],
      ['G2', '-', 'D2', '-', 'G2', '-', 'B2', '-'],
      ['G2', '-', 'D2', '-', 'G2', '-', 'D2', '-'],
      ['C2', '-', 'G2', '-', 'C2', '-', 'E2', '-'],
      ['D2', '-', 'A2', '-', 'D2', '-', 'F#2', '-'],
      ['G2', '-', 'D2', '-', 'G2', '-', '-', '-'],
    ],
  }),
  3: track({
    bpm: 76,
    filter: 6200,
    leadType: 'sine',
    leadGain: 0.075,
    bassGain: 0.06,
    leadGate: 0.96,
    bassGate: 0.92,
    tremolo: 0.018,
    drum: 'ice',
    drumGain: 0.5,
    pingGain: 0.034,
    lead: [
      ['B5', '~', '~', '~', 'D6', '~', '~', '~'],
      ['F#5', '~', '~', '~', 'E5', '~', '~', '~'],
      ['D5', '~', '~', '~', 'F#5', '~', 'A5', '~'],
      ['B5', '~', '~', '~', '~', '~', '~', '~'],
      ['A5', '~', '~', '~', 'F#5', '~', '~', '~'],
      ['E5', '~', '~', '~', 'D5', '~', 'F#5', '~'],
      ['A5', '~', '~', '~', 'E5', '~', '~', '~'],
      ['B5', '~', '~', '~', '~', '~', '~', '~'],
    ],
    bass: [
      ['B2', '~', '~', '~', 'F#3', '~', '~', '~'],
      ['B2', '~', '~', '~', 'F#3', '~', '~', '~'],
      ['G2', '~', '~', '~', 'D3', '~', '~', '~'],
      ['B2', '~', '~', '~', 'F#3', '~', '~', '~'],
      ['E2', '~', '~', '~', 'B2', '~', '~', '~'],
      ['F#2', '~', '~', '~', 'C#3', '~', '~', '~'],
      ['G2', '~', '~', '~', 'D3', '~', '~', '~'],
      ['B2', '~', '~', '~', '~', '~', '~', '~'],
    ],
    ping: [
      ['-', '-', '-', 'F#6', '-', '-', '-', '-'],
      ['-', '-', 'D6', '-', '-', '-', '-', 'A6'],
      ['-', '-', '-', '-', 'E6', '-', '-', '-'],
      ['-', 'B5', '-', '-', '-', '-', 'F#6', '-'],
      ['-', '-', 'A5', '-', '-', '-', '-', '-'],
      ['-', '-', '-', 'D6', '-', '-', 'E6', '-'],
      ['-', '-', '-', '-', 'F#6', '-', '-', '-'],
      ['-', '-', 'B5', '-', '-', '-', '-', '-'],
    ],
  }),
  4: track({
    bpm: 122,
    filter: 1680,
    bassType: 'square',
    leadGain: 0.044,
    bassGain: 0.032,
    leadGate: 0.4,
    bassGate: 0.58,
    detune: 14,
    drum: 'drive',
    drumGain: 1.05,
    lead: [
      ['F#4', '-', 'C#5', '-', 'E5', '-', 'C#5', '-'],
      ['A4', '-', 'F#4', '-', 'E4', '-', 'C#4', '-'],
      ['D4', '-', 'F#4', '-', 'A4', '-', 'D5', '-'],
      ['C#5', '-', 'B4', '-', 'A4', '-', 'G#4', '-'],
      ['F#4', 'C#5', 'A4', 'F#5', 'E5', 'C#5', 'A4', 'E4'],
      ['D5', '-', 'A4', '-', 'F#4', '-', 'A4', '-'],
      ['G#4', '-', 'A4', '-', 'B4', '-', 'C#5', '-'],
      ['F#4', '-', 'C#5', '-', 'F#5', '-', '-', '-'],
    ],
    bass: [
      ['F#2', 'C#3', 'F#2', 'C#3', 'F#2', 'C#3', 'F#2', 'C#3'],
      ['F#2', 'C#3', 'F#2', 'C#3', 'F#2', 'C#3', 'F#2', 'C#3'],
      ['D2', 'A2', 'D2', 'A2', 'D2', 'A2', 'D2', 'A2'],
      ['C#2', 'G#2', 'C#2', 'G#2', 'C#2', 'G#2', 'C#2', 'G#2'],
      ['F#2', 'C#3', 'F#2', 'C#3', 'F#2', 'C#3', 'A2', 'C#3'],
      ['B2', 'F#2', 'B2', 'F#2', 'B2', 'F#2', 'B2', 'F#2'],
      ['C#2', 'G#2', 'C#2', 'G#2', 'E2', 'B2', 'E2', 'B2'],
      ['F#2', 'C#3', 'F#2', 'C#3', 'F#2', '-', '-', '-'],
    ],
  }),
}

let noise: AudioBuffer | null = null
let generation = 0
let timer = 0
let step = 0
let nextTime = 0
let currentBus: GainNode | null = null

function noiseBuffer(ac: AudioContext) {
  if (noise && noise.sampleRate === ac.sampleRate) return noise
  const length = Math.floor(ac.sampleRate * 0.3)
  noise = ac.createBuffer(1, length, ac.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  return noise
}

function fadeOutCurrent() {
  if (!currentBus) return
  const dying = currentBus
  const now = dying.context.currentTime
  dying.gain.cancelScheduledValues(now)
  dying.gain.setValueAtTime(Math.max(dying.gain.value, 0.0001), now)
  dying.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
  window.setTimeout(() => dying.disconnect(), 220)
  currentBus = null
}

function makeBus(ac: AudioContext, cutoff: number) {
  const gain = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  gain.gain.setValueAtTime(0.0001, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(BUS_GAIN, ac.currentTime + 0.1)
  gain.connect(filter)
  filter.connect(ac.destination)
  return gain
}

function voice(
  ac: AudioContext,
  dest: AudioNode,
  time: number,
  frequency: number,
  duration: number,
  type: OscillatorType,
  peak: number,
  detune: number,
  tremolo: number,
) {
  const gain = ac.createGain()
  const attack = Math.min(0.018, duration * 0.22)
  const end = time + Math.max(duration, attack + 0.03)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), time + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  gain.connect(dest)

  const startOsc = (cents: number) => {
    const osc = ac.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, time)
    if (cents) osc.detune.setValueAtTime(cents, time)
    osc.connect(gain)
    osc.start(time)
    osc.stop(end + 0.02)
  }

  startOsc(0)
  if (detune) startOsc(detune)
  if (tremolo > 0 && duration > 0.28) {
    const lfo = ac.createOscillator()
    const depth = ac.createGain()
    lfo.frequency.value = 4.5
    depth.gain.value = tremolo
    lfo.connect(depth)
    depth.connect(gain.gain)
    lfo.start(time)
    lfo.stop(end + 0.02)
  }
}

function kick(ac: AudioContext, dest: AudioNode, time: number, peak: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(148, time)
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.11)
  gain.gain.setValueAtTime(peak, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(time)
  osc.stop(time + 0.18)
}

function noiseHit(ac: AudioContext, dest: AudioNode, time: number, peak: number, snare: boolean) {
  const src = ac.createBufferSource()
  const filter = ac.createBiquadFilter()
  const gain = ac.createGain()
  const duration = snare ? 0.12 : 0.035
  src.buffer = noiseBuffer(ac)
  filter.type = snare ? 'bandpass' : 'highpass'
  filter.frequency.value = snare ? 1700 : 7200
  gain.gain.setValueAtTime(peak, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  src.start(time)
  src.stop(time + duration + 0.02)
}

function drumHit(style: DrumStyle, beat: number, index: number) {
  if (style === 'ice') {
    return { kick: beat === 0, hat: beat === 2 || beat === 5, snare: false }
  }
  if (style === 'bounce') {
    return { kick: beat === 0 || beat === 3 || beat === 4, hat: beat % 2 === 1, snare: beat === 2 || beat === 6 }
  }
  if (style === 'drive') {
    return {
      kick: beat === 0 || beat === 3 || beat === 4 || (index % 16 === 14),
      hat: beat % 2 === 1,
      snare: beat === 2 || beat === 6,
    }
  }
  return { kick: beat === 0 || beat === 4, hat: true, snare: beat === 2 || beat === 6 }
}

function sustainLength(notes: Token[], index: number) {
  let length = 1
  while (index + length < notes.length && notes[index + length] === '~') length += 1
  return length
}

function scheduleVoice(
  ac: AudioContext,
  dest: AudioNode,
  notes: Token[],
  index: number,
  time: number,
  stepDur: number,
  type: OscillatorType,
  peak: number,
  gate: number,
  detune: number,
  tremolo: number,
) {
  const note = notes[index]
  if (!note || note === '~') return
  const held = sustainLength(notes, index)
  const duration = stepDur * held * (held > 1 ? 0.94 : gate)
  voice(ac, dest, time, freq(note), duration, type, peak, detune, tremolo)
}

function scheduleStep(ac: AudioContext, song: Track, index: number, time: number, stepDur: number, dest: AudioNode) {
  const when = time + (index % 2 === 1 ? stepDur * song.swing : 0)
  scheduleVoice(ac, dest, song.lead, index, when, stepDur, song.leadType, song.leadGain, song.leadGate, song.detune, song.tremolo)
  scheduleVoice(ac, dest, song.bass, index, when, stepDur, song.bassType, song.bassGain, song.bassGate, 0, 0)
  if (song.ping) scheduleVoice(ac, dest, song.ping, index, when, stepDur, 'sine', song.pingGain, 0.16, 0, 0)

  const hit = drumHit(song.drum, index % 8, index)
  if (hit.kick) kick(ac, dest, when, 0.072 * song.drumGain)
  if (hit.snare) noiseHit(ac, dest, when, 0.038 * song.drumGain, true)
  if (hit.hat) noiseHit(ac, dest, when, (hit.snare ? 0.012 : 0.02) * song.drumGain, false)
}

function pump(token: number, song: Track, dest: GainNode) {
  const ac = getAudioContext()
  if (!ac || token !== generation) return
  if (nextTime < ac.currentTime - 0.04) nextTime = ac.currentTime + 0.04
  const stepDur = 60 / song.bpm / 2
  while (nextTime < ac.currentTime + 0.16) {
    scheduleStep(ac, song, step, nextTime, stepDur, dest)
    nextTime += stepDur
    step = (step + 1) % song.lead.length
  }
  timer = window.setTimeout(() => pump(token, song, dest), 25)
}

export function stopMusic() {
  generation += 1
  window.clearTimeout(timer)
  fadeOutCurrent()
}

export function playMusic(level: LevelId) {
  const ac = getAudioContext()
  if (!ac) return
  const song = TRACKS[level]
  const token = ++generation
  window.clearTimeout(timer)
  fadeOutCurrent()

  const begin = () => {
    if (token !== generation) return
    currentBus = makeBus(ac, song.filter)
    step = 0
    nextTime = ac.currentTime + 0.06
    pump(token, song, currentBus)
  }

  if (ac.state === 'suspended') void ac.resume().then(begin)
  else begin()
}
