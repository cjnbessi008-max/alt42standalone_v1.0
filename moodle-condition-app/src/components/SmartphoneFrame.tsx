import React, { type ReactNode } from 'react';
import './SmartphoneFrame.css';

export interface SmartphoneFrameProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

/**
 * SmartphoneFrame Component
 * 우측 하단에 가상 스마트폰 화면 프레임을 표시
 */
export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
}) => {
  return (
    <div className={`smartphone-container ${position}`}>
      <div className="smartphone-frame">
        {/* Phone Hardware */}
        <div className="phone-notch"></div>
        <div className="phone-speaker"></div>

        {/* Screen Content */}
        <div className="phone-screen">
          <div className="phone-status-bar">
            <span className="status-time">12:34</span>
            <div className="status-icons">
              <span className="status-icon">📶</span>
              <span className="status-icon">📡</span>
              <span className="status-icon">🔋</span>
            </div>
          </div>

          <div className="phone-content">
            {children}
          </div>
        </div>

        {/* Home Button */}
        <div className="phone-home-button"></div>
      </div>
    </div>
  );
};
