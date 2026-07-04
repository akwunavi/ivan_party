import { HashRouter, Routes, Route } from 'react-router-dom'
import './styles/global.css'
import HostScreen from './pages/HostScreen'
import PlayerPage from './pages/PlayerPage'
import AdminPage from './pages/AdminPage'

// HashRouter — работает на GitHub Pages без серверных редиректов
// URL выглядят так: site.github.io/quiz-night/#/player
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"       element={<HostScreen />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/admin"  element={<AdminPage />} />
      </Routes>
    </HashRouter>
  )
}
