/**
 * 워밍업 문제 추천 메인 컴포넌트
 */
import React, { useState, useEffect } from 'react';
import warmupAPI from '../services/api';
import {
  Problem,
  WarmupRecommendationResponse,
  DifficultyLabels,
  SubjectLabels,
  ProblemTypeLabels
} from '../types/problem';
import './WarmupProblemRecommender.css';

interface WarmupProblemRecommenderProps {
  studentId: string;
  currentProblemId?: string;
}

const WarmupProblemRecommender: React.FC<WarmupProblemRecommenderProps> = ({
  studentId,
  currentProblemId
}) => {
  const [recommendation, setRecommendation] = useState<WarmupRecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  /**
   * 워밍업 문제 추천 요청
   */
  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);
    setSubmitted(false);
    setSubmitResult(null);
    setAnswer('');
    setStartTime(Date.now());

    try {
      const response = await warmupAPI.recommendProblem({
        student_id: studentId,
        current_problem_id: currentProblemId
      });

      setRecommendation(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '문제 추천 중 오류가 발생했습니다.');
      console.error('Recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 답안 제출
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recommendation || !answer.trim()) {
      alert('답을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
      const result = await warmupAPI.submitAnswer(
        studentId,
        recommendation.recommended_problem.id,
        answer,
        timeSpentSeconds
      );

      setSubmitResult(result);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || '답안 제출 중 오류가 발생했습니다.');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 다음 문제 요청
   */
  const handleNextProblem = () => {
    fetchRecommendation();
  };

  /**
   * 초기 로드시 추천 문제 가져오기
   */
  useEffect(() => {
    fetchRecommendation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="warmup-recommender">
      <div className="warmup-header">
        <h1>🔥 워밍업 문제 추천</h1>
        <p className="subtitle">동일 유형의 쉬운 문제로 워밍업하세요!</p>
      </div>

      {loading && !recommendation && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>문제를 추천하고 있습니다...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>오류:</strong> {error}
          <button onClick={fetchRecommendation} className="retry-button">
            다시 시도
          </button>
        </div>
      )}

      {recommendation && !loading && (
        <div className="problem-container">
          {/* 추천 정보 */}
          <div className="recommendation-info">
            <div className="info-badge">
              <span className="label">추천 이유:</span>
              <span className="value">{recommendation.reason}</span>
            </div>
            <div className="info-badge confidence">
              <span className="label">신뢰도:</span>
              <span className="value">
                {(recommendation.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* 문제 정보 */}
          <div className="problem-card">
            <div className="problem-header">
              <h2>{recommendation.recommended_problem.title}</h2>
              <div className="problem-meta">
                <span className="badge subject">
                  {SubjectLabels[recommendation.recommended_problem.subject]}
                </span>
                <span className="badge difficulty">
                  {DifficultyLabels[recommendation.recommended_problem.difficulty]}
                </span>
                <span className="badge type">
                  {ProblemTypeLabels[recommendation.recommended_problem.problem_type]}
                </span>
                <span className="badge time">
                  ⏱️ {recommendation.recommended_problem.estimated_time_minutes}분
                </span>
              </div>
            </div>

            <div className="problem-content">
              <p>{recommendation.recommended_problem.content}</p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="answer-form">
                <div className="form-group">
                  <label htmlFor="answer">답:</label>
                  <input
                    type="text"
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="답을 입력하세요"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? '제출 중...' : '제출하기'}
                </button>
              </form>
            ) : (
              <div className={`result-container ${submitResult?.is_correct ? 'correct' : 'incorrect'}`}>
                <div className="result-message">
                  <h3>{submitResult?.message}</h3>
                </div>

                <div className="result-details">
                  {!submitResult?.is_correct && (
                    <div className="correct-answer">
                      <strong>정답:</strong> {submitResult?.correct_answer}
                    </div>
                  )}

                  {submitResult?.explanation && (
                    <div className="explanation">
                      <strong>해설:</strong>
                      <p>{submitResult.explanation}</p>
                    </div>
                  )}

                  {submitResult?.lms_synced && (
                    <div className="lms-sync-status">
                      ✓ LMS에 결과가 동기화되었습니다.
                    </div>
                  )}
                </div>

                <button onClick={handleNextProblem} className="next-button">
                  다음 워밍업 문제 →
                </button>
              </div>
            )}
          </div>

          {/* 태그 */}
          {recommendation.recommended_problem.tags.length > 0 && (
            <div className="problem-tags">
              {recommendation.recommended_problem.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WarmupProblemRecommender;
