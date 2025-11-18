import React, { ReactNode } from 'react';
import './SmartphoneFrame.css';

interface SmartphoneFrameProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

/**
 * 가상 스마트폰 화면 프레임 컴포넌트
 * 우측 하단에 표시되는 스마트폰 시뮬레이터
 */
export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
}) => {
  return (
    <div className={`smartphone-container ${position}`}>
      <div className="smartphone-frame">
        {/* 노치 (상단 카메라/센서 영역) */}
        <div className="smartphone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* 스크린 영역 */}
        <div className="smartphone-screen">
          {/* 상단 상태바 */}
          <div className="status-bar">
            <div className="status-time">9:41</div>
            <div className="status-icons">
              <span className="status-signal">📶</span>
              <span className="status-wifi">📡</span>
              <span className="status-battery">🔋</span>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className="smartphone-content">{children}</div>

          {/* 하단 홈 인디케이터 */}
          <div className="home-indicator"></div>
        </div>

        {/* 전원 버튼 */}
        <div className="power-button"></div>

        {/* 볼륨 버튼 */}
        <div className="volume-buttons">
          <div className="volume-up"></div>
          <div className="volume-down"></div>
        </div>
      </div>
    </div>
  );
};
