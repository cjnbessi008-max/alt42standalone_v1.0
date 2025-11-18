/**
 * Virtual Smartphone Component
 * 우측 하단에 가상 스마트폰 화면을 표시
 */

import React, { ReactNode } from 'react';
import '../styles/VirtualPhone.css';

interface VirtualPhoneProps {
  children: ReactNode;
}

const VirtualPhone: React.FC<VirtualPhoneProps> = ({ children }) => {
  return (
    <div className="virtual-phone">
      <div className="phone-frame">
        {/* Top notch */}
        <div className="phone-notch">
          <div className="notch-speaker"></div>
          <div className="notch-camera"></div>
        </div>

        {/* Screen */}
        <div className="phone-screen">
          <div className="status-bar">
            <span className="time">09:41</span>
            <div className="status-icons">
              <span className="signal">📶</span>
              <span className="wifi">📡</span>
              <span className="battery">🔋</span>
            </div>
          </div>

          <div className="screen-content">
            {children}
          </div>

          {/* Home indicator */}
          <div className="home-indicator"></div>
        </div>

        {/* Power button */}
        <div className="power-button"></div>

        {/* Volume buttons */}
        <div className="volume-up"></div>
        <div className="volume-down"></div>
      </div>
    </div>
  );
};

export default VirtualPhone;
