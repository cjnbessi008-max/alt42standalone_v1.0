import { useEffect, useState, useRef } from 'react';
import { BreathingPhase, BreathingPattern } from '../types/breathing';
import '../styles/BreathingAnimation.css';

interface BreathingAnimationProps {
  pattern: BreathingPattern;
  isActive: boolean;
  onCycleComplete?: (cycleCount: number) => void;
  onPhaseChange?: (phase: BreathingPhase) => void;
}

const PHASE_LABELS: Record<BreathingPhase, string> = {
  'inhale': '들이마시기',
  'hold-in': '멈추기',
  'exhale': '내쉬기',
  'hold-out': '멈추기',
};

export const BreathingAnimation: React.FC<BreathingAnimationProps> = ({
  pattern,
  isActive,
  onCycleComplete,
  onPhaseChange,
}) => {
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale');
  const [progress, setProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const phaseStartRef = useRef<number>(Date.now());

  const getCurrentPhaseDuration = (phase: BreathingPhase): number => {
    switch (phase) {
      case 'inhale': return pattern.inhale * 1000;
      case 'hold-in': return pattern.holdIn * 1000;
      case 'exhale': return pattern.exhale * 1000;
      case 'hold-out': return pattern.holdOut * 1000;
    }
  };

  const getNextPhase = (phase: BreathingPhase): BreathingPhase => {
    switch (phase) {
      case 'inhale': return 'hold-in';
      case 'hold-in': return 'exhale';
      case 'exhale': return 'hold-out';
      case 'hold-out': return 'inhale';
    }
  };

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setProgress(0);
      setCurrentPhase('inhale');
      return;
    }

    phaseStartRef.current = Date.now();

    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - phaseStartRef.current;
      const phaseDuration = getCurrentPhaseDuration(currentPhase);

      if (elapsed >= phaseDuration) {
        const nextPhase = getNextPhase(currentPhase);

        // 사이클 완료 체크 (hold-out -> inhale로 전환 시)
        if (currentPhase === 'hold-out' && nextPhase === 'inhale') {
          const newCycleCount = cycleCount + 1;
          setCycleCount(newCycleCount);
          onCycleComplete?.(newCycleCount);
        }

        setCurrentPhase(nextPhase);
        onPhaseChange?.(nextPhase);
        phaseStartRef.current = now;
        setProgress(0);
      } else {
        setProgress((elapsed / phaseDuration) * 100);
      }
    }, 50);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, currentPhase, pattern, cycleCount, onCycleComplete, onPhaseChange]);

  const getCircleScale = (): number => {
    if (currentPhase === 'inhale') {
      return 0.5 + (progress / 100) * 0.5; // 0.5 -> 1.0
    } else if (currentPhase === 'exhale') {
      return 1.0 - (progress / 100) * 0.5; // 1.0 -> 0.5
    } else {
      return currentPhase === 'hold-in' ? 1.0 : 0.5;
    }
  };

  const getCircleColor = (): string => {
    switch (currentPhase) {
      case 'inhale': return '#4A90E2';
      case 'hold-in': return '#50C878';
      case 'exhale': return '#E8A87C';
      case 'hold-out': return '#9B59B6';
    }
  };

  return (
    <div className="breathing-container">
      <div className="breathing-circle-wrapper">
        <svg width="400" height="400" viewBox="0 0 400 400">
          {/* 배경 원 */}
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="2"
            opacity="0.3"
          />

          {/* 진행 원 */}
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke={getCircleColor()}
            strokeWidth="8"
            strokeDasharray={`${(progress / 100) * 942} 942`}
            strokeLinecap="round"
            transform="rotate(-90 200 200)"
            className="progress-circle"
          />

          {/* 중앙 애니메이션 원 */}
          <circle
            cx="200"
            cy="200"
            r={120 * getCircleScale()}
            fill={getCircleColor()}
            opacity="0.3"
            className="breathing-circle"
          />

          <circle
            cx="200"
            cy="200"
            r={80 * getCircleScale()}
            fill={getCircleColor()}
            opacity="0.5"
            className="breathing-circle"
          />

          <circle
            cx="200"
            cy="200"
            r={40 * getCircleScale()}
            fill={getCircleColor()}
            opacity="0.8"
            className="breathing-circle"
          />
        </svg>

        <div className="breathing-text">
          <div className="phase-label">{PHASE_LABELS[currentPhase]}</div>
          <div className="pattern-name">{pattern.name}</div>
          <div className="cycle-count">사이클: {cycleCount}</div>
        </div>
      </div>

      <div className="breathing-info">
        <div className="phase-indicator">
          {(['inhale', 'hold-in', 'exhale', 'hold-out'] as BreathingPhase[]).map((phase) => (
            <div
              key={phase}
              className={`phase-dot ${currentPhase === phase ? 'active' : ''}`}
              style={{
                backgroundColor: currentPhase === phase ? getCircleColor() : '#e0e0e0',
              }}
            >
              <span className="phase-label-small">{PHASE_LABELS[phase]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
