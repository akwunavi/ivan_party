// ============================================================
// RoundShell — универсальная оболочка раунда (чистая версия)
// ============================================================
// ПОРЯДОК ФАЗ (жёстко, управляется только advance/goBack):
//   round_intro → rules → question(0..N-1) →
//   [если hasRepeats: repeat_intro → repeat(0..N-1)] →
//   answer_time → show_answers(0..N-1, по одному) → scoreboard
//
// Вся правда — в gameState (Supabase). Никакого локального порядка.

import { useEffect, useRef, useState } from 'react'
import { speak, stopSpeech } from '../lib/tts'
import { advance, goBack, setPhase } from '../lib/roundFlow'
import { startTimer, awardPoints, markAnswer } from '../lib/gameActions'
import { isFuzzyMatch, letterEq } from '../lib/answerCheck'
import { supabase } from '../lib/supabase'
import { useAnswers } from '../hooks/useAnswers'
import { useTeams } from '../hooks/useTeams'
import MediaDisplay from './MediaDisplay'
import Typewriter from './Typewriter'
import Timer from './Timer'

export default function RoundShell({ gameState, config, renderQuestion }) {
  const answers = useAnswers(gameState.current_round)
  const { status, current_step: step } = gameState
  const questions = config.questions
  const q = questions[Math.min(step, questions.length - 1)]
  const [ttsRunning, setTtsRunning] = useState(false)
  const [timerActive, setTimerActive] = useState(false)
  const spokenKey = useRef(null)
  const musicRef = useRef(null)

  // ── Фоновая музыка, пока тикает таймер ──
  useEffect(() => {
    if (!timerActive) { musicRef.current?.pause(); return }
    // П.2: в вопросах с собственным аудио/видео фоновая музыка не играет
    if (q?.content_type === 'audio' || q?.content_type === 'video') return
    const audio = new Audio('./media/song.mp3')
    audio.loop = true
    audio.volume = 0.6
    musicRef.current = audio
    audio.play().catch(() => {})
    return () => audio.pause()
  }, [timerActive])

  // ── Озвучка + таймер: один раз на каждый (status, step) ──
  useEffect(() => {
    const key = `${status}-${step}`
    if (spokenKey.current === key) return
    spokenKey.current = key
    setTimerActive(false)

    async function run() {
      if (status !== 'question' && status !== 'repeat') return
      // Интро блока: без озвучки и таймера; в повторах пропускаем сразу
      if (q?.block_intro) {
        if (status === 'repeat') setTimeout(() => advance(gameState, config), 300)
        return
      }
      // Вопросы с музыкой/видео — без озвучки и без таймера
      if (q?.content_type === 'audio' || q?.content_type === 'video') return

      // Своя озвучка (voice_audio) — приоритетнее браузерного TTS.
      // Таймер стартует ровно по факту окончания файла (onended), а не по
      // приблизительному завершению синтеза речи — точнее и без обрывов.
      if (q?.voice_audio) {
        setTtsRunning(true)
        await new Promise(resolve => {
          const audio = new Audio(q.voice_audio)
          audio.onended = resolve
          audio.onerror = resolve
          audio.play().catch(resolve)
        })
        setTtsRunning(false)
      } else {
        const text = q?.tts_text || q?.question_text
        if (text && config.useTts !== false) {
          setTtsRunning(true)
          await speak(text)
          setTtsRunning(false)
        }
      }
      if (status === 'question') {
        setTimerActive(true)
        startTimer(config.timerSeconds)
      }
      // (фоновая музыка глушится в эффекте выше, если вопрос сам аудио/видео)
      if (status === 'repeat' && config.autoAdvanceRepeats !== false) {
        setTimeout(() => advance(gameState, config), config.repeatPauseMs ?? 2000)
      }
    }
    run()
  }, [status, step])

  const next = () => { stopSpeech(); advance(gameState, config) }
  const back = () => { stopSpeech(); goBack(gameState, config) }

  // ════════ СЛАЙДЫ ════════

  if (status === 'round_intro') return (
    <Slide>
      <div className="mono-tag">РАУНД {pad(config.number)}</div>
      <h1 className="neon-title glitch-title" style={S.title}>
        {config.titleLines.map((l, i) => (
          <span key={i} style={i === config.titleLines.length - 1 ? { color: 'var(--accent)' } : {}}>{l}<br /></span>
        ))}
      </h1>
      <div style={S.meta}>{config.metaLine}</div>
      <NavButtons onNext={next} nextLabel="ПРАВИЛА →" />
    </Slide>
  )

  if (status === 'rules') return (
    <Slide>
      <div className="mono-tag">РАУНД {pad(config.number)} :: ПРАВИЛА</div>
      <div className="card hud-frame" style={{ maxWidth: 660, width: '100%' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {config.rules.map((rule, i) => (
            <li key={i} className="rule-line" style={{ ...S.ruleItem, animationDelay: `${i * 0.22}s` }}>
              <span style={S.ruleNum}>{pad(i + 1)}</span>{rule}
            </li>
          ))}
        </ul>
      </div>
      <NavButtons onBack={back} onNext={next} nextLabel="НАЧАТЬ →" />
    </Slide>
  )

  if (status === 'question' || status === 'repeat') {
    const isRepeat = status === 'repeat'

    // П.3 (Р2): интро-слайд блока — тема + краткие правила, без таймера и озвучки.
    // В повторах пропускается автоматически (см. эффект озвучки).
    if (q?.block_intro) {
      return (
        <Slide>
          <div className="mono-tag" style={{ fontSize: 16, letterSpacing: '0.25em' }}>
            РАУНД {pad(config.number)} :: БЛОК {q.block_number}
          </div>
          <h1 className="neon-title glitch-title" style={S.title}>{q.title}</h1>
          {q.text && <div style={{ ...S.ruleItem, maxWidth: 700, textAlign: 'center', display: 'block' }}>{q.text}</div>}
          <NavButtons onBack={back} onNext={next} nextLabel="К ВОПРОСАМ →" />
        </Slide>
      )
    }

    return (
      <div className="full-screen grid-bg flex-col" style={{ padding: '28px 44px', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexShrink: 0 }}>
          <div>
            <div className="mono-tag" style={{ fontSize: 16, letterSpacing: '0.25em' }}>
              РАУНД {pad(config.number)}{isRepeat && ' :: ПОВТОР'}
            </div>
            <div style={{ ...S.counter, fontSize: 20, marginTop: 6 }}>
              {isRepeat ? 'ПОВТОР' : 'ВОПРОС'}{' '}
              <span style={{ color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 34, fontWeight: 700 }}>{qNumber(config, step).num}</span>
              <span style={{ color: '#555' }}> / {qNumber(config, step).total}</span>
              {q?.block_number ? <span style={{ color: '#555' }}> · БЛОК {q.block_number}</span> : null}
            </div>
          </div>
          {ttsRunning && <div style={S.ttsBadge}>ОЗВУЧКА...</div>}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderQuestion ? renderQuestion(q, { isRepeat }) : <MediaDisplay question={q} typewriter={!isRepeat} />}
        </div>

        {q?.choices && <ChoicesGrid choices={q.choices} />}

        {!isRepeat && timerActive && (
          <div style={{ maxWidth: 600, width: '100%', margin: '0 auto', flexShrink: 0 }}>
            <Timer key={`t-${step}`} seconds={config.timerSeconds} autoStart
              onComplete={() => {
                setTimerActive(false)
                if (config.autoAdvanceQuestions) {
                  setTimeout(next, config.autoAdvanceDelayMs ?? 0)
                }
              }} />
          </div>
        )}

        <NavButtons onBack={back} onNext={next}
          nextLabel={step === questions.length - 1
            ? (isRepeat ? 'ОТВЕТЫ →' : config.hasRepeats ? 'ПОВТОРЫ →' : 'ВРЕМЯ ОТВЕТОВ →')
            : 'ДАЛЬШЕ →'} />
      </div>
    )
  }

  if (status === 'repeat_intro') return (
    <Slide>
      <div className="mono-tag">РАУНД {pad(config.number)}</div>
      <h1 className="neon-title glitch-title" style={S.title}>ПОВТОР<br /><span style={{ color: 'var(--accent)' }}>ВОПРОСОВ</span></h1>
      <NavButtons onBack={back} onNext={next} nextLabel="НАЧАТЬ ПОВТОР →" />
    </Slide>
  )

  if (status === 'answer_time') return (
    <AnswerTimeSlide config={config} onBack={back} onNext={next} answers={answers} roundNumber={gameState.current_round} />
  )

  if (status === 'show_answers') {
    return <ShowAnswers gameState={gameState} config={config} answers={answers} autoGrade={true} />
  }

  return null
}

// ════════════════════════════════════════════════════════════
// ЭКРАН ПОКАЗА ОТВЕТОВ — по одному вопросу.
// Вопрос ОСТАЁТСЯ на экране; ответ появляется ПОД ним.
// Справа — ответы команд КРУПНО. Навигация видна везде (синхронна).
// ════════════════════════════════════════════════════════════
export function ShowAnswers({ gameState, config, isAdminView = false, answers = [], autoGrade = false }) {
  const step = gameState.current_step
  const revealed = !!gameState.step_data?.revealed
  const q = config.questions[Math.min(step, config.questions.length - 1)]
  const total = config.questions.length
  const showTeamColumn = config.number !== 4
  const isR3 = config.number === 3

  if (!q) return null  // защита от рассинхрона шага

  const teamAnswers = answers.filter(a => a.question_ref === `r${config.number}-q${step}`)

  // ═══ ВСТРОЕННАЯ ПРОВЕРКА: полная логика начисления живёт здесь ═══
  // (ставки, бонус за полный блок — если задан у вопросов, откат при перепроверке, защита от даблклика)
  async function grade(a, correct, ptsOverride) {
    if (a.is_correct === correct) return
    const round = config.number
    const prev = Number(a.points_awarded ?? 0)
    if (prev !== 0) await awardPoints(a.team_id, round, a.question_ref, -prev, 'revert')

    if (config.questions[Number(a.question_ref.split('-q')[1])]?.block_number != null && a.is_correct === true && !correct) {
      const qi = Number(a.question_ref.split('-q')[1])
      const block = config.questions[qi]?.block_number
      const bonusRef = `r${round}-block${block}-bonus`
      const { data: bonusLog } = await supabase.from('score_log').select('delta')
        .eq('team_id', a.team_id).eq('question_ref', bonusRef)
      const bonusSum = (bonusLog || []).reduce((s, r) => s + Number(r.delta), 0)
      if (bonusSum > 0) await awardPoints(a.team_id, round, bonusRef, -bonusSum, 'block_bonus_revert')
    }

    const stake = Number(a.stake ?? 0)
    let delta
    if (ptsOverride != null) delta = correct ? ptsOverride : 0
    else if (config.stakesRound) delta = correct ? stake + 1 : -stake
    else delta = correct ? (config.pointsPerQuestion ?? 1) : 0
    await markAnswer(a.id, correct, delta)
    if (delta !== 0) await awardPoints(a.team_id, round, a.question_ref, delta, correct ? 'correct' : 'wrong')

    const qiForBonus = Number(a.question_ref.split('-q')[1])
    if (config.questions[qiForBonus]?.block_number != null && correct) {
      const block = config.questions[qiForBonus]?.block_number
      const blockRefs = config.questions.map((qq, i) => ({ qq, i }))
        .filter(({ qq }) => qq.block_number === block && !qq.block_intro).map(({ i }) => `r${round}-q${i}`)
      const teamBlockAnswers = answers.filter(x => x.team_id === a.team_id && blockRefs.includes(x.question_ref))
      const correctCount = teamBlockAnswers.filter(x => x.id === a.id ? true : x.is_correct === true).length
      if (correctCount === blockRefs.length) {
        await awardPoints(a.team_id, round, `r${round}-block${block}-bonus`, config.blockBonus ?? 1, 'block_bonus')
      }
    }
  }

  // ═══ АВТОПРОВЕРКА (Левенштейн/буквы) — при каждом «Показать ответ» ═══
  // Выполняется ТОЛЬКО на проекторе (autoGrade=true), чтобы два открытых
  // экрана не начислили баллы дважды. Ручные ✓/✗ — поверх, где угодно.
  useEffect(() => {
    if (!autoGrade || !revealed) return
    teamAnswers.forEach(a => {
      if (a.is_correct != null) return
      const given = a.answer_text?.trim()
      if (!given) return
      // Р3: «стоп после первой ошибки» — заблокированных не проверяем
      if (isR3) {
        const priorWrong = answers.some(x =>
          x.team_id === a.team_id &&
          Number(x.question_ref.split('-q')[1]) < step &&
          x.is_correct === false)
        if (priorWrong) return
        const ok = letterEq(given, q.correct_choice)
        grade(a, ok, ok ? 1 : 0)
        return
      }
      // Сопоставление цифра↔буква: сравниваем МНОЖЕСТВО пар (порядок тапа не важен)
      if (q.match_pairs && q.correct_pairs) {
        const givenSet = new Set(given.split(',').filter(Boolean))
        const correctSet = new Set(q.correct_pairs)
        const ok = givenSet.size === correctSet.size && [...givenSet].every(p => correctSet.has(p))
        grade(a, ok)
        return
      }
      // Вопросы-порядки: точное совпадение последовательности букв
      if (Array.isArray(q.correct_answer)) {
        if (q.order_answer && q.correct_order) {
          const ok = letterEq(given.replace(/[^а-яa-z]/gi, ''), q.correct_order)
          grade(a, ok)
        }
        return
      }
      const ok = q.correct_choice
        ? letterEq(given, q.correct_choice)
        : isFuzzyMatch(given, q.correct_answer)
      if (ok === null) return
      grade(a, ok)
    })
  }, [autoGrade, revealed, step, teamAnswers.length])

  // Трек-ответ (Р2 «песни в картинках») — только на проекторе
  useEffect(() => {
    if (!revealed || !q?.answer_audio || isAdminView) return
    const audio = new Audio(q.answer_audio)
    audio.volume = 0.8
    audio.play().catch(() => {})
    return () => audio.pause()
  }, [revealed, step])

  // Интро блоков в фазе ответов — слайд-разделитель
  if (q?.block_intro) {
    return (
      <Slide>
        <div className="mono-tag" style={{ fontSize: 16 }}>ОТВЕТЫ :: БЛОК {q.block_number}</div>
        <h1 className="neon-title glitch-title" style={{ fontFamily: 'Russo One, sans-serif', fontSize: 'clamp(48px, 8vw, 110px)', textAlign: 'center', color: '#fff' }}>{q.title}</h1>
        <NavButtons onNext={() => {
          if (step < total - 1) setPhase('show_answers', step + 1, { step_data: { revealed: false } })
          else setPhase('scoreboard', 0, { show_scoreboard: true })
        }} nextLabel="ДАЛЬШЕ →" />
      </Slide>
    )
  }

  return (
    <div className="grid-bg flex-col" style={{ height: '100vh', overflow: 'hidden', padding: '28px 44px', gap: 18, display: 'flex' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <div className="mono-tag" style={{ fontSize: 16, letterSpacing: '0.25em' }}>РАУНД {pad(config.number)} :: ОТВЕТЫ</div>
        <div style={S.counter}>
          ВОПРОС <span style={{ color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 26 }}>{qNumber(config, step).num}</span> / {qNumber(config, step).total}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 28 }}>
        <div style={{ flex: showTeamColumn ? 1.4 : 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MediaDisplay
              noAV={isAdminView}
              revealMedia={revealed}
              autoplayAudio={q.answer_play_audio === true}
              question={
                revealed && q.answer_media_urls?.length
                  ? { content_type: 'multi_image', media_urls: q.answer_media_urls, question_text: q.question_text }
                  : q
              } />
          </div>

          {revealed && (
            <div className="reveal-up hud-frame" style={{
              flexShrink: 0, padding: '18px 26px',
              background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.35)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 14, color: '#22c55e', letterSpacing: '0.25em' }}>
                ПРАВИЛЬНЫЙ ОТВЕТ
              </div>
              {config.number === 2 && q.word1 && q.word2 && <RebusDecode word1={q.word1} word2={q.word2} />}
              {Array.isArray(q.correct_answer) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                  {q.correct_answer.map((line, li) => (
                    <div key={li} style={{
                      fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(24px, 2.8vw, 38px)', fontWeight: 700,
                      color: '#22c55e', display: 'flex', gap: 14, alignItems: 'baseline',
                    }}>
                      <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.8em', color: 'var(--accent)' }}>{li + 1}</span>
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <Typewriter text={q.correct_answer || q.correct_choice} speed={45} style={{
                  fontFamily: 'Russo One, Rajdhani, sans-serif', fontSize: 'clamp(32px, 4vw, 54px)',
                  color: '#22c55e', textAlign: 'center', lineHeight: 1.1,
                  textShadow: '0 0 20px rgba(34,197,94,0.35)',
                }} />
              )}
            </div>
          )}
        </div>

        {showTeamColumn && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="mono-tag" style={{ fontSize: 15 }}>ОТВЕТЫ КОМАНД</div>
            {teamAnswers.length === 0 && <div style={{ color: '#444', fontSize: 18 }}>нет ответов</div>}
            {teamAnswers.map(a => (
              <div key={a.id} style={{
                background: '#0d0d0d', border: '1px solid #222',
                borderLeft: `5px solid ${a.is_correct === true ? '#22c55e' : a.is_correct === false ? '#ef4444' : '#333'}`,
                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ fontFamily: 'Russo One, Rajdhani, sans-serif', color: a.teams?.color || 'var(--accent)', minWidth: 130, fontSize: 26 }}>
                  {a.teams?.name}
                </div>
                <div style={{ flex: 1, fontFamily: 'Rajdhani, sans-serif', fontSize: 30, fontWeight: 600, color: '#f3f3f3', lineHeight: 1.12 }}>
                  {q.match_pairs
                    ? (a.answer_text || '').split(',').filter(Boolean).map(p => `${p[0]}→${p.slice(1)}`).join('  ') || '—'
                    : (a.answer_text || '—')}
                  {a.stake != null && <span style={{ color: 'var(--accent)', fontSize: 18 }}> · ставка {a.stake}</span>}
                </div>
                {isR3 && a.is_correct == null && answers.some(x =>
                  x.team_id === a.team_id &&
                  Number(x.question_ref.split('-q')[1]) < step &&
                  x.is_correct === false) && (
                  <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 13, color: '#666', border: '1px solid #333', padding: '4px 10px' }}>
                    НЕ СЧИТАЕТСЯ
                  </span>
                )}
                {isAdminView ? (
                  <>
                    {/* Кнопки НЕ блокируются навсегда — ведущий может перепроверить (откат баллов встроен в grade) */}
                    <button onClick={() => grade(a, true)}
                      style={gradeBtnStyle('#22c55e', a.is_correct === true, false)}>✓</button>
                    <button onClick={() => grade(a, false)}
                      style={gradeBtnStyle('#ef4444', a.is_correct === false, false)}>✗</button>
                  </>
                ) : (
                  a.is_correct != null && (
                    <div style={{ fontSize: 32, color: a.is_correct ? '#22c55e' : '#ef4444' }}>
                      {a.is_correct ? '✓' : '✗'}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0 }}>
        {!revealed ? (
          <button className="btn btn-primary" onClick={() => setPhase('show_answers', step, { step_data: { revealed: true } })}>
            ПОКАЗАТЬ ОТВЕТ →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => {
            if (step < total - 1) setPhase('show_answers', step + 1, { step_data: { revealed: false } })
            else setPhase('scoreboard', 0, { show_scoreboard: true })
          }}>
            {step < total - 1 ? 'СЛЕДУЮЩИЙ ВОПРОС →' : 'К ТАБЛО →'}
          </button>
        )}
      </div>
    </div>
  )
}

// Расшифровка ребуса Р6: КорабЛИК + ВИНоград → подсвечены ЛИК и ВИН
function RebusDecode({ word1, word2 }) {
  const hl = { color: 'var(--accent)', borderBottom: '3px solid var(--accent)' }
  return (
    <div style={{
      fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(20px, 2.4vw, 32px)',
      fontWeight: 700, color: '#999', display: 'flex', gap: 22, alignItems: 'baseline',
    }}>
      <span>{word1.slice(0, -3)}<span style={hl}>{word1.slice(-3)}</span></span>
      <span style={{ color: '#555' }}>+</span>
      <span><span style={hl}>{word2.slice(0, 3)}</span>{word2.slice(3)}</span>
    </div>
  )
}

function gradeBtnStyle(color, activeMark, graded) {
  return {
    width: 38, height: 38, border: `1px solid ${color}`,
    background: activeMark ? `${color}25` : 'transparent',
    color, cursor: graded ? 'default' : 'pointer',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 16, fontWeight: 700,
    opacity: activeMark ? 1 : graded ? 0.15 : 0.55,
  }
}

// ═══ ВРЕМЯ ОТВЕТОВ: минутный таймер + фоновая музыка ═══
function AnswerTimeSlide({ config, onBack, onNext, answers = [], roundNumber }) {
  const seconds = config.answerTimeSeconds ?? 60
  const teams = useTeams()
  const totalQ = config.questions.filter(q => !q.block_intro).length
  // сколько НЕПУСТЫХ ответов прислала каждая команда в этом раунде
  const summary = teams.map(t => ({
    team: t,
    got: answers.filter(a => a.team_id === t.id && a.answer_text?.trim()).length,
  }))
  useEffect(() => {
    const audio = new Audio('./media/song.mp3')
    audio.loop = true
    audio.volume = 0.6
    audio.play().catch(() => {})
    return () => audio.pause()
  }, [])
  return (
    <Slide>
      <div className="mono-tag" style={{ fontSize: 16 }}>РАУНД {pad(config.number)} :: ВРЕМЯ ОТВЕТОВ</div>
      <h1 className="neon-title" style={{ ...S.title, color: '#22c55e', textShadow: '0 0 30px rgba(34,197,94,0.4)' }}>ОТВЕЧАЙТЕ!</h1>
      <div style={{ ...S.meta, fontSize: 15 }}>КАПИТАНЫ ОТПРАВЛЯЮТ ОТВЕТЫ С ТЕЛЕФОНОВ</div>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <Timer seconds={seconds} autoStart />
      </div>
      {/* П.1: контроль связи — видно, чьи ответы долетели */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {summary.map(({ team, got }) => (
          <div key={team.id} style={{
            padding: '10px 20px', border: `2px solid ${got >= totalQ ? '#22c55e' : '#333'}`,
            fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700,
            color: got >= totalQ ? '#22c55e' : '#ccc',
          }}>
            {team.name} · {got}/{totalQ}
          </div>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="К ОТВЕТАМ →" />
    </Slide>
  )
}

// ── Вспомогательные части ──

function pad(n) { return String(n).padStart(2, '0') }

// Номер вопроса БЕЗ учёта интро-слайдов блоков (Р2)
export function qNumber(config, step) {
  const qs = config.questions
  let num = 0
  for (let i = 0; i <= Math.min(step, qs.length - 1); i++) {
    if (!qs[i].block_intro) num++
  }
  const total = qs.filter(q => !q.block_intro).length
  return { num, total }
}


export function Slide({ children }) {
  return (
    <div className="full-screen grid-bg flex-center flex-col" style={{ gap: 28, padding: 40, position: 'relative' }}>
      {children}
    </div>
  )
}

export function NavButtons({ onBack, onNext, nextLabel = 'ДАЛЬШЕ →' }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', width: '100%', maxWidth: 900, margin: '0 auto', flexShrink: 0 }}>
      {onBack && <button className="btn btn-ghost" onClick={onBack}>← НАЗАД</button>}
      {onNext && <button className="btn btn-primary" onClick={onNext}>{nextLabel}</button>}
    </div>
  )
}

export function ChoicesGrid({ choices, highlight }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, maxWidth: 1200, margin: '0 auto', width: '100%', flexShrink: 0 }}>
      {choices.map(c => (
        <div key={c.key} style={{
          background: '#0d0d0d',
          border: `1px solid ${highlight === c.key ? '#22c55e' : '#333'}`,
          borderLeft: `4px solid ${highlight === c.key ? '#22c55e' : 'var(--accent)'}`,
          padding: '22px 28px', display: 'flex', gap: 22, alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 42, fontWeight: 700, color: highlight === c.key ? '#22c55e' : 'var(--accent)', minWidth: 44 }}>{c.key}</span>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 32, fontWeight: 600, color: '#eee', lineHeight: 1.2 }}>{c.text}</span>
        </div>
      ))}
    </div>
  )
}

const S = {
  title: {
    fontFamily: 'Russo One, Rajdhani, sans-serif', fontSize: 'clamp(68px, 12vw, 150px)',
    fontWeight: 700, lineHeight: 0.95, textAlign: 'center', letterSpacing: '-0.02em', color: '#fff',
  },
  meta: { color: '#777', fontFamily: 'Share Tech Mono, monospace', fontSize: 19, letterSpacing: '0.2em' },
  counter: { fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: '#555', marginTop: 4 },
  ttsBadge: {
    fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: 'var(--accent)',
    letterSpacing: '0.15em', animation: 'scanpulse 0.8s ease-in-out infinite',
  },
  ruleItem: { display: 'flex', gap: 14, alignItems: 'flex-start', fontFamily: 'Inter, sans-serif', fontSize: 24, color: '#ddd', lineHeight: 1.65 },
  ruleNum: { color: 'var(--accent)', fontFamily: 'Share Tech Mono, monospace', fontSize: 12, marginTop: 4 },
}
