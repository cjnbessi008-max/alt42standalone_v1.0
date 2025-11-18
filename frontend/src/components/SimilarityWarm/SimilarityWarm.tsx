/**
 * Similarity Warm 컴포넌트
 * 닮음 조건이 성립하면 화면이 따뜻하게 밝아지는 효과
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimilarityResult } from '@types/index';
import './SimilarityWarm.css';

interface SimilarityWarmProps {
  result: SimilarityResult | null;
  onAnimationComplete?: () => void;
}

export const SimilarityWarm: React.FC<SimilarityWarmProps> = ({
  result,
  onAnimationComplete,
}) => {
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (result?.isSimilar) {
      setShowEffect(true);
      const timer = setTimeout(() => {
        setShowEffect(false);
        onAnimationComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [result, onAnimationComplete]);

  return (
    <AnimatePresence>
      {showEffect && result?.isSimilar && (
        <motion.div
          className="similarity-warm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* 따뜻한 빛 효과 */}
          <motion.div
            className="warm-light"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 1],
              opacity: [0, 0.8, 0.6],
            }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
          />

          {/* 빛나는 파티클 효과 */}
          <div className="particles-container">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* 축하 메시지 */}
          <motion.div
            className="success-message"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="success-icon">✓</div>
            <h2 className="success-title">닮음 조건 성립!</h2>
            <p className="success-description">{result.message}</p>
            {result.condition && (
              <div className="condition-badge">{result.condition}</div>
            )}
            {result.ratio && (
              <div className="ratio-info">
                닮음비: 1 : {result.ratio.toFixed(2)}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
