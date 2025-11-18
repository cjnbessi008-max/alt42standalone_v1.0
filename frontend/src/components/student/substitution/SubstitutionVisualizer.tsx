import React, { useState, useEffect } from 'react';
import type {
  SubstitutionProblem,
  SubstitutionStep,
  SubstitutionValidationResult,
  GlowColor
} from '../../../types/substitution';
import '../../../styles/substitution-glow.css';

interface SubstitutionVisualizerProps {
  problem: SubstitutionProblem;
  onComplete?: (score: number) => void;
}

/**
 * SubstitutionVisualizer Component
 * 치환 과정을 단계별로 시각화하고 글로우 효과를 적용하는 컴포넌트
 *
 * Features:
 * - 단계별 치환 과정 표시
 * - 정답/오답에 따른 글로우 효과
 * - 실시간 피드백
 * - 진행 상태 추적
 */
export const SubstitutionVisualizer: React.FC<SubstitutionVisualizerProps> = ({
  problem,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [glowColor, setGlowColor] = useState<GlowColor>('none');
  const [feedback, setFeedback] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);

  const currentStep = problem.steps[currentStepIndex];
  const isLastStep = currentStepIndex === problem.steps.length - 1;
  const totalSteps = problem.steps.length;

  /**
   * 사용자 입력 검증 및 글로우 효과 트리거
   */
  const validateSubstitution = (input: string): SubstitutionValidationResult => {
    const trimmedInput = input.trim().toLowerCase();
    const correctAnswer = currentStep.substitutedExpression.toLowerCase();

    // 정답 체크
    if (trimmedInput === correctAnswer) {
      return {
        isValid: true,
        status: 'correct',
        glowColor: 'green',
        feedback: '정답입니다! 올바른 치환이에요. 🎉'
      };
    }

    // 부분 정답 체크 (변수만 맞았는지)
    if (trimmedInput.includes(currentStep.variableTo)) {
      return {
        isValid: false,
        status: 'partial',
        glowColor: 'orange',
        feedback: `변수는 맞지만 식이 완전하지 않아요. 힌트: ${currentStep.explanation}`,
        correctAnswer
      };
    }

    // 오답
    return {
      isValid: false,
      status: 'incorrect',
      glowColor: 'red',
      feedback: '다시 한번 시도해보세요. 힌트를 확인하세요!',
      correctAnswer
    };
  };

  /**
   * 제출 처리
   */
  const handleSubmit = () => {
    if (!userInput.trim()) {
      setFeedback('답을 입력해주세요!');
      return;
    }

    const result = validateSubstitution(userInput);

    // 글로우 애니메이션 트리거
    setIsAnimating(true);
    setGlowColor(result.glowColor);
    setFeedback(result.feedback);

    if (result.isValid) {
      setScore(prev => prev + 1);
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));

      // 다음 단계로 이동
      setTimeout(() => {
        if (isLastStep) {
          // 문제 완료
          const finalScore = Math.round(((score + 1) / totalSteps) * 100);
          onComplete?.(finalScore);
        } else {
          setCurrentStepIndex(prev => prev + 1);
          setUserInput('');
          setGlowColor('none');
          setFeedback('');
          setIsAnimating(false);
        }
      }, 2000);
    } else {
      // 오답 시 애니메이션 종료 후 재시도 가능
      setTimeout(() => {
        setIsAnimating(false);
      }, 1500);
    }
  };

  /**
   * 힌트 보기
   */
  const showHint = () => {
    const hint = problem.hints[currentStepIndex] || currentStep.explanation;
    setFeedback(hint);
    setGlowColor('blue');
  };

  /**
   * 글로우 클래스 결정
   */
  const getGlowClass = (): string => {
    const baseClass = 'glow-base';

    if (!isAnimating) {
      return `${baseClass} glow-pending`;
    }

    switch (glowColor) {
      case 'green':
        return `${baseClass} glow-success`;
      case 'red':
        return `${baseClass} glow-error`;
      case 'orange':
        return `${baseClass} glow-partial`;
      case 'blue':
        return `${baseClass} glow-hint`;
      default:
        return `${baseClass} glow-pending`;
    }
  };

  /**
   * 변수 강조 표시
   */
  const highlightVariable = (expression: string, variable: string): React.ReactNode => {
    const parts = expression.split(variable);
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="variable-highlight">{variable}</span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="substitution-visualizer" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          {problem.title}
        </h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          {problem.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: '#999' }}>
            단계 {currentStepIndex + 1} / {totalSteps}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#673AB7' }}>
            정답: {score} / {totalSteps}
          </div>
        </div>
        {/* 진행 바 */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#E0E0E0',
          borderRadius: '2px',
          marginTop: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
            height: '100%',
            backgroundColor: '#673AB7',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* 초기 방정식 */}
      <div className="step-container">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#666' }}>
          초기 방정식
        </h3>
        <div className="expression-container">
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {highlightVariable(problem.initialEquation, problem.targetVariable)}
          </div>
        </div>
      </div>

      {/* 현재 단계 */}
      <div className="step-container step-highlight">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#673AB7' }}>
          단계 {currentStep.stepNumber}: {currentStep.explanation}
        </h3>

        <div className="expression-container">
          <div style={{ fontSize: '20px' }}>
            {highlightVariable(currentStep.originalExpression, currentStep.variableFrom)}
          </div>
          <div className="substitution-arrow">→</div>
          <div className={getGlowClass()}>
            {isAnimating && glowColor === 'green'
              ? currentStep.substitutedExpression
              : '?'
            }
          </div>
        </div>

        {/* 입력 폼 */}
        <div style={{ marginTop: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {currentStep.variableFrom}을(를) {currentStep.variableTo}(으)로 치환하세요:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="치환된 식을 입력하세요"
              disabled={isAnimating}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #E0E0E0',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isAnimating}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#673AB7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                opacity: isAnimating ? 0.6 : 1
              }}
            >
              확인
            </button>
            <button
              onClick={showHint}
              disabled={isAnimating}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                opacity: isAnimating ? 0.6 : 1
              }}
            >
              힌트
            </button>
          </div>
        </div>

        {/* 피드백 메시지 */}
        {feedback && (
          <div className={`feedback-message feedback-${
            glowColor === 'green' ? 'success' :
            glowColor === 'red' ? 'error' :
            'hint'
          }`}>
            {feedback}
          </div>
        )}
      </div>

      {/* 완료된 단계 표시 */}
      {completedSteps.size > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#666' }}>
            완료된 단계
          </h3>
          {problem.steps
            .filter((_, index) => completedSteps.has(index))
            .map((step) => (
              <div
                key={step.id}
                className="step-container"
                style={{ opacity: 0.7, marginBottom: '8px' }}
              >
                <div className="expression-container">
                  <div>{step.originalExpression}</div>
                  <div className="substitution-arrow">→</div>
                  <div className="glow-base glow-success">
                    {step.substitutedExpression}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default SubstitutionVisualizer;
