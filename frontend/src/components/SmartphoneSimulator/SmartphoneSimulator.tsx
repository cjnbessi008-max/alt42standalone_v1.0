/**
 * 스마트폰 시뮬레이터 컴포넌트
 * 우측 하단에 고정되어 가상 스마트폰 화면을 표시합니다.
 */

import React from 'react';
import './SmartphoneSimulator.css';

interface SmartphoneSimulatorProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const SmartphoneSimulator: React.FC<SmartphoneSimulatorProps> = ({
  children,
  position = 'bottom-right'
}) => {
  return (
    <div className={`smartphone-simulator ${position}`}>
      {/* 스마트폰 외곽 프레임 */}
      <div className="smartphone-frame">
        {/* 상단 노치 */}
        <div className="smartphone-notch">
          <div className="notch-camera"></div>
          <div className="notch-speaker"></div>
        </div>

        {/* 스크린 영역 */}
        <div className="smartphone-screen">
          {children}
        </div>

        {/* 하단 홈 인디케이터 */}
        <div className="smartphone-home-indicator"></div>
      </div>
    </div>
  );
};
