import React, { useState, useEffect } from 'react';
import { validateAnswer } from '../utils/validation';
import { ValidationError, SubmissionResponse } from '../types';
import './SubmissionForm.css';

interface SubmissionFormProps {
  onSubmit?: (answer: string) => Promise<SubmissionResponse>;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit }) => {
  const [answer, setAnswer] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  // 실시간 검증
  useEffect(() => {
    if (answer.length > 0) {
      const result = validateAnswer(answer);
      setErrors(result.errors);
    } else {
      setErrors([]);
    }
  }, [answer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 최종 검증
    const validationResult = validateAnswer(answer);

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      if (onSubmit) {
        const response = await onSubmit(answer);
        setSubmitResult(response.message);
      } else {
        // 기본 동작: 콘솔에 출력
        console.log('제출된 답안:', answer);
        setSubmitResult('✓ 답안이 성공적으로 검증되었습니다!');
      }
    } catch (error) {
      setSubmitResult('✗ 제출 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertSymbol = (symbol: string) => {
    setAnswer(prev => prev + symbol);
  };

  return (
    <div className="submission-form-container">
      <h2>답안 제출</h2>

      <form onSubmit={handleSubmit} className="submission-form">
        <div className="form-group">
          <label htmlFor="answer">답안 입력</label>
          <input
            type="text"
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="예: (2+3)×5 또는 1/2+3/4"
            className={errors.length > 0 ? 'error' : ''}
            disabled={isSubmitting}
          />

          {/* 수식 입력 도우미 버튼 */}
          <div className="symbol-buttons">
            <button type="button" onClick={() => insertSymbol('+')} disabled={isSubmitting}>+</button>
            <button type="button" onClick={() => insertSymbol('-')} disabled={isSubmitting}>-</button>
            <button type="button" onClick={() => insertSymbol('×')} disabled={isSubmitting}>×</button>
            <button type="button" onClick={() => insertSymbol('÷')} disabled={isSubmitting}>÷</button>
            <button type="button" onClick={() => insertSymbol('(')} disabled={isSubmitting}>(</button>
            <button type="button" onClick={() => insertSymbol(')')} disabled={isSubmitting}>)</button>
            <button type="button" onClick={() => insertSymbol('[')} disabled={isSubmitting}>[</button>
            <button type="button" onClick={() => insertSymbol(']')} disabled={isSubmitting}>]</button>
            <button type="button" onClick={() => insertSymbol('/')} disabled={isSubmitting}>/</button>
          </div>
        </div>

        {/* 실시간 검증 오류 표시 */}
        {errors.length > 0 && (
          <div className="validation-errors">
            <h4>⚠ 검증 오류</h4>
            <ul>
              {errors.map((error, index) => (
                <li key={index} className={`error-${error.type}`}>
                  <strong>[{error.type === 'bracket' ? '괄호' : error.type === 'sign' ? '부호' : '형식'}]</strong> {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 제출 결과 표시 */}
        {submitResult && (
          <div className={`submit-result ${submitResult.startsWith('✓') ? 'success' : 'error'}`}>
            {submitResult}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || errors.length > 0}
          className="submit-button"
        >
          {isSubmitting ? '제출 중...' : '답안 제출'}
        </button>
      </form>

      {/* 검증 규칙 안내 */}
      <div className="validation-rules">
        <h3>검증 규칙</h3>
        <ul>
          <li>✓ 괄호는 반드시 짝이 맞아야 합니다: ( ), [ ], {'{ }'}</li>
          <li>✓ 연산자는 연속으로 올 수 없습니다</li>
          <li>✓ 수식은 연산자로 끝날 수 없습니다</li>
          <li>✓ 사용 가능한 기호: 숫자, +, -, ×, ÷, /, 괄호</li>
        </ul>
      </div>
    </div>
  );
};

export default SubmissionForm;
