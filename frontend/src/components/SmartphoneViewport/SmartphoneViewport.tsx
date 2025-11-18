import React from 'react';
import './SmartphoneViewport.css';

interface SmartphoneViewportProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'center';
}

const SmartphoneViewport: React.FC<SmartphoneViewportProps> = ({
  children,
  position = 'bottom-right'
}) => {
  return (
    <div className={`smartphone-viewport-wrapper ${position}`}>
      <div className="smartphone-device">
        {/* 스마트폰 프레임 */}
        <div className="smartphone-frame">
          {/* 상단 노치 */}
          <div className="smartphone-notch">
            <div className="camera"></div>
            <div className="speaker"></div>
          </div>

          {/* 화면 영역 */}
          <div className="smartphone-screen">
            {children}
          </div>

          {/* 하단 홈 버튼 영역 */}
          <div className="smartphone-home-indicator"></div>
        </div>

        {/* 전원 버튼 */}
        <div className="power-button"></div>

        {/* 볼륨 버튼 */}
        <div className="volume-button up"></div>
        <div className="volume-button down"></div>
      </div>
    </div>
  );
};

export default SmartphoneViewport;
