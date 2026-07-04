import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTeams } from '../hooks/useTeams'

// Hash-роутинг: ссылка для игроков выглядит как .../index.html#/player
const PLAYER_URL = `${window.location.origin}${window.location.pathname}#/player`
const TEAM_COLORS = ['#ea580c', '#3b82f6', '#22c55e', '#a855f7']

export default function Lobby() {
  const teams = useTeams()
  const [pulse, setPulse] = useState(false)

  // Пульсация когда подключается новая команда
  useEffect(() => {
    if (teams.length === 0) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 600)
    return () => clearTimeout(t)
  }, [teams.length])

  return (
    <div className="full-screen grid-bg flex-center flex-col" style={{
      position: 'relative', overflow: 'hidden', padding: 40, gap: 32
    }}>

      {/* Акцентная вертикальная линия */}
      <div style={{
        width: 4, height: 80, background: '#ea580c', marginBottom: 8,
        boxShadow: '0 0 20px rgba(234,88,12,0.5)'
      }} />

      {/* Заголовок */}
      <div style={{ textAlign: 'center' }}>
        <div className="mono-tag" style={{ marginBottom: 16 }}>
          // QUIZ_NIGHT :: ЛОББИ
        </div>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 'clamp(56px, 10vw, 120px)',
          fontWeight: 700, lineHeight: 0.95,
          letterSpacing: '-0.02em', color: '#fff'
        }}>
          QUIZ<br />
          <span style={{ color: '#ea580c' }}>NIGHT</span>
        </div>
      </div>

      {/* Сканлайн */}
      <div className="accent-line scan" style={{ width: '80%' }} />

      {/* QR блок */}
      <div style={{
        background: '#0d0d0d',
        border: '1px solid #333',
        borderLeft: '3px solid #ea580c',
        padding: '28px 40px',
        display: 'flex', alignItems: 'center', gap: 32,
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
      }}>
        {/* QR */}
        <div style={{
          background: '#fff', padding: 10, borderRadius: 4,
          boxShadow: pulse ? '0 0 20px rgba(234,88,12,0.6)' : 'none',
          transition: 'box-shadow 0.3s'
        }}>
          <QRCodeSVG value={PLAYER_URL} size={100} />
        </div>

        {/* Текст */}
        <div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8
          }}>
            ПОДКЛЮЧАЙСЯ К ИГРЕ
          </div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 12, color: '#ea580c', letterSpacing: '0.1em'
          }}>
            {PLAYER_URL}
          </div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 11, color: '#555', marginTop: 6
          }}>
            // ОТСКАНИРУЙ QR ИЛИ ОТКРОЙ ССЫЛКУ
          </div>
        </div>
      </div>

      {/* Команды */}
      {teams.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 500 }}>
          <div className="mono-tag" style={{ marginBottom: 4 }}>
            // ПОДКЛЮЧИЛИСЬ ({teams.length})
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {teams.map((team, i) => (
              <div key={team.id} style={{
                padding: '8px 20px',
                border: `1px solid ${team.color || TEAM_COLORS[i % 4]}`,
                borderLeft: `3px solid ${team.color || TEAM_COLORS[i % 4]}`,
                background: `${team.color || TEAM_COLORS[i % 4]}15`,
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: 16, fontWeight: 600, color: '#fff',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
                animation: 'fadeIn 0.3s ease'
              }}>
                {team.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {teams.length === 0 && (
        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 13, color: '#555', letterSpacing: '0.1em'
        }}>
          // ОЖИДАНИЕ КОМАНД...
        </div>
      )}
    </div>
  )
}
