import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const QUEUE_KEY = 'quiz_pending_queue'
const RETRY_INTERVAL = 3000

// ═══ ОЧЕРЕДЬ НЕОТПРАВЛЕННЫХ ОТВЕТОВ ═══
// Если запрос к Supabase падает (сеть моргнула), запись не теряется —
// она остаётся в localStorage и переживает даже закрытие вкладки.
// Каждые 3 сек делается попытка дослать всё, что скопилось.
// Использование: const { send, pendingCount, isOnline } = useAnswerQueue()
//                send({ team_id, game_id, question_ref, round_number, answer_text, ... })
export function useAnswerQueue() {
  const [pendingCount, setPendingCount] = useState(() => readQueue().length)
  const [isOnline, setIsOnline] = useState(true)
  const flushingRef = useRef(false)

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
  }
  function writeQueue(q) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
    setPendingCount(q.length)
  }

  // Добавить запись в очередь и сразу попробовать отправить
  function send(payload) {
    const entry = { ...payload, _localId: `${Date.now()}-${Math.random().toString(36).slice(2)}` }
    const q = readQueue()
    // Апсерт по (team_id, question_ref) — заменяем предыдущую неотправленную
    // попытку по тому же вопросу, не плодим дубли в очереди
    const filtered = q.filter(e => !(e.team_id === entry.team_id && e.question_ref === entry.question_ref))
    writeQueue([...filtered, entry])
    flush()
  }

  async function flush() {
    if (flushingRef.current) return
    flushingRef.current = true
    try {
      const q = readQueue()
      if (q.length === 0) { setIsOnline(true); return }
      const remaining = []
      let sawSuccess = false
      let sawFailure = false
      for (const entry of q) {
        const { _localId, ...payload } = entry
        try {
          const { error } = await supabase
            .from('answers')
            .upsert(payload, { onConflict: 'team_id,question_ref' })
          if (error) { remaining.push(entry); sawFailure = true }
          else sawSuccess = true
        } catch {
          remaining.push(entry)
          sawFailure = true
        }
      }
      writeQueue(remaining)
      // Онлайн, если хоть что-то прошло или очередь изначально пуста;
      // офлайн — только если ВСЁ подряд падает (реальный обрыв связи)
      if (sawFailure && !sawSuccess) setIsOnline(false)
      else setIsOnline(true)
    } finally {
      flushingRef.current = false
    }
  }

  useEffect(() => {
    flush()
    const interval = setInterval(flush, RETRY_INTERVAL)
    const onOnline = () => flush()
    window.addEventListener('online', onOnline)
    return () => { clearInterval(interval); window.removeEventListener('online', onOnline) }
  }, [])

  return { send, pendingCount, isOnline }
}
