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
export default function FinaleScreen({ onBackToLobby }) {
  const teams = useTeams()
  const [byTeamTotal, setByTeamTotal] = useState({})

  useEffect(() => {
    let stop = false
    async function load() {
      const { data } = await supabase.from('score_log').select('team_id, round_number, delta')
      if (stop || !data) return
      const totals = {}
      data.forEach(r => {
        if (r.round_number < 1 || r.round_number > TOTAL_ROUNDS) return // разогрев не считаем
        totals[r.team_id] = (totals[r.team_id] || 0) + Number(r.delta)
      })
      setByTeamTotal(totals)
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

  const visible = sorted.slice(sorted.length - revealedCount)
  const showConfetti = revealedCount >= sorted.length && sorted.length > 0

  return (
    <div className="grid-bg flex-center flex-col" style={{ height: '100vh', overflow: 'hidden', gap: 28, padding: 40, position: 'relative', display: 'flex' }}>
      {showConfetti && <Confetti />}

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 800, marginTop: 20 }}>
        {visible.map((team, idx) => {
          const place = sorted.indexOf(team) + 1
          const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `${place}.`
          const score = totalOf(team.id)
          return (
            <div key={team.id} className="credits-line reveal-up" style={{
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
                {idx === 0 ? <Typewriter text={team.name} speed={50} /> : team.name}
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
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onBackToLobby}>
          В ЛОББИ
        </button>
      )}
    </div>
  )
}

function Confetti() {
  const colors = ['#ea580c', '#22d3ee', '#22c55e', '#fff', '#f59e0b']
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15, // по краям
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    color: colors[i % colors.length],
  }))
  return (
    <>
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`,
          background: p.color,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        }} />
      ))}
    </>
  )
}
