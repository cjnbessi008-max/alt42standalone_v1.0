import { useState, useEffect, useCallback } from 'react';
import { BreathingGuide } from './BreathingGuide';
import { Timer } from './Timer';
import type { SessionPhase, SessionConfig } from '../types';
import './BrainResetFlash.css';

const DEFAULT_CONFIG: SessionConfig = {
  duration: 90, // 1.5 minutes total
  inhale: 4,    // 4 seconds
  hold: 2,      // 2 seconds
  exhale: 6,    // 6 seconds
};

export function BrainResetFlash() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(DEFAULT_CONFIG.duration);
  const [cycleTime, setCycleTime] = useState(0);

  const startSession = useCallback(() => {
    setIsActive(true);
    setPhase('inhale');
    setTimeRemaining(DEFAULT_CONFIG.duration);
    setTotalTime(DEFAULT_CONFIG.duration);
    setCycleTime(DEFAULT_CONFIG.inhale);
  }, []);

  const endSession = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    setTimeRemaining(0);
    setCycleTime(0);
  }, []);

  const resetSession = useCallback(() => {
    endSession();
  }, [endSession]);

  // Handle breathing cycle phases
  useEffect(() => {
    if (!isActive || phase === 'complete') return;

    const interval = setInterval(() => {
      setCycleTime(prev => {
        const newTime = prev - 0.1;

        if (newTime <= 0) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return DEFAULT_CONFIG.hold;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return DEFAULT_CONFIG.exhale;
          } else if (phase === 'exhale') {
            setPhase('inhale');
            return DEFAULT_CONFIG.inhale;
          }
        }

        return newTime;
      });

      setTimeRemaining(prev => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          setPhase('complete');
          setIsActive(false);
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, phase]);

  return (
    <div className="brain-reset">
      <div className="brain-reset__container">
        <header className="brain-reset__header">
          <h1 className="brain-reset__title">
            Brain Clear
          </h1>
          <p className="brain-reset__subtitle">
            잠깐 멈춰서 집중력을 회복하세요
          </p>
        </header>

        <main className="brain-reset__main">
          {!isActive && phase !== 'complete' ? (
            <div className="brain-reset__welcome">
              <div className="brain-reset__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 0 1 10 10 4 4 0 0 1-5 5 4 4 0 0 1-5-5 4 4 0 0 1-5 5 4 4 0 0 1-5-5 10 10 0 0 1 10-10z"/>
                  <path d="M8.5 8.5v.01M15.5 8.5v.01"/>
                  <path d="M12 15.5a3.5 3.5 0 0 0 3-1.5"/>
                </svg>
              </div>

              <h2 className="brain-reset__welcome-title">
                학습 중 짧은 휴식이 필요한가요?
              </h2>

              <p className="brain-reset__welcome-description">
                90초 동안 호흡에 집중하면서<br />
                뇌를 리프레시하고 집중력을 높여보세요
              </p>

              <div className="brain-reset__features">
                <div className="feature">
                  <span className="feature__icon">🧘</span>
                  <span className="feature__text">호흡 가이드</span>
                </div>
                <div className="feature">
                  <span className="feature__icon">⏱️</span>
                  <span className="feature__text">90초 세션</span>
                </div>
                <div className="feature">
                  <span className="feature__icon">✨</span>
                  <span className="feature__text">집중력 UP</span>
                </div>
              </div>

              <button
                className="button button--primary button--large"
                onClick={startSession}
              >
                시작하기
              </button>
            </div>
          ) : (
            <div className="brain-reset__session">
              <Timer
                totalTime={totalTime}
                currentTime={timeRemaining}
              />

              <BreathingGuide
                phase={phase}
                timeRemaining={cycleTime}
                onComplete={resetSession}
              />

              {phase !== 'complete' && (
                <button
                  className="button button--secondary"
                  onClick={endSession}
                >
                  중지
                </button>
              )}

              {phase === 'complete' && (
                <button
                  className="button button--primary button--large"
                  onClick={resetSession}
                  style={{ marginTop: 'var(--spacing-lg)' }}
                >
                  다시 시작
                </button>
              )}
            </div>
          )}
        </main>

        <footer className="brain-reset__footer">
          <p className="brain-reset__tip">
            💡 팁: 학습 15-20분마다 짧은 휴식을 취하면 학습 효율이 높아집니다
          </p>
        </footer>
      </div>
    </div>
  );
}
