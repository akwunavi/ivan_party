import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// StrictMode убран сознательно: в dev-режиме он запускает каждый эффект дважды,
// из-за чего озвучка прерывала саму себя, а музыка и таймер стартовали раньше времени.
// На собранном сайте (Pages) его и так нет — теперь dev ведёт себя как прод.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
