import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 7: ТЕМАТИЧЕСКИЙ ═══
// 5 обычных вопросов + 6-й специальный: угадать тему раунда (текстом, что угодно).
// Угадали тему → баллы ЭТОГО раунда ×2 (кнопка в админке вызывает double_round_score).
export const ROUND6 = {
  number: 6,
  titleLines: ['ТЕМАТИЧЕСКИЙ', 'РАУНД'],
  metaLine: '5+1 ВОПРОСОВ · 60 СЕК · ×2 ЗА ТЕМУ',
  timerSeconds: 60,
  hasRepeats: false,
  rules_audio: '/media/voices_6.jpg',
  autoAdvanceQuestions: false,
  rules: [
    '5 вопросов — текст, музыка, картинки. По 1 баллу',
    'На каждый вопрос 60 секунд',
    'Шестой вопрос — угадайте тему раунда',
    'Угадали тему — все баллы этого раунда удваиваются',
  ],
  questions: [
    { content_type: 'text', question_text: 'На этой картинке нейросеть сгенерировала живущего в настоящее время человека, которого называют немного странным прозвищем. Необходимо назвать реальное имя человека', media_urls: ['r6_1_1.jpg'], voice_audio: '/media/voices/6_1.mp3', correct_answer: 'Александр' },
    { content_type: 'text', question_text: 'В отличие от большинства библейских имён, это почти не встречается у современных христиан. Причина не в запрете церкви и не в изменении языка — оно просто стало слишком тяжёлым культурным символом. Назовите это имя.', media_urls: [], voice_audio: '/media/voices/6_2.mp3', correct_answer: 'Иуда' },
    { content_type: 'text', question_text: 'Сегодня этим словом называют представителей определённой профессии. Любопытно, что с точки зрения итальянской грамматики большинство людей, произнося это слово, уже используют множественное число, хотя обычно даже не задумываются об этом. В действительности же первоначально это была фамилия одного-единственного киноперсонажа Феллини. Назовите это слово?',voice_audio: '/media/voices/6_3.mp3', media_urls: [], correct_answer: 'Папарацци' },
    { content_type: 'text', question_text: 'Одна случайность превратила обычную спагетти в один из самых известных романтических символов мирового кинематографа. Назовите мультфильм, благодаря которому это произошло.', answer_media_urls: ['/media/ans_r6_4_1.jpg'],voice_audio: '/media/voices/6_4.mp3', correct_answer: 'Леди и бродяга'},
    { content_type: 'text', question_text: 'Какому персонажу из комиксов принадлежат эти айтемы?', media_urls: ['/media/ans_r6_5_1.jpg', '/media/r6_5_2.jpg'], answer_media_urls: ['/media/r6_5_1.jpg'],voice_audio: '/media/voices/6_5.mp3', correct_answer: 'Харли Квин' },
    {
      content_type: 'text',
      question_text: 'ГЛАВНЫЙ ВОПРОС: какая тема объединяет все вопросы раунда?',
      answer_media_urls: ['/media/ans_r6_6_1.jpg'],
      voice_audio: '/media/voices/6_6.mp3',
      correct_answer: 'Lady Gaga',
      is_final_question: true,
    },
  ],
}

export default function Round6({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND6} />
}
