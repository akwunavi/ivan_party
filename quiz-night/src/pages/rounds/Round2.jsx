import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 2: КАРТИНКИ — 3 БЛОКА × 4 ВОПРОСА ═══
// У каждого вопроса block_number (1-3). Картинок сколько угодно — сетка сама.
// Баллы: 0.5 за верный; +1 если все 4 в блоке верны (админка считает сама).
export const ROUND2 = {
  number: 2,
  titleLines: ['РАУНД', 'КАРТИНОК'],
  metaLine: '3 БЛОКА × 4 ВОПРОСА · 30 СЕК · 0.5 БАЛЛА (+1 ЗА БЛОК)',
  timerSeconds: 30,
  hasRepeats: false,           // ← включишь если нужно
  autoAdvanceQuestions: false,
  blockBonus: 1,
  pointsPerQuestion: 0.5,
  rules: [
    '3 блока по 4 вопроса, у каждого блока своя тема',
    'На каждый вопрос 30 секунд',
    'За верный ответ — 0.5 балла',
    'Все 4 ответа блока верны — ещё +1 балл',
  ],
  questions: [
    // ── БЛОК 1 ──
    { block_number: 1, block_position: 1, content_type: 'image', question_text: 'Тема блока 1 — вопрос 1', media_urls: ['/media/r2/b1q1.jpg'], correct_answer: '—' },
    { block_number: 1, block_position: 2, content_type: 'image', question_text: 'Вопрос 2', media_urls: ['/media/r2/b1q2.jpg'], correct_answer: '—' },
    { block_number: 1, block_position: 3, content_type: 'image', question_text: 'Вопрос 3', media_urls: ['/media/r2/b1q3.jpg'], correct_answer: '—' },
    { block_number: 1, block_position: 4, content_type: 'image', question_text: 'Вопрос 4', media_urls: ['/media/r2/b1q4.jpg'], correct_answer: '—' },
    // ── БЛОК 2: ПЕСНИ В КАРТИНКАХ (много картинок на слайде — сетка сама) ──
    { block_number: 2, block_position: 1, content_type: 'multi_image', question_text: 'Угадай песню по картинкам', media_urls: ['/media/r2/b2q1-1.jpg', '/media/r2/b2q1-2.jpg', '/media/r2/b2q1-3.jpg'], correct_answer: '—' },
    { block_number: 2, block_position: 2, content_type: 'multi_image', question_text: 'Угадай песню по картинкам', media_urls: [], correct_answer: '—' },
    { block_number: 2, block_position: 3, content_type: 'multi_image', question_text: 'Угадай песню по картинкам', media_urls: [], correct_answer: '—' },
    { block_number: 2, block_position: 4, content_type: 'multi_image', question_text: 'Угадай песню по картинкам', media_urls: [], correct_answer: '—' },
    // ── БЛОК 3 ──
    { block_number: 3, block_position: 1, content_type: 'image', question_text: 'Тема блока 3 — вопрос 1', media_urls: [], correct_answer: '—' },
    { block_number: 3, block_position: 2, content_type: 'image', question_text: 'Вопрос 2', media_urls: [], correct_answer: '—' },
    { block_number: 3, block_position: 3, content_type: 'image', question_text: 'Вопрос 3', media_urls: [], correct_answer: '—' },
    { block_number: 3, block_position: 4, content_type: 'image', question_text: 'Вопрос 4', media_urls: [], correct_answer: '—' },
  ],
}

export default function Round2({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND2} />
}
