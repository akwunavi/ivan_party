import { supabase } from './supabase'

async function getStateId() {
  const { data } = await supabase.from('game_state').select('id').single()
  return data?.id
}

// Обновить game_state — единственный «пульт», пишет только ведущий
export async function updateGameState(patch) {
  const id = await getStateId()
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
  const { error } = await supabase
    .from('game_state')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function startTimer(seconds) {
  await updateGameState({ timer_started_at: new Date().toISOString(), timer_seconds: seconds })
}

export async function openAnswers()  { await updateGameState({ accepting_answers: true }) }
export async function closeAnswers() { await updateGameState({ accepting_answers: false }) }

export async function showScoreboard(show = true) {
  await updateGameState(show
    ? { show_scoreboard: true, status: 'scoreboard' }
    : { show_scoreboard: false, status: 'round_intro' })
}

// Начислить баллы (question_ref = "r1-q0" или null для ручной правки)
export async function awardPoints(teamId, roundNumber, questionRef, delta, reason) {
  const { error } = await supabase.rpc('award_points', {
    p_team_id: teamId,
    p_round: roundNumber,
    p_question_ref: questionRef,
    p_delta: delta,
    p_reason: reason,
  })
  if (error) throw error
}

// Удвоить баллы раунда (R7)
export async function doubleRoundScore(teamId, roundNumber) {
  const { error } = await supabase.rpc('double_round_score', {
    p_team_id: teamId,
    p_round: roundNumber,
  })
  if (error) throw error
}

// Отметить ответ верным/неверным
export async function markAnswer(answerId, isCorrect, pointsAwarded) {
  const { error } = await supabase
    .from('answers')
    .update({ is_correct: isCorrect, points_awarded: pointsAwarded })
    .eq('id', answerId)
  if (error) throw error
}

// Зарегистрировать команду
export async function registerTeam(name, color) {
  const { data: game } = await supabase.from('game').select('id').single()
  const { data, error } = await supabase
    .from('teams')
    .insert({ game_id: game.id, name, color })
    .select()
    .single()
  if (error) throw error
  return data
}

// ═══ НОВАЯ ИГРА: полный сброс ═══
// Удаляет ответы, ставки, историю баллов и команды; возвращает игру в лобби.
// Капитанам нужно будет заново зарегистрироваться (localStorage у них
// чистится сам при регистрации новой команды — просто заходят по QR заново).
export async function resetGame() {
  // порядок важен из-за внешних ключей
  await supabase.from('answers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('stakes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('score_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await updateGameState({
    status: 'lobby', current_round: 0, current_step: 0,
    accepting_answers: false, show_scoreboard: false,
    step_data: {}, timer_started_at: null,
  })
}
