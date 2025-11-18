import React from 'react';
import type { SmartphoneFrameProps } from '@types/index';
import './SmartphoneFrame.css';

/**
 * 스마트폰 프레임 컴포넌트
 * 우측 하단에 가상 스마트폰 화면 표시
 */
const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  position = 'bottom-right',
  size = 'medium',
  children,
}) => {
  return (
    <div className={`smartphone-frame ${position} ${size}`}>
      {/* 스마트폰 외부 프레임 */}
      <div className="smartphone-body">
        {/* 상단 노치 */}
        <div className="smartphone-notch"></div>

        {/* 화면 영역 */}
        <div className="smartphone-screen">
          {/* 상태 바 */}
          <div className="status-bar">
            <span className="time">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="status-icons">
              <span className="signal">📶</span>
              <span className="wifi">📡</span>
              <span className="battery">🔋</span>
            </div>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="smartphone-content">
            {children}
          </div>
        </div>

        {/* 하단 홈 버튼 영역 (제스처 바) */}
        <div className="smartphone-gesture-bar"></div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
