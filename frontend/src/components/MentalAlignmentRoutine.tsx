/**
 * Mental Alignment Routine Component
 * 10-second mental alignment routine modal for focus breaks
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { MentalAlignmentRoutine, FocusBreak, RoutineType } from '../types/focus';
import FocusTrackingService from '../services/focusTrackingService';
import './MentalAlignmentRoutine.css';

interface MentalAlignmentRoutineProps {
  isOpen: boolean;
  breakId: number;
  studentId: string;
  onComplete: (effectivenessRating?: number) => void;
  onSkip: () => void;
  routineType?: RoutineType;
}

export const MentalAlignmentRoutineModal: React.FC<MentalAlignmentRoutineProps> = ({
  isOpen,
  breakId,
  studentId,
  onComplete,
  onSkip,
  routineType
}) => {
  const [routine, setRoutine] = useState<MentalAlignmentRoutine | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [effectivenessRating, setEffectivenessRating] = useState<number | undefined>();
  const [showRating, setShowRating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load routine data
  useEffect(() => {
    const loadRoutine = async () => {
      try {
        setLoading(true);
        setError(null);

        let routineData: MentalAlignmentRoutine;
        if (routineType) {
          routineData = await FocusTrackingService.getRoutineByType(routineType);
        } else {
          routineData = await FocusTrackingService.getRecommendedRoutine(studentId);
        }

        setRoutine(routineData);
        setTimeRemaining(routineData.duration_seconds);
      } catch (err) {
        setError('루틴을 불러오는데 실패했습니다.');
        console.error('Failed to load routine:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadRoutine();
    }
  }, [isOpen, studentId, routineType]);

  // Start routine
  const handleStart = useCallback(async () => {
    try {
      await FocusTrackingService.startRoutine(breakId);
      setIsRunning(true);
    } catch (err) {
      setError('루틴을 시작하는데 실패했습니다.');
      console.error('Failed to start routine:', err);
    }
  }, [breakId]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setShowRating(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeRemaining]);

  // Update current step based on time
  useEffect(() => {
    if (!routine || !isRunning) return;

    const stepDuration = routine.duration_seconds / routine.instructions.length;
    const elapsed = routine.duration_seconds - timeRemaining;
    const newStep = Math.min(
      Math.floor(elapsed / stepDuration),
      routine.instructions.length - 1
    );
    setCurrentStep(newStep);
  }, [routine, timeRemaining, isRunning]);

  // Handle completion with rating
  const handleComplete = useCallback(async () => {
    try {
      await FocusTrackingService.completeRoutine(breakId, effectivenessRating);
      onComplete(effectivenessRating);
    } catch (err) {
      setError('루틴 완료 기록에 실패했습니다.');
      console.error('Failed to complete routine:', err);
    }
  }, [breakId, effectivenessRating, onComplete]);

  // Handle skip
  const handleSkip = useCallback(async () => {
    try {
      await FocusTrackingService.skipRoutine(breakId);
      onSkip();
    } catch (err) {
      console.error('Failed to skip routine:', err);
      onSkip(); // Still close the modal
    }
  }, [breakId, onSkip]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="mar-overlay">
        <div className="mar-modal">
          <div className="mar-loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="mar-overlay">
        <div className="mar-modal">
          <div className="mar-error">{error || '루틴을 불러올 수 없습니다.'}</div>
          <button onClick={handleSkip} className="mar-button mar-button-secondary">
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mar-overlay">
      <div className="mar-modal">
        {/* Header */}
        <div className="mar-header">
          <h2 className="mar-title">{routine.title}</h2>
          <p className="mar-description">{routine.description}</p>
        </div>

        {/* Main Content */}
        {!isRunning && !showRating && (
          <div className="mar-start-screen">
            <div className="mar-icon">🧘</div>
            <p className="mar-instruction">
              {routine.duration_seconds}초간 집중력을 회복하는 시간을 가져보세요.
            </p>
            <div className="mar-button-group">
              <button onClick={handleStart} className="mar-button mar-button-primary">
                시작하기
              </button>
              <button onClick={handleSkip} className="mar-button mar-button-secondary">
                건너뛰기
              </button>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="mar-running-screen">
            {/* Timer Display */}
            <div className="mar-timer">
              <svg className="mar-timer-circle" viewBox="0 0 100 100">
                <circle
                  className="mar-timer-bg"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="8"
                />
                <circle
                  className="mar-timer-progress"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4A90E2"
                  strokeWidth="8"
                  strokeDasharray={`${(timeRemaining / routine.duration_seconds) * 283} 283`}
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="55"
                  textAnchor="middle"
                  className="mar-timer-text"
                  fontSize="24"
                  fill="#333"
                >
                  {timeRemaining}
                </text>
              </svg>
            </div>

            {/* Animation Area */}
            <div className={`mar-animation mar-animation-${routine.routine_type}`}>
              {routine.routine_type === 'breathing' && (
                <div className="breathing-circle" />
              )}
              {routine.routine_type === 'stretching' && (
                <div className="stretching-figure">🤸</div>
              )}
              {routine.routine_type === 'eye_exercise' && (
                <div className="eye-icon">👁️</div>
              )}
            </div>

            {/* Current Instruction */}
            <div className="mar-instruction-container">
              <p className="mar-current-instruction">
                {routine.instructions[currentStep]}
              </p>
              <div className="mar-step-indicator">
                {routine.instructions.map((_, index) => (
                  <span
                    key={index}
                    className={`mar-step-dot ${index === currentStep ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {showRating && (
          <div className="mar-rating-screen">
            <div className="mar-complete-icon">✅</div>
            <h3 className="mar-rating-title">루틴 완료!</h3>
            <p className="mar-rating-question">이 루틴이 도움이 되었나요?</p>

            <div className="mar-rating-stars">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setEffectivenessRating(rating)}
                  className={`mar-star ${effectivenessRating && effectivenessRating >= rating ? 'selected' : ''}`}
                  aria-label={`${rating}점`}
                >
                  ⭐
                </button>
              ))}
            </div>

            <div className="mar-button-group">
              <button onClick={handleComplete} className="mar-button mar-button-primary">
                완료
              </button>
              <button
                onClick={() => {
                  setEffectivenessRating(undefined);
                  handleComplete();
                }}
                className="mar-button mar-button-secondary"
              >
                평가 건너뛰기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentalAlignmentRoutineModal;
