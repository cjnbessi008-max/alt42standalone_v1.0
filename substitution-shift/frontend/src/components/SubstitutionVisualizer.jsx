import React, { useState, useEffect } from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import '../styles/SubstitutionVisualizer.css';

/**
 * SubstitutionVisualizer Component
 *
 * Displays step-by-step substitution integral with color shift effects
 *
 * @param {Object} problem - Problem data from API
 * @param {Function} onComplete - Callback when visualization completes
 */
const SubstitutionVisualizer = ({ problem, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(2000); // ms per step

  useEffect(() => {
    let timer;
    if (isPlaying && currentStep < problem.steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, animationSpeed);
    } else if (isPlaying && currentStep === problem.steps.length - 1) {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    }

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, animationSpeed, problem.steps.length, onComplete]);

  const handleNext = () => {
    if (currentStep < problem.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
    setIsPlaying(false);
  };

  if (!problem || !problem.steps || problem.steps.length === 0) {
    return (
      <div className="substitution-visualizer">
        <div className="error-message">
          문제 데이터를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  const currentStepData = problem.steps[currentStep];

  return (
    <div className="substitution-visualizer">
      {/* Header */}
      <div className="visualizer-header">
        <h2 className="problem-title">{problem.title}</h2>
        {problem.description && (
          <p className="problem-description">{problem.description}</p>
        )}
      </div>

      {/* Main visualization area */}
      <div className="visualization-area">
        {/* Step indicator */}
        <div className="step-indicator">
          <span className="step-number">
            단계 {currentStep + 1} / {problem.steps.length}
          </span>
          <span className="step-description">
            {currentStepData.description}
          </span>
        </div>

        {/* Mathematical expression with color */}
        <div
          className="math-expression"
          style={{
            backgroundColor: `${currentStepData.color}15`, // 15 for opacity
            borderLeft: `4px solid ${currentStepData.color}`
          }}
        >
          <BlockMath math={currentStepData.expression} />
        </div>

        {/* Step timeline */}
        <div className="step-timeline">
          {problem.steps.map((step, index) => (
            <div
              key={index}
              className={`timeline-item ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => handleStepClick(index)}
              style={{
                borderColor: index === currentStep ? step.color : '#ddd'
              }}
            >
              <div
                className="timeline-dot"
                style={{
                  backgroundColor: index <= currentStep ? step.color : '#fff',
                  borderColor: step.color
                }}
              ></div>
              <div className="timeline-label">{step.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="visualizer-controls">
        <button
          className="control-button"
          onClick={handleReset}
          title="처음으로"
        >
          ⟲
        </button>

        <button
          className="control-button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          title="이전 단계"
        >
          ◀
        </button>

        <button
          className="control-button play-button"
          onClick={handlePlayPause}
          title={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="control-button"
          onClick={handleNext}
          disabled={currentStep === problem.steps.length - 1}
          title="다음 단계"
        >
          ▶
        </button>

        {/* Speed control */}
        <div className="speed-control">
          <label htmlFor="speed">속도:</label>
          <select
            id="speed"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
          >
            <option value={1000}>빠름</option>
            <option value={2000}>보통</option>
            <option value={3000}>느림</option>
          </select>
        </div>
      </div>

      {/* Additional info */}
      <div className="additional-info">
        <div className="info-section">
          <h3>치환 정보</h3>
          <div className="substitution-info">
            <BlockMath math={`${problem.substitution_variable} = ${problem.substitution_expression}`} />
            <BlockMath math={`d${problem.substitution_variable} = ${problem.du_expression}`} />
          </div>
        </div>

        {currentStep === problem.steps.length - 1 && (
          <div className="info-section final-answer">
            <h3>✓ 최종 답</h3>
            <BlockMath math={problem.final_answer} />
          </div>
        )}

        {problem.hints && problem.hints.length > 0 && (
          <div className="info-section hints">
            <h3>💡 힌트</h3>
            <ul>
              {problem.hints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubstitutionVisualizer;
