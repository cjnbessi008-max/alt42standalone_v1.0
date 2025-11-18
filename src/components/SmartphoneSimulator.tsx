import React, { useState, useEffect } from 'react';
import '../styles/Smartphone.css';

interface SmartphoneSimulatorProps {
  children: React.ReactNode;
  lmsConnected?: boolean;
}

/**
 * Smartphone Simulator Component
 * 우측 하단에 가상 스마트폰 화면 시뮬레이터
 */
const SmartphoneSimulator: React.FC<SmartphoneSimulatorProps> = ({
  children,
  lmsConnected = false
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // 현재 시간 업데이트
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000); // 1분마다 업데이트
    return () => clearInterval(timer);
  }, []);

  if (isMinimized) {
    return (
      <div
        className="smartphone-simulator minimized"
        onClick={() => setIsMinimized(false)}
        role="button"
        tabIndex={0}
        aria-label="스마트폰 시뮬레이터 열기"
      >
        <div className="minimized-button">📱</div>
      </div>
    );
  }

  return (
    <div className="smartphone-simulator">
      {/* 스마트폰 헤더 */}
      <div className="smartphone-header">
        <div className="smartphone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
          <div className="camera"></div>
        </div>
      </div>

      {/* 제어 버튼 */}
      <div className="smartphone-controls">
        <button
          className="control-button"
          onClick={() => setIsMinimized(true)}
          aria-label="최소화"
          title="최소화"
        >
          −
        </button>
      </div>

      {/* 스마트폰 화면 */}
      <div className="smartphone-screen">
        {/* 상태바 */}
        <div className="status-bar">
          <div className="time">{currentTime}</div>
          <div className="battery">
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* 앱 콘텐츠 */}
        <div className="app-content">
          {children}
        </div>

        {/* LMS 연결 상태 */}
        <div className="lms-status">
          <div className={`status-dot ${lmsConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{lmsConnected ? 'LMS 연결됨' : 'LMS 연결 안됨'}</span>
        </div>
      </div>
    </div>
  );
};

export default SmartphoneSimulator;
