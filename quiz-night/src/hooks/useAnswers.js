import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const POLL_INTERVAL = 2000

// Ответы текущего раунда (по номеру раунда — вопросы живут в коде)
export function useAnswers(roundNumber) {
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    if (roundNumber == null) { setAnswers([]); return }  // раунд 0 — валидный номер, не falsy-ловушка
    let stopped = false

    async function load() {
      const { data } = await supabase
        .from('answers')
        .select('*, teams(name, color)')
        .eq('round_number', roundNumber)
        .order('question_ref')
      if (!stopped) setAnswers(data || [])
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL)
    return () => { stopped = true; clearInterval(interval) }
  }, [roundNumber])

  return answers
}
