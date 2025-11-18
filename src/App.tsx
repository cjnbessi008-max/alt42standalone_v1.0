/**
 * Main App Component
 * Unit Compass - LMS integrated unit vector learning app
 */

import React, { useState, useEffect } from 'react';
import UnitCompass from './components/UnitCompass';
import ProblemDisplay from './components/ProblemDisplay';
import ProgressTracker from './components/ProgressTracker';
import moodleService from './services/moodleService';
import { Problem, Submission, Progress, UnitVector } from './types';
import './App.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<UnitVector | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);

  // Initialize app and load data
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    setError('');

    // Check Moodle authentication
    const authenticated = moodleService.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (!authenticated) {
      setError('Moodle LMS 연결이 필요합니다. LMS를 통해 접속해주세요.');
      setIsLoading(false);
      return;
    }

    // Load problem and progress
    await Promise.all([loadProblem(), loadProgress()]);

    setIsLoading(false);
  };

  const loadProblem = async () => {
    const response = await moodleService.fetchProblem();

    if (response.success && response.data) {
      setCurrentProblem(response.data);
      setAttemptNumber(1);
    } else {
      setError(response.error || '문제를 불러오는데 실패했습니다.');
      // Use demo problem for testing
      setCurrentProblem(createDemoProblem());
    }
  };

  const loadProgress = async () => {
    const response = await moodleService.getProgress();

    if (response.success && response.data) {
      setProgress(response.data);
    } else {
      // Use demo progress for testing
      setProgress({
        studentId: 'demo',
        problemsSolved: 5,
        totalProblems: 10,
        accuracy: 0.75,
        lastActivity: new Date(),
      });
    }
  };

  const handleVectorChange = (vector: UnitVector) => {
    setCurrentAnswer(vector);
  };

  const handleSubmit = async (submission: Submission) => {
    // Submit to Moodle
    const response = await moodleService.submitAnswer(submission);

    if (response.success && response.data) {
      if (response.data.isCorrect) {
        // Load next problem after short delay
        setTimeout(() => {
          loadProblem();
          loadProgress();
        }, 2000);
      } else {
        // Increment attempt number
        setAttemptNumber(attemptNumber + 1);

        // If max attempts reached, load next problem
        if (currentProblem && attemptNumber >= (currentProblem.maxAttempts || 3)) {
          setTimeout(() => {
            loadProblem();
          }, 3000);
        }
      }
    }
  };

  const handleNextProblem = () => {
    loadProblem();
  };

  // Create demo problem for testing
  const createDemoProblem = (): Problem => {
    return {
      id: 'demo-1',
      title: '단위벡터 방향 찾기',
      description: '나침반을 조작하여 45도 방향의 단위벡터를 가리켜주세요.',
      type: 'direction' as any,
      targetAngle: Math.PI / 4, // 45 degrees
      difficulty: 'easy',
      hints: [
        '45도는 X축과 Y축의 중간 방향입니다.',
        '45도의 단위벡터는 x와 y 성분이 같습니다.',
        '대략 (0.707, 0.707) 방향을 가리켜보세요.',
      ],
      maxAttempts: 3,
    };
  };

  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📐 Unit Compass</h1>
        <p className="subtitle">단위벡터 학습 나침반</p>
      </header>

      {error && !currentProblem && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={initializeApp}>다시 시도</button>
        </div>
      )}

      {error && currentProblem && (
        <div className="demo-banner">
          <p>ℹ️ 데모 모드로 실행 중입니다. Moodle 연동이 필요합니다.</p>
        </div>
      )}

      <main className="app-main">
        <div className="content-container">
          <div className="left-panel">
            {currentProblem && (
              <ProblemDisplay
                problem={currentProblem}
                onSubmit={handleSubmit}
                currentAnswer={currentAnswer || undefined}
                attemptNumber={attemptNumber}
                maxAttempts={currentProblem.maxAttempts || 3}
              />
            )}

            {progress && (
              <div className="progress-section">
                <ProgressTracker progress={progress} />
              </div>
            )}

            <div className="actions">
              <button onClick={handleNextProblem} className="secondary-button">
                다음 문제
              </button>
            </div>
          </div>

          <div className="right-panel">
            <div className="mobile-frame">
              <div className="mobile-screen">
                {currentProblem && (
                  <UnitCompass
                    targetAngle={currentProblem.targetAngle}
                    onVectorChange={handleVectorChange}
                    interactive={true}
                    size={280}
                    showGrid={true}
                    showAngles={true}
                  />
                )}
              </div>
              <div className="mobile-home-button"></div>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>KAIST Touch Math Academy © 2025</p>
        {isAuthenticated && moodleService.getSession() && (
          <p className="session-info">
            <small>세션: {moodleService.getSession()?.userId}</small>
          </p>
        )}
      </footer>
    </div>
  );
};

export default App;
