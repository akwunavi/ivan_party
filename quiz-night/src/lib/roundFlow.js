// ============================================================
// ЛОГИКА ФАЗ РАУНДА — вся правда живёт в Supabase (game_state)
// ============================================================
// status:        какой слайд показывать
// current_step:  номер вопроса (0-based) внутри фазы
//
// Фазы (status):
//   round_intro  — название раунда
//   rules        — правила
//   question     — вопрос N
//   repeat_intro — слайд "Повтор вопросов"
//   repeat       — повтор вопроса N
//   answer_time  — время на ответы (приём открыт)
//   show_answers — показ правильных ответов
//   scoreboard   — табло
//
// Любой экран при загрузке читает status+step и рисует нужный слайд.
// Перезагрузка страницы = тот же слайд.

import { updateGameState } from './gameActions'
import { TOTAL_ROUNDS } from './roundsRegistry'

export async function setPhase(status, step = 0, extra = {}) {
  await updateGameState({
    status,
    current_step: step,
    accepting_answers: status === 'answer_time' ? true : extra.accepting_answers ?? undefined,
    ...extra,
  })
}

// Универсальный переход "дальше" для стандартного раунда
export async function advance(gameState, roundConfig) {
  const { status, current_step: step } = gameState
  const total = roundConfig.questions.length

  if (status === 'round_intro') return setPhase('rules')
  if (status === 'rules')       return setPhase('question', 0)

  if (status === 'question') {
    if (step < total - 1) return setPhase('question', step + 1)
    if (roundConfig.hasRepeats) return setPhase('repeat_intro')
    return setPhase('answer_time', 0, { accepting_answers: true })
  }

  if (status === 'repeat_intro') return setPhase('repeat', 0)

  if (status === 'repeat') {
    if (step < total - 1) return setPhase('repeat', step + 1)
    return setPhase('answer_time', 0, { accepting_answers: true })
  }

  if (status === 'answer_time') return setPhase('show_answers', 0)

  // С табло — в следующий раунд (после Р8 — в лобби)
  if (status === 'scoreboard') {
    const next = (gameState.current_round ?? 0) + 1
    if (next <= TOTAL_ROUNDS) return updateGameState({
      current_round: next, current_step: 0, status: 'round_intro',
      accepting_answers: false, show_scoreboard: false, step_data: {},
    })
    return updateGameState({ status: 'lobby', current_round: 0, current_step: 0, show_scoreboard: false })
  }
}

// Переход "назад" (если ведущий промахнулся)
export async function goBack(gameState, roundConfig) {
  const { status, current_step: step } = gameState
  if (status === 'rules')        return setPhase('round_intro')
  if (status === 'question')     return step > 0 ? setPhase('question', step - 1) : setPhase('rules')
  if (status === 'repeat_intro') return setPhase('question', roundConfig.questions.length - 1)
  if (status === 'repeat')       return step > 0 ? setPhase('repeat', step - 1) : setPhase('repeat_intro')
  if (status === 'answer_time')  return roundConfig.hasRepeats
    ? setPhase('repeat', roundConfig.questions.length - 1)
    : setPhase('question', roundConfig.questions.length - 1)
  if (status === 'show_answers') return setPhase('answer_time', 0, { accepting_answers: true })
}
