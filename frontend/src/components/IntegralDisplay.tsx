/**
 * 적분 문제 표시 및 하이라이팅 컴포넌트
 */

import React, { useEffect, useRef } from 'react';
import type { IntegralProblem, IntegralStep, HighlightedPart } from '../types';
import './IntegralDisplay.css';

interface IntegralDisplayProps {
  problem: IntegralProblem;
  showSteps?: boolean;
  currentStep?: number;
}

export const IntegralDisplay: React.FC<IntegralDisplayProps> = ({
  problem,
  showSteps = true,
  currentStep = 0,
}) => {
  const mathRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // MathJax 렌더링
    if (window.MathJax) {
      window.MathJax.typesetPromise?.()
        .catch((err: any) => console.error('MathJax 렌더링 실패:', err));
    }
  }, [problem, currentStep]);

  const renderHighlightedLatex = (step: IntegralStep) => {
    if (!step.highlightedParts || step.highlightedParts.length === 0) {
      return `\\[${step.latex}\\]`;
    }

    // 하이라이팅된 부분에 색상 적용
    let highlightedLatex = step.latex;
    step.highlightedParts.forEach((part) => {
      const colorCommand = `\\colorbox{${part.color.replace('#', '')}}{$${part.latex}$}`;
      highlightedLatex = highlightedLatex.replace(part.latex, colorCommand);
    });

    return `\\[${highlightedLatex}\\]`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty;
    }
  };

  return (
    <div className="integral-display">
      {/* 문제 헤더 */}
      <div className="problem-header">
        <div className="problem-meta">
          <span
            className="difficulty-badge"
            style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
          >
            {getDifficultyText(problem.difficulty)}
          </span>
          <span className="integral-type">{getTypeLabel(problem.integralType)}</span>
        </div>
      </div>

      {/* 문제 본문 */}
      <div className="problem-content">
        <p className="problem-text">{problem.problemText}</p>
        <div className="problem-latex" ref={(el) => (mathRefs.current['main'] = el)}>
          {`\\[${problem.latex}\\]`}
        </div>
      </div>

      {/* 적용 규칙 */}
      {problem.coreRules && problem.coreRules.length > 0 && (
        <div className="core-rules-section">
          <h3 className="section-title">📚 적용 가능한 핵심 규칙</h3>
          {problem.coreRules.map((rule) => (
            <div key={rule.ruleId} className="core-rule-card">
              <div className="rule-header">
                <span className="rule-name">{rule.ruleName}</span>
              </div>
              <div className="rule-formula" ref={(el) => (mathRefs.current[rule.ruleId] = el)}>
                {`\\[${rule.ruleLatex}\\]`}
              </div>
              <p className="rule-description">{rule.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* 단계별 풀이 */}
      {showSteps && problem.steps && problem.steps.length > 0 && (
        <div className="steps-section">
          <h3 className="section-title">📝 단계별 풀이</h3>
          {problem.steps.map((step, index) => (
            <div
              key={step.stepNumber}
              className={`step-card ${index === currentStep ? 'active' : ''} ${
                index < currentStep ? 'completed' : ''
              }`}
            >
              <div className="step-header">
                <span className="step-number">Step {step.stepNumber}</span>
                {step.appliedRule && (
                  <span className="applied-rule">{step.appliedRule.ruleName}</span>
                )}
              </div>
              <p className="step-description">{step.description}</p>
              <div
                className="step-latex"
                ref={(el) => (mathRefs.current[`step-${step.stepNumber}`] = el)}
              >
                {`\\[${step.latex}\\]`}
              </div>

              {/* 하이라이팅된 부분 설명 */}
              {step.highlightedParts && step.highlightedParts.length > 0 && (
                <div className="highlighted-parts">
                  {step.highlightedParts.map((part) => (
                    <div
                      key={part.partId}
                      className="highlight-label"
                      style={{ borderLeftColor: part.color }}
                    >
                      <span className="label-dot" style={{ backgroundColor: part.color }}></span>
                      <span className="label-text">{part.label}</span>
                      {part.tooltipText && (
                        <span className="label-tooltip">{part.tooltipText}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    power_rule: '거듭제곱',
    substitution: '치환적분',
    integration_by_parts: '부분적분',
    trigonometric: '삼각함수',
    exponential: '지수함수',
    logarithmic: '로그함수',
    rational: '유리함수',
    definite: '정적분',
  };
  return labels[type] || type;
}

// MathJax 타입 선언
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<void>;
      typeset?: () => void;
    };
  }
}
