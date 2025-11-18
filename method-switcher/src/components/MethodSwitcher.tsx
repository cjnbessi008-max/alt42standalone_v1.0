import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntegrationMethod, IntegrationResult, ProblemData } from '../types/integration';
import { INTEGRATION_METHODS } from '../constants/methods';
import { calculateIntegration, parseFunction } from '../utils/integrationMethods';
import { IntegrationVisualizer } from './IntegrationVisualizer';

interface MethodSwitcherProps {
  problem: ProblemData;
  onSubmit?: (method: IntegrationMethod, value: number) => void;
}

/**
 * Method Switcher 메인 컴포넌트
 * 다양한 적분법을 전환하며 애니메이션으로 비교
 */
export const MethodSwitcher: React.FC<MethodSwitcherProps> = ({ problem, onSubmit }) => {
  const [selectedMethod, setSelectedMethod] = useState<IntegrationMethod>('trapezoidal');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [results, setResults] = useState<Record<IntegrationMethod, IntegrationResult | null>>({
    'trapezoidal': null,
    'simpson': null,
    'rectangle': null,
    'monte-carlo': null
  });
  const [showComparison, setShowComparison] = useState(false);

  // 함수 파싱
  const functionFn = useMemo(
    () => parseFunction(problem.functionExpression),
    [problem.functionExpression]
  );

  // 선택된 메서드 정보
  const methodInfo = INTEGRATION_METHODS.find(m => m.id === selectedMethod);

  // 메서드 변경 시 계산 및 애니메이션
  useEffect(() => {
    if (!results[selectedMethod]) {
      // 아직 계산되지 않았으면 계산
      const result = calculateIntegration(
        selectedMethod,
        functionFn,
        problem.lowerBound,
        problem.upperBound
      );
      setResults(prev => ({ ...prev, [selectedMethod]: result }));
    }

    // 애니메이션 시작
    setIsAnimating(true);
    setAnimationProgress(0);

    const duration = 2000; // 2초
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [selectedMethod, problem, functionFn, results]);

  // 모든 메서드 계산 (비교 모드용)
  const calculateAllMethods = () => {
    const newResults: Record<IntegrationMethod, IntegrationResult | null> = { ...results };

    INTEGRATION_METHODS.forEach(method => {
      if (!newResults[method.id]) {
        newResults[method.id] = calculateIntegration(
          method.id,
          functionFn,
          problem.lowerBound,
          problem.upperBound
        );
      }
    });

    setResults(newResults);
    setShowComparison(true);
  };

  const currentResult = results[selectedMethod];

  return (
    <div style={{
      padding: '20px',
      height: '100%',
      overflow: 'auto',
      backgroundColor: '#f9fafb'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
          적분 계산기
        </h2>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <div>함수: <code style={{ backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>
            f(x) = {problem.functionExpression}
          </code></div>
          <div>구간: [{problem.lowerBound}, {problem.upperBound}]</div>
          {problem.exactValue && (
            <div>정확한 값: {problem.exactValue.toFixed(6)}</div>
          )}
        </div>
      </div>

      {/* 메서드 선택 버튼 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
          적분법 선택:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {INTEGRATION_METHODS.map(method => (
            <motion.button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: selectedMethod === method.id ? `2px solid ${method.color}` : '2px solid transparent',
                backgroundColor: selectedMethod === method.id ? `${method.color}15` : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: selectedMethod === method.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: method.color
                  }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                    {method.nameKo}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    {method.name}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 시각화 */}
      {currentResult && methodInfo && (
        <motion.div
          key={selectedMethod}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
            {methodInfo.nameKo} 시각화
          </div>

          <IntegrationVisualizer
            result={currentResult}
            functionFn={functionFn}
            lowerBound={problem.lowerBound}
            upperBound={problem.upperBound}
            color={methodInfo.color}
            isAnimating={isAnimating}
            animationProgress={animationProgress}
          />

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
            <div>계산 결과: <strong style={{ color: methodInfo.color }}>
              {currentResult.value.toFixed(6)}
            </strong></div>
            {problem.exactValue && (
              <div>오차: {Math.abs(currentResult.value - problem.exactValue).toFixed(6)}</div>
            )}
            <div>계산 시간: {currentResult.computationTime.toFixed(2)}ms</div>
            <div>단계 수: {currentResult.steps.length}</div>
          </div>
        </motion.div>
      )}

      {/* 비교 버튼 */}
      <motion.button
        onClick={calculateAllMethods}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '12px'
        }}
      >
        모든 방법 비교하기
      </motion.button>

      {/* 비교 테이블 */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
              결과 비교
            </div>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#6b7280' }}>방법</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: '#6b7280' }}>값</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: '#6b7280' }}>오차</th>
                </tr>
              </thead>
              <tbody>
                {INTEGRATION_METHODS.map(method => {
                  const result = results[method.id];
                  if (!result) return null;

                  const error = problem.exactValue
                    ? Math.abs(result.value - problem.exactValue)
                    : null;

                  return (
                    <tr key={method.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: method.color
                            }}
                          />
                          <span style={{ color: '#1f2937' }}>{method.nameKo}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px', fontFamily: 'monospace', color: '#374151' }}>
                        {result.value.toFixed(6)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px', fontFamily: 'monospace', color: '#6b7280' }}>
                        {error !== null ? error.toFixed(6) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 제출 버튼 */}
      {onSubmit && currentResult && (
        <motion.button
          onClick={() => onSubmit(selectedMethod, currentResult.value)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#10b981',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '12px'
          }}
        >
          답안 제출
        </motion.button>
      )}
    </div>
  );
};
