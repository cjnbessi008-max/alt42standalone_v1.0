import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ProblemData, ShapeConfig } from '../types';
import { useAnimationStore } from '../store/animationStore';
import './OverlapSync.css';

interface OverlapSyncProps {
  problem: ProblemData;
  autoPlay?: boolean;
  onComplete?: () => void;
}

/**
 * Overlap Sync 애니메이션 컴포넌트
 * 두 개 이상의 도형이 서서히 겹쳐지는 애니메이션
 */
export const OverlapSync: React.FC<OverlapSyncProps> = ({
  problem,
  autoPlay = false,
  onComplete,
}) => {
  const { isPlaying, progress, setProgress, setCurrentOverlap, play, stop } =
    useAnimationStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoPlay) {
      play();
    }
  }, [autoPlay, play]);

  useEffect(() => {
    if (isPlaying && !isAnimating) {
      startAnimation();
    }
  }, [isPlaying]);

  const startAnimation = async () => {
    setIsAnimating(true);
    const startTime = Date.now();
    const duration = problem.duration;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(elapsed / duration, 1);

      setProgress(currentProgress);

      // 겹침 비율 계산 (간단한 선형 보간)
      const overlap = currentProgress * problem.targetOverlap;
      setCurrentOverlap(overlap);

      if (currentProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        stop();
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  };

  const renderShape = (shape: ShapeConfig, index: number) => {
    const { type, color, size, startPosition, endPosition, opacity = 0.7, label } = shape;

    // 현재 진행률에 따른 위치 계산
    const currentX = startPosition.x + (endPosition.x - startPosition.x) * progress;
    const currentY = startPosition.y + (endPosition.y - startPosition.y) * progress;

    return (
      <motion.div
        key={shape.id}
        className={`shape shape-${type}`}
        style={{
          position: 'absolute',
          left: `${currentX}%`,
          top: `${currentY}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          opacity,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        {label && <div className="shape-label">{label}</div>}
      </motion.div>
    );
  };

  return (
    <div className="overlap-sync-container" ref={containerRef}>
      {/* 제목 및 설명 */}
      <div className="overlap-header">
        <h3 className="overlap-title">{problem.title}</h3>
        {problem.instruction && (
          <p className="overlap-instruction">{problem.instruction}</p>
        )}
        <div className="difficulty-badge difficulty-{problem.difficulty}">
          {problem.difficulty === 'easy' && '🟢 쉬움'}
          {problem.difficulty === 'medium' && '🟡 보통'}
          {problem.difficulty === 'hard' && '🔴 어려움'}
        </div>
      </div>

      {/* 애니메이션 캔버스 */}
      <div className="overlap-canvas">
        {problem.shapes.map((shape, index) => renderShape(shape, index))}

        {/* 진행률 표시 */}
        {isAnimating && (
          <div className="overlap-progress-indicator">
            <div className="progress-text">{Math.round(progress * 100)}%</div>
          </div>
        )}
      </div>

      {/* 진행바 */}
      <div className="overlap-progress-bar">
        <div
          className="overlap-progress-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* 통계 정보 */}
      <div className="overlap-stats">
        <div className="stat-item">
          <span className="stat-label">진행률</span>
          <span className="stat-value">{Math.round(progress * 100)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">목표 겹침</span>
          <span className="stat-value">{Math.round(problem.targetOverlap * 100)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">소요 시간</span>
          <span className="stat-value">{(problem.duration / 1000).toFixed(1)}초</span>
        </div>
      </div>
    </div>
  );
};
