import { GameCanvas } from "./components/GameCanvas.tsx"
import { Hud } from "./components/Hud.tsx"
import { Overlay } from "./components/Overlay.tsx"
import { StartScreen } from "./components/StartScreen.tsx"
import { useGameStore } from "./game/store.ts"
import { useGameInput } from "./hooks/useGameInput.ts"

function App() {
  useGameInput()
  const phase = useGameStore((state) => state.phase)
  const difficulty = useGameStore((state) => state.difficulty)

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <section className="relative w-full max-w-[960px]">
        <header className="mb-3 text-cyan-100">
          <p className="font-mono text-xs tracking-[0.18em] text-amber-300">
            {phase === 'menu' ? 'STAGE SELECT' : `Dificultad Nivel: ${difficulty}`}
          </p>
          <h1 className="text-2xl font-black tracking-tight">KMUS BLAST</h1>
        </header>
        <div className="relative">
          <GameCanvas />
          <Hud />
          <StartScreen />
          <Overlay />
        </div>
      </section>
    </main>
  )
}

export default App