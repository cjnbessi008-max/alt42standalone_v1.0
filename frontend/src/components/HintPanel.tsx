import { useState } from 'react';
import { HintLevel, HintResponse } from '@shared/types';
import { HintService } from '../services/hintService';
import './HintPanel.css';

interface HintPanelProps {
  studentId: string;
  problemId: string;
  onHintReceived?: (hint: HintResponse) => void;
}

export function HintPanel({ studentId, problemId, onHintReceived }: HintPanelProps) {
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState('');

  const handleRequestHint = async (level: HintLevel) => {
    setLoading(true);
    setError(null);

    try {
      const hint = await HintService.requestHint(studentId, problemId, level, {
        currentAttempt: currentAttempt || undefined,
        previousHints: hints.map((h) => h.content),
        timeSpent: undefined, // Could track time in a real implementation
      });

      setHints((prev) => [...prev, hint]);
      onHintReceived?.(hint);
    } catch (err) {
      setError(err instanceof Error ? err.message : '힌트를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getHintLevelLabel = (level: HintLevel): string => {
    switch (level) {
      case HintLevel.LEVEL_1:
        return '가벼운 힌트';
      case HintLevel.LEVEL_2:
        return '중간 힌트';
      case HintLevel.LEVEL_3:
        return '자세한 힌트';
      default:
        return '힌트';
    }
  };

  const getHintLevelDescription = (level: HintLevel): string => {
    switch (level) {
      case HintLevel.LEVEL_1:
        return '문제를 푸는 방향을 제시합니다';
      case HintLevel.LEVEL_2:
        return '구체적인 단계를 안내합니다';
      case HintLevel.LEVEL_3:
        return '상세한 설명을 제공합니다';
      default:
        return '';
    }
  };

  return (
    <div className="hint-panel">
      <div className="hint-panel-header">
        <h3>💡 힌트 시스템</h3>
        <p className="hint-panel-description">
          막히셨나요? 3단계 힌트를 활용해보세요!
        </p>
      </div>

      {/* Current Attempt Input */}
      <div className="current-attempt-section">
        <label htmlFor="current-attempt">현재 풀이 시도 (선택사항)</label>
        <textarea
          id="current-attempt"
          className="current-attempt-input"
          value={currentAttempt}
          onChange={(e) => setCurrentAttempt(e.target.value)}
          placeholder="현재 어떻게 풀고 있는지 적어주세요..."
          rows={3}
        />
      </div>

      {/* Hint Level Buttons */}
      <div className="hint-buttons">
        {[HintLevel.LEVEL_1, HintLevel.LEVEL_2, HintLevel.LEVEL_3].map((level) => (
          <button
            key={level}
            className={`hint-button hint-level-${level}`}
            onClick={() => handleRequestHint(level)}
            disabled={loading}
          >
            <div className="hint-button-content">
              <span className="hint-level-badge">Level {level}</span>
              <span className="hint-level-label">{getHintLevelLabel(level)}</span>
              <span className="hint-level-description">
                {getHintLevelDescription(level)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="hint-loading">
          <div className="spinner"></div>
          <p>AI가 힌트를 생성하고 있습니다...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="hint-error">
          <p>❌ {error}</p>
        </div>
      )}

      {/* Hints Display */}
      {hints.length > 0 && (
        <div className="hints-display">
          <h4>받은 힌트들</h4>
          {hints.map((hint) => (
            <div key={hint.id} className={`hint-card hint-level-${hint.level}`}>
              <div className="hint-card-header">
                <span className="hint-level-badge">Level {hint.level}</span>
                <span className="hint-timestamp">
                  {new Date(hint.generatedAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <div className="hint-content">{hint.content}</div>
              {hint.metadata && (
                <div className="hint-metadata">
                  생성 시간: {hint.metadata.generationTime?.toFixed(2)}초
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
