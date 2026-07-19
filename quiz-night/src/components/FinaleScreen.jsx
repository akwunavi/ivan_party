import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTeams } from '../hooks/useTeams'
import { TOTAL_ROUNDS } from '../lib/roundsRegistry'
import Typewriter from './Typewriter'

// ═══ ФИНАЛ ИГРЫ ═══
// Показывается после последнего раунда вместо обычного табло.
// Титры: место за местом снизу вверх, музыка, конфетти вокруг борда для победителя.
//
// Баллы считаются из score_log (только раунды 1..TOTAL_ROUNDS, разогрев исключён) —
// ТОЧНО ТАК ЖЕ, как на обычном табло (см. Scoreboard.jsx). Раньше здесь читался
// team.total_score напрямую из базы — он ненадёжен (суммирует вообще всё,
// включая разогрев), из-за чего финал показывал пусто или неверные числа.
export default function FinaleScreen({ gameState, onBackToLobby }) {
  const teams = useTeams()
  const [byTeamTotal, setByTeamTotal] = useState({})
  const [byTeamRound, setByTeamRound] = useState({})
  const [view, setView] = useState('totals')  // 'totals' → через минуту 'breakdown'

  useEffect(() => {
    let stop = false
    async function load() {
      const { data } = await supabase.from('score_log').select('team_id, round_number, delta')
      if (stop || !data) return
      const totals = {}
      const perRound = {}
      // Только раунды, завершённые в ЭТОЙ игре (защита от остатков прошлых
      // прогонов с теми же командами). Если список пуст — фолбэк на все раунды.
      const played = gameState?.completed_rounds?.length
        ? new Set(gameState.completed_rounds) : null
      data.forEach(r => {
        if (r.round_number < 1 || r.round_number > TOTAL_ROUNDS) return
        if (played && !played.has(r.round_number)) return
        totals[r.team_id] = (totals[r.team_id] || 0) + Number(r.delta)
        perRound[r.team_id] = perRound[r.team_id] || {}
        perRound[r.team_id][r.round_number] = (perRound[r.team_id][r.round_number] || 0) + Number(r.delta)
      })
      setByTeamTotal(totals)
      setByTeamRound(perRound)
    }
    load()
    const t = setInterval(load, 3000)
    return () => { stop = true; clearInterval(t) }
  }, [])

  const totalOf = (teamId) => byTeamTotal[teamId] || 0
  const sorted = useMemo(
    () => [...teams].sort((a, b) => totalOf(b.id) - totalOf(a.id)),
    [teams, byTeamTotal]
  )
  const [revealedCount, setRevealedCount] = useState(0)

  useEffect(() => {
    const audio = new Audio('./media/song.mp3')
    audio.loop = true
    audio.volume = 0.5
    if (!document.hidden) audio.play().catch(() => {})
    return () => audio.pause()
  }, [])

  useEffect(() => {
    if (sorted.length === 0) return
    setRevealedCount(0)
    const interval = setInterval(() => {
      setRevealedCount(prev => {
        if (prev >= sorted.length) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, 1800)
    return () => clearInterval(interval)
  }, [sorted.length])

  // Прыжков нет: все строки отрисованы сразу в финальных позициях,
  // раскрытие идёт с последнего места вверх только через opacity.
  const revealedFromIdx = sorted.length - revealedCount
  const showConfetti = revealedCount >= sorted.length && sorted.length > 0

  useEffect(() => {
    if (!showConfetti) return
    const t = setTimeout(() => setView('breakdown'), 60000)
    return () => clearTimeout(t)
  }, [showConfetti])

  // Раунды для колонок разбивки: только реально отыгранные
  const playedList = (gameState?.completed_rounds?.length
    ? [...gameState.completed_rounds] : Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1)
  ).sort((a, b) => a - b)
  const fmt = v => v == null ? '·' : (v % 1 === 0 ? v : v.toFixed(1))

  return (
    <div className="grid-bg flex-center flex-col" style={{ height: '100vh', overflow: 'hidden', gap: 28, padding: 40, position: 'relative', display: 'flex' }}>
      {showConfetti && <Fireworks />}

      <div className="mono-tag" style={{ fontSize: 16, letterSpacing: '0.3em' }}>ИГРА ЗАВЕРШЕНА</div>
      <h1 className="neon-title glitch-title" style={{
        fontFamily: 'Russo One, sans-serif', fontSize: 'clamp(60px, 10vw, 130px)',
        color: '#fff', textAlign: 'center', lineHeight: 0.95,
      }}>
        ФИНАЛЬНЫЕ<br /><span style={{ color: 'var(--accent)' }}>ИТОГИ</span>
      </h1>

      {sorted.length === 0 && (
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 14, color: '#555' }}>
          ЗАГРУЗКА КОМАНД...
        </div>
      )}

      {view === 'breakdown' && (
        <table style={{ borderCollapse: 'collapse', minWidth: '70vw' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--accent)' }}>
              <th style={{ ...FB.h, textAlign: 'left' }}>КОМАНДА</th>
              {playedList.map(rn => <th key={rn} style={FB.h}>Р{rn}</th>)}
              <th style={{ ...FB.h, color: 'var(--accent)' }}>ИТОГО</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, i) => (
              <tr key={team.id} style={{ borderBottom: '1px solid #222', background: i === 0 ? 'rgba(234,88,12,0.08)' : 'transparent' }}>
                <td style={{ ...FB.c, textAlign: 'left', color: team.color || '#fff', fontFamily: 'Russo One, Rajdhani, sans-serif' }}>
                  {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `}{team.name}
                </td>
                {playedList.map(rn => (
                  <td key={rn} style={FB.c}>{fmt(byTeamRound[team.id]?.[rn])}</td>
                ))}
                <td style={{ ...FB.c, color: 'var(--accent)', fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>{fmt(totalOf(team.id))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: view === 'totals' ? 'flex' : 'none', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 800, marginTop: 20 }}>
        {sorted.map((team, idx) => {
          const place = idx + 1
          const isRevealed = idx >= revealedFromIdx
          const isNewest = idx === revealedFromIdx
          const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `${place}.`
          const score = totalOf(team.id)
          return (
            <div key={team.id} style={{
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'none' : 'translateY(14px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
              display: 'flex', alignItems: 'center', gap: 20,
              padding: place === 1 ? '22px 32px' : '16px 28px',
              background: place === 1 ? 'rgba(234,88,12,0.1)' : '#0d0d0d',
              border: `1px solid ${place === 1 ? 'var(--accent)' : '#222'}`,
              boxShadow: place === 1 ? '0 0 40px rgba(234,88,12,0.25)' : 'none',
            }}>
              <div style={{ fontSize: place === 1 ? 44 : 30 }}>{medal}</div>
              <div style={{
                flex: 1, fontFamily: 'Russo One, Rajdhani, sans-serif',
                fontSize: place === 1 ? 40 : 28, color: team.color || '#fff',
              }}>
                {isNewest && isRevealed ? <Typewriter text={team.name} speed={50} /> : team.name}
              </div>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: place === 1 ? 46 : 30,
                color: 'var(--accent)', textShadow: place === 1 ? '0 0 20px rgba(234,88,12,0.5)' : 'none',
              }}>
                {score % 1 === 0 ? score : score.toFixed(1)}
              </div>
            </div>
          )
        })}
      </div>

      {showConfetti && (
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setView(v => v === 'totals' ? 'breakdown' : 'totals')}>
            {view === 'totals' ? 'РАЗБИВКА ПО РАУНДАМ' : 'К ИТОГАМ'}
          </button>
          <button className="btn btn-primary" onClick={onBackToLobby}>В ЛОББИ</button>
        </div>
      )}
    </div>
  )
}

const FB = {
  h: { fontFamily: 'Share Tech Mono, monospace', fontSize: 16, color: '#888', padding: '10px 18px', letterSpacing: '0.15em' },
  c: { fontFamily: 'Rajdhani, sans-serif', fontSize: 26, fontWeight: 700, color: '#eee', padding: '12px 18px', textAlign: 'center' },
}

function Fireworks() {
  // 6 залпов в разных точках верхней половины экрана, по краям от таблицы.
  // У каждого свой цвет, задержка и ритм — выглядит как настоящий салют.
  const colors = ['#ea580c', '#22d3ee', '#22c55e', '#f59e0b', '#ec4899', '#a855f7']
  const bursts = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: i % 2 === 0 ? 6 + Math.random() * 16 : 76 + Math.random() * 16,
    top: 12 + Math.random() * 38,
    delay: i * 0.7 + Math.random() * 0.5,
    dur: 2.6 + Math.random() * 0.8,
    color: colors[i % colors.length],
  }))
  const SPARKS = 14
  return (
    <>
      {bursts.map(b => (
        <div key={b.id} className="fw-burst" style={{ left: `${b.left}%`, top: `${b.top}%` }}>
          <div className="fw-flash" style={{
            '--dur': `${b.dur}s`, '--delay': `${b.delay}s`,
            background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
          }} />
          {Array.from({ length: SPARKS }, (_, s) => (
            <div key={s} className="fw-spark" style={{
              '--a': `${Math.round(s * (360 / SPARKS))}deg`,
              '--dur': `${b.dur}s`,
              '--delay': `${b.delay}s`,
              background: `linear-gradient(${b.color}, transparent)`,
            }} />
          ))}
        </div>
      ))}
    </>
  )
}
