// Единый реестр конфигов раундов — используется и проектором, и телефонами.
// Вопросы задаёшь один раз в файле раунда, телефон берёт их отсюда же.
import { ROUND0 } from '../pages/rounds/Round0'
import { ROUND1 } from '../pages/rounds/Round1'
import { ROUND2 } from '../pages/rounds/Round2'
import { ROUND3 } from '../pages/rounds/Round3'
import { ROUND4 } from '../pages/rounds/Round4'
import { ROUND5 } from '../pages/rounds/Round5'
import { ROUND6 } from '../pages/rounds/Round6'
import { ROUND7 } from '../pages/rounds/Round7'

export const ROUND_CONFIGS = {
  0: ROUND0, // разогрев — вне общего зачёта, см. TOTAL_ROUNDS ниже
  1: ROUND1, 2: ROUND2, 3: ROUND3, 4: ROUND4,
  5: ROUND5, 6: ROUND6, 7: ROUND7,
}

// Игра сейчас на 7 раундов (кино-раунд с блоками картинок убран,
// на его месте — бывший Р6 «Ребусы», старые Р7/Р8 сдвинуты на Р6/Р7).
export const TOTAL_ROUNDS = 7

// Раунды, которые пропускаются в игре БЕЗ пересчёта нумерации остальных.
// Пример: []. Чтобы выключить раунд — впиши его номер сюда.
export const DISABLED_ROUNDS = []
