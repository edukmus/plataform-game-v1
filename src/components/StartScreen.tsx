import { useGameStore } from '../game/store.ts'

export function StartScreen() {
  const phase = useGameStore((state) => state.phase)
  const menuView = useGameStore((state) => state.menuView)
  const start = useGameStore((state) => state.start)
  const openInstructions = useGameStore((state) => state.openInstructions)
  const closeInstructions = useGameStore((state) => state.closeInstructions)

  if (phase !== 'menu') return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 px-6">
      <div className="w-full max-w-md border-4 border-cyan-300 bg-slate-950/90 p-6 text-center text-cyan-50 shadow-[8px_8px_0_#0891b2]">
        {menuView === 'instructions' ? (
          <>
            <p className="text-xs tracking-[0.35em] text-amber-300">COMO JUGAR</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-cyan-200">INSTRUCCIONES</h2>
            <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left font-mono text-xs text-cyan-100">
              <li>← → mover</li>
              <li>↑ saltar (doble en el aire)</li>
              <li>ENTER disparar. Empiezas con 30 balas</li>
              <li>3 vidas. Un golpe o una caída quita una</li>
              <li>Cada nivel tiene munición (+15) y una vida extra flotante</li>
              <li>El puntaje se acumula entre niveles</li>
              <li>Sin vidas, la partida vuelve al inicio</li>
              <li>Al completar los 4 niveles sube la dificultad</li>
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
              También puedes moverte con A D y saltar con W o Espacio.
            </p>
            <button
              type="button"
              autoFocus
              onClick={closeInstructions}
              className="mt-6 border-2 border-cyan-300 px-5 py-2 text-sm font-black tracking-widest text-cyan-100 hover:bg-cyan-300/15"
            >
              Volver
            </button>
          </>
        ) : (
          <>
            <p className="text-xs tracking-[0.35em] text-amber-300">MEGA STAGE 01</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-cyan-200">KMUS BLAST</h2>
            <p className="mt-3 text-sm text-slate-200">Plataformas 2D · scroll horizontal</p>
            <div className="mx-auto mt-6 flex w-full max-w-xs flex-col gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => start(1)}
                className="border-2 border-amber-300 bg-amber-400 px-5 py-2 text-sm font-black tracking-widest text-slate-950 hover:bg-amber-300"
              >
                Jugar
              </button>
              <button
                type="button"
                onClick={openInstructions}
                className="border-2 border-cyan-300 px-5 py-2 text-sm font-black tracking-widest text-cyan-100 hover:bg-cyan-300/15"
              >
                Instrucciones
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
