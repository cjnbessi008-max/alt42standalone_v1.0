/**
 * ProblemSolver Component
 * Main component that integrates problem display and question suggestions
 */
import React, { useState } from 'react';
import { QuestionSuggestions } from './QuestionSuggestions';
import { questionSuggestionApi } from '../services/api';
import type { QuestionSuggestionResponse, Problem } from '../types';
import { HelpCircle, RefreshCw } from 'lucide-react';

interface ProblemSolverProps {
  problem: Problem;
  studentId: string;
}

export const ProblemSolver: React.FC<ProblemSolverProps> = ({
  problem,
  studentId,
}) => {
  const [suggestions, setSuggestions] = useState<QuestionSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await questionSuggestionApi.generateSuggestions({
        student_id: studentId,
        problem_id: problem.id,
        include_context: true,
      });

      setSuggestions(response);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError('질문을 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (questionIndex: number) => {
    console.log('Selected question:', questionIndex);
  };

  const handleFeedbackSubmit = async (
    rating: number,
    selectedIndex?: number,
    comment?: string
  ) => {
    if (!suggestions) return;

    try {
      await questionSuggestionApi.submitFeedback({
        suggestion_id: suggestions.suggestion_id,
        student_id: studentId,
        accepted_suggestion: selectedIndex,
        helpfulness_rating: rating,
        comment,
      });

      alert('피드백이 제출되었습니다. 감사합니다!');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('피드백 제출에 실패했습니다.');
    }
  };

  return (
    <div className="problem-solver">
      <div className="problem-section">
        <div className="problem-header">
          <h2 className="problem-title">{problem.title}</h2>
          <span className="difficulty-badge">
            난이도: {'⭐'.repeat(problem.difficulty_level)}
          </span>
        </div>

        <div className="problem-description">
          <p>{problem.description}</p>
        </div>

        <div className="problem-content">
          {/* Problem-specific content would go here */}
          <div className="placeholder">
            <p>📝 여기에 문제 내용이 표시됩니다</p>
            <p className="hint">예: 분수 시각화, 계산 문제 등</p>
          </div>
        </div>
      </div>

      <div className="help-section">
        {!suggestions ? (
          <div className="help-prompt">
            <HelpCircle size={48} className="help-icon" />
            <h3>도움이 필요하신가요?</h3>
            <p>
              스스로에게 던질 수 있는 질문을 AI가 제안해드립니다.
              <br />
              문제를 이해하고 해결하는데 도움이 됩니다.
            </p>
            <button
              className="load-suggestions-button"
              onClick={loadSuggestions}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="spinner" />
                  질문 생성 중...
                </>
              ) : (
                <>
                  <HelpCircle size={20} />
                  질문 제안 받기
                </>
              )}
            </button>
          </div>
        ) : (
          <QuestionSuggestions
            suggestions={suggestions.suggestions}
            onSelectQuestion={handleQuestionSelect}
            onSubmitFeedback={handleFeedbackSubmit}
          />
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadSuggestions}>다시 시도</button>
          </div>
        )}
      </div>

      <style>{`
        .problem-solver {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .problem-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .problem-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .problem-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
        }

        .difficulty-badge {
          padding: 0.5rem 1rem;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #856404;
        }

        .problem-description {
          margin-bottom: 2rem;
        }

        .problem-description p {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #495057;
        }

        .problem-content {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 2rem;
          min-height: 300px;
        }

        .placeholder {
          text-align: center;
          color: #6c757d;
        }

        .placeholder p {
          margin: 0.5rem 0;
        }

        .hint {
          font-size: 0.9rem;
          font-style: italic;
        }

        .help-section {
          display: flex;
          flex-direction: column;
        }

        .help-prompt {
          background: white;
          border-radius: 12px;
          padding: 3rem 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .help-icon {
          color: #4a90e2;
          margin-bottom: 1rem;
        }

        .help-prompt h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 1rem 0;
        }

        .help-prompt p {
          font-size: 1rem;
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .load-suggestions-button {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .load-suggestions-button:hover:not(:disabled) {
          background: #357abd;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
        }

        .load-suggestions-button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .error-message {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
          text-align: center;
        }

        .error-message p {
          color: #721c24;
          margin: 0 0 1rem 0;
        }

        .error-message button {
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .error-message button:hover {
          background: #c82333;
        }

        @media (max-width: 968px) {
          .problem-solver {
            grid-template-columns: 1fr;
            padding: 1rem;
            gap: 1.5rem;
          }

          .problem-section,
          .help-prompt {
            padding: 1.5rem;
          }

          .problem-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};
