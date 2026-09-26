import { useGameStore } from '../game/store.ts'

export function Overlay() {
  const phase = useGameStore((state) => state.phase)
  const score = useGameStore((state) => state.score)
  const level = useGameStore((state) => state.level)
  const difficulty = useGameStore((state) => state.difficulty)
  const next = useGameStore((state) => state.next)
  const advanceDifficulty = useGameStore((state) => state.advanceDifficulty)
  const returnToMenu = useGameStore((state) => state.returnToMenu)

  if (phase !== 'won' && phase !== 'lost') return null

  const canAdvance = phase === 'won' && level < 4
  const campaignClear = phase === 'won' && level >= 4
  const nextDifficulty = Math.min(3, difficulty + 1)
  const nextNames = ['', 'el nivel soleado', 'el nivel de nieve', 'las islas flotantes']
  const title = phase === 'won' ? (level < 4 ? `NIVEL ${level} LISTO` : 'ETAPA COMPLETA') : 'GAME OVER'
  const subtitle =
    phase === 'won'
      ? level < 4
        ? `Meta alcanzada. Sigue ${nextNames[level]}.`
        : difficulty < 3
          ? `Completaste los cuatro niveles. Siguiente: Dificultad Nivel: ${nextDifficulty}`
          : 'Completaste los cuatro niveles en la dificultad máxima.'
      : 'Te quedaste sin vidas. La partida vuelve al inicio.'

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 px-6">
      <div className="w-full max-w-md border-4 border-cyan-300 bg-slate-950/90 p-6 text-center text-cyan-50 shadow-[8px_8px_0_#0891b2]">
        <p className="text-xs tracking-[0.35em] text-amber-300">{`NIVEL 0${level}`}</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-cyan-200">{title}</h2>
        <p className="mt-3 text-sm text-slate-200">{subtitle}</p>
        <p className="mt-4 font-mono text-2xl font-black tracking-widest text-amber-300">
          SCORE {score.toString().padStart(5, '0')}
        </p>
        <button
          type="button"
          onClick={() => (canAdvance ? next() : campaignClear ? advanceDifficulty() : returnToMenu())}
          className="mt-6 border-2 border-amber-300 bg-amber-400 px-5 py-2 text-sm font-black tracking-widest text-slate-950 hover:bg-amber-300"
        >
          {canAdvance ? `NIVEL ${level + 1}` : campaignClear && difficulty < 3 ? `DIFICULTAD ${nextDifficulty}` : phase === 'lost' ? 'INICIO' : 'REINTENTAR'}
        </button>
      </div>
    </div>
  )
}
