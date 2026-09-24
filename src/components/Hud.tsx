import { MAX_HP } from '../game/constants.ts'
import { useGameStore } from '../game/store.ts'

export function Hud() {
  const hp = useGameStore((state) => state.player.hp)
  const score = useGameStore((state) => state.score)
  const phase = useGameStore((state) => state.phase)
  const level = useGameStore((state) => state.level)

  if (phase === 'menu') return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex items-start justify-between px-4 font-mono text-sm text-cyan-50">
      <div className="flex gap-1">
        {Array.from({ length: MAX_HP }, (_, index) => (
          <span
            key={index}
            className={`h-4 w-4 border border-cyan-200 ${index < hp ? 'bg-rose-500' : 'bg-slate-800/70'}`}
          />
        ))}
      </div>
      <div className="rounded bg-slate-950/60 px-3 py-1 tracking-widest">
        NIVEL {level} · SCORE {score.toString().padStart(5, '0')}
      </div>
    </div>
  )
}
