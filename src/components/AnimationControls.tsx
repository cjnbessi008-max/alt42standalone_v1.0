import React from 'react';
import { useAnimationStore } from '../store/animationStore';
import './AnimationControls.css';

interface AnimationControlsProps {
  onReset?: () => void;
}

/**
 * 애니메이션 컨트롤 패널
 */
export const AnimationControls: React.FC<AnimationControlsProps> = ({ onReset }) => {
  const { isPlaying, isPaused, progress, play, pause, stop, reset } = useAnimationStore();

  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
    onReset?.();
  };

  const handleReset = () => {
    reset();
    onReset?.();
  };

  return (
    <div className="animation-controls">
      <div className="controls-group">
        <button
          className={`control-btn play-pause ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlayPause}
          title={isPlaying && !isPaused ? '일시정지' : '재생'}
        >
          {isPlaying && !isPaused ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          className="control-btn stop"
          onClick={handleStop}
          disabled={!isPlaying && progress === 0}
          title="정지"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>

        <button
          className="control-btn reset"
          onClick={handleReset}
          disabled={progress === 0}
          title="리셋"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>
      </div>

      <div className="progress-info">
        <span className="progress-percentage">{Math.round(progress * 100)}%</span>
        {isPaused && <span className="paused-indicator">일시정지됨</span>}
      </div>
    </div>
  );
};
