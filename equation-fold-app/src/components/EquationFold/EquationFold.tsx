import { useState, useEffect } from 'react';
import { EquationStep } from '../../types/equation';
import './EquationFold.css';

interface EquationFoldProps {
  equation: string;
  steps: EquationStep[];
}

const EquationFold = ({ equation, steps: initialSteps }: EquationFoldProps) => {
  const [steps, setSteps] = useState<EquationStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setSteps(initialSteps);
    setCurrentStep(0);
  }, [initialSteps]);

  const toggleStep = (index: number) => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newSteps = [...steps];
    newSteps[index].expanded = !newSteps[index].expanded;
    setSteps(newSteps);

    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // 다음 단계 자동 펼치기
      const newSteps = [...steps];
      newSteps[currentStep + 1].expanded = true;
      setSteps(newSteps);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetSteps = () => {
    const newSteps = steps.map((step, idx) => ({
      ...step,
      expanded: idx === 0
    }));
    setSteps(newSteps);
    setCurrentStep(0);
  };

  return (
    <div className="equation-fold">
      <div className="equation-fold-header">
        <h2>수식 단순화 과정</h2>
        <div className="step-indicator">
          단계 {currentStep + 1} / {steps.length}
        </div>
      </div>

      <div className="equation-steps">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step-item ${step.expanded ? 'expanded' : 'collapsed'} ${
              index === currentStep ? 'active' : ''
            } ${index > currentStep ? 'future' : ''}`}
          >
            <div
              className="step-header"
              onClick={() => toggleStep(index)}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <div className="step-expression">
                  {step.expanded ? (
                    <span className="expression-full">{step.expression}</span>
                  ) : (
                    <span className="expression-folded">
                      {step.expression.length > 20
                        ? step.expression.substring(0, 20) + '...'
                        : step.expression}
                    </span>
                  )}
                </div>
                <div className="step-description">{step.description}</div>
              </div>
              <div className="step-toggle">
                {step.expanded ? '▼' : '▶'}
              </div>
            </div>

            {step.expanded && (
              <div className="step-details">
                <div className="expression-display">
                  <code>{step.expression}</code>
                </div>
                {index < steps.length - 1 && (
                  <div className="step-arrow">
                    ↓
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="equation-controls">
        <button
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className="control-btn"
        >
          ← 이전 단계
        </button>
        <button
          onClick={resetSteps}
          className="control-btn reset-btn"
        >
          🔄 처음부터
        </button>
        <button
          onClick={goToNextStep}
          disabled={currentStep === steps.length - 1}
          className="control-btn"
        >
          다음 단계 →
        </button>
      </div>

      <div className="equation-info">
        <div className="info-item">
          <strong>원본 수식:</strong> {equation}
        </div>
        {steps.length > 0 && (
          <div className="info-item">
            <strong>최종 결과:</strong> {steps[steps.length - 1].expression}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquationFold;
