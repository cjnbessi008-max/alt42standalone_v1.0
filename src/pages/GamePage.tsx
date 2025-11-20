import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { chapter1 } from '../data/chapter1-number-system';
import Scene1ClayTablet from '../components/scenes/Scene1ClayTablet';
import Scene2UnitFractions from '../components/scenes/Scene2UnitFractions';
import SceneTransitionScreen from '../components/SceneTransitionScreen';
import './GamePage.css';

export default function GamePage() {
  const { currentScene } = useGameStore();
  const [showTransition, setShowTransition] = useState(false);

  const scene = chapter1.scenes[currentScene];

  if (!scene) {
    return (
      <div className="game-page">
        <div className="chapter-complete">
          <h1>Chapter 1 Complete!</h1>
          <p>수체계의 여정을 완성했습니다.</p>
        </div>
      </div>
    );
  }

  const renderScene = () => {
    switch (scene.id) {
      case 'scene-1-1':
        return <Scene1ClayTablet scene={scene} onComplete={() => setShowTransition(true)} />;
      case 'scene-1-2':
        return <Scene2UnitFractions scene={scene} onComplete={() => setShowTransition(true)} />;
      default:
        return (
          <div className="scene-placeholder">
            <h2>{scene.title}</h2>
            <p>이 장면은 아직 구현 중입니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="game-page">
      {showTransition ? (
        <SceneTransitionScreen
          scene={scene}
          onComplete={() => {
            setShowTransition(false);
            useGameStore.getState().goToNextScene();
          }}
        />
      ) : (
        renderScene()
      )}
    </div>
  );
}
