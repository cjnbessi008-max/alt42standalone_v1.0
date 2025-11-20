import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { chapter1Cards } from '../data/chapter1-number-system';
import type { Scene } from '../types';
import './SceneTransitionScreen.css';

interface Props {
  scene: Scene;
  onComplete: () => void;
}

export default function SceneTransitionScreen({ scene, onComplete }: Props) {
  const { playerStats, addCard, updatePlayerStats, completeScene } = useGameStore();
  const [currentStep, setCurrentStep] = useState(0);

  const card = chapter1Cards.find((c) => c.id === scene.cardReward);

  useEffect(() => {
    if (!card) return;

    // 능력치 업데이트
    updatePlayerStats(card.statsGained);

    // 카드 추가
    addCard(card);

    // 씬 완료 표시
    completeScene(scene.id);
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 1000),
      setTimeout(() => setCurrentStep(2), 2500),
      setTimeout(() => setCurrentStep(3), 4000),
      setTimeout(() => onComplete(), 6000),
    ];

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [onComplete]);

  if (!card) return null;

  const transitionNarratives = [
    "그리하여, 그는 또 다른 땅을 향해 발걸음을 옮겼노라.",
    "세상은 아직 더 큰 진실을 감추고 있었다.",
    "그대의 눈은 이미 사물의 본질을 포착하고 있도다.",
  ];

  return (
    <div className="transition-screen">
      {currentStep >= 0 && (
        <motion.div
          className="card-acquisition"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div className="card glow card-appear">
            <div className="card-era">{card.era}</div>
            <h2 className="card-title">{card.title}</h2>
            <div className="card-visual-placeholder">
              {card.mathematician && <p className="mathematician">{card.mathematician}</p>}
            </div>
            <p className="card-description">{card.description}</p>
          </div>
        </motion.div>
      )}

      {currentStep >= 1 && (
        <motion.div
          className="stats-update"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>능력치 획득!</h3>
          <div className="stats-list">
            {Object.entries(card.statsGained).map(([stat, value]) => {
              const statNames: Record<string, string> = {
                creativity: '창의성',
                intuition: '직관',
                persistence: '집착',
                logic: '논리',
                imagination: '상상력',
              };
              return (
                <div key={stat} className="stat-item">
                  <span className="stat-name">{statNames[stat]}</span>
                  <span className="stat-value">+{value}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {currentStep >= 2 && (
        <motion.div
          className="transition-narrative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="narrative-text">
            {transitionNarratives[Math.floor(Math.random() * transitionNarratives.length)]}
          </p>
        </motion.div>
      )}

      {currentStep >= 3 && (
        <motion.div
          className="continue-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>다음 장면으로...</p>
        </motion.div>
      )}
    </div>
  );
}
