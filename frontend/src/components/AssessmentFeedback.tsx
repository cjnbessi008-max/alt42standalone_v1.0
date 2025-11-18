/**
 * AssessmentFeedback Component
 *
 * Displays feedback for student answers with integrated vibration alerts
 * for high-risk wrong answer scenarios in LMS
 */

import React, { useEffect, useState, useCallback } from 'react';
import VibrationHandler, {
  VibrationConfig,
  RiskLevel,
  useVibration,
} from '../utils/VibrationHandler';
import './AssessmentFeedback.css';

interface FeedbackResponse {
  is_correct: boolean;
  feedback_text: string;
  next_action: 'retry' | 'continue' | 'review';
  attempt_number: number;
  risk_level?: RiskLevel;
  vibration?: VibrationConfig;
  assessment_details?: {
    attempt_count: number;
    concept_importance: number;
    time_spent_seconds: number;
    risk_score?: number;
  };
  timestamp: string;
}

interface AssessmentFeedbackProps {
  moduleId: string;
  problemId: string;
  studentId: string;
  response: FeedbackResponse;
  onRetry?: () => void;
  onContinue?: () => void;
  onReview?: () => void;
  enableVibration?: boolean;
}

export const AssessmentFeedback: React.FC<AssessmentFeedbackProps> = ({
  moduleId,
  problemId,
  studentId,
  response,
  onRetry,
  onContinue,
  onReview,
  enableVibration = true,
}) => {
  const [vibrationTriggered, setVibrationTriggered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const vibration = useVibration();

  // Trigger vibration when feedback is received
  useEffect(() => {
    if (
      enableVibration &&
      response.vibration?.trigger &&
      !vibrationTriggered
    ) {
      const success = VibrationHandler.vibrateFromConfig(response.vibration);

      if (success) {
        setVibrationTriggered(true);

        // Log vibration event to backend
        logVibrationEvent(response.vibration);
      } else {
        console.warn('Vibration failed or not supported');
      }
    }
  }, [response, enableVibration, vibrationTriggered]);

  // Log vibration event to analytics
  const logVibrationEvent = useCallback(
    async (vibrationConfig: VibrationConfig) => {
      try {
        const status = VibrationHandler.getStatus();

        await fetch(`/api/modules/${moduleId}/vibration/event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            problem_id: problemId,
            module_id: moduleId,
            pattern: vibrationConfig.pattern,
            device_supported: status.supported,
            user_agent: status.userAgent,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to log vibration event:', error);
      }
    },
    [moduleId, problemId, studentId]
  );

  // Get icon based on correctness and risk level
  const getIcon = () => {
    if (response.is_correct) {
      return '✅';
    }

    switch (response.risk_level) {
      case 'high':
        return '⚠️';
      case 'medium':
        return '❌';
      case 'low':
      default:
        return '🔄';
    }
  };

  // Get risk level badge
  const getRiskBadge = () => {
    if (response.is_correct || !response.risk_level) return null;

    const riskLabels = {
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
    };

    const riskColors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
    };

    return (
      <span
        className="risk-badge"
        style={{ backgroundColor: riskColors[response.risk_level] }}
      >
        {riskLabels[response.risk_level]}
      </span>
    );
  };

  // Handle action buttons
  const handleAction = () => {
    switch (response.next_action) {
      case 'retry':
        onRetry?.();
        break;
      case 'continue':
        onContinue?.();
        break;
      case 'review':
        onReview?.();
        break;
    }
  };

  // Get action button text
  const getActionText = () => {
    switch (response.next_action) {
      case 'retry':
        return 'Try Again';
      case 'continue':
        return 'Continue';
      case 'review':
        return 'Review Concept';
      default:
        return 'Next';
    }
  };

  return (
    <div
      className={`assessment-feedback ${
        response.is_correct ? 'correct' : 'incorrect'
      } ${response.risk_level ? `risk-${response.risk_level}` : ''}`}
    >
      <div className="feedback-header">
        <div className="feedback-icon">{getIcon()}</div>
        <div className="feedback-content">
          <h3 className="feedback-title">
            {response.is_correct ? 'Correct!' : 'Not Quite Right'}
          </h3>
          {getRiskBadge()}
        </div>
      </div>

      <div className="feedback-body">
        <p className="feedback-text">{response.feedback_text}</p>

        <div className="feedback-meta">
          <span className="attempt-count">
            Attempt {response.attempt_number}
          </span>
          {response.vibration?.trigger && vibrationTriggered && (
            <span className="vibration-indicator">
              📳 Haptic feedback provided
            </span>
          )}
        </div>

        {response.assessment_details && (
          <div className="assessment-details">
            <button
              className="details-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '▼' : '▶'} Assessment Details
            </button>

            {showDetails && (
              <div className="details-content">
                <div className="detail-item">
                  <span className="detail-label">Time Spent:</span>
                  <span className="detail-value">
                    {response.assessment_details.time_spent_seconds}s
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Concept Importance:</span>
                  <span className="detail-value">
                    {(
                      response.assessment_details.concept_importance * 100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                {response.assessment_details.risk_score !== undefined && (
                  <div className="detail-item">
                    <span className="detail-label">Risk Score:</span>
                    <span className="detail-value">
                      {(response.assessment_details.risk_score * 100).toFixed(
                        0
                      )}
                      %
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="feedback-actions">
        <button className="action-button primary" onClick={handleAction}>
          {getActionText()}
        </button>

        {!response.is_correct && response.attempt_number > 2 && (
          <button className="action-button secondary" onClick={onReview}>
            Get Help
          </button>
        )}
      </div>

      {/* Vibration settings indicator */}
      {enableVibration && !vibration.isSupported && (
        <div className="vibration-notice">
          ℹ️ Haptic feedback not supported on this device
        </div>
      )}

      {enableVibration && vibration.isSupported && !vibration.isEnabled && (
        <div className="vibration-notice">
          ℹ️ Haptic feedback is disabled in settings
        </div>
      )}
    </div>
  );
};

export default AssessmentFeedback;
