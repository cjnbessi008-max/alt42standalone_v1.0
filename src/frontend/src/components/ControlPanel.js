import React from 'react';
import '../styles/ControlPanel.css';

const ControlPanel = ({
  isActive,
  expansionMode,
  onModeChange,
  onStart,
  onStop,
  onReset,
  config
}) => {
  return (
    <div className="control-panel">
      <div className="panel-header">
        <h1>🌅 Expansion Mode</h1>
        <p className="subtitle">해가 넓어질수록 화면이 확장됩니다</p>
      </div>

      <div className="panel-content">
        {/* Mode Selection */}
        <div className="control-group">
          <label className="control-label">확장 모드 선택</label>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${expansionMode === 'time-based' ? 'active' : ''}`}
              onClick={() => !isActive && onModeChange('time-based')}
              disabled={isActive}
            >
              ⏱️ 시간 기반
            </button>
            <button
              className={`mode-btn ${expansionMode === 'progress-based' ? 'active' : ''}`}
              onClick={() => !isActive && onModeChange('progress-based')}
              disabled={isActive}
            >
              📊 진행도 기반
            </button>
            <button
              className={`mode-btn ${expansionMode === 'hybrid' ? 'active' : ''}`}
              onClick={() => !isActive && onModeChange('hybrid')}
              disabled={isActive}
            >
              🔄 하이브리드
            </button>
          </div>
        </div>

        {/* Mode Description */}
        <div className="mode-description">
          {expansionMode === 'time-based' && (
            <p>📝 시간이 지날수록 화면이 자동으로 확장됩니다 ({config ? Math.round(config.duration / 60000) : 5}분)</p>
          )}
          {expansionMode === 'progress-based' && (
            <p>📝 문제를 풀수록 화면이 확장됩니다 (정답 비율)</p>
          )}
          {expansionMode === 'hybrid' && (
            <p>📝 시간과 진행도를 결합하여 화면이 확장됩니다</p>
          )}
        </div>

        {/* Configuration Display */}
        {config && (
          <div className="config-display">
            <div className="config-item">
              <span className="config-label">시작 크기:</span>
              <span className="config-value">{config.startSize}px</span>
            </div>
            <div className="config-item">
              <span className="config-label">최대 크기:</span>
              <span className="config-value">{config.endSize}px</span>
            </div>
            <div className="config-item">
              <span className="config-label">확장 시간:</span>
              <span className="config-value">{Math.round(config.duration / 60000)}분</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="control-buttons">
          {!isActive ? (
            <button className="btn btn-start" onClick={onStart}>
              ▶️ 시작
            </button>
          ) : (
            <button className="btn btn-stop" onClick={onStop}>
              ⏸️ 정지
            </button>
          )}
          <button className="btn btn-reset" onClick={onReset}>
            🔄 리셋
          </button>
        </div>

        {/* Information */}
        <div className="info-box">
          <h3>ℹ️ 사용 방법</h3>
          <ol>
            <li>확장 모드를 선택하세요</li>
            <li>시작 버튼을 클릭하세요</li>
            <li>우측 하단의 스마트폰 화면에서 문제를 풀어보세요</li>
            <li>시간이 지나거나 문제를 풀면 화면이 점점 커집니다</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
