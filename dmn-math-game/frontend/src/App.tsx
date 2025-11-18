import { useEffect, useState } from 'react';
import { useGameStore } from './services/store';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';

type GameState = 'start' | 'playing' | 'result';

function App() {
  const { session, reset } = useGameStore();
  const [gameState, setGameState] = useState<GameState>('start');
  const [problemCount, setProblemCount] = useState(0);

  // Monitor session to determine game state
  useEffect(() => {
    if (!session) {
      setGameState('start');
      setProblemCount(0);
    } else if (session.is_completed) {
      setGameState('result');
    } else if (session.total_problems > 0) {
      setGameState('playing');
      setProblemCount(session.total_problems);

      // Auto-end session after 10 problems (for DMN recovery, keep it short)
      if (session.total_problems >= 10) {
        setGameState('result');
      }
    }
  }, [session]);

  const handlePlayAgain = () => {
    reset();
    setGameState('start');
  };

  return (
    <div className="App">
      {gameState === 'start' && <StartScreen />}
      {gameState === 'playing' && <GameScreen />}
      {gameState === 'result' && <ResultScreen onPlayAgain={handlePlayAgain} />}

      {/* Debug Info (remove in production) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg">
          <div>State: {gameState}</div>
          <div>Problems: {problemCount}/10</div>
          {session && <div>Session: {session.id.substring(0, 8)}...</div>}
        </div>
      )}
    </div>
  );
}

export default App;
