// Единый реестр конфигов раундов — используется и проектором, и телефонами.
// Вопросы задаёшь один раз в файле раунда, телефон берёт их отсюда же.
import { ROUND1 } from '../pages/rounds/Round1'
import { ROUND2 } from '../pages/rounds/Round2'
import { ROUND3 } from '../pages/rounds/Round3'
import { ROUND4 } from '../pages/rounds/Round4'
import { ROUND5 } from '../pages/rounds/Round5'
import { ROUND6 } from '../pages/rounds/Round6'
import { ROUND7 } from '../pages/rounds/Round7'
import { ROUND8 } from '../pages/rounds/Round8'

export const ROUND_CONFIGS = {
  1: ROUND1, 2: ROUND2, 3: ROUND3, 4: ROUND4,
  5: ROUND5, 6: ROUND6, 7: ROUND7, 8: ROUND8,
}
