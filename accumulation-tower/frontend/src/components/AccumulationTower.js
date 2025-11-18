import React, { useState, useEffect } from 'react';
import '../styles/AccumulationTower.css';

/**
 * AccumulationTower 컴포넌트
 * 학습 진도를 타워 형태로 시각화
 *
 * @param {object} props
 * @param {object} props.towerData - 타워 데이터 (layers, totalScore 등)
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {string} props.error - 에러 메시지
 * @param {function} props.onRefresh - 새로고침 콜백
 */
const AccumulationTower = ({ towerData, isLoading, error, onRefresh }) => {
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * 새로고침 처리
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  /**
   * 레이어 클릭 처리
   */
  const handleLayerClick = (layer) => {
    setSelectedLayer(selectedLayer?.id === layer.id ? null : layer);
  };

  /**
   * 로딩 상태
   */
  if (isLoading && !towerData) {
    return (
      <div className="tower-container">
        <div className="tower-loading">
          <div className="tower-loading-spinner" />
          <div className="tower-loading-text">데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  /**
   * 에러 상태
   */
  if (error) {
    return (
      <div className="tower-container">
        <div className="tower-error">
          <div className="tower-error-icon">⚠️</div>
          <div className="tower-error-text">데이터를 불러올 수 없습니다</div>
          <div className="tower-error-subtext">{error}</div>
          <button className="tower-error-retry" onClick={handleRefresh}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { layers = [], totalScore = 0, totalPercentage = 0 } = towerData || {};

  return (
    <div className="tower-container">
      {/* 헤더 */}
      <div className="tower-header">
        <div className="tower-title">🏗️ 학습 타워</div>
        <div className="tower-subtitle">문제를 풀면 타워가 쌓입니다!</div>
      </div>

      {/* 점수 표시 */}
      <div className="tower-score-display">
        <div className="tower-total-score">
          {totalScore.toFixed(1)} <span style={{ fontSize: '18px' }}>점</span>
        </div>
        <div className="tower-percentage">
          달성률: {totalPercentage.toFixed(1)}%
        </div>
        <div className="tower-progress-bar">
          <div
            className="tower-progress-fill"
            style={{ width: `${Math.min(100, totalPercentage)}%` }}
          />
        </div>
      </div>

      {/* 새로고침 버튼 */}
      <button
        className={`tower-refresh-btn ${isRefreshing ? 'rotating' : ''}`}
        onClick={handleRefresh}
        title="새로고침"
      >
        <span className="tower-refresh-icon">🔄</span>
      </button>

      {/* 타워 시각화 */}
      <div className="tower-visualization">
        {layers.length === 0 ? (
          // 빈 상태
          <div className="tower-empty-state">
            <div className="tower-empty-icon">🏗️</div>
            <div className="tower-empty-text">아직 쌓인 타워가 없습니다</div>
            <div className="tower-empty-subtext">문제를 풀어서 타워를 쌓아보세요!</div>
          </div>
        ) : (
          // 타워 레이어
          <>
            <div className="tower-layers">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className="tower-layer"
                  style={{
                    height: `${layer.height}px`,
                    background: layer.color,
                    border: selectedLayer?.id === layer.id
                      ? '3px solid #FFD700'
                      : 'none'
                  }}
                  onClick={() => handleLayerClick(layer)}
                >
                  <div className="tower-layer-content">
                    <div className="tower-layer-name">{layer.name}</div>
                    <div className="tower-layer-score">
                      {layer.score}/{layer.maxScore}
                    </div>
                  </div>

                  {/* 툴팁 */}
                  <div className="tower-layer-tooltip">
                    <div><strong>{layer.name}</strong></div>
                    <div>점수: {layer.score} / {layer.maxScore}</div>
                    <div>달성률: {layer.percentage.toFixed(1)}%</div>
                    <div>높이: {layer.height}px</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 바닥 */}
            <div className="tower-ground" />
          </>
        )}
      </div>

      {/* 선택된 레이어 상세 정보 */}
      {selectedLayer && (
        <div className="tower-layer-details" style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'white',
          padding: '15px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 20
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            📊 {selectedLayer.name}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>점수: {selectedLayer.score} / {selectedLayer.maxScore}</div>
            <div>달성률: {selectedLayer.percentage.toFixed(1)}%</div>
            <div>레이어 높이: {selectedLayer.height}px</div>
          </div>
          <button
            onClick={() => setSelectedLayer(null)}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
};

export default AccumulationTower;
