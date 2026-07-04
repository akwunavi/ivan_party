import { useEffect, useRef } from 'react'
import { Slide, NavButtons } from '../../components/RoundShell'
import { setPhase } from '../../lib/roundFlow'
import { updateGameState } from '../../lib/gameActions'

// ═══ РАУНД 4: МУЗЫКАЛЬНАЯ СВОЯ ИГРА ═══
// 6 тем × 4 отрывка. Команда называет плитку → ты жмёшь её → музыка играет 30 сек.
// Ответ капитаны шлют сразу. Стоимость плитки фиксирована в коде.
// Открытые плитки хранятся в game_state.step_data.opened — переживают перезагрузку.
export const ROUND4 = {
  number: 4,
  titleLines: ['МУЗЫКАЛЬНАЯ', 'СВОЯ ИГРА'],
  metaLine: '6 ТЕМ × 4 ОТРЫВКА · 30 СЕК ОТРЫВОК',
  clipSeconds: 30,
  rules: [
    '6 тем, в каждой 4 отрывка стоимостью 0.5 / 1 / 1.5 / 2 балла',
    'Команда называет плитку — ведущий её запускает',
    'Отрывок играет 30 секунд',
    'Ответ можно отправить сразу, как заиграла музыка',
  ],
  // Темы и плитки. У каждой плитки value и audio.
  themes: [
    { name: 'ТЕМА 1', tiles: [
      { value: 0.5, audio: '/media/r4/t1-1.mp3', correct_answer: '—' },
      { value: 1,   audio: '/media/r4/t1-2.mp3', correct_answer: '—' },
      { value: 1.5, audio: '/media/r4/t1-3.mp3', correct_answer: '—' },
      { value: 2,   audio: '/media/r4/t1-4.mp3', correct_answer: '—' },
    ]},
    { name: 'ТЕМА 2', tiles: [
      { value: 0.5, audio: '', correct_answer: '—' },
      { value: 1,   audio: '', correct_answer: '—' },
      { value: 1.5, audio: '', correct_answer: '—' },
      { value: 2,   audio: '', correct_answer: '—' },
    ]},
    { name: 'ТЕМА 3', tiles: [
      { value: 0.5, audio: '', correct_answer: '—' }, { value: 1, audio: '', correct_answer: '—' },
      { value: 1.5, audio: '', correct_answer: '—' }, { value: 2, audio: '', correct_answer: '—' },
    ]},
    { name: 'ТЕМА 4', tiles: [
      { value: 0.5, audio: '', correct_answer: '—' }, { value: 1, audio: '', correct_answer: '—' },
      { value: 1.5, audio: '', correct_answer: '—' }, { value: 2, audio: '', correct_answer: '—' },
    ]},
    { name: 'ТЕМА 5', tiles: [
      { value: 0.5, audio: '', correct_answer: '—' }, { value: 1, audio: '', correct_answer: '—' },
      { value: 1.5, audio: '', correct_answer: '—' }, { value: 2, audio: '', correct_answer: '—' },
    ]},
    { name: 'ТЕМА 6', tiles: [
      { value: 0.5, audio: '', correct_answer: '—' }, { value: 1, audio: '', correct_answer: '—' },
      { value: 1.5, audio: '', correct_answer: '—' }, { value: 2, audio: '', correct_answer: '—' },
    ]},
  ],
}

export default function Round4({ gameState }) {
  const { status, step_data = {} } = gameState
  const opened = step_data.opened || []       // ["0-1", "3-2"] = тема-плитка
  const active = step_data.active || null     // "0-1" — сейчас играет
  const audioRef = useRef(null)

  // Запуск плитки: пишем в Supabase (переживает перезагрузку) + играем аудио
  async function openTile(themeIdx, tileIdx) {
    const key = `${themeIdx}-${tileIdx}`
    if (opened.includes(key)) return
    await updateGameState({
      step_data: { ...step_data, active: key, opened: [...opened, key] },
      accepting_answers: true,
    })
  }

  async function closeTile() {
    audioRef.current?.pause()
    await updateGameState({ step_data: { ...step_data, active: null } })
  }

  // Играем аудио активной плитки, стоп через 30 сек
  useEffect(() => {
    if (!active) return
    const [t, i] = active.split('-').map(Number)
    const tile = ROUND4.themes[t]?.tiles[i]
    if (!tile?.audio) return
    const audio = new Audio(tile.audio)
    audioRef.current = audio
    audio.play().catch(() => {})
    const stop = setTimeout(() => audio.pause(), ROUND4.clipSeconds * 1000)
    return () => { clearTimeout(stop); audio.pause() }
  }, [active])

  // ── ИНТРО / ПРАВИЛА ──
  if (status === 'round_intro') return (
    <Slide>
      <div className="mono-tag">// РАУНД 04</div>
      <h1 style={T.title}>МУЗЫКАЛЬНАЯ<br /><span style={{ color: '#ea580c' }}>СВОЯ ИГРА</span></h1>
      <div style={T.meta}>{ROUND4.metaLine}</div>
      <NavButtons onNext={() => setPhase('rules')} nextLabel="ПРАВИЛА →" />
    </Slide>
  )
  if (status === 'rules') return (
    <Slide>
      <div className="mono-tag">// РАУНД 04 :: ПРАВИЛА</div>
      <div className="card" style={{ maxWidth: 640 }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ROUND4.rules.map((r, i) => (
            <li key={i} style={T.rule}><span style={T.num}>{String(i + 1).padStart(2, '0')}</span>{r}</li>
          ))}
        </ul>
      </div>
      <NavButtons onBack={() => setPhase('round_intro')} onNext={() => setPhase('question', 0)} nextLabel="К СЕТКЕ →" />
    </Slide>
  )

  // ── СЕТКА ──
  return (
    <div className="full-screen grid-bg flex-col" style={{ padding: '24px 40px', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="mono-tag">// РАУНД 04 :: СВОЯ ИГРА</div>
        {active && (
          <button className="btn btn-danger" onClick={closeTile}>■ СТОП</button>
        )}
      </div>

      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: `repeat(${ROUND4.themes.length}, 1fr)`,
        gap: 10,
      }}>
        {ROUND4.themes.map((theme, t) => (
          <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(12px, 1.4vw, 20px)',
              fontWeight: 700, textAlign: 'center', color: '#ea580c',
              padding: '10px 4px', border: '1px solid #333', background: '#0d0d0d',
              letterSpacing: '0.05em',
            }}>
              {theme.name}
            </div>
            {theme.tiles.map((tile, i) => {
              const key = `${t}-${i}`
              const isOpened = opened.includes(key)
              const isActive = active === key
              return (
                <button key={i} onClick={() => openTile(t, i)} disabled={isOpened && !isActive} style={{
                  flex: 1, cursor: isOpened ? 'default' : 'pointer',
                  border: `1px solid ${isActive ? '#ea580c' : isOpened ? '#1a1a1a' : '#333'}`,
                  background: isActive ? 'rgba(234,88,12,0.2)' : isOpened ? '#0a0a0a' : '#111',
                  color: isActive ? '#ea580c' : isOpened ? '#2a2a2a' : '#fff',
                  fontFamily: 'Share Tech Mono, monospace', fontSize: 'clamp(16px, 2vw, 28px)',
                  transition: 'all 0.2s',
                  animation: isActive ? 'scanpulse 1s ease-in-out infinite' : 'none',
                }}>
                  {isActive ? '♪' : isOpened ? '·' : tile.value}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <NavButtons onNext={() => setPhase('show_answers')} nextLabel="ЗАВЕРШИТЬ РАУНД →" />
    </div>
  )
}

const T = {
  title: { fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 700, lineHeight: 0.95, textAlign: 'center', letterSpacing: '-0.02em', color: '#fff' },
  meta: { color: '#555', fontFamily: 'Share Tech Mono, monospace', fontSize: 12, letterSpacing: '0.15em' },
  rule: { display: 'flex', gap: 12, alignItems: 'flex-start', fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#ccc', lineHeight: 1.6 },
  num: { color: '#ea580c', fontFamily: 'Share Tech Mono, monospace', fontSize: 12, marginTop: 4 },
}
