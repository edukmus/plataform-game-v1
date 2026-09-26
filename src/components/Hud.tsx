import headSrc from '../assets/kmus-head.png'
import { useGameStore } from '../game/store.ts'

export function Hud() {
  const lives = useGameStore((state) => state.lives)
  const ammo = useGameStore((state) => state.ammo)
  const score = useGameStore((state) => state.score)
  const phase = useGameStore((state) => state.phase)
  const level = useGameStore((state) => state.level)
  const difficulty = useGameStore((state) => state.difficulty)

  if (phase === 'menu') return null

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex flex-wrap items-start justify-between gap-2 px-4 font-mono text-sm text-cyan-50">
        <div className="flex min-h-7 gap-1" aria-label={`${lives} vidas`}>
          {Array.from({ length: lives }, (_, index) => (
            <img
              key={index}
              src={headSrc}
              alt=""
              className="h-7 w-7 object-contain drop-shadow-[0_1px_0_#020617]"
            />
          ))}
        </div>
        <div className="rounded bg-slate-950/75 px-3 py-1 tracking-widest text-amber-300">
          Dificultad Nivel: {difficulty}
        </div>
        <div className="rounded bg-slate-950/60 px-3 py-1 tracking-widest">
          NIVEL {level} · SCORE {score.toString().padStart(5, '0')}
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-3 left-4 z-10 flex items-center gap-2 rounded bg-slate-950/80 px-2 py-1 font-mono text-cyan-50"
        aria-label={`${ammo} balas`}
      >
        <AmmoIcon />
        <span className="min-w-8 text-xl font-black tabular-nums tracking-wider">{ammo}</span>
      </div>
    </>
  )
}

function AmmoIcon() {
  return (
    <svg viewBox="0 0 16 28" className="h-8 w-5 shrink-0" aria-hidden="true">
      <rect x="5" y="1" width="6" height="5" fill="#f8d48a" />
      <rect x="3" y="6" width="10" height="15" fill="#d4a017" />
      <rect x="1" y="21" width="14" height="5" fill="#8a5a12" />
    </svg>
  )
}
