import { supabase } from './supabase'
import { registerTeam } from './gameActions'

// ═══ СИД ДЛЯ РЕПЕТИЦИЙ (только с ?dev=1 в адресе) ═══
// «Создать демо-команды» + «Заполнить ответы раунда» — прогон любого раунда
// за минуту без ручной регистрации и ввода с телефона.
// Ответы формат-осознанные: для каждого типа вопроса генерится валидный ответ,
// с перекосом ~65% в сторону правильного — чтобы проверялись обе ветки (✓ и ✗).

const DEMO_NAMES = ['Тест-1', 'Тест-2', 'Тест-3']
const DEMO_COLORS = ['#14b8a6', '#f43f5e', '#eab308']

export const isDevMode = () =>
  typeof window !== 'undefined' && window.location.href.includes('dev=1')

export async function seedTeams() {
  const { data: existing } = await supabase.from('teams').select('name')
  const have = new Set((existing || []).map(t => t.name))
  const created = []
  for (let i = 0; i < DEMO_NAMES.length; i++) {
    if (have.has(DEMO_NAMES[i])) continue
    created.push(await registerTeam(DEMO_NAMES[i], DEMO_COLORS[i]))
  }
  return created.length
}

const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
const lucky = () => Math.random() < 0.65 // «скорее верно»

// Ответ под формат вопроса
function genAnswer(q, correctBias = lucky()) {
  if (q.order_answer && q.correct_order) {
    if (correctBias) return q.correct_order
    return shuffle(q.correct_order.split('')).join('')
  }
  if (q.match_pairs && q.correct_pairs) {
    if (correctBias) return q.correct_pairs.join(',')
    const rights = shuffle(q.match_pairs.right)
    return q.match_pairs.left.map((l, i) => `${l}${rights[i]}`).join(',')
  }
  if (q.choices) {
    if (correctBias && q.correct_choice) return q.correct_choice
    return pick(q.choices).key
  }
  if (correctBias && typeof q.correct_answer === 'string' && q.correct_answer !== '—') {
    return q.correct_answer
  }
  return pick(['не знаем', 'вариант наугад', 'тестовый ответ', '42'])
}

// Заполнить ответы всех демо-команд (и только их) для указанного раунда
export async function seedRoundAnswers(gameState, config) {
  const { data: teams } = await supabase.from('teams').select('*')
  const demo = (teams || []).filter(t => DEMO_NAMES.includes(t.name))
  if (demo.length === 0) return 0

  const round = config.number
  const rows = []

  if (config.themes) {
    // Р4: ответ на каждую плитку каждой темы
    config.themes.forEach((theme, t) => {
      theme.tiles.forEach((tile, i) => {
        demo.forEach(team => {
          rows.push({
            team_id: team.id, game_id: gameState.game_id,
            question_ref: `r4-q${t}-${i}`, round_number: 4,
            answer_text: lucky() && tile.correct_answer !== '—' ? tile.correct_answer : pick(['мимо', 'не угадали', '?']),
            updated_at: new Date().toISOString(),
          })
        })
      })
    })
  } else {
    const stakesPool = config.stakesValues || null
    demo.forEach(team => {
      // Р5: уникальные ставки — своя перетасовка на команду
      const uniqueStakes = stakesPool && round === 5 ? shuffle(stakesPool) : null
      config.questions.forEach((q, qi) => {
        if (q.block_intro) return
        const row = {
          team_id: team.id, game_id: gameState.game_id,
          question_ref: `r${round}-q${qi}`, round_number: round,
          answer_text: genAnswer(q),
          updated_at: new Date().toISOString(),
        }
        if (uniqueStakes) row.stake = uniqueStakes[qi % uniqueStakes.length]
        else if (stakesPool) row.stake = pick(stakesPool) // Р7: свободный выбор
        rows.push(row)
      })
    })
  }

  // Пачками по 50, через upsert (повторный сид перезаписывает, дублей нет)
  for (let i = 0; i < rows.length; i += 50) {
    await supabase.from('answers').upsert(rows.slice(i, i + 50), { onConflict: 'team_id,question_ref' })
  }
  return rows.length
}
