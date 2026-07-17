import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameState } from '../hooks/useGameState'
import { registerTeam } from '../lib/gameActions'
import { useTeams } from '../hooks/useTeams'
import { ROUND_CONFIGS } from '../lib/roundsRegistry'
import { useAnswerQueue } from '../lib/answerQueue'

const TEAM_COLORS = ['#ea580c', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308', '#14b8a6', '#f43f5e']

export default function PlayerPage() {
  const { gameState, loading } = useGameState()
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem('quiz_team')
    return saved ? JSON.parse(saved) : null
  })

  // Проверка: если была «Новая игра» и команду удалили — сбрасываем localStorage
  useEffect(() => {
    if (!team) return
    supabase.from('teams').select('id').eq('id', team.id).maybeSingle().then(({ data }) => {
      if (!data) {
        localStorage.removeItem('quiz_team')
        Object.keys(localStorage).filter(k => k.startsWith('quiz_answers_')).forEach(k => localStorage.removeItem(k))
        setTeam(null)
      }
    })
  }, [team?.id])

  if (!team) return <Register onDone={setTeam} />
  if (loading || !gameState) return <Waiting team={team} message="ПОДКЛЮЧЕНИЕ..." />

  const { status, current_round } = gameState

  if (status === 'lobby') return <Waiting team={team} message="ОЖИДАЕМ НАЧАЛА ИГРЫ" />
  if (status === 'scoreboard') return <Waiting team={team} message="ПОДВОДИМ ИТОГИ..." />
  if (status === 'finale') return <Waiting team={team} message="ИГРА ЗАВЕРШЕНА" sub="Спасибо за игру! Смотри на проектор 🎉" />
  if (status === 'break') return <Waiting team={team} message="ПЕРЕРЫВ 10 МИНУТ" sub="Разомнись, налей выпить :)" />
  if (status === 'round_intro' || status === 'rules') return <Waiting team={team} message={`РАУНД ${current_round}`} sub="Слушай правила" />
  if (status === 'show_answers') return <PlayerReview team={team} gameState={gameState} />

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
  const [sends, setSends] = useState(0)
  const { send: queueSend, pendingCount, isOnline } = useAnswerQueue()

  useEffect(() => { setText(''); setSends(0) }, [active])

  if (!active) return <Waiting team={team} message="РАУНД 4 · СВОЯ ИГРА" sub="Выбирайте плитку — ведущий её запустит" />

  const [t, i] = active.split('-').map(Number)
  const theme = config.themes[t]
  const tile = theme?.tiles[i]

  function submit() {
    if (!text.trim() || sends >= 2) return
    queueSend({
      team_id: team.id,
      game_id: gameState.game_id,
      question_ref: `r4-q${t}-${i}`,
      round_number: 4,
      answer_text: text.trim(),
      updated_at: new Date().toISOString(),
    })
    setSends(s => s + 1)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={P.header}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700, color: team.color }}>{team.name}</div>
        <div style={P.headerMeta}>РАУНД 4</div>
      </div>
      <ConnBanner isOnline={isOnline} pendingCount={pendingCount} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20, gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 24, fontWeight: 700, color: '#ea580c' }}>{theme?.name}</div>
          <div style={P.mono}>ПЛИТКА · {tile?.value} БАЛЛА</div>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Твой ответ..." rows={2}
          disabled={sends >= 2} style={{ ...P.textarea, opacity: sends >= 2 ? 0.5 : 1 }} />
        <button onClick={submit} disabled={sends >= 2 || !text.trim()} style={P.submitBtn(sends, !text.trim())}>
          {sends === 0 ? 'ОТПРАВИТЬ' : sends === 1 ? 'ИЗМЕНИТЬ' : '✓ ОТВЕТ ЗАФИКСИРОВАН'}
        </button>
        <div style={{ ...P.mono, textAlign: 'center', color: '#333' }}>КТО БЫСТРЕЕ — ВЕДУЩИЙ ВИДИТ ВРЕМЯ</div>
      </div>
    </div>
  )
}

// ═══ ФОРМА ОТВЕТОВ ═══
// Ответы и ставки хранятся локально (переживают перезагрузку телефона)
// и отправляются в Supabase при каждом изменении.
// Баннер связи: красный "нет связи" пока офлайн, оранжевый "досылаю N" пока в очереди что-то есть
function ConnBanner({ isOnline, pendingCount }) {
  if (isOnline && pendingCount === 0) return null
  if (!isOnline) return <div className="conn-banner offline">⚠ НЕТ СВЯЗИ — ОТВЕТЫ СОХРАНЕНЫ, ДОШЛЁМ АВТОМАТИЧЕСКИ</div>
  return <div className="conn-banner pending">↻ ДОСЫЛАЮ {pendingCount} ОТВЕТ{pendingCount === 1 ? '' : 'А'}...</div>
}

function AnswerForm({ team, gameState }) {
  const round = gameState.current_round
  const config = ROUND_CONFIGS[round]
  const questions = config?.questions || []
  const isStakes = config?.stakesRound
  const uniqueStakes = isStakes && round === 5 // каждая ставка 1 раз
  const collapsible = round === 3 || round === 5 // ответы спрятаны под шевроном
  const [openIdx, setOpenIdx] = useState(null)
  const { send, pendingCount, isOnline } = useAnswerQueue()

  // Автораскрытие текущего вопроса: как только ведущий перешёл к вопросу N,
  // шеврон N сам открывается на телефоне. Ответы на ДРУГИХ вопросах (state.answers)
  // при этом не трогаются — меняется только то, какая карточка развёрнута визуально.
  useEffect(() => {
    if (!collapsible) return
    if (gameState.status === 'question' || gameState.status === 'repeat') {
      setOpenIdx(gameState.current_step)
    }
  }, [collapsible, gameState.status, gameState.current_step])

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
    // Блокировка зависит ТОЛЬКО от числа исправлений — стирание ответа
    // не должно снимать лимит (иначе игрок обходит правило «максимум 2 попытки»).
    return (state.edits?.[i] ?? 0) >= 2
  }

  async function push(qIdx, answer, stake) {
    // Отправка через очередь: если сеть моргнёт, запись не потеряется —
    // останется в localStorage и дошлётся автоматически при восстановлении.
    send({
      team_id: team.id,
      game_id: gameState.game_id,
      question_ref: `r${round}-q${qIdx}`,
      round_number: round,
      answer_text: answer,
      stake: stake,
      updated_at: new Date().toISOString(),
    })
  }

  // Текст набирается локально; в Supabase уходит только по кнопке.
  // Кнопка: ОТПРАВИТЬ (1-й раз) → ИЗМЕНИТЬ (2-й раз) → после этого мьют.
  function typeAnswer(qIdx, text) {
    setState(s => ({ ...s, answers: { ...s.answers, [qIdx]: text } }))
  }

  function submitAnswer(qIdx) {
    const text = state.answers[qIdx]
    if (!text?.trim()) return
    setState(s => ({ ...s, edits: { ...s.edits, [qIdx]: (s.edits?.[qIdx] ?? 0) + 1 } }))
    push(qIdx, text, state.stakes[qIdx] ?? null)
  }

  // Стереть ответ (Р3/Р5): случайный тап можно отменить.
  // Пустой ответ в Р3 = пропуск, не ошибка — поэтому послабление безопасно.
  function clearAnswer(qIdx) {
    setState(s => {
      const answers = { ...s.answers }
      delete answers[qIdx]
      // Стирание НЕ даёт новую попытку: если лимит исправлений уже исчерпан,
      // он остаётся исчерпанным — иначе стирание становится обходом лимита.
      return { ...s, answers }
    })
    push(qIdx, null, state.stakes[qIdx] ?? null)
  }

  // Буквенные варианты (Р3/Р5): выбор шлётся сразу, смена буквы = исправление
  function setAnswer(qIdx, text) {
    setState(s => {
      const had = s.answers[qIdx]
      const edits = { ...s.edits }
      if (collapsible && had != null && had !== text) edits[qIdx] = (edits[qIdx] ?? 0) + 1
      return { ...s, answers: { ...s.answers, [qIdx]: text }, edits }
    })
    push(qIdx, text, state.stakes[qIdx] ?? null)
  }

  function setStake(qIdx, value) {
    // П.17: занятая ставка НЕ перетягивается — сначала сними её вручную
    if (uniqueStakes) {
      const takenBy = Object.entries(state.stakes).find(([k, v]) => v === value && Number(k) !== qIdx)
      if (takenBy) return
    }
    setState(s => {
      const stakes = { ...s.stakes, [qIdx]: value }
      push(qIdx, s.answers[qIdx] ?? null, value)
      return { ...s, stakes }
    })
  }

  function clearStake(qIdx) {
    setState(s => {
      const stakes = { ...s.stakes }
      delete stakes[qIdx]
      push(qIdx, s.answers[qIdx] ?? null, null)
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
      <ConnBanner isOnline={isOnline} pendingCount={pendingCount} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!accepting && (
          <div style={P.notice}>СЛУШАЙ ВОПРОСЫ — ОТВЕТЫ МОЖНО ВНОСИТЬ И ПРАВИТЬ ВЕСЬ РАУНД</div>
        )}

        {(() => { let num = 0; return questions.map((q, i) => {
          if (q.block_intro) return null   // интро-слайды блоков — не вопросы
          num += 1
          const displayNum = num
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
                  ВОПРОС {displayNum}
                  {q.is_final_question && <span style={{ color: '#ea580c' }}> · ТЕМА РАУНДА ×2</span>}
                  {!isUnlocked && <span style={{ color: '#333' }}> · ЕЩЁ НЕ ЗАЧИТАН</span>}
                  {isLocked && <span style={{ color: '#ef4444' }}> · 🔒</span>}
                </div>
                {collapsible && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {state.answers[i] && (
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 17, fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                        {state.answers[i]}
                        {(() => { const ch = q.choices?.find(c => c.key === state.answers[i]); return ch ? ` — ${ch.text}` : '' })()}
                        {state.stakes[i] != null && <span style={{ color: '#ea580c' }}> · ст.{state.stakes[i]}</span>}
                      </span>
                    )}
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

                  {q.match_pairs ? (
                    <MatchPicker q={q} value={state.answers[i] || ''} locked={isLocked}
                      onChange={text => setAnswer(i, text)} onClear={() => clearAnswer(i)} />
                  ) : q.order_answer && q.choices ? (
                    <OrderPicker q={q} value={state.answers[i] || ''} locked={isLocked}
                      onChange={text => setAnswer(i, text)} onClear={() => clearAnswer(i)} />
                  ) : hasChoices ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {(q.choices?.map(c => c.key) || ['А', 'Б', 'В', 'Г']).map(key => (
                          <button key={key} disabled={isLocked}
                            onClick={() => !isLocked && setAnswer(i, key)}
                            style={{ ...P.choiceBtn(state.answers[i] === key), opacity: isLocked ? 0.3 : 1 }}>
                            {key}
                          </button>
                        ))}
                      </div>
                      {state.answers[i] && (
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#22c55e', letterSpacing: '0.1em' }}>
                          ✓ ОТВЕТ ОТПРАВЛЕН
                        </div>
                      )}
                      {state.answers[i] && (
                        <button onClick={() => clearAnswer(i)} style={P.eraseBtn}>
                          ✕ СТЕРЕТЬ ОТВЕТ
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <textarea
                        value={state.answers[i] || ''}
                        onChange={e => typeAnswer(i, e.target.value)}
                        placeholder="Твой ответ..."
                        rows={2}
                        disabled={(state.edits?.[i] ?? 0) >= 2}
                        style={{ ...P.textarea, opacity: (state.edits?.[i] ?? 0) >= 2 ? 0.5 : 1 }}
                      />
                      <button
                        onClick={() => submitAnswer(i)}
                        disabled={(state.edits?.[i] ?? 0) >= 2 || !state.answers[i]?.trim()}
                        style={P.submitBtn((state.edits?.[i] ?? 0), !state.answers[i]?.trim())}
                      >
                        {(state.edits?.[i] ?? 0) === 0 ? 'ОТПРАВИТЬ'
                          : (state.edits?.[i] ?? 0) === 1 ? 'ИЗМЕНИТЬ'
                          : '✓ ОТВЕТ ЗАФИКСИРОВАН'}
                      </button>
                    </>
                  )}

                  {collapsible && !isLocked && state.answers[i] && (
                    <div style={{ ...P.stakeLabel, marginBottom: 0, color: '#666' }}>МОЖНО ИЗМЕНИТЬ ЕЩЁ 1 РАЗ</div>
                  )}

                  {isStakes && round !== 7 && (
                    <div>
                      <div style={P.stakeLabel}>
                        СТАВКА {uniqueStakes ? '(0–5, каждая один раз)' : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {config.stakesValues.map(v => {
                          const selected = state.stakes[i] === v
                          const takenElsewhere = uniqueStakes && !selected &&
                            Object.entries(state.stakes).some(([k, sv]) => sv === v && Number(k) !== i)
                          return (
                            <button key={v} onClick={() => setStake(i, v)} disabled={takenElsewhere}
                              style={P.stakeBtn(selected, takenElsewhere)}>
                              {v}
                            </button>
                          )
                        })}
                        {state.stakes[i] != null && (
                          <button onClick={() => clearStake(i)} style={P.eraseBtn}>✕ СНЯТЬ</button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* П.19: Р8 — ставка галкой, фиксированная ×2 */}
                  {isStakes && round === 7 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={state.stakes[i] === 2}
                        onChange={e => e.target.checked ? setStake(i, 2) : clearStake(i)}
                        style={{ width: 22, height: 22, accentColor: '#ea580c' }} />
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 17, fontWeight: 700, color: state.stakes[i] === 2 ? '#ea580c' : '#888' }}>
                        СТАВКА ×2 {state.stakes[i] === 2 ? '· ПОСТАВЛЕНА' : ''}
                      </span>
                    </label>
                  )}
                </>
              )}
            </div>
          )
        }) })()}
      </div>

      <div style={{ ...P.footer, color: accepting ? '#22c55e' : '#555' }}>
        {uniqueStakes && Object.keys(state.stakes).length < config.stakesValues.length
          ? <span style={{ color: '#ef4444' }}>⚠ РАССТАВЬ ВСЕ СТАВКИ: {Object.keys(state.stakes).length}/{config.stakesValues.length}</span>
          : accepting
          ? `ОТВЕТЫ ПРИНИМАЮТСЯ · ЗАПОЛНЕНО ${filled}/${questions.length}`
          : `ЗАПОЛНЕНО ${filled}/${questions.length} · ПРИЁМ ЕЩЁ НЕ ОТКРЫТ`}
      </div>
    </div>
  )
}

// ═══ ВОПРОС «СОПОСТАВЬ» ═══
// Цифры СЛЕВА — фиксированные позиции (порядковый номер картинки или пункта),
// капитан только подставляет БУКВУ к каждой цифре через компактный выбор.
// Работает одинаково для текстовых пар и для пар с картинками — если у вопроса
// есть media_urls, картинки уже показаны сверху через MediaDisplay с номерами
// в углу (см. ImageGrid), этот компонент просто сопоставляет номер → букву.
//
// q.match_pairs = { left: ['1','2','3'], right: ['А','Б','В'] }
// Ответ хранится строкой вида "1А,2Б,3В" — по одной паре, без разделителей внутри.
function MatchPicker({ q, value, locked, onChange, onClear }) {
  const pairs = value ? value.split(',').filter(Boolean) : []
  const assigned = Object.fromEntries(pairs.map(p => [p[0], p.slice(1)]))
  const usedRight = pairs.map(p => p.slice(1))

  function assign(left, right) {
    if (locked) return
    const next = { ...assigned }
    if (right == null) delete next[left]
    else next[left] = right
    const nextPairs = q.match_pairs.left
      .filter(l => next[l])
      .map(l => `${l}${next[l]}`)
    onChange(nextPairs.join(','))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555' }}>
        ПОДСТАВЬ БУКВУ К КАЖДОМУ НОМЕРУ
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.match_pairs.left.map(l => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #333', color: '#888',
              fontFamily: 'Orbitron, monospace', fontSize: 18, fontWeight: 700, flexShrink: 0,
            }}>{l}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {q.match_pairs.right.map(r => {
                const takenByOther = usedRight.includes(r) && assigned[l] !== r
                const selected = assigned[l] === r
                return (
                  <button key={r} disabled={locked || takenByOther}
                    onClick={() => assign(l, selected ? null : r)}
                    style={{
                      padding: '8px 14px',
                      border: `2px solid ${selected ? '#22c55e' : takenByOther ? '#1a1a1a' : '#333'}`,
                      background: selected ? 'rgba(34,197,94,0.1)' : 'transparent',
                      color: takenByOther ? '#333' : selected ? '#22c55e' : '#ccc',
                      fontFamily: 'Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, cursor: locked || takenByOther ? 'default' : 'pointer',
                    }}>{r}</button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {pairs.length > 0 && !locked && (
        <button onClick={onClear} style={{
          padding: '8px 12px', border: '1px solid #333', background: 'transparent',
          color: '#888', cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', fontSize: 11, alignSelf: 'flex-start',
        }}>✕ СБРОСИТЬ ВСЁ</button>
      )}
    </div>
  )
}

// ═══ П.17: ВОПРОС-ПОРЯДОК — тапаешь буквы в нужной последовательности ═══
function OrderPicker({ q, value, locked, onChange, onClear }) {
  const picked = value.split('')
  function tap(key) {
    if (locked || picked.includes(key)) return
    onChange(value + key)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555' }}>
        ТАПАЙ БУКВЫ В ПРАВИЛЬНОМ ПОРЯДКЕ
      </div>
      {/* П.2: кнопки БЕЗ атрибута disabled — он сбрасывает фокус, и мобильный
          браузер дёргает страницу (прыжок при тапе). Защита от повторного
          выбора — внутри обработчика tap(), выглядит так же (приглушённая). */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {q.choices.map(c => (
          <button key={c.key} onClick={() => tap(c.key)} style={{
            padding: '12px 14px', border: `2px solid ${picked.includes(c.key) ? '#1a1a1a' : '#333'}`,
            background: 'transparent', color: picked.includes(c.key) ? '#333' : '#ccc',
            fontFamily: 'Rajdhani, sans-serif', fontSize: 16, fontWeight: 700,
            cursor: picked.includes(c.key) ? 'default' : 'pointer',
            textAlign: 'left', touchAction: 'manipulation',
          }}>
            <span style={{ color: picked.includes(c.key) ? '#333' : '#ea580c' }}>{c.key}</span> {c.text}
          </button>
        ))}
      </div>
      {/* Собранный порядок — «Сброс» зарезервирован всегда (visibility), чтобы блок не менял размер */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}>
        {picked.length === 0
          ? <span style={{ color: '#333', fontSize: 13 }}>порядок пуст</span>
          : picked.map((k, pos) => (
            <span key={pos} style={{
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #ea580c', color: '#ea580c',
              fontFamily: 'Orbitron, monospace', fontSize: 18, fontWeight: 700,
            }}>{k}</span>
          ))}
        <button onClick={onClear} style={{
          padding: '8px 12px', border: '1px solid #333', background: 'transparent',
          color: '#888', cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', fontSize: 11,
          visibility: picked.length > 0 && !locked ? 'visible' : 'hidden',
        }}>СБРОС</button>
      </div>
    </div>
  )
}

// ═══ П.7: ЭКРАН ПРОВЕРКИ — свои ответы read-only + отметки в реальном времени ═══
function PlayerReview({ team, gameState }) {
  const round = gameState.current_round
  const config = ROUND_CONFIGS[round]
  const [marks, setMarks] = useState([])

  useEffect(() => {
    let stop = false
    async function load() {
      const { data } = await supabase.from('answers').select('*')
        .eq('team_id', team.id).eq('round_number', round)
      if (!stop) setMarks(data || [])
    }
    load()
    const t = setInterval(load, 2000)
    return () => { stop = true; clearInterval(t) }
  }, [round])

  let num = 0
  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={P.header}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700, color: team.color }}>{team.name}</div>
        <div style={P.headerMeta}>РАУНД {round}</div>
      </div>
      <div style={{ padding: '14px 16px', fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700, color: '#ea580c', textAlign: 'center' }}>
        СЕЙЧАС УЗНАЕМ ПРАВИЛЬНЫЕ ОТВЕТЫ!
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(config?.questions || []).map((q, i) => {
          if (q.block_intro) return null
          num += 1
          const a = marks.find(x => x.question_ref === `r${round}-q${i}`)
          return (
            <div key={i} style={{
              background: '#0d0d0d', border: '1px solid #222',
              borderLeft: `3px solid ${a?.is_correct === true ? '#22c55e' : a?.is_correct === false ? '#ef4444' : '#333'}`,
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', minWidth: 26 }}>{num}</div>
              <div style={{ flex: 1, fontSize: 16, color: '#ddd' }}>{a?.answer_text || '—'}</div>
              {a?.is_correct != null && (
                <div style={{ fontSize: 22, color: a.is_correct ? '#22c55e' : '#ef4444' }}>
                  {a.is_correct ? '✓' : '✗'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══ РЕГИСТРАЦИЯ ═══
function Register({ onDone }) {
  const teams = useTeams()
  const takenColors = teams.map(t => t.color)
  const [name, setName] = useState('')
  const [colorIdx, setColorIdx] = useState(() => TEAM_COLORS.findIndex(c => !takenColors.includes(c)))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // П.4: если пока выбираешь имя кто-то другой занял твой цвет — переезжаем
  // на следующий свободный автоматически, чтобы не отправить дублирующий выбор.
  useEffect(() => {
    if (colorIdx === -1 || takenColors.includes(TEAM_COLORS[colorIdx])) {
      const free = TEAM_COLORS.findIndex(c => !takenColors.includes(c))
      setColorIdx(free)
    }
  }, [teams.length])

  async function go() {
    if (!name.trim()) { setError('Введи название команды'); return }
    if (colorIdx === -1) { setError('Все цвета заняты — обратись к ведущему'); return }
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
      <div style={P.mono}>РЕГИСТРАЦИЯ КОМАНДЫ</div>
      <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
        placeholder="Название команды" maxLength={30} style={P.input} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
        {TEAM_COLORS.map((c, i) => {
          const taken = takenColors.includes(c)
          return (
            <button key={c} onClick={() => !taken && setColorIdx(i)} disabled={taken} style={{
              width: 36, height: 36, borderRadius: '50%', background: c,
              border: colorIdx === i ? '3px solid #fff' : '2px solid transparent',
              cursor: taken ? 'not-allowed' : 'pointer',
              opacity: taken ? 0.2 : 1,
              position: 'relative',
            }}>
              {taken && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff' }}>✕</span>}
            </button>
          )
        })}
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
      <div style={{ ...P.mono, fontSize: 13, textAlign: 'center' }}>{message}</div>
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
  submitBtn: (edits, empty) => ({
    padding: '10px 16px', border: 'none', cursor: edits >= 2 || empty ? 'default' : 'pointer',
    background: edits >= 2 ? '#1a1a1a' : edits === 1 ? 'rgba(234,88,12,0.15)' : '#ea580c',
    color: edits >= 2 ? '#22c55e' : edits === 1 ? '#ea580c' : '#fff',
    border: edits === 1 ? '1px solid #ea580c' : 'none',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em',
    opacity: empty && edits < 2 ? 0.4 : 1,
  }),
  choiceBtn: (active) => ({
    padding: '14px 0', border: `2px solid ${active ? '#ea580c' : '#333'}`,
    background: active ? 'rgba(234,88,12,0.15)' : 'transparent',
    color: active ? '#ea580c' : '#888',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 24, fontWeight: 700, cursor: 'pointer',
  }),
  stakeLabel: { fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', marginBottom: 8, letterSpacing: '0.1em' },
  eraseBtn: {
    padding: '8px 12px', border: '1px solid #333', background: 'transparent',
    color: '#888', cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace',
    fontSize: 11, letterSpacing: '0.08em', alignSelf: 'flex-start',
  },
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
