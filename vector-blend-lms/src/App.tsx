/**
 * Vector Blend LMS - Main Application Component
 */

import { useState, useEffect } from 'react';
import MobileFrame from './components/MobileFrame/MobileFrame';
import VectorCanvas from './components/VectorCanvas/VectorCanvas';
import ColorDisplay from './components/ColorDisplay/ColorDisplay';
import ProblemDisplay from './components/ProblemDisplay/ProblemDisplay';
import type { ProblemSet } from './types/problem';
import type { Vector2D } from './types/vector';
import { blendVectorColors } from './engine/color';
import { addVectors } from './engine/vector';
import { validateAnswer, type ValidationResult } from './services/problemValidator';
import lmsApi from './services/lmsApi';
import './App.css';

function App() {
  // State management
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [vectors, setVectors] = useState<Vector2D[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize LMS and load problem set
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize LMS context
        const context = await lmsApi.initialize();
        console.log('LMS Context:', context);

        // Load problem set (default to beginner-set)
        const problemSetId = context?.customParams?.problemSetId || 'beginner-set';
        const response = await lmsApi.loadProblemSet(problemSetId);

        if (response.success && response.data) {
          setProblemSet(response.data);
          // Initialize vectors from first problem
          if (response.data.problems[0]) {
            setVectors([...response.data.problems[0].initialVectors]);
          }
        } else {
          console.error('Failed to load problem set:', response.error);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentProblem = problemSet?.problems[currentProblemIndex];

  // Calculate result vector and color
  const resultVector = vectors.length > 0 ? addVectors(...vectors) : null;
  const resultColor = blendVectorColors(vectors);

  // Handle vector changes
  const handleVectorChange = (updatedVectors: Vector2D[]) => {
    setVectors(updatedVectors);
    setValidation(null); // Clear validation when vectors change
  };

  // Check answer
  const handleCheckAnswer = () => {
    if (!currentProblem) return;

    const result = validateAnswer(currentProblem, vectors);
    setValidation(result);

    if (result.isCorrect) {
      setCompletedProblems(new Set([...completedProblems, currentProblem.id]));

      // Save progress
      const context = lmsApi.getContext();
      if (context?.userId && problemSet?.id) {
        lmsApi.saveProgress(context.userId, problemSet.id, {
          completedProblems: Array.from(completedProblems),
          currentProblemIndex,
        });
      }
    }
  };

  // Reset current problem
  const handleReset = () => {
    if (currentProblem) {
      setVectors([...currentProblem.initialVectors]);
      setShowHint(false);
      setValidation(null);
    }
  };

  // Navigate to next problem
  const handleNextProblem = () => {
    if (!problemSet || currentProblemIndex >= problemSet.problems.length - 1) return;

    const nextIndex = currentProblemIndex + 1;
    setCurrentProblemIndex(nextIndex);
    setVectors([...problemSet.problems[nextIndex].initialVectors]);
    setShowHint(false);
    setValidation(null);
  };

  // Navigate to previous problem
  const handlePreviousProblem = () => {
    if (!problemSet || currentProblemIndex <= 0) return;

    const prevIndex = currentProblemIndex - 1;
    setCurrentProblemIndex(prevIndex);
    setVectors([...problemSet.problems[prevIndex].initialVectors]);
    setShowHint(false);
    setValidation(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader"></div>
        <p>Loading Vector Blend...</p>
      </div>
    );
  }

  if (!problemSet || !currentProblem) {
    return (
      <div className="app-error">
        <h2>문제를 불러올 수 없습니다</h2>
        <p>Problem set could not be loaded</p>
      </div>
    );
  }

  const AppContent = (
    <div className="vector-blend-app">
      {/* Header */}
      <header className="app-header">
        <h1>🎨 Vector Blend</h1>
        <div className="progress-indicator">
          Problem {currentProblemIndex + 1} of {problemSet.problems.length}
        </div>
      </header>

      {/* Main content */}
      <main className="app-main">
        {/* Problem information */}
        <ProblemDisplay
          problem={currentProblem}
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        />

        {/* Vector canvas */}
        <div className="canvas-section">
          <VectorCanvas
            vectors={vectors}
            resultVector={resultVector || undefined}
            showResultVector={true}
            onVectorChange={handleVectorChange}
            width={isMobile ? 300 : 400}
            height={isMobile ? 300 : 400}
          />
        </div>

        {/* Result color display */}
        {resultVector && (
          <div className="result-section">
            <ColorDisplay
              color={resultColor}
              label="Blended Color"
              size="large"
              showValues={true}
            />
          </div>
        )}

        {/* Validation feedback */}
        {validation && (
          <div className={`validation-feedback ${validation.isCorrect ? 'success' : 'partial'}`}>
            <div className="validation-message">{validation.message}</div>
            {validation.feedback && (
              <div className="validation-detail">{validation.feedback}</div>
            )}
            <div className="validation-score">Score: {validation.score}/100</div>
          </div>
        )}

        {/* Action buttons */}
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={handleReset}
          >
            🔄 Reset
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCheckAnswer}
          >
            ✅ Check Answer
          </button>
        </div>

        {/* Navigation buttons */}
        <div className="navigation-buttons">
          <button
            className="btn btn-nav"
            onClick={handlePreviousProblem}
            disabled={currentProblemIndex === 0}
          >
            ← Previous
          </button>
          <button
            className="btn btn-nav"
            onClick={handleNextProblem}
            disabled={currentProblemIndex >= problemSet.problems.length - 1}
          >
            Next →
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Completed: {completedProblems.size} / {problemSet.problems.length}</p>
      </footer>
    </div>
  );

  // Wrap in mobile frame for desktop view
  if (!isMobile) {
    return <MobileFrame position="bottom-right">{AppContent}</MobileFrame>;
  }

  return AppContent;
}

export default App;
