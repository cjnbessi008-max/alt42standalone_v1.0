/**
 * Unfolding Net Live - Animation Controls
 * 애니메이션 제어 UI 컴포넌트
 */

import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { AnimationState } from '../../types/geometry';
import './AnimationControls.css';

export const AnimationControls: React.FC = () => {
  const {
    animationState,
    animationProgress,
    animationConfig,
    play,
    pause,
    stop,
    toggleAnimation,
    updateAnimationConfig,
  } = useGeometryStore();

  const isPlaying = animationState === AnimationState.UNFOLDING;
  const isPaused = animationState === AnimationState.PAUSED;

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(e.target.value);
    updateAnimationConfig({ speed });
  };

  return (
    <div className="animation-controls">
      <div className="controls-header">
        <h4>애니메이션 제어</h4>
      </div>

      <div className="controls-buttons">
        {/* 재생/일시정지 토글 */}
        <button
          className={`control-btn ${isPlaying ? 'active' : ''}`}
          onClick={toggleAnimation}
          title={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? (
            <PauseIcon />
          ) : (
            <PlayIcon />
          )}
        </button>

        {/* 정지 */}
        <button
          className="control-btn"
          onClick={stop}
          disabled={animationProgress === 0}
          title="정지"
        >
          <StopIcon />
        </button>

        {/* 처음부터 재생 */}
        <button
          className="control-btn"
          onClick={() => {
            stop();
            setTimeout(play, 100);
          }}
          title="처음부터"
        >
          <RestartIcon />
        </button>
      </div>

      {/* 속도 조절 */}
      <div className="speed-control">
        <label htmlFor="speed-slider">
          속도: {animationConfig.speed.toFixed(1)}x
        </label>
        <input
          id="speed-slider"
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={animationConfig.speed}
          onChange={handleSpeedChange}
          className="speed-slider"
        />
        <div className="speed-labels">
          <span>느림</span>
          <span>빠름</span>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="status-display">
        <div className="status-item">
          <span className="status-label">상태:</span>
          <span className={`status-value state-${animationState}`}>
            {getStateLabel(animationState)}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">진행률:</span>
          <span className="status-value">
            {Math.round(animationProgress * 100)}%
          </span>
        </div>
      </div>

      {/* 옵션 */}
      <div className="controls-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={animationConfig.pauseOnComplete}
            onChange={(e) =>
              updateAnimationConfig({ pauseOnComplete: e.target.checked })
            }
          />
          <span>완료 시 자동 정지</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={animationConfig.autoReverse}
            onChange={(e) =>
              updateAnimationConfig({ autoReverse: e.target.checked })
            }
          />
          <span>자동 되감기</span>
        </label>
      </div>
    </div>
  );
};

// Helper function
const getStateLabel = (state: AnimationState): string => {
  switch (state) {
    case AnimationState.IDLE:
      return '대기';
    case AnimationState.UNFOLDING:
      return '재생 중';
    case AnimationState.PAUSED:
      return '일시정지';
    case AnimationState.FOLDING:
      return '접기';
    default:
      return '알 수 없음';
  }
};

// SVG Icons
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

const StopIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h12v12H6z" />
  </svg>
);

const RestartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
  </svg>
);
