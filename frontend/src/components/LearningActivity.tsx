import React, { useState } from 'react';
import { ConceptWarning } from './ConceptWarning';
import { useConceptWarnings } from '../hooks/useConceptWarnings';

interface LearningActivityProps {
  studentId: string;
  moduleId?: string;
  language?: 'en' | 'kr';
}

export const LearningActivity: React.FC<LearningActivityProps> = ({
  studentId,
  moduleId,
  language = 'kr'
}) => {
  const [inputText, setInputText] = useState('');
  const [sessionId] = useState(() => `session-${Date.now()}`);

  const {
    activeWarnings,
    isChecking,
    checkWarnings,
    acknowledgeWarning,
    dismissWarning
  } = useConceptWarnings(studentId);

  const handleInputChange = async (value: string) => {
    setInputText(value);

    // Check for warnings when input changes
    if (value.trim().length > 5) {
      await checkWarnings(value, 'text-input', {
        moduleId,
        sessionId,
        language
      });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Title */}
      <h1 style={{ color: '#1f2937', marginBottom: '24px' }}>
        {language === 'kr' ? '수학 학습 활동' : 'Math Learning Activity'}
      </h1>

      {/* Active Warnings */}
      {activeWarnings.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {activeWarnings.map((warning) => (
            <ConceptWarning
              key={warning.warningId}
              warning={warning}
              language={language}
              onAcknowledge={acknowledgeWarning}
              onDismiss={dismissWarning}
            />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <label
          htmlFor="problem-input"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
          }}
        >
          {language === 'kr' ? '문제를 풀어보세요:' : 'Solve the problem:'}
        </label>

        <textarea
          id="problem-input"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={
            language === 'kr'
              ? '예: 최댓값과 절댓값의 차이는 무엇인가요?'
              : 'e.g., What is the difference between maximum and absolute value?'
          }
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />

        {isChecking && (
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
            {language === 'kr' ? '개념 확인 중...' : 'Checking concepts...'}
          </p>
        )}

        {/* Example Problems */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
            {language === 'kr' ? '예제 문제:' : 'Example Problems:'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleInputChange(
                language === 'kr'
                  ? '집합 {-5, 3, 7}의 최댓값과 절댓값을 구하세요'
                  : 'Find the maximum and absolute value of the set {-5, 3, 7}'
              )}
              style={{
                padding: '12px',
                textAlign: 'left',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151'
              }}
            >
              {language === 'kr'
                ? '집합 {-5, 3, 7}의 최댓값과 절댓값을 구하세요'
                : 'Find the maximum and absolute value of the set {-5, 3, 7}'}
            </button>

            <button
              onClick={() => handleInputChange(
                language === 'kr'
                  ? '직사각형의 둘레와 넓이를 구하는 방법'
                  : 'How to find the perimeter and area of a rectangle'
              )}
              style={{
                padding: '12px',
                textAlign: 'left',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151'
              }}
            >
              {language === 'kr'
                ? '직사각형의 둘레와 넓이를 구하는 방법'
                : 'How to find the perimeter and area of a rectangle'}
            </button>

            <button
              onClick={() => handleInputChange(
                language === 'kr'
                  ? '평균과 중앙값의 차이는 무엇인가요?'
                  : 'What is the difference between mean and median?'
              )}
              style={{
                padding: '12px',
                textAlign: 'left',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151'
              }}
            >
              {language === 'kr'
                ? '평균과 중앙값의 차이는 무엇인가요?'
                : 'What is the difference between mean and median?'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #3b82f6'
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6' }}>
          {language === 'kr'
            ? 'ℹ️ 이 시스템은 학생들이 자주 혼동하는 수학 개념 쌍을 자동으로 감지하고 경고를 표시합니다. 문제를 풀면서 관련 개념을 입력하면 실시간으로 도움을 받을 수 있습니다.'
            : 'ℹ️ This system automatically detects confusion-prone math concept pairs and displays warnings. As you work on problems, you\'ll receive real-time help when entering related concepts.'}
        </p>
      </div>
    </div>
  );
};

export default LearningActivity;
