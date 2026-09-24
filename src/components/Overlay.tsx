import { useGameStore } from '../game/store.ts'

export function Overlay() {
  const phase = useGameStore((state) => state.phase)
  const score = useGameStore((state) => state.score)
  const level = useGameStore((state) => state.level)
  const start = useGameStore((state) => state.start)
  const next = useGameStore((state) => state.next)

  if (phase === 'playing') return null

  const canAdvance = phase === 'won' && level < 4
  const nextNames = ['', 'el nivel soleado', 'el nivel de nieve', 'las islas flotantes']
  const title =
    phase === 'won' ? (level < 4 ? `NIVEL ${level} LISTO` : 'ETAPA COMPLETA') : phase === 'lost' ? 'GAME OVER' : 'KMUS BLAST'
  const subtitle =
    phase === 'menu'
      ? 'Plataformas 2D · scroll horizontal'
      : phase === 'won'
        ? level < 4
          ? `Meta alcanzada. Sigue ${nextNames[level]}. Puntos: ${score}`
          : `Completaste los cuatro niveles. Puntos: ${score}`
        : `Te quedaste sin energía. Puntos: ${score}`

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 px-6">
      <div className="w-full max-w-md border-4 border-cyan-300 bg-slate-950/90 p-6 text-center text-cyan-50 shadow-[8px_8px_0_#0891b2]">
        <p className="text-xs tracking-[0.35em] text-amber-300">
          {phase === 'menu' ? 'MEGA STAGE 01' : `NIVEL 0${level}`}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-cyan-200">{title}</h1>
        <p className="mt-3 text-sm text-slate-200">{subtitle}</p>
        <ul className="mx-auto mt-5 max-w-xs space-y-1 text-left font-mono text-xs text-cyan-100">
          <li>← → mover</li>
          <li>↑ saltar (doble en el aire)</li>
          <li>ENTER disparar · ENTER siguiente nivel</li>
        </ul>
        <button
          type="button"
          onClick={() => (canAdvance ? next() : start(phase === 'lost' ? level : 1))}
          className="mt-6 border-2 border-amber-300 bg-amber-400 px-5 py-2 text-sm font-black tracking-widest text-slate-950 hover:bg-amber-300"
        >
          {phase === 'menu' ? 'EMPEZAR' : canAdvance ? `NIVEL ${level + 1}` : 'REINTENTAR'}
        </button>
      </div>
    </div>
  )
}
