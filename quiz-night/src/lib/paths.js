// GitHub Pages раздаёт сайт из подпапки (/ivan_party/), поэтому абсолютные
// пути вида '/media/x.jpg' ломаются. Этот хелпер превращает их в относительные
// на лету — в конфигах раундов можно продолжать писать '/media/...' как раньше.
export function mediaSrc(p) {
  if (!p) return p
  return p.startsWith('/') ? '.' + p : p
}

// Склонение "балл/балла/баллов" по числу (плитки Р4 могут быть 0.5, 1, 1.5, 2)
export function pointsLabel(n) {
  const num = Number(n)
  if (!Number.isInteger(num)) return 'балла'          // 0.5, 1.5
  const mod10 = num % 10, mod100 = num % 100
  if (mod10 === 1 && mod100 !== 11) return 'балл'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'балла'
  return 'баллов'
}
