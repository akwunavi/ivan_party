import { useEffect, useState, useRef } from 'react'

export default function Timer({ seconds, onComplete, autoStart = false }) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef(null)

  useEffect(() => {
    setRemaining(seconds)
    setRunning(autoStart)
  }, [seconds, autoStart])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  // onComplete вызывается отдельным эффектом, когда remaining реально дошёл до 0 —
  // не внутри updater-функции setState (это и вызывало React-варнинг).
  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false)
      onComplete?.()
    }
  }, [remaining])

  const pct = (remaining / seconds) * 100
  const isLow = remaining <= 10
  const barColor = isLow ? '#ef4444' : '#ea580c'

  return (
    <div style={{ width: '100%', maxWidth: 600 }}>
      {/* Прогресс-бар */}
      <div style={{
        height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden', marginBottom: 10
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${barColor}, ${isLow ? '#f87171' : '#fb923c'})`,
          borderRadius: 2, transition: 'width 1s linear, background 0.5s'
        }} />
      </div>

      {/* Число */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}>
        <span style={{
          fontFamily: 'Orbitron, Share Tech Mono, monospace',
          fontSize: 42, lineHeight: 1, fontWeight: 700,
          color: isLow ? '#ef4444' : '#ea580c',
          transition: 'color 0.5s',
          textShadow: isLow ? '0 0 18px rgba(239,68,68,0.5)' : '0 0 18px rgba(234,88,12,0.4)',
        }}>
          {String(remaining).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
