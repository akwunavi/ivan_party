import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 5: ВОПРОСЫ СО СТАВКАМИ ═══
// 6 вопросов, 60 сек, ПОВТОРЫ ЕСТЬ — во время повторов игроки расставляют ставки 0–5.
// Каждая ставка используется ровно один раз (валидируется на телефоне).
// Верно: ставка + 1. Неверно: минус ставка. Считаешь в админке.
export const ROUND5 = {
  number: 5,
  titleLines: ['РАУНД', 'ГЕОГРАФИЯ'],
  metaLine: '6 ВОПРОСОВ · 60 СЕК · СТАВКИ 0–5',
  timerSeconds: 60,
  hasRepeats: false,
  stakesRound: true,
  stakesValues: [0, 1, 2, 3, 4, 5],  // каждая ровно 1 раз
  autoAdvanceQuestions: false,
  rules: [
    '6 вопросов по географии с вариантами ответов, на каждый 60 секунд',
    'Во время повторов расставьте ставки от 0 до 5',
    'Каждую ставку можно использовать только один раз',
    'Верный ответ: ставка + 1 балл. Неверный: минус ставка',
  ],
  questions: [
    // Р5 тоже с буквенными вариантами — автопроверка сверяет букву точно
    {
      content_type: 'choice',
      question_text: 'Вопрос 1?',
      choices: [
        { key: 'А', text: 'Вариант 1' }, { key: 'Б', text: 'Вариант 2' },
        { key: 'В', text: 'Вариант 3' }, { key: 'Г', text: 'Вариант 4' },
      ],
      correct_choice: 'А',
      correct_answer: 'А — Вариант 1',
    },
    { content_type: 'choice', question_text: 'Вопрос 2?', choices: [{ key: 'А', text: '...' }, { key: 'Б', text: '...' }, { key: 'В', text: '...' }, { key: 'Г', text: '...' }], correct_choice: 'А', correct_answer: '—' },
    { content_type: 'choice', question_text: 'Вопрос 3?', choices: [{ key: 'А', text: '...' }, { key: 'Б', text: '...' }, { key: 'В', text: '...' }, { key: 'Г', text: '...' }], correct_choice: 'А', correct_answer: '—' },
    { content_type: 'choice', question_text: 'Вопрос 4?', choices: [{ key: 'А', text: '...' }, { key: 'Б', text: '...' }, { key: 'В', text: '...' }, { key: 'Г', text: '...' }], correct_choice: 'А', correct_answer: '—' },
    { content_type: 'choice', question_text: 'Вопрос 5?', choices: [{ key: 'А', text: '...' }, { key: 'Б', text: '...' }, { key: 'В', text: '...' }, { key: 'Г', text: '...' }], correct_choice: 'А', correct_answer: '—' },
    { content_type: 'choice', question_text: 'Вопрос 6?', choices: [{ key: 'А', text: '...' }, { key: 'Б', text: '...' }, { key: 'В', text: '...' }, { key: 'Г', text: '...' }], correct_choice: 'А', correct_answer: '—' },
  ],
}

export default function Round5({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND5} />
}
