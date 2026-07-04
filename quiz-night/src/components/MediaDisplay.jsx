// Универсальный рендерер контента вопроса
// Поддерживает: текст, одно фото, несколько фото (автосетка), аудио, видео

export default function MediaDisplay({ question, showText = true }) {
  const { content_type, question_text, media_urls = [] } = question

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>

      {/* ТЕКСТ ВОПРОСА */}
      {showText && question_text && (
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 'clamp(22px, 3.5vw, 42px)',
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.25,
          color: '#fff',
          maxWidth: 900,
          letterSpacing: '0.01em'
        }}>
          {question_text}
        </div>
      )}

      {/* КАРТИНКИ — автосетка */}
      {(content_type === 'image' || content_type === 'multi_image') && media_urls.length > 0 && (
        <ImageGrid urls={media_urls} />
      )}

      {/* АУДИО */}
      {content_type === 'audio' && media_urls[0] && (
        <audio
          src={media_urls[0]}
          controls
          autoPlay
          style={{ width: '100%', maxWidth: 500, accentColor: '#ea580c' }}
        />
      )}

      {/* ВИДЕО */}
      {content_type === 'video' && media_urls[0] && (
        <video
          src={media_urls[0]}
          controls
          autoPlay
          style={{
            width: '100%', maxWidth: 900,
            borderRadius: 4, border: '1px solid #222'
          }}
        />
      )}
    </div>
  )
}

// Автосетка картинок
function ImageGrid({ urls }) {
  const count = urls.length

  // Определяем колонки в зависимости от кол-ва картинок
  const cols = count === 1 ? 1
             : count === 2 ? 2
             : count <= 4  ? 2
             : count <= 6  ? 3
             : count <= 9  ? 3
             : count <= 12 ? 4
             : 5

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: count === 1 ? 0 : 8,
      width: '100%',
      maxHeight: count === 1 ? '70vh' : '65vh',
    }}>
      {urls.map((url, i) => (
        <div key={i} style={{
          overflow: 'hidden',
          borderRadius: 4,
          border: '1px solid #222',
          position: 'relative',
          aspectRatio: count === 1 ? 'auto' : '1 / 1'
        }}>
          <img
            src={url}
            alt={`img-${i + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: count === 1 ? 'contain' : 'cover',
              display: 'block'
            }}
          />
          {/* Номер картинки если их больше 1 */}
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
