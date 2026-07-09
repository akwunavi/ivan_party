import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 6: РЕБУСЫ ИЗ ДВУХ КАРТИНОК ═══
// Всегда 2 картинки. Слово = 3 последние буквы первой + 3 первые буквы второй.
// Пример: КорабЛИК + ВИНоград = ЛИКВИН (условно).
export const ROUND2 = {
  number: 2,
  titleLines: ['РЕБУСЫ', 'ИЗ КАРТИНОК'],
  metaLine: '10 ВОПРОСОВ · 60 СЕК · 1 БАЛЛ',
  timerSeconds: 60,
  hasRepeats: false,
  autoAdvanceQuestions: true,
  useTts: false,   // тут нечего озвучивать — только картинки
  rules: [
    'На экране всегда две картинки',
    'Составьте слово: 3 последние буквы первого слова + 3 первые буквы второго',
    'На каждый ребус 60 секунд',
    'Верный ответ — 1 балл',
  ],
  questions: [
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r6.1_1.jpg', '/media/r6.1_2.jpg'], word1: 'бланш', word2: 'лагуна', correct_answer: 'Аншлаг' },
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r6/q2-1.jpg', '/media/r6/q2-2.jpg'], correct_answer: '—' },
    // ...добавляй до 10
  ],
}

export default function Round2({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND2} />
}
