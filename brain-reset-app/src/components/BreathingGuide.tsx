import { useEffect, useState } from 'react';
import type { SessionPhase } from '../types';
import './BreathingGuide.css';

interface BreathingGuideProps {
  phase: SessionPhase;
  timeRemaining: number;
  onComplete?: () => void;
}

const PHASE_COLORS = {
  idle: '#94a3b8',
  inhale: '#6366f1',
  hold: '#8b5cf6',
  exhale: '#10b981',
  complete: '#22c55e'
};

const PHASE_LABELS = {
  idle: '준비',
  inhale: '숨을 들이마시세요',
  hold: '잠시 멈춰요',
  exhale: '숨을 내쉬세요',
  complete: '완료!'
};

export function BreathingGuide({ phase, timeRemaining, onComplete }: BreathingGuideProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Animate the breathing circle based on phase
    if (phase === 'inhale') {
      setScale(1.5);
    } else if (phase === 'exhale') {
      setScale(1);
    } else if (phase === 'hold') {
      // Keep current scale
    } else {
      setScale(1);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'complete' && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const color = PHASE_COLORS[phase];
  const label = PHASE_LABELS[phase];

  return (
    <div className="breathing-guide">
      <div className="breathing-guide__container">
        <svg
          className="breathing-guide__circle"
          viewBox="0 0 200 200"
          style={{
            transform: `scale(${scale})`,
            transition: phase === 'inhale' ? 'transform 4s ease-in-out' :
                       phase === 'exhale' ? 'transform 6s ease-in-out' :
                       'transform 0.5s ease'
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="80"
            fill={color}
            opacity="0.3"
          />
          <circle
            cx="100"
            cy="100"
            r="60"
            fill={color}
            opacity="0.6"
          />
          <circle
            cx="100"
            cy="100"
            r="40"
            fill={color}
            opacity="0.9"
          />
        </svg>

        <div className="breathing-guide__overlay">
          <div className="breathing-guide__label">
            {label}
          </div>
          {phase !== 'idle' && phase !== 'complete' && (
            <div className="breathing-guide__timer">
              {Math.ceil(timeRemaining)}
            </div>
          )}
        </div>
      </div>

      {phase === 'complete' && (
        <div className="breathing-guide__completion">
          <svg className="checkmark" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <p className="breathing-guide__completion-text">
            좋아요! 집중력이 회복되었습니다
          </p>
        </div>
      )}
    </div>
  );
}
