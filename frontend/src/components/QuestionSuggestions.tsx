/**
 * QuestionSuggestions Component
 * Displays 3 AI-generated self-reflection questions for students
 */
import React, { useState } from 'react';
import { Lightbulb, MessageCircle, CheckCircle, Star } from 'lucide-react';
import type { SuggestedQuestion } from '../types';

interface QuestionSuggestionsProps {
  suggestions: SuggestedQuestion[];
  onSelectQuestion?: (questionIndex: number) => void;
  onSubmitFeedback?: (rating: number, selectedIndex?: number, comment?: string) => void;
}

const categoryIcons = {
  clarification: Lightbulb,
  strategy: MessageCircle,
  reflection: CheckCircle,
};

const categoryLabels = {
  clarification: '이해 확인',
  strategy: '전략',
  reflection: '성찰',
};

const categoryColors = {
  clarification: 'bg-blue-100 text-blue-700 border-blue-300',
  strategy: 'bg-green-100 text-green-700 border-green-300',
  reflection: 'bg-purple-100 text-purple-700 border-purple-300',
};

export const QuestionSuggestions: React.FC<QuestionSuggestionsProps> = ({
  suggestions,
  onSelectQuestion,
  onSubmitFeedback,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSelectQuestion = (index: number) => {
    setSelectedIndex(index);
    if (onSelectQuestion) {
      onSelectQuestion(index);
    }
  };

  const handleSubmitFeedback = () => {
    if (onSubmitFeedback && rating > 0) {
      onSubmitFeedback(
        rating,
        selectedIndex !== null ? selectedIndex + 1 : undefined,
        comment
      );
      setShowFeedback(false);
    }
  };

  return (
    <div className="question-suggestions">
      <div className="header">
        <h3 className="title">💭 스스로에게 던져볼 질문</h3>
        <p className="subtitle">
          문제를 풀면서 다음 질문들을 생각해보세요
        </p>
      </div>

      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => {
          const Icon = categoryIcons[suggestion.category];
          const isSelected = selectedIndex === index;

          return (
            <div
              key={index}
              className={`suggestion-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectQuestion(index)}
            >
              <div className="card-header">
                <div className={`category-badge ${categoryColors[suggestion.category]}`}>
                  <Icon size={16} />
                  <span>{categoryLabels[suggestion.category]}</span>
                </div>
                {isSelected && (
                  <CheckCircle className="selected-icon" size={20} />
                )}
              </div>

              <div className="question-content">
                <p className="question-text">{suggestion.question}</p>
                <p className="rationale-text">{suggestion.rationale}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="actions">
        {!showFeedback ? (
          <button
            className="feedback-button"
            onClick={() => setShowFeedback(true)}
          >
            도움이 되었나요? 피드백 남기기
          </button>
        ) : (
          <div className="feedback-form">
            <div className="rating-section">
              <label>도움 정도:</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    className={`star ${star <= rating ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    fill={star <= rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>

            <textarea
              className="comment-input"
              placeholder="추가로 남기고 싶은 의견이 있나요? (선택사항)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <div className="feedback-actions">
              <button
                className="submit-button"
                onClick={handleSubmitFeedback}
                disabled={rating === 0}
              >
                제출하기
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowFeedback(false)}
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .question-suggestions {
          padding: 1.5rem;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 1.5rem;
        }

        .title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.5rem 0;
        }

        .subtitle {
          font-size: 0.95rem;
          color: #666;
          margin: 0;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .suggestion-card {
          padding: 1.25rem;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .suggestion-card:hover {
          border-color: #4a90e2;
          background: #f0f7ff;
        }

        .suggestion-card.selected {
          border-color: #4a90e2;
          background: #e3f2fd;
          box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid;
        }

        .selected-icon {
          color: #4a90e2;
        }

        .question-content {
          margin-top: 0.75rem;
        }

        .question-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
          line-height: 1.5;
        }

        .rationale-text {
          font-size: 0.9rem;
          color: #7f8c8d;
          margin: 0;
          line-height: 1.5;
        }

        .actions {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e9ecef;
        }

        .feedback-button {
          width: 100%;
          padding: 0.75rem;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .feedback-button:hover {
          background: #357abd;
        }

        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .rating-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .rating-section label {
          font-weight: 600;
          color: #2c3e50;
        }

        .star-rating {
          display: flex;
          gap: 0.25rem;
        }

        .star {
          cursor: pointer;
          color: #ffd700;
          transition: transform 0.2s;
        }

        .star:hover {
          transform: scale(1.2);
        }

        .star.filled {
          color: #ffd700;
        }

        .comment-input {
          padding: 0.75rem;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
        }

        .comment-input:focus {
          outline: none;
          border-color: #4a90e2;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }

        .feedback-actions {
          display: flex;
          gap: 0.75rem;
        }

        .submit-button,
        .cancel-button {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button {
          background: #28a745;
          color: white;
        }

        .submit-button:hover:not(:disabled) {
          background: #218838;
        }

        .submit-button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
        }

        .cancel-button:hover {
          background: #5a6268;
        }

        @media (max-width: 640px) {
          .question-suggestions {
            padding: 1rem;
          }

          .title {
            font-size: 1.25rem;
          }

          .question-text {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};
