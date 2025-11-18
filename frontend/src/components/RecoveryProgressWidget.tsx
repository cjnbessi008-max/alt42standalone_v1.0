/**
 * 자신감 회복 진행 상황 위젯
 * Recovery Progress Widget Component
 */

import React, { useState, useEffect } from 'react';
import './RecoveryProgressWidget.css';

interface RecoveryProgressData {
  student_id: string;
  module_id: string;
  in_recovery_mode: boolean;
  current_phase: string | null;
  progress_percentage: number;
  problems_completed: number;
  problems_remaining: number;
  confidence_score: number;
  confidence_gain: number;
  current_difficulty: number;
  original_difficulty: number;
}

interface RecentAttempt {
  is_correct: boolean;
  timestamp: string;
}

interface RecoveryProgressWidgetProps {
  studentId: string;
  moduleId: string;
  refreshInterval?: number; // 밀리초, 기본 5초
}

const RecoveryProgressWidget: React.FC<RecoveryProgressWidgetProps> = ({
  studentId,
  moduleId,
  refreshInterval = 5000
}) => {
  const [progressData, setProgressData] = useState<RecoveryProgressData | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
    const interval = setInterval(fetchProgressData, refreshInterval);
    return () => clearInterval(interval);
  }, [studentId, moduleId, refreshInterval]);

  const fetchProgressData = async () => {
    try {
      const response = await fetch(
        `/api/confidence-recovery/students/${studentId}/recovery-progress?module_id=${moduleId}`
      );
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);

        // 최근 시도 데이터도 가져오기 (실제로는 별도 API 호출)
        // 여기서는 샘플 데이터 사용
        setRecentAttempts([
          { is_correct: true, timestamp: new Date(Date.now() - 600000).toISOString() },
          { is_correct: true, timestamp: new Date(Date.now() - 480000).toISOString() },
          { is_correct: false, timestamp: new Date(Date.now() - 360000).toISOString() },
          { is_correct: true, timestamp: new Date(Date.now() - 240000).toISOString() },
          { is_correct: true, timestamp: new Date(Date.now() - 120000).toISOString() },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch recovery progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPhaseText = (phase: string | null): string => {
    switch (phase) {
      case 'immediate_downward':
        return '쉬운 문제로 자신감 회복 중';
      case 'gradual_return':
        return '점진적으로 난이도 복귀 중';
      case 'completed':
        return '회복 완료!';
      default:
        return '진행 중';
    }
  };

  const renderProgressBar = () => {
    if (!progressData) return null;

    const percentage = progressData.progress_percentage;
    const segments = 10;
    const filledSegments = Math.floor((percentage / 100) * segments);

    return (
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          {Array.from({ length: segments }).map((_, index) => (
            <div
              key={index}
              className={`progress-segment ${index < filledSegments ? 'filled' : ''}`}
            />
          ))}
        </div>
        <div className="progress-percentage">{percentage.toFixed(0)}%</div>
      </div>
    );
  };

  const renderRecentAttempts = () => {
    return (
      <div className="recent-attempts">
        <label>최근 성과:</label>
        <div className="attempts-icons">
          {recentAttempts.map((attempt, index) => (
            <span
              key={index}
              className={`attempt-icon ${attempt.is_correct ? 'correct' : 'incorrect'}`}
              title={attempt.is_correct ? '정답' : '오답'}
            >
              {attempt.is_correct ? '✓' : '✗'}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderConfidenceScore = () => {
    if (!progressData) return null;

    const score = progressData.confidence_score;
    const gain = progressData.confidence_gain;

    return (
      <div className="confidence-score-display">
        <label>신뢰도 점수:</label>
        <div className="score-value-container">
          <div className="score-value">{score}/100</div>
          {gain > 0 && (
            <div className="score-gain">
              <span className="gain-arrow">↑</span>
              <span className="gain-value">{gain}</span>
            </div>
          )}
        </div>
        <div className="score-bar">
          <div
            className="score-fill"
            style={{
              width: `${score}%`,
              backgroundColor: score < 40 ? '#ff6b6b' : score < 70 ? '#ffa94d' : '#51cf66'
            }}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="recovery-widget loading">
        <div className="widget-spinner"></div>
      </div>
    );
  }

  if (!progressData || !progressData.in_recovery_mode) {
    return null;
  }

  return (
    <div className="recovery-progress-widget">
      <div className="widget-header">
        <span className="widget-icon">🌱</span>
        <h3>자신감 회복 진행 중</h3>
      </div>

      <div className="widget-body">
        <div className="current-phase">
          {getPhaseText(progressData.current_phase)}
        </div>

        {renderProgressBar()}

        <div className="progress-details">
          <div className="detail-item">
            <span className="detail-label">현재 단계:</span>
            <span className="detail-value">
              {progressData.current_difficulty}단계 문제
              ({progressData.problems_completed}개 중 {progressData.problems_completed}개 완료)
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">다음 단계:</span>
            <span className="detail-value">
              {progressData.current_difficulty + 1}단계로 복귀
              (연속 2개 정답 필요)
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">남은 문제:</span>
            <span className="detail-value">{progressData.problems_remaining}개</span>
          </div>
        </div>

        {renderRecentAttempts()}
        {renderConfidenceScore()}
      </div>

      <div className="widget-footer">
        <div className="encouragement-message">
          {progressData.progress_percentage < 50
            ? '잘하고 있어요! 계속 진행해보세요 💪'
            : progressData.progress_percentage < 80
            ? '반 이상 완료했어요! 조금만 더 힘내세요 🎉'
            : '거의 다 왔어요! 마지막까지 화이팅! 🚀'}
        </div>
      </div>
    </div>
  );
};

export default RecoveryProgressWidget;
