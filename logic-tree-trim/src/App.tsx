/**
 * Main App Component
 * Logic Tree Trim 메인 애플리케이션
 */

import { useState } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { LogicTreeVisualization } from './components/LogicTreeVisualization';
import { InputPanel } from './components/InputPanel';
import { parseLogicExpression } from './logic/parser';
import { simplifyLogicTree } from './logic/simplifier';
import type { LogicNode, SimplificationStep } from './types/logic';

function App() {
  const [originalTree, setOriginalTree] = useState<LogicNode | null>(null);
  const [steps, setSteps] = useState<SimplificationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showVisualization, setShowVisualization] = useState(false);

  const handleExpressionSubmit = (expression: string) => {
    try {
      // 파싱
      const tree = parseLogicExpression(expression);
      setOriginalTree(tree);

      // 단순화
      const { steps: simplificationSteps } = simplifyLogicTree(tree);
      setSteps(simplificationSteps);

      // 시각화 시작
      setCurrentStep(0);
      setShowVisualization(true);
    } catch (error) {
      console.error('파싱 오류:', error);
      alert('올바른 논리식을 입력해주세요.');
    }
  };

  const handleReset = () => {
    setShowVisualization(false);
    setOriginalTree(null);
    setSteps([]);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 메인 입력 화면 */}
      {!showVisualization && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <InputPanel onSubmit={handleExpressionSubmit} />
        </div>
      )}

      {/* 시각화 화면 (스마트폰 프레임) */}
      {showVisualization && originalTree && (
        <>
          {/* 좌측 정보 패널 */}
          <div className="fixed left-8 top-8 max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Logic Tree Trim</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-80 mb-1">총 단순화 단계:</p>
                <p className="text-3xl font-bold">{steps.length}</p>
              </div>
              <div>
                <p className="text-sm opacity-80 mb-1">현재 진행:</p>
                <p className="text-xl font-semibold">
                  {currentStep} / {steps.length}
                </p>
              </div>
              <div className="pt-4 border-t border-white/20">
                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-lg
                           transition-colors font-semibold"
                >
                  ← 새로운 식 입력
                </button>
              </div>
            </div>

            {/* 적용된 규칙 목록 */}
            {steps.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm opacity-80 mb-3">적용된 규칙:</p>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg text-sm ${
                        index + 1 === currentStep
                          ? 'bg-white/30 font-semibold'
                          : 'bg-white/10'
                      }`}
                    >
                      <p className="font-semibold">Step {step.stepNumber + 1}</p>
                      <p className="text-xs opacity-90">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 우측 하단 스마트폰 프레임 */}
          <SmartphoneFrame>
            <LogicTreeVisualization
              originalTree={originalTree}
              steps={steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </SmartphoneFrame>
        </>
      )}
    </div>
  );
}

export default App;
