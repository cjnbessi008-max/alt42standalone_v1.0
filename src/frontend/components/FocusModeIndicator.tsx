/**
 * Focus Mode Indicator Component
 * Displays current focus state with visual feedback
 */

import React from 'react';
import type { FocusState, FocusMetrics } from '../types/focus-mode.types';

interface FocusModeIndicatorProps {
  focusMetrics: FocusMetrics;
  className?: string;
}

const FOCUS_STATE_CONFIG = {
  focused: {
    label: '집중 중',
    labelEn: 'Focused',
    color: '#10b981', // green
    bgColor: '#d1fae5',
    icon: '🎯',
    description: '높은 집중도',
  },
  normal: {
    label: '보통',
    labelEn: 'Normal',
    color: '#3b82f6', // blue
    bgColor: '#dbeafe',
    icon: '👀',
    description: '정상 상태',
  },
  distracted: {
    label: '산만함',
    labelEn: 'Distracted',
    color: '#f59e0b', // amber
    bgColor: '#fef3c7',
    icon: '😵',
    description: '주의 산만',
  },
  unknown: {
    label: '측정 중...',
    labelEn: 'Measuring...',
    color: '#6b7280', // gray
    bgColor: '#f3f4f6',
    icon: '⏱️',
    description: '데이터 수집 중',
  },
};

export const FocusModeIndicator: React.FC<FocusModeIndicatorProps> = ({
  focusMetrics,
  className = '',
}) => {
  const { state, blinksPerMinute, confidenceScore } = focusMetrics;
  const config = FOCUS_STATE_CONFIG[state];

  return (
    <div
      className={`focus-mode-indicator ${className}`}
      style={{
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: config.bgColor,
        border: `2px solid ${config.color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Icon */}
        <div
          style={{
            fontSize: '32px',
            lineHeight: 1,
          }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: config.color,
              }}
            >
              {config.label}
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: 500,
              }}
            >
              {config.labelEn}
            </span>
          </div>

          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: '#4b5563',
            }}
          >
            {config.description}
          </p>

          {/* Metrics */}
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              gap: '16px',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            <div>
              깜빡임: <strong>{blinksPerMinute.toFixed(1)}</strong>/분
            </div>
            <div>
              신뢰도: <strong>{(confidenceScore * 100).toFixed(0)}%</strong>
            </div>
          </div>
        </div>

        {/* Pulse animation for focused state */}
        {state === 'focused' && (
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: config.color,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};
