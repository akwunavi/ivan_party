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
          setRunning(false)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

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
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 40, lineHeight: 1,
          color: isLow ? '#ef4444' : '#ea580c',
          transition: 'color 0.5s'
        }}>
          {String(remaining).padStart(2, '0')}
        </span>
        <span style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 11, color: '#555', letterSpacing: '0.2em'
        }}>
          // SEC_REMAINING
        </span>
      </div>
    </div>
  )
}
