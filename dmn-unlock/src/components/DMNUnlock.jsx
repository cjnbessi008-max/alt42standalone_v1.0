import React, { useState, useEffect, useRef } from 'react';
import './DMNUnlock.css';

const DMNUnlock = () => {
  const [status, setStatus] = useState('ready'); // ready, active, completed
  const [elapsed, setElapsed] = useState(0);
  const [breathPhase, setBreathPhase] = useState('inhale'); // inhale, hold, exhale
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  const TOTAL_DURATION = 10000; // 10 seconds
  const INHALE_DURATION = 4000; // 4 seconds
  const HOLD_DURATION = 2000; // 2 seconds
  const EXHALE_DURATION = 4000; // 4 seconds

  // Calculate breath phase and circle scale
  const getBreathState = (currentElapsed) => {
    if (currentElapsed < INHALE_DURATION) {
      return {
        phase: 'inhale',
        progress: currentElapsed / INHALE_DURATION,
        scale: 0.5 + (currentElapsed / INHALE_DURATION) * 0.5, // 0.5 to 1.0
      };
    } else if (currentElapsed < INHALE_DURATION + HOLD_DURATION) {
      return {
        phase: 'hold',
        progress: 1,
        scale: 1.0,
      };
    } else {
      const exhaleProgress = (currentElapsed - INHALE_DURATION - HOLD_DURATION) / EXHALE_DURATION;
      return {
        phase: 'exhale',
        progress: 1 - exhaleProgress,
        scale: 1.0 - exhaleProgress * 0.5, // 1.0 to 0.5
      };
    }
  };

  // Animation loop
  useEffect(() => {
    if (status !== 'active') return;

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const currentElapsed = timestamp - startTimeRef.current;

      if (currentElapsed >= TOTAL_DURATION) {
        setElapsed(TOTAL_DURATION);
        setStatus('completed');

        // Send completion message to parent LMS
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'DMN_UNLOCK_COMPLETE',
            duration: TOTAL_DURATION,
            timestamp: new Date().toISOString(),
          }, '*');
        }

        return;
      }

      const breathState = getBreathState(currentElapsed);
      setElapsed(currentElapsed);
      setBreathPhase(breathState.phase);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status]);

  const startExercise = () => {
    setStatus('active');
    setElapsed(0);
    startTimeRef.current = null;
  };

  const resetExercise = () => {
    setStatus('ready');
    setElapsed(0);
    setBreathPhase('inhale');
    startTimeRef.current = null;
  };

  const breathState = getBreathState(elapsed);
  const progressPercent = (elapsed / TOTAL_DURATION) * 100;

  // Get instruction text based on phase
  const getInstructionText = () => {
    switch (breathPhase) {
      case 'inhale':
        return '천천히 숨을 들이쉬세요';
      case 'hold':
        return '숨을 잠시 참으세요';
      case 'exhale':
        return '천천히 숨을 내쉬세요';
      default:
        return '';
    }
  };

  return (
    <div className={`dmn-unlock-container ${status}`}>
      {/* Background gradient */}
      <div className="background-gradient"></div>

      {/* Main content */}
      <div className="content">
        {status === 'ready' && (
          <div className="ready-screen">
            <h1 className="title">집중력 향상 준비</h1>
            <p className="description">
              10초간 호흡 운동을 통해<br />
              집중력을 높이고 학습을 시작하세요
            </p>
            <button className="start-button" onClick={startExercise}>
              시작하기
            </button>
          </div>
        )}

        {status === 'active' && (
          <div className="active-screen">
            {/* Breathing circle */}
            <div className="breathing-circle-container">
              <div
                className={`breathing-circle ${breathPhase}`}
                style={{
                  transform: `scale(${breathState.scale})`,
                }}
              >
                <div className="circle-inner"></div>
              </div>
            </div>

            {/* Instruction text */}
            <div className="instruction-text">
              {getInstructionText()}
            </div>

            {/* Progress bar */}
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="time-remaining">
                {Math.ceil((TOTAL_DURATION - elapsed) / 1000)}초
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="completed-screen">
            <div className="checkmark-container">
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2 className="completion-title">완료!</h2>
            <p className="completion-message">
              집중력이 향상되었습니다.<br />
              이제 학습을 시작하세요.
            </p>
            <button className="reset-button" onClick={resetExercise}>
              다시 하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DMNUnlock;
