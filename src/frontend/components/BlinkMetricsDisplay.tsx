/**
 * Blink Metrics Display Component
 * Shows detailed blink statistics
 */

import React from 'react';
import type { BlinkMetrics } from '../types/focus-mode.types';

interface BlinkMetricsDisplayProps {
  metrics: BlinkMetrics;
  showDetails?: boolean;
  className?: string;
}

export const BlinkMetricsDisplay: React.FC<BlinkMetricsDisplayProps> = ({
  metrics,
  showDetails = true,
  className = '',
}) => {
  const { totalBlinks, blinksPerMinute, averageBlinkDuration, lastBlinkTimestamp } = metrics;

  const timeSinceLastBlink = lastBlinkTimestamp
    ? ((Date.now() - lastBlinkTimestamp) / 1000).toFixed(1)
    : 'N/A';

  const getBlinkRateStatus = (rate: number): { label: string; color: string } => {
    if (rate <= 10) return { label: '집중', color: '#10b981' };
    if (rate <= 20) return { label: '정상', color: '#3b82f6' };
    return { label: '산만', color: '#f59e0b' };
  };

  const status = getBlinkRateStatus(blinksPerMinute);

  return (
    <div
      className={`blink-metrics ${className}`}
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <h4
        style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        👁️ 눈 깜빡임 메트릭
      </h4>

      {/* Main metric */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: status.color,
          }}
        >
          {blinksPerMinute.toFixed(1)}
        </span>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>
          blinks/min
        </span>
        <span
          style={{
            marginLeft: 'auto',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            color: status.color,
            backgroundColor: `${status.color}20`,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Reference ranges */}
      <div
        style={{
          marginBottom: showDetails ? '16px' : 0,
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#6b7280',
        }}
      >
        <div style={{ marginBottom: '4px', fontWeight: 600 }}>참고 범위:</div>
        <div>🎯 집중: ≤10/분 | 😊 정상: 15-20/분 | 😵 산만: ≥25/분</div>
      </div>

      {/* Detailed metrics */}
      {showDetails && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <MetricItem
            label="총 깜빡임"
            value={totalBlinks.toString()}
            unit="회"
          />
          <MetricItem
            label="평균 지속시간"
            value={averageBlinkDuration.toFixed(0)}
            unit="ms"
          />
          <MetricItem
            label="마지막 깜빡임"
            value={timeSinceLastBlink}
            unit="초 전"
          />
          <MetricItem
            label="측정 상태"
            value={totalBlinks > 0 ? '활성' : '대기 중'}
            valueColor={totalBlinks > 0 ? '#10b981' : '#6b7280'}
          />
        </div>
      )}
    </div>
  );
};

interface MetricItemProps {
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({
  label,
  value,
  unit,
  valueColor = '#111827',
}) => {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: valueColor }}>
        {value}
        {unit && <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '4px' }}>{unit}</span>}
      </div>
    </div>
  );
};
