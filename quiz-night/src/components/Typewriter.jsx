import { useEffect, useState } from 'react'

// Текст «печатается» с мигающим курсором — эффект терминала (киберпанк)
export default function Typewriter({ text, speed = 32, style }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    setShown(0)
    if (!text) return
    const interval = setInterval(() => {
      setShown(prev => {
        if (prev >= text.length) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, speed)
    return () => clearInterval(interval)
  }, [text])
  const done = shown >= (text?.length ?? 0)
  return (
    <span style={style}>
      {text?.slice(0, shown)}
      {!done && <span className="tw-cursor" />}
    </span>
  )
}
