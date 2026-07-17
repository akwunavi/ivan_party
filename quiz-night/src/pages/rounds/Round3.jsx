import RoundShell from '../../components/RoundShell'

// ═══ РАУНД 3: ТЕСТ А/Б/В/Г ═══
// 15 вопросов, автопереключение через 5 сек после таймера.
// correct_choice задаётся ЗДЕСЬ в коде — подсчёт "до первой ошибки" делает админка:
//   идём по вопросам по порядку; верный = +1; ПУСТОЙ = пропуск (не ошибка);
//   первый НЕВЕРНЫЙ = стоп, дальше баллы не считаются.
export const ROUND3 = {
  number: 3,
  titleLines: ['О,', 'СЧАСТЛИВЧИК'],
  metaLine: '15 ВОПРОСОВ · 30 СЕК · СТОП ПОСЛЕ ОШИБКИ',
  timerSeconds: 30,
  hasRepeats: false,
  rules_audio: '/media/voices_3.jpg',
  autoAdvanceQuestions: true,   // сам листает
  autoAdvanceDelayMs: 5000,     // через 5 сек после конца таймера
  stopOnWrong: true,
  rules: [
    '15 вопросов с 4 вариантами ответа',
    'Отвечаете кнопками А/Б/В/Г на телефоне',
    'Верный ответ — 1 балл',
    'После первого неверного ответа остальные баллы раунда не считаются',
    'Пропуск (нет ответа) ошибкой не считается',
    'Свои результаты узнаете только в конце раунда',
    'Исправить ответ - 2 раза, но в любой момент ответ можно стереть',
  ],
  questions: [
    {
      content_type: 'choice',
      question_text: 'Что делают с небылицами?',
      choices: [
        { key: 'А', text: 'Вышивают' },
        { key: 'Б', text: 'Вырезают' },
        { key: 'В', text: 'Выпиливают' },
        { key: 'Г', text: 'Плетут' },
      ],
      correct_choice: 'Г',           // ← верный ответ задаёшь тут
      voice_audio: '/media/voices/3_1.mp3',
      correct_answer: 'Г — Плетут',
    },
    {
      content_type: 'choice',
      question_text: 'Какой химический элемент составляет более половины массы тела человека?',
      choices: [
        { key: 'А', text: 'Углерод' },
        { key: 'Б', text: 'Кальций' },
        { key: 'В', text: 'Кислород' },
        { key: 'Г', text: 'Железо' },
      ],
      voice_audio: '/media/voices/3_2.mp3',
      correct_choice: 'В',           // ← верный ответ задаёшь тут
      correct_answer: 'В — Кислород',
    },
    {
      content_type: 'choice',
      question_text: 'Какую часть тела также называют «атлант»?',
      choices: [
        { key: 'А', text: 'Головной мозг' },
        { key: 'Б', text: 'Шестая пара ребер' },
        { key: 'В', text: 'Шейный позвонок' },
        { key: 'Г', text: 'Часть плеча' },
      ],
      voice_audio: '/media/voices/3_3.mp3',
      correct_choice: 'В',           // ← верный ответ задаёшь тут
      correct_answer: 'В — Шейный позвонок',
    },
            {
      content_type: 'choice',
      question_text: 'Что названо в честь Святой Троицы?',
      choices: [
        { key: 'А', text: 'Остров Тринидад' },
        { key: 'Б', text: 'Архипелаг Тристан-да-Кунья' },
        { key: 'В', text: 'город Триполи' },
        { key: 'Г', text: 'Пещера Труа-Фурер' },
      ],
      voice_audio: '/media/voices/3_4.mp3',
      correct_choice: 'А',           // ← верный ответ задаёшь тут
      correct_answer: 'А — Остров Тринидад',
    },
        {
      content_type: 'choice',
      question_text: 'Как называют исправные, но неиспользуемые суда без экипажей, размещенные в специально отведенной акватории?',
      choices: [
        { key: 'А', text: 'Забавный флот' },
        { key: 'Б', text: 'Шуточный флот' },
        { key: 'В', text: 'Прикольный флот' },
        { key: 'Г', text: 'Весёлый флот' },
      ],
      voice_audio: '/media/voices/3_5.mp3',
      correct_choice: 'В',           // ← верный ответ задаёшь тут
      correct_answer: 'В — Прикольный флот',
    },
    {
      content_type: 'choice',
      question_text: 'Какое насекомое вызвало короткое замыкание в ранней версии вычислительной машины, тем самым породив термин «компьютерный баг»?',
      choices: [
        { key: 'А', text: 'Мотылек' },
        { key: 'Б', text: 'Таракан' },
        { key: 'В', text: 'Муха' },
        { key: 'Г', text: 'Японский хрущик' },
      ],
      voice_audio: '/media/voices/3_6.mp3',
      correct_choice: 'А',           // ← верный ответ задаёшь тут
      correct_answer: 'А — Мотылек',
    },
   {
      content_type: 'choice',
      question_text: 'Под каким названием известна единица с последующими ста нулями?',
      choices: [
        { key: 'А', text: 'Гугол' },
        { key: 'Б', text: 'Мегатрон' },
        { key: 'В', text: 'Гигабит' },
        { key: 'Г', text: 'Наномоль' },
      ],
      voice_audio: '/media/voices/3_7.mp3',
      correct_choice: 'А',           // ← верный ответ задаёшь тут
      correct_answer: 'А — Гугол',
  },
     {
      content_type: 'choice',
      question_text: 'С какой фигуры начинаются соревнования по городошному спорту?',
      choices: [
        { key: 'А', text: 'Часовые' },
        { key: 'Б', text: 'Артиллерия' },
        { key: 'В', text: 'Пулеметное гнездо' },
        { key: 'Г', text: 'Пушка' },
      ],
      voice_audio: '/media/voices/3_8.mp3',
      correct_choice: 'Г',           // ← верный ответ задаёшь тут
      correct_answer: 'Г — Пушка',
  },
       {
      content_type: 'choice',
      question_text: 'Какой химический элемент назван в честь злого подземного гнома?',
      choices: [
        { key: 'А', text: 'Гафний' },
        { key: 'Б', text: 'Кобальт' },
        { key: 'В', text: 'Бериллий' },
        { key: 'Г', text: 'Теллур' },
      ],
      voice_audio: '/media/voices/3_9.mp3',
      correct_choice: 'Б',           // ← верный ответ задаёшь тут
      correct_answer: 'Б — Кобальт',
  },
         {
      content_type: 'choice',
      question_text: 'Сколько звёзд на погонах старшего лейтенанта?',
      choices: [
        { key: 'А', text: 'Одна' },
        { key: 'Б', text: 'Две' },
        { key: 'В', text: 'Три' },
        { key: 'Г', text: 'Четыре' },
      ],
      voice_audio: '/media/voices/3_10.mp3',
      correct_choice: 'В',           // ← верный ответ задаёшь тут
      correct_answer: 'В — Три',
  },
           {
      content_type: 'choice',
      question_text: 'Сколько морей омывают Балканский полуостров?',
      choices: [
        { key: 'А', text: 'Три' },
        { key: 'Б', text: 'Четыре' },
        { key: 'В', text: 'Пять' },
        { key: 'Г', text: 'Шесть' },
      ],
      voice_audio: '/media/voices/3_11.mp3',
      correct_choice: 'Г',           // ← верный ответ задаёшь тут
      correct_answer: 'Г — Шесть',
  },
             {
      content_type: 'choice',
      question_text: 'Кто из этих философов в 1864 году написал музыку на стихи А. С. Пушкина «Заклинание» и «Зимний вечер»?',
      choices: [
        { key: 'А', text: 'Юнг' },
        { key: 'Б', text: 'Гегель' },
        { key: 'В', text: 'Ницше' },
        { key: 'Г', text: 'Шопенгауэр' },
      ],
      voice_audio: '/media/voices/3_12.mp3',
      correct_choice: 'В',           // ← верный ответ задаёшь тут
      correct_answer: 'В — Ницше',
  },
               {
      content_type: 'choice',
      question_text: 'Какой вид кавалерии предназначался для боевых действий как в конном, так и в пешем строю?',
      choices: [
        { key: 'А', text: 'Драгуны' },
        { key: 'Б', text: 'Кирасиры' },
        { key: 'В', text: 'Уланы' },
        { key: 'Г', text: 'Гусары' },
      ],
      voice_audio: '/media/voices/3_13.mp3',
      correct_choice: 'А',           // ← верный ответ задаёшь тут
      correct_answer: 'А — Драгуны',
  },
                 {
      content_type: 'choice',
      question_text: 'В какой из этих столиц бывших союзных республик раньше других появилось метро?',
      choices: [
        { key: 'А', text: 'Тбилиси' },
        { key: 'Б', text: 'Баку' },
        { key: 'В', text: 'Ереван' },
        { key: 'Г', text: 'Минск' },
      ],
      voice_audio: '/media/voices/3_14.mp3',
      correct_choice: 'А',           // ← верный ответ задаёшь тут
      correct_answer: 'А — Тбилиси',
  },
                   {
      content_type: 'choice',
      question_text: 'Какое имя не принимал ни один папа римский?',
      choices: [
        { key: 'А', text: 'Виктор' },
        { key: 'Б', text: 'Валентин' },
        { key: 'В', text: 'Георгий' },
        { key: 'Г', text: 'Евгений' },
      ],
      voice_audio: '/media/voices/3_15.mp3',
      correct_choice: 'В',           // ← верный ответ задаёшь тут
      correct_answer: 'В — Георгий',
  }
],
}
export default function Round3({ gameState }) {
  // Автопролистывание встроено в RoundShell: срабатывает ровно по концу таймера
  // + пауза autoAdvanceDelayMs (5 сек). Никаких параллельных таймеров.
  return <RoundShell gameState={gameState} config={ROUND3} />
}
