/**
 * 가상 스마트폰 디스플레이 컴포넌트
 */

import React from 'react';
import './VirtualPhone.css';

interface VirtualPhoneProps {
  children: React.ReactNode;
}

export const VirtualPhone: React.FC<VirtualPhoneProps> = ({ children }) => {
  return (
    <div className="virtual-phone-container">
      <div className="phone-frame">
        {/* 상단 노치 */}
        <div className="phone-notch"></div>

        {/* 화면 */}
        <div className="phone-screen">
          {/* 상태바 */}
          <div className="status-bar">
            <span className="time">9:41</span>
            <div className="status-icons">
              <span className="signal">📶</span>
              <span className="wifi">📡</span>
              <span className="battery">🔋</span>
            </div>
          </div>

          {/* 앱 헤더 */}
          <div className="app-header">
            <h1>Core Integral</h1>
            <p className="subtitle">적분 핵심 규칙 학습</p>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="app-content">
            {children}
          </div>
        </div>

        {/* 홈 버튼 영역 */}
        <div className="phone-home-indicator"></div>
      </div>
    </div>
  );
};
