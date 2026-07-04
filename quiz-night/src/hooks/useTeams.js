import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const POLL_INTERVAL = 2000

export function useTeams() {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    let stopped = false

    async function load() {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .order('total_score', { ascending: false })
      if (!stopped) setTeams(data || [])
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL)

    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [])

  return teams
}
