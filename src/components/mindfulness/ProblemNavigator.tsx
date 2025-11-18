import React, { useState, useCallback } from 'react';
import { MindfulnessRoutine } from './MindfulnessRoutine';

export interface Problem {
  id: string;
  type: string;
  content: any;
  difficulty?: number;
}

export interface MindfulnessSettings {
  /** Enable mindfulness routine between problems */
  enabled: boolean;
  /** Type of routine to show */
  routineType?: 'breathing' | 'stretch' | 'pause';
  /** Duration in seconds */
  duration?: number;
  /** Allow users to skip the routine */
  allowSkip?: boolean;
  /** Show routine every N problems (default: 1, meaning every problem) */
  frequency?: number;
  /** Show timer countdown */
  showTimer?: boolean;
}

export interface ProblemNavigatorProps {
  /** List of problems to navigate through */
  problems: Problem[];
  /** Current problem index */
  currentIndex: number;
  /** Callback when navigating to next problem */
  onNext: (nextIndex: number) => void;
  /** Callback when navigating to previous problem */
  onPrevious?: (prevIndex: number) => void;
  /** Mindfulness settings */
  mindfulnessSettings?: MindfulnessSettings;
  /** Render function for problem content */
  renderProblem: (problem: Problem, index: number) => React.ReactNode;
  /** Callback when all problems are completed */
  onComplete?: () => void;
}

const defaultMindfulnessSettings: MindfulnessSettings = {
  enabled: true,
  routineType: 'breathing',
  duration: 30,
  allowSkip: true,
  frequency: 1,
  showTimer: true,
};

export const ProblemNavigator: React.FC<ProblemNavigatorProps> = ({
  problems,
  currentIndex,
  onNext,
  onPrevious,
  mindfulnessSettings = defaultMindfulnessSettings,
  renderProblem,
  onComplete,
}) => {
  const [showMindfulness, setShowMindfulness] = useState(false);
  const [problemsSolved, setProblemsSolved] = useState(0);

  const settings = { ...defaultMindfulnessSettings, ...mindfulnessSettings };

  const shouldShowMindfulness = useCallback(() => {
    if (!settings.enabled) return false;
    if (currentIndex >= problems.length - 1) return false; // Don't show after last problem

    // Show based on frequency (e.g., every 3 problems)
    return (problemsSolved + 1) % (settings.frequency || 1) === 0;
  }, [settings.enabled, settings.frequency, currentIndex, problems.length, problemsSolved]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= problems.length) {
      // All problems completed
      onComplete?.();
      return;
    }

    setProblemsSolved(prev => prev + 1);

    if (shouldShowMindfulness()) {
      setShowMindfulness(true);
    } else {
      onNext(nextIndex);
    }
  }, [currentIndex, problems.length, onNext, onComplete, shouldShowMindfulness]);

  const handleMindfulnessComplete = useCallback(() => {
    setShowMindfulness(false);
    onNext(currentIndex + 1);
  }, [currentIndex, onNext]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0 && onPrevious) {
      onPrevious(currentIndex - 1);
    }
  }, [currentIndex, onPrevious]);

  const currentProblem = problems[currentIndex];

  if (!currentProblem) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>문제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="problem-navigator">
        {renderProblem(currentProblem, currentIndex)}

        <div className="problem-navigation-controls">
          {onPrevious && currentIndex > 0 && (
            <button
              className="nav-button prev-button"
              onClick={handlePrevious}
              aria-label="이전 문제"
            >
              ← 이전
            </button>
          )}

          <div className="problem-progress">
            문제 {currentIndex + 1} / {problems.length}
          </div>

          {currentIndex < problems.length - 1 ? (
            <button
              className="nav-button next-button"
              onClick={handleNext}
              aria-label="다음 문제"
            >
              다음 →
            </button>
          ) : (
            <button
              className="nav-button complete-button"
              onClick={() => onComplete?.()}
              aria-label="완료"
            >
              완료 ✓
            </button>
          )}
        </div>
      </div>

      {showMindfulness && (
        <MindfulnessRoutine
          onComplete={handleMindfulnessComplete}
          duration={settings.duration}
          routineType={settings.routineType}
          allowSkip={settings.allowSkip}
          showTimer={settings.showTimer}
        />
      )}
    </>
  );
};

export default ProblemNavigator;
