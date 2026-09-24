import { GameCanvas } from "./components/GameCanvas.tsx"
import { Hud } from "./components/Hud.tsx"
import { Overlay } from "./components/Overlay.tsx"
import { useGameInput } from "./hooks/useGameInput.ts"

function App() {
  useGameInput()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <section className="relative w-full max-w-[960px]">
        <header className="mb-3 flex items-end justify-between text-cyan-100">
          <div>
            <p className="font-mono text-[11px] tracking-[0.4em] text-amber-300">STAGE SELECT</p>
            <h1 className="text-2xl font-black tracking-tight">KMUS BLAST</h1>
          </div>
          <p className="hidden font-mono text-xs text-slate-400 sm:block">
            ← → mover · ↑ doble salto · ENTER disparar / siguiente nivel
          </p>
        </header>
        <div className="relative">
          <GameCanvas />
          <Hud />
          <Overlay />
        </div>
      </section>
    </main>
  )
}

export default App