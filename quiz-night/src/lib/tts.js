// Web Speech API — озвучка текста вопроса
// Возвращает Promise, резолвится когда озвучка завершена

export function speak(text, { rate = 0.95, pitch = 1, lang = 'ru-RU', maxWaitMs = 20000 } = {}) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported')
      resolve()
      return
    }

    // Страховка: если озвучка зависла/не стартовала (политика браузера),
    // не блокируем игру — резолвим принудительно
    const safety = setTimeout(() => {
      window.speechSynthesis.cancel()
      resolve()
    }, maxWaitMs)

    // Остановить текущую озвучку
    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = pitch

    const voices = window.speechSynthesis.getVoices()
    const ruVoice = voices.find(v => v.lang.startsWith('ru'))
    if (ruVoice) utter.voice = ruVoice

    utter.onend = () => { clearTimeout(safety); resolve() }
    utter.onerror = (e) => {
      console.warn('TTS error:', e)
      clearTimeout(safety)
      resolve()
    }

    window.speechSynthesis.speak(utter)
  })
}

export function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

// Голоса грузятся асинхронно — вызови один раз при старте
export function loadVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) { resolve(voices); return }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices())
    }
  })
}
