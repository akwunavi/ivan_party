import { useEffect, useState } from 'react'
import { useTeams } from '../hooks/useTeams'
import Typewriter from './Typewriter'
import { supabase } from '../lib/supabase'
import { updateGameState } from '../lib/gameActions'
import { DISABLED_ROUNDS, TOTAL_ROUNDS } from '../lib/roundsRegistry'

export default function Scoreboard({ roundNumber }) {
  const teams = useTeams()

  // П.5: раскрытие интригой — с последнего места, по одной команде каждые 2.2с.
  // Новая (более высокая) строка появляется СВЕРХУ, сдвигая предыдущие вниз.
  const [revealedCount, setRevealedCount] = useState(0)

  // П.11: разбивка по раундам из score_log
  const [byRound, setByRound] = useState({})   // { team_id: { 1: 3, 2: 2.5, ... } }
  useEffect(() => {
    let stop = false
    async function load() {
      const { data } = await supabase.from('score_log').select('team_id, round_number, delta')
      if (stop || !data) return
      const agg = {}
      data.forEach(r => {
        agg[r.team_id] = agg[r.team_id] || {}
        agg[r.team_id][r.round_number] = (agg[r.team_id][r.round_number] || 0) + Number(r.delta)
      })
      setByRound(agg)
    }
    load()
    const t = setInterval(load, 3000)
    return () => { stop = true; clearInterval(t) }
  }, [])

  // П.1: итог считаем ТОЛЬКО по боевым раундам — разогрев (Р0) не попадает
  // ни в сумму, ни в распределение мест, что бы ни лежало в total_score.
  const battleTotal = (teamId) =>
    Object.entries(byRound[teamId] || {})
      .filter(([rn]) => Number(rn) >= 1 && Number(rn) <= TOTAL_ROUNDS)
      .reduce((s, [, pts]) => s + pts, 0)

  const sorted = [...teams].sort((a, b) => battleTotal(b.id) - battleTotal(a.id))
  useEffect(() => {
    setRevealedCount(0)
    if (sorted.length === 0) return
    const interval = setInterval(() => {
      setRevealedCount(prev => {
        if (prev >= sorted.length) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, 2200)
    return () => clearInterval(interval)
  }, [teams.length, roundNumber])

  // показываем только уже раскрытые: последние revealedCount из отсортированного списка
  const visible = sorted.slice(sorted.length - revealedCount)

  const medals = ['🥇', '🥈', '🥉']

  const T = {
    headCell: {
      fontFamily: 'Share Tech Mono, monospace', fontSize: 17, letterSpacing: '0.2em',
      color: '#777', padding: '14px 20px', borderBottom: '2px solid var(--accent)',
      textAlign: 'left',
    },
    cell: { padding: '20px 20px' },
  }

  return (
    <div className="grid-bg flex-center flex-col" style={{ height: '100vh', display: 'flex', overflowY: 'auto', padding: 40 }}>

      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div className="mono-tag" style={{ marginBottom: 12 }}>
          ПРОМЕЖУТОЧНЫЕ ИТОГИ
        </div>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 'clamp(36px, 6vw, 72px)',
          fontWeight: 700, lineHeight: 1,
          color: '#fff', letterSpacing: '-0.02em'
        }}>
          {roundNumber === 0
            ? <span style={{ color: '#ea580c' }}>РАЗОГРЕВ ЗАВЕРШЁН</span>
            : <>ПОСЛЕ <span style={{ color: '#ea580c' }}>РАУНДА {roundNumber}</span></>}
        </div>
        {roundNumber === 0 && (
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 13, color: '#666', marginTop: 6 }}>
            баллы разогрева не идут в общий зачёт
          </div>
        )}
      </div>

      {/* П.5: широкая таблица — команды строками, раунды колонками (разогрев в ней не участвует) */}
      <div style={{ width: '92vw', maxWidth: 1600, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={T.headCell}>КОМАНДА</th>
              {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).filter(rn => rn <= roundNumber).map(rn => (
                <th key={rn} style={{ ...T.headCell, textAlign: 'center' }}>Р{rn}</th>
              ))}
              <th style={{ ...T.headCell, textAlign: 'center', color: 'var(--accent)' }}>ИТОГО</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((team, idx) => {
              const i = sorted.indexOf(team)
              const rounds = byRound[team.id] || {}
              return (
                <tr key={team.id} className="reveal-up" style={{
                  background: i === 0 ? 'rgba(234,88,12,0.07)' : 'transparent',
                  borderBottom: '1px solid #222',
                }}>
                  <td style={{ ...T.cell, textAlign: 'left' }}>
                    <span style={{ marginRight: 14, fontSize: 30 }}>{medals[i] || `${i + 1}`}</span>
                    <span style={{ fontFamily: 'Russo One, Rajdhani, sans-serif', fontSize: 34, color: team.color || '#fff' }}>
                      {idx === 0 ? <Typewriter text={team.name} speed={55} /> : team.name}
                    </span>
                  </td>
                  {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).filter(rn => rn <= roundNumber).map(rn => {
                    const pts = rounds[rn]
                    return (
                      <td key={rn} style={{ ...T.cell, textAlign: 'center', fontFamily: 'Orbitron, monospace', fontSize: 26, color: pts == null ? '#333' : pts < 0 ? '#ef4444' : '#ddd' }}>
                        {pts == null ? '—' : pts % 1 === 0 ? pts : pts.toFixed(1)}
                      </td>
                    )
                  })}
                  <td style={{ ...T.cell, textAlign: 'center', fontFamily: 'Orbitron, monospace', fontSize: 38, fontWeight: 700, color: 'var(--accent)', textShadow: '0 0 16px rgba(234,88,12,0.4)' }}>
                    {battleTotal(team.id) % 1 === 0 ? battleTotal(team.id) : battleTotal(team.id).toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Акцентная линия снизу */}
      <div className="accent-line" style={{ width: '100%', maxWidth: 700, marginTop: 32 }} />

      {/* Продолжение: следующий раунд или в лобби после восьмого */}
      <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
        {[3, 4, 2].includes(roundNumber) && (
          <button className="btn btn-ghost" onClick={() => updateGameState({
            status: 'break',
            timer_started_at: new Date().toISOString(),
            timer_seconds: 600,
            show_scoreboard: false,
          })}>
            ☕ ПЕРЕРЫВ 10 МИН
          </button>
        )}
        <button className="btn btn-primary" onClick={() => {
          const nextRound = nextEnabledRound(roundNumber)
          if (nextRound != null) {
            updateGameState({
              current_round: nextRound, current_step: 0, status: 'round_intro',
              accepting_answers: false, show_scoreboard: false, step_data: {},
            })
          } else {
            updateGameState({ status: 'finale', current_round: 0, current_step: 0, show_scoreboard: false })
          }
        }}>
          {nextEnabledRound(roundNumber) != null ? `РАУНД ${nextEnabledRound(roundNumber)} →` : 'ФИНАЛЬНЫЕ ИТОГИ →'}
        </button>
      </div>
    </div>
  )
}

// Раунды можно отключить, не трогая нумерацию (см. DISABLED_ROUNDS в roundsRegistry.js).
// Кнопка «Дальше» и здесь, и в advance() из roundFlow.js молча их перепрыгивают.
function nextEnabledRound(current) {
  for (let n = current + 1; n <= TOTAL_ROUNDS; n++) {
    if (!DISABLED_ROUNDS.includes(n)) return n
  }
  return null
}
