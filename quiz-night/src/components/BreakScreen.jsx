import { useEffect, useState } from 'react'
import { updateGameState } from '../lib/gameActions'
import { TOTAL_ROUNDS } from '../lib/roundsRegistry'

// ═══ ПЕРЕРЫВ 10 МИНУТ ═══
// Отсчёт синхронен на всех экранах: старт хранится в game_state.timer_started_at
export default function BreakScreen({ gameState }) {
  const totalSec = gameState.timer_seconds || 600
  const startedAt = gameState.timer_started_at ? new Date(gameState.timer_started_at).getTime() : Date.now()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(i)
  }, [])

  const remaining = Math.max(0, totalSec - Math.floor((now - startedAt) / 1000))
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const nextRound = (gameState.current_round ?? 0) + 1

  return (
    <div className="grid-bg flex-center flex-col" style={{ height: '100vh', display: 'flex', overflowY: 'auto', gap: 32, padding: 40 }}>
      <div className="mono-tag" style={{ fontSize: 18, letterSpacing: '0.3em' }}>ПЕРЕРЫВ</div>
      <div style={{
        fontFamily: 'Orbitron, monospace', fontWeight: 900,
        fontSize: 'clamp(100px, 20vw, 280px)', lineHeight: 1,
        color: remaining <= 60 ? '#ef4444' : '#fff',
        textShadow: remaining <= 60 ? '0 0 40px rgba(239,68,68,0.5)' : '0 0 40px rgba(234,88,12,0.35)',
        transition: 'color 0.5s',
      }}>
        {mm}:{ss}
      </div>
      <div className="gradient-underline" style={{ maxWidth: 500, width: '100%' }} />
      <button className="btn btn-primary" onClick={() => updateGameState({
        current_round: nextRound <= TOTAL_ROUNDS ? nextRound : 0,
        current_step: 0,
        status: nextRound <= TOTAL_ROUNDS ? 'round_intro' : 'lobby',
        accepting_answers: false, show_scoreboard: false, step_data: {}, timer_started_at: null,
      })}>
        {nextRound <= 8 ? `РАУНД ${nextRound} →` : 'В ЛОББИ'}
      </button>
    </div>
  )
}
