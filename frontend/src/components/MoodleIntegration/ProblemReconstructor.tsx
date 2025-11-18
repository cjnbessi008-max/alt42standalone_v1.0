/**
 * Problem Reconstructor Component
 *
 * Main UI for reconstructing problems from Moodle using various strategies
 */

import React, { useState } from 'react';
import {
  moodleApi,
  ReconstructionStrategy,
  ReconstructedProblem,
  STRATEGY_INFO,
  getComplexityColor,
  getComplexityLabel,
} from '../../services/moodleApi';
import './ProblemReconstructor.css';

interface ProblemReconstructorProps {
  quizId?: number;
  questionId?: number;
}

export const ProblemReconstructor: React.FC<ProblemReconstructorProps> = ({
  quizId,
  questionId: initialQuestionId,
}) => {
  const [questionId, setQuestionId] = useState<string>(
    initialQuestionId?.toString() || ''
  );
  const [selectedQuizId, setSelectedQuizId] = useState<string>(
    quizId?.toString() || ''
  );
  const [strategy, setStrategy] = useState<ReconstructionStrategy>(
    'reverse_solution'
  );
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [isReconstruct ing, setIsReconstructing] = useState(false);
  const [reconstructedProblem, setReconstructedProblem] =
    useState<ReconstructedProblem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  const handleReconstruct = async () => {
    setIsReconstructing(true);
    setError(null);
    setReconstructedProblem(null);

    try {
      const qId = parseInt(questionId);
      if (isNaN(qId)) {
        throw new Error('유효한 문제 ID를 입력하세요');
      }

      const result = await moodleApi.reconstructProblem(qId, strategy, language);
      setReconstructedProblem(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '재구성 실패');
    } finally {
      setIsReconstructing(false);
    }
  };

  const handleBatchReconstruct = async () => {
    setIsReconstructing(true);
    setError(null);

    try {
      const qzId = parseInt(selectedQuizId);
      if (isNaN(qzId)) {
        throw new Error('유효한 Quiz ID를 입력하세요');
      }

      const result = await moodleApi.batchReconstructQuiz(qzId, strategy, language);

      // For batch, we'll show a summary (could expand to show all problems)
      alert(
        `✅ ${result.total_questions}개 문제 재구성 완료!\n\n` +
          `복잡도 분포:\n` +
          `- 단순: ${result.summary.by_complexity.simple}\n` +
          `- 보통: ${result.summary.by_complexity.moderate}\n` +
          `- 복잡: ${result.summary.by_complexity.complex}\n` +
          `- 매우 복잡: ${result.summary.by_complexity.very_complex}`
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '배치 재구성 실패');
    } finally {
      setIsReconstructing(false);
    }
  };

  return (
    <div className="problem-reconstructor">
      <div className="reconstructor-header">
        <h2>🔄 문제 역구성 도구</h2>
        <p className="subtitle">
          Moodle 문제를 다양한 전략으로 재구성합니다
        </p>
      </div>

      {/* Mode Selection */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}
        >
          📝 단일 문제
        </button>
        <button
          className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
          onClick={() => setMode('batch')}
        >
          📚 Quiz 전체
        </button>
      </div>

      <div className="reconstructor-form">
        {/* Input Section */}
        <div className="form-section">
          <h3>1️⃣ 문제 선택</h3>
          {mode === 'single' ? (
            <div className="form-group">
              <label htmlFor="questionId">문제 ID</label>
              <input
                id="questionId"
                type="number"
                placeholder="예: 456"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                disabled={isReconstructing}
                className="form-input"
              />
              <span className="help-text">
                Moodle에서 재구성할 문제의 ID를 입력하세요
              </span>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="quizId">Quiz ID</label>
              <input
                id="quizId"
                type="number"
                placeholder="예: 123"
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                disabled={isReconstructing}
                className="form-input"
              />
              <span className="help-text">
                Quiz의 모든 문제를 한번에 재구성합니다
              </span>
            </div>
          )}
        </div>

        {/* Strategy Selection */}
        <div className="form-section">
          <h3>2️⃣ 재구성 전략 선택</h3>
          <div className="strategy-grid">
            {(Object.keys(STRATEGY_INFO) as ReconstructionStrategy[]).map(
              (s) => (
                <div
                  key={s}
                  className={`strategy-card ${strategy === s ? 'selected' : ''}`}
                  onClick={() => setStrategy(s)}
                >
                  <div className="strategy-header">
                    <input
                      type="radio"
                      name="strategy"
                      checked={strategy === s}
                      onChange={() => setStrategy(s)}
                      disabled={isReconstructing}
                    />
                    <strong>{STRATEGY_INFO[s].title}</strong>
                  </div>
                  <p className="strategy-description">
                    {STRATEGY_INFO[s].description}
                  </p>
                  <p className="strategy-usecase">
                    💡 {STRATEGY_INFO[s].useCase}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="form-section">
          <h3>3️⃣ 언어 설정</h3>
          <div className="language-selector">
            <button
              className={`lang-btn ${language === 'ko' ? 'active' : ''}`}
              onClick={() => setLanguage('ko')}
              disabled={isReconstructing}
            >
              🇰🇷 한국어
            </button>
            <button
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
              disabled={isReconstructing}
            >
              🇺🇸 English
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="btn-reconstruct"
          onClick={mode === 'single' ? handleReconstruct : handleBatchReconstruct}
          disabled={
            isReconstructing ||
            (mode === 'single' ? !questionId : !selectedQuizId)
          }
        >
          {isReconstructing ? '🔄 재구성 중...' : '🚀 재구성 시작'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <strong>❌ 오류 발생</strong>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Results Display */}
      {reconstructedProblem && (
        <div className="reconstruction-results">
          <h3>📊 재구성 결과</h3>

          <div className="result-card">
            <div className="result-header">
              <h4>원본 문제</h4>
              <span
                className="complexity-badge"
                style={{
                  background: getComplexityColor(
                    reconstructedProblem.structure.complexity_level
                  ),
                }}
              >
                {getComplexityLabel(
                  reconstructedProblem.structure.complexity_level
                )}
              </span>
            </div>
            <div className="result-content">
              <p>{reconstructedProblem.original_text}</p>
            </div>
          </div>

          <div className="arrow-down">⬇️</div>

          <div className="result-card highlight">
            <div className="result-header">
              <h4>재구성된 문제</h4>
              <span className="strategy-tag">
                {STRATEGY_INFO[strategy].title}
              </span>
            </div>
            <div className="result-content">
              <pre>{reconstructedProblem.reconstructed_text}</pre>
            </div>
          </div>

          {/* Problem Structure */}
          <div className="structure-analysis">
            <h4>🔍 문제 구조 분석</h4>
            <div className="structure-grid">
              <div className="structure-item">
                <strong>주제:</strong> {reconstructedProblem.structure.topic}
              </div>
              <div className="structure-item">
                <strong>연산:</strong> {reconstructedProblem.structure.operation}
              </div>
              <div className="structure-item">
                <strong>개체 수:</strong>{' '}
                {reconstructedProblem.structure.entities.length}
              </div>
              <div className="structure-item">
                <strong>조건 수:</strong>{' '}
                {reconstructedProblem.structure.conditions.length}
              </div>
            </div>
          </div>

          {/* Variations */}
          {reconstructedProblem.variations.length > 0 && (
            <div className="variations">
              <h4>🎨 가능한 변형</h4>
              <ul>
                {reconstructedProblem.variations.map((variation, idx) => (
                  <li key={idx}>{variation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Complexity Metrics */}
          <div className="complexity-metrics">
            <h4>📈 복잡도 지표</h4>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">조건 수</span>
                <span className="metric-value">
                  {reconstructedProblem.complexity_metrics.condition_count}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">중첩 깊이</span>
                <span className="metric-value">
                  {reconstructedProblem.complexity_metrics.nesting_depth}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">개체 수</span>
                <span className="metric-value">
                  {reconstructedProblem.complexity_metrics.entity_count}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">순환 의존성</span>
                <span className="metric-value">
                  {reconstructedProblem.complexity_metrics
                    .has_cyclical_dependencies
                    ? '있음'
                    : '없음'}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {reconstructedProblem.complexity_assessment.recommendations.length >
            0 && (
            <div className="recommendations">
              <h4>💡 권장사항</h4>
              <ul>
                {reconstructedProblem.complexity_assessment.recommendations.map(
                  (rec, idx) => (
                    <li key={idx}>{rec}</li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
