import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameState } from '../hooks/useGameState'
import { registerTeam } from '../lib/gameActions'
import { ROUND_CONFIGS } from '../lib/roundsRegistry'

const TEAM_COLORS = ['#ea580c', '#3b82f6', '#22c55e', '#a855f7']

export default function PlayerPage() {
  const { gameState, loading } = useGameState()
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem('quiz_team')
    return saved ? JSON.parse(saved) : null
  })

  if (!team) return <Register onDone={setTeam} />
  if (loading || !gameState) return <Waiting team={team} message="ПОДКЛЮЧЕНИЕ..." />

  const { status, current_round } = gameState

  if (status === 'lobby' || current_round === 0) return <Waiting team={team} message="ОЖИДАЕМ НАЧАЛА ИГРЫ" />
  if (status === 'scoreboard') return <Waiting team={team} message="ПОДВОДИМ ИТОГИ..." />
  if (status === 'round_intro' || status === 'rules') return <Waiting team={team} message={`РАУНД ${current_round}`} sub="Слушай правила" />
  if (status === 'show_answers') return <Waiting team={team} message="ПРОВЕРЯЕМ ОТВЕТЫ" />

  // Во всех «игровых» фазах — форма открыта весь раунд
  if (current_round === 4) return <JeopardyForm key={4} team={team} gameState={gameState} />
  return <AnswerForm key={current_round} team={team} gameState={gameState} />
}

// ═══ РАУНД 4: ОТВЕТ НА АКТИВНУЮ ПЛИТКУ ═══
// Плитку выбирает ведущий → у капитана открывается поле именно под неё.
// Скорость решает: время отправки (submitted_at) видно ведущему.
function JeopardyForm({ team, gameState }) {
  const config = ROUND_CONFIGS[4]
  const active = gameState.step_data?.active || null   // "t-i"
  const [text, setText] = useState('')
  const [sentFor, setSentFor] = useState(null)

  useEffect(() => { setText(''); setSentFor(null) }, [active])

  if (!active) return <Waiting team={team} message="РАУНД 4 · СВОЯ ИГРА" sub="Выбирайте плитку — ведущий её запустит" />

  const [t, i] = active.split('-').map(Number)
  const theme = config.themes[t]
  const tile = theme?.tiles[i]

  async function send() {
    if (!text.trim()) return
    await supabase.from('answers').upsert({
      team_id: team.id,
      game_id: gameState.game_id,
      question_ref: `r4-q${t}-${i}`,
      round_number: 4,
      answer_text: text.trim(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'team_id,question_ref' })
    setSentFor(active)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={P.header}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700, color: team.color }}>{team.name}</div>
        <div style={P.headerMeta}>РАУНД 4</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20, gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 24, fontWeight: 700, color: '#ea580c' }}>{theme?.name}</div>
          <div style={P.mono}>ПЛИТКА · {tile?.value} БАЛЛА</div>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Твой ответ..." rows={2} style={P.textarea} />
        <button onClick={send} style={{ ...P.primaryBtn, opacity: text.trim() ? 1 : 0.4 }}>
          {sentFor === active ? '✓ ОТПРАВЛЕНО (МОЖНО ИСПРАВИТЬ)' : 'ОТПРАВИТЬ'}
        </button>
        <div style={{ ...P.mono, textAlign: 'center', color: '#333' }}>// КТО БЫСТРЕЕ — ВЕДУЩИЙ ВИДИТ ВРЕМЯ</div>
      </div>
    </div>
  )
}

// ═══ ФОРМА ОТВЕТОВ ═══
// Ответы и ставки хранятся локально (переживают перезагрузку телефона)
// и отправляются в Supabase при каждом изменении.
function AnswerForm({ team, gameState }) {
  const round = gameState.current_round
  const config = ROUND_CONFIGS[round]
  const questions = config?.questions || []
  const isStakes = config?.stakesRound
  const uniqueStakes = isStakes && round === 5 // каждая ставка 1 раз
  const collapsible = round === 3 || round === 5 // ответы спрятаны под шевроном
  const [openIdx, setOpenIdx] = useState(null)

  const storageKey = `quiz_answers_r${round}`
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : { answers: {}, stakes: {}, edits: {} }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state])

  // Вопрос доступен, только если его уже зачитали:
  // в фазе вопросов — все до текущего включительно, дальше (повторы, ответы) — все.
  function unlocked(i) {
    if (gameState.status === 'question') return i <= gameState.current_step
    return true
  }

  // В Р3/Р5 ответ можно поменять один раз: выбор + одно исправление, потом замок.
  function locked(i) {
    if (!collapsible) return false
    return (state.edits?.[i] ?? 0) >= 1 && state.answers[i] != null
  }

  async function push(qIdx, answer, stake) {
    await supabase.from('answers').upsert({
      team_id: team.id,
      game_id: gameState.game_id,
      question_ref: `r${round}-q${qIdx}`,
      round_number: round,
      answer_text: answer,
      stake: stake,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'team_id,question_ref' })
  }

  function setAnswer(qIdx, text) {
    setState(s => {
      const had = s.answers[qIdx]
      const edits = { ...s.edits }
      // считаем исправлением только смену УЖЕ выбранного варианта (для Р3/Р5)
      if (collapsible && had != null && had !== text) edits[qIdx] = (edits[qIdx] ?? 0) + 1
      return { ...s, answers: { ...s.answers, [qIdx]: text }, edits }
    })
    push(qIdx, text, state.stakes[qIdx] ?? null)
  }

  function setStake(qIdx, value) {
    setState(s => {
      const stakes = { ...s.stakes }
      if (uniqueStakes) {
        // эта ставка занята другим вопросом? снять оттуда
        for (const k of Object.keys(stakes)) {
          if (stakes[k] === value && Number(k) !== qIdx) {
            delete stakes[k]
            push(Number(k), s.answers[k] ?? null, null)
          }
        }
      }
      stakes[qIdx] = value
      push(qIdx, s.answers[qIdx] ?? null, value)
      return { ...s, stakes }
    })
  }

  const accepting = gameState.accepting_answers
  const filled = Object.values(state.answers).filter(Boolean).length

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={P.header}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700, color: team.color }}>{team.name}</div>
        <div style={P.headerMeta}>РАУНД {round}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!accepting && (
          <div style={P.notice}>// СЛУШАЙ ВОПРОСЫ — ОТВЕТЫ МОЖНО ВНОСИТЬ И ПРАВИТЬ ВЕСЬ РАУНД</div>
        )}

        {questions.map((q, i) => {
          const isUnlocked = unlocked(i)
          const isLocked = locked(i)
          const isOpen = !collapsible || openIdx === i
          const hasChoices = !!q.choices || round === 3

          return (
            <div key={i} style={{ ...P.qCard, borderLeftColor: state.answers[i] ? '#22c55e' : isUnlocked ? '#333' : '#1a1a1a', opacity: isUnlocked ? 1 : 0.45 }}>
              {/* Шапка строки — в Р3/Р5 это шеврон-аккордеон */}
              <div
                onClick={() => collapsible && isUnlocked && setOpenIdx(isOpen ? null : i)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: collapsible && isUnlocked ? 'pointer' : 'default' }}
              >
                <div style={P.qLabel}>
                  ВОПРОС {i + 1}
                  {q.is_final_question && <span style={{ color: '#ea580c' }}> · ТЕМА РАУНДА ×2</span>}
                  {!isUnlocked && <span style={{ color: '#333' }}> · ЕЩЁ НЕ ЗАЧИТАН</span>}
                  {isLocked && <span style={{ color: '#ef4444' }}> · 🔒</span>}
                </div>
                {collapsible && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {state.answers[i] && <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{state.answers[i]}</span>}
                    <span style={{ color: '#555', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                )}
              </div>

              {isOpen && isUnlocked && (
                <>
                  {/* Текст вопроса — виден в развёрнутой строке */}
                  {collapsible && q.question_text && (
                    <div style={{ fontSize: 14, color: '#999', lineHeight: 1.5 }}>{q.question_text}</div>
                  )}

                  {hasChoices ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {(q.choices?.map(c => c.key) || ['А', 'Б', 'В', 'Г']).map(key => (
                        <button key={key} disabled={isLocked}
                          onClick={() => !isLocked && setAnswer(i, key)}
                          style={{ ...P.choiceBtn(state.answers[i] === key), opacity: isLocked && state.answers[i] !== key ? 0.3 : 1 }}>
                          {key}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={state.answers[i] || ''}
                      onChange={e => setAnswer(i, e.target.value)}
                      placeholder="Твой ответ..."
                      rows={2}
                      style={P.textarea}
                    />
                  )}

                  {collapsible && !isLocked && state.answers[i] && (
                    <div style={{ ...P.stakeLabel, marginBottom: 0, color: '#666' }}>// МОЖНО ИЗМЕНИТЬ ЕЩЁ 1 РАЗ</div>
                  )}

                  {isStakes && (
                    <div>
                      <div style={P.stakeLabel}>
                        // СТАВКА {uniqueStakes ? '(0–5, каждая один раз)' : '(0–2)'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {config.stakesValues.map(v => {
                          const selected = state.stakes[i] === v
                          const takenElsewhere = uniqueStakes && !selected &&
                            Object.entries(state.stakes).some(([k, sv]) => sv === v && Number(k) !== i)
                          return (
                            <button key={v} onClick={() => setStake(i, v)} style={P.stakeBtn(selected, takenElsewhere)}>
                              {v}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ ...P.footer, color: accepting ? '#22c55e' : '#555' }}>
        {accepting
          ? `// ОТВЕТЫ ПРИНИМАЮТСЯ · ЗАПОЛНЕНО ${filled}/${questions.length}`
          : `// ЗАПОЛНЕНО ${filled}/${questions.length} · ПРИЁМ ЕЩЁ НЕ ОТКРЫТ`}
      </div>
    </div>
  )
}

// ═══ РЕГИСТРАЦИЯ ═══
function Register({ onDone }) {
  const [name, setName] = useState('')
  const [colorIdx, setColorIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function go() {
    if (!name.trim()) { setError('Введи название команды'); return }
    setBusy(true); setError('')
    try {
      const t = await registerTeam(name.trim(), TEAM_COLORS[colorIdx])
      localStorage.setItem('quiz_team', JSON.stringify(t))
      onDone(t)
    } catch { setError('Ошибка. Попробуй ещё раз.') }
    setBusy(false)
  }

  return (
    <div style={P.center}>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 36, fontWeight: 700, color: '#ea580c' }}>QUIZ NIGHT</div>
      <div style={P.mono}>// РЕГИСТРАЦИЯ КОМАНДЫ</div>
      <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
        placeholder="Название команды" maxLength={30} style={P.input} />
      <div style={{ display: 'flex', gap: 12 }}>
        {TEAM_COLORS.map((c, i) => (
          <button key={c} onClick={() => setColorIdx(i)} style={{
            width: 36, height: 36, borderRadius: '50%', background: c,
            border: colorIdx === i ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer',
          }} />
        ))}
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
      <button onClick={go} disabled={busy} style={P.primaryBtn}>
        {busy ? 'ПОДКЛЮЧАЮСЬ...' : 'ВОЙТИ В ИГРУ'}
      </button>
    </div>
  )
}

function Waiting({ message, sub, team }) {
  return (
    <div style={P.center}>
      {team && <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700, color: team.color }}>{team.name}</div>}
      <div style={{ ...P.mono, fontSize: 13, textAlign: 'center' }}>// {message}</div>
      {sub && <div style={{ ...P.mono, fontSize: 11, color: '#333' }}>{sub}</div>}
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', animation: 'scanpulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

const P = {
  center: {
    minHeight: '100vh', background: '#050505', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24,
  },
  mono: { fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', letterSpacing: '0.2em' },
  input: {
    width: '100%', maxWidth: 320, background: '#0d0d0d', border: '1px solid #333',
    borderLeft: '3px solid #ea580c', color: '#fff', padding: '14px 16px',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 20, outline: 'none',
  },
  primaryBtn: {
    background: '#ea580c', color: '#fff', border: 'none', padding: '14px 36px', cursor: 'pointer',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  header: {
    background: '#0d0d0d', borderBottom: '1px solid #222', padding: '12px 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  headerMeta: { fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555' },
  notice: {
    background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.3)', borderLeft: '3px solid #ea580c',
    padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#ea580c', letterSpacing: '0.08em',
  },
  qCard: {
    background: '#0d0d0d', border: '1px solid #222', borderLeft: '3px solid #333',
    padding: 14, display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s',
  },
  qLabel: { fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', letterSpacing: '0.15em' },
  textarea: {
    background: '#151515', border: '1px solid #333', color: '#fff', padding: '10px 12px', resize: 'none',
    fontFamily: 'Inter, sans-serif', fontSize: 16, outline: 'none', width: '100%', lineHeight: 1.4,
  },
  choiceBtn: (active) => ({
    padding: '14px 0', border: `2px solid ${active ? '#ea580c' : '#333'}`,
    background: active ? 'rgba(234,88,12,0.15)' : 'transparent',
    color: active ? '#ea580c' : '#888',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 24, fontWeight: 700, cursor: 'pointer',
  }),
  stakeLabel: { fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', marginBottom: 8, letterSpacing: '0.1em' },
  stakeBtn: (selected, taken) => ({
    width: 46, height: 46,
    border: `2px solid ${selected ? '#ea580c' : taken ? '#1a1a1a' : '#333'}`,
    background: selected ? 'rgba(234,88,12,0.15)' : 'transparent',
    color: selected ? '#ea580c' : taken ? '#333' : '#666',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 22, fontWeight: 700, cursor: 'pointer',
  }),
  footer: {
    borderTop: '1px solid #222', padding: '12px 16px',
    fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.1em', textAlign: 'center',
  },
}
