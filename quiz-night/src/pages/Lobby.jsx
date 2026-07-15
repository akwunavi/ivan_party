import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTeams } from '../hooks/useTeams'
import { updateGameState } from '../lib/gameActions'

// Hash-роутинг: ссылка для игроков выглядит как .../index.html#/player
const PLAYER_URL = `${window.location.origin}${window.location.pathname}#/player`
// П.4: палитра расширена (было 4, теперь 8) — меньше риска, что двум командам
// не хватит уникальных цветов, если их больше четырёх.
const TEAM_COLORS = ['#ea580c', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308', '#14b8a6', '#f43f5e']

export default function Lobby({ gameState }) {
  const teams = useTeams()
  const [pulse, setPulse] = useState(false)
  const groups = gameState?.step_data?.random_groups || null

  // Пульсация когда подключается новая команда
  useEffect(() => {
    if (teams.length === 0) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 600)
    return () => clearTimeout(t)
  }, [teams.length])

  return (
    <div className="full-screen grid-bg flex-center flex-col" style={{
      position: 'relative', overflow: 'hidden', padding: 40, gap: 28
    }}>

      {/* Заголовок */}
      <div style={{ textAlign: 'center' }}>
        <div className="mono-tag" style={{ marginBottom: 16 }}>
          QUIZ_NIGHT :: ЛОББИ
        </div>
        <div className="glitch-title" style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 'clamp(120px, 20vw, 300px)',
          fontFamily: 'Russo One, Rajdhani, sans-serif',
          fontWeight: 700, lineHeight: 0.92,
          letterSpacing: '-0.02em', color: '#fff'
        }}>
          QUIZ<br />
          <span style={{ color: '#ea580c' }}>NIGHT</span>
        </div>
      </div>

      {/* Сканлайн */}
      <div className="accent-line scan" style={{ width: '80%' }} />

      {/* QR + команды справа */}
      <div style={{ display: 'flex', gap: 40, alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{
        background: '#0d0d0d',
        border: '1px solid #333',
        borderLeft: '3px solid #ea580c',
        padding: '20px 28px',
        display: 'flex', alignItems: 'center', gap: 20,
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
      }}>
        {/* QR — крупнее */}
        <div style={{
          background: '#fff', padding: 8, borderRadius: 4,
          boxShadow: pulse ? '0 0 20px rgba(234,88,12,0.6)' : 'none',
          transition: 'box-shadow 0.3s'
        }}>
          <QRCodeSVG value={PLAYER_URL} size={140} />
        </div>

        {/* Текст — без ссылки */}
        <div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6
          }}>
            ПОДКЛЮЧАЙСЯ<br />К ИГРЕ
          </div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 11, color: '#555', letterSpacing: '0.1em'
          }}>
            ОТСКАНИРУЙ QR
          </div>
        </div>
      </div>

      {/* Команды — справа от QR, с глитч-неоном */}
      {teams.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', minWidth: 240 }}>
          <div className="mono-tag" style={{ fontSize: 14 }}>ПОДКЛЮЧИЛИСЬ ({teams.length})</div>
          {teams.map((team, i) => (
            <div key={team.id} className="team-chip-fx" style={{
              padding: '14px 26px',
              border: `2px solid ${team.color || TEAM_COLORS[i % 4]}`,
              borderLeft: `5px solid ${team.color || TEAM_COLORS[i % 4]}`,
              background: `${team.color || TEAM_COLORS[i % 4]}18`,
              fontFamily: 'Russo One, Rajdhani, sans-serif',
              fontSize: 24, color: '#fff',
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
            }}>
              {team.name}
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Рандомайзер команд — опубликованное распределение, все видят сами */}
      {groups && (
        <div style={{ width: '100%', maxWidth: 1000 }}>
          <div className="mono-tag" style={{ textAlign: 'center', marginBottom: 14 }}>
            🎲 РАСПРЕДЕЛЕНИЕ КОМАНД — КАПИТАН РЕГИСТРИРУЕТ КОМАНДУ САМ
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(groups.length, 4)}, 1fr)`, gap: 16 }}>
            {groups.map((group, i) => (
              <div key={i} style={{
                padding: '16px 20px', border: `2px solid ${TEAM_COLORS[i % TEAM_COLORS.length]}`,
                borderLeft: `5px solid ${TEAM_COLORS[i % TEAM_COLORS.length]}`,
                background: `${TEAM_COLORS[i % TEAM_COLORS.length]}12`,
              }}>
                <div style={{
                  fontFamily: 'Russo One, Rajdhani, sans-serif', fontSize: 18,
                  color: TEAM_COLORS[i % TEAM_COLORS.length], marginBottom: 8,
                }}>
                  КОМАНДА {i + 1}
                </div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 20, color: '#eee', lineHeight: 1.5 }}>
                  {group.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {teams.length === 0 && (
        <div className="glitch-title" style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 13, color: '#555', letterSpacing: '0.1em'
        }}>
          ОЖИДАНИЕ КОМАНД...
        </div>
      )}

      {/* Старт игры прямо с лобби, когда команды на месте */}
      {teams.length > 0 && (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ fontSize: 16, padding: '14px 28px' }}
            onClick={() => updateGameState({
              current_round: 0, current_step: 0, status: 'round_intro',
              accepting_answers: false, show_scoreboard: false, step_data: {},
            })}>
            РАЗОГРЕВ
          </button>
          <button className="btn btn-primary" style={{ fontSize: 26, padding: '18px 48px' }}
            onClick={() => updateGameState({
              current_round: 1, current_step: 0, status: 'round_intro',
              accepting_answers: false, show_scoreboard: false, step_data: {},
            })}>
            НАЧАТЬ ИГРУ →
          </button>
        </div>
      )}

      {/* Незаметная ссылка в угол — для тебя, не для гостей */}
      <a href="#/admin" style={{
        position: 'absolute', bottom: 12, right: 16,
        fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#222',
        textDecoration: 'none', letterSpacing: '0.1em'
      }}>
        admin
      </a>
    </div>
  )
}
