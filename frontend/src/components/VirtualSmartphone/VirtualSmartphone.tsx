/**
 * 가상 스마트폰 컴포넌트
 * 우측 하단에 표시되는 스마트폰 화면 시뮬레이터
 */

import React, { ReactNode } from 'react';
import './VirtualSmartphone.css';

interface VirtualSmartphoneProps {
  children: ReactNode;
  isWarm?: boolean;
}

export const VirtualSmartphone: React.FC<VirtualSmartphoneProps> = ({
  children,
  isWarm = false,
}) => {
  return (
    <div className="virtual-smartphone-container">
      <div className={`smartphone-frame ${isWarm ? 'warm-mode' : ''}`}>
        {/* 스마트폰 상단 노치 */}
        <div className="smartphone-notch">
          <div className="notch-speaker"></div>
          <div className="notch-camera"></div>
        </div>

        {/* 스마트폰 화면 */}
        <div className="smartphone-screen">
          <div className={`screen-content ${isWarm ? 'warm-glow' : ''}`}>
            {children}
          </div>
        </div>

        {/* 스마트폰 하단 홈 버튼 영역 */}
        <div className="smartphone-home-indicator"></div>
      </div>

      {/* 스마트폰 측면 버튼 */}
      <div className="smartphone-buttons">
        <div className="power-button"></div>
        <div className="volume-buttons">
          <div className="volume-up"></div>
          <div className="volume-down"></div>
        </div>
      </div>
    </div>
  );
};
