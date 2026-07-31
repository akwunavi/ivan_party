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

  // Есть распределение → компактная раскладка в один экран:
  // слева QR, по центру составы команд, справа подключившиеся в 2 колонки.
  const compact = Boolean(groups)

  return (
    <div className="grid-bg flex-col" style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '24px 40px', gap: compact ? 18 : 28,
    }}>

      {/* Заголовок — в компактном режиме сильно меньше, чтобы освободить экран */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div className="mono-tag" style={{ marginBottom: compact ? 6 : 16 }}>
          QUIZ_NIGHT :: ЛОББИ
        </div>
        <div className="glitch-title" style={{
          fontFamily: 'Russo One, Rajdhani, sans-serif',
          fontSize: compact ? 'clamp(80px, 12vw, 190px)' : 'clamp(120px, 20vw, 300px)',
          fontWeight: 700, lineHeight: 0.92,
          letterSpacing: '-0.02em', color: '#fff',
        }}>
          {compact
            ? <>QUIZ <span style={{ color: '#ea580c' }}>NIGHT</span></>
            : <>QUIZ<br /><span style={{ color: '#ea580c' }}>NIGHT</span></>}
        </div>
      </div>

      <div className="accent-line scan" style={{ width: '80%', flexShrink: 0 }} />

      {/* ═══ ОСНОВНАЯ ЗОНА: три колонки по горизонтали ═══ */}
      <div style={{
        display: 'flex', gap: 28, alignItems: 'stretch', justifyContent: 'center',
        width: '100%', flex: 1, minHeight: 0, alignItems: 'center', flexWrap: compact ? 'nowrap' : 'wrap',
      }}>

        {/* 1. QR — слева */}
        <div style={{
          background: '#0d0d0d', border: '1px solid #333', borderLeft: '3px solid #ea580c',
          padding: compact ? '24px 28px' : '20px 28px',
          display: 'flex', flexDirection: compact ? 'column' : 'row',
          alignItems: 'center', justifyContent: 'center', gap: compact ? 12 : 20, flexShrink: 0,
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}>
          <div style={{
            background: '#fff', padding: 8, borderRadius: 4,
            boxShadow: pulse ? '0 0 20px rgba(234,88,12,0.6)' : 'none', transition: 'box-shadow 0.3s',
          }}>
            <QRCodeSVG value={PLAYER_URL} size={compact ? 190 : 140} />
          </div>
          <div style={{ textAlign: compact ? 'center' : 'left' }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: compact ? 26 : 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              ПОДКЛЮЧАЙСЯ<br />К ИГРЕ
            </div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>
              ОТСКАНИРУЙ QR
            </div>
          </div>
        </div>

        {/* 2. Составы команд — центр, растут вширь, а не вниз */}
        {groups && (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="mono-tag" style={{ fontSize: 16, flexShrink: 0 }}>
              🎲 РАСПРЕДЕЛЕНИЕ — ВЫБЕРИТЕ КАПИТАНА С ХОРОШИМ VPN И ТЕЛЕФОНОМ, КОТОРЫЙ НЕ СЯДЕТ ЗА 20 МИНУТ
            </div>
            <div style={{
              flex: 1, minHeight: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${groups.length <= 2 ? groups.length : groups.length <= 4 ? 2 : 3}, 1fr)`,
              gap: 14, alignContent: 'stretch',
            }}>
              {groups.map((group, i) => (
                <div key={i} style={{
                  padding: '18px 22px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  border: `2px solid ${TEAM_COLORS[i % TEAM_COLORS.length]}`,
                  borderLeft: `5px solid ${TEAM_COLORS[i % TEAM_COLORS.length]}`,
                  background: `${TEAM_COLORS[i % TEAM_COLORS.length]}12`,
                }}>
                  <div style={{
                    fontFamily: 'Russo One, Rajdhani, sans-serif', fontSize: 24,
                    color: TEAM_COLORS[i % TEAM_COLORS.length], marginBottom: 8,
                  }}>
                    КОМАНДА {i + 1}
                  </div>
                  <div style={{
                    fontFamily: 'Rajdhani, sans-serif', fontSize: 26, color: '#eee', lineHeight: 1.4, fontWeight: 600,
                    overflowWrap: 'anywhere',
                  }}>
                    {group.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Подключившиеся — справа, в 2 колонки */}
        {teams.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, maxWidth: compact ? '30vw' : undefined }}>
            <div className="mono-tag" style={{ fontSize: 16 }}>ПОДКЛЮЧИЛИСЬ ({teams.length})</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: compact && teams.length > 3 ? '1fr 1fr' : '1fr',
              gap: 10, alignContent: 'start',
            }}>
              {teams.map((team, i) => (
                <div key={team.id} className="team-chip-fx" style={{
                  padding: compact ? '14px 22px' : '14px 26px',
                  border: `2px solid ${team.color || TEAM_COLORS[i % TEAM_COLORS.length]}`,
                  borderLeft: `5px solid ${team.color || TEAM_COLORS[i % TEAM_COLORS.length]}`,
                  background: `${team.color || TEAM_COLORS[i % TEAM_COLORS.length]}18`,
                  fontFamily: 'Russo One, Rajdhani, sans-serif',
                  fontSize: compact ? 22 : 24, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                }}>
                  {team.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {teams.length === 0 && (
        <div className="glitch-title" style={{
          fontFamily: 'Share Tech Mono, monospace', fontSize: 13, color: '#555', letterSpacing: '0.1em', flexShrink: 0,
        }}>
          ОЖИДАНИЕ КОМАНД...
        </div>
      )}

      {/* Старт игры: одна кнопка, всегда начинает с разогрева (Раунд 0) */}
      {teams.length > 0 && (
        <button className="btn btn-primary" style={{ fontSize: compact ? 26 : 26, padding: compact ? '18px 48px' : '18px 48px', flexShrink: 0 }}
          onClick={() => updateGameState({
            current_round: 0, current_step: 0, status: 'round_intro',
            accepting_answers: false, show_scoreboard: false, step_data: {}, completed_rounds: [],
          })}>
          НАЧАТЬ ИГРУ →
        </button>
      )}

      <a href="#/admin" style={{
        position: 'absolute', bottom: 12, right: 16,
        fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#222',
        textDecoration: 'none', letterSpacing: '0.1em',
      }}>
        admin
      </a>
    </div>
  )
}
