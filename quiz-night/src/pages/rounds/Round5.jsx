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
      content_type: 'multi_image',
      question_text: `Соотнесите страну по флагу и ее столицу?,
      А - Бишкек
      Б - Душанбе
      В - Ташкент
      Г - Ашхабад`, 
  media_urls: ['/media/ans_r5_1_1.jpg', '/media/ans_r5_1_2.jpg', '/media/ans_r5_1_3.jpg', '/media/ans_r5_1_4.jpg'],
  match_pairs: {
    left: ['1', '2', '3', '4'],
    right: ['А', 'Б', 'В', 'Г'],
  },
  correct_pairs: ['1А', '2В', '3Г', '4Б'],
},

    { content_type: 'choice', 
      question_text: 'Какой слой атмосферы находится сразу над тропосферой?', 
      choices: [{ key: 'А', text: 'Экзосфера' }, { key: 'Б', text: 'Термосфера' }, { key: 'В', text: 'Мезосфера' }, { key: 'Г', text: 'Тропосфера' }], 
      correct_choice: 'Г', correct_answer: 'Г - Тропосфера' },

    { content_type: 'choice', question_text: 'Какое государство называют «Страной утренней свежести»?', 
      choices: [{ key: 'А', text: 'Япония' }, { key: 'Б', text: 'Южная Корея' }, { key: 'В', text: 'Китай' }, { key: 'Г', text: 'Вьетнам' }], 
      correct_choice: 'Б', 
      correct_answer: 'Южная Корея' },

    { content_type: 'text', question_text: 'Расположите эти города в порядке удаленности от экватора, начиная от самого ближнего?', 
      order_answer: true,
      choices: [{ key: 'А', text: 'Бангкок ' }, { key: 'Б', text: 'Куала-Лумпур' }, { key: 'В', text: 'Токио ' }, { key: 'Г', text: 'Сингапур' }], 
      correct_order: 'ГБАВ', 
      correct_answer: ['Г - Сингапур', 'Б - Куала-Лумпур', 'А - Бангкок', 'В - Токио']},

    { content_type: 'multi_image', question_text: 'Определите по флагу, какая из этих стран не входит в Евросоюз?', 
      media_urls: ['/media/ans_r5_5_1.jpg', //А
      '/media/ans_r5_5_2.jpg', //Б
      '/media/ans_r5_5_3.jpg', //В
      '/media/ans_r5_5_4.jpg', //Г
      ],
      choices: [{ key: 'А', text: ' ' }, { key: 'Б', text: '' }, { key: 'В', text: '' }, { key: 'Г', text: '' }],
      answer_note: 'А - Лихтенштейн, Б - Андорра, В - Ивори Кост, Г - Сан-Марино',
      correct_choice: 'В', correct_answer: 'В - Ивори Кост' },

    { content_type: 'choice', question_text: 'В какой из этих пар неверное утверждение?', 
      choices: [{ key: 'А', text: 'Монако - самая густонаселенная страна Европы по плотности населения' }, { key: 'Б', text: 'Ангара - одна из двух рек, вытекающие из Байкала' }, { key: 'В', text: 'Еверест - на территории Непала' }, { key: 'Г', text: 'Котловина Мертвого моря - самая низкая точка Азии' }], 
      answer_note: 'Ангара - единственная река, вытекающая из Байкала',
      correct_choice: 'Б', correct_answer: 'Ангара - одна из двух рек, вытекающие из Байкала' },
  ],
}

export default function Round5({ gameState }) {
  return <RoundShell gameState={gameState} config={ROUND5} />
}
