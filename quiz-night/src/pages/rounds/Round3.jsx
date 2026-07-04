import { useEffect, useRef } from 'react'
import RoundShell from '../../components/RoundShell'
import { advance } from '../../lib/roundFlow'

// ═══ РАУНД 3: ТЕСТ А/Б/В/Г ═══
// 15 вопросов, автопереключение через 5 сек после таймера.
// correct_choice задаётся ЗДЕСЬ в коде — подсчёт "до первой ошибки" делает админка:
//   идём по вопросам по порядку; верный = +1; ПУСТОЙ = пропуск (не ошибка);
//   первый НЕВЕРНЫЙ = стоп, дальше баллы не считаются.
export const ROUND3 = {
  number: 3,
  titleLines: ['ТЕСТ', 'А·Б·В·Г'],
  metaLine: '15 ВОПРОСОВ · 30 СЕК · СТОП ПОСЛЕ ОШИБКИ',
  timerSeconds: 30,
  hasRepeats: false,
  autoAdvanceQuestions: true,   // сам листает
  autoAdvanceDelayMs: 5000,     // через 5 сек после конца таймера
  stopOnWrong: true,
  rules: [
    '15 вопросов с 4 вариантами ответа',
    'Отвечаете кнопками А/Б/В/Г на телефоне',
    'Верный ответ — 1 балл',
    'После первого неверного ответа остальные баллы раунда сгорают',
    'Пропуск (нет ответа) ошибкой не считается',
    'Свои результаты узнаете только в конце раунда',
  ],
  questions: [
    {
      content_type: 'choice',
      question_text: 'Вопрос 1?',
      choices: [
        { key: 'А', text: 'Вариант 1' },
        { key: 'Б', text: 'Вариант 2' },
        { key: 'В', text: 'Вариант 3' },
        { key: 'Г', text: 'Вариант 4' },
      ],
      correct_choice: 'Б',           // ← верный ответ задаёшь тут
      correct_answer: 'Б — Вариант 2',
    },
    // ...добавляй до 15
  ],
}

export default function Round3({ gameState }) {
  const timeoutRef = useRef(null)

  // Автопереключение: RoundShell вызывает advance по концу таймера,
  // но для R3 нужна пауза 5 сек — оборачиваем
  const configWithDelay = {
    ...ROUND3,
    autoAdvanceQuestions: false, // отключаем мгновенный advance из RoundShell
  }

  useEffect(() => {
    if (gameState.status !== 'question') return
    // таймер вопроса + пауза 5 сек, затем сам вперёд
    const total = (ROUND3.timerSeconds + ROUND3.autoAdvanceDelayMs / 1000) * 1000
    timeoutRef.current = setTimeout(() => advance(gameState, ROUND3), total)
    return () => clearTimeout(timeoutRef.current)
  }, [gameState.status, gameState.current_step])

  return <RoundShell gameState={gameState} config={configWithDelay} />
}
