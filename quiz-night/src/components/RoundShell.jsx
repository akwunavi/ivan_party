// ============================================================
// RoundShell — универсальная "оболочка" раунда
// ============================================================
// Рисует слайд ТОЛЬКО из gameState (Supabase) — ничего не хранит сама.
// Каждый раунд передаёт свой config: вопросы, правила, таймер, флаги.
// Особые раунды (R3, R4) могут подменять части через props-рендереры.

import { useEffect, useRef, useState } from 'react'
import { speak, stopSpeech } from '../lib/tts'
import { advance, goBack } from '../lib/roundFlow'
import { startTimer } from '../lib/gameActions'
import MediaDisplay from './MediaDisplay'
import Timer from './Timer'

export default function RoundShell({ gameState, config, renderQuestion, renderAnswers }) {
  const { status, current_step: step } = gameState
  const questions = config.questions
  const q = questions[step] || questions[0]
  const [ttsRunning, setTtsRunning] = useState(false)
  const [timerActive, setTimerActive] = useState(false)
  const spokenKey = useRef(null)
  const musicRef = useRef(null)

  // Фоновая музыка пока тикает таймер — /public/media/song.mp3
  useEffect(() => {
    if (!timerActive) { musicRef.current?.pause(); return }
    const audio = new Audio('./media/song.mp3')
    audio.loop = true
    audio.volume = 0.6
    musicRef.current = audio
    audio.play().catch(() => {})
    return () => audio.pause()
  }, [timerActive])

  // Озвучка: срабатывает один раз на каждый (status, step)
  useEffect(() => {
    const key = `${status}-${step}`
    if (spokenKey.current === key) return
    spokenKey.current = key
    setTimerActive(false)

    async function run() {
      if (status === 'question' || status === 'repeat') {
        const text = q?.tts_text || q?.question_text
        if (text && config.useTts !== false) {
          setTtsRunning(true)
          await speak(text)
          setTtsRunning(false)
        }
        if (status === 'question') {
          setTimerActive(true)
          startTimer(config.timerSeconds)
        }
        if (status === 'repeat' && config.autoAdvanceRepeats !== false) {
          // авто-пролистывание повторов через паузу
          setTimeout(() => advance(gameState, config), config.repeatPauseMs ?? 2000)
        }
      }
    }
    run()
  }, [status, step])

  const next = () => { stopSpeech(); advance(gameState, config) }
  const back = () => { stopSpeech(); goBack(gameState, config) }

  // ── ИНТРО ──
  if (status === 'round_intro') return (
    <Slide>
      <div className="mono-tag">// РАУНД {String(config.number).padStart(2, '0')}</div>
      <h1 style={S.title}>{config.titleLines.map((l, i) =>
        <span key={i} style={i === config.titleLines.length - 1 ? { color: '#ea580c' } : {}}>{l}<br /></span>)}
      </h1>
      <div style={S.meta}>{config.metaLine}</div>
      <NavButtons onNext={next} nextLabel="ПРАВИЛА →" />
    </Slide>
  )

  // ── ПРАВИЛА ──
  if (status === 'rules') return (
    <Slide>
      <div className="mono-tag">// РАУНД {String(config.number).padStart(2, '0')} :: ПРАВИЛА</div>
      <div className="card" style={{ maxWidth: 640, width: '100%' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {config.rules.map((rule, i) => (
            <li key={i} style={S.ruleItem}>
              <span style={S.ruleNum}>{String(i + 1).padStart(2, '0')}</span>{rule}
            </li>
          ))}
        </ul>
      </div>
      <NavButtons onBack={back} onNext={next} nextLabel="НАЧАТЬ →" />
    </Slide>
  )

  // ── ВОПРОС / ПОВТОР ──
  if (status === 'question' || status === 'repeat') {
    const isRepeat = status === 'repeat'
    return (
      <div className="full-screen grid-bg flex-col" style={{ padding: '32px 48px', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="mono-tag">
              // РАУНД {String(config.number).padStart(2, '0')} {isRepeat && ':: ПОВТОР'}
            </div>
            <div style={S.counter}>
              ВОПРОС <span style={{ color: '#fff' }}>{step + 1}</span> / {questions.length}
              {q?.block_number ? <span style={{ color: '#555' }}> · БЛОК {q.block_number}</span> : null}
            </div>
          </div>
          {ttsRunning && <div style={S.ttsBadge}>// ОЗВУЧКА...</div>}
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderQuestion ? renderQuestion(q, { isRepeat }) : <MediaDisplay question={q} />}
        </div>

        {q?.choices && <ChoicesGrid choices={q.choices} />}

        {!isRepeat && timerActive && (
          <div style={{ maxWidth: 600, width: '100%', margin: '0 auto' }}>
            <Timer key={`t-${step}`} seconds={config.timerSeconds} autoStart
              onComplete={() => {
                setTimerActive(false) // глушим музыку
                if (config.autoAdvanceQuestions) next()
              }} />
          </div>
        )}

        <NavButtons onBack={back} onNext={next}
          nextLabel={step === questions.length - 1
            ? (isRepeat ? 'ОТВЕТЫ →' : config.hasRepeats ? 'ПОВТОРЫ →' : 'ОТВЕТЫ →')
            : 'ДАЛЬШЕ →'} />
      </div>
    )
  }

  // ── АНОНС ПОВТОРОВ ──
  if (status === 'repeat_intro') return (
    <Slide>
      <div className="mono-tag">// РАУНД {String(config.number).padStart(2, '0')}</div>
      <h1 style={S.title}>ПОВТОР<br /><span style={{ color: '#ea580c' }}>ВОПРОСОВ</span></h1>
      <NavButtons onBack={back} onNext={next} nextLabel="НАЧАТЬ ПОВТОР →" />
    </Slide>
  )

  // ── ВРЕМЯ ОТВЕТОВ ──
  if (status === 'answer_time') return (
    <Slide>
      <div className="mono-tag">// РАУНД {String(config.number).padStart(2, '0')} :: ВРЕМЯ ОТВЕТОВ</div>
      <h1 style={{ ...S.title, color: '#22c55e' }}>ОТВЕЧАЙТЕ!</h1>
      <div style={S.meta}>// КАПИТАНЫ ОТПРАВЛЯЮТ ОТВЕТЫ С ТЕЛЕФОНОВ</div>
      <NavButtons onBack={back} onNext={next} nextLabel="ПОКАЗАТЬ ОТВЕТЫ →" />
    </Slide>
  )

  // ── ПОКАЗ ПРАВИЛЬНЫХ ОТВЕТОВ ──
  if (status === 'show_answers') return (
    <div className="full-screen grid-bg flex-col" style={{ padding: '32px 48px', gap: 20 }}>
      <div className="mono-tag">// РАУНД {String(config.number).padStart(2, '0')} :: ПРАВИЛЬНЫЕ ОТВЕТЫ</div>
      {renderAnswers ? renderAnswers(questions) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800, margin: '0 auto', width: '100%' }}>
          {questions.map((qq, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <span style={S.ruleNum}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ color: '#ccc', flex: 1 }}>{qq.question_text}</span>
              <span style={{ color: '#22c55e', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20 }}>{qq.correct_answer}</span>
            </div>
          ))}
        </div>
      )}
      <NavButtons onBack={back} />
    </div>
  )

  return null
}

// ── Вспомогательные части ──

export function Slide({ children }) {
  return <div className="full-screen grid-bg flex-center flex-col" style={{ gap: 28, padding: 40 }}>{children}</div>
}

export function NavButtons({ onBack, onNext, nextLabel = 'ДАЛЬШЕ →' }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {onBack && <button className="btn btn-ghost" onClick={onBack}>← НАЗАД</button>}
      {onNext && <button className="btn btn-primary" onClick={onNext}>{nextLabel}</button>}
    </div>
  )
}

export function ChoicesGrid({ choices, highlight }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 800, margin: '0 auto', width: '100%' }}>
      {choices.map(c => (
        <div key={c.key} style={{
          background: '#0d0d0d',
          border: `1px solid ${highlight === c.key ? '#22c55e' : '#333'}`,
          borderLeft: `3px solid ${highlight === c.key ? '#22c55e' : '#333'}`,
          padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 28, fontWeight: 700, color: highlight === c.key ? '#22c55e' : '#ea580c', minWidth: 24 }}>{c.key}</span>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 22, color: '#ccc' }}>{c.text}</span>
        </div>
      ))}
    </div>
  )
}

const S = {
  title: {
    fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(44px, 7vw, 88px)',
    fontWeight: 700, lineHeight: 0.95, textAlign: 'center', letterSpacing: '-0.02em', color: '#fff',
  },
  meta: { color: '#555', fontFamily: 'Share Tech Mono, monospace', fontSize: 12, letterSpacing: '0.15em' },
  counter: { fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: '#555', marginTop: 4 },
  ttsBadge: {
    fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#ea580c',
    letterSpacing: '0.15em', animation: 'scanpulse 0.8s ease-in-out infinite',
  },
  ruleItem: { display: 'flex', gap: 12, alignItems: 'flex-start', fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#ccc', lineHeight: 1.6 },
  ruleNum: { color: '#ea580c', fontFamily: 'Share Tech Mono, monospace', fontSize: 12, marginTop: 4 },
}
