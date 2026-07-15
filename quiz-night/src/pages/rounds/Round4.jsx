import { useEffect, useRef, useState } from 'react'
import { Slide, NavButtons } from '../../components/RoundShell'
import { setPhase } from '../../lib/roundFlow'
import { updateGameState, awardPoints, markAnswer } from '../../lib/gameActions'
import { useAnswers } from '../../hooks/useAnswers'
import { mediaSrc, pointsLabel } from '../../lib/paths'

// ═══ РАУНД 4: МУЗЫКАЛЬНАЯ СВОЯ ИГРА ═══
// Клик по плитке → модалка: сразу играет трек, идёт обратный отсчёт,
// капитаны сразу могут слать ответы, ответы видны в модалке в реальном времени,
// ведущий начисляет баллы прямо там. Кнопки: ПЕРЕСЛУШАТЬ и ЗАКРЫТЬ (плитка сгорает).
export const ROUND4 = {
  number: 4,
  titleLines: ['МУЗЫКАЛЬНАЯ', 'СВОЯ ИГРА'],
  metaLine: '6 ТЕМ × 4 ОТРЫВКА · 30 СЕК ОТРЫВОК',
  clipSeconds: 30,
  rules: [
  '6 тем, в каждой 4 отрывка стоимостью 0.5 / 1 / 1.5 / 2 балла',
    'Играет по одному человеку от команды',
    'Выбираете плитку — я её запускаю',
    'Отрывок играет 30 секунд',
    'Баллы заберет игрок команды, отправивший правильный ответ первым>',
  ],
   themes: [
    { name: 'РУССКИЙ РОК', hint: 'только русский рок', tiles: [
      { value: 0.5, audio: '/media/song_1_1.mp3', correct_answer: '—' },
      { value: 1,   audio: '/media/song_1_2.mp3', correct_answer: '—' },
      { value: 1.5, audio: '/media/song_1_3.mp3', correct_answer: '—' },
      { value: 2,   audio: '/media/song_1_4.mp3', correct_answer: '—' },
    ]},
    { name: 'ЗАРУБЕЖНЫЙ РОК', hint: 'только зарубежный рок', tiles: [
      { value: 0.5, audio: '/media/song_2_1.mp3', correct_answer: 'Red Hot Chili Peppers' },
      { value: 1,   audio: '/media/song_2_2.mp3', correct_answer: 'Marilyn Manson' },
      { value: 1.5, audio: '/media/song_2_3.mp3', correct_answer: 'Green day' },
      { value: 2,   audio: '/media/song_2_4.mp3', correct_answer: 'Iron_Maiden' },
    ]},
    { name: 'НОВИНКИ', hint: 'известные исполнители, но с новыми песнями', tiles: [
      { value: 0.5, audio: '/media/song_3_1.mp3', correct_answer: 'Tokio Hotel' }, { value: 1, audio: '/media/song_3_2.mp3', correct_answer: 'Макс Корж' },
      { value: 1.5, audio: '/media/song_3_3.mp3', correct_answer: 'Ariana Grande' }, { value: 2, audio: '/media/song_3_4.mp3', correct_answer: 'Muse' },
    ]},
    { name: 'РУССКАЯ РУЛЕТКА', hint: 'всё что угодно', tiles: [
      { value: 0.5, audio: '/media/song_4_1.mp3', correct_answer: 'Britney Spears' }, { value: 1, audio: '/media/song_4_2.mp3', correct_answer: 'Нюша' },
      { value: 1.5, audio: '/media/song_4_3.mp3', correct_answer: 'Oxxxymiron' }, { value: 2, audio: '/media/song_4_4.mp3', correct_answer: 'Егор Крид' },
    ]},
    { name: 'Я БЫЛ НА ЕВРОВИДЕНИИ', hint: '', tiles: [
      { value: 0.5, audio: '/media/song_5_1.mp3', correct_answer: 'The Rasmus' }, { value: 1, audio: '/media/song_5_2.mp3', correct_answer: 'Flo Rida' },
      { value: 1.5, audio: '/media/song_5_3.mp3', correct_answer: 'Brainstorm' }, { value: 2, audio: '/media/song_5_4.mp3', correct_answer: 'Лара Фабиан' },
    ]},
    { name: 'ШКОЛЬНАЯ ДИСКОТЕКА', hint: 'хиты нашей юности', tiles: [
      { value: 0.5, audio: '/media/song_6_1.mp3', correct_answer: 'Дима Билан' }, { value: 1, audio: '/media/song_6_2.mp3', correct_answer: 'Энрике Иглесиас' },
      { value: 1.5, audio: '/media/song_6_3.mp3', correct_answer: 'Danzel' }, { value: 2, audio: '/media/song_6_4.mp3', correct_answer: 'Sugababes' },
    ]},
  ],
}

export default function Round4({ gameState }) {
  const { status, step_data = {} } = gameState
  const opened = step_data.opened || []
  const active = step_data.active || null

  async function openTile(themeIdx, tileIdx) {
    const key = `${themeIdx}-${tileIdx}`
    if (opened.includes(key)) return
    await updateGameState({
      step_data: { ...step_data, active: key, opened: [...opened, key] },
      accepting_answers: true,
    })
  }

  async function closeTile() {
    await updateGameState({
      step_data: { ...step_data, active: null },
      accepting_answers: false,
    })
  }

  if (status === 'round_intro') return (
    <Slide>
      <div className="mono-tag">РАУНД 04</div>
      <h1 className="neon-title glitch-title" style={T.title}>МУЗЫКАЛЬНАЯ<br /><span style={{ color: '#ea580c' }}>СВОЯ ИГРА</span></h1>
      <div style={T.meta}>{ROUND4.metaLine}</div>
      <NavButtons onNext={() => setPhase('rules')} nextLabel="ПРАВИЛА →" />
    </Slide>
  )
  if (status === 'rules') return (
    <Slide>
      <div className="mono-tag">РАУНД 04 :: ПРАВИЛА</div>
      <div className="card" style={{ maxWidth: 640 }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ROUND4.rules.map((r, i) => (
            <li key={i} className="rule-line" style={{ ...T.rule, animationDelay: `${i * 0.4}s` }}>
              <span style={T.num}>{String(i + 1).padStart(2, '0')}</span>{r}
            </li>
          ))}
        </ul>
      </div>
      <NavButtons onBack={() => setPhase('round_intro')} onNext={() => setPhase('question', 0)} nextLabel="К СЕТКЕ →" />
    </Slide>
  )

  return (
    <div className="grid-bg flex-col" style={{ height: '100vh', overflow: 'hidden', padding: '24px 40px', gap: 16, display: 'flex', position: 'relative' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="glitch-title-rare" style={{
          fontFamily: 'Russo One, sans-serif', fontSize: 'clamp(40px, 5vw, 72px)',
          color: '#fff', textShadow: '0 0 26px rgba(234,88,12,0.4)', letterSpacing: '0.02em',
        }}>
          МУЗЫКАЛЬНАЯ <span style={{ color: '#ea580c' }}>СВОЯ ИГРА</span>
        </div>
        <div className="gradient-underline" style={{ marginTop: 8 }} />
      </div>

      {/* Сетка — полностью статичная: фикс. высота шапки и плиток, ничего не может «прыгнуть» */}
      <div style={{
        flex: 1, minHeight: 0, display: 'grid',
        gridTemplateColumns: `repeat(${ROUND4.themes.length}, minmax(0, 1fr))`,
        gridTemplateRows: `100px repeat(${Math.max(...ROUND4.themes.map(t => t.tiles.length))}, 1fr)`,
        gap: 10,
      }}>
        {ROUND4.themes.map((theme, t) => (
          <div key={t} style={T.themeHead}>
            {theme.name}
            {theme.hint && <div style={T.themeHint}>{theme.hint}</div>}
          </div>
        ))}
        {ROUND4.themes.map((theme, t) => (
          theme.tiles.map((tile, i) => {
            const key = `${t}-${i}`
            const isOpened = opened.includes(key)
            return (
              <button key={key} className="jeopardy-tile" onClick={() => openTile(t, i)} disabled={isOpened} style={{
                gridColumn: t + 1, gridRow: i + 2,
                cursor: isOpened ? 'default' : 'pointer',
                border: `1px solid ${isOpened ? '#1a1a1a' : '#333'}`,
                background: isOpened ? '#0a0a0a' : '#111',
                color: isOpened ? '#2a2a2a' : '#fff',
                fontFamily: 'Orbitron, Share Tech Mono, monospace', fontSize: 'clamp(18px, 2.2vw, 32px)', fontWeight: 700,
                transition: 'all 0.2s',
              }}>
                {isOpened ? '·' : tile.value}
              </button>
            )
          })
        ))}
      </div>

      <NavButtons onNext={() => setPhase('scoreboard', 0, { show_scoreboard: true })} nextLabel="ЗАВЕРШИТЬ РАУНД →" />

      {/* Модалка активной плитки */}
      {active && <TileModal active={active} onClose={closeTile} />}
    </div>
  )
}

// ═══ МОДАЛКА ПЛИТКИ ═══
function TileModal({ active, onClose }) {
  const [t, i] = active.split('-').map(Number)
  const theme = ROUND4.themes[t]
  const tile = theme?.tiles[i]
  const [answers] = useAnswers(4)
  const audioRef = useRef(null)
  const intervalRef = useRef(null)
  const [remaining, setRemaining] = useState(ROUND4.clipSeconds)
  const [playing, setPlaying] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => { setShowAnswer(false) }, [active])

  const tileAnswers = answers
    .filter(a => a.question_ref === `r4-q${t}-${i}`)
    .sort((x, y) => new Date(x.updated_at) - new Date(y.updated_at))

  function play() {
    audioRef.current?.pause()
    clearInterval(intervalRef.current)
    if (document.hidden) return  // скрытый дубль вкладки не играет

    if (!tile?.audio) { setPlaying(false); return }
    const audio = new Audio(mediaSrc(tile.audio))
    audioRef.current = audio
    setRemaining(ROUND4.clipSeconds)
    setPlaying(true)
    audio.play().catch(() => setPlaying(false))

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          audio.pause()
          setPlaying(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Автозапуск при открытии
  useEffect(() => {
    play()
    return () => {
      audioRef.current?.pause()
      clearInterval(intervalRef.current)
    }
  }, [active])

  // Проверка ответа: верно = +стоимость плитки. Защита от даблклика + откат.
  async function grade(a, correct) {
    if (a.is_correct === correct) return
    const prev = Number(a.points_awarded ?? 0)
    if (prev !== 0) await awardPoints(a.team_id, 4, a.question_ref, -prev, 'revert')
    const delta = correct ? tile.value : 0
    await markAnswer(a.id, correct, delta)
    if (delta !== 0) await awardPoints(a.team_id, 4, a.question_ref, delta, correct ? 'correct' : 'wrong')
  }

  return (
    <div style={M.overlay}>
      <div style={M.modal}>
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 28, fontWeight: 700, color: '#ea580c' }}>
              {theme?.name}
            </div>
            <div style={M.dim}>ПЛИТКА · {tile?.value} {pointsLabel(tile?.value).toUpperCase()}</div>
          </div>
          {/* Отсчёт */}
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 48,
            color: playing ? '#ea580c' : '#333',
            animation: playing ? 'scanpulse 1s ease-in-out infinite' : 'none',
          }}>
            {String(remaining).padStart(2, '0')}
          </div>
        </div>

        {/* Правильный ответ — открывается кнопкой */}
        {showAnswer && (
          <div className="fade-in" style={{
            textAlign: 'center', padding: '12px 16px',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
          }}>
            <div style={{ ...M.dim, color: '#22c55e', marginBottom: 4 }}>ПРАВИЛЬНЫЙ ОТВЕТ</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 26, fontWeight: 700, color: '#22c55e' }}>
              {tile?.correct_answer}
            </div>
          </div>
        )}

        {/* Ответы команд в реальном времени */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
          <div style={M.dim}>ОТВЕТЫ (ПО СКОРОСТИ)</div>
          {tileAnswers.length === 0 && <div style={{ ...M.dim, color: '#333' }}>ждём ответы...</div>}
          {tileAnswers.map((a, pos) => (
            <div key={a.id} style={{
              background: '#111', border: '1px solid #222',
              borderLeft: `3px solid ${a.is_correct === true ? '#22c55e' : a.is_correct === false ? '#ef4444' : '#333'}`,
              padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: pos === 0 ? '#ea580c' : '#555', minWidth: 26 }}>
                #{pos + 1}
              </div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: a.teams?.color || '#ea580c', minWidth: 80, fontSize: 15 }}>
                {a.teams?.name}
              </div>
              <div style={{ flex: 1, fontSize: 15, color: '#ccc' }}>{a.answer_text || '—'}</div>
              {/* Кнопки мьютятся после выставления оценки */}
              <button onClick={() => grade(a, true)} disabled={a.is_correct != null}
                style={M.gradeBtn('#22c55e', a.is_correct === true, a.is_correct != null)}>✓</button>
              <button onClick={() => grade(a, false)} disabled={a.is_correct != null}
                style={M.gradeBtn('#ef4444', a.is_correct === false, a.is_correct != null)}>✗</button>
            </div>
          ))}
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {!showAnswer && (
            <button className="btn btn-ghost" onClick={() => setShowAnswer(true)}>ПОКАЗАТЬ ОТВЕТ</button>
          )}
          <button className="btn btn-ghost" onClick={play}>↻ ПЕРЕСЛУШАТЬ</button>
          <button className="btn btn-danger" onClick={onClose}>ЗАКРЫТЬ</button>
        </div>
      </div>
    </div>
  )
}

const T = {
  title: { fontFamily: 'Russo One, Rajdhani, sans-serif', fontSize: 'clamp(68px, 12vw, 150px)', lineHeight: 0.95, textAlign: 'center', letterSpacing: '-0.02em', color: '#fff' },
  meta: { color: '#777', fontFamily: 'Share Tech Mono, monospace', fontSize: 19, letterSpacing: '0.2em' },
  rule: { display: 'flex', gap: 14, alignItems: 'flex-start', fontFamily: 'Inter, sans-serif', fontSize: 24, color: '#ddd', lineHeight: 1.65 },
  num: { color: '#ea580c', fontFamily: 'Share Tech Mono, monospace', fontSize: 12, marginTop: 4 },
  themeHead: {
    fontFamily: 'Russo One, Rajdhani, sans-serif', fontSize: 'clamp(15px, 1.8vw, 24px)',
    textAlign: 'center', color: '#ea580c',
    padding: '10px 6px', border: '1px solid #333', background: '#0d0d0d',
    letterSpacing: '0.03em',
    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    overflow: 'hidden',
  },
  themeHint: {
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: 'clamp(12px, 1.15vw, 16px)', fontWeight: 400,
    color: '#999', marginTop: 8, letterSpacing: 0,
    overflow: 'hidden', textOverflow: 'ellipsis',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    lineHeight: 1.3,
  },
}

const M = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: 24,
  },
  modal: {
    background: '#0d0d0d', border: '1px solid #333', borderTop: '3px solid #ea580c',
    width: '100%', maxWidth: 760, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', gap: 20, padding: 28,
  },
  dim: { fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', letterSpacing: '0.12em' },
  gradeBtn: (color, activeMark, graded) => ({
    width: 34, height: 34, border: `1px solid ${color}`,
    background: activeMark ? `${color}25` : 'transparent',
    color, cursor: graded ? 'default' : 'pointer',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 14, fontWeight: 700,
    opacity: activeMark ? 1 : graded ? 0.15 : 0.55,
  }),
}
