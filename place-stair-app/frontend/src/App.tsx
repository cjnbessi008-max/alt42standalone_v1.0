import React, { useState, useEffect } from 'react';
import SmartphoneFrame from './components/SmartphoneFrame';
import ProblemDisplay from './components/ProblemDisplay';
import FeedbackModal from './components/FeedbackModal';
import { problemApi } from './services/api';
import { PlaceStairProblem, PlaceValues, ValidationResult } from './types';
import './App.css';

const App: React.FC = () => {
  const [problems, setProblems] = useState<PlaceStairProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  // Load problems on mount
  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);

      // Try to load from Moodle first (if configured)
      // For demo, we'll generate problems locally
      const generatedProblems = await problemApi.generateProblems({
        minValue: 10,
        maxValue: 999,
        difficulty: 1,
        count: 10
      });

      setProblems(generatedProblems);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load problems:', error);
      setLoading(false);
    }
  };

  const currentProblem = problems[currentIndex];

  const handleSubmit = async (answer: PlaceValues) => {
    if (!currentProblem) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const result = await problemApi.validateAnswer(currentProblem, answer);
      setValidationResult(result);
      setShowFeedback(true);

      if (result.isCorrect) {
        setScore(prev => prev + 1);
      }

      // Submit to Moodle if configured
      // await problemApi.submitAnswer(studentId, currentProblem.id, answer, result.isCorrect, timeSpent);
    } catch (error) {
      console.error('Error validating answer:', error);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setShowHint(false);
    setStartTime(Date.now());

    if (currentIndex < problems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // All problems completed
      alert(`축하합니다! 모든 문제를 완료했습니다.\n점수: ${score}/${problems.length}`);
      setCurrentIndex(0);
      setScore(0);
      loadProblems();
    }
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setShowHint(false);
    setStartTime(Date.now());
  };

  const handleHintRequest = () => {
    setShowHint(true);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="app-container">
        <div className="error-screen">
          <h2>문제를 불러올 수 없습니다</h2>
          <button onClick={loadProblems} className="retry-load-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Main content area */}
      <div className="main-content">
        <div className="app-header">
          <h1 className="app-title">Place Stair</h1>
          <p className="app-subtitle">자리값을 빛 계단으로 배워요</p>
        </div>

        <div className="progress-bar">
          <div className="progress-info">
            <span>진행도: {currentIndex + 1} / {problems.length}</span>
            <span>점수: {score}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / problems.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Smartphone with problem display */}
      <SmartphoneFrame>
        <ProblemDisplay
          problem={currentProblem}
          onSubmit={handleSubmit}
          showHint={showHint}
          onHintRequest={handleHintRequest}
        />
      </SmartphoneFrame>

      {/* Feedback modal */}
      {showFeedback && validationResult && (
        <FeedbackModal
          isCorrect={validationResult.isCorrect}
          feedback={validationResult.feedback}
          onNext={handleNext}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};

export default App;
