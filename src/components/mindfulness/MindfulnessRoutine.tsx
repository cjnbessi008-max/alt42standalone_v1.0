import React, { useState, useEffect } from 'react';
import './MindfulnessRoutine.css';

export interface MindfulnessRoutineProps {
  /** Callback when routine is completed or skipped */
  onComplete: () => void;
  /** Duration of the routine in seconds */
  duration?: number;
  /** Type of mindfulness routine */
  routineType?: 'breathing' | 'stretch' | 'pause';
  /** Allow skipping the routine */
  allowSkip?: boolean;
  /** Show timer countdown */
  showTimer?: boolean;
}

export const MindfulnessRoutine: React.FC<MindfulnessRoutineProps> = ({
  onComplete,
  duration = 30,
  routineType = 'breathing',
  allowSkip = true,
  showTimer = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [isActive, setIsActive] = useState(true);

  // Breathing cycle: 4 seconds inhale, 4 seconds hold, 4 seconds exhale
  const breathingCycle = {
    inhale: 4,
    hold: 4,
    exhale: 4,
  };

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      if (timeRemaining <= 0) {
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeRemaining, onComplete]);

  // Breathing animation cycle
  useEffect(() => {
    if (routineType !== 'breathing' || !isActive) return;

    const totalCycleTime = breathingCycle.inhale + breathingCycle.hold + breathingCycle.exhale;
    let currentTime = 0;

    const breathingTimer = setInterval(() => {
      currentTime = (currentTime + 1) % totalCycleTime;

      if (currentTime < breathingCycle.inhale) {
        setPhase('inhale');
      } else if (currentTime < breathingCycle.inhale + breathingCycle.hold) {
        setPhase('hold');
      } else {
        setPhase('exhale');
      }
    }, 1000);

    return () => clearInterval(breathingTimer);
  }, [routineType, isActive]);

  const handleSkip = () => {
    setIsActive(false);
    onComplete();
  };

  const getRoutineContent = () => {
    switch (routineType) {
      case 'breathing':
        return (
          <div className="mindfulness-breathing">
            <div className={`breathing-circle ${phase}`}>
              <div className="breathing-center" />
            </div>
            <div className="breathing-instruction">
              {phase === 'inhale' && '들이쉬세요'}
              {phase === 'hold' && '잠시 멈추세요'}
              {phase === 'exhale' && '내쉬세요'}
            </div>
          </div>
        );

      case 'stretch':
        return (
          <div className="mindfulness-stretch">
            <div className="stretch-icon">🧘</div>
            <div className="stretch-instruction">
              <p>잠깐 스트레칭하세요</p>
              <ul>
                <li>목을 천천히 좌우로 돌리세요</li>
                <li>어깨를 위아래로 움직이세요</li>
                <li>손목을 가볍게 돌리세요</li>
              </ul>
            </div>
          </div>
        );

      case 'pause':
        return (
          <div className="mindfulness-pause">
            <div className="pause-icon">☕</div>
            <div className="pause-instruction">
              <p>잠깐 쉬어가세요</p>
              <p className="pause-message">
                잘하고 있어요! 다음 문제를 풀기 전에
                <br />
                잠시 눈을 감고 휴식을 취하세요.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mindfulness-overlay">
      <div className="mindfulness-container">
        <div className="mindfulness-header">
          <h2>마인드풀니스 타임</h2>
          {showTimer && (
            <div className="mindfulness-timer">
              {timeRemaining}초
            </div>
          )}
        </div>

        <div className="mindfulness-content">
          {getRoutineContent()}
        </div>

        <div className="mindfulness-footer">
          {allowSkip && (
            <button
              className="skip-button"
              onClick={handleSkip}
              aria-label="마인드풀니스 루틴 건너뛰기"
            >
              건너뛰기
            </button>
          )}
          <p className="mindfulness-hint">
            잠시 휴식을 취하면 집중력이 향상됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default MindfulnessRoutine;
