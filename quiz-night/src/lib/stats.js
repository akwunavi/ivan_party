import { supabase } from './supabase'
import { ROUND_CONFIGS, TOTAL_ROUNDS } from './roundsRegistry'

// ═══ СТАТИСТИКА ИГРЫ ═══
// Собирает полную картину: баллы по командам/раундам + % команд, взявших
// каждый вопрос + все ответы построчно (для спорных ситуаций).

export async function collectGameStats() {
  const [{ data: teams }, { data: answers }, { data: scoreLog }] = await Promise.all([
    supabase.from('teams').select('*'),
    supabase.from('answers').select('*, teams(name)'),
    supabase.from('score_log').select('*'),
  ])
  return buildStats(teams || [], answers || [], scoreLog || [])
}

export function buildStats(teams, answers, scoreLog) {
  const teamName = Object.fromEntries(teams.map(t => [t.id, t.name]))

  // Баллы по раундам из score_log (боевые раунды)
  const byTeamRound = {}
  scoreLog.forEach(r => {
    if (r.round_number < 1 || r.round_number > TOTAL_ROUNDS) return
    byTeamRound[r.team_id] = byTeamRound[r.team_id] || {}
    byTeamRound[r.team_id][r.round_number] =
      (byTeamRound[r.team_id][r.round_number] || 0) + Number(r.delta)
  })
  const totalOf = id =>
    Object.values(byTeamRound[id] || {}).reduce((s, v) => s + v, 0)

  const sortedTeams = [...teams].sort((a, b) => totalOf(b.id) - totalOf(a.id))

  // По вопросам: % команд, ответивших верно (от всех зарегистрированных команд)
  const questionStats = []
  for (let rn = 1; rn <= TOTAL_ROUNDS; rn++) {
    const config = ROUND_CONFIGS[rn]
    if (!config?.questions) continue
    config.questions.forEach((q, qi) => {
      if (q.block_intro) return
      const ref = `r${rn}-q${qi}`
      const qAnswers = answers.filter(a => a.question_ref === ref)
      const correct = qAnswers.filter(a => a.is_correct === true).length
      questionStats.push({
        round: rn,
        ref,
        title: (q.question_text || '').split('\n')[0].slice(0, 60),
        answered: qAnswers.length,
        correct,
        pct: teams.length ? Math.round((correct / teams.length) * 100) : 0,
      })
    })
  }

  // ── CSV: все ответы построчно (спорные ситуации) ──
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csvRows = [
    ['Раунд', 'Вопрос', 'Команда', 'Ответ', 'Ставка', 'Верно', 'Баллы'].map(esc).join(','),
    ...answers
      .filter(a => a.round_number >= 1 && a.round_number <= TOTAL_ROUNDS)
      .sort((a, b) => a.round_number - b.round_number || a.question_ref.localeCompare(b.question_ref))
      .map(a => [
        a.round_number, a.question_ref,
        a.teams?.name || teamName[a.team_id] || a.team_id,
        a.answer_text, a.stake ?? '',
        a.is_correct === true ? 'да' : a.is_correct === false ? 'нет' : '—',
        a.points_awarded ?? '',
      ].map(esc).join(',')),
    '',
    ['— СВОДКА ПО ВОПРОСАМ —'].map(esc).join(','),
    ['Раунд', 'Вопрос', 'Текст', 'Ответили', 'Верно', '% команд'].map(esc).join(','),
    ...questionStats.map(qs =>
      [qs.round, qs.ref, qs.title, qs.answered, qs.correct, `${qs.pct}%`].map(esc).join(',')),
  ]
  // BOM — чтобы Excel открыл кириллицу без танцев
  const csv = '\uFEFF' + csvRows.join('\n')

  // ── Текст для Telegram: компактная сводка ──
  const lines = ['🏆 QUIZ NIGHT — ИТОГИ', '']
  sortedTeams.forEach((t, i) => {
    const rounds = byTeamRound[t.id] || {}
    const parts = Object.entries(rounds).sort((a, b) => a[0] - b[0])
      .map(([rn, pts]) => `Р${rn}:${pts % 1 === 0 ? pts : pts.toFixed(1)}`)
    const tot = totalOf(t.id)
    lines.push(`${i + 1}. ${t.name} — ${tot % 1 === 0 ? tot : tot.toFixed(1)}  (${parts.join(' ')})`)
  })
  lines.push('', '📊 Взятие вопросов (% команд):')
  questionStats.forEach(qs => {
    lines.push(`Р${qs.round} ${qs.ref.split('-')[1]}: ${qs.pct}% — ${qs.title}`)
  })
  const tgText = lines.join('\n')

  return { csv, tgText, sortedTeams, questionStats }
}

// ── Отправка в Telegram (та же схема, что в твоём трекере билетов) ──
// Нужны переменные в .env:
//   VITE_TG_BOT_TOKEN=123456:ABC-DEF...
//   VITE_TG_CHAT_ID=123456789
// ⚠️ Токен попадает в собранный JS (виден любому, кто откроет исходники
// страницы) — заведи ОТДЕЛЬНОГО бота только для этой цели, не переиспользуй
// бота от трекера.
const TG_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN
const TG_CHAT = import.meta.env.VITE_TG_CHAT_ID

export const telegramConfigured = Boolean(TG_TOKEN && TG_CHAT)

export async function sendStatsToTelegram({ csv, tgText }) {
  if (!telegramConfigured) throw new Error('Telegram не настроен (.env)')
  const base = `https://api.telegram.org/bot${TG_TOKEN}`

  // Сообщение-сводка (Telegram лимит 4096 символов — режем при необходимости)
  const chunks = []
  for (let i = 0; i < tgText.length; i += 4000) chunks.push(tgText.slice(i, i + 4000))
  for (const chunk of chunks) {
    const res = await fetch(`${base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: chunk }),
    })
    if (!res.ok) throw new Error('sendMessage failed')
  }

  // CSV-файл документом
  const form = new FormData()
  form.append('chat_id', TG_CHAT)
  form.append('document', new Blob([csv], { type: 'text/csv' }), 'quiz-stats.csv')
  const res = await fetch(`${base}/sendDocument`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('sendDocument failed')
}

// Локальное скачивание CSV (работает всегда, без всяких токенов)
export function downloadCsv(csv, filename = 'quiz-stats.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
