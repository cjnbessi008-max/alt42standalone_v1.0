import React, { useState } from 'react';
import './Settings.css';
import {
  isNotificationEnabled,
  setNotificationEnabled,
  isVibrationEnabled,
  setVibrationEnabled,
  isSoundEnabled,
  setSoundEnabled
} from '../utils/storage';

function Settings({ theme, onClose }) {
  const [notificationOn, setNotificationOn] = useState(isNotificationEnabled());
  const [vibrationOn, setVibrationOn] = useState(isVibrationEnabled());
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleNotificationToggle = () => {
    const newValue = !notificationOn;
    setNotificationOn(newValue);
    setNotificationEnabled(newValue);
  };

  const handleVibrationToggle = () => {
    const newValue = !vibrationOn;
    setVibrationOn(newValue);
    setVibrationEnabled(newValue);
  };

  const handleSoundToggle = () => {
    const newValue = !soundOn;
    setSoundOn(newValue);
    setSoundEnabled(newValue);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-modal card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.cardBackground,
          color: theme.textColor
        }}
      >
        <div className="settings-header">
          <h2>⚙️ 설정</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-content">
          {/* 알림 설정 */}
          <div className="settings-section">
            <h3>🔔 알림 설정</h3>

            <div className="setting-item">
              <label className="setting-label">
                <span>알림 활성화</span>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={notificationOn}
                  onChange={handleNotificationToggle}
                />
              </label>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span>진동</span>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={vibrationOn}
                  onChange={handleVibrationToggle}
                  disabled={!notificationOn}
                />
              </label>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span>소리</span>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={soundOn}
                  onChange={handleSoundToggle}
                  disabled={!notificationOn}
                />
              </label>
            </div>
          </div>

          {/* 정보 */}
          <div className="settings-section">
            <h3>ℹ️ 앱 정보</h3>
            <p style={{ opacity: 0.7, fontSize: '14px', lineHeight: 1.6 }}>
              LMS 시간표 기반 재미있는 수업 알림 웹앱<br />
              버전: 1.0.0<br />
              수업 1시간 전에 알림을 받아보세요!
            </p>
          </div>

          {/* 도움말 */}
          <div className="settings-section">
            <h3>💡 도움말</h3>
            <ul style={{ opacity: 0.7, fontSize: '14px', lineHeight: 1.8 }}>
              <li>샘플 데이터를 로드하여 앱을 체험해보세요</li>
              <li>알림 테스트 버튼으로 알림을 미리 확인할 수 있습니다</li>
              <li>알림 모드와 테마를 자유롭게 변경할 수 있습니다</li>
              <li>브라우저 알림 권한을 허용해주세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
