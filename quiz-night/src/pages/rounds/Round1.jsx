import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 1: ФИЛЬМЫ И СЕРИАЛЫ ═══
// Заполняй вопросы здесь. content_type: text | image | multi_image | audio | video
export const ROUND1 = {
  number: 1,
  titleLines: ['ФИЛЬМЫ', 'И СЕРИАЛЫ'],
  metaLine: '10 ВОПРОСОВ · 30 СЕК · 1 БАЛЛ',
  timerSeconds: 30,
  rules_audio: '/media/voices_1.jpg',
  hasRepeats: false,            // ← сам включаешь/выключаешь
  autoAdvanceQuestions: true, // вопросы листает ведущий
  rules: [
    '10 вопросов о фильмах и сериалах',
    'На каждый вопрос 30 секунд',
    'Ответы вносите на телефоне в течение раунда - кнопка "Отправить", проверяете ответы во время повтора',
    'Отправленный ответ можно скорректировать 1 раз',
    'За каждый верный ответ — 1 балл',
  ],
questions: [
    {
      content_type: 'text',
      question_text: 'В этом фильме 2009 года время на разных уровнях повествования течет с разной скоростью. Эту идею авторы подчеркнули не только монтажом, но и музыкой: знаменитая оркестровая тема была построена таким образом, чтобы отражать сильно замедленное звучание композиции, которая неоднократно появляется в самом сюжете. Назовите фильм.',
      media_urls: [],
      voice_audio: '/media/voices/1_1.mp3',
      choices: null,
      correct_answer: 'Начало',
    },
    {
      content_type: 'image',
      question_text: 'Каст к какому фильму конца 2010-х перед вами?',
      media_urls: ['/media/r1.1_1.jpg',
'/media/r1.1_2.jpg',
'/media/r1.1_3.jpg',
'/media/r1.1_4.jpg'],
 voice_audio: '/media/voices/1_2.mp3',
      correct_answer: 'Джентельмены',
    },
    {
      content_type: 'audio',
      question_text: 'В каком российском фильме можно было слышать этот трек?',
      media_urls: ['/media/r1.q3.mp3'],
      correct_answer: 'Майор Гром',
    },
      {
      content_type: 'text',
      question_text: `Угадайте фильм по его шуточному описанию?
Куча мужиков собираются в клуб, чтобы дружно стать фаршем. Отличный фильм и ни одной повесточки – куча белых натуралов превращаются из просто клуба по интересам с опасную банду на пердящих харлеях`,
      answer_media_urls: ['/media/ans_r1_4.jpg'],
       voice_audio: '/media/voices/1_4.mp3',
      choices: null,
      correct_answer: 'Байкеры',
    },
     {
      content_type: 'image',
      question_text: 'Минималистичный постер к какому фильму 1979 года вы видите?',
      media_urls: ['/media/r1.4_1.jpg'],
       voice_audio: '/media/voices/1_5.mp3',
      answer_media_urls:['/media/ans_r1_4_1.jpg'],
      correct_answer: 'Апокалипсис сегодня',
    },
     {
      content_type: 'image',
      question_text: 'В этих изображениях я зашифровал некий сериал - ситком. Ваша цель понять что за сериал?',
      media_urls: ['/media/r1.6_1.jpg',
'/media/r1.6_2.jpg',
'/media/r1.6_3.jpg'],
answer_media_urls:['/media/ans_r1_6_1.jpg'],
 voice_audio: '/media/voices/1_6.mp3',
      correct_answer: 'Сабрина-маленькая ведьма',
    },
    {
      content_type: 'text',
      question_text: 'Название этого фильма никак не связано с внешностью человека. На самом деле оно отсылает к сорту цветка, который зритель видит на протяжении всей картины, хотя большинство воспринимает его лишь как элемент декора. Назовите фильм.',
      media_urls: ['media/ans_r1_7_1.jpg'],
       voice_audio: '/media/voices/1_7.mp3',
      choices: null,
      correct_answer: 'Красота по-американски',
    },    
    {
      content_type: 'video',
      question_text: 'Вы услышите отрывок из одной американской франшизы в немецком дубляже. Что за серия фильмов?',
      media_urls: ['/media/r1.8.mp4'],
      media_hidden: true,
      correct_answer: 'Звездные войны',
    },
    {
      content_type: 'image',
      question_text: 'Какой фильм пропущен?',
      media_urls: ['/media/r1.9_1.jpg',
'/media/r1.9_2.jpg',
'/media/r1.9_3.jpg',
'/media/r1.9_4.jpg'],
answer_media_urls:['/media/ans_r1_9_1.jpg'],
 voice_audio: '/media/voices/1_9.mp3',
      correct_answer: 'Форрест Гамп',
    },
        {
      content_type: 'text',
      question_text: 'Для съемок этого сериала реквизиторы изготовили тысячи абсолютно одинаковых предметов размером всего несколько сантиметров. Каждый из них должен был выглядеть почти незаметным для окружающих, но бесценным для главного героя. Назовите сериал.',
      media_urls: [],
      choices: null,
      answer_media_urls:['/media/ans_r1_10.jpg'],
       voice_audio: '/media/voices/1_10.mp3',
      correct_answer: 'Декстер',
    },  
    // ...добавляй до 10
  ],
}

export default function Round1({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND1} />
}
