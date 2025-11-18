/**
 * Brain Status Widget Component
 * 뇌 상태 모니터링 위젯
 */

import React from 'react';
import { useCalmMode } from './CalmModeProvider';

export const BrainStatusWidget = () => {
  const { brainStatus, isCalmMode } = useCalmMode();

  if (!brainStatus.metrics) {
    return null;
  }

  const { cognitiveLoad, metrics } = brainStatus;
  const loadPercentage = (cognitiveLoad * 100).toFixed(0);

  // 인지 부하 수준에 따른 상태
  let statusText, statusColor;
  if (cognitiveLoad < 0.5) {
    statusText = '정상';
    statusColor = '#4caf50';
  } else if (cognitiveLoad < 0.75) {
    statusText = '주의';
    statusColor = '#ff9800';
  } else {
    statusText = '과열';
    statusColor = '#f44336';
  }

  return (
    <div className="brain-status-widget" style={styles.widget}>
      <div style={styles.header}>
        <h3 style={styles.title}>🧠 뇌 상태</h3>
        <span style={{ ...styles.status, color: statusColor }}>
          {statusText}
        </span>
      </div>

      <div style={styles.loadContainer}>
        <div style={styles.loadLabel}>
          <span>인지 부하</span>
          <strong>{loadPercentage}%</strong>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${loadPercentage}%`,
              background: statusColor
            }}
          />
        </div>
      </div>

      <div style={styles.metrics}>
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>세션 시간</span>
          <span style={styles.metricValue}>
            {Math.floor(metrics.sessionDuration / 60)}분
          </span>
        </div>
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>활동 빈도</span>
          <span style={styles.metricValue}>
            {metrics.activityFrequency}/10분
          </span>
        </div>
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>오답률</span>
          <span style={styles.metricValue}>
            {(metrics.errorRate * 100).toFixed(0)}%
          </span>
        </div>
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>평균 응답</span>
          <span style={styles.metricValue}>
            {metrics.avgResponseTime.toFixed(1)}초
          </span>
        </div>
      </div>

      {isCalmMode && (
        <div style={styles.calmModeIndicator}>
          🔵 안정 모드 활성화
        </div>
      )}
    </div>
  );
};

const styles = {
  widget: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    minWidth: '280px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  status: {
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  loadContainer: {
    marginBottom: '20px'
  },
  loadLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  progressTrack: {
    width: '100%',
    height: '12px',
    background: '#e0e0e0',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.5s ease, background 0.3s ease',
    borderRadius: '6px'
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '16px'
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  calmModeIndicator: {
    marginTop: '16px',
    padding: '12px',
    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e3a5f'
  }
};

export default BrainStatusWidget;
