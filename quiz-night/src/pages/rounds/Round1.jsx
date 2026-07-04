import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 1: КИНО И МУЗЫКА ═══
// Заполняй вопросы здесь. content_type: text | image | multi_image | audio | video
export const ROUND1 = {
  number: 1,
  titleLines: ['КИНО', 'И МУЗЫКА'],
  metaLine: '10 ВОПРОСОВ · 30 СЕК · 1 БАЛЛ',
  timerSeconds: 30,
  hasRepeats: true,            // ← сам включаешь/выключаешь
  autoAdvanceQuestions: false, // вопросы листает ведущий
  rules: [
    '10 вопросов — текст, картинки, аудио, видео',
    'На каждый вопрос 30 секунд',
    'Ответы вносите на телефоне в течение раунда, финально отправляете после повтора',
    'За каждый верный ответ — 1 балл',
  ],
  questions: [
    {
      content_type: 'text',
      question_text: 'Назовите фильм 2010 года, в котором Леонардо ДиКаприо путешествует по снам',
      media_urls: [],
      choices: null,
      correct_answer: 'Начало (Inception)',
    },
    {
      content_type: 'image',
      question_text: 'Из какого фильма этот кадр?',
      media_urls: ['/media/r1/q2.jpg'],
      correct_answer: '—',
    },
    {
      content_type: 'audio',
      question_text: 'Назовите исполнителя и песню',
      media_urls: ['/media/r1/q3.mp3'],
      correct_answer: '—',
    },
    // ...добавляй до 10
  ],
}

export default function Round1({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND1} />
}
