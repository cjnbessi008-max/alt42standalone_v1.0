/**
 * Mistake Warning Alert Component
 * Displays AI-generated warnings based on past mistake patterns
 */
import React from 'react';
import { MistakeWarning } from '../types';
import './MistakeWarningAlert.css';

interface MistakeWarningAlertProps {
  warnings: MistakeWarning[];
  onDismiss: (warningId: string) => void;
  recommendedFocusAreas?: string[];
}

const MistakeWarningAlert: React.FC<MistakeWarningAlertProps> = ({
  warnings,
  onDismiss,
  recommendedFocusAreas = [],
}) => {
  if (warnings.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getSeverityClass = (severity: string) => {
    return `warning-alert-${severity}`;
  };

  return (
    <div className="mistake-warning-container">
      <div className="warning-header">
        <h3>💡 실수 방지 도우미</h3>
        <p className="warning-subtitle">
          과거 학습 패턴을 분석한 결과, 이 문제에서 주의가 필요합니다
        </p>
      </div>

      <div className="warnings-list">
        {warnings.map((warning) => (
          <div
            key={warning.id}
            className={`warning-card ${getSeverityClass(warning.severity)}`}
          >
            <div className="warning-content">
              <div className="warning-icon">
                {getSeverityIcon(warning.severity)}
              </div>
              <div className="warning-message">
                <div className="warning-type">{warning.warning_type}</div>
                <p>{warning.message}</p>
              </div>
              <button
                className="dismiss-button"
                onClick={() => onDismiss(warning.id)}
                aria-label="경고 닫기"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {recommendedFocusAreas.length > 0 && (
        <div className="focus-areas">
          <h4>집중해서 확인하세요:</h4>
          <div className="focus-tags">
            {recommendedFocusAreas.map((area, index) => (
              <span key={index} className="focus-tag">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MistakeWarningAlert;
