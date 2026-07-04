import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const POLL_INTERVAL = 2000 // мс — проверенный интервал с дня рождения

export function useGameState() {
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stopped = false

    async function load() {
      const { data } = await supabase
        .from('game_state')
        .select('*, game(*)')
        .single()
      if (!stopped && data) {
        setGameState(data)
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL)

    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [])

  return { gameState, loading }
}
