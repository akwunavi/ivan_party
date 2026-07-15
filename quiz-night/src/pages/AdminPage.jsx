import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { pointsLabel } from '../lib/paths'
import { useGameState } from '../hooks/useGameState'
import { useTeams } from '../hooks/useTeams'
import { useAnswers } from '../hooks/useAnswers'
import {
  updateGameState,
  awardPoints, markAnswer, doubleRoundScore, resetGame, publishRandomGroups,
} from '../lib/gameActions'
import { advance, goBack, setPhase } from '../lib/roundFlow'
import { ShowAnswers } from '../components/RoundShell'
import { ROUND_CONFIGS, DISABLED_ROUNDS } from '../lib/roundsRegistry'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY

export default function AdminPage() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem('quiz_admin') === '1')
  const [key, setKey] = useState('')

  function tryAuth() {
    if (key === ADMIN_KEY) {
      sessionStorage.setItem('quiz_admin', '1')
      setAuth(true)
    }
  }

  if (!auth) return (
    <div style={A.center}>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 28, fontWeight: 700, color: '#ea580c' }}>ADMIN</div>
      <input type="password" value={key} onChange={e => setKey(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && tryAuth()} placeholder="Секретный ключ" style={A.input} />
      <button onClick={tryAuth} style={A.primaryBtn}>ВОЙТИ</button>
    </div>
  )

  return <AdminPanel />
}

function AdminPanel() {
  const { gameState } = useGameState()
  const teams = useTeams()
  const [answers, refetchAnswers] = useAnswers(gameState?.current_round)

  if (!gameState) return <div style={A.center}>// ЗАГРУЗКА...</div>

  const round = gameState.current_round
  const config = ROUND_CONFIGS[round]

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <div style={A.header}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700, color: '#ea580c' }}>ВЕДУЩИЙ</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="./" target="_blank" rel="noreferrer" style={A.linkBtn}>ПРОЕКТОР ↗</a>
          <button onClick={() => {
            const url = `${window.location.origin}${window.location.pathname}#/player`
            navigator.clipboard?.writeText(url)
          }} style={A.linkBtn}>ССЫЛКА ИГРОКАМ</button>
        </div>
      </div>
      <div style={{ padding: '6px 16px', background: '#0a0a0a', ...A.dim }}>
        R{round} · {gameState.status}
        {config?.questions && (gameState.status === 'question' || gameState.status === 'repeat' || gameState.status === 'show_answers')
          ? ` · ${gameState.current_step + 1}/${config.questions.length}` : ''}
      </div>

      {(gameState.status === 'lobby') && (
        <RoundPicker current={round} />
      )}

      {gameState.status === 'finale' && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 22, color: '#ea580c', marginBottom: 12 }}>
            ИГРА ЗАВЕРШЕНА
          </div>
          <div style={A.dim}>Финальные итоги показаны на проекторе</div>
        </div>
      )}

      {gameState.status !== 'lobby' && gameState.status !== 'finale' && (
        <AdminRoundView gameState={gameState} config={config} round={round} teams={teams} answers={answers} refetchAnswers={refetchAnswers} />
      )}
    </div>
  )
}

const TEAM_COLORS = ['#ea580c', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308']

// ═══ РАНДОМАЙЗЕР КОМАНД ═══
// Вводишь список людей (по одному на строку), задаёшь число команд —
// система тасует и распределяет случайно, создаёт команды с этим составом.
function TeamRandomizer() {
  const [namesText, setNamesText] = useState('')
  const [teamCount, setTeamCount] = useState(4)
  const [preview, setPreview] = useState(null) // [[имена группы 1], [группы 2], ...]
  const [publishing, setPublishing] = useState(false)
  const [open, setOpen] = useState(false)

  function shuffle() {
    const names = namesText.split('\n').map(s => s.trim()).filter(Boolean)
    if (names.length === 0) return
    const shuffled = [...names].sort(() => Math.random() - 0.5)
    const groups = Array.from({ length: teamCount }, () => [])
    shuffled.forEach((name, i) => groups[i % teamCount].push(name))
    setPreview(groups)
  }

  // Публикуем на общий экран (лобби) — там все видят своё распределение
  // и капитаны сами регистрируют команду, не нужно зачитывать список вслух.
  async function publish() {
    if (!preview) return
    setPublishing(true)
    await publishRandomGroups(preview)
    setPublishing(false)
  }

  return (
    <div style={{ border: '1px solid #333', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={A.linkBtn}>
        {open ? 'СКРЫТЬ РАНДОМАЙЗЕР КОМАНД' : '🎲 РАНДОМАЙЗЕР КОМАНД'}
      </button>
      {open && (
        <>
          <div style={A.dim}>ВСТАВЬ ИМЕНА — КАЖДОЕ С НОВОЙ СТРОКИ</div>
          <textarea value={namesText} onChange={e => { setNamesText(e.target.value); setPreview(null) }}
            placeholder={'Ваня\nМаша\nПетя\n...'} rows={5}
            style={{ background: '#151515', border: '1px solid #333', color: '#fff', padding: '10px 12px', fontFamily: 'Inter, sans-serif', fontSize: 14, resize: 'vertical' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={A.dim}>КОМАНД:</span>
            <input type="number" min={2} max={6} value={teamCount}
              onChange={e => { setTeamCount(Math.max(2, Math.min(6, Number(e.target.value) || 2))); setPreview(null) }}
              style={{ width: 60, background: '#151515', border: '1px solid #333', color: '#fff', padding: '6px 10px', fontFamily: 'Orbitron, monospace', fontSize: 16, textAlign: 'center' }} />
            <button onClick={shuffle} style={A.btn('#ea580c')}>🎲 ПЕРЕМЕШАТЬ</button>
          </div>

          {preview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {preview.map((group, i) => (
                <div key={i} style={{
                  padding: '8px 12px', border: `1px solid ${TEAM_COLORS[i % TEAM_COLORS.length]}`,
                  borderLeft: `3px solid ${TEAM_COLORS[i % TEAM_COLORS.length]}`,
                }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: TEAM_COLORS[i % TEAM_COLORS.length], marginBottom: 4 }}>
                    КОМАНДА {i + 1}
                  </div>
                  <div style={{ fontSize: 14, color: '#ccc' }}>{group.join(', ') || '—'}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={shuffle} style={A.btn('#555')}>↻ ЕЩЁ РАЗ</button>
                <button onClick={publish} disabled={publishing} style={A.btn('#22c55e')}>
                  {publishing ? 'ПУБЛИКУЮ...' : '📺 ПОКАЗАТЬ НА ЭКРАНЕ'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RoundPicker({ current }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TeamRandomizer />
      <div style={A.dim}>ВЫБЕРИ РАУНД ДЛЯ СТАРТА</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(ROUND_CONFIGS).filter(([n]) => !DISABLED_ROUNDS.includes(Number(n))).map(([n, c]) => (
          <button key={n} onClick={() => updateGameState({
            current_round: Number(n), current_step: 0, status: 'round_intro',
            accepting_answers: false, step_data: {},
          })} style={A.roundBtn(current === Number(n))}>
            R{n} {c.titleLines.join(' ')}
          </button>
        ))}
      </div>
    </div>
  )
}

function AdminRoundView({ gameState, config, round, teams, answers, refetchAnswers }) {
  const [showRoundSwitch, setShowRoundSwitch] = useState(false)
  const { status } = gameState

  async function grade(a, correct, ptsOverride) {
    if (a.is_correct === correct) return
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
      const blockRefs = config.questions.map((q, i) => ({ q, i }))
        .filter(({ q }) => q.block_number === block && !q.block_intro).map(({ i }) => `r${round}-q${i}`)
      const teamBlockAnswers = answers.filter(x => x.team_id === a.team_id && blockRefs.includes(x.question_ref))
      const correctCount = teamBlockAnswers.filter(x => x.id === a.id ? true : x.is_correct === true).length
      if (correctCount === blockRefs.length) {
        await awardPoints(a.team_id, round, `r${round}-block${block}-bonus`, config.blockBonus ?? 1, 'block_bonus')
      }
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      {status === 'show_answers' && config && (
        <ShowAnswers gameState={gameState} config={config} isAdminView={true} answers={answers} autoGrade={false} />
      )}

      {status === 'answer_time' && round === 3 && (
        <div style={{ padding: 16 }}>
          <div style={A.dim}>ПРОВЕРКА Р3 ПРОЙДЁТ АВТОМАТИЧЕСКИ ПРИ ПОКАЗЕ ОТВЕТОВ</div>
        </div>
      )}

      {round === 6 && status === 'show_answers' && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={A.dim}>УДВОЕНИЕ ЗА УГАДАННУЮ ТЕМУ СЧИТАЕТСЯ АВТОМАТИЧЕСКИ НА ФИНАЛЬНОМ ВОПРОСЕ</div>
        </div>
      )}

      {status !== 'show_answers' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20, gap: 20 }}>
          <QuestionTextOnly gameState={gameState} config={config} />
          {/* П.5: сколько команд уже прислали ответ на ТЕКУЩИЙ вопрос */}
          {(status === 'question' || status === 'repeat' || status === 'answer_time') && config?.questions && (
            <AnsweredIndicator gameState={gameState} config={config} answers={answers} teams={teams} />
          )}
        </div>
      )}

      {/* Р4: живые ответы активной плитки с проверкой, без звука */}
      {round === 4 && config?.themes && (
        <R4AdminAnswers gameState={gameState} config={config} answers={answers} onGrade={grade} />
      )}

      <div style={{ borderTop: '1px solid #222', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {config && status !== 'show_answers' && !config.themes && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => goBack(gameState, config)} style={A.btn('#555')}>← НАЗАД</button>
            <button onClick={async () => {
              // Перед уходом с "Время ответов" — свежая проверка доставки,
              // не полагаемся на последний фоновый опрос (до 2 сек устаревания)
              if (status === 'answer_time') await refetchAnswers?.()
              advance(gameState, config)
            }} style={A.btn('#ea580c')}>ДАЛЬШЕ →</button>
          </div>
        )}
        {config?.themes && status !== 'round_intro' && status !== 'rules' && (
          <div style={A.dim}>РАУНД 4 УПРАВЛЯЕТСЯ ПЛИТКАМИ НА ПРОЕКТОРЕ</div>
        )}
        {config?.themes && (status === 'round_intro' || status === 'rules') && (
          <div style={{ display: 'flex', gap: 8 }}>
            {status === 'rules' && <button onClick={() => setPhase('round_intro')} style={A.btn('#555')}>← НАЗАД</button>}
            <button onClick={() => setPhase(status === 'round_intro' ? 'rules' : 'question', 0)} style={A.btn('#ea580c')}>
              {status === 'round_intro' ? 'ПРАВИЛА →' : 'К СЕТКЕ →'}
            </button>
          </div>
        )}

        <button onClick={() => setShowRoundSwitch(s => !s)} style={A.linkBtn}>
          {showRoundSwitch ? 'СКРЫТЬ СПИСОК РАУНДОВ' : 'СМЕНИТЬ РАУНД'}
        </button>
        {showRoundSwitch && <RoundPicker current={round} />}

        {/* Рандомайзер доступен всегда, не только пока статус lobby — иначе
            его физически негде найти, если игра уже стартовала хоть раз */}
        <TeamRandomizer />

        <button onClick={async () => {
          if (window.confirm('НОВАЯ ИГРА: удалить все команды, ответы и баллы? Это необратимо.')) {
            await resetGame()
          }
        }} style={{ ...A.linkBtn, borderColor: '#7f1d1d', color: '#ef4444' }}>
          ⟲ НОВАЯ ИГРА (ПОЛНЫЙ СБРОС)
        </button>
      </div>
    </div>
  )
}

// П.5: индикатор для ведущего — «ответили N из M» + список
function AnsweredIndicator({ gameState, config, answers, teams }) {
  const step = gameState.current_step
  const filled = teams.map(t => {
    const a = answers.find(x => x.team_id === t.id && x.question_ref === `r${gameState.current_round}-q${step}` && x.answer_text?.trim())
    return { team: t, done: !!a }
  })
  const doneCount = filled.filter(f => f.done).length
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 22, color: doneCount === teams.length && teams.length > 0 ? '#22c55e' : '#ea580c' }}>
        ОТВЕТИЛИ {doneCount} / {teams.length}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        {filled.map(({ team, done }) => (
          <span key={team.id} style={{
            padding: '4px 12px', fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            border: `1px solid ${done ? '#22c55e' : '#333'}`, color: done ? '#22c55e' : '#555',
          }}>
            {done ? '✓ ' : ''}{team.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function QuestionTextOnly({ gameState, config }) {
  const { status, current_step: step } = gameState

  if (status === 'round_intro') return (
    <Centered>
      <div style={A.h1}>{config?.titleLines?.join(' ') || `РАУНД ${gameState.current_round}`}</div>
      <div style={A.dim}>{config?.metaLine}</div>
    </Centered>
  )
  if (status === 'rules') return (
    <Centered>
      <div style={A.dim}>ПРАВИЛА</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', maxWidth: 320 }}>
        {config?.rules?.map((r, i) => (
          <div key={i} style={{ fontSize: 14, color: '#ccc' }}>{i + 1}. {r}</div>
        ))}
      </div>
    </Centered>
  )
  if (status === 'repeat_intro') return <Centered><div style={A.h1}>ПОВТОР ВОПРОСОВ</div></Centered>
  if (status === 'answer_time') return <Centered><div style={{ ...A.h1, color: '#22c55e' }}>ВРЕМЯ ОТВЕТОВ</div></Centered>

  if ((status === 'question' || status === 'repeat') && config?.questions) {
    const q = config.questions[step]
    return (
      <Centered>
        <div style={A.dim}>{status === 'repeat' ? 'ПОВТОР' : 'ВОПРОС'} {step + 1} / {config.questions.length}</div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 24, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
          {q?.question_text || '(без текста — только медиа на проекторе)'}
        </div>
        {q?.choices && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 300 }}>
            {q.choices.map(c => (
              <div key={c.key} style={{ fontSize: 14, color: '#999' }}>{c.key} — {c.text}</div>
            ))}
          </div>
        )}
      </Centered>
    )
  }

  if (config?.themes) {
    const active = gameState.step_data?.active
    if (active) {
      const [t, i] = active.split('-').map(Number)
      return <Centered><div style={A.h1}>{config.themes[t]?.name}<br/>{config.themes[t]?.tiles[i]?.value} {pointsLabel(config.themes[t]?.tiles[i]?.value)}</div></Centered>
    }
    return <Centered><div style={A.dim}>ЖДЁМ ВЫБОРА ПЛИТКИ</div></Centered>
  }

  return null
}

// ═══ Р4 НА ТЕЛЕФОНЕ ВЕДУЩЕГО: ответы активной плитки + проверка, БЕЗ звука ═══
function R4AdminAnswers({ gameState, config, answers, onGrade }) {
  const active = gameState.step_data?.active
  if (!active) return null
  const [t, i] = active.split('-').map(Number)
  const tile = config.themes[t]?.tiles[i]

  const tileAnswers = answers
    .filter(a => a.question_ref === `r4-q${t}-${i}`)
    .sort((x, y) => new Date(x.updated_at) - new Date(y.updated_at))

  return (
    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={A.dim}>ОТВЕТЫ ПЛИТКИ (ПО СКОРОСТИ) · ВЕРНО = +{tile?.value}</div>
      {tileAnswers.length === 0 && <div style={{ ...A.dim, color: '#333' }}>ждём ответы...</div>}
      {tileAnswers.map((a, pos) => (
        <div key={a.id} style={{
          background: '#0d0d0d', border: '1px solid #222',
          borderLeft: `3px solid ${a.is_correct === true ? '#22c55e' : a.is_correct === false ? '#ef4444' : '#333'}`,
          padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: pos === 0 ? '#ea580c' : '#555', minWidth: 24 }}>#{pos + 1}</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: a.teams?.color || '#ea580c', minWidth: 64, fontSize: 14 }}>{a.teams?.name}</div>
          <div style={{ flex: 1, fontSize: 14, color: '#ccc' }}>{a.answer_text || '—'}</div>
          <button onClick={() => onGrade(a, true, tile?.value)} style={{ width: 34, height: 34, border: '1px solid #22c55e', background: a.is_correct === true ? '#22c55e25' : 'transparent', color: '#22c55e', cursor: 'pointer', fontWeight: 700 }}>✓</button>
          <button onClick={() => onGrade(a, false, tile?.value)} style={{ width: 34, height: 34, border: '1px solid #ef4444', background: a.is_correct === false ? '#ef444425' : 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>✗</button>
        </div>
      ))}
    </div>
  )
}

function Centered({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>{children}</div>
}

const A = {
  center: {
    minHeight: '100vh', background: '#050505', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
  },
  input: {
    background: '#0d0d0d', border: '1px solid #333', borderLeft: '3px solid #ea580c',
    color: '#fff', padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: 16,
    outline: 'none', width: '100%', maxWidth: 280,
  },
  primaryBtn: {
    background: '#ea580c', color: '#fff', border: 'none', padding: '12px 32px', cursor: 'pointer',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700,
  },
  header: {
    background: '#0d0d0d', borderBottom: '2px solid #ea580c', padding: '10px 14px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  linkBtn: {
    padding: '6px 10px', border: '1px solid #333', background: 'transparent',
    color: '#aaa', textDecoration: 'none', cursor: 'pointer',
    fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.05em', textAlign: 'center',
  },
  btn: (color) => ({
    flex: 1, padding: '12px 8px', border: `1px solid ${color}`,
    background: `${color}15`, color, cursor: 'pointer',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: '0.03em',
  }),
  roundBtn: (active) => ({
    padding: '10px 8px', border: `1px solid ${active ? '#ea580c' : '#333'}`,
    background: active ? 'rgba(234,88,12,0.1)' : 'transparent',
    color: active ? '#ea580c' : '#888', cursor: 'pointer',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 600, textAlign: 'left',
  }),
  dim: { fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', letterSpacing: '0.1em' },
  h1: { fontFamily: 'Rajdhani, sans-serif', fontSize: 28, fontWeight: 700, textAlign: 'center' },
}
