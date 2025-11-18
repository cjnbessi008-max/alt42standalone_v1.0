/**
 * 자신감 회복 모드 알림 컴포넌트
 * Confidence Recovery Mode Notification Component
 */

import React, { useState, useEffect } from 'react';
import './ConfidenceRecoveryNotification.css';

interface RecoveryPathPhase {
  phase: string;
  difficulty: number;
  description: string;
  required_successes: number;
}

interface ConfidenceNotificationData {
  show_notification: boolean;
  title?: string;
  message?: string;
  current_difficulty?: number;
  recommended_difficulty?: number;
  trigger_reason_text?: string;
  estimated_time_text?: string;
  recovery_path?: RecoveryPathPhase[];
}

interface ConfidenceRecoveryNotificationProps {
  studentId: string;
  moduleId: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

const ConfidenceRecoveryNotification: React.FC<ConfidenceRecoveryNotificationProps> = ({
  studentId,
  moduleId,
  onAccept,
  onDecline
}) => {
  const [notificationData, setNotificationData] = useState<ConfidenceNotificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchNotificationData();
  }, [studentId, moduleId]);

  const fetchNotificationData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/confidence-recovery/students/${studentId}/ui-notification?module_id=${moduleId}`
      );
      const data = await response.json();
      setNotificationData(data);
    } catch (error) {
      console.error('Failed to fetch notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!notificationData) return;

    try {
      const response = await fetch(
        `/api/confidence-recovery/students/${studentId}/apply-difficulty-adjustment?module_id=${moduleId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adjustment_type: 'downward',
            target_difficulty: notificationData.recommended_difficulty,
            reason: 'confidence_recovery'
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (onAccept) {
          onAccept();
        }
        // 알림 숨기기
        setNotificationData({ show_notification: false });
      }
    } catch (error) {
      console.error('Failed to apply difficulty adjustment:', error);
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
    setNotificationData({ show_notification: false });
  };

  const renderDifficultyStars = (level: number) => {
    return '★'.repeat(level) + '☆'.repeat(5 - level);
  };

  if (isLoading) {
    return (
      <div className="confidence-notification-loading">
        <div className="spinner"></div>
        <p>자신감 분석 중...</p>
      </div>
    );
  }

  if (!notificationData || !notificationData.show_notification) {
    return null;
  }

  return (
    <div className="confidence-notification-overlay">
      <div className="confidence-notification-modal">
        <div className="notification-header">
          <span className="notification-icon">💪</span>
          <h2>{notificationData.title}</h2>
        </div>

        <div className="notification-body">
          <p className="notification-message">{notificationData.message}</p>

          <div className="difficulty-comparison">
            <div className="difficulty-item current">
              <label>현재 난이도:</label>
              <div className="difficulty-stars">
                {renderDifficultyStars(notificationData.current_difficulty || 4)}
              </div>
              <span className="difficulty-level">
                ({notificationData.current_difficulty}단계)
              </span>
            </div>

            <div className="difficulty-arrow">→</div>

            <div className="difficulty-item recommended">
              <label>추천 난이도:</label>
              <div className="difficulty-stars">
                {renderDifficultyStars(notificationData.recommended_difficulty || 2)}
              </div>
              <span className="difficulty-level">
                ({notificationData.recommended_difficulty}단계)
              </span>
            </div>
          </div>

          {notificationData.trigger_reason_text && (
            <div className="trigger-reason">
              <strong>이유:</strong> {notificationData.trigger_reason_text}
            </div>
          )}

          {notificationData.estimated_time_text && (
            <div className="estimated-time">
              <strong>예상 시간:</strong> {notificationData.estimated_time_text}
            </div>
          )}

          {notificationData.recovery_path && notificationData.recovery_path.length > 0 && (
            <div className="recovery-path-section">
              <button
                className="toggle-details-button"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? '▼ 회복 경로 숨기기' : '▶ 회복 경로 보기'}
              </button>

              {showDetails && (
                <div className="recovery-path-details">
                  <h4>회복 단계:</h4>
                  <ol className="recovery-path-list">
                    {notificationData.recovery_path.map((phase, index) => (
                      <li key={index} className="recovery-phase-item">
                        <div className="phase-difficulty">
                          난이도 {phase.difficulty}
                        </div>
                        <div className="phase-description">
                          {phase.description}
                        </div>
                        <div className="phase-requirement">
                          (연속 {phase.required_successes}개 정답 필요)
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="notification-footer">
          <button
            className="btn-accept"
            onClick={handleAccept}
          >
            자신감 회복 모드 시작
          </button>
          <button
            className="btn-decline"
            onClick={handleDecline}
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceRecoveryNotification;
