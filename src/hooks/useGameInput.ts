import { useEffect } from 'react'
import { useGameStore } from '../game/store.ts'
import type { Keys } from '../game/types.ts'

const keyMap: Record<string, keyof Keys> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyA: 'left',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  Enter: 'shoot',
}

export function useGameInput() {
  const setKey = useGameStore((state) => state.setKey)
  const start = useGameStore((state) => state.start)
  const next = useGameStore((state) => state.next)

  useEffect(() => {
    const onKey = (event: KeyboardEvent, down: boolean) => {
      const action = keyMap[event.code]
      if (!action) return
      event.preventDefault()
      const { phase, level } = useGameStore.getState()
      if (phase !== 'playing') {
        if (!down || event.repeat) return
        if (event.code === 'Enter' && phase === 'won' && level < 4) next()
        else if (event.code === 'Enter' || event.code === 'ArrowUp') start(phase === 'lost' ? level : 1)
        return
      }
      setKey(action, down)
    }

    const down = (event: KeyboardEvent) => onKey(event, true)
    const up = (event: KeyboardEvent) => onKey(event, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [setKey, start, next])
}
