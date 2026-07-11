// GitHub Pages раздаёт сайт из подпапки (/ivan_party/), поэтому абсолютные
// пути вида '/media/x.jpg' ломаются. Этот хелпер превращает их в относительные
// на лету — в конфигах раундов можно продолжать писать '/media/...' как раньше.
export function mediaSrc(p) {
  if (!p) return p
  return p.startsWith('/') ? '.' + p : p
}
