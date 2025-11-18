import React from 'react';
import './LogHeatDisplay.css';

/**
 * Log Heat 표시 컴포넌트
 *
 * 히트 데이터를 시각적으로 표현
 */
const LogHeatDisplay = ({ heatData, timeWindow = '1h' }) => {
  if (!heatData) {
    return (
      <div className="heat-display">
        <div className="heat-loading">
          <div className="loading-spinner"></div>
          <p>데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  const {
    colorTemperature,
    heatScore,
    changeRate,
    logCount,
    metadata
  } = heatData;

  // 변화율 표시 (증가/감소 화살표)
  const getChangeIcon = () => {
    if (changeRate > 50) return '📈';
    if (changeRate < 50) return '📉';
    return '➡️';
  };

  // 시간 윈도우 라벨
  const getTimeWindowLabel = (window) => {
    const labels = {
      '1h': '1시간',
      '6h': '6시간',
      '24h': '24시간',
      '7d': '7일',
      '30d': '30일'
    };
    return labels[window] || window;
  };

  return (
    <div className="heat-display">
      {/* 메인 히트 인디케이터 */}
      <div
        className="heat-main"
        style={{ backgroundColor: colorTemperature }}
      >
        <div className="heat-score-large">
          {Math.round(heatScore)}
        </div>
        <div className="heat-label">Heat Score</div>
      </div>

      {/* 상세 정보 */}
      <div className="heat-details">
        <div className="detail-card">
          <div className="detail-icon">📊</div>
          <div className="detail-content">
            <div className="detail-value">{logCount}</div>
            <div className="detail-label">로그 개수</div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-icon">{getChangeIcon()}</div>
          <div className="detail-content">
            <div className="detail-value">{Math.round(changeRate)}%</div>
            <div className="detail-label">변화율</div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-icon">⏱️</div>
          <div className="detail-content">
            <div className="detail-value">{getTimeWindowLabel(timeWindow)}</div>
            <div className="detail-label">시간 범위</div>
          </div>
        </div>

        <div className="detail-card full-width">
          <div className="detail-icon">🔥</div>
          <div className="detail-content">
            <div className="detail-value">{metadata?.heatLevel || 'N/A'}</div>
            <div className="detail-label">활동 레벨</div>
          </div>
        </div>
      </div>

      {/* 색 온도 스펙트럼 */}
      <div className="color-spectrum">
        <div className="spectrum-bar">
          <div className="spectrum-gradient"></div>
          <div
            className="spectrum-marker"
            style={{ left: `${changeRate}%` }}
          ></div>
        </div>
        <div className="spectrum-labels">
          <span>낮음</span>
          <span>보통</span>
          <span>높음</span>
        </div>
      </div>

      {/* 이벤트 통계 */}
      {metadata?.eventStats && Object.keys(metadata.eventStats).length > 0 && (
        <div className="event-stats">
          <h3 className="stats-title">주요 활동</h3>
          <div className="stats-list">
            {Object.entries(metadata.eventStats)
              .slice(0, 5)
              .map(([event, count]) => (
                <div key={event} className="stats-item">
                  <div className="stats-event">{event}</div>
                  <div className="stats-count">{count}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 이전 윈도우 비교 */}
      {metadata?.previousCount !== undefined && (
        <div className="comparison">
          <div className="comparison-label">이전 기간 대비</div>
          <div className="comparison-values">
            <span className="prev-value">{metadata.previousCount}</span>
            <span className="arrow">→</span>
            <span className="current-value">{logCount}</span>
          </div>
        </div>
      )}

      {/* 마지막 업데이트 시각 */}
      <div className="last-update">
        마지막 업데이트: {new Date().toLocaleString('ko-KR')}
      </div>
    </div>
  );
};

export default LogHeatDisplay;
