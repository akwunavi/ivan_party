// Нормализация ответа для автопроверки:
// нижний регистр, ё→е, убрать пунктуацию и лишние пробелы.
// "Queen!" === "queen" === " QUEEN " → true
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isMatch(answer, correct) {
  const a = normalize(answer)
  if (!a) return null            // пусто = пропуск, не ошибка
  return a === normalize(correct)
}

// ── Расстояние Левенштейна: сколько правок превращают одну строку в другую ──
export function levenshtein(a, b) {
  if (a === b) return 0
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,                              // удаление
        cur[j - 1] + 1,                           // вставка
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), // замена
      )
    }
    prev = cur
  }
  return prev[n]
}

// Допуск на опечатки зависит от длины правильного ответа:
// до 4 символов — 1 опечатка, до 8 — 2, длиннее — 3.
function tolerance(len) {
  return len <= 4 ? 1 : len <= 8 ? 2 : 3
}

// Фаззи-сравнение: "начало" ≈ "начяло" ≈ "наччало" → верно.
// Правильных вариантов может быть несколько через "/" в correct:
// "Начало / Inception" — совпадение с любым засчитывается.
export function isFuzzyMatch(answer, correct) {
  const a = normalize(answer)
  if (!a) return null            // пусто = не проверяем
  const variants = String(correct ?? '').split('/').map(normalize).filter(Boolean)
  return variants.some(v => levenshtein(a, v) <= tolerance(v.length))
}
