import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 8: ФИНАЛЬНЫЕ СТАВКИ ═══
// 10 вопросов обо всём, без повторов. Ставка 0–2, в любой момент до конца приёма.
// Верно со ставкой: ставка + 1. Неверно: минус ставка. Без ставки — просто 1/0.
export const ROUND7 = {
  number: 7,
  titleLines: ['ФИНАЛЬНЫЕ', 'СТАВКИ'],
  metaLine: '10 ВОПРОСОВ · 60 СЕК · СТАВКА ДО 2',
  timerSeconds: 60,
  hasRepeats: false,
  stakesRound: true,
  stakesValues: [0, 1, 2],   // свободный выбор, можно повторять
  autoAdvanceQuestions: false,
  rules: [
    '10 вопросов обо всём, на каждый 60 секунд',
    'Можете поставить ставку в 2 балла на любой вопрос',
    'Верный ответ: ставка + 1 балл. Неверный: минус ставка',
    'Без ставки: просто 1 балл за верный ответ',
  ],
  questions: [
    { content_type: 'text', question_text: 'Вопрос 1?', media_urls: [], correct_answer: '—' },
    { content_type: 'text', question_text: 'Вопрос 2?', media_urls: [], correct_answer: '—' },
    // ...добавляй до 10
  ],
}

export default function Round7({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND7} />
}
