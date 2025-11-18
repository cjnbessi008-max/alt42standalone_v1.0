import React, { useState, useEffect } from 'react';
import { moodleService } from '@/services/moodleService';
import type { MoodleQuestion } from '@/types';
import './MoodleConnector.css';

interface MoodleConnectorProps {
  onQuestionLoaded?: (question: MoodleQuestion) => void;
  onAnswerSubmitted?: (result: { correct: boolean; feedback: string }) => void;
}

const MoodleConnector: React.FC<MoodleConnectorProps> = ({
  onQuestionLoaded,
  onAnswerSubmitted,
}) => {
  const [question, setQuestion] = useState<MoodleQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadQuestion = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const q = await moodleService.getQuestion(id);
      setQuestion(q);
      if (onQuestionLoaded) {
        onQuestionLoaded(q);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const loadRandomQuestion = async () => {
    setLoading(true);
    setError(null);

    try {
      const q = await moodleService.getRandomQuestion();
      setQuestion(q);
      if (onQuestionLoaded) {
        onQuestionLoaded(q);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadQuestion = () => {
    const id = parseInt(questionId, 10);
    if (isNaN(id) || id <= 0) {
      setError('Please enter a valid question ID');
      return;
    }
    loadQuestion(id);
  };

  const handleSubmitAnswer = async (answer: number) => {
    if (!question) return;

    setSubmitting(true);
    try {
      const result = await moodleService.submitAnswer(question.id, answer);
      if (onAnswerSubmitted) {
        onAnswerSubmitted(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="moodle-connector">
      <div className="connector-header">
        <h4>Moodle Connection</h4>
      </div>

      {/* Question Loader */}
      <div className="question-loader">
        <div className="input-group">
          <input
            type="text"
            placeholder="Question ID"
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLoadQuestion();
              }
            }}
            disabled={loading}
            className="question-input"
          />
          <button
            onClick={handleLoadQuestion}
            disabled={loading || !questionId}
            className="load-btn"
          >
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>

        <button
          onClick={loadRandomQuestion}
          disabled={loading}
          className="random-btn"
        >
          Load Random Question
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      {/* Question Display */}
      {question && (
        <div className="question-display">
          <div className="question-header">
            <span className="question-id">ID: {question.id}</span>
            <span className="question-type">{question.qtype}</span>
          </div>

          <div className="question-content">
            <h5>{question.name}</h5>
            <div
              className="question-text"
              dangerouslySetInnerHTML={{ __html: question.questiontext }}
            />
          </div>

          {question.questiondata && (
            <div className="question-metadata">
              <div className="metadata-item">
                <span className="label">Range:</span>
                <span className="value">
                  [{question.questiondata.min ?? '-∞'}, {question.questiondata.max ?? '+∞'}]
                </span>
              </div>
              {question.questiondata.correctAnswer !== undefined && (
                <div className="metadata-item">
                  <span className="label">Target:</span>
                  <span className="value">{question.questiondata.correctAnswer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status Indicator */}
      <div className="status-bar">
        <div className={`status-indicator ${question ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {question ? 'Question Loaded' : 'No Question'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MoodleConnector;
