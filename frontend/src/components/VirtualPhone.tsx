/**
 * VirtualPhone Component
 * 우측 하단에 표시되는 가상 스마트폰 화면 컴포넌트
 */

import React from 'react';
import './VirtualPhone.css';

interface VirtualPhoneProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: number;
  height?: number;
}

export const VirtualPhone: React.FC<VirtualPhoneProps> = ({
  children,
  position = 'bottom-right',
  width = 375,
  height = 667,
}) => {
  // 화면 비율 (iPhone 8 기준)
  const aspectRatio = 375 / 667;

  return (
    <div className={`virtual-phone ${position}`}>
      <div className="phone-frame" style={{ width: `${width}px` }}>
        {/* 스마트폰 노치/상단바 */}
        <div className="phone-notch">
          <div className="notch-speaker"></div>
          <div className="notch-camera"></div>
        </div>

        {/* 상태바 */}
        <div className="phone-status-bar">
          <div className="status-time">9:41</div>
          <div className="status-icons">
            <span className="status-signal">📶</span>
            <span className="status-wifi">📡</span>
            <span className="status-battery">🔋</span>
          </div>
        </div>

        {/* 메인 화면 */}
        <div
          className="phone-screen"
          style={{
            height: `${width / aspectRatio}px`,
          }}
        >
          <div className="phone-content">{children}</div>
        </div>

        {/* 홈 버튼/제스처 바 */}
        <div className="phone-home-indicator"></div>
      </div>
    </div>
  );
};

export default VirtualPhone;
