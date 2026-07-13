import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const POLL_INTERVAL = 2000

// Ответы текущего раунда (по номеру раунда — вопросы живут в коде).
// Возвращает [answers, refetch] — refetch делает СРАЗУ свежий запрос,
// не дожидаясь следующего тика поллинга (нужно перед «Дальше»/«К ответам»,
// чтобы не полагаться на данные, которым может быть уже до 2 сек).
export function useAnswers(roundNumber) {
  const [answers, setAnswers] = useState([])

  const load = useCallback(async () => {
    if (roundNumber == null) return []
    const { data } = await supabase
      .from('answers')
      .select('*, teams(name, color)')
      .eq('round_number', roundNumber)
      .order('question_ref')
    setAnswers(data || [])
    return data || []
  }, [roundNumber])

  useEffect(() => {
    if (roundNumber == null) { setAnswers([]); return }  // раунд 0 — валидный номер, не falsy-ловушка
    let stopped = false

    async function poll() {
      const { data } = await supabase
        .from('answers')
        .select('*, teams(name, color)')
        .eq('round_number', roundNumber)
        .order('question_ref')
      if (!stopped) setAnswers(data || [])
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL)
    return () => { stopped = true; clearInterval(interval) }
  }, [roundNumber])

  return [answers, load]
}
