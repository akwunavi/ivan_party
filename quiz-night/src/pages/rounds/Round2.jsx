import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 6: РЕБУСЫ ИЗ ДВУХ КАРТИНОК ═══
// Всегда 2 картинки. Слово = 3 последние буквы первой + 3 первые буквы второй.
// Пример: КорабЛИК + ВИНоград = ЛИКВИН (условно).
export const ROUND2 = {
  number: 2,
  titleLines: ['ШЕСТЬ', 'БУКВ'],
  metaLine: '10 ВОПРОСОВ · 60 СЕК · 1 БАЛЛ',
  timerSeconds: 60,
  hasRepeats: false,
  rules_audio: '/media/voices_2.jpg',
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
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_2_1.jpg', '/media/r2_2_2.jpg'], word1: 'Динозавр', word2: 'Оракул', correct_answer: 'Аврора' },
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_3_1.jpg', '/media/r2_3_2.jpg'], word1: 'Байкал', word2: 'Пакля', correct_answer: 'Калпак' },
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_4_1.jpg', '/media/r2_4_2.jpg'], word1: 'Ток', word2: 'Сикль', correct_answer: 'Токсик' },
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_5_1.jpg', '/media/r2_5_2.jpg'], word1: 'Сад', word2: 'Иствуд', correct_answer: 'Садист' },
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_6_1.jpg', '/media/r2_6_2.jpg'], word1: 'Молоко', word2: 'Рокуэлл', correct_answer: 'Окорок'},
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_7_1.jpg', '/media/r2_7_2.jpg'], word1: 'Щербаков', word2: 'Бойлер', correct_answer: 'Ковбой'},
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_8_1.jpg', '/media/r2_8_2.jpg'], word1: 'Атлас', word2: 'Тик', correct_answer: 'Ластик'},
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_9_1.jpg', '/media/r2_9_2.jpg'], word1: 'Плед', word2: 'Никель', correct_answer: 'Ледник'},
    { content_type: 'multi_image', question_text: '', media_urls: ['/media/r2_10_1.jpg', '/media/r2_10_2.jpg'], word1: 'Кадет', word2: 'Алиса', correct_answer: 'Детали'},
    // ...добавляй до 10
  ],
}

export default function Round2({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND2} />
}
