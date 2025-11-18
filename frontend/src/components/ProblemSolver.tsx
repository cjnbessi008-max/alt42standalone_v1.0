/**
 * Problem Solver Component
 * Student interface for solving problems with activity tracking
 */
import React, { useState, useEffect } from 'react';
import { useActivityTracker } from '../utils/useActivityTracker';
import { sessionAPI } from '../services/api';

interface ProblemSolverProps {
  studentId: string;
  moduleId: string;
  problemId: string;
  onComplete?: (sessionId: string, isCorrect: boolean) => void;
}

const ProblemSolver: React.FC<ProblemSolverProps> = ({
  studentId,
  moduleId,
  problemId,
  onComplete,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Activity tracker hook
  const {
    onInputFocus,
    onInputBlur,
    onInputChange,
    onButtonClick,
    onHintRequest,
    onAnswerSubmit,
    onProblemComplete,
    getTimeSinceStart,
  } = useActivityTracker({
    sessionId: sessionId || '',
    enabled: !!sessionId,
  });

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await sessionAPI.createSession(studentId, moduleId, problemId);
        setSessionId(session.id);
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    };

    initSession();
  }, [studentId, moduleId, problemId]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAnswer(newValue);
    onInputChange('answer-input', newValue);
  };

  // Handle hint request
  const handleHintClick = () => {
    setShowHint(true);
    onHintRequest('hint-1');
    onButtonClick('hint-button', 'Show Hint');
  };

  // Handle answer submission
  const handleSubmit = async () => {
    if (!sessionId || !answer.trim()) return;

    setIsSubmitting(true);
    onButtonClick('submit-button', 'Submit Answer');

    try {
      // Track answer submission
      onAnswerSubmit({ answer });

      // For demo purposes, check if answer is correct
      // In production, this would be validated by the backend
      const isCorrect = checkAnswer(answer);

      // Update session
      const timeTaken = Math.floor(getTimeSinceStart() / 1000);
      await sessionAPI.updateSession(sessionId, {
        completed_at: new Date().toISOString(),
        total_time_seconds: timeTaken,
        is_correct: isCorrect,
        submitted_answer: { answer },
        status: 'completed',
      });

      // Track completion
      onProblemComplete(isCorrect);

      // Notify parent
      if (onComplete) {
        onComplete(sessionId, isCorrect);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple answer validation (demo)
  const checkAnswer = (ans: string): boolean => {
    // This is a demo - in production, validation would be more sophisticated
    return ans.trim().length > 0;
  };

  if (!sessionId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>세션을 시작하는 중...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '30px',
        backgroundColor: '#f9f9f9',
        borderRadius: '10px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* Problem Title */}
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
          분수 덧셈 문제
        </h2>

        {/* Problem Content - Demo Example */}
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f0f8ff',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '18px', margin: 0 }}>
            다음 분수의 덧셈을 계산하세요:
          </p>
          <p
            style={{
              fontSize: '36px',
              textAlign: 'center',
              margin: '20px 0',
              fontWeight: 'bold',
            }}
          >
            1/4 + 1/4 = ?
          </p>
        </div>

        {/* Answer Input */}
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="answer-input"
            style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 'bold',
              color: '#555',
            }}
          >
            답:
          </label>
          <input
            id="answer-input"
            type="text"
            value={answer}
            onChange={handleInputChange}
            onFocus={() => onInputFocus('answer-input')}
            onBlur={() => onInputBlur('answer-input')}
            placeholder="예: 1/2"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '5px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Hint Section */}
        <div style={{ marginBottom: '20px' }}>
          {!showHint ? (
            <button
              onClick={handleHintClick}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#FFA500',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              💡 힌트 보기
            </button>
          ) : (
            <div
              style={{
                padding: '15px',
                backgroundColor: '#fffacd',
                borderRadius: '5px',
                border: '1px solid #ffd700',
              }}
            >
              <strong>힌트:</strong> 분모가 같은 분수의 덧셈은 분자끼리 더하면 됩니다.
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: answer.trim() ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: answer.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
          }}
        >
          {isSubmitting ? '제출 중...' : '제출하기'}
        </button>

        {/* Session Info (for demo) */}
        <div
          style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '5px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          <p style={{ margin: '5px 0' }}>
            <strong>세션 ID:</strong> {sessionId}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>학생 ID:</strong> {studentId}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>문제 ID:</strong> {problemId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolver;
