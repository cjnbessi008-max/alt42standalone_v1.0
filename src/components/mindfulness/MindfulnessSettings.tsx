import React from 'react';
import { MindfulnessConfig } from './useMindfulness';
import './MindfulnessSettings.css';

export interface MindfulnessSettingsProps {
  config: MindfulnessConfig;
  onConfigChange: (config: Partial<MindfulnessConfig>) => void;
  onReset?: () => void;
}

export const MindfulnessSettings: React.FC<MindfulnessSettingsProps> = ({
  config,
  onConfigChange,
  onReset,
}) => {
  return (
    <div className="mindfulness-settings">
      <div className="settings-header">
        <h3>마인드풀니스 설정</h3>
        {onReset && (
          <button className="reset-button" onClick={onReset}>
            기본값으로 재설정
          </button>
        )}
      </div>

      <div className="settings-section">
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onConfigChange({ enabled: e.target.checked })}
            />
            <span>마인드풀니스 루틴 활성화</span>
          </label>
          <p className="setting-description">
            문제 전환 시 마인드풀니스 루틴을 표시합니다
          </p>
        </div>

        {config.enabled && (
          <>
            <div className="setting-item">
              <label className="setting-label-text">루틴 유형</label>
              <div className="routine-type-selector">
                <button
                  className={`routine-type-button ${config.routineType === 'breathing' ? 'active' : ''}`}
                  onClick={() => onConfigChange({ routineType: 'breathing' })}
                >
                  <span className="routine-icon">🫁</span>
                  <span>호흡 운동</span>
                </button>
                <button
                  className={`routine-type-button ${config.routineType === 'stretch' ? 'active' : ''}`}
                  onClick={() => onConfigChange({ routineType: 'stretch' })}
                >
                  <span className="routine-icon">🧘</span>
                  <span>스트레칭</span>
                </button>
                <button
                  className={`routine-type-button ${config.routineType === 'pause' ? 'active' : ''}`}
                  onClick={() => onConfigChange({ routineType: 'pause' })}
                >
                  <span className="routine-icon">☕</span>
                  <span>휴식</span>
                </button>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label-text">
                지속 시간: {config.duration}초
              </label>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={config.duration}
                onChange={(e) => onConfigChange({ duration: parseInt(e.target.value) })}
                className="duration-slider"
              />
              <div className="slider-labels">
                <span>10초</span>
                <span>120초</span>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label-text">
                표시 빈도: {config.frequency === 1 ? '매 문제마다' : `${config.frequency}문제마다`}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={config.frequency}
                onChange={(e) => onConfigChange({ frequency: parseInt(e.target.value) })}
                className="frequency-slider"
              />
              <div className="slider-labels">
                <span>매 문제</span>
                <span>10문제마다</span>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={config.allowSkip}
                  onChange={(e) => onConfigChange({ allowSkip: e.target.checked })}
                />
                <span>건너뛰기 허용</span>
              </label>
              <p className="setting-description">
                학습자가 마인드풀니스 루틴을 건너뛸 수 있습니다
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={config.showTimer}
                  onChange={(e) => onConfigChange({ showTimer: e.target.checked })}
                />
                <span>타이머 표시</span>
              </label>
              <p className="setting-description">
                남은 시간을 표시합니다
              </p>
            </div>
          </>
        )}
      </div>

      <div className="settings-info">
        <h4>마인드풀니스 루틴이란?</h4>
        <p>
          마인드풀니스 루틴은 학습 중 집중력을 유지하고 스트레스를 줄이는 데 도움을 줍니다.
          문제를 풀면서 짧은 휴식을 취하면 학습 효율이 향상되고 더 나은 결과를 얻을 수 있습니다.
        </p>
        <ul>
          <li><strong>호흡 운동:</strong> 깊은 호흡으로 마음을 진정시킵니다</li>
          <li><strong>스트레칭:</strong> 간단한 스트레칭으로 몸의 긴장을 풉니다</li>
          <li><strong>휴식:</strong> 잠시 눈을 감고 휴식을 취합니다</li>
        </ul>
      </div>
    </div>
  );
};

export default MindfulnessSettings;
