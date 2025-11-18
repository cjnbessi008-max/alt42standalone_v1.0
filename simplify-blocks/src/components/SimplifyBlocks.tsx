import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Block } from './Block';
import { LogParser, generateSampleProblems } from '../utils/logParser';
import { SimplificationStep } from '../types';
import './SimplifyBlocks.css';

/**
 * Simplify Blocks 메인 컴포넌트
 */
export function SimplifyBlocks() {
  const [expression, setExpression] = useState('log(a*b)');
  const [steps, setSteps] = useState<SimplificationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const parser = new LogParser();
  const problems = generateSampleProblems();

  const handleSimplify = () => {
    setIsSimplifying(true);
    setCurrentStep(0);

    // 단순화 단계 생성
    const simplificationSteps = parser.generateSimplificationSteps(expression);

    if (simplificationSteps.length === 0) {
      // 단순화할 것이 없으면 원본 블록만 표시
      const block = parser.parseExpression(expression);
      setSteps([
        {
          id: 'original',
          rule: 'product',
          description: '이미 단순화된 형태입니다',
          before: expression,
          after: expression,
          blocks: [block]
        }
      ]);
    } else {
      setSteps(simplificationSteps);
    }

    setTimeout(() => setIsSimplifying(false), 500);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStep(0);
    setIsSimplifying(false);
  };

  const loadProblem = (problemExpression: string) => {
    setExpression(problemExpression);
    handleReset();
  };

  return (
    <div className="simplify-blocks">
      <header className="simplify-header">
        <h1>📚 Simplify Blocks</h1>
        <p className="subtitle">로그식 단순화를 블록으로 배워요</p>
      </header>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="expression">로그식 입력:</label>
          <input
            id="expression"
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="예: log(a*b)"
            className="expression-input"
            disabled={isSimplifying}
          />
          <button
            onClick={handleSimplify}
            className="btn btn-primary"
            disabled={isSimplifying || !expression}
          >
            {isSimplifying ? '처리 중...' : '단순화하기'}
          </button>
        </div>

        <div className="sample-problems">
          <p className="sample-label">샘플 문제:</p>
          <div className="problem-chips">
            {problems.map((problem) => (
              <button
                key={problem.id}
                onClick={() => loadProblem(problem.expression)}
                className="problem-chip"
                title={problem.description}
              >
                {problem.expression}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {steps.length > 0 && (
          <motion.div
            className="visualization-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="step-info">
              <h2>
                단계 {currentStep + 1} / {steps.length}
              </h2>
              <p className="rule-description">
                {steps[currentStep].description}
              </p>
            </div>

            <div className="expression-display">
              <div className="expression-before">
                <span className="label">변환 전:</span>
                <code>{steps[currentStep].before}</code>
              </div>
              <div className="arrow">→</div>
              <div className="expression-after">
                <span className="label">변환 후:</span>
                <code>{steps[currentStep].after}</code>
              </div>
            </div>

            <div className="blocks-container">
              {steps[currentStep].blocks.map((block, index) => (
                <Block key={block.id} block={block} delay={index * 0.2} />
              ))}
            </div>

            <div className="controls">
              <button
                onClick={handlePrevStep}
                className="btn btn-secondary"
                disabled={currentStep === 0}
              >
                ← 이전
              </button>
              <button onClick={handleReset} className="btn btn-outline">
                처음으로
              </button>
              <button
                onClick={handleNextStep}
                className="btn btn-secondary"
                disabled={currentStep === steps.length - 1}
              >
                다음 →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {steps.length === 0 && !isSimplifying && (
        <div className="empty-state">
          <div className="empty-icon">🧮</div>
          <p>로그식을 입력하고 '단순화하기' 버튼을 눌러보세요</p>
          <p className="hint">샘플 문제를 클릭하여 시작할 수도 있습니다</p>
        </div>
      )}
    </div>
  );
}
