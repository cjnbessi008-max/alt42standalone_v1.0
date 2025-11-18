import React from 'react';
import type { TriggeredWarning } from '../types';
import { WarningSeverity } from '../types';

interface ConceptWarningProps {
  warning: TriggeredWarning;
  language?: 'en' | 'kr';
  onAcknowledge: (warningId: string) => void;
  onDismiss: (warningId: string) => void;
}

export const ConceptWarning: React.FC<ConceptWarningProps> = ({
  warning,
  language = 'kr',
  onAcknowledge,
  onDismiss
}) => {
  const { conceptPair, warningId } = warning;

  const getSeverityColor = (severity: WarningSeverity): string => {
    switch (severity) {
      case WarningSeverity.CRITICAL:
        return '#dc2626'; // red-600
      case WarningSeverity.HIGH:
        return '#ea580c'; // orange-600
      case WarningSeverity.MEDIUM:
        return '#f59e0b'; // amber-500
      case WarningSeverity.LOW:
        return '#3b82f6'; // blue-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getSeverityLabel = (severity: WarningSeverity): string => {
    const labels = {
      kr: {
        critical: '매우 중요',
        high: '중요',
        medium: '보통',
        low: '참고'
      },
      en: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low'
      }
    };

    return labels[language][severity] || severity;
  };

  return (
    <div
      style={{
        border: `2px solid ${getSeverityColor(conceptPair.severity)}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: 'bold' }}>
            {language === 'kr' ? '개념 혼동 주의' : 'Concept Confusion Warning'}
          </h3>
        </div>
        <span
          style={{
            backgroundColor: getSeverityColor(conceptPair.severity),
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {getSeverityLabel(conceptPair.severity)}
        </span>
      </div>

      {/* Warning Message */}
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#78350f' }}>
          {language === 'kr' ? conceptPair.warningMessageKr : conceptPair.warningMessage}
        </p>
      </div>

      {/* Concept Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* Concept A */}
        <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #3b82f6' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '14px', fontWeight: 'bold' }}>
            {language === 'kr' ? conceptPair.conceptAKr : conceptPair.conceptA}
          </h4>
          {conceptPair.exampleA && (
            <div style={{ fontSize: '12px', color: '#1e3a8a', marginTop: '8px' }}>
              <strong>{language === 'kr' ? '예시:' : 'Example:'}</strong>
              <pre style={{ margin: '4px 0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {conceptPair.exampleA}
              </pre>
            </div>
          )}
        </div>

        {/* Concept B */}
        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #22c55e' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '14px', fontWeight: 'bold' }}>
            {language === 'kr' ? conceptPair.conceptBKr : conceptPair.conceptB}
          </h4>
          {conceptPair.exampleB && (
            <div style={{ fontSize: '12px', color: '#14532d', marginTop: '8px' }}>
              <strong>{language === 'kr' ? '예시:' : 'Example:'}</strong>
              <pre style={{ margin: '4px 0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {conceptPair.exampleB}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Differentiation Tip */}
      {conceptPair.differentiationTip && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#ecfccb', borderRadius: '6px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#3f6212', fontSize: '14px', fontWeight: 'bold' }}>
            💡 {language === 'kr' ? '구분 팁' : 'Differentiation Tip'}
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#365314', lineHeight: '1.5' }}>
            {language === 'kr' ? conceptPair.differentiationTipKr : conceptPair.differentiationTip}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onDismiss(warningId)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {language === 'kr' ? '나중에' : 'Later'}
        </button>
        <button
          onClick={() => onAcknowledge(warningId)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {language === 'kr' ? '이해했어요' : 'Got it!'}
        </button>
      </div>
    </div>
  );
};

export default ConceptWarning;
