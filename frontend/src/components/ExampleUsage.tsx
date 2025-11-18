/**
 * Example Usage of FocusCard with LMS Integration
 *
 * Demonstrates how to use the FocusCard component with complexity assessment
 */

import React, { useState } from 'react';
import FocusCard from './ui/FocusCard';
import { useFocusCard } from '../hooks/useFocusCard';

const ExampleUsage: React.FC = () => {
  const {
    assessment,
    isLoading,
    error,
    showFocusCard,
    assessComplexity,
    assessFromLMS,
    handleContinue,
    handleRequestHelp,
  } = useFocusCard({ language: 'ko', autoShow: true });

  const [selectedExample, setSelectedExample] = useState<string>('');

  // Example 1: Simple problem
  const testSimpleProblem = () => {
    setSelectedExample('simple');
    assessComplexity({
      condition_count: 2,
      nesting_depth: 1,
      entity_count: 2,
      has_cyclical_dependencies: false,
    });
  };

  // Example 2: Complex problem
  const testComplexProblem = () => {
    setSelectedExample('complex');
    assessComplexity({
      condition_count: 6,
      nesting_depth: 4,
      entity_count: 5,
      has_cyclical_dependencies: false,
    });
  };

  // Example 3: Very complex problem
  const testVeryComplexProblem = () => {
    setSelectedExample('very_complex');
    assessComplexity({
      condition_count: 8,
      nesting_depth: 5,
      entity_count: 6,
      has_cyclical_dependencies: true,
    });
  };

  // Example 4: LMS integration
  const testLMSIntegration = () => {
    setSelectedExample('lms');
    assessFromLMS({
      problem_id: 'fraction-advanced-001',
      problem_type: 'fraction_arithmetic',
      difficulty_level: 5,
      estimated_time_minutes: 15,
      prerequisites: ['basic_fractions', 'common_denominator'],
    });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎯 Focus Card Example - LMS Integration</h1>
      <p>
        복잡도 높은 문제를 풀기 전에 학생들이 정신을 가다듬을 수 있도록 돕는 Focus Card 시스템입니다.
      </p>

      <div style={{ marginTop: '32px' }}>
        <h2>Test Examples</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button
            onClick={testSimpleProblem}
            style={{
              padding: '12px 24px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            1. Simple Problem (No Focus Card)
          </button>

          <button
            onClick={testComplexProblem}
            style={{
              padding: '12px 24px',
              background: '#f57c00',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            2. Complex Problem
          </button>

          <button
            onClick={testVeryComplexProblem}
            style={{
              padding: '12px 24px',
              background: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            3. Very Complex Problem
          </button>

          <button
            onClick={testLMSIntegration}
            style={{
              padding: '12px 24px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            4. LMS Integration
          </button>
        </div>

        {isLoading && (
          <div style={{ padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
            <p>Analyzing complexity...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '20px', background: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
            <p>Error: {error.message}</p>
          </div>
        )}

        {assessment && !showFocusCard && (
          <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Assessment Results</h3>
            <div style={{ marginTop: '16px' }}>
              <p><strong>Complexity Level:</strong> {assessment.level.toUpperCase()}</p>
              <p><strong>Requires Focus Card:</strong> {assessment.requires_focus_card ? 'Yes' : 'No'}</p>

              <div style={{ marginTop: '16px' }}>
                <h4>Metrics:</h4>
                <ul>
                  <li>Conditions: {assessment.metrics.condition_count}</li>
                  <li>Nesting Depth: {assessment.metrics.nesting_depth}</li>
                  <li>Entities: {assessment.metrics.entity_count}</li>
                  <li>Cyclical Dependencies: {assessment.metrics.has_cyclical_dependencies ? 'Yes' : 'No'}</li>
                </ul>
              </div>

              {assessment.recommendations.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4>Recommendations:</h4>
                  <ul>
                    {assessment.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <h3>Example Problem Content</h3>
              <div style={{ padding: '20px', background: 'white', borderRadius: '8px', marginTop: '12px' }}>
                {selectedExample === 'simple' && (
                  <div>
                    <h4>분수 덧셈 (기본)</h4>
                    <p>다음 분수를 더하세요:</p>
                    <p style={{ fontSize: '24px', margin: '16px 0' }}>1/4 + 1/4 = ?</p>
                  </div>
                )}

                {selectedExample === 'complex' && (
                  <div>
                    <h4>분수의 복합 연산 (복잡)</h4>
                    <p>다음 문제를 풀어보세요:</p>
                    <p style={{ fontSize: '20px', margin: '16px 0' }}>
                      (2/3 + 1/4) × 3/5 - 1/6 = ?
                    </p>
                    <p>
                      <small>
                        조건: 답은 기약분수로 나타내고, 분자와 분모가 모두 양수여야 하며,
                        계산 과정에서 소수점을 사용하지 않아야 합니다.
                      </small>
                    </p>
                  </div>
                )}

                {selectedExample === 'very_complex' && (
                  <div>
                    <h4>고급 분수 문제 풀이 (매우 복잡)</h4>
                    <p>다음 조건을 만족하는 분수를 찾으세요:</p>
                    <ul style={{ marginTop: '12px' }}>
                      <li>분자와 분모의 합이 20입니다</li>
                      <li>분자를 2로 나누면 분모를 3으로 나눈 것과 같습니다</li>
                      <li>이 분수에 3/4을 곱하면 1보다 작습니다</li>
                      <li>이 분수를 기약분수로 나타냈을 때 분모가 짝수입니다</li>
                      <li>위 조건을 모두 만족하는 분수는 몇 개인가요?</li>
                    </ul>
                  </div>
                )}

                {selectedExample === 'lms' && (
                  <div>
                    <h4>LMS 연동 문제 (Difficulty Level 5)</h4>
                    <p><strong>Problem ID:</strong> fraction-advanced-001</p>
                    <p><strong>Type:</strong> Fraction Arithmetic</p>
                    <p><strong>Estimated Time:</strong> 15 minutes</p>
                    <p style={{ marginTop: '16px' }}>
                      This problem was loaded from the LMS with difficulty level 5,
                      which triggered automatic complexity assessment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Focus Card Display */}
      {showFocusCard && assessment && (
        <FocusCard
          assessment={assessment}
          onContinue={handleContinue}
          onRequestHelp={handleRequestHelp}
          language="ko"
        />
      )}
    </div>
  );
};

export default ExampleUsage;
