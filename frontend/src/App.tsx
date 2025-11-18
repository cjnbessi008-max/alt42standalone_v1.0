import React, { useState } from 'react';
import SmartphoneFrame from '@/components/SmartphoneFrame';
import RealLinePanorama from '@/components/RealLinePanorama';
import MoodleConnector from '@/components/MoodleConnector';
import type { MoodleQuestion, RealLineConfig } from '@/types';
import './App.css';

function App() {
  const [config, setConfig] = useState<RealLineConfig>({
    minValue: -10,
    maxValue: 10,
    centerValue: 0,
    zoomLevel: 1,
    showTicks: true,
    showLabels: true,
    highlightPoints: [],
    markedRegions: [],
  });

  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<MoodleQuestion | null>(null);

  const handleQuestionLoaded = (question: MoodleQuestion) => {
    setCurrentQuestion(question);
    setFeedback(null);
    setSelectedValue(null);

    // Update config based on question data
    if (question.questiondata) {
      const { min, max, correctAnswer } = question.questiondata;

      setConfig({
        ...config,
        minValue: min ?? -10,
        maxValue: max ?? 10,
        centerValue: correctAnswer ?? 0,
        highlightPoints: correctAnswer !== undefined ? [correctAnswer] : [],
        markedRegions: [],
      });
    }
  };

  const handleValueSelect = (value: number) => {
    setSelectedValue(value);
  };

  const handleAnswerSubmitted = (result: { correct: boolean; feedback: string }) => {
    setFeedback(result.feedback);

    // Update visualization to show result
    if (result.correct) {
      setConfig({
        ...config,
        markedRegions: [
          {
            start: selectedValue! - 0.5,
            end: selectedValue! + 0.5,
            color: '#28a745',
            label: '✓ Correct',
          },
        ],
      });
    } else {
      setConfig({
        ...config,
        markedRegions: [
          {
            start: selectedValue! - 0.5,
            end: selectedValue! + 0.5,
            color: '#dc3545',
            label: '✗ Incorrect',
          },
        ],
      });
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || selectedValue === null) {
      alert('Please select a value first');
      return;
    }

    // This will be handled by MoodleConnector
    // For now, just show mock feedback
    const tolerance = currentQuestion.questiondata?.tolerance ?? 0.1;
    const correctAnswer = currentQuestion.questiondata?.correctAnswer;

    if (correctAnswer !== undefined) {
      const isCorrect = Math.abs(selectedValue - correctAnswer) <= tolerance;
      handleAnswerSubmitted({
        correct: isCorrect,
        feedback: isCorrect
          ? `Correct! You selected ${selectedValue.toFixed(2)}, which is within tolerance of ${correctAnswer}.`
          : `Incorrect. You selected ${selectedValue.toFixed(2)}, but the correct answer is ${correctAnswer}.`,
      });
    }
  };

  return (
    <div className="app">
      {/* Main Content Area */}
      <div className="main-content">
        <header className="app-header">
          <h1>Real Line Panorama</h1>
          <p className="subtitle">Interactive Real Number Line Visualization for Mathematics Education</p>
        </header>

        <div className="info-panel">
          <div className="info-card">
            <h3>About</h3>
            <p>
              This tool visualizes the entire real number line compressed into a finite view using
              mathematical transformations. Pan, zoom, and click to explore the infinite world of real numbers.
            </p>
          </div>

          <div className="info-card">
            <h3>How to Use</h3>
            <ol>
              <li>Load a question from Moodle (enter Question ID or use Random)</li>
              <li>Use the panorama on the virtual phone to find the answer</li>
              <li>Click on the number line to select your answer</li>
              <li>Submit your answer to check if it's correct</li>
            </ol>
          </div>

          {feedback && (
            <div className={`feedback-card ${feedback.includes('Correct') ? 'success' : 'error'}`}>
              <h4>{feedback.includes('Correct') ? '✓ Success!' : '✗ Try Again'}</h4>
              <p>{feedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* Virtual Smartphone Display */}
      <SmartphoneFrame position="bottom-right">
        <div className="phone-app">
          <MoodleConnector
            onQuestionLoaded={handleQuestionLoaded}
            onAnswerSubmitted={handleAnswerSubmitted}
          />

          <RealLinePanorama
            config={config}
            onValueSelect={handleValueSelect}
          />

          {selectedValue !== null && (
            <div className="answer-panel">
              <div className="selected-answer">
                <span className="label">Your Answer:</span>
                <span className="value">{selectedValue.toFixed(4)}</span>
              </div>
              <button
                className="submit-btn"
                onClick={handleSubmitAnswer}
                disabled={!currentQuestion}
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>
      </SmartphoneFrame>
    </div>
  );
}

export default App;
