// Универсальный рендерер контента вопроса
// Поддерживает: текст, одно фото, несколько фото (автосетка), аудио, видео

import { useEffect, useRef, useState } from 'react'
import Typewriter from './Typewriter'

export default function MediaDisplay({ question, showText = true, typewriter = false, noAV = false, revealMedia = false, autoplayAudio = true }) {
  const { content_type, question_text, media_urls = [] } = question
  const hasImages = (content_type === 'image' || content_type === 'multi_image') && media_urls.length > 0

  // П.9: адаптивный размер — длинный текст автоматически мельче, короткий крупный
  const len = (question_text || '').length
  const bigSize   = hasImages ? 'clamp(18px, 2.2vw, 28px)' : 'clamp(32px, 4.8vw, 60px)'
  const midSize   = hasImages ? 'clamp(16px, 1.9vw, 24px)' : 'clamp(26px, 3.4vw, 44px)'
  const smallSize = hasImages ? 'clamp(14px, 1.6vw, 20px)' : 'clamp(20px, 2.5vw, 34px)'
  const textStyle = {
    fontFamily: 'Russo One, Rajdhani, sans-serif',
    fontSize: len <= 70 ? bigSize : len <= 160 ? midSize : smallSize,
    textAlign: 'center',
    lineHeight: 1.35,
    color: '#fff',
    maxWidth: 1200,
    letterSpacing: '0.01em',
    flexShrink: 0,
    whiteSpace: 'pre-line',   // П.3: \n в тексте = перенос строки (описание фильма и т.п.)
  }

  return (
    <div style={{
      width: '100%', height: hasImages ? '100%' : 'auto', minHeight: 0,
      display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center',
    }}>

      {/* ТЕКСТ ВОПРОСА — при первом показе «печатается» */}
      {showText && question_text && (
        typewriter
          ? <Typewriter text={question_text} style={textStyle} />
          : <div style={textStyle}>{question_text}</div>
      )}

      {/* КАРТИНКИ — сетка занимает всё оставшееся место, никогда не вылезает */}
      {hasImages && (
        <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
          <ImageGrid urls={media_urls} />
        </div>
      )}

      {/* АУДИО: плеера НЕТ — трек стартует сам через 2 сек, на экране пульсирующий значок */}
      {content_type === 'audio' && media_urls[0] && !noAV && (
        <HiddenAudio src={media_urls[0]} enabled={autoplayAudio} />
      )}

      {/* ВИДЕО (п.4): с флагом media_hidden видео скрыто — идёт только звук.
          На экране ответов (revealMedia) показывается полноценно. */}
      {content_type === 'video' && media_urls[0] && !noAV && (
        question.media_hidden && !revealMedia ? (
          <div className="hud-frame" style={{
            background: '#0d0d0d', border: '1px solid #333', borderLeft: '3px solid var(--accent)',
            padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 560,
          }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 12, color: 'var(--accent)', letterSpacing: '0.25em' }}>
              ♪ ЗВУК ИЗ ВИДЕО
            </div>
            {/* Видео полностью скрыто (0 высоты) — играет только звук, кадр не виден */}
            <video src={media_urls[0]} controls autoPlay
              style={{ width: '100%', height: 0, opacity: 0, position: 'absolute' }} />
          </div>
        ) : (
          <video src={media_urls[0]} controls autoPlay
            style={{ width: '100%', maxWidth: 900, maxHeight: '55vh', borderRadius: 4, border: '1px solid #222' }} />
        )
      )}
    </div>
  )
}

// Автосетка картинок: вся сетка занимает фикс. высоту, делится на ряды —
// при любом количестве картинок ВСЕ видны на экране без прокрутки.
function ImageGrid({ urls }) {
  const count = urls.length

  // До 5 картинок — в ОДИН ряд; дальше — сетка
  const cols = count <= 5 ? count
             : count <= 8  ? 4
             : count <= 12 ? 4
             : 5

  const rows = Math.ceil(count / cols)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: count === 1 ? 0 : 8,
      width: '100%',
      height: '100%',   // заполняет выделенное место, не вылезает за экран
    }}>
      {urls.map((url, i) => (
        <div key={i} style={{
          overflow: 'hidden',
          borderRadius: 4,
          border: '1px solid #222',
          position: 'relative',
          background: '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 0, // важно: позволяет ячейке сжиматься внутри grid
        }}>
          <img
            src={url}
            alt={`img-${i + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          {count > 1 && (
            <div style={{
              position: 'absolute', top: 6, left: 6,
              background: 'rgba(0,0,0,0.7)',
              color: '#ea580c',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 12, padding: '2px 8px',
              borderLeft: '2px solid #ea580c'
            }}>
              {i + 1}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


// ═══ Скрытое воспроизведение: без плеера, автостарт через 2 сек ═══
function HiddenAudio({ src, enabled }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!enabled || !src) return
    const t = setTimeout(() => {
      const audio = new Audio(src)
      audioRef.current = audio
      audio.play().then(() => setPlaying(true)).catch(() => {})
      audio.onended = () => setPlaying(false)
    }, 2000)
    return () => {
      clearTimeout(t)
      audioRef.current?.pause()
      setPlaying(false)
    }
  }, [src, enabled])

  if (!enabled) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: 'Share Tech Mono, monospace', fontSize: 16, letterSpacing: '0.25em',
      color: playing ? 'var(--accent)' : '#444',
      animation: playing ? 'scanpulse 1.2s ease-in-out infinite' : 'none',
    }}>
      <span style={{ fontSize: 28 }}>♪</span>
      {playing ? 'ТРЕК ИГРАЕТ' : 'ТРЕК ГОТОВИТСЯ...'}
    </div>
  )
}