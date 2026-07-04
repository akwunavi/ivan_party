import { useTeams } from '../hooks/useTeams'

export default function Scoreboard({ roundNumber }) {
  const teams = useTeams()
  const sorted = [...teams].sort((a, b) => b.total_score - a.total_score)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="full-screen grid-bg flex-center flex-col" style={{ padding: 40 }}>

      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div className="mono-tag" style={{ marginBottom: 12 }}>
          // ПРОМЕЖУТОЧНЫЕ ИТОГИ
        </div>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 'clamp(36px, 6vw, 72px)',
          fontWeight: 700, lineHeight: 1,
          color: '#fff', letterSpacing: '-0.02em'
        }}>
          ПОСЛЕ <span style={{ color: '#ea580c' }}>РАУНДА {roundNumber}</span>
        </div>
      </div>

      {/* Таблица */}
      <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((team, i) => (
          <div key={team.id} style={{
            display: 'flex', alignItems: 'center', gap: 20,
            background: i === 0 ? 'rgba(234,88,12,0.08)' : '#0d0d0d',
            border: `1px solid ${i === 0 ? 'rgba(234,88,12,0.4)' : '#222'}`,
            borderLeft: `4px solid ${team.color || '#ea580c'}`,
            padding: '16px 24px',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'
          }}>
            {/* Место */}
            <div style={{ fontSize: 24, width: 36 }}>
              {medals[i] || `${i + 1}`}
            </div>

            {/* Название */}
            <div style={{
              flex: 1,
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 28, fontWeight: 700,
              letterSpacing: '0.02em'
            }}>
              {team.name}
            </div>

            {/* Баллы */}
            <div style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 36, color: '#ea580c', fontWeight: 700
            }}>
              {team.total_score % 1 === 0
                ? team.total_score
                : team.total_score.toFixed(1)}
            </div>

            <div style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 11, color: '#555', letterSpacing: '0.1em'
            }}>
              ПТС
            </div>
          </div>
        ))}
      </div>

      {/* Акцентная линия снизу */}
      <div className="accent-line" style={{ width: '100%', maxWidth: 700, marginTop: 32 }} />
    </div>
  )
}
