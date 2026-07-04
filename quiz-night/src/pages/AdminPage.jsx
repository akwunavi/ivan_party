import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameState } from '../hooks/useGameState'
import { useTeams } from '../hooks/useTeams'
import { useAnswers } from '../hooks/useAnswers'
import {
  updateGameState, openAnswers, closeAnswers,
  showScoreboard, awardPoints, markAnswer, doubleRoundScore,
} from '../lib/gameActions'
import { advance, goBack, setPhase } from '../lib/roundFlow'
import { ROUND_CONFIGS } from '../lib/roundsRegistry'
import { isFuzzyMatch } from '../lib/answerCheck'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY

export default function AdminPage() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem('quiz_admin') === '1')
  const [key, setKey] = useState('')

  function tryAuth() {
    if (key === ADMIN_KEY) {
      sessionStorage.setItem('quiz_admin', '1') // переживает перезагрузку вкладки
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
  const answers = useAnswers(gameState?.current_round)
  const [tab, setTab] = useState('control')

  if (!gameState) return <div style={A.center}>// ЗАГРУЗКА...</div>

  const round = gameState.current_round
  const config = ROUND_CONFIGS[round]
  const pts = config?.pointsPerQuestion ?? 1

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <div style={A.header}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700, color: '#ea580c' }}>ВЕДУЩИЙ</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="./" target="_blank" rel="noreferrer" style={A.linkBtn}>ПРОЕКТОР ↗</a>
          <button onClick={() => {
            const url = `${window.location.origin}${window.location.pathname}#/player`
            navigator.clipboard?.writeText(url)
          }} style={A.linkBtn}>
            ССЫЛКА ИГРОКАМ
          </button>
        </div>
      </div>
      <div style={{ ...A.headerMeta, padding: '4px 16px', background: '#0a0a0a' }}>
        R{round} · {gameState.status} · шаг {gameState.current_step + 1}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
        {[['control', 'Управление'], ['answers', 'Ответы'], ['scores', 'Баллы']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={A.tab(tab === id)}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

        {tab === 'control' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Листание слайдов — то же, что кнопки на проекторе */}
            {config && (
              <Section title="СЛАЙДЫ">
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => goBack(gameState, config)} style={A.btn('#555')}>← НАЗАД</button>
                  <button onClick={() => advance(gameState, config)} style={A.btn('#ea580c')}>ВПЕРЁД →</button>
                </div>
              </Section>
            )}

            <Section title="РАУНД">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(ROUND_CONFIGS).map(([n, c]) => (
                  <button key={n} onClick={() => updateGameState({
                    current_round: Number(n), current_step: 0, status: 'round_intro',
                    accepting_answers: false, step_data: {},
                  })} style={A.roundBtn(round === Number(n))}>
                    R{n} {c.titleLines.join(' ')}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="ПРИЁМ ОТВЕТОВ">
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={openAnswers} style={A.btn('#22c55e')}>ОТКРЫТЬ</button>
                <button onClick={closeAnswers} style={A.btn('#ef4444')}>ЗАКРЫТЬ</button>
              </div>
            </Section>

            <Section title="ТАБЛО">
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => showScoreboard(true)} style={A.btn('#ea580c')}>ПОКАЗАТЬ</button>
                <button onClick={() => showScoreboard(false)} style={A.btn('#555')}>СКРЫТЬ</button>
              </div>
            </Section>

            {round === 3 && (
              <Section title="АВТОПОДСЧЁТ Р3 (СТОП ПОСЛЕ ОШИБКИ)">
                <AutoScoreR3 teams={teams} answers={answers} />
              </Section>
            )}

            {round === 7 && (
              <Section title="УДВОЕНИЕ (ТЕМА УГАДАНА)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {teams.map(t => (
                    <button key={t.id} onClick={() => doubleRoundScore(t.id, 7)} style={A.btn(t.color)}>
                      ×2 · {t.name}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            <Section title="ИГРА">
              <button onClick={() => updateGameState({ status: 'lobby', current_round: 0, current_step: 0 })} style={A.btn('#555')}>
                В ЛОББИ
              </button>
            </Section>
          </div>
        )}

        {tab === 'answers' && (
          <AnswersTab answers={answers} config={config} round={round} defaultPts={pts} teams={teams} />
        )}

        {tab === 'scores' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...teams].sort((a, b) => b.total_score - a.total_score).map((team, i) => (
              <div key={team.id} style={A.scoreRow(team.color)}>
                <div style={{ color: '#555', fontFamily: 'Share Tech Mono, monospace', fontSize: 12, minWidth: 18 }}>{i + 1}</div>
                <div style={{ flex: 1, fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700 }}>{team.name}</div>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 22, color: '#ea580c', fontWeight: 700 }}>
                  {Number(team.total_score) % 1 === 0 ? team.total_score : Number(team.total_score).toFixed(1)}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => awardPoints(team.id, round, null, 1, 'manual')} style={A.tiny('#22c55e')}>+1</button>
                  <button onClick={() => awardPoints(team.id, round, null, 0.5, 'manual')} style={A.tiny('#16a34a')}>+½</button>
                  <button onClick={() => awardPoints(team.id, round, null, -1, 'manual')} style={A.tiny('#ef4444')}>-1</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ АВТОПОДСЧЁТ РАУНДА 3 ═══
// Правило: идём по вопросам по порядку. Верный = +1.
// Пусто = пропуск (не ошибка). Первый НЕВЕРНЫЙ = стоп, дальше не считаем.
// Защита от двойного нажатия: проверяем score_log на reason='auto_r3'.
function AutoScoreR3({ teams, answers }) {
  const [done, setDone] = useState(false)
  const [result, setResult] = useState(null)
  const config = ROUND_CONFIGS[3]

  async function run() {
    const { data: existing } = await supabase
      .from('score_log').select('id').eq('reason', 'auto_r3').limit(1)
    if (existing?.length) {
      setResult('Уже посчитано! Откати вручную во вкладке «Баллы», если нужно пересчитать.')
      return
    }

    const lines = []
    for (const team of teams) {
      let total = 0
      for (let qi = 0; qi < config.questions.length; qi++) {
        const a = answers.find(x => x.team_id === team.id && x.question_ref === `r3-q${qi}`)
        const given = a?.answer_text?.trim()
        if (!given) continue                                   // пропуск — не ошибка
        if (given === config.questions[qi].correct_choice) total += 1
        else break                                             // ошибка — стоп
      }
      if (total > 0) await awardPoints(team.id, 3, 'r3-auto', total, 'auto_r3')
      lines.push(`${team.name}: +${total}`)
    }
    setResult(lines.join(' · '))
    setDone(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button onClick={run} disabled={done} style={A.btn('#ea580c')}>ПОСЧИТАТЬ РАУНД 3</button>
      {result && <div style={{ ...A.dim, color: '#22c55e' }}>{result}</div>}
    </div>
  )
}

// ═══ ВКЛАДКА ОТВЕТОВ: сгруппировано по вопросам, галочки верно/нет ═══
// Автоматика внутри grade():
//   • ставки (Р5/Р8): верно = ставка+1, неверно = −ставка
//   • Р2: когда все 4 ответа блока у команды верны → авто +1 (block_bonus)
//   • повторное нажатие той же галочки игнорируется (защита от даблкликов)
function AnswersTab({ answers, config, round, defaultPts, teams }) {
  if (!config) return <div style={A.dim}>// ВЫБЕРИ РАУНД</div>
  const isStakes = config.stakesRound
  const isJeopardy = round === 4

  async function grade(a, correct, ptsOverride) {
    if (a.is_correct === correct) return   // уже отмечено так же — не дублируем баллы

    // ── ОТКАТ: перещёлкивание ✓↔✗ сначала снимает прежние баллы ──
    // (именно из-за отсутствия отката в «том квизе» команды получали >10 в Р3)
    const prev = Number(a.points_awarded ?? 0)
    if (prev !== 0) {
      await awardPoints(a.team_id, round, a.question_ref, -prev, 'revert')
    }
    // Р2: если ответ был верным и бонус блока уже выдан — снимаем и бонус
    if (round === 2 && a.is_correct === true && !correct) {
      const qi = Number(a.question_ref.split('-q')[1])
      const block = config.questions[qi]?.block_number
      const bonusRef = `r2-block${block}-bonus`
      const { data: bonusLog } = await supabase
        .from('score_log').select('delta')
        .eq('team_id', a.team_id).eq('question_ref', bonusRef)
      const bonusSum = (bonusLog || []).reduce((s, r) => s + Number(r.delta), 0)
      if (bonusSum > 0) await awardPoints(a.team_id, 2, bonusRef, -bonusSum, 'block_bonus_revert')
    }

    const stake = Number(a.stake ?? 0)
    let delta
    if (ptsOverride != null) delta = correct ? ptsOverride : 0
    else if (isStakes) delta = correct ? stake + 1 : -stake
    else delta = correct ? defaultPts : 0
    await markAnswer(a.id, correct, delta)
    if (delta !== 0) await awardPoints(a.team_id, round, a.question_ref, delta, correct ? 'correct' : 'wrong')

    // Р2: авто-бонус +1, если это был 4-й верный ответ блока
    if (round === 2 && correct) {
      const qi = Number(a.question_ref.split('-q')[1])
      const block = config.questions[qi]?.block_number
      const blockRefs = config.questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => q.block_number === block)
        .map(({ i }) => `r2-q${i}`)
      const teamBlockAnswers = answers.filter(x => x.team_id === a.team_id && blockRefs.includes(x.question_ref))
      const correctCount = teamBlockAnswers.filter(x =>
        x.id === a.id ? true : x.is_correct === true).length
      if (correctCount === blockRefs.length) {
        await awardPoints(a.team_id, 2, `r2-block${block}-bonus`, config.blockBonus ?? 1, 'block_bonus')
      }
    }
  }

  // ── Р4: ответы по активной плитке, отсортированы по скорости ──
  if (isJeopardy) {
    const themes = config.themes
    const refs = []
    themes.forEach((th, t) => th.tiles.forEach((tile, i) =>
      refs.push({ ref: `r4-q${t}-${i}`, label: `${th.name} · ${tile.value}`, value: tile.value })))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={A.dim}>// ОТВЕТЫ ОТСОРТИРОВАНЫ ПО ВРЕМЕНИ — ПЕРВЫЙ ВЕРНЫЙ ПОБЕЖДАЕТ</div>
        {refs.map(({ ref, label, value }) => {
          const qAnswers = answers
            .filter(a => a.question_ref === ref)
            .sort((x, y) => new Date(x.updated_at) - new Date(y.updated_at))
          if (qAnswers.length === 0) return null
          return (
            <div key={ref}>
              <div style={{ ...A.dim, marginBottom: 6 }}>// {label} БАЛЛА</div>
              {qAnswers.map((a, pos) => (
                <div key={a.id} style={A.answerRow(a.is_correct)}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: pos === 0 ? '#ea580c' : '#555', minWidth: 46 }}>
                    #{pos + 1} {new Date(a.updated_at).toLocaleTimeString('ru', { minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: a.teams?.color || '#ea580c', minWidth: 70, fontSize: 14 }}>
                    {a.teams?.name}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, color: '#ccc' }}>{a.answer_text || '—'}</div>
                  <button onClick={() => grade(a, true, value)} style={A.tiny('#22c55e')}>✓</button>
                  <button onClick={() => grade(a, false, value)} style={A.tiny('#ef4444')}>✗</button>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  const questions = config.questions || []

  // ── АВТОПРОВЕРКА ПО ЛЕВЕНШТЕЙНУ (все раунды кроме Р3 и Р4) ──
  // Буквенные варианты (choices) сверяются точно, свободный текст — с допуском
  // на опечатки. Пустые ответы не трогаем. Твои ✓/✗ поверх — всегда главнее:
  // перещёлкивание корректно откатит баллы автопроверки.
  async function autoCheck() {
    for (const a of answers) {
      const qi = Number(a.question_ref.split('-q')[1])
      const q = questions[qi]
      if (!q) continue
      const given = a.answer_text?.trim()
      if (!given) continue
      const correct = q.correct_choice
        ? given === q.correct_choice
        : isFuzzyMatch(given, q.correct_answer)
      if (correct === null) continue
      await grade(a, correct)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {round !== 3 && (
        <button onClick={autoCheck} style={A.btn('#ea580c')}>
          ⚡ АВТОПРОВЕРКА РАУНДА (ОПЕЧАТКИ ПРОЩАЕМ)
        </button>
      )}
      {questions.map((q, qi) => {
        const ref = `r${round}-q${qi}`
        const qAnswers = answers.filter(a => a.question_ref === ref)
        return (
          <div key={qi}>
            <div style={{ ...A.dim, marginBottom: 6 }}>
              // ВОПРОС {qi + 1} · ОТВЕТ: <span style={{ color: '#22c55e' }}>{q.correct_answer || q.correct_choice || '—'}</span>
            </div>
            {qAnswers.length === 0 && <div style={{ ...A.dim, color: '#333', paddingLeft: 8 }}>нет ответов</div>}
            {qAnswers.map(a => (
              <div key={a.id} style={A.answerRow(a.is_correct)}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: a.teams?.color || '#ea580c', minWidth: 80, fontSize: 14 }}>
                  {a.teams?.name}
                </div>
                <div style={{ flex: 1, fontSize: 14, color: '#ccc' }}>
                  {a.answer_text || '—'}
                  {a.stake != null && <span style={{ color: '#ea580c' }}> · ставка {a.stake}</span>}
                </div>
                <button onClick={() => grade(a, true)} style={A.tiny('#22c55e')}>✓</button>
                <button onClick={() => grade(a, false)} style={A.tiny('#ef4444')}>✗</button>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#555', letterSpacing: '0.2em', marginBottom: 8 }}>// {title}</div>
      {children}
    </div>
  )
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
    background: '#0d0d0d', borderBottom: '3px solid #ea580c', padding: '12px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  headerMeta: { fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#555' },
  linkBtn: {
    padding: '6px 12px', border: '1px solid #333', background: 'transparent',
    color: '#aaa', textDecoration: 'none', cursor: 'pointer',
    fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.05em',
  },
  tab: (active) => ({
    flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
    background: active ? 'rgba(234,88,12,0.1)' : 'transparent',
    color: active ? '#ea580c' : '#666',
    borderBottom: active ? '2px solid #ea580c' : '2px solid transparent',
    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
  }),
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
  tiny: (color) => ({
    width: 36, height: 36, border: `1px solid ${color}`, background: 'transparent',
    color, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontSize: 14, fontWeight: 700,
  }),
  scoreRow: (color) => ({
    background: '#0d0d0d', border: '1px solid #222', borderLeft: `3px solid ${color || '#ea580c'}`,
    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
  }),
  answerRow: (isCorrect) => ({
    background: '#0d0d0d', border: '1px solid #222',
    borderLeft: `3px solid ${isCorrect === true ? '#22c55e' : isCorrect === false ? '#ef4444' : '#333'}`,
    padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
  }),
  dim: { fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#555', letterSpacing: '0.1em' },
}
