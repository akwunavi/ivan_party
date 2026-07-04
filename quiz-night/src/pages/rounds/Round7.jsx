import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 7: ТЕМАТИЧЕСКИЙ ═══
// 5 обычных вопросов + 6-й специальный: угадать тему раунда (текстом, что угодно).
// Угадали тему → баллы ЭТОГО раунда ×2 (кнопка в админке вызывает double_round_score).
export const ROUND7 = {
  number: 7,
  titleLines: ['ТЕМАТИЧЕСКИЙ', 'РАУНД'],
  metaLine: '5+1 ВОПРОСОВ · 60 СЕК · ×2 ЗА ТЕМУ',
  timerSeconds: 60,
  hasRepeats: false,
  autoAdvanceQuestions: false,
  rules: [
    '5 вопросов — текст, музыка, картинки. По 1 баллу',
    'На каждый вопрос 60 секунд',
    'Шестой вопрос — угадайте тему раунда',
    'Угадали тему — все баллы этого раунда удваиваются',
  ],
  questions: [
    { content_type: 'text', question_text: 'Вопрос 1?', media_urls: [], correct_answer: '—' },
    { content_type: 'text', question_text: 'Вопрос 2?', media_urls: [], correct_answer: '—' },
    { content_type: 'text', question_text: 'Вопрос 3?', media_urls: [], correct_answer: '—' },
    { content_type: 'text', question_text: 'Вопрос 4?', media_urls: [], correct_answer: '—' },
    { content_type: 'text', question_text: 'Вопрос 5?', media_urls: [], correct_answer: '—' },
    {
      content_type: 'text',
      question_text: 'ГЛАВНЫЙ ВОПРОС: какая тема объединяет все вопросы раунда?',
      media_urls: [],
      correct_answer: '— (тема раунда)',
      is_final_question: true,
    },
  ],
}

export default function Round7({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND7} />
}
