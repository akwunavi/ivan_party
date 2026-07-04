import { useGameState } from '../hooks/useGameState'
import Lobby from './Lobby'
import Scoreboard from '../components/Scoreboard'
import Round1 from './rounds/Round1'
import Round2 from './rounds/Round2'
import Round3 from './rounds/Round3'
import Round4 from './rounds/Round4'
import Round5 from './rounds/Round5'
import Round6 from './rounds/Round6'
import Round7 from './rounds/Round7'
import Round8 from './rounds/Round8'

const ROUNDS = { 1: Round1, 2: Round2, 3: Round3, 4: Round4, 5: Round5, 6: Round6, 7: Round7, 8: Round8 }

export default function HostScreen() {
  const { gameState, loading } = useGameState()

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#050505',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Share Tech Mono, monospace', color: '#555', fontSize: 13, letterSpacing: '0.2em'
    }}>
      // ЗАГРУЗКА...
    </div>
  )
  if (!gameState) return null

  if (gameState.status === 'scoreboard') return <Scoreboard roundNumber={gameState.current_round} />
  if (gameState.status === 'lobby' || gameState.current_round === 0) return <Lobby />

  const Round = ROUNDS[gameState.current_round]
  return Round ? <Round gameState={gameState} /> : <Lobby />
}
